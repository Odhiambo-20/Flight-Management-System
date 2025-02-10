// pages/booking/Destinations.js
import React from 'react';
import { MapPin } from 'lucide-react';

const Destinations = () => {
  const destinations = [
    {
      region: 'Europe',
      cities: [
        { name: 'London', country: 'United Kingdom', price: 'from $299' },
        { name: 'Paris', country: 'France', price: 'from $329' },
        { name: 'Rome', country: 'Italy', price: 'from $349' },
        { name: 'Barcelona', country: 'Spain', price: 'from $279' }
      ]
    },
    {
      region: 'Asia',
      cities: [
        { name: 'Tokyo', country: 'Japan', price: 'from $699' },
        { name: 'Singapore', country: 'Singapore', price: 'from $599' },
        { name: 'Bangkok', country: 'Thailand', price: 'from $499' },
        { name: 'Seoul', country: 'South Korea', price: 'from $649' }
      ]
    },
    {
      region: 'Americas',
      cities: [
        { name: 'New York', country: 'USA', price: 'from $199' },
        { name: 'San Francisco', country: 'USA', price: 'from $249' },
        { name: 'Toronto', country: 'Canada', price: 'from $279' },
        { name: 'Mexico City', country: 'Mexico', price: 'from $299' }
      ]
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl text-navy-900 mb-4">Our Destinations</h1>
      <p className="text-gray-600 mb-8">
        Explore our extensive network of destinations across the globe.
      </p>

      {destinations.map((region, index) => (
        <div key={index} className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{region.region}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {region.cities.map((city, cityIndex) => (
              <div 
                key={cityIndex}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <img 
                  src={`/api/placeholder/400/200`}
                  alt={city.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{city.name}</h3>
                      <p className="text-gray-600">{city.country}</p>
                    </div>
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-red-600">{city.price}</p>
                  <button className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded">
                    View Flights
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
};

export default Destinations;