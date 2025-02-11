import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PaymentService } from '../services/paymentService';
import axios from 'axios';


// Initialize Prisma client at the top level
const prisma = new PrismaClient();

interface CreditCardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  cardholderName: string;
  cardType?: string;
}

interface CreditCardDetails {
  number: string;
  expMonth: number;  // Changed to number to match service
  expYear: number;   // Changed to number to match service
  cvc: string;
  cardholderName: string;
  cardType?: string;
}
interface MPesaDetails {
  phoneNumber: string;
}
// Update to match service PaymentInitiationRequest
interface PaymentInitiationRequest {
  amount: number;
  currency: string;
  type: 'FLIGHT' | 'HOTEL';
  userId: string;  // Changed from customerId to userId
  referenceId: string;
  description?: string;
}
// Update webhook interfaces to match service requirements
interface StripeWebhookPayload {
  body: string;
  headers: {
    'stripe-signature': string;
  };
}
class PaymentController {
  private paymentService: PaymentService;
  constructor() {
    this.paymentService = new PaymentService(
      process.env.STRIPE_SECRET_KEY!,
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_CLIENT_SECRET!,
      process.env.NODE_ENV === 'production'
    );
  }
  private validateCreditCard(card: CreditCardDetails): { isValid: boolean; error?: string } {
    // Basic credit card validation
    if (!card.number || !card.expMonth || !card.expYear || !card.cvc || !card.cardholderName) {
      return { isValid: false, error: 'All card details are required' };
    }
    // Remove spaces and dashes from card number
    const cleanNumber = card.number.replace(/[\s-]/g, '');
    // Check if it's a valid card number length (most cards are 16 digits)
    if (!/^\d{15,16}$/.test(cleanNumber)) {
      return { isValid: false, error: 'Invalid card number' };
    }
    // Luhn algorithm check
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) {
      return { isValid: false, error: 'Invalid card number' };
    }
    // Validate expiry date
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const expMonth = card.expMonth;
    const expYear = card.expYear;
    if (expMonth < 1 || expMonth > 12) {
      return { isValid: false, error: 'Invalid expiry month' };
    }
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }
    // Validate CVC
    if (!/^\d{3,4}$/.test(card.cvc)) {
      return { isValid: false, error: 'Invalid CVC' };
    }
    return { isValid: true };
  }
  private detectCardType(cardNumber: string): string {
    const clean = cardNumber.replace(/[\s-]/g, '');
    
    if (/^4/.test(clean)) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]2[0-1]/.test(clean)) return 'mastercard';
    
    return 'unknown';
  }
  async processPayment(req: Request, res: Response) {
    try {
      const { 
        amount, 
        currency, 
        paymentMethod, 
        referenceId, 
        type,
        phoneNumber,
        email,
        cardDetails,
        customerId, // This will be used as userId
        description
      } = req.body;
      if (!type || !['FLIGHT', 'HOTEL'].includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid payment type. Must be either FLIGHT or HOTEL' 
        });
      }
      if (!amount || !currency || !paymentMethod || !referenceId || !type || !customerId) {
        return res.status(400).json({ 
          error: 'Missing required payment information' 
        });
      }
      const payment = await prisma.payment.create({
        data: {
          amount,
          currency,
          type: type as 'FLIGHT' | 'HOTEL',
          provider: paymentMethod,
          referenceId,
          status: 'PENDING',
          user: {
            connect: {
              id: customerId
            }
          }
        }
      });
      const paymentRequest: PaymentInitiationRequest = {
        amount,
        currency,
        type: type as 'FLIGHT' | 'HOTEL',
        userId: customerId,  // Map customerId to userId
        referenceId: payment.id,
        description
      };
      let result;
      switch (paymentMethod) {
        case 'CREDIT_CARD':
          if (!cardDetails) {
            return res.status(400).json({ 
              error: 'Card details required for credit card payments' 
            });
          }
          const validation = this.validateCreditCard(cardDetails);
          if (!validation.isValid) {
            return res.status(400).json({ 
              error: validation.error 
            });
          }
          const cardType = this.detectCardType(cardDetails.number);
          if (cardType === 'unknown') {
            return res.status(400).json({ 
              error: 'Unsupported card type. We accept Visa and Mastercard.' 
            });
          }
          // Convert string month/year to numbers for the service
          const serviceCardDetails = {
            ...cardDetails,
            expMonth: parseInt(cardDetails.expMonth.toString()),
            expYear: parseInt(cardDetails.expYear.toString()),
            cardType
          };
          result = await this.paymentService.processCreditCardPayment(
            paymentRequest,
            serviceCardDetails
          );
          break;
        case 'MPESA':
          if (!phoneNumber) {
            return res.status(400).json({ 
              error: 'Phone number required for M-Pesa payments' 
            });
          }
          result = await this.paymentService.initiateMPesaPayment(
            paymentRequest,
            { phoneNumber }
          );
          break;
        case 'STRIPE':
          result = await this.paymentService.initiateStripePayment(paymentRequest);
          break;
        case 'PAYPAL':
          if (!email) {
            return res.status(400).json({ 
              error: 'Email required for PayPal payments' 
            });
          }
          result = await this.paymentService.initiatePayPalPayment(paymentRequest);
          break;
        default:
          return res.status(400).json({ 
            error: 'Unsupported payment method' 
          });
      }
      if (result.transactionId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            transactionId: result.transactionId,
            metadata: paymentMethod === 'CREDIT_CARD' ? { cardType: cardDetails?.cardType } : {}
          }
        });
      }
      res.json(result);
    } catch (error) {
      console.error('Payment processing failed:', error);
      res.status(500).json({ 
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  async handleWebhook(req: Request, res: Response) {
    try {
      const paymentMethod = req.params.provider?.toUpperCase();
      
      switch (paymentMethod) {
        case 'MPESA':
          await this.paymentService.handleMPesaWebhook(req.body);
          break;
        case 'STRIPE':
          // Format webhook payload to match StripeWebhookPayload interface
          const stripeWebhookPayload: StripeWebhookPayload = {
            body: req.body,
            headers: {
              'stripe-signature': req.headers['stripe-signature'] as string
            }
          };
          await this.paymentService.handleStripeWebhook(stripeWebhookPayload);
          break;
        case 'PAYPAL':
          await this.paymentService.handlePayPalWebhook(req.body);
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid payment provider' 
          });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(500).json({ 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const payment = await prisma.payment.findUnique({
        where: { transactionId }
      });
      if (!payment) {
        return res.status(404).json({ 
          error: 'Payment not found' 
        });
      }
      res.json({
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        updatedAt: payment.updatedAt
      });
    } catch (error) {
      console.error('Failed to get payment status:', error);
      res.status(500).json({ 
        error: 'Failed to get payment status' 
      });
    }
  }
  private async generateMpesaToken(): Promise<string> {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    try {
      const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error generating M-Pesa token:', error);
      throw new Error('Failed to generate M-Pesa access token');
    }
  }
  public async StkPush(req: Request, res: Response) {
    try {
      const { phoneNumber, amount } = req.body;
      if (!phoneNumber || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and amount are required'
        });
      }
      const token = await this.generateMpesaToken();
      const date = new Date();
      const timestamp =
        date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);
      const shortCode = process.env.MPESA_SHORTCODE;
      const passkey = process.env.MPESA_PASSKEY;
      if (!shortCode || !passkey) {
        throw new Error('M-Pesa configuration missing');
      }
      const stk_password = Buffer.from(shortCode + passkey + timestamp).toString('base64');
      const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      const requestBody = {
        BusinessShortCode: shortCode,
        Password: stk_password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/mpesa/callback`,
        AccountReference: "account",
        TransactionDesc: "Payment"
      };
      const response = await axios.post(url, requestBody, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });

      // Generate a unique reference ID
      const referenceId = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          amount: parseFloat(amount),
          currency: 'KES',
          type: 'HOTEL', // or could be passed in request
          provider: 'MPESA',
          status: 'PENDING',
          referenceId, // Add required referenceId
          transactionId: response.data.CheckoutRequestID,
          metadata: {
            phoneNumber,
            MerchantRequestID: response.data.MerchantRequestID
          },
          user: {
            connect: {
              id: req.body.userId // Make sure to pass userId in the request
            }

        }
      }
      });
      res.json({
        success: true,
        data: {
          ...response.data,
          paymentId: payment.id
        }
      });
    } catch (error) {
      console.error('M-Pesa STK Push error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate payment'
      });
    }
  }
  // Add the callback method
  public async callback(req: Request, res: Response) {
    try {
      const { Body } = req.body;
      
      if (!Body || !Body.stkCallback) {
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data'
        });
      }

      const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      
      // Find the payment using MerchantRequestID
      const payment = await prisma.payment.findFirst({
        where: {
          transactionId: Body.stkCallback.CheckoutRequestID
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Create new metadata object instead of spreading
    const newMetadata = {
      ...(payment.metadata as Record<string, unknown>), // Type assertion
      mpesaResult: {
        ResultCode,
        ResultDesc,
        CallbackMetadata
      }
    };

      // Update payment status based on result code
      await prisma.payment.update({
        where: {
          id: payment.id
        },
        data: {
          status: ResultCode === 0 ? 'COMPLETED' : 'FAILED',
          metadata: newMetadata
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process callback'
      });
    }
  }
}
  
export default new PaymentController();