/**
 * Structured logger for payment events, webhooks, and order processing.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface PaymentLogPayload {
  event: string;
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount?: number;
  status?: string;
  details?: Record<string, unknown>;
  error?: unknown;
}

function formatLog(level: LogLevel, payload: PaymentLogPayload) {
  const timestamp = new Date().toISOString();
  const errorDetails = payload.error instanceof Error
    ? { message: payload.error.message, stack: payload.error.stack }
    : payload.error;

  return JSON.stringify({
    timestamp,
    level: level.toUpperCase(),
    scope: 'PAYMENT',
    event: payload.event,
    orderId: payload.orderId,
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    amount: payload.amount,
    status: payload.status,
    details: payload.details,
    error: errorDetails,
  });
}

export const paymentLogger = {
  info(payload: PaymentLogPayload) {
    console.log(formatLog('info', payload));
  },
  warn(payload: PaymentLogPayload) {
    console.warn(formatLog('warn', payload));
  },
  error(payload: PaymentLogPayload) {
    console.error(formatLog('error', payload));
  },
  debug(payload: PaymentLogPayload) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', payload));
    }
  },
};
