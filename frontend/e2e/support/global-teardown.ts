import { restoreSavedSettings } from './settings-guard';

/** Last line of defence: put back any setting a spec changed, even if its own afterAll did not run. */
export default async function globalTeardown() {
  try {
    await restoreSavedSettings();
  } catch (e) {
    console.warn(`[e2e] could not restore settings (${(e as Error).message}); the next run restores them from e2e/.run`);
  }
}
