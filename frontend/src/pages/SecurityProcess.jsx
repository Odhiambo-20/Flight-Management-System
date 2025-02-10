import React from 'react';
import { Shield, Clock, AlertCircle, Scan, User, Laptop, Suitcase } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SecurityProcess = () => {
  const securitySteps = [
    {
      icon: <User className="w-6 h-6" />,
      title: "Document Check",
      description: "Present your boarding pass and valid ID to the security officer. Ensure documents match and are not expired.",
      tips: ["Have documents readily accessible", "Remove document covers or holders"]
    },
    {
      icon: <Suitcase className="w-6 h-6" />,
      title: "Prepare Your Items",
      description: "Remove required items from your bags and place them in bins for screening.",
      tips: [
        "Remove shoes, belts, and jackets",
        "Empty pockets of metal objects",
        "Place liquids in clear bags"
      ]
    },
    {
      icon: <Laptop className="w-6 h-6" />,
      title: "Electronics Screening",
      description: "Place large electronics in separate bins for X-ray screening.",
      tips: [
        "Remove laptops from bags",
        "Tablets and large electronics go in separate bins",
        "Ensure devices are charged"
      ]
    },
    {
      icon: <Scan className="w-6 h-6" />,
      title: "Screening Process",
      description: "Walk through the security scanner and wait for clearance from security personnel.",
      tips: [
        "Follow officer instructions",
        "Wait for signal to proceed",
        "Be prepared for additional screening if needed"
      ]
    }
  ];

  const currentAlerts = [
    {
      title: "Enhanced Electronics Screening",
      description: "Additional screening measures for electronic devices larger than cell phones are in effect."
    },
    {
      title: "Liquid Restrictions",
      description: "Liquids must be in containers of 3.4 oz (100ml) or less and fit in a clear, quart-sized bag."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Process</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Understanding the airport security screening process helps ensure a smooth journey through the checkpoint.
        </p>
      </div>

      {/* Current Alerts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          Current Security Alerts
        </h2>
        <div className="space-y-4">
          {currentAlerts.map((alert, index) => (
            <Alert key={index} className="border-yellow-200 bg-yellow-50">
              <AlertDescription>
                <strong className="text-yellow-800">{alert.title}:</strong>{" "}
                <span className="text-gray-600">{alert.description}</span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </div>

      {/* Expected Processing Times */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600" />
            Expected Processing Times
          </CardTitle>
          <CardDescription>
            Average security checkpoint waiting times during different periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">Peak Hours</div>
              <div className="text-red-600 font-bold text-2xl">15-25 min</div>
              <div className="text-sm text-gray-600">6:00 AM - 9:00 AM</div>
              <div className="text-sm text-gray-600">4:00 PM - 7:00 PM</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">Regular Hours</div>
              <div className="text-green-600 font-bold text-2xl">10-15 min</div>
              <div className="text-sm text-gray-600">9:00 AM - 4:00 PM</div>
              <div className="text-sm text-gray-600">7:00 PM - 10:00 PM</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">Off-Peak Hours</div>
              <div className="text-blue-600 font-bold text-2xl">5-10 min</div>
              <div className="text-sm text-gray-600">Early morning</div>
              <div className="text-sm text-gray-600">Late evening</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Steps */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Security Screening Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securitySteps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="text-red-600">{step.icon}</div>
                  {step.title}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {step.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2" />
                      <span className="text-gray-600">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray">
            <p className="text-gray-600">
              Special assistance is available for passengers with disabilities, medical conditions, or those traveling with 
              young children. Please notify security personnel if you require assistance or have medical devices that 
              need special screening procedures.
            </p>
            <p className="text-gray-600 mt-4">
              For more detailed information about security procedures or to learn about TSA PreCheck and other 
              expedited screening programs, please visit our Restricted Items page or contact our security department.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityProcess;