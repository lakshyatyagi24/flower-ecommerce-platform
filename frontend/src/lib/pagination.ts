export type PageItem = number | 'gap';

/** Page numbers to render: first, last, and a window around the current page (gaps collapse to 'gap'). */
export function pageWindow(page: number, pages: number): PageItem[] {
  if (pages <= 0) return [];
  const want = new Set<number>([1, pages]);
  let from = page - 1;
  let to = page + 1;
  if (page <= 2) to = Math.max(to, 3);
  if (page >= pages - 1) from = Math.min(from, pages - 2);
  for (let i = from; i <= to; i++) if (i >= 1 && i <= pages) want.add(i);
  const sorted = [...want].sort((a, b) => a - b);
  const out: PageItem[] = [];
  sorted.forEach((n, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      if (n - prev === 2) out.push(prev + 1);
      else if (n - prev > 2) out.push('gap');
    }
    out.push(n);
  });
  return out;
}
