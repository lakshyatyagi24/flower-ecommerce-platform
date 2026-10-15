// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The admin panel has no test runner and shares no code with the storefront, so its scrubber/options are
// byte-identical copies. This test keeps them in lockstep, which means the scrubber tests in
// sentry.test.ts cover the admin copy too.
const here = path.resolve(__dirname);
const admin = path.resolve(here, "../../../../admin-panel/src/lib/sentry");

describe("admin Sentry copies stay identical to the storefront's", () => {
  for (const f of ["scrub.ts", "options.ts", "client.ts"]) {
    it(f, () => {
      const norm = (s: string) => s.replace(/\r\n/g, "\n");
      expect(norm(readFileSync(path.join(admin, f), "utf8"))).toBe(norm(readFileSync(path.join(here, f), "utf8")));
    });
  }
});
