import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Plane, 
  Hotel, 
  BarChart as BarChartIcon, 
  RefreshCcw, 
  Clock,
  Globe,
  CreditCard 
} from 'lucide-react';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker, Line as MapLine } from 'react-simple-maps';
import PropTypes from 'prop-types';
import worldGeoData from '../assets/world-110m.json';

const RealTimeDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    activeFlights: 0,
    occupiedHotels: 0,
    totalRevenue: 0,
    bookingTrends: [],
    hotelOccupancy: [],
    revenueByRegion: [],
    recentBookings: [],
    recentPayments: [],
    flightRoutes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [mapData, setMapData] = useState(null);

  // Create axios instance with cache-busting headers
  const api = axios.create({
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  // Add timestamp to URL to prevent caching
  const noCacheUrl = (url) => `${url}?_=${new Date().getTime()}`;

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch data from multiple endpoints with cache-busting
      const [
        activeFlightsResponse,
        occupiedHotelsResponse,
        revenueResponse,
        bookingTrendsResponse,
        hotelOccupancyResponse,
        revenueByRegionResponse,
        recentBookingsResponse,
        recentPaymentsResponse,
        flightRoutesResponse
      ] = await Promise.all([
        api.get(noCacheUrl('/api/flights/active')),
        api.get(noCacheUrl('/api/hotels/occupied')),
        api.get(noCacheUrl('/api/revenue/total')),
        api.get(noCacheUrl('/api/bookings/trends')),
        api.get(noCacheUrl('/api/hotels/occupancy')),
        api.get(noCacheUrl('/api/revenue/regions')),
        api.get(noCacheUrl('/api/bookings/recent')),
        api.get(noCacheUrl('/api/payments/recent')),
        api.get(noCacheUrl('/api/flights/routes'))
      ]);

      console.log('Flight routes data:', flightRoutesResponse.data);

      // Check if flight routes data is valid
      const flightRoutes = flightRoutesResponse.data.flightRoutes || [];
      if (flightRoutes.length === 0) {
        console.warn('No flight routes data available');
      } else {
        // Verify each route has valid coordinates
        const validRoutes = flightRoutes.filter(route => 
          route.coordinates && 
          route.coordinates.origin && 
          route.coordinates.destination &&
          Array.isArray(route.coordinates.origin) && 
          Array.isArray(route.coordinates.destination) &&
          route.coordinates.origin.length === 2 &&
          route.coordinates.destination.length === 2
        );
        
        if (validRoutes.length < flightRoutes.length) {
          console.warn(`Filtered out ${flightRoutes.length - validRoutes.length} invalid flight routes`);
        }
        
        // Replace with validated routes
        flightRoutesResponse.data.flightRoutes = validRoutes;
      }

      // Combine all fetched data with default empty arrays/values
      const combinedData = {
        activeFlights: activeFlightsResponse.data.activeFlights || 0,
        occupiedHotels: occupiedHotelsResponse.data.occupiedHotels || 0,
        totalRevenue: revenueResponse.data.totalRevenue || 0,
        bookingTrends: bookingTrendsResponse.data.bookingTrends || [],
        hotelOccupancy: hotelOccupancyResponse.data.hotelOccupancy || [],
        revenueByRegion: revenueByRegionResponse.data.revenueByRegion || [],
        recentBookings: recentBookingsResponse.data.recentBookings || [],
        recentPayments: recentPaymentsResponse.data.recentPayments || [],
        flightRoutes: flightRoutesResponse.data.flightRoutes || []
      };

      setDashboardData(combinedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setError('Failed to load real-time dashboard data. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Separate function to fetch map data to handle potential issues
  const loadMapData = useCallback(async () => {
    try {
      // If we already have map data, don't reload it
      if (mapData) return;
      
      // If using dynamic import, you might need something like this:
      // const response = await fetch(noCacheUrl('../assets/world-110m.json'));
      // const data = await response.json();
      // setMapData(data);
      
      // Or simply validate the imported data
      if (!worldGeoData || !worldGeoData.objects) {
        throw new Error('Invalid GeoJSON data');
      }
      
      setMapData(worldGeoData);
      setMapError(false);
    } catch (error) {
      console.error('Failed to load map data', error);
      setMapError(true);
    }
  }, [mapData]);

  useEffect(() => {
    // Load map data when component mounts
    loadMapData();
    
    // Initial data fetch
    fetchDashboardData();
    
    // Set up interval for periodic refreshes
    const interval = setInterval(fetchDashboardData, refreshInterval * 1000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [fetchDashboardData, loadMapData, refreshInterval]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Safe number formatting
  const formatNumber = (num) => {
    return num && typeof num === 'number' ? num.toLocaleString() : '0';
  };

  // Safe array length check
  const safeArrayLength = (arr) => {
    return Array.isArray(arr) ? arr.length : 0;
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading real-time dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
        <button 
          onClick={fetchDashboardData}
          className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Real-Time Travel Management Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-gray-500" />
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
            </select>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <Plane className="mr-4 text-blue-500" />
          <div>
            <p className="text-gray-500">Active Flights</p>
            <h2 className="text-2xl font-bold">{formatNumber(dashboardData.activeFlights)}</h2>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <Hotel className="mr-4 text-green-500" />
          <div>
            <p className="text-gray-500">Occupied Hotels</p>
            <h2 className="text-2xl font-bold">{formatNumber(dashboardData.occupiedHotels)}</h2>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <BarChartIcon className="mr-4 text-purple-500" />
          <div>
            <p className="text-gray-500">Total Revenue</p>
            <h2 className="text-2xl font-bold">${formatNumber(dashboardData.totalRevenue)}</h2>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <CreditCard className="mr-4 text-indigo-500" />
          <div>
            <p className="text-gray-500">Recent Payments</p>
            <h2 className="text-2xl font-bold">{safeArrayLength(dashboardData.recentPayments)}</h2>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Booking Trends */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Booking Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.bookingTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="flights" fill="#8884d8" />
              <Bar dataKey="hotels" fill="#82ca9d" />
              <Bar dataKey="packages" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hotel Occupancy */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Hotel Occupancy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.hotelOccupancy || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hotel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="occupancy" fill="#8884d8">
                {(dashboardData.hotelOccupancy || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Region */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Revenue by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.revenueByRegion || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {(dashboardData.revenueByRegion || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `$${formatNumber(props.payload.revenue)}`, 
                  props.payload.region
                ]}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry) => {
                  const payload = entry?.payload;
                  return payload 
                    ? `${payload.region}: $${formatNumber(payload.revenue)}` 
                    : '';
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flight Routes World Map */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Globe className="mr-2 text-green-500" />
          Global Flight Routes
          {dashboardData.flightRoutes.length === 0 && !mapError && (
            <span className="ml-2 text-sm text-yellow-500">
              (No route data available)
            </span>
          )}
        </h3>
        {mapError ? (
          <div className="text-center p-8 text-red-500">
            Unable to load map data. Please try again later.
            <button 
              onClick={loadMapData}
              className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Retry Loading Map
            </button>
          </div>
        ) : !mapData ? (
          <div className="text-center p-8 text-gray-500">
            Loading map data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposableMap 
              projection="geoMercator"
              onError={() => {
                console.error('Error rendering map');
                setMapError(true);
              }}
            >
              <Geographies geography={mapData}>
                {({ geographies }) => 
                  geographies.map(geo => (
                    <Geography 
                      key={geo.rsmKey} 
                      geography={geo}
                      fill="#EAEAEC"
                      stroke="#D6D6DA"
                    />
                  ))
                }
              </Geographies>
              {dashboardData.flightRoutes.length > 0 && dashboardData.flightRoutes.map((route, index) => {
                // Skip invalid routes
                if (!route.coordinates || 
                    !route.coordinates.origin || 
                    !route.coordinates.destination ||
                    !Array.isArray(route.coordinates.origin) ||
                    !Array.isArray(route.coordinates.destination) ||
                    route.coordinates.origin.length !== 2 ||
                    route.coordinates.destination.length !== 2) {
                  console.warn('Skipping invalid route:', route);
                  return null;
                }
                
                return (
                  <React.Fragment key={`route-${index}`}>
                    <Marker coordinates={route.coordinates.origin}>
                      <circle r={3} fill="#FF5533" />
                    </Marker>
                    <Marker coordinates={route.coordinates.destination}>
                      <circle r={3} fill="#FF5533" />
                    </Marker>
                    <MapLine
                      from={route.coordinates.origin}
                      to={route.coordinates.destination}
                      stroke="#FF5533"
                      strokeWidth={2}
                      strokeOpacity={0.6}
                    />
                  </React.Fragment>
                );
              })}
            </ComposableMap>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Bookings and Payments */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-left">Customer</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(dashboardData.recentBookings || []).map((booking, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{booking.type || 'N/A'}</td>
                    <td className="py-2">{booking.customerName || 'Unknown'}</td>
                    <td className="py-2 text-right">${formatNumber(booking.amount)}</td>
                  </tr>
                ))}
                {(dashboardData.recentBookings || []).length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">
                      No recent bookings available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Transaction ID</th>
                  <th className="py-2 text-left">Method</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(dashboardData.recentPayments || []).map((payment, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{payment.transactionId || 'N/A'}</td>
                    <td className="py-2">{payment.method || 'Unknown'}</td>
                    <td className="py-2 text-right">${formatNumber(payment.amount)}</td>
                  </tr>
                ))}
                {(dashboardData.recentPayments || []).length === 0 && (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">
                      No recent payments available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Prop type validation (optional but recommended)
RealTimeDashboard.propTypes = {
  initialRefreshInterval: PropTypes.number
};

export default RealTimeDashboard;