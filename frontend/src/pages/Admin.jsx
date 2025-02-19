import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Edit, Hotel, Plane } from 'lucide-react';

const AdminDashboard = () => {
  // Sample data - in a real app, this would come from an API
  const [flights, setFlights] = useState([
    { id: 1, from: 'New York', to: 'London', date: '2025-03-01', capacity: 200, available: 150 },
    { id: 2, from: 'London', to: 'Paris', date: '2025-03-02', capacity: 180, available: 80 }
  ]);

  const [hotels, setHotels] = useState([
    { id: 1, name: 'Grand Hotel', location: 'London', rooms: 50, available: 15, price: 200 },
    { id: 2, name: 'City View', location: 'Paris', rooms: 100, available: 45, price: 150 }
  ]);

  const [newFlight, setNewFlight] = useState({
    from: '', to: '', date: '', capacity: ''
  });

  const [newHotel, setNewHotel] = useState({
    name: '', location: '', rooms: '', price: ''
  });

  const addFlight = () => {
    setFlights([...flights, { 
      id: flights.length + 1, 
      ...newFlight, 
      available: newFlight.capacity 
    }]);
    setNewFlight({ from: '', to: '', date: '', capacity: '' });
  };

  const addHotel = () => {
    setHotels([...hotels, { 
      id: hotels.length + 1, 
      ...newHotel, 
      available: newHotel.rooms 
    }]);
    setNewHotel({ name: '', location: '', rooms: '', price: '' });
  };

  const updateHotelAvailability = (id, newAvailable) => {
    setHotels(hotels.map(hotel => 
      hotel.id === id ? { ...hotel, available: newAvailable } : hotel
    ));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Travel Admin Dashboard</h1>
      
      <Tabs defaultValue="flights" className="space-y-6">
        <TabsList>
          <TabsTrigger value="flights" className="flex items-center gap-2">
            <Plane className="w-4 h-4" /> Flights
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Hotel className="w-4 h-4" /> Hotels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle>Flight Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-6">
                <Input
                  placeholder="From"
                  value={newFlight.from}
                  onChange={e => setNewFlight({...newFlight, from: e.target.value})}
                />
                <Input
                  placeholder="To"
                  value={newFlight.to}
                  onChange={e => setNewFlight({...newFlight, to: e.target.value})}
                />
                <Input
                  type="date"
                  value={newFlight.date}
                  onChange={e => setNewFlight({...newFlight, date: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Capacity"
                  value={newFlight.capacity}
                  onChange={e => setNewFlight({...newFlight, capacity: e.target.value})}
                />
                <Button onClick={addFlight} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Flight
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flights.map(flight => (
                    <TableRow key={flight.id}>
                      <TableCell>{flight.from}</TableCell>
                      <TableCell>{flight.to}</TableCell>
                      <TableCell>{flight.date}</TableCell>
                      <TableCell>{flight.capacity}</TableCell>
                      <TableCell>{flight.available}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-6">
                <Input
                  placeholder="Hotel Name"
                  value={newHotel.name}
                  onChange={e => setNewHotel({...newHotel, name: e.target.value})}
                />
                <Input
                  placeholder="Location"
                  value={newHotel.location}
                  onChange={e => setNewHotel({...newHotel, location: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Total Rooms"
                  value={newHotel.rooms}
                  onChange={e => setNewHotel({...newHotel, rooms: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Price per Night"
                  value={newHotel.price}
                  onChange={e => setNewHotel({...newHotel, price: e.target.value})}
                />
                <Button onClick={addHotel} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Hotel
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Total Rooms</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Price/Night</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotels.map(hotel => (
                    <TableRow key={hotel.id}>
                      <TableCell>{hotel.name}</TableCell>
                      <TableCell>{hotel.location}</TableCell>
                      <TableCell>{hotel.rooms}</TableCell>
                      <TableCell>{hotel.available}</TableCell>
                      <TableCell>${hotel.price}</TableCell>
                      <TableCell>
                        <Select
                          value={hotel.available === 0 ? 'occupied' : 'available'}
                          onValueChange={(value) => {
                            updateHotelAvailability(hotel.id, 
                              value === 'occupied' ? 0 : hotel.rooms
                            )
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;