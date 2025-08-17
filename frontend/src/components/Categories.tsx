"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import MegaMenu from "./MegaMenu";

type Submenu = {
  title: string;
  items: string[];
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

// Mock data for now. Later this will come from API and be passed via props.
const defaultCategories: Category[] = [
  {
    name: "Flowers",
    slug: "flowers",
    submenus: [
      { title: "Collection", items: ["Best Sellers","Birthday Flowers","Love & Affection","Anniversary Flowers","Bridal Bouquet","Flower Bouquet","Flowers In Vases","Flowers In Gift Box","Luxury Flowers","All Flowers","Flowers By Theme"] },
      { title: "Shop By Flower Type", items: ["Rose Bouquet","Lilies Bouquet","Orchids Bouquet","Mixed Flower Bouquet","Carnation Bouquet","Gerbera Bouquet","Sunflower Bouquet","Dried Flower Bouquet","Hydrangea Bouquet"] },
      { title: "By Occasions", items: ["Congratulations","Get Well Soon","I Am Sorry","Cheer Up","Thank You","New Born","Appreciation"] },
      { title: "Cities", items: ["Flowers To Bangalore","Flowers To Chennai","Flowers To Delhi","Flowers To Gurgaon","Flowers To Hyderabad","Flowers To Kolkata","Flowers To Mumbai","Flowers To Pune","All 430+ Cities"] },
      { title: "Floral Assortments", items: ["Flowers & Cakes","Flowers & Chocolates","Flowers & Teddy","All Flowers Combos"] },
      { title: "Blossoms By Hue", items: ["Red Flowers","Pink Flowers","Yellow Flowers","White Flowers","Mixed Flowers","Red Roses","Pink Roses","Yellow Roses","White Roses"] },
    ],
  },
  {
    name: "Cakes",
    slug: "cakes",
    submenus: [
      { title: "Flavours", items: ["Chocolate","Vanilla","Red Velvet","Black Forest","Butterscotch"] },
      { title: "Type", items: ["Birthday Cakes","Eggless Cakes","Photo Cakes","Designer Cakes"] },
      { title: "Combos", items: ["Cake + Flowers","Cake + Chocolate","Cake + Teddy"] },
    ],
  },
  {
    name: "Combos",
    slug: "combos",
    submenus: [
      { title: "Popular Combos", items: ["Flowers & Cake","Flowers & Chocolates","Flowers & Teddy"] },
    ],
  },
  { name: "Birthday", slug: "birthday" , submenus: [{ title: "Birthday", items: ["Birthday Flowers","Birthday Cakes","Birthday Combos"] }]},
  { name: "Anniversary", slug: "anniversary", submenus: [{ title: "Anniversary", items: ["Anniversary Flowers","Anniversary Gifts","Romantic Combos"] }]},
  { name: "Gifts", slug: "gifts", submenus: [{ title: "Gifts", items: ["Chocolates","Teddy Bears","Personalised Mugs","Gift Hampers"] }]},
  { name: "Personalised", slug: "personalised", submenus: [{ title: "Personalised", items: ["Customized Cakes","Photo Frames","Engraved Gifts"] }]},
  { name: "Plants", slug: "plants", submenus: [{ title: "Plants", items: ["Indoor Plants","Outdoor Plants","Succulents","Air-purifying Plants"] }]},
  { name: "Occasions", slug: "occasions", submenus: [{ title: "Occasions", items: ["Wedding","Valentine's Day","Mother's Day","Father's Day"] }]},
  { name: "International", slug: "international", submenus: [{ title: "International", items: ["Same Day International","International Delivery"] }]},
];

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

  // determine activeCategory for MegaMenu
  const activeCategory = active ? categories.find((c) => c.name === active) ?? null : null;

  return (
    <>
    <div
      className="w-full categories-bar bg-beige/40 border-t border-olive-green/10 backdrop-blur-sm relative overflow-visible"
      onMouseLeave={() => scheduleHide()}
      onMouseEnter={() => clearHide()}
    >
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative">
  <div className="overflow-x-auto overflow-y-visible">
          <ul className="flex gap-x-8 items-center whitespace-nowrap text-sm py-3 px-2 justify-start md:justify-center overflow-x-auto">
            {categories.map((cat) => (
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
                  href={`#${cat.slug ?? cat.name.toLowerCase()}`}
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
            ))}
          </ul>
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
