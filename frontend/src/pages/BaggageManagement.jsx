import React, { useState } from 'react';
import { Package, Info, Plus, Trash, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BaggageManagement = () => {
  const [baggage, setBaggage] = useState([
    {
      id: 'BAG001',
      type: 'Checked Baggage',
      weight: '23',
      dimensions: '90 x 75 x 43 cm',
      price: '$30.00',
      status: 'Confirmed'
    },
    {
      id: 'BAG002',
      type: 'Carry-on',
      weight: '7',
      dimensions: '56 x 45 x 25 cm',
      price: 'Included',
      status: 'Confirmed'
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBaggage, setNewBaggage] = useState({
    type: '',
    weight: '',
    dimensions: '',
    price: ''
  });
  const [error, setError] = useState('');

  const handleAddBaggage = () => {
    if (!newBaggage.type || !newBaggage.weight || !newBaggage.dimensions) {
      setError('Please fill in all required fields');
      return;
    }

    const newBag = {
      id: `BAG${String(baggage.length + 1).padStart(3, '0')}`,
      ...newBaggage,
      status: 'Pending'
    };

    setBaggage([...baggage, newBag]);
    setIsAddDialogOpen(false);
    setNewBaggage({ type: '', weight: '', dimensions: '', price: '' });
    setError('');
  };

  const handleRemoveBaggage = (baggageId) => {
    if (window.confirm('Are you sure you want to remove this baggage?')) {
      setBaggage(baggage.filter(bag => bag.id !== baggageId));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBaggage(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const getBaggageStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Baggage Management</h1>
          <p className="text-gray-600">
            Add, modify, or remove baggage for your upcoming flights
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Baggage
        </Button>
      </div>

      {/* Baggage List */}
      <div className="space-y-6 mt-8">
        {baggage.map((bag) => (
          <div key={bag.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <Package className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold">{bag.type}</h3>
                  <p className="text-sm text-gray-600">Baggage ID: {bag.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveBaggage(bag.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="font-medium">{bag.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dimensions</p>
                <p className="font-medium">{bag.dimensions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-medium">{bag.price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${getBaggageStatusColor(bag.status)}`}>
                    {bag.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Baggage Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Baggage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Input
                name="type"
                value={newBaggage.type}
                onChange={handleInputChange}
                placeholder="Enter baggage type"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
              <Input
                name="weight"
                type="number"
                value={newBaggage.weight}
                onChange={handleInputChange}
                placeholder="Enter weight"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dimensions</label>
              <Input
                name="dimensions"
                value={newBaggage.dimensions}
                onChange={handleInputChange}
                placeholder="Length x Width x Height"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Price</label>
              <Input
                name="price"
                value={newBaggage.price}
                onChange={handleInputChange}
                placeholder="Enter price"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBaggage} className="bg-red-600 hover:bg-red-700 text-white">
              Add Baggage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default BaggageManagement;