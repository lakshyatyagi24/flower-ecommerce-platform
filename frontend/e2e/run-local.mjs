#!/usr/bin/env node
/**
 * One-command local e2e: database -> migrate + seed -> backend -> storefront -> Playwright -> clean up.
 *
 *   npm run e2e:local                       whole suite
 *   npm run e2e:local -- e2e/forgot-reset.spec.ts --project=chromium
 *   npm run e2e:local -- --skip-build       reuse existing backend dist/ and frontend .next/
 *
 * Everything this script starts it stops again (also on failure, Ctrl+C and crashes), and ONLY what it started:
 * it never matches processes by name or command line. A database that was already running is reused and left
 * running. Ports 3000 and 3001 must be free: a server you started yourself is never adopted, because the suite
 * writes data and must be sure which stack it is talking to.
 *
 * Environment (all optional):
 *   E2E_DATABASE_URL    default postgresql://postgres:pw@localhost:5433/flower (LOCAL host only; port 5432 is refused
 *                       unless E2E_ALLOW_DB_PORT=1, so the usual dev database is never touched by accident)
 *   E2E_PG_EMBED_DIR    folder with a start.mjs that boots an embedded Postgres; started if the DB port is closed
 *   E2E_PG_DATA_DIR     that Postgres' data directory (default <E2E_PG_EMBED_DIR>/pgdata), used for a graceful stop
 *   E2E_BACKEND_DIR     default ../../flower-backend (relative to the frontend folder)
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   admin used by the specs (defaults = the local seed admin)
 *   E2E_JWT_SECRET      default: random per run
 */
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import net from 'node:net';
import { dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND_DIR = resolve(process.env.E2E_BACKEND_DIR || join(FRONTEND_DIR, '../../flower-backend'));
const LOG_DIR = join(FRONTEND_DIR, 'e2e', '.run');
const WEB_PORT = 3000;
const API_PORT = 3001;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const API_URL = `http://localhost:${API_PORT}`;
const IS_WIN = process.platform === 'win32';
const LOOPBACKS = ['127.0.0.1', '::1'];

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const playwrightArgs = args.filter((a) => a !== '--skip-build');

const DATABASE_URL = process.env.E2E_DATABASE_URL || 'postgresql://postgres:pw@localhost:5433/flower';
const dbUrl = new URL(DATABASE_URL);
const dbPort = Number(dbUrl.port || 5432);
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@flowershop.local';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

/** Children we started (and therefore must stop), newest last. */
const started = [];
let startedDatabase = false;
let cleaning = false;

const log = (msg) => console.log(`[e2e:local] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(msg) {
  throw new Error(msg);
}

// ---- port probing ------------------------------------------------------------------------------------------------

function portOpenOn(port, host) {
  return new Promise((done) => {
    const socket = net.connect({ port, host });
    socket.once('connect', () => (socket.destroy(), done(true)));
    socket.once('error', () => done(false));
    socket.setTimeout(1500, () => (socket.destroy(), done(false)));
  });
}

/** Open on IPv4 loopback, IPv6 loopback, or the host named in a URL (a server may bind any of them). */
async function portOpen(port, extraHost) {
  const hosts = new Set([...LOOPBACKS, ...(extraHost ? [extraHost.replace(/^\[|\]$/g, '')] : [])]);
  for (const host of hosts) if (await portOpenOn(port, host)) return true;
  return false;
}

async function waitFor(label, check, timeoutMs, child) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) fail(`${label}: process exited early (code ${child.exitCode}); see ${child.logFile}`);
    try {
      if (await check()) return;
    } catch {
      /* not ready yet */
    }
    await sleep(500);
  }
  fail(`${label}: not ready after ${Math.round(timeoutMs / 1000)}s${child ? `; see ${child.logFile}` : ''}`);
}

const httpOk = async (url) => (await fetch(url)).ok;

// ---- process trees: only descendants of children THIS script spawned --------------------------------------------

/** Windows: [pid, ppid] pairs for every process. Parent ids are NOT cleared when a parent dies, so orphans stay linkable. */
function winProcessTable() {
  const ps = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', 'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId),$($_.ParentProcessId)" }'],
    { encoding: 'utf8', windowsHide: true },
  );
  return (ps.stdout || '')
    .split(/\r?\n/)
    .map((l) => l.trim().split(',').map(Number))
    .filter((p) => p.length === 2 && p.every(Number.isFinite));
}

/** pid plus every process reachable from it through ParentProcessId links (stable even if intermediate parents died). */
function winTree(rootPid, table = winProcessTable()) {
  const known = new Set([rootPid]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const [pid, ppid] of table) {
      if (known.has(ppid) && !known.has(pid)) (known.add(pid), (grew = true));
    }
  }
  return known;
}

/** Records the tree while it is alive, so a later sweep can still find workers forked after the first kill. */
function snapshotTree(child) {
  if (!IS_WIN || child.pid === undefined) return;
  child.knownPids = new Set([...(child.knownPids ?? []), ...winTree(child.pid)]);
}

/** Forceful, synchronous stop of the child's own tree (safe to call from exit/signal handlers). */
function forceKillTree(child) {
  if (!child || child.pid === undefined) return;
  try {
    if (IS_WIN) {
      snapshotTree(child);
      for (let round = 0; round < 4; round++) {
        const targets = [...winTree(child.pid), ...(child.knownPids ?? [])];
        // newest-first so children go before parents
        for (const pid of targets.sort((a, b) => b - a)) spawnSync('taskkill', ['/PID', String(pid), '/F'], { stdio: 'ignore' });
        const left = winProcessTable().filter(([pid, ppid]) => child.knownPids.has(pid) || child.knownPids.has(ppid) || ppid === child.pid);
        if (left.length === 0) break;
        for (const [pid] of left) child.knownPids.add(pid);
      }
    } else {
      process.kill(-child.pid, 'SIGKILL');
    }
  } catch {
    /* already gone */
  }
}

/** Polite stop with escalation: SIGTERM (POSIX) / plain taskkill (Windows), wait, then force. */
async function stopTree(child, graceMs = 8000) {
  if (!child || child.pid === undefined) return;
  snapshotTree(child);
  if (!IS_WIN) {
    // POSIX: ask the whole process group to terminate, give it time, escalate below.
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
    const deadline = Date.now() + graceMs;
    while (Date.now() < deadline && child.exitCode === null) await sleep(200);
  }
  // Windows has no polite signal for these windowless processes (the database already had pg_ctl): force the tree.
  forceKillTree(child); // also catches children that ignored SIGTERM and workers forked meanwhile
}

/** Starts a long-running child with output going to a log file; registered for cleanup. */
function startService(name, command, cmdArgs, { cwd, env }) {
  mkdirSync(LOG_DIR, { recursive: true });
  const logFile = join(LOG_DIR, `${name}.log`);
  const fd = openSync(logFile, 'w');
  const child = spawn(command, cmdArgs, { cwd, env, stdio: ['ignore', fd, fd], detached: !IS_WIN, windowsHide: true });
  closeSync(fd);
  child.logFile = logFile;
  child.serviceName = name;
  started.push(child);
  log(`started ${name} (pid ${child.pid}); log: ${logFile}`);
  return child;
}

/** Runs a short command to completion, streaming its output. */
function runStep(label, command, cmdArgs, { cwd, env }) {
  log(label);
  const res = spawnSync(command, cmdArgs, { cwd, env, stdio: 'inherit', windowsHide: true });
  if (res.status !== 0) fail(`${label} failed (exit ${res.status})`);
}

// ---- embedded Postgres: graceful stop first ----------------------------------------------------------------------

function findPgCtl(embedDir) {
  const scopeDir = join(embedDir, 'node_modules', '@embedded-postgres');
  if (!existsSync(scopeDir)) return null;
  for (const pkg of readdirSync(scopeDir)) {
    const bin = join(scopeDir, pkg, 'native', 'bin', IS_WIN ? 'pg_ctl.exe' : 'pg_ctl');
    if (existsSync(bin)) return bin;
  }
  return null;
}

/** `pg_ctl stop -m fast` against the data dir of the Postgres we started. Returns true if it reported success. */
function gracefulPgStop() {
  const embedDir = process.env.E2E_PG_EMBED_DIR;
  if (!embedDir) return false;
  const dataDir = resolve(process.env.E2E_PG_DATA_DIR || join(embedDir, 'pgdata'));
  const pgCtl = findPgCtl(resolve(embedDir));
  if (!pgCtl || !existsSync(join(dataDir, 'postmaster.pid'))) return false;
  log('stopping postgres gracefully (pg_ctl stop -m fast)');
  const res = spawnSync(pgCtl, ['stop', '-D', dataDir, '-m', 'fast', '-t', '20'], { stdio: 'ignore', windowsHide: true });
  return res.status === 0;
}

// ---- cleanup -----------------------------------------------------------------------------------------------------

/** Synchronous last resort (exit / signal handlers): force-stop everything we started. */
function cleanupNow() {
  if (cleaning) return;
  cleaning = true;
  for (const child of [...started].reverse()) {
    log(`stopping ${child.serviceName} (pid ${child.pid})`);
    forceKillTree(child);
  }
}

/** Normal path: stop services politely (database gracefully), wait for ports to close. */
async function shutdown() {
  if (cleaning) return;
  cleaning = true;
  for (const child of [...started].reverse()) {
    log(`stopping ${child.serviceName} (pid ${child.pid})`);
    if (child.serviceName === 'postgres') gracefulPgStop();
    await stopTree(child);
  }
  const ports = [WEB_PORT, API_PORT, ...(startedDatabase ? [dbPort] : [])];
  for (const port of ports) {
    for (let i = 0; i < 40 && (await portOpen(port, port === dbPort ? dbUrl.hostname : undefined)); i++) await sleep(250);
    if (await portOpen(port, port === dbPort ? dbUrl.hostname : undefined)) log(`WARNING: port ${port} is still open after shutdown`);
  }
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    cleanupNow();
    process.exit(130);
  });
}
process.on('exit', cleanupNow);

// ---- main --------------------------------------------------------------------------------------------------------

function validateEmbedDir(dir) {
  const abs = resolve(dir);
  if (parse(abs).root === abs) fail(`E2E_PG_EMBED_DIR must not be a drive/filesystem root (${abs})`);
  if (abs === resolve(homedir())) fail(`E2E_PG_EMBED_DIR must not be your home folder (${abs})`);
  if (!existsSync(join(abs, 'start.mjs'))) {
    fail(`E2E_PG_EMBED_DIR (${abs}) has no start.mjs that boots an embedded Postgres (see e2e/README.md)`);
  }
  return abs;
}

async function main() {
  // ---- safety: local database only, not the usual dev port, ports free, sources present -------------------------
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(dbUrl.hostname)) {
    fail(`E2E_DATABASE_URL host "${dbUrl.hostname}" is not local. The suite writes data; refusing.`);
  }
  if (dbPort === 5432 && process.env.E2E_ALLOW_DB_PORT !== '1') {
    fail(
      'E2E_DATABASE_URL points at port 5432, the usual development database port. The suite creates and cancels ' +
        'orders and edits settings; set E2E_ALLOW_DB_PORT=1 only if that database is really disposable.',
    );
  }
  if (!existsSync(join(BACKEND_DIR, 'package.json'))) fail(`Backend not found at ${BACKEND_DIR} (set E2E_BACKEND_DIR)`);
  for (const [port, what] of [[WEB_PORT, 'storefront'], [API_PORT, 'API']]) {
    if (await portOpen(port, 'localhost')) {
      fail(`Port ${port} (${what}) is already in use. Stop that process first; this script only manages servers it starts.`);
    }
  }

  // ---- database ----------------------------------------------------------------------------------------------
  if (await portOpen(dbPort, dbUrl.hostname)) {
    log(`database already listening on :${dbPort}; reusing it (will not be stopped)`);
  } else {
    const embedDir = process.env.E2E_PG_EMBED_DIR;
    if (!embedDir) {
      fail(
        `Nothing is listening on the database port :${dbPort}. Start Postgres there, or set E2E_PG_EMBED_DIR to a folder ` +
          `containing a start.mjs that boots an embedded Postgres (see e2e/README.md).`,
      );
    }
    const dir = validateEmbedDir(embedDir);
    startedDatabase = true;
    const pg = startService('postgres', process.execPath, ['start.mjs'], { cwd: dir, env: process.env });
    await waitFor('embedded Postgres', () => portOpen(dbPort, dbUrl.hostname), 90_000, pg);
  }

  // ---- backend: build, migrate, seed, start --------------------------------------------------------------------
  const jwtSecret = process.env.E2E_JWT_SECRET || randomBytes(32).toString('hex');
  const backendEnv = {
    ...process.env,
    NODE_ENV: 'test',
    ENABLE_TEST_ENDPOINTS: '1',
    JWT_SECRET: jwtSecret,
    DATABASE_URL,
    PORT: String(API_PORT),
    // No outbound integrations in the test stack. Empty strings (not deletes) so a developer's backend .env
    // cannot switch them back on: dotenv never overrides a variable that is already set.
    RESEND_API_KEY: '',
    RAZORPAY_KEY_ID: '',
    RAZORPAY_KEY_SECRET: '',
    RAZORPAY_WEBHOOK_SECRET: '',
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_API_KEY: '',
    CLOUDINARY_API_SECRET: '',
    SENTRY_DSN_API: '',
    SEED_ADMIN_EMAIL: ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: ADMIN_PASSWORD,
    CORS_ORIGINS: WEB_URL,
    PUBLIC_SITE_URL: WEB_URL,
  };
  const prismaCli = join(BACKEND_DIR, 'node_modules', 'prisma', 'build', 'index.js');
  const nestCli = join(BACKEND_DIR, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

  if (!skipBuild) runStep('building backend', process.execPath, [nestCli, 'build'], { cwd: BACKEND_DIR, env: backendEnv });
  const entry = ['dist/main.js', 'dist/src/main.js'].find((p) => existsSync(join(BACKEND_DIR, p)));
  if (!entry) fail('Backend build output not found (dist/main.js or dist/src/main.js). Run without --skip-build.');

  runStep('applying migrations', process.execPath, [prismaCli, 'migrate', 'deploy'], { cwd: BACKEND_DIR, env: backendEnv });
  runStep('seeding (idempotent)', process.execPath, ['prisma/seed.js'], { cwd: BACKEND_DIR, env: backendEnv });

  const api = startService('backend', process.execPath, [entry], { cwd: BACKEND_DIR, env: backendEnv });
  await waitFor('backend', () => httpOk(`${API_URL}/settings`), 90_000, api);

  // Prove the test-only route is really registered. Our handler answers 404 with a plain "Not Found" body; a route
  // that does not exist makes the framework answer 404 "Cannot GET ...". Both are 404, so the body decides.
  const probe = await fetch(`${API_URL}/auth/_test/last-reset-token?email=nobody@e2e.example.com`);
  const probeBody = await probe.text();
  if (probe.status !== 404) fail(`test endpoint probe returned ${probe.status}, expected 404`);
  if (/Cannot GET/i.test(probeBody)) {
    fail('test endpoint is NOT registered (framework 404 "Cannot GET"): the backend did not start with NODE_ENV=test ENABLE_TEST_ENDPOINTS=1');
  }

  // ---- storefront: build (needs the API up, it reads settings), start ------------------------------------------
  const webEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_BASE: API_URL,
    API_BASE_INTERNAL: API_URL,
    NEXT_TELEMETRY_DISABLED: '1',
    PORT: String(WEB_PORT),
  };
  const nextCli = join(FRONTEND_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!skipBuild) runStep('building storefront', process.execPath, [nextCli, 'build'], { cwd: FRONTEND_DIR, env: webEnv });
  else if (!existsSync(join(FRONTEND_DIR, '.next', 'BUILD_ID'))) fail('No storefront build in .next. Run without --skip-build.');
  const web = startService('storefront', process.execPath, [nextCli, 'start', '-p', String(WEB_PORT)], { cwd: FRONTEND_DIR, env: webEnv });
  await waitFor('storefront', () => httpOk(WEB_URL), 90_000, web);

  // ---- tests ---------------------------------------------------------------------------------------------------
  const pwCli = join(FRONTEND_DIR, 'node_modules', '@playwright', 'test', 'cli.js');
  const testEnv = {
    ...process.env,
    E2E_BASE_URL: WEB_URL,
    E2E_API_BASE: API_URL,
    E2E_ADMIN_EMAIL: ADMIN_EMAIL,
    E2E_ADMIN_PASSWORD: ADMIN_PASSWORD,
  };
  log(`running Playwright against ${WEB_URL} (API ${API_URL})`);
  const res = spawnSync(process.execPath, [pwCli, 'test', ...playwrightArgs], { cwd: FRONTEND_DIR, env: testEnv, stdio: 'inherit', windowsHide: true });
  return res.status ?? 1;
}

let exitCode = 1;
try {
  exitCode = await main();
} catch (err) {
  console.error(`\n[e2e:local] FAILED: ${err instanceof Error ? err.message : err}`);
  for (const child of started) {
    if (child.exitCode !== null && child.logFile && existsSync(child.logFile)) {
      const tail = readFileSync(child.logFile, 'utf8').split('\n').slice(-25).join('\n');
      console.error(`--- last lines of ${child.serviceName} log ---\n${tail}`);
    }
  }
  exitCode = 1;
} finally {
  await shutdown();
}
process.exit(exitCode);
