import { MessageCircle, Instagram, Facebook, Youtube, Linkedin, Twitter } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import KualaLumpur from '/src/assets/Kuala Lumpur.jpg';
import Nairobi from '/src/assets/Nairobi.jpg';
import Bangkok from '/src/assets/Bangkok.jpg';
import DaNang from '/src/assets/Da Nang.jpg';
import Perth from '/src/assets/Perth.jpeg';
import BaliDenpasar from '/src/assets/Bali Denpasar.jpg';
import LosAngeles from '/src/assets/Los Angeles.webp';
import Berlin from '/src/assets/Berlin.jpg';
import London from '/src/assets/London.jpeg';
import Moscow from '/src/assets/Moscow.jpg';
import Venice from '/src/assets/Venice.jpg';
import Toronto from '/src/assets/Toronto.webp';
import GooglePlaystore from '/src/assets/Google Playstore.png';
import AppStore from '/src/assets/App Store.png';
import AppGallery from '/src/assets/App Gallery.png';

const Home = () => {
  const navigate = useNavigate();

  const flightRecommendations = [
    { to: 'Kuala Lumpur', price: 'RM 1,971.38', image: KualaLumpur },
    { to: 'Nairobi', from: 'Bangkok', price: 'RM 1,310.83', image: Nairobi },
    { to: 'Bangkok', price: 'RM 139.53', image: Bangkok },
    { to: 'Da Nang', price: 'RM 209', image: DaNang },
    { to: 'Perth', price: 'RM 395', image: Perth},
    { to: 'Bali Denpasar', price: 'RM 3,218.84', image: BaliDenpasar },
    { to: 'Los Angeles', price: 'RM 3,218.84', image: LosAngeles },
    { to: 'Berlin', price: 'RM 3,218.84', image: Berlin },
    { to: 'London', price: 'RM 3,218.84', image: London },
    { to: 'Moscow', price: 'RM 3,218.84', image: Moscow },
    { to: 'Venice', price: 'RM 3,218.84', image: Venice },
    { to: 'Toronto', price: 'RM 3,218.84', image: Toronto },
  ];

  const features = [
    { title: 'Simplify Your Booking Experience', description: 'Feel the flexibility and simplicity throughout your booking process', icon: '📱' },
    { title: 'Wide Selections of Travel Product', description: 'Enjoy your memorable moments with millions of favorable flights and accommodations', icon: '🌍' },
    { title: 'Exclusive Offer Everyday', description: 'Various daily promo with competitive price for all travelers', icon: '💰' },
    { title: 'Online Booking Expert', description: "Together with our credible partners, fulfilling countless traveler's needs since 2011", icon: '✅' },
    { title: 'Affectionate Customer Support', description: 'Giving best assistance, our customer support is available 24/7 with your local language', icon: '💬' },
    { title: "World's Local Booking Excitement", description: 'Stress-free booking experience with local payment, currency, and language', icon: '🌎' }
  ];

  const popularFlights = [
    'Flight to Nairobi', 'Flight to Kuala Lumpur', 'Flight to Bali Denpasar',
    'Flight to Mombasa', 'Flight to Da Nang', 'Flight to Bangkok',
    'Flight to Singapore', 'Flight to Melbourne', 'Flight to Dubai',
    'Flight to Phuket', 'Flight to Hanoi', 'Flight to Osaka Kansai'
  ];

  const [cyclingImage, setCyclingImage] = useState(flightRecommendations[6]); // Start with Los Angeles
  const staticImages = flightRecommendations.slice(0, 5);

  useEffect(() => {
    const cyclingImages = flightRecommendations.slice(6);
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % cyclingImages.length;
      setCyclingImage(cyclingImages[currentIndex]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleFlightSelection = (flight) => {
    // Extract destination from flight string
    const destination = flight.replace('Flight to ', '');
    
    // Find the matching recommendation to get the price if available
    const recommendation = flightRecommendations.find(rec => rec.to === destination);
    const price = recommendation ? recommendation.price : 'To be determined';

    // Create a booking template based on the selected flight
    const newBooking = {
      id: `BK${Math.floor(Math.random() * 1000)}`,
      flightNumber: `PA${Math.floor(Math.random() * 1000)}`,
      from: 'Current Location',
      to: destination,
      date: '', // This could be set to a default future date
      passengers: 1,
      status: 'Pending',
      price: price
    };
    
    // Navigate to MyBookings with the selected flight data
    navigate('/MyBookings', { state: { newBooking } });
  };

  const handleRecommendationClick = (flight) => {
    const newBooking = {
      id: `BK${Math.floor(Math.random() * 1000)}`,
      flightNumber: `PA${Math.floor(Math.random() * 1000)}`,
      from: flight.from || 'Current Location',
      to: flight.to,
      date: '',
      passengers: 1,
      status: 'Pending',
      price: flight.price
    };
    
    navigate('/MyBookings', { state: { newBooking } });
  };

  // Combine static and cycling images
  const displayedRecommendations = [
    ...staticImages, 
    cyclingImage
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Flight Recommendations */}
      <section className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6">Exclusive Flight Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRecommendations.map((flight, index) => (
            <div 
              key={index} 
              onClick={() => handleRecommendationClick(flight)}
              className="block transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden cursor-pointer"
            >
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={flight.image} 
                  alt={flight.to} 
                  className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 animate-slide-left">
                  <p className="font-medium">Flight to {flight.to}</p>
                  {flight.from && <p className="text-sm">From {flight.from}</p>}
                  <p className="text-lg font-bold mt-1">Start from {flight.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto p-6">
          <h2 className="text-2xl font-semibold mb-8 text-center">Why must travel with Phoenix</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download */}
      <section className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto p-6 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">More Benefits in Phoenix App</h2>
            <div className="flex flex-col gap-2 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>App-only member deals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Easy order management</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <span>Real-time notifications</span>
              </div>
            </div>
            <div className="flex gap-4">
              <img src={GooglePlaystore} alt="Google Playstore" className="h-12" />
              <img src={AppStore} alt="App Store" className="h-12" />
              <img src={AppGallery} alt="App Gallery" className="h-12" />
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img src="/api/placeholder/300/600" alt="Mobile App" className="max-w-xs"/>
          </div>
        </div>
      </section>

      {/* Popular Flights */}
      <section className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6">Top Popular Flights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {popularFlights.map((flight, index) => (
            <button
              key={index}
              onClick={() => handleFlightSelection(flight)}
              className="text-left text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-300"
            >
              {flight}
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white mt-12 border-t">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Phoenix</h3>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-gray-600 hover:text-gray-800">About Us</a>
                <a href="#" className="text-gray-600 hover:text-gray-800">Promo</a>
                <a href="#" className="text-gray-600 hover:text-gray-800">Careers</a>
                <a href="#" className="text-gray-600 hover:text-gray-800">Blog</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-gray-600 hover:text-gray-800">Help Center</a>
                <a href="#" className="text-gray-600 hover:text-gray-800">Terms Of Use</a>
                <a href="#" className="text-gray-600 hover:text-gray-800">Privacy Policy</a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Follow us</h3>
              <div className="flex gap-4">
                <Instagram className="w-5 h-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
                <Facebook className="w-5 h-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
                <Twitter className="w-5 h-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
                <Youtube className="w-5 h-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
                <Linkedin className="w-5 h-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Our App</h3>
              <div className="flex flex-col gap-2">
                <img src={GooglePlaystore} alt="Google Playstore" className="h-12" />
                <img src={AppStore} alt="App Store" className="h-12" />
                <img src={AppGallery} alt="App Gallery" className="h-12" />
              </div>
            </div>
          </div>
          <div className="text-center text-gray-600 text-sm pt-4 border-t">
            Copyright 2024 Phoenix.com. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Chat Button */}
      <ChatWindow />
    </div>
  );
};

export default Home;