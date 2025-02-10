import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plane, CalendarDays, User } from 'lucide-react';

const CheckIn = () => {
  const [bookingRef, setBookingRef] = useState('');
  const [lastName, setLastName] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (bookingRef && lastName) {
      setShowError(false);
      // Handle check-in logic here
    } else {
      setShowError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Plane className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Online Check-in</h1>
            <p className="text-gray-500">Check in for your flight and get your boarding pass</p>
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Details</CardTitle>
            <CardDescription>
              Please enter your booking reference and last name to check in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bookingRef">Booking Reference</Label>
                <Input
                  id="bookingRef"
                  placeholder="Enter your 6-digit booking reference"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter passenger's last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full"
                />
              </div>

              {showError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please fill in all required fields to proceed with check-in
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                Check In Now
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Check-in Window</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Online check-in opens 48 hours before departure and closes 1 hour before the flight
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Contact our support team if you're having trouble checking in
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;