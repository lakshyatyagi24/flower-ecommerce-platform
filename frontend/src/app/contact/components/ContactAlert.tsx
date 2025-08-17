"use client";
import React from "react";

type Props = {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
};

export default function ContactAlert({ type, message, onClose }: Props) {
  const isSuccess = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      tabIndex={-1}
      className={`w-full rounded-md p-4 mb-4 flex items-start gap-3 ${
        isSuccess ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
      }`}
    >
      <div className="flex-shrink-0">
        {isSuccess ? (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <div className="flex-1">
        <p className={`text-sm font-medium ${isSuccess ? "text-green-800" : "text-red-800"}`}>{message}</p>
      </div>

      {onClose && (
        <div className="flex-shrink-0 self-start">
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="inline-flex items-center justify-center p-1 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-green/40"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
