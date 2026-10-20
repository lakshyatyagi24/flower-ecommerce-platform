import React from "react";
import { textLink } from "@/components/ui/form-styles";

type ModalTopBarProps = { showBack: boolean; onBack: () => void; onClose: () => void };

export default function ModalTopBar({ showBack, onBack, onClose }: ModalTopBarProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className={`-ml-3 inline-flex min-h-[44px] items-center px-3 text-xs font-medium uppercase tracking-[0.12em] text-stone-dark hover:text-charcoal ${textLink} no-underline`}
        >
          ← Back
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close sign in dialog"
        className="-mr-3 inline-flex h-11 w-11 items-center justify-center text-charcoal hover:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </div>
  );
}
