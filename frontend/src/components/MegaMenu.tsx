"use client";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type Submenu = {
  title: string;
  items: string[];
};

type Category = {
  name: string;
  slug?: string;
  submenus?: Submenu[];
};

type AnchorRect = { left: number; top: number; bottom: number; width: number };

type Props = {
  category: Category;
  anchorRect: AnchorRect;
  onRequestClose: () => void;
  clearHide: () => void;
  scheduleHide: (delay?: number) => void;
};

export default function MegaMenu({ category, anchorRect, onRequestClose, clearHide, scheduleHide }: Props) {
  const [visible, setVisible] = React.useState(false);
  const ANIMATION_MS = 180;

  // mount animation
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // play exit animation then notify parent
        setVisible(false);
        setTimeout(() => onRequestClose(), ANIMATION_MS + 30);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRequestClose]);

  if (!category.submenus) return null;

  const totalCols = Math.max(1, category.submenus.length);
  const colEstimate = 180;
  const padding = 32;
  const rawWidth = totalCols * colEstimate + padding;
  const maxAllowed = Math.min(window.innerWidth * 0.95, 1400);
  const minAllowed = 280;
  const width = Math.max(minAllowed, Math.min(rawWidth, maxAllowed));

  // Compute available space and pick a tighter visual cap so the menu looks compact
  const availableBelow = Math.max(0, window.innerHeight - (anchorRect.bottom + 8));
  const availableAbove = Math.max(0, anchorRect.top - 8);
  let placeAbove = false;
  // Slightly tighter cap: up to 55% of viewport or 460px — looks better on large screens
  const visualCap = Math.min(460, Math.floor(window.innerHeight * 0.55));
  let maxHeight = Math.min(availableBelow, visualCap);
  if (availableBelow < 220 && availableAbove > availableBelow) {
    placeAbove = true;
    maxHeight = Math.min(availableAbove, visualCap);
  }

  const pageLeftCenter = anchorRect.left + window.scrollX + anchorRect.width / 2;
  let left = pageLeftCenter - width / 2;
  left = Math.max(8 + window.scrollX, Math.min(left, window.scrollX + window.innerWidth - width - 8));
  const topPos = placeAbove ? (anchorRect.top + window.scrollY) - maxHeight - 8 : (anchorRect.bottom + window.scrollY) + 8;

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${left}px`,
    top: `${topPos}px`,
    zIndex: 9999,
    width: `${width}px`,
    // let the inner panel control scrolling/height so the outer container sizes naturally
    overflow: 'visible',
  };

  const panelStyle: React.CSSProperties = {
    // cap scrolling on the inner panel so the container doesn't appear huge
    maxHeight: `${maxHeight}px`,
    overflowY: 'auto',
    transformOrigin: 'top center',
    transition: 'opacity 180ms ease, transform 180ms ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px) scale(1)' : (placeAbove ? 'translateY(8px) scale(0.98)' : 'translateY(-8px) scale(0.98)')
  };

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    top: placeAbove ? 'unset' : '-8px',
    bottom: placeAbove ? '-8px' : 'unset',
    width: 0,
    height: 0,
    pointerEvents: 'none'
  };

  return createPortal(
    <div
      style={containerStyle}
      role="menu"
      aria-label={`${category.name} subcategories`}
  onMouseEnter={() => { clearHide(); setVisible(true); }}
  onMouseLeave={() => { setVisible(false); scheduleHide(ANIMATION_MS + 40); }}
    >
      <div style={arrowStyle}>
        {!placeAbove ? (
          <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid white' }} />
        ) : (
          <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid white' }} />
        )}
      </div>

  <div style={panelStyle} className="bg-white border border-olive-green/10 shadow-lg rounded-md p-3">
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${colEstimate}px, 1fr))`, gap: 12 }}>
          {category.submenus.map((col) => (
            <div key={col.title}>
      <h4 className="text-sm font-semibold mb-1">{col.title}</h4>
      <ul className="space-y-1 text-sm">
                {col.items.map((it) => (
                  <li key={it}>
                    <Link href={`#${it.toLowerCase().replace(/\s+/g, "-")}`} className="text-gray-600 hover:text-olive-green">{it}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
  </div>,
    document.body
  );
}
