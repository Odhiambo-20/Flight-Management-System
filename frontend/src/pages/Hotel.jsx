import React, { useState, useEffect } from 'react';
import { Calendar, Users, Search } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import hotel1 from '/src/assets/hotel-1.jpg';
import hotel2 from '/src/assets/hotel-2.jpg';
import hotel3 from '/src/assets/hotel-3.webp';
import hotel4 from '/src/assets/hotel-4.png';
import hotel5 from '/src/assets/hotel-5.jpg';

// API configuration
const API_URL = 'http://localhost:5000/api';

// Import all images using the public folder approach
const images = {
  hotel1: '/images/hotel-1.jpg',
  hotel2: '/images/hotel-2.jpg',
  hotel3: '/images/hotel-3.webp',
  hotel4: '/images/hotel-4.png',
  hotel5: '/images/hotel-5.jpg',
  luxuryRoom: '/images/luxury-room.jpg'
};

const Hotel = () => {
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    adults: '1',
    children: '0'
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending search criteria:', formData);
      const response = await axios.get(`${API_URL}/hotels/search`, {
        params: formData
      });

      console.log('Search response:', response.data);
      
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        setError('Failed to fetch results');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const amenities = [
    { icon: '👥', title: 'State-of-the-art Conference', description: 'Modern meeting facilities' },
    { icon: '🏋️', title: 'State-of-the-art Titan GYM', description: 'Premium fitness equipment' },
    { icon: '🏢', title: 'Smart Rooms & Facilities', description: 'Technology-enabled comfort' },
    { icon: '🍽️', title: 'Fine Modern Cuisine', description: 'Exquisite dining experience' },
    { icon: '🎉', title: 'Weddings & Event Spaces', description: 'Perfect celebration venues' },
    { icon: '🏊', title: 'Heated Swimming Pool', description: 'Year-round swimming' },
  ];

  const news = [
    {
      id: 1,
      category: 'Luxury Hotel',
      title: "Valentine's Joy",
      date: 'February 14, 2024',
      author: 'argyle',
      image: hotel1,
      price: 329,
      description: 'Enjoy breathtaking ocean views from our deluxe couple room with premium amenities.',
      amenities: ['Free WiFi', 'Room Service', 'King Size Bed', 'Balcony', 'Ocean View', 'Premium Toiletries']
    },

    {
      id: 2,
      category: 'Luxury Hotel',
      title: 'Plans for the year',
      date: 'January 11, 2024',
      author: 'argyle',
      image: hotel2,
      price: 299,
      description: 'Experience the ultimate romantic getaway in our luxurious Valentine suite with panoramic city views and premium amenities.',
      amenities: ['Free WiFi', 'Room Service', 'King Size Bed', 'Jacuzzi', 'City View', 'Mini Bar']
    },
    
    {
      id: 3,
      category: 'Couple Room',
      title: 'The Grand Opening',
      date: 'December 15, 2023',
      author: 'argyle',
      image: hotel3,
      price: 399,
      description: 'Start your year in style with our premium executive penthouse featuring modern design and exclusive services.',
      amenities: ['Free WiFi', 'Room Service', 'King Size Bed', 'Mini Bar', 'Ocean View', 'Private Terrace']
    },

    {
      id: 4,
      category: 'Couple Room',
      title: 'The Grand Opening',
      date: 'December 15, 2023',
      author: 'argyle',
      image: hotel4,
      price: 259,
      description: 'Perfect for romantic getaways, our honeymoon suite offers intimate spaces and luxury amenities.',
      amenities: ['Free WiFi', 'Room Service', 'Queen Size Bed', 'Bathtub', 'Garden View', 'Breakfast Included']
    },

    {
      id: 5,
      category: 'Couple Room',
      title: 'The Grand Opening',
      date: 'December 15, 2023',
      author: 'argyle',
      image: hotel5,
      price: 329,
      description: 'Enjoy breathtaking ocean views from our deluxe couple room with premium amenities.',
      amenities: ['Free WiFi', 'Room Service', 'King Size Bed', 'Balcony', 'Ocean View', 'Premium Toiletries']
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Booking Section */}
      <div className="bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm mb-2">Booking</p>
          <h1 className="text-4xl mb-8">Check availability & Book Your Room</h1>
          
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block mb-2">Check-in</label>
              <div className="flex items-center border p-2 rounded">
                <Calendar className="w-5 h-5 mr-2" />
                <input
                  type="date"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  className="bg-transparent w-full"
                  required
                />
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block mb-2">Check-out</label>
              <div className="flex items-center border p-2 rounded">
                <Calendar className="w-5 h-5 mr-2" />
                <input
                  type="date"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  className="bg-transparent w-full"
                  required
                />
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block mb-2">Adults</label>
              <div className="flex items-center border p-2 rounded">
                <Users className="w-5 h-5 mr-2" />
                <select
                  name="adults"
                  value={formData.adults}
                  onChange={handleInputChange}
                  className="bg-transparent w-full"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block mb-2">Children</label>
              <div className="flex items-center border p-2 rounded">
                <Users className="w-5 h-5 mr-2" />
                <select
                  name="children"
                  value={formData.children}
                  onChange={handleInputChange}
                  className="bg-transparent w-full"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`bg-white text-black px-6 py-2 rounded flex items-center transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <Search className="w-5 h-5 mr-2" />
              {isLoading ? 'Searching...' : 'Search Now'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500 text-white rounded">
              {error}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl mb-4">Available Rooms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((room) => (
                  <div key={room.id} className="bg-white text-gray-900 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-semibold">{room.type}</h3>
                    <p className="mt-2 text-gray-600">Room Number: {room.roomNumber}</p>
                    <p className="text-lg font-bold mt-2">${room.price} per night</p>
                    {room.description && (
                      <p className="mt-2 text-gray-600">{room.description}</p>
                    )}
                    

                    <Link to="/HotelBooking"
                    state={{ hotelId: item.id, hotel: item }}
                    key={index}
                    className="bg-gray-600 text-white px-4 py-2 rounded mt-2">
                          Book Now
                    </Link>
                    
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchResults.length === 0 && !isLoading && !error && (
            <div className="mt-4 text-gray-300">
              No rooms available for the selected criteria. Try different dates.
            </div>
          )}
        </div>
      </div>

      {/* Amenities Section */}
      <div className="py-16 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {amenities.map((amenity, index) => (
            <div key={index} className="text-center p-6 bg-white shadow-lg rounded-lg">
              <div className="text-4xl mb-4">{amenity.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{amenity.title}</h3>
              <p className="text-gray-600">{amenity.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* News Section */}
      {/* News Section */}
<div className="py-16 px-8 bg-gray-100">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl mb-8">Latest News & Updates</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {news.map((item, index) => (
        <Link 
          to="/HotelBooking" 
          state={{ hotelId: item.id, hotel: item }}
          key={index} 
          className="block transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="relative overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
              />
              <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-2">{item.category}</p>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">
                {item.date} by {item.author}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
</div>
  
    </div>
  );
};

export default Hotel;