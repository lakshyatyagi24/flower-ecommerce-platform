import React from "react";
import { focusRing } from "@/components/ui/form-styles";

const STAR_PATH =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z";

const STAR_VALUES = [1, 2, 3, 4, 5];

const Star: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 16 }) => (
  <svg
    className={filled ? "text-moss" : "text-stone"}
    style={{ width: size, height: size }}
    viewBox="0 0 20 20"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.2}
    aria-hidden
  >
    <path d={STAR_PATH} />
  </svg>
);

export function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
      {STAR_VALUES.map((v) => (
        <Star key={v} filled={v - 1 < Math.round(value)} />
      ))}
    </div>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center">
      {STAR_VALUES.map((v) => (
        <button
          type="button"
          key={v}
          onClick={() => onChange(v)}
          aria-label={`${v} star${v === 1 ? "" : "s"}`}
          aria-pressed={v === value}
          className={`inline-flex h-11 w-11 items-center justify-center ${focusRing}`}
        >
          <Star filled={v <= value} size={24} />
        </button>
      ))}
    </div>
  );
}
