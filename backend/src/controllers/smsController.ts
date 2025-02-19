// Import required dependencies
import axios from 'axios';
import { Request, Response } from 'express';

// SMS Controller
export class SmsController {
  private username: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.username = process.env.AT_USERNAME || '';
    this.apiKey = process.env.AT_API_KEY || '';
    this.baseUrl = 'https://api.africastalking.com/version1';
  }

  /**
   * Send SMS using Africa's Talking API
   */
  public sendSms = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipients, message } = req.body;

      // Validate request
      if (!recipients || !message) {
        res.status(400).json({
          success: false,
          message: 'Recipients and message are required'
        });
        return;
      }

      // Format recipients if it's an array
      const formattedRecipients = Array.isArray(recipients) 
        ? recipients.join(',') 
        : recipients;

      // Prepare request to Africa's Talking API
      const data = {
        username: this.username,
        to: formattedRecipients,
        message
      };

      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey,
          'Accept': 'application/json'
        }
      };

      // Send request to Africa's Talking API
      const response = await axios.post(
        `${this.baseUrl}/messaging`,
        new URLSearchParams(data).toString(),
        config
      );

      console.log('SMS API Response:', response.data);

      // Return success response
      res.json({
        success: true,
        data: response.data,
        message: 'SMS sent successfully'
      });
    } catch (error) {
      console.error('SMS sending error:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending SMS',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get SMS delivery status
   */
  public getSmsStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        res.status(400).json({
          success: false,
          message: 'Message ID is required'
        });
        return;
      }

      const config = {
        headers: {
          'apiKey': this.apiKey,
          'Accept': 'application/json'
        },
        params: {
          username: this.username,
          messageId
        }
      };

      const response = await axios.get(
        `${this.baseUrl}/messaging`,
        config
      );

      res.json({
        success: true,
        data: response.data,
        message: 'SMS status retrieved successfully'
      });
    } catch (error) {
      console.error('Get SMS status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting SMS status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Handle delivery reports from Africa's Talking API
   */
  public handleDeliveryReport = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Delivery report received:', req.body);
      
      // Process the delivery report as needed
      // You may want to update the status in your database
      
      res.json({
        success: true,
        message: 'Delivery report processed successfully'
      });
    } catch (error) {
      console.error('Process delivery report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing delivery report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export const smsController = new SmsController();