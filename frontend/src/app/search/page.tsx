import React from "react";
import SearchResultsClient from "@/components/SearchResultsClient";
import { products as allProducts } from "@/lib/products";

type Props = { searchParams?: { [key: string]: string | string[] | undefined } };

export default function SearchPage({ searchParams }: Props) {
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";

  // server-side pre-filter a minimal set to send as initial props
  const normalized = q.trim().toLowerCase();
  const productMatches = normalized
    ? allProducts.filter((p) => p.title.toLowerCase().includes(normalized))
    : allProducts;

  return (
    <main className="w-full max-w-6xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold mb-4">{"Results for \"" + q + "\""}</h1>
      <SearchResultsClient initialQuery={q} initialProducts={productMatches} />
    </main>
  );
}
