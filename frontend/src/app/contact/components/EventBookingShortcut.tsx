"use client";
import React from "react";
import Link from "next/link";

export default function EventBookingShortcut() {
  return (
  <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 motion-reduce:transition-none motion-reduce:hover:shadow-none">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-rose-50 rounded-md">
          <svg className="w-6 h-6 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6l4 2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 8v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8" />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="text-lg font-semibold">Plan Your Event</h4>
          <p className="text-sm text-gray-600">We design for weddings, parties, corporate and more.</p>
        </div>

        <div>
          <Link
            href="/events"
            className="inline-flex items-center px-5 py-3 bg-olive-green text-white rounded-md shadow-md hover:shadow-lg transition transform duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-olive-green/60 text-sm font-medium motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
          >
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}
