"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const prisma = new client_1.PrismaClient();
class PaymentService {
    constructor(stripeSecretKey) {
        this.stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2024-12-18.acacia'
        });
    }
    async handlePayPalWebhook(payload) {
        try {
            const event = payload.event_type;
            const resourceId = payload.resource.id;
            let paymentStatus;
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
            const metadata = {
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
                const payment = await prisma.payment.findUnique({
                    where: { transactionId: resourceId }
                });
                if (payment?.type === 'FLIGHT') {
                    await prisma.flightReservation.update({
                        where: { id: payment.referenceId },
                        data: { status: 'CONFIRMED' }
                    });
                }
                else if (payment?.type === 'HOTEL') {
                    await prisma.hotelBooking.update({
                        where: { id: payment.referenceId },
                        data: { status: 'CONFIRMED' }
                    });
                }
            }
        }
        catch (error) {
            console.error('PayPal webhook processing failed:', error);
            throw error;
        }
    }
    async handleMPesaWebhook(payload) {
        try {
            const { ResultCode, ResultDesc, TransactionId, CheckoutRequestID, Amount, MpesaReceiptNumber } = payload.Body.stkCallback;
            const paymentStatus = ResultCode === 0 ? 'COMPLETED' : 'FAILED';
            const metadata = {
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
                }
                else if (payment?.type === 'HOTEL') {
                    await prisma.hotelBooking.update({
                        where: { id: payment.referenceId },
                        data: { status: 'CONFIRMED' }
                    });
                }
            }
        }
        catch (error) {
            console.error('M-Pesa webhook processing failed:', error);
            throw error;
        }
    }
    async handleStripeWebhook(payload) {
        try {
            const event = this.stripe.webhooks.constructEvent(payload.body, payload.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
            let paymentStatus;
            const paymentIntent = event.data.object;
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
            const metadata = {
                stripeEvent: event.type,
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
                }
                else if (payment?.type === 'HOTEL') {
                    await prisma.hotelBooking.update({
                        where: { id: payment.referenceId },
                        data: { status: 'CONFIRMED' }
                    });
                }
            }
        }
        catch (error) {
            console.error('Stripe webhook processing failed:', error);
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
