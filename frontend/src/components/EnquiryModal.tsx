"use client";

import React, { useId, useRef } from "react";
import EnquiryForm, { EnquiryFormDefaults } from "./EnquiryForm";
import { useModal } from "@/components/chrome/use-modal";

type EnquiryModalProps = EnquiryFormDefaults & {
  open: boolean;
  onClose: () => void;
  heading?: string;
  description?: string;
};

export default function EnquiryModal({
  open,
  onClose,
  heading = "Enquire about this product",
  description,
  ...defaults
}: EnquiryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const pressedOnBackdrop = useRef(false);
  const titleId = useId();
  useModal(open, dialogRef, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-charcoal/50 sm:items-center sm:p-6"
      // Close only when the press AND the release both land on the backdrop, so a text-selection drag that
      // ends outside the dialog does not dismiss it.
      onMouseDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
        pressedOnBackdrop.current = false;
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[100dvh] w-full overflow-y-auto border border-stone-light bg-ivory px-5 pb-8 pt-4 outline-none sm:max-h-[calc(100dvh-3rem)] sm:max-w-2xl sm:rounded-sm sm:px-10 sm:pb-10 sm:pt-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="type-h3 pt-2 text-charcoal">
            {heading}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close enquiry form"
            className="-mr-3 inline-flex h-11 w-11 shrink-0 items-center justify-center text-charcoal hover:text-moss focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
        <EnquiryForm
          {...defaults}
          heading=""
          description={description || "Share your requirement and we will get back to you to confirm."}
          variant="inline"
          autoFocusFirst
        />
      </div>
    </div>
  );
}
