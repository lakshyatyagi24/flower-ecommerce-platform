import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getAdminSettings, putSettings } from './api';

/**
 * Temporarily changing a global setting must survive a killed run. The original value is written to e2e/.run
 * BEFORE the change; global-setup restores it at the start of the next run and global-teardown at the end of this
 * one, so a polluted value is never mistaken for the original.
 */
const FILE = path.resolve(__dirname, '..', '.run', 'settings-original.json');

type Saved = Record<string, string>;

function read(): Saved | null {
  if (!existsSync(FILE)) return null;
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as Saved;
  } catch {
    return null;
  }
}

/** Restores anything saved by an earlier (possibly killed) run, then forgets it. */
export async function restoreSavedSettings(): Promise<void> {
  const saved = read();
  if (!saved) return;
  await putSettings(saved);
  rmSync(FILE, { force: true });
}

/** Saves the current values of `values`' keys, then applies `values`. */
export async function overrideSettings(values: Record<string, string>): Promise<void> {
  await restoreSavedSettings(); // never record a polluted value as the original
  const current = await getAdminSettings();
  const original: Saved = {};
  for (const key of Object.keys(values)) original[key] = current[key] ?? '';
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(original));
  await putSettings(values);
}
