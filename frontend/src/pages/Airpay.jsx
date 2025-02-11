import React, { useState } from 'react';
import { CreditCard, Plane, Phone, WalletCards } from 'lucide-react';

const Airpay = () => {
  const [selectedMethod, setSelectedMethod] = useState('credit-card');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
    email: '',
    phoneNumber: '',
    amount: 1000
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMpesaPayment = async () => {
    if (!formData.phoneNumber) {
      alert('Phone number is required for M-Pesa payment');
      return;
    }
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Please check your phone for the STK push notification');
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      alert('Failed to process M-Pesa payment');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Payment successful!');
    } catch (error) {
      console.error('Stripe payment error:', error);
      alert('Failed to process Stripe payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    switch (selectedMethod) {
      case 'mpesa':
        await handleMpesaPayment();
        break;
      case 'stripe':
      case 'credit-card':
        await handleStripePayment();
        break;
      case 'paypal':
        alert('PayPal integration coming soon');
        break;
      default:
        alert('Please select a payment method');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-900 text-white p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-12">
        <Plane className="text-cyan-400 w-8 h-8" />
        <span className="text-2xl font-bold">AirPay</span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
        <div className="w-full lg:w-1/2">
          {/* Promo Badge */}
          <div className="inline-block bg-blue-900/50 rounded-full px-4 py-2 mb-6">
            <span className="text-cyan-400">Fast Track </span>
            <span className="text-gray-300">Payment for </span>
            <span className="text-white">Flight Passengers</span>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto lg:mx-0">
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount / 100}
                  onChange={(e) => {
                    const cents = Math.round(parseFloat(e.target.value) * 100);
                    setFormData(prev => ({
                      ...prev,
                      amount: cents
                    }));
                  }}
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-white placeholder-gray-400"
                  placeholder="10.00"
                  required
                />
              </div>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                {['credit-card', 'paypal', 'mpesa', 'stripe'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedMethod === method
                        ? 'border-cyan-400 bg-slate-800/50'
                        : 'border-transparent bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {method === 'credit-card' && <WalletCards className="text-blue-400" />}
                      {method === 'paypal' && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">P</span>
                        </div>
                      )}
                      {method === 'mpesa' && <Phone className="text-green-400" />}
                      {method === 'stripe' && (
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">S</span>
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium capitalize">{method.replace('-', ' ')}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Credit Card Form Fields */}
              {(selectedMethod === 'credit-card' || selectedMethod === 'stripe') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-white placeholder-gray-400"
                      maxLength={19}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="cardHolder"
                      value={formData.cardHolder}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiry"
                        value={formData.expiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        className="w-full px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* M-Pesa Form */}
              {selectedMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="254712345678"
                    className="w-full px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-white placeholder-gray-400"
                    required
                  />
                </div>
              )}

              {/* PayPal Form */}
              {selectedMethod === 'paypal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-white placeholder-gray-400"
                    required
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 text-white py-3 rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Pay ${(formData.amount / 100).toFixed(2)} USD`}
              </button>
            </div>
          </form>
        </div>

        {/* Floating Cards Section */}
        <div className="relative w-full lg:w-1/2 h-96">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Back Visa Card (Gold) */}
              <div className="absolute transform rotate-6 translate-y-4 translate-x-4">
                <div className="w-80 h-48 bg-gradient-to-br from-yellow-700 to-yellow-600 rounded-xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-500 rounded-lg p-1">
                        <WalletCards className="text-yellow-800 w-6 h-6" />
                        <p className="text-xs font-bold">BANK GROUP</p>
                      </div>
                    </div>
                    <div className="text-yellow-800 font-bold text-xl">VISA</div>
                  </div>
                  <div>
                    <p className="text-lg mb-1 tracking-wider">XXXX XXXX XXXX XXXX</p>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-yellow-800 mb-1">VALID THRU</p>
                        <p className="text-sm">XXXX</p>
                      </div>
                      <div>
                        <p className="text-xs text-yellow-800 mb-1">CARDHOLDER NAME</p>
                        <p className="text-sm">XXXXXXXXXXXX</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Front Mastercard (Navy) */}
              <div className="relative">
                <div className="w-80 h-48 bg-indigo-900 rounded-xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-500 rounded-lg p-1">
                        <WalletCards className="text-yellow-800 w-6 h-6" />
                        <p className="text-xs font-bold text-white">BANK GROUP</p>
                      </div>
                    </div>
                    <div className="flex -space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full" />
                      <div className="w-8 h-8 bg-orange-500 rounded-full opacity-80" />
                    </div>
                  </div>
                  <div className="text-white">
                    <p className="text-lg mb-1 tracking-wider">XXXX XXXX XXXX XXXX</p>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs opacity-70 mb-1">VALID THRU</p>
                        <p className="text-sm">XXXX</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-70 mb-1">CARDHOLDER NAME</p>
                        <p className="text-sm">XXXXXXXXXXXX</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-400">
        <p>Secure payments powered by industry-leading encryption</p>
      </div>
    </div>
  );
};

export default Airpay;