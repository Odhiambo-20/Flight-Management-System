import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Caption from '/src/assets/Caption.jpg';
import Paris1 from '/src/assets/Paris1.jpg';
import Kolkata from '/src/assets/kolkata.jpeg';
import AirCharterCover from '/src/assets/airchartercover.jpeg';
import Phoenix from '/src/assets/phoenix.jpg';

const Promo = () => {
  const navigate = useNavigate();
  const [promoType, setPromoType] = useState('All');

  const promotions = [
    {
      id: 1,
      title: "Time For Memorable Journeys",
      description: "From familiar sights to dazzling new heights, discover the world with phoenix Airlines this New Year",
      deadline: "Book by 22 January 2025",
      image: Caption,
      type: 'Flights',
      route: '/flight-deals'
    },
    {
      id: 2,
      title: "Paris | New Route",
      description: "Step into ,Paris where every moment is a dream come true. Fly from MYR 3,699 all-in return, with up to 7x weekly flights.",
      status: "On Sale Now!",
      startDate: "Starting 22 Mar 2025",
      image: Paris1,
      type: 'Flights',
      route: '/flight-deals'
    },
    {
      id: 3,
      title: "Kolkata | New Route",
      description: "Immerse yourself in rich culture and history, starting 2 Dec 2024.",
      status: "On Sale Now!",
      image: Kolkata,
      type: 'Flights',
      route: '/flight-deals'
    },
    {
      id: 4,
      title: "MHflypass ASEAN",
      description: "Enjoy travel passes like MHflypass ASEAN for flexible travelling. Purchase to earn Enrich Points and rewards.",
      status: "On Sale Now!",
      image: AirCharterCover,
      type: 'Packages',
      route: '/travel-packages'
    }
  ];

  const filteredPromotions = promoType === 'All'
    ? promotions
    : promotions.filter(promo => promo.type === promoType);

  const handleExploreClick = (route) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/api/placeholder/1920/500')` }}>
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-4">Travel to two cities for<br />the price of one.</h1>
              <p className="text-xl mb-8">Enjoy a bonus return flight to one of<br />seven destinations in Malaysia.</p>
              <p className="text-sm">T&Cs apply</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Explore our exclusive deals for your next trip.</h2>
        
        {/* Filter */}
        <div className="mb-8">
          <select
            value={promoType}
            onChange={(e) => setPromoType(e.target.value)}
            className="w-full max-w-xs p-2 border border-gray-300 rounded-md"
          >
            <option value="All">All</option>
            <option value="Flights">Flights</option>
            <option value="Packages">Packages</option>
          </select>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPromotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
              <img src={promo.image} alt={promo.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{promo.title}</h3>
                {promo.deadline && (
                  <p className="text-sm text-gray-600 mb-2">{promo.deadline}</p>
                )}
                {promo.status && (
                  <p className="text-sm text-blue-600 mb-2">{promo.status}</p>
                )}
                <p className="text-gray-700 mb-4">{promo.description}</p>
                <button
                  onClick={() => handleExploreClick(promo.route)}
                  className="text-blue-600 font-semibold hover:text-blue-800"
                >
                  Expore →
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>l

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-12">
        {/* Footer content remains the same */}
      </footer>
    </div>
  );
};

export default Promo;