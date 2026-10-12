"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import MegaMenu from "./MegaMenu";
import { api } from "../lib/api";
import { useApi } from "../lib/use-api";

type Submenu = {
  title: string;
  items: { name: string; slug: string }[];
};

type Category = {
  name: string;
  slug?: string;
  submenus?: Submenu[];
};

type CategoriesProps = {
  categories?: Category[];
  onCategoryClick?: (category: string) => void;
};

// No hardcoded default categories — frontend will only use the configured API.
const defaultCategories: Category[] = [];

const Categories: React.FC<CategoriesProps> = ({ categories = defaultCategories, onCategoryClick }) => {
  const [active, setActive] = useState<string | null>(null);
  const [menuRect, setMenuRect] = useState<{ left: number; top: number; bottom: number; width: number } | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = (delay = 150) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      setActive(null);
      setMenuRect(null);
      hideTimeout.current = null;
    }, delay);
  };

  const clearHide = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  const { data: apiCategories, error: categoriesError, loading, reload } = useApi(() => api.listCategories(), []);
  const remoteCategories = useMemo<Category[] | null>(
    () =>
      apiCategories
        ? apiCategories.map((c) => ({
            name: c.name,
            slug: c.slug,
            submenus:
              c.children && c.children.length
                ? [{ title: 'Subcategories', items: c.children.map((ch) => ({ name: ch.name, slug: ch.slug })) }]
                : undefined,
          }))
        : null,
    [apiCategories],
  );

  // determine effective categories from remote or defaults
  const effectiveCategories = remoteCategories ?? categories;
  // show at most 8 top-level categories in the bar; submenus remain unchanged
  const visibleCategories = effectiveCategories.slice(0, 8);
  const activeCategory = active ? effectiveCategories.find((c) => c.name === active) ?? null : null;

  // Precompute the list items to render (either shimmer placeholders or actual categories)
  const categoryItems = loading && !remoteCategories
    ? Array.from({ length: 8 }).map((_, i) => (
        <li key={`shimmer-${i}`} className="flex-shrink-0 relative">
          <div className="h-6 w-24 rounded-md bg-neutral-200/60 animate-pulse" />
        </li>
      ))
    : visibleCategories.map((cat) => (
        <li
          key={cat.name}
          className="flex-shrink-0 relative"
          onMouseEnter={(e) => {
            clearHide();
            setActive(cat.name);
            const el = e.currentTarget as HTMLElement;
            const rect = el.getBoundingClientRect();
            setMenuRect({ left: rect.left, top: rect.top, bottom: rect.bottom, width: rect.width });
          }}
        >
          <Link
            href={`/collections/${cat.slug ?? cat.name.toLowerCase()}`}
            onClick={() => onCategoryClick?.(cat.name)}
            onFocus={(e) => {
              setActive(cat.name);
              const el = (e.target as HTMLElement).closest('li');
              if (el) {
                const r = el.getBoundingClientRect();
                setMenuRect({ left: r.left, top: r.top, bottom: r.bottom, width: r.width });
              }
            }}
            onBlur={() => scheduleHide(250)}
            className="text-olive-green hover:text-light-brown px-2 py-1 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40"
          >
            {cat.name}
          </Link>
        </li>
      ));

  return (
    <>
    <div
      className="w-full categories-bar bg-beige/40 border-t border-olive-green/10 backdrop-blur-sm relative overflow-visible"
      onMouseLeave={() => scheduleHide()}
      onMouseEnter={() => clearHide()}
    >
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative">
  <div className="overflow-x-auto overflow-y-visible">
          {categoriesError && visibleCategories.length === 0 ? (
            <p role="alert" className="text-sm py-3 px-2 text-center">
              Couldn&apos;t load categories.{' '}
              <button type="button" onClick={reload} className="underline underline-offset-4">Try again</button>
            </p>
          ) : (
          <ul className="flex gap-x-8 items-center whitespace-nowrap text-sm py-3 px-2 justify-start md:justify-center overflow-x-auto">
            {categoryItems}
          </ul>
          )}
        </div>
      </div>
    </div>
    {active && menuRect && activeCategory && (
      <MegaMenu category={activeCategory} anchorRect={menuRect} onRequestClose={() => setActive(null)} clearHide={clearHide} scheduleHide={scheduleHide} />
    )}
    </>
  );
};

export default Categories;
