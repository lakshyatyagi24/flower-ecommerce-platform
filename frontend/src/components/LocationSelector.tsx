"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface City {
  name: string;
  pincode: string;
}

const cities: City[] = [
  { name: "Delhi", pincode: "110001" },
  { name: "Mumbai", pincode: "400001" },
  { name: "Bangalore", pincode: "560001" },
  { name: "Kolkata", pincode: "700001" },
  { name: "Chennai", pincode: "600001" },
];

const LocationSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate fetching user's current location
    // In a real application, you would use navigator.geolocation
    // and a reverse geocoding API to get the city and pincode.
    setSelectedCity(cities[0]); // Set Delhi as default
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-black/10"
      >
        <Image
          src="/india-flag.svg" // Placeholder flag
          alt="Country Flag"
          width={24}
          height={24}
        />
        <div>
          <span className="text-xs font-bold">Deliver to</span>
          <p className="text-sm font-medium text-light-brown">
            {selectedCity ? `${selectedCity.name} ${selectedCity.pincode}` : "Select Location"}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <ul className="py-1">
            {cities.map((city) => (
              <li
                key={city.name}
                onClick={() => handleCitySelect(city)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                {city.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
