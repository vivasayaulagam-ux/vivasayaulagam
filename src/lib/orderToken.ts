import crypto from 'crypto';

export function generateOrderToken(orderId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'fallback_secret_vivasaya_ullagam';
  return crypto.createHmac('sha256', secret).update(orderId).digest('hex');
}
