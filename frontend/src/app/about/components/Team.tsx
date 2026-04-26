"use client";

import React from "react";

const team = [
  {
    name: "Asha Verma",
    role: "Catalog Operations Lead",
    initials: "AV",
    bio: "Coordinates product data quality and release accuracy across categories.",
  },
  {
    name: "Ravi Patel",
    role: "Event Fulfillment Specialist",
    initials: "RP",
    bio: "Supports bulk orders and event delivery coordination with partner teams.",
  },
  {
    name: "Mira Shah",
    role: "Customer Experience Manager",
    initials: "MS",
    bio: "Manages support loops for order tracking, substitutions, and delivery communication.",
  },
];

export default function Team() {
  return (
    <section aria-labelledby="meet-the-team" className="mb-12">
      <h2 id="meet-the-team" className="text-2xl font-semibold text-gray-900 mb-6">
        Meet the Team
      </h2>

      <p className="text-gray-600 mb-6">
        A focused operations team behind product accuracy, customer support, and reliable fulfillment.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((person) => (
          <div key={person.name} className="bg-white rounded-lg p-4 border flex space-x-4 items-center">
            <div className="w-20 h-20 rounded-full bg-olive-green/15 flex items-center justify-center text-olive-green font-semibold flex-shrink-0">
              {person.initials}
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
