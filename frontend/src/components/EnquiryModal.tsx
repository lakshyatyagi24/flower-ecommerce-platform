"use client";

import React from "react";
import EnquiryForm, { EnquiryFormDefaults } from "./EnquiryForm";

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
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-olive-green">{heading}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close enquiry form"
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <EnquiryForm
            {...defaults}
            heading=""
            description={description || "Share your requirement — we'll call you back to confirm."}
            variant="inline"
          />
        </div>
      </div>
    </div>
  );
}
