#!/usr/bin/env node
/**
 * One-command local e2e: database -> migrate + seed -> backend -> storefront -> Playwright -> clean up.
 *
 *   npm run e2e:local                       whole suite
 *   npm run e2e:local -- e2e/forgot-reset.spec.ts --project=chromium
 *   npm run e2e:local -- --skip-build       reuse existing backend dist/ and frontend .next/
 *
 * Everything this script starts it stops again (also on failure, Ctrl+C and crashes). A database that was
 * already running is reused and left running. Ports 3000 and 3001 must be free: a server you started yourself is
 * never adopted, because the suite writes data and must be sure which stack it is talking to.
 *
 * Environment (all optional):
 *   E2E_DATABASE_URL    default postgresql://postgres:pw@localhost:5433/flower (a LOCAL database; refuses other hosts)
 *   E2E_PG_EMBED_DIR    folder with a start.mjs that boots an embedded Postgres; started if the DB port is closed
 *   E2E_BACKEND_DIR     default ../../flower-backend (relative to the frontend folder)
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   admin used by the specs (defaults = the local seed admin)
 *   E2E_JWT_SECRET      default: random per run
 */
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND_DIR = resolve(process.env.E2E_BACKEND_DIR || join(FRONTEND_DIR, '../../flower-backend'));
const LOG_DIR = join(FRONTEND_DIR, 'e2e', '.run');
const WEB_PORT = 3000;
const API_PORT = 3001;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const API_URL = `http://localhost:${API_PORT}`;
const IS_WIN = process.platform === 'win32';

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const playwrightArgs = args.filter((a) => a !== '--skip-build');

const DATABASE_URL = process.env.E2E_DATABASE_URL || 'postgresql://postgres:pw@localhost:5433/flower';
const dbUrl = new URL(DATABASE_URL);
const dbPort = Number(dbUrl.port || 5432);
let startedDatabase = false;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@flowershop.local';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

/** Children we started (and therefore must stop), newest last. */
const started = [];
let cleaning = false;

const log = (msg) => console.log(`[e2e:local] ${msg}`);

function fail(msg) {
  throw new Error(msg);
}

function portOpen(port, host = '127.0.0.1') {
  return new Promise((done) => {
    const socket = net.connect({ port, host });
    socket.once('connect', () => (socket.destroy(), done(true)));
    socket.once('error', () => done(false));
    socket.setTimeout(1500, () => (socket.destroy(), done(false)));
  });
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
    await new Promise((r) => setTimeout(r, 500));
  }
  fail(`${label}: not ready after ${Math.round(timeoutMs / 1000)}s${child ? `; see ${child.logFile}` : ''}`);
}

const httpOk = async (url) => (await fetch(url)).ok;

function killTree(child) {
  if (!child || child.exitCode !== null || child.pid === undefined) return;
  try {
    if (IS_WIN) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-child.pid, 'SIGTERM'); // whole process group (spawned detached)
  } catch {
    /* already gone */
  }
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

function cleanup() {
  if (cleaning) return;
  cleaning = true;
  for (const child of [...started].reverse()) {
    log(`stopping ${child.serviceName} (pid ${child.pid})`);
    killTree(child);
  }
}

/**
 * Windows: `taskkill /T` can miss Postgres workers that are forked while the tree is being killed, and an orphaned
 * worker keeps the listening socket alive. Sweep any postgres.exe whose command line is inside the embedded
 * Postgres folder that this script started.
 */
function sweepEmbeddedPostgres(embedDir) {
  if (!IS_WIN || !embedDir) return;
  const norm = (p) => p.split('\\').join('/').toLowerCase();
  const root = norm(resolve(embedDir));
  const ps = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='postgres.exe'\" | ForEach-Object { \"$($_.ProcessId)|$($_.CommandLine)\" }"],
    { encoding: 'utf8', windowsHide: true },
  );
  for (const line of (ps.stdout || '').split(String.fromCharCode(10))) {
    const [pid, ...rest] = line.split(String.fromCharCode(13)).join('').split('|');
    if (pid && norm(rest.join('|')).includes(root)) spawnSync('taskkill', ['/PID', pid.trim(), '/F'], { stdio: 'ignore' });
  }
}

/** Stops our services and (if we started the database) waits until its port is really closed. */
async function shutdown(startedDatabase) {
  cleanup();
  if (startedDatabase) {
    sweepEmbeddedPostgres(process.env.E2E_PG_EMBED_DIR);
    for (let i = 0; i < 40 && (await portOpen(dbPort)); i++) await new Promise((r) => setTimeout(r, 500));
    if (await portOpen(dbPort)) log(`WARNING: database port :${dbPort} is still open after shutdown`);
  }
  for (const port of [WEB_PORT, API_PORT]) {
    for (let i = 0; i < 20 && (await portOpen(port)); i++) await new Promise((r) => setTimeout(r, 250));
  }
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    cleanup();
    if (startedDatabase) sweepEmbeddedPostgres(process.env.E2E_PG_EMBED_DIR);
    process.exit(130);
  });
}
process.on('exit', cleanup);

const nodeBin = (...rel) => join(...rel);

async function main() {
  // ---- safety: local database only, ports free, sources present ------------------------------------------------
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(dbUrl.hostname)) {
    fail(`E2E_DATABASE_URL host "${dbUrl.hostname}" is not local. The suite writes data; refusing.`);
  }
  if (!existsSync(join(BACKEND_DIR, 'package.json'))) fail(`Backend not found at ${BACKEND_DIR} (set E2E_BACKEND_DIR)`);
  for (const [port, what] of [[WEB_PORT, 'storefront'], [API_PORT, 'API']]) {
    if (await portOpen(port)) fail(`Port ${port} (${what}) is already in use. Stop that process first; this script only manages servers it starts.`);
  }

  // ---- database ------------------------------------------------------------------------------------------------
  if (await portOpen(dbPort)) {
    log(`database already listening on :${dbPort}; reusing it (will not be stopped)`);
  } else {
    const embedDir = process.env.E2E_PG_EMBED_DIR;
    if (!embedDir || !existsSync(join(embedDir, 'start.mjs'))) {
      fail(
        `Nothing is listening on the database port :${dbPort}. Start Postgres there, or set E2E_PG_EMBED_DIR to a folder ` +
          `containing a start.mjs that boots an embedded Postgres (see e2e/README.md).`,
      );
    }
    startedDatabase = true;
    const pg = startService('postgres', process.execPath, ['start.mjs'], { cwd: embedDir, env: process.env });
    await waitFor('embedded Postgres', () => portOpen(dbPort), 90_000, pg);
  }

  // ---- backend: build, migrate, seed, start ----------------------------------------------------------------
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
  const prismaCli = nodeBin(BACKEND_DIR, 'node_modules', 'prisma', 'build', 'index.js');
  const nestCli = nodeBin(BACKEND_DIR, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

  if (!skipBuild) runStep('building backend', process.execPath, [nestCli, 'build'], { cwd: BACKEND_DIR, env: backendEnv });
  const entry = ['dist/main.js', 'dist/src/main.js'].find((p) => existsSync(join(BACKEND_DIR, p)));
  if (!entry) fail('Backend build output not found (dist/main.js or dist/src/main.js). Run without --skip-build.');

  runStep('applying migrations', process.execPath, [prismaCli, 'migrate', 'deploy'], { cwd: BACKEND_DIR, env: backendEnv });
  runStep('seeding (idempotent)', process.execPath, ['prisma/seed.js'], { cwd: BACKEND_DIR, env: backendEnv });

  const api = startService('backend', process.execPath, [entry], { cwd: BACKEND_DIR, env: backendEnv });
  await waitFor('backend', () => httpOk(`${API_URL}/settings`), 90_000, api);
  // The test-only route must exist in this stack (404 here is the expected "no token yet" answer; a different
  // body would mean the module is not loaded).
  const probe = await fetch(`${API_URL}/auth/_test/last-reset-token?email=nobody@e2e.example.com`);
  if (probe.status !== 404) fail(`test endpoint probe returned ${probe.status}, expected 404`);

  // ---- storefront: build (needs the API up, it reads settings), start ----------------------------------------------
  const webEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_BASE: API_URL,
    API_BASE_INTERNAL: API_URL,
    NEXT_TELEMETRY_DISABLED: '1',
    PORT: String(WEB_PORT),
  };
  const nextCli = nodeBin(FRONTEND_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!skipBuild) runStep('building storefront', process.execPath, [nextCli, 'build'], { cwd: FRONTEND_DIR, env: webEnv });
  else if (!existsSync(join(FRONTEND_DIR, '.next', 'BUILD_ID'))) fail('No storefront build in .next. Run without --skip-build.');
  const web = startService('storefront', process.execPath, [nextCli, 'start', '-p', String(WEB_PORT)], { cwd: FRONTEND_DIR, env: webEnv });
  await waitFor('storefront', () => httpOk(WEB_URL), 90_000, web);

  // ---- tests ---------------------------------------------------------------------------------------------------
  const pwCli = nodeBin(FRONTEND_DIR, 'node_modules', '@playwright', 'test', 'cli.js');
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
  await shutdown(startedDatabase);
}
process.exit(exitCode);
