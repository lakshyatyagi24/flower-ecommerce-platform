"use client";
import React from "react";
import Image from "next/image";
import person1 from "../../../assets/person1.png";
import person2 from "../../../assets/person2.png";
import person3 from "../../../assets/person3.png";

const team = [
  { name: "Asha Verma", role: "Lead Florist", img: person1, bio: "Loves seasonal palettes and hand-tying techniques." },
  { name: "Ravi Patel", role: "Event Specialist", img: person2, bio: "Turns spaces into intimate floral experiences." },
  { name: "Mira Shah", role: "Studio Artisan", img: person3, bio: "Finds beauty in textures and unusual foliage." },
];

export default function Team() {
  return (
    <section aria-labelledby="meet-the-team" className="mb-12">
      <h2 id="meet-the-team" className="text-2xl font-semibold text-gray-900 mb-6">
        Meet the Team
      </h2>

      <p className="text-gray-600 mb-6">Our florists, artisans, and event specialists who bring the work to life.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((person) => (
          <div key={person.name} className="bg-white rounded-lg p-4 border flex space-x-4 items-center">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
              <Image src={person.img} alt={person.name} width={80} height={80} className="object-cover" />
            </div>

            <div>
              <h3 className="text-lg font-medium">{person.name}</h3>
              <p className="text-sm text-gray-500">{person.role}</p>
              <p className="text-sm text-gray-600 mt-2">{person.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
