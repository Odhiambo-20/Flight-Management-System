import { PayPalHttpClient, Environment } from '@paypal/checkout-server-sdk';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

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
  customerId: string;
  description?: string;
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

export class PaymentService {
  private stripe: Stripe;
  private paypalClient: PayPalHttpClient;

  constructor(
    stripeSecretKey: string,
    paypalClientId: string,
    paypalClientSecret: string,
    private readonly isProduction: boolean = false
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia'
    });
    
    const environment = isProduction 
      ? Environment.PRODUCTION() 
      : Environment.SANDBOX();
    this.paypalClient = new PayPalHttpClient(environment);
  }

  async processCreditCardPayment(
    paymentDetails: PaymentInitiationRequest,
    cardDetails: CreditCardDetails
  ): Promise<PaymentResult> {
    try {
      // Create payment method
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardDetails.number,
          exp_month: cardDetails.expMonth,
          exp_year: cardDetails.expYear,
          cvc: cardDetails.cvc,
        },
      });

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentDetails.amount * 100), // Convert to cents
        currency: paymentDetails.currency.toLowerCase(),
        payment_method: paymentMethod.id,
        confirm: true,
        description: paymentDetails.description,
        metadata: {
          customerId: paymentDetails.customerId,
          referenceId: paymentDetails.referenceId,
          type: paymentDetails.type
        }
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          transactionId: paymentIntent.id,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          customerId: paymentDetails.customerId,
          provider: 'STRIPE',
          metadata: {
            stripeEvent: 'payment_intent.created',
            rawPayload: paymentIntent
          }
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
      // Note: Actual M-Pesa API integration would go here
      const checkoutRequestId = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment record
      await prisma.payment.create({
        data: {
          transactionId: checkoutRequestId,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          customerId: paymentDetails.customerId,
          provider: 'MPESA',
          metadata: {
            phoneNumber: mpesaDetails.phoneNumber,
            initiatedAt: new Date().toISOString()
          }
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
      // Note: Actual PayPal order creation would go here
      const orderId = `PP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment record
      await prisma.payment.create({
        data: {
          transactionId: orderId,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          customerId: paymentDetails.customerId,
          provider: 'PAYPAL',
          metadata: {
            paypalEvent: 'PAYMENT.CAPTURE.PENDING',
            initiatedAt: new Date().toISOString()
          }
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
          customerId: paymentDetails.customerId,
          referenceId: paymentDetails.referenceId,
          type: paymentDetails.type
        }
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          transactionId: paymentIntent.id,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
          status: 'PENDING',
          type: paymentDetails.type,
          referenceId: paymentDetails.referenceId,
          customerId: paymentDetails.customerId,
          provider: 'STRIPE',
          metadata: {
            stripeEvent: 'payment_intent.created',
            rawPayload: paymentIntent
          }
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

  // Make webhook handlers public
  async handlePayPalWebhook(payload: PayPalWebhookPayload): Promise<void> {
    return this._handlePayPalWebhook(payload);
  }

  async handleMPesaWebhook(payload: MPesaWebhookPayload): Promise<void> {
    return this._handleMPesaWebhook(payload);
  }

  async handleStripeWebhook(payload: StripeWebhookPayload): Promise<void> {
    return this._handleStripeWebhook(payload);
  }
// ... (previous code remains the same until private implementations)

  private async _handlePayPalWebhook(payload: PayPalWebhookPayload): Promise<void> {
    try {
      const event = payload.event_type;
      const resourceId = payload.resource.id;
      let paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';

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

      const metadata: PayPalMetadata = {
        paypalEvent: event as PayPalMetadata['paypalEvent'],
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
        const payment = await prisma.payment.findUnique({
          where: { transactionId: resourceId }
        });

        if (payment?.type === 'FLIGHT') {
          await prisma.flightReservation.update({
            where: { id: payment.referenceId },
            data: { status: 'CONFIRMED' }
          });
        } else if (payment?.type === 'HOTEL') {
          await prisma.hotelBooking.update({
            where: { id: payment.referenceId },
            data: { status: 'CONFIRMED' }
          });
        }
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
        Amount,
        MpesaReceiptNumber
      } = payload.Body.stkCallback;

      const paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' = 
        ResultCode === 0 ? 'COMPLETED' : 'FAILED';

      const metadata: MPesaMetadata = {
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
        const payment = await prisma.payment.findUnique({
          where: { transactionId: CheckoutRequestID }
        });

        if (payment?.type === 'FLIGHT') {
          await prisma.flightReservation.update({
            where: { id: payment.referenceId },
            data: { status: 'CONFIRMED' }
          });
        } else if (payment?.type === 'HOTEL') {
          await prisma.hotelBooking.update({
            where: { id: payment.referenceId },
            data: { status: 'CONFIRMED' }
          });
        }
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

      let paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
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

      const metadata: StripeMetadata = {
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
        const payment = await prisma.payment.findUnique({
          where: { transactionId: paymentIntent.id }
        });

        if (payment?.type === 'FLIGHT') {
          await prisma.flightReservation.update({
            where: { id: payment.referenceId },
            data: { status: 'CONFIRMED' }
          });
        } else if (payment?.type === 'HOTEL') {
          await prisma.hotelBooking.update({
            where: { id: payment.referenceId },
            data: { status: 'CONFIRMED' }
          });
        }
      }
    } catch (error) {
      console.error('Stripe webhook processing failed:', error);
      throw error;
    }
  }
}


 