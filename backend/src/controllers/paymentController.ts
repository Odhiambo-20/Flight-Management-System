// paymentController.ts
import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService'; 
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreditCardDetails {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardholderName: string;
}

class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService(process.env.STRIPE_SECRET_KEY!);
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
    
    // Loop through values starting from the rightmost one
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
    const expMonth = parseInt(card.expMonth);
    const expYear = parseInt(card.expYear);

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
    // Remove spaces and dashes
    const clean = cardNumber.replace(/[\s-]/g, '');
    
    // Visa: Starts with 4
    if (/^4/.test(clean)) return 'visa';
    
    // Mastercard: Starts with 51-55 or 2221-2720
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
        cardDetails 
      } = req.body;

      if (!amount || !currency || !paymentMethod || !referenceId || !type) {
        return res.status(400).json({ 
          error: 'Missing required payment information' 
        });
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          amount,
          currency,
          type,
          method: paymentMethod,
          referenceId,
          status: 'PENDING'
        }
      });

      let result;
      switch (paymentMethod) {
        case 'CREDIT_CARD':
          if (!cardDetails) {
            return res.status(400).json({ 
              error: 'Card details required for credit card payments' 
            });
          }

          // Validate card details
          const validation = this.validateCreditCard(cardDetails);
          if (!validation.isValid) {
            return res.status(400).json({ 
              error: validation.error 
            });
          }

          // Detect card type
          const cardType = this.detectCardType(cardDetails.number);
          if (cardType === 'unknown') {
            return res.status(400).json({ 
              error: 'Unsupported card type. We accept Visa and Mastercard.' 
            });
          }

          result = await this.paymentService.processCreditCardPayment({
            amount,
            currency,
            referenceId: payment.id,
            cardDetails: {
              ...cardDetails,
              cardType
            }
          });
          break;

        case 'MPESA':
          if (!phoneNumber) {
            return res.status(400).json({ 
              error: 'Phone number required for M-Pesa payments' 
            });
          }
          result = await this.paymentService.initiateMPesaPayment({
            amount,
            phoneNumber,
            referenceId: payment.id
          });
          break;

        case 'STRIPE':
          result = await this.paymentService.initiateStripePayment({
            amount,
            currency,
            referenceId: payment.id
          });
          break;

        case 'PAYPAL':
          if (!email) {
            return res.status(400).json({ 
              error: 'Email required for PayPal payments' 
            });
          }
          result = await this.paymentService.initiatePayPalPayment({
            amount,
            currency,
            email,
            referenceId: payment.id
          });
          break;

        default:
          return res.status(400).json({ 
            error: 'Unsupported payment method' 
          });
      }

      // Update payment record with transaction ID
      if (result.transactionId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            transactionId: result.transactionId,
            metadata: {
              ...(paymentMethod === 'CREDIT_CARD' ? { cardType: cardDetails.cardType } : {})
            }
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
          await this.paymentService.handleStripeWebhook({
            headers: req.headers as any,
            body: req.body
          });
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

}

export default new PaymentController();