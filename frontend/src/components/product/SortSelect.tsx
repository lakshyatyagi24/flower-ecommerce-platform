"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most loved" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/** Native select that rewrites the `sort` param, keeps other params and resets the page. */
export default function SortSelect({ value = "newest" }: { value?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("sort", next);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-dark">
      <span>Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 cursor-pointer rounded-sm border border-stone-light bg-ivory px-3 text-sm normal-case tracking-normal text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
