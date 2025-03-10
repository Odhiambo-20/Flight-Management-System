import { core } from '@paypal/checkout-server-sdk';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Type definitions
interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

interface PaymentInitiationRequest {
  amount: number;
  currency: string;
  type: 'FLIGHT' | 'HOTEL';
  referenceId: string;
  description?: string;
  userId: string;
}

interface CreditCardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

interface MPesaDetails {
  phoneNumber: string;
}

interface PayPalWebhookPayload {
  event_type: 'PAYMENT.CAPTURE.COMPLETED' | 'PAYMENT.CAPTURE.DENIED' | 'PAYMENT.CAPTURE.DECLINED' | 'PAYMENT.CAPTURE.PENDING';
  resource: {
    id: string;
    [key: string]: any;
  };
}

interface MPesaWebhookPayload {
  Body: {
    stkCallback: {
      ResultCode: number;
      ResultDesc: string;
      TransactionId: string;
      CheckoutRequestID: string;
      Amount: number;
      MpesaReceiptNumber: string;
    };
  };
}

interface StripeWebhookPayload {
  body: string;
  headers: {
    'stripe-signature': string;
  };
}

// JSON-compatible metadata interfaces
interface PayPalMetadata extends Record<string, any> {
  paypalEvent: PayPalWebhookPayload['event_type'];
  rawPayload: Record<string, any>;
}

interface MPesaMetadata extends Record<string, any> {
  mpesaReceiptNumber: string;
  mpesaTransactionId: string;
  resultDescription: string;
  rawPayload: Record<string, any>;
}

interface StripeMetadata extends Record<string, any> {
  stripeEvent: 'payment_intent.succeeded' | 'payment_intent.payment_failed' | 'payment_intent.processing';
  rawPayload: Record<string, any>;
}

type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export class PaymentService {
  private stripe: Stripe;
  private paypalClient: core.PayPalHttpClient;

  constructor(
    stripeSecretKey: string,
    paypalClientId: string,
    paypalClientSecret: string,
    private readonly isProduction: boolean = false
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    
    const environment = isProduction 
      ? new core.LiveEnvironment(paypalClientId, paypalClientSecret)
      : new core.SandboxEnvironment(paypalClientId, paypalClientSecret);
    this.paypalClient = new core.PayPalHttpClient(environment);
  }

  async processCreditCardPayment(
    paymentDetails: PaymentInitiationRequest,
    cardDetails: CreditCardDetails
  ): Promise<PaymentResult> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardDetails.number,
          exp_month: cardDetails.expMonth,
          exp_year: cardDetails.expYear,
          cvc: cardDetails.cvc,
        },
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentDetails.amount * 100),
        currency: paymentDetails.currency.toLowerCase(),
        payment_method: paymentMethod.id,
        confirm: true,
        description: paymentDetails.description,
        metadata: {
          referenceId: paymentDetails.referenceId,
          type: paymentDetails.type
        }
      });

      await prisma.payment.create({
        data: {
          transactionId: paymentIntent.id,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          provider: 'STRIPE',
          user: {
            connect: {
              id: Number(paymentDetails.userId)
            }
          },
          metadata: {
            stripeEvent: 'payment_intent.created',
            rawPayload: JSON.parse(JSON.stringify(paymentIntent))
          } as Record<string, any>
        }
      });

      return {
        success: true,
        transactionId: paymentIntent.id
      };
    } catch (error) {
      console.error('Credit card payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  async initiateMPesaPayment(
    paymentDetails: PaymentInitiationRequest,
    mpesaDetails: MPesaDetails
  ): Promise<PaymentResult> {
    try {
      const checkoutRequestId = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.payment.create({
        data: {
          transactionId: checkoutRequestId,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          provider: 'MPESA',
          user: {
            connect: {
              id: Number(paymentDetails.userId)
            }
          },
          metadata: {
            phoneNumber: mpesaDetails.phoneNumber,
            initiatedAt: new Date().toISOString()
          } as Record<string, any>
        }
      });

      return {
        success: true,
        transactionId: checkoutRequestId
      };
    } catch (error) {
      console.error('M-Pesa payment initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  async initiatePayPalPayment(
    paymentDetails: PaymentInitiationRequest
  ): Promise<PaymentResult> {
    try {
      const orderId = `PP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.payment.create({
        data: {
          transactionId: orderId,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          provider: 'PAYPAL',
          user: {
            connect: {
              id: Number(paymentDetails.userId)
            }
          },
          metadata: {
            paypalEvent: 'PAYMENT.CAPTURE.PENDING',
            initiatedAt: new Date().toISOString()
          } as Record<string, any>
        }
      });

      return {
        success: true,
        transactionId: orderId
      };
    } catch (error) {
      console.error('PayPal payment initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  async initiateStripePayment(
    paymentDetails: PaymentInitiationRequest
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentDetails.amount * 100),
        currency: paymentDetails.currency.toLowerCase(),
        description: paymentDetails.description,
        metadata: {
          referenceId: paymentDetails.referenceId,
          type: paymentDetails.type
        }
      });

      await prisma.payment.create({
        data: {
          transactionId: paymentIntent.id,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          provider: 'STRIPE',
          user: {
            connect: {
              id: Number(paymentDetails.userId)
            }
          },
          metadata: {
            stripeEvent: 'payment_intent.created',
            rawPayload: JSON.parse(JSON.stringify(paymentIntent))
          } as Record<string, any>
        }
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  async handlePayPalWebhook(payload: PayPalWebhookPayload): Promise<void> {
    return this._handlePayPalWebhook(payload);
  }

  async handleMPesaWebhook(payload: MPesaWebhookPayload): Promise<void> {
    return this._handleMPesaWebhook(payload);
  }

  async handleStripeWebhook(payload: StripeWebhookPayload): Promise<void> {
    return this._handleStripeWebhook(payload);
  }

  private async _handlePayPalWebhook(payload: PayPalWebhookPayload): Promise<void> {
    try {
      const event = payload.event_type;
      const resourceId = payload.resource.id;
      let paymentStatus: PaymentStatus;

      switch (event) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          paymentStatus = 'COMPLETED';
          break;
        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.DECLINED':
          paymentStatus = 'FAILED';
          break;
        case 'PAYMENT.CAPTURE.PENDING':
          paymentStatus = 'PENDING';
          break;
        default:
          console.log(`Unhandled PayPal event type: ${event}`);
          return;
      }

      const metadata: Record<string, any> = {
        paypalEvent: event,
        rawPayload: JSON.parse(JSON.stringify(payload))
      };

      await prisma.payment.update({
        where: { transactionId: resourceId },
        data: {
          status: paymentStatus,
          updatedAt: new Date(),
          metadata
        }
      });

      if (paymentStatus === 'COMPLETED') {
        await this._updateBookingStatus(resourceId);
      }
    } catch (error) {
      console.error('PayPal webhook processing failed:', error);
      throw error;
    }
  }

  private async _handleMPesaWebhook(payload: MPesaWebhookPayload): Promise<void> {
    try {
      const { 
        ResultCode,
        ResultDesc,
        TransactionId,
        CheckoutRequestID,
        MpesaReceiptNumber
      } = payload.Body.stkCallback;

      const paymentStatus: PaymentStatus = ResultCode === 0 ? 'COMPLETED' : 'FAILED';

      const metadata: Record<string, any> = {
        mpesaReceiptNumber: MpesaReceiptNumber,
        mpesaTransactionId: TransactionId,
        resultDescription: ResultDesc,
        rawPayload: JSON.parse(JSON.stringify(payload))
      };

      await prisma.payment.update({
        where: { transactionId: CheckoutRequestID },
        data: {
          status: paymentStatus,
          updatedAt: new Date(),
          metadata
        }
      });

      if (paymentStatus === 'COMPLETED') {
        await this._updateBookingStatus(CheckoutRequestID);
      }
    } catch (error) {
      console.error('M-Pesa webhook processing failed:', error);
      throw error;
    }
  }

  private async _handleStripeWebhook(payload: StripeWebhookPayload): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload.body,
        payload.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      let paymentStatus: PaymentStatus;
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      switch (event.type) {
        case 'payment_intent.succeeded':
          paymentStatus = 'COMPLETED';
          break;
        case 'payment_intent.payment_failed':
          paymentStatus = 'FAILED';
          break;
        case 'payment_intent.processing':
          paymentStatus = 'PENDING';
          break;
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
          return;
      }

      const metadata: Record<string, any> = {
        stripeEvent: event.type as StripeMetadata['stripeEvent'],
        rawPayload: JSON.parse(JSON.stringify(event.data.object))
      };

      await prisma.payment.update({
        where: { transactionId: paymentIntent.id },
        data: {
          status: paymentStatus,
          updatedAt: new Date(),
          metadata
        }
      });

      if (paymentStatus === 'COMPLETED') {
        await this._updateBookingStatus(paymentIntent.id);
      }
    } catch (error) {
      console.error('Stripe webhook processing failed:', error);
      throw error;
    }
  }

  private async _updateBookingStatus(transactionId: string): Promise<void> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { transactionId }
      });

      if (!payment) return;

      if (payment.type === 'FLIGHT') {
        await prisma.flightReservation.update({
          where: { id: Number(payment.referenceId) },
          data: { status: 'CONFIRMED' }
        });
      } else if (payment.type === 'HOTEL') {
        await prisma.hotelBooking.update({
          where: { id: Number(payment.referenceId) },
          data: { status: 'CONFIRMED' }
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
}