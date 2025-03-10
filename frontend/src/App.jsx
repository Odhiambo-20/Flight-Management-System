import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Promo from "./pages/Promo";
import SignUp from "./pages/SignUp";
import Header from "./components/Header";
import Home from "./pages/Home";
import Flight from "./pages/Flight";
import Ask from "./pages/Ask";
import Hotel from "./pages/Hotel";
import FlightBooking from "./pages/FlightBooking";
import Destinations from "./pages/Destinations";
import FlightSchedules from "./pages/FlightSchedules";
import MyBookings from "./pages/MyBookings";
import Search from "./pages/Search";
import HotelBooking from "./pages/HotelBooking";
import Airpay from "./pages/Airpay";
import CheckIn from "./pages/checkin";
import ChatWindow from "./components/ChatWindow";
import AdminDashboard from "./pages/Admin";
import BookingConfirmation from "./pages/BookingConfirmation";

function App() {
 return (
   <BrowserRouter>
     <Header />
     <Routes>
       <Route path="/" element={<Navigate to="/home" />} />
       <Route path="/home" element={<Home />} />
       <Route path="/signin" element={<SignIn />} />
       <Route path="/promo" element={<Promo />} />
       <Route path="/hotel" element={<Hotel />} />
       <Route path="/signup" element={<SignUp />} />
       <Route path="/flight" element={<Flight />} />
       <Route path="/ask" element={<Ask />} />
       <Route path="/search" element={<Search />} />
       <Route path="/flightbooking" element={<FlightBooking />} /> 
       <Route path="/destination" element={<Destinations />} /> 
       <Route path="/flightschedules" element={<FlightSchedules />} /> 
       <Route path="/mybookings" element={<MyBookings />} /> 
       <Route path="/hotelbooking" element={<HotelBooking />} />
       <Route path="/admin" element={<AdminDashboard/>} />
       <Route path="/payment" element={<Airpay />} />
       <Route path="/checkin" element={<CheckIn />} />
       <Route path="/booking-confirmation" element={<BookingConfirmation />} />
     </Routes>
     <ChatWindow/>
   </BrowserRouter>
 );
}

export default App;