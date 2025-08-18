"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { products as allProducts } from "@/lib/products";

type Suggestion =
  | { type: "product"; id: string; label: string; price: string; img: StaticImageData }
  | { type: "collection"; collection: string; label: string }
  | { type: "static"; label: string; href: string };

// Accessible search with live suggestions, keyboard navigation and routing
const SearchBar: React.FC = () => {
  const id = "global-search";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const trending = ["roses", "wedding bouquet", "birthday", "anniversary", "mother's day"];

  // load recent searches once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('recent_searches');
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  // build a simple suggestion source from products + collections
  const computeSuggestions = useCallback((q: string) => {
    const normalized = q.trim().toLowerCase();
    if (!normalized) return [] as Suggestion[];

    const collectionNames = Array.from(new Set(allProducts.map((p) => p.collection).filter(Boolean))) as string[];

    const productMatches = allProducts
      .filter((p) => p.title.toLowerCase().includes(normalized))
      .slice(0, 5)
      .map((p) => ({ type: "product", id: p.id, label: p.title, price: p.price, img: p.img } as Suggestion));

    const collectionMatches = collectionNames
      .filter((c) => c.toLowerCase().includes(normalized))
      .slice(0, 4)
      .map((c) => ({ type: "collection", collection: c, label: c.replace(/-/g, " ") } as Suggestion));

    const staticPages = [
      { label: "Event Services", href: "/events" },
      { label: "FAQ", href: "/faq" },
    ];

    const staticMatches = staticPages
      .filter((p) => p.label.toLowerCase().includes(normalized))
      .map((p) => ({ type: "static", label: p.label, href: p.href } as Suggestion));

    // products first, then collections, then static pages
    return [...productMatches, ...collectionMatches, ...staticMatches];
  }, []);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setOpen(false);
      setHighlightIndex(-1);
      return;
    }

    const next = computeSuggestions(query);
    setSuggestions(next);
    setOpen(next.length > 0);
    setHighlightIndex(-1);
  }, [query, computeSuggestions]);

  // click outside to close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const navigateFor = (s: Suggestion | { raw: string }) => {
    if ((s as Suggestion).type === "product") {
      const prod = s as Suggestion & { type: "product" };
      router.push(`/products/${prod.id}`);
    } else if ((s as Suggestion).type === "collection") {
      const col = s as Suggestion & { type: "collection" };
      router.push(`/products?collection=${encodeURIComponent(col.collection)}`);
    } else {
      const r = s as { raw: string };
      router.push(`/search?q=${encodeURIComponent(r.raw)}`);
    }
    setOpen(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(suggestions.length > 0);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min((suggestions.length - 1) as number, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        navigateFor(suggestions[highlightIndex]);
      } else if (query.trim()) {
        navigateFor({ raw: query.trim() });
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  // open suggestions on focus even if query is empty (to show recent/trending)
  const onFocus = () => {
    setOpen(true);
  };

  const onClear = () => {
    setQuery("");
    inputRef.current?.focus();
    setSuggestions([]);
    setOpen(false);
    setHighlightIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form
        role="search"
        aria-label="Site"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) navigateFor({ raw: query.trim() });
        }}
      >
        <label htmlFor={id} className="sr-only">
          Search for products, categories or events
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Image src="/search-icon.svg" alt="" aria-hidden width={20} height={20} className="text-gray-400" />
          </div>

          <input
            id={id}
            ref={inputRef}
            type="search"
            inputMode="search"
            placeholder={"Search for flowers, gifts, events…"}
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-haspopup="listbox"
            aria-activedescendant={highlightIndex >= 0 ? `search-suggestion-${highlightIndex}` : undefined}
            className="w-full pl-10 pr-10 h-10 bg-white/80 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-olive-green/50 placeholder:text-gray-400"
          />

          {/* clear button */}
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={onClear}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.89 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.89a1 1 0 001.41-1.41L13.41 12l4.89-4.89a1 1 0 000-1.4z" />
              </svg>
            </button>
          )}

          {/* search submit icon */}
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-olive-green hover:text-olive-green/90 p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M10 2a8 8 0 105.29 14.29l4.7 4.7 1.41-1.41-4.7-4.7A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
            </svg>
          </button>
        </div>
      </form>

      {open && (suggestions.length > 0 || query.trim() === "") && (
        <ul
          id="search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-60 overflow-auto"
        >
          {query.trim() === "" && (
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Recent searches</div>
                <button type="button" onClick={() => { setRecent([]); localStorage.removeItem('recent_searches'); }} className="text-xs text-gray-500">Clear history</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {recent.length > 0 ? recent.map((r, i) => (
                  <button key={r+i} onMouseDown={(e) => { e.preventDefault(); setQuery(r); navigateFor({ raw: r }); }} className="text-sm px-2 py-1 bg-gray-100 rounded">{r}</button>
                )) : <div className="text-sm text-gray-500">No recent searches</div>}
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Trending</div>
                <div className="flex gap-2 flex-wrap">
                  {trending.map((t) => (
                    <button key={t} onMouseDown={(e) => { e.preventDefault(); setQuery(t); navigateFor({ raw: t }); }} className="text-sm px-2 py-1 bg-gray-50 rounded border">{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {suggestions.map((s, idx) => {
            if (s.type === "product") {
              return (
                <li
                  id={`search-suggestion-${idx}`}
                  key={`p-${s.id}`}
                  role="option"
                  aria-selected={highlightIndex === idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateFor(s);
                  }}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-x-3 ${highlightIndex === idx ? "bg-olive-green/10" : "hover:bg-gray-50"}`}
                >
                  <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0">
                    <Image src={s.img} alt={s.label} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{s.label}</div>
                    <div className="text-xs text-gray-500">{s.price}</div>
                  </div>
                  <div className="text-xs text-olive-green font-medium">View</div>
                </li>
              );
            }

            if (s.type === "collection") {
              return (
                <li
                  id={`search-suggestion-${idx}`}
                  key={`c-${s.collection}`}
                  role="option"
                  aria-selected={highlightIndex === idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateFor(s);
                  }}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between ${highlightIndex === idx ? "bg-olive-green/10" : "hover:bg-gray-50"}`}
                >
                  <div className="text-sm text-gray-800">{s.label}</div>
                  <div className="text-xs text-gray-400">Category</div>
                </li>
              );
            }

            // static
            return (
              <li
                id={`search-suggestion-${idx}`}
                key={`s-${s.href}`}
                role="option"
                aria-selected={highlightIndex === idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigateFor(s);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${highlightIndex === idx ? "bg-olive-green/10" : "hover:bg-gray-50"}`}
              >
                <div className="text-sm text-gray-800">{s.label}</div>
                <div className="text-xs text-gray-400">Page</div>
              </li>
            );
          })}

          {/* see all results */}
          <li
            id={`search-suggestion-${suggestions.length}`}
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              e.preventDefault();
              router.push(`/products?q=${encodeURIComponent(query.trim())}`);
            }}
            className="px-3 py-2 cursor-pointer text-sm text-center text-olive-green hover:bg-gray-50 border-t border-gray-100"
          >
            {"See all results for \"" + query.trim() + "\""}
          </li>
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
