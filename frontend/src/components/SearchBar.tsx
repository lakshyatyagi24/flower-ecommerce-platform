"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ApiCategory, ApiProduct, api, formatINR, sanitizeImageUrl } from "@/lib/api";

type Suggestion =
  | { type: "product"; item: ApiProduct }
  | { type: "category"; item: ApiCategory }
  | { type: "static"; label: string; href: string };

const FALLBACK_IMG =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5528.jpg?v=1709440820";
const RECENT_KEY = "recent_searches";
const TRENDING = ["roses", "orchids", "carnations", "wedding flowers", "event decor"];
const STATIC_PAGES: Array<{ label: string; href: string }> = [
  { label: "Products", href: "/products" },
  { label: "Events", href: "/events" },
  { label: "Contact", href: "/contact" },
];

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

function saveRecent(value: string) {
  if (typeof window === "undefined") return;
  const next = [value, ...readRecent().filter((v) => v.toLowerCase() !== value.toLowerCase())].slice(
    0,
    8,
  );
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export default function SearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<ApiProduct[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecent());
    api
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setProductSuggestions([]);
      setHighlightIndex(-1);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      api
        .listProducts({ q, active: true, take: 6 })
        .then((res) => {
          if (!cancelled) setProductSuggestions(res.items);
        })
        .catch(() => {
          if (!cancelled) setProductSuggestions([]);
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

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

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    const items: Suggestion[] = [];

    for (const p of productSuggestions) {
      items.push({ type: "product", item: p });
    }

    if (q) {
      for (const c of categories) {
        if (c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)) {
          items.push({ type: "category", item: c });
          if (items.length >= 9) break;
        }
      }

      for (const s of STATIC_PAGES) {
        if (s.label.toLowerCase().includes(q)) items.push({ type: "static", ...s });
      }
    }

    return items.slice(0, 10);
  }, [categories, productSuggestions, query]);

  function navigateRaw(raw: string) {
    const q = raw.trim();
    if (!q) return;
    saveRecent(q);
    setRecent(readRecent());
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function navigateSuggestion(s: Suggestion) {
    setOpen(false);
    if (s.type === "product") {
      router.push(`/products/${s.item.slug}`);
      return;
    }
    if (s.type === "category") {
      router.push(`/products?category=${encodeURIComponent(s.item.slug)}`);
      return;
    }
    router.push(s.href);
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(suggestions.length - 1, i + 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(-1, i - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        navigateSuggestion(suggestions[highlightIndex]);
      } else {
        navigateRaw(query);
      }
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form
        role="search"
        aria-label="Site"
        onSubmit={(e) => {
          e.preventDefault();
          navigateRaw(query);
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          Search products
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M10 2a8 8 0 105.29 14.29l4.7 4.7 1.41-1.41-4.7-4.7A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
            </svg>
          </div>

          <input
            id="global-search"
            ref={inputRef}
            type="search"
            inputMode="search"
            placeholder="Search flowers, colors, categories"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-haspopup="listbox"
            aria-activedescendant={
              highlightIndex >= 0 ? `search-suggestion-${highlightIndex}` : undefined
            }
            className="w-full pl-10 pr-20 h-10 bg-white/80 border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-olive-green/50 placeholder:text-gray-400"
          />

          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setOpen(false);
                setHighlightIndex(-1);
                inputRef.current?.focus();
              }}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.89 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.89a1 1 0 001.41-1.41L13.41 12l4.89-4.89a1 1 0 000-1.4z" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            aria-label="Search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-olive-green hover:text-olive-green/90 p-1"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
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
          className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-72 overflow-auto"
        >
          {query.trim() === "" && (
            <li className="px-3 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Recent searches</div>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    localStorage.removeItem(RECENT_KEY);
                    setRecent([]);
                  }}
                  className="text-xs text-gray-500"
                >
                  Clear
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {recent.length > 0 ? (
                  recent.map((r, i) => (
                    <button
                      key={`${r}-${i}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setQuery(r);
                        navigateRaw(r);
                      }}
                      className="text-sm px-2 py-1 bg-gray-100 rounded"
                    >
                      {r}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No recent searches</div>
                )}
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Trending</div>
                <div className="flex gap-2 flex-wrap">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setQuery(t);
                        navigateRaw(t);
                      }}
                      className="text-sm px-2 py-1 bg-gray-50 rounded border"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          )}

          {suggestions.map((s, idx) => {
            if (s.type === "product") {
              return (
                <li
                  id={`search-suggestion-${idx}`}
                  key={`p-${s.item.id}`}
                  role="option"
                  aria-selected={highlightIndex === idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateSuggestion(s);
                  }}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-x-3 ${
                    highlightIndex === idx ? "bg-olive-green/10" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={sanitizeImageUrl(s.item.image) ?? FALLBACK_IMG}
                      alt={s.item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 line-clamp-1">{s.item.name}</div>
                    <div className="text-xs text-gray-500">{formatINR(s.item.price)}</div>
                  </div>
                  <div className="text-xs text-olive-green font-medium">View</div>
                </li>
              );
            }

            if (s.type === "category") {
              return (
                <li
                  id={`search-suggestion-${idx}`}
                  key={`c-${s.item.id}`}
                  role="option"
                  aria-selected={highlightIndex === idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigateSuggestion(s);
                  }}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                    highlightIndex === idx ? "bg-olive-green/10" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm text-gray-800">{s.item.name}</div>
                  <div className="text-xs text-gray-400">Category</div>
                </li>
              );
            }

            return (
              <li
                id={`search-suggestion-${idx}`}
                key={`s-${s.href}`}
                role="option"
                aria-selected={highlightIndex === idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigateSuggestion(s);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                  highlightIndex === idx ? "bg-olive-green/10" : "hover:bg-gray-50"
                }`}
              >
                <div className="text-sm text-gray-800">{s.label}</div>
                <div className="text-xs text-gray-400">Page</div>
              </li>
            );
          })}

          {query.trim() !== "" && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                navigateRaw(query);
              }}
              className="px-3 py-2 cursor-pointer text-sm text-center text-olive-green hover:bg-gray-50 border-t border-gray-100"
            >
              {`See all results for "${query.trim()}"`}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
