import Link from "next/link";
import { pageWindow } from "@/lib/pagination";
import { listHref, type ListParams } from "@/lib/list-params";

const item =
  "flex h-11 min-w-11 items-center justify-center px-2 text-sm text-charcoal transition-colors hover:text-moss " +
  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moss";

/** Crawlable numbered pagination. Hidden when there is only one page. */
export default function Pagination({ params, page, pages }: { params: ListParams; page: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (n: number) => listHref(params, { page: n });
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-1 border-t border-stone-light pt-8">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${item} uppercase tracking-[0.12em] text-[13px]`}>
          Previous
        </Link>
      ) : null}
      {pageWindow(page, pages).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-stone">
            …
          </span>
        ) : n === page ? (
          <span
            key={n}
            aria-current="page"
            className="flex h-11 min-w-11 items-center justify-center border-b border-charcoal px-2 text-sm text-charcoal"
          >
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)} aria-label={`Page ${n}`} className={item}>
            {n}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link href={href(page + 1)} rel="next" className={`${item} uppercase tracking-[0.12em] text-[13px]`}>
          Next
        </Link>
      ) : null}
    </nav>
  );
}
