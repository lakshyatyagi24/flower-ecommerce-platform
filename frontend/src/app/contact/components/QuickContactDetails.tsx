"use client";
import React from "react";

export default function QuickContactDetails() {
  const phone = "+911234567890"; // adjust as needed
  const whatsapp = "+911234567890"; // whatsapp number (international format, no plus in wa.me link)
  const email = "hello@example.com";
  const addressText = "Studio Floral, Connaught Place, New Delhi, India";
  const mapsQuery = encodeURIComponent(addressText);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
  <div className="p-4 bg-white rounded-lg border shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow duration-150 transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:shadow-none motion-reduce:transform-none">
        <div className="p-2 bg-rose-50 rounded-md">
          <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5h12M9 3v2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 21l-1-4a4 4 0 014-4h6a4 4 0 014 4l-1 4" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium">Phone</div>
          <a href={`tel:${phone}`} className="text-olive-green hover:underline text-sm">{phone}</a>
        </div>
      </div>

  <div className="p-4 bg-white rounded-lg border shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow duration-150 transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:shadow-none motion-reduce:transform-none">
        <div className="p-2 bg-green-50 rounded-md">
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M20.5 3.5a11 11 0 10-17 14.9L2 22l3.7-1.3A11 11 0 0020.5 3.5zM15.6 14.1c-.4-.2-2.4-1.2-2.8-1.3-.4-.1-.7-.1-1 .2l-1 .9c-.3.3-.7.3-1 .1-1.1-.6-2.1-1.7-2.6-3C6.6 9.6 7 7.9 8 6.9c.7-.7 1-.8 1.6-.8.5 0 .9.1 1.3.5s.5.9.8 1.6c.2.5.1.9 0 1.1-.1.2-.4.5-.8.9-.3.3-.4.5-.4.8 0 .6 1.8 2.7 2.5 3 .7.3 1.2.2 1.6 0 .4-.2 1.3-.8 1.6-1.1.3-.3.5-.4.8-.3.3.1 1.2.5 1.4.6-.1.4-.6.8-1 1z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium">WhatsApp</div>
          <a href={`https://wa.me/${whatsapp.replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer" className="text-olive-green hover:underline text-sm">Chat on WhatsApp</a>
        </div>
      </div>

  <div className="p-4 bg-white rounded-lg border shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow duration-150 transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:shadow-none motion-reduce:transform-none">
        <div className="p-2 bg-amber-50 rounded-md">
          <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 12H8m8 0a4 4 0 01-8 0m8 0a4 4 0 00-8 0" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium">Email</div>
          <a href={`mailto:${email}`} className="text-olive-green hover:underline text-sm">{email}</a>
        </div>
      </div>

  <div className="p-4 bg-white rounded-lg border shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow duration-150 transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:shadow-none motion-reduce:transform-none">
        <div className="p-2 bg-indigo-50 rounded-md">
          <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13 21.314l-4.657-4.657A8 8 0 1117.657 16.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium">Address</div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer" className="text-olive-green hover:underline text-sm">{addressText}</a>
        </div>
      </div>

  <div className="p-4 bg-white rounded-lg border shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow duration-150 transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:shadow-none motion-reduce:transform-none">
        <div className="p-2 bg-gray-50 rounded-md">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium">Business hours</div>
          <div className="text-sm text-gray-600">Mon–Sat: 9:00 AM – 6:00 PM<br />Sun: Closed</div>
        </div>
      </div>

  <div className="p-4 bg-white rounded-lg border shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow duration-150 transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:shadow-none motion-reduce:transform-none">
        <div className="p-2 bg-gray-50 rounded-md">
          <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium">Delivery regions</div>
          <div className="text-sm text-gray-600">Delhi NCR, Gurugram, Noida (additional areas on request)</div>
        </div>
      </div>
    </div>
  );
}
