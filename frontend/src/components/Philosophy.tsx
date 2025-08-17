"use client";
import React from "react";
import Image from "next/image";

export default function Philosophy() {
  return (
    <section aria-labelledby="our-philosophy" className="mb-12">
      <h2 id="our-philosophy" className="text-2xl font-semibold text-gray-900 mb-6">
        Our Philosophy
      </h2>

      <p className="text-gray-600 mb-6">Design principles that guide every bouquet we make.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
          <div className="flex-shrink-0">
            <Image src="/checkmark.svg" alt="Natural Beauty" width={48} height={48} />
          </div>
          <div>
            <h3 className="text-lg font-medium">Natural Beauty</h3>
            <p className="text-sm text-gray-600">We favor seasonal blooms and honest textures.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
          <div className="flex-shrink-0">
            <Image src="/file.svg" alt="Craftsmanship" width={48} height={48} />
          </div>
          <div>
            <h3 className="text-lg font-medium">Craftsmanship</h3>
            <p className="text-sm text-gray-600">Hand-tied arrangements made with practiced techniques.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
          <div className="flex-shrink-0">
            <Image src="/globe.svg" alt="Sustainability" width={48} height={48} />
          </div>
          <div>
            <h3 className="text-lg font-medium">Sustainability</h3>
            <p className="text-sm text-gray-600">Thoughtful sourcing and minimal waste practices.</p>
          </div>
        </div>

        <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
          <div className="flex-shrink-0">
            <Image src="/user-icon.svg" alt="Artisanal" width={48} height={48} />
          </div>
          <div>
            <h3 className="text-lg font-medium">Artisanal</h3>
            <p className="text-sm text-gray-600">Meaningful, human-made details in every bouquet.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
