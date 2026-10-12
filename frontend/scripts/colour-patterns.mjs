// Pattern matcher for hardcoded colours. Imported by check-colours.mjs and unit-tested.
//
// Flags: hex literals (#fff, #7C835A, 4/8-digit too), arbitrary Tailwind values
// ([#abc], [rgb(...)]) and rgb()/rgba() calls.
// Known false-positive avoidance: HTML entities (&#123;), word-attached '#' and
// href="#anchor" fragments are skipped. Hex-looking fragments elsewhere
// (e.g. '#bad' in a URL string) would still match; fix by using a token or
// building the URL differently.

const HEX = /(?<![\w&])(?<!href=["'])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const ARBITRARY = /\[(?:#|rgba?\()[^\]]*\]/g;
const FUNC = /\brgba?\([^)]*\)/g;

/** Returns de-duplicated colour offenders found in `src`. */
export function findColourHits(src) {
  const hits = new Set();
  for (const re of [ARBITRARY, FUNC, HEX]) {
    for (const m of src.matchAll(re)) hits.add(m[0]);
  }
  return [...hits];
}
