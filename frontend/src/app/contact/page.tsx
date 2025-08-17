"use client";
import React from "react";
import Image from "next/image";
import ContactHero from "./components/ContactHero";
import ContactForm from "./components/ContactForm";
import QuickContactDetails from "./components/QuickContactDetails";
import EventBookingShortcut from "./components/EventBookingShortcut";
import logo from "../../assets/logo.png";

export default function ContactPage() {
  return (
    <main className="max-w-screen-xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
  <ContactHero />

      {/* Contact form + map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section aria-labelledby="contact-form" className="bg-white rounded-lg shadow-sm p-6">
          <ContactForm />
        </section>

        <section aria-labelledby="map" className="rounded-lg overflow-hidden">
          <h2 id="map" className="sr-only">Our location</h2>

          <div className="w-full h-80 sm:h-96 relative">
            <iframe
              title="Our location"
              src="https://www.google.com/maps?q=New+Delhi,+India&z=12&output=embed"
              width="100%"
              height="100%"
              loading="lazy"
              className="border-0"
            />
          </div>

          <div className="p-4 bg-white border-t">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Image src={logo} alt="logo" width={40} height={40} className="object-contain" />
              </div>
              <div>
                <p className="font-medium">Flower Marketplace</p>
                <p className="text-sm text-gray-600">123 Floral Lane, San Francisco, CA</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Main full-width section: Event shortcut + quick details */}
      <div className="mt-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
              <EventBookingShortcut />
              <QuickContactDetails />
        </div>
      </div>
    </main>
  );
}
