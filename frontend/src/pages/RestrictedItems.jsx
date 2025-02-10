import React, { useState } from 'react';
import { Ban, Search, AlertTriangle, Check, X, HelpCircle, Filter, Printer, Download } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RestrictedItems = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedSortBy, setSortBy] = useState('category');

  // Items data
  const restrictedItems = [
    {
      category: 'Liquids',
      items: [
        {
          name: 'Water and beverages',
          carryOn: 'Limited to 3.4 oz (100ml)',
          checked: 'Allowed',
          notes: 'Must be in clear, quart-sized bag',
          riskLevel: 'Low'
        },
        {
          name: 'Alcohol (over 70% ABV)',
          carryOn: 'Prohibited',
          checked: 'Prohibited',
          notes: 'Not permitted in any luggage',
          riskLevel: 'High'
        },
        {
          name: 'Toiletries',
          carryOn: 'Limited to 3.4 oz (100ml)',
          checked: 'Allowed',
          notes: 'Includes creams, lotions, and perfumes',
          riskLevel: 'Low'
        }
      ]
    },
    // ... Add more categories as needed
  ];

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'allowed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'prohibited':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'allowed':
        return 'bg-green-100 text-green-800';
      case 'prohibited':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRiskLevelClass = (level) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    window.print();
    setIsPrintDialogOpen(false);
  };

  const handleExport = () => {
    try {
      const exportData = filteredItems.map(category => ({
        category: category.category,
        items: category.items.map(item => ({
          name: item.name,
          carryOn: item.carryOn,
          checked: item.checked,
          notes: item.notes,
          riskLevel: item.riskLevel
        }))
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'restricted-items.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      // Handle error appropriately
    }
  };

  const sortItems = (items) => {
    switch (selectedSortBy) {
      case 'name':
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
      case 'riskLevel':
        const riskOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return [...items].sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
      default:
        return items;
    }
  };

  const filteredItems = restrictedItems
    .filter(category => 
      selectedCategory === 'all' || category.category.toLowerCase() === selectedCategory.toLowerCase()
    )
    .map(category => ({
      ...category,
      items: sortItems(category.items.filter(item =>
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedStatus === 'all' || 
         item.carryOn.toLowerCase().includes(selectedStatus.toLowerCase()) ||
         item.checked.toLowerCase().includes(selectedStatus.toLowerCase()))
      ))
    }))
    .filter(category => category.items.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Ban className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Restricted Items</h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Print Restricted Items List</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-gray-600">This will print the current filtered view of restricted items.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePrint}>
                    Confirm Print
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <p className="text-gray-600 text-lg">
          Check what items are allowed in carry-on and checked baggage
        </p>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {restrictedItems.map(category => (
                  <SelectItem key={category.category} value={category.category.toLowerCase()}>
                    {category.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="allowed">Allowed</SelectItem>
                <SelectItem value="prohibited">Prohibited</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="riskLevel">Risk Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-6">
        {filteredItems.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle>{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {category.items.map((item, index) => (
                  <div key={index} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <Badge className={getRiskLevelClass(item.riskLevel)}>
                            {item.riskLevel} Risk
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Tooltiprovider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Carry-on:</span>
                                <Badge variant="outline" className={getStatusClass(item.carryOn)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(item.carryOn)}
                                    {item.carryOn}
                                  </span>
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Status for carry-on baggage</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Checked:</span>
                                <Badge variant="outline" className={getStatusClass(item.checked)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(item.checked)}
                                    {item.checked}
                                  </span>
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Status for checked baggage</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RestrictedItems;