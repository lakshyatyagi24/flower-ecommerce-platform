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
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-black/5 h-10 min-w-[150px]"
        aria-label={selectedCity ? `Deliver to ${selectedCity.name} ${selectedCity.pincode}` : 'Select location'}
      >
        <Image
          src="/india-flag.svg" // Placeholder flag
          alt="Country Flag"
          width={20}
          height={20}
          className="w-5 h-5 flex-shrink-0"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium hidden sm:inline">Deliver to</span>
          <span className="text-sm font-medium text-light-brown truncate">{selectedCity ? `${selectedCity.name} ${selectedCity.pincode}` : "Select Location"}</span>
        </div>
      </button>

      <div
        className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        <div className="p-2">
          <input
            type="text"
            placeholder="Search city..."
            className="w-full px-2 py-1 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ul className="py-1 max-h-60 overflow-auto">
          {filteredCities.map((city) => (
            <li
              key={city.name}
              onClick={() => handleCitySelect(city)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
            >
              {city.name}
              {selectedCity && selectedCity.name === city.name && (
                <Image
                  src="/checkmark.svg"
                  alt="Selected"
                  width={20}
                  height={20}
                  className="text-light-brown"
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LocationSelector;
