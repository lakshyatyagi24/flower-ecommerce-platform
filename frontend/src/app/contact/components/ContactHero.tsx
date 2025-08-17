"use client";
import React from "react";
import Image from "next/image";
import heroImg from "../../../assets/slider3.png";

export default function ContactHero() {
  return (
    <section className="bg-rose-50 rounded-lg overflow-hidden mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6">
        <div className="p-8 sm:p-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Let&apos;s Connect</h1>
          <p className="mt-4 text-lg text-gray-700">Have a question or want to plan a floral event? We are here for you.</p>
          <p className="mt-2 text-gray-600">Send us a note and we will respond as soon as possible.</p>
        </div>

        <div className="relative h-56 sm:h-72 lg:h-80">
          <Image
            src={heroImg}
            alt="Rustic floral illustration"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
