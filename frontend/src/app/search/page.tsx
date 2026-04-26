import React from "react";
import SearchResultsClient from "@/components/SearchResultsClient";
import { api } from "@/lib/api";

function firstValue(input: string | string[] | undefined): string {
  if (typeof input === "string") return input;
  if (Array.isArray(input) && input.length > 0) return input[0];
  return "";
}

// keep props loose to match Next PageProps variants
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function SearchPage(props: any) {
  const searchParams = (props?.searchParams ?? {}) as Record<
    string,
    string | string[] | undefined
  >;

  const q = firstValue(searchParams.q).trim();

  const [result, recommended] = await Promise.all([
    api.listProducts({ q: q || undefined, active: true, take: 60 }).catch(() => ({
      items: [],
      total: 0,
      take: 0,
      skip: 0,
    })),
    api.listProducts({ active: true, take: 8 }).catch(() => ({
      items: [],
      total: 0,
      take: 0,
      skip: 0,
    })),
  ]);

  return (
    <main className="w-full max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-10">
      <h1 className="text-2xl font-extrabold mb-4">
        {q ? `Results for "${q}"` : "Search all products"}
      </h1>
      <SearchResultsClient
        initialQuery={q}
        initialProducts={result.items}
        recommendedProducts={recommended.items.slice(0, 4)}
      />
    </main>
  );
}
