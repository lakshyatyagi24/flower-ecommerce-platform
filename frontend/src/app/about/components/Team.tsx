"use client";
import React from "react";
import Image from "next/image";
import person1 from "../../../assets/person1.png";
import person2 from "../../../assets/person2.png";
import person3 from "../../../assets/person3.png";

const team = [
  {
    name: "Asha Verma",
    role: "Head Florist",
    img: person1,
    bio: "15 years of experience creating hand-tied bouquets and signature arrangements for weddings and events across Bangalore.",
  },
  {
    name: "Ravi Patel",
    role: "Farm Relations & Sourcing",
    img: person2,
    bio: "Works directly with growers in Karnataka, Pune and Tamil Nadu to source the freshest stems at the best value.",
  },
  {
    name: "Mira Shah",
    role: "Creative Director",
    img: person3,
    bio: "Designs seasonal collections and curates colour palettes that feel current, honest, and rooted in the natural world.",
  },
];

export default function Team() {
  return (
    <section aria-labelledby="meet-the-team" className="mb-14">
      <div className="pill mb-3">The people behind the blooms</div>
      <h2 id="meet-the-team" className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight mb-2">
        Meet the Team
      </h2>
      <p className="text-slate-600 mb-6 text-sm">Our florists, sourcing specialists, and creatives who make every delivery possible.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.map((person) => (
          <div key={person.name} className="section-card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow duration-200">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
              <Image src={person.img} alt={person.name} width={64} height={64} className="object-cover w-full h-full" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{person.name}</h3>
              <p className="text-xs text-olive-green font-medium uppercase tracking-wide mt-0.5">{person.role}</p>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{person.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
