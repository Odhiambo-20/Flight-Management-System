import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Calendar, CreditCard, Plane, Hotel, Gift, Package, User, AlertCircle, HelpCircle } from 'lucide-react';

const Ask = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const popularTopics = [
    {
      title: "Check Booking Status?",
      description: "View your trip status online and receive confirmation.",
      icon: <Plane className="w-12 h-12 text-blue-500" />,
      route: '/mybookings',
      keywords: ['booking', 'status', 'trip', 'confirmation']
    },
    {
      title: "Check Refund and Credit details?",
      description: "View your refund/credit details and check status online.",
      icon: <CreditCard className="w-12 h-12 text-green-500" />,
      route: '/payment',
      keywords: ['refund', 'credit', 'payment', 'details']
    },
    {
      title: "Want to Check-in?",
      description: "Get assistance on flight Checkin and Boarding Pass",
      icon: <Calendar className="w-12 h-12 text-purple-500" />,
      route: '/checkin',
      keywords: ['check-in', 'boarding', 'pass', 'flight']
    },
    {
      title: "Help with New Bookings?",
      description: "Get assistance to make a new booking.",
      icon: <Package className="w-12 h-12 text-orange-500" />,
      route: '/mybookings',
      keywords: ['new', 'booking', 'help', 'assistance']
    },
    {
      title: "Want to Cancel your trip?",
      description: "Get assistance to cancel your booking",
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
      route: '/mybookings',
      keywords: ['cancel', 'trip', 'booking', 'refund']
    },
    {
      title: "Payment Issues?",
      description: "Receive Payment Information and assistance on other billing queries.",
      icon: <HelpCircle className="w-12 h-12 text-yellow-500" />,
      route: '/payment',
      keywords: ['payment', 'billing', 'issues', 'help']
    }
  ];

  const sidebarItems = [
    "Book a New Flight", 
    "Existing Flight Reservations", 
    "Refund, Credit and Payment Queries", 
    "Hotel and Cars", 
    "Promotion, Rewards & Gift Cards", 
    "Add-ons", 
    "Account and Login",
    "Covid-19 & Travel Restrictions", 
    "Special Assistance"
  ];

  const sidebarIcons = {
    "Book a New Flight": <Plane className="w-5 h-5" />,
    "Hotel and Cars": <Hotel className="w-5 h-5" />,
    "Promotion, Rewards & Gift Cards": <Gift className="w-5 h-5" />,
    "Account and Login": <User className="w-5 h-5" />
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query) {
      setSearchResults([]);
      return;
    }

    // Search through popular topics and sidebar items
    const topicResults = popularTopics.filter(topic => 
      topic.keywords.some(keyword => 
        keyword.toLowerCase().includes(query.toLowerCase()) ||
        topic.title.toLowerCase().includes(query.toLowerCase()) ||
        topic.description.toLowerCase().includes(query.toLowerCase())
    ));

    const sidebarResults = sidebarItems.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    );

    // Combine and deduplicate results
    const combinedResults = [
      ...topicResults,
      ...sidebarResults.map(item => ({ title: item }))
    ];

    setSearchResults(combinedResults);
  };

  const handleSearchResultClick = (result) => {
    // If result is a popular topic, navigate to its route
    const topic = popularTopics.find(t => t.title === result.title);
    if (topic) {
      navigate(topic.route);
      return;
    }

    // If result is a sidebar item, handle navigation
    switch(result.title) {
      case "Book a New Flight":
        navigate('/mybookings');
        break;
      case "Refund, Credit and Payment Queries":
        navigate('/payment');
        break;
      case "Hotel and Cars":
        navigate('/hotelbooking');
        break;
      case "Promotion, Rewards & Gift Cards":
        navigate('/promo');
        break;
      case "Account and Login":
        navigate('/signin');
        break;
      default:
        // If no specific route, you might want to show a generic help page
        navigate('/help');
    }
  };

  const handleSidebarItemClick = (item) => {
    switch(item) {
      case "Book a New Flight":
        navigate('/mybookings');
        break;
      case "Refund, Credit and Payment Queries":
        navigate('/payment');
        break;
      case "Hotel and Cars":
        navigate('/hotelbooking');
        break;
      case "Promotion, Rewards & Gift Cards":
        navigate('/promo');
        break;
      case "Account and Login":
        navigate('/signin');
        break;
      default:
        navigate('/help');
    }
  };

  const handlePopularTopicClick = (route) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-8 flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-gradient-to-r from-gray-400 to-gray-800 text-white p-6 rounded-lg mb-4 transform transition-transform hover:scale-102">
              <h2 className="text-2xl font-bold mb-2">Need Assistance</h2>
              <p className="text-blue-100">Get the help you need online now</p>
            </div>
            
            <div className="space-y-2">
              {sidebarItems.map((item, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between group"
                  onClick={() => handleSidebarItemClick(item)}
                >
                  <div className="flex items-center gap-3">
                    {sidebarIcons[item] || <ChevronRight className="w-5 h-5 text-gray-400" />}
                    <span className="group-hover:text-blue-600 transition-colors">{item}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            {/* Search Bar */}
            <div className="relative mb-8 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="What can we help you with?" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full p-4 pl-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-lg"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white shadow-lg rounded-lg mt-2 max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div 
                      key={index} 
                      onClick={() => handleSearchResultClick(result)}
                      className="p-4 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    >
                      {result.title}
                      {result.description && (
                        <p className="text-sm text-gray-500">{result.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popular Topics */}
            <h2 className="text-3xl font-bold mb-6">Popular Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {popularTopics.map((topic, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePopularTopicClick(topic.route)}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
                >
                  <div className="mb-4">{topic.icon}</div>
                  <h3 className="font-bold text-xl mb-3">{topic.title}</h3>
                  <p className="text-gray-600">{topic.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ask;