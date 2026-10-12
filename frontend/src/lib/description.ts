export type DescriptionBlock = { text: string; heading: boolean };

/**
 * Catalogue copy often has short label lines ("What you get", "Size it right") between paragraphs.
 * Those are headings (<= 6 words, no end punctuation) and never the lead sentence.
 */
export function splitDescription(text: string | null | undefined): { lead: string; rest: DescriptionBlock[] } {
  const blocks: DescriptionBlock[] = (text ?? '')
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ text: t, heading: t.split(/\s+/).length <= 6 && !/[.!?]$/.test(t) }));
  const leadIdx = blocks.findIndex((b) => !b.heading);
  if (leadIdx === -1) return { lead: '', rest: blocks };
  return { lead: blocks[leadIdx].text, rest: blocks.filter((_, i) => i !== leadIdx) };
}

/** Clean one-paragraph summary for meta tags / JSON-LD (falls back to the raw text if there is no real paragraph). */
export function leadText(text: string | null | undefined): string {
  return splitDescription(text).lead || (text ?? '').trim();
}
