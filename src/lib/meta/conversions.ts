import crypto from 'crypto';
import { getMetaCatalogId } from './catalogId';
import { DEFAULT_META_PIXEL_ID } from './pixel';
import { paymentLogger } from '@/lib/logger';

export interface MetaPurchaseOrderItem {
  productId?: string;
  sku?: string;
  variantName?: string;
  price?: number;
  quantity?: number;
  name?: string;
}

export interface MetaPurchaseOrderInput {
  _id?: string | { toString(): string };
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  totalAmount?: number;
  grand_total?: number;
  subtotalAmount?: number;
  paidAt?: Date | string;
  shippingAddress?: {
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  items?: MetaPurchaseOrderItem[];
}

export interface SendMetaPurchaseParams {
  order: MetaPurchaseOrderInput;
  eventId: string;
  clientIp?: string;
  userAgent?: string;
  sourceUrl?: string;
}

export interface MetaCapiResult {
  success: boolean;
  skipped?: boolean;
  eventsReceived?: number;
  fbtraceId?: string;
  error?: string;
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hashEmail(email?: string | null): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const trimmed = email.trim().toLowerCase();
  // Filter out placeholder/guest emails
  if (!trimmed || trimmed.includes('@guest.vivasayaulagam.com') || !trimmed.includes('@')) {
    return undefined;
  }
  return sha256(trimmed);
}

export function hashPhone(phone?: string | null): string | undefined {
  if (!phone || typeof phone !== 'string') return undefined;
  let digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 7) return undefined;
  // Normalize standard 10-digit Indian phone numbers to E.164 without '+'
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `91${digits.slice(1)}`;
  }
  return sha256(digits);
}

export function hashFirstName(name?: string | null): string | undefined {
  if (!name || typeof name !== 'string') return undefined;
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return undefined;
  const firstName = trimmed.split(/\s+/)[0];
  if (!firstName) return undefined;
  const cleaned = firstName.replace(/[^a-z0-9]/g, '');
  if (!cleaned) return undefined;
  return sha256(cleaned);
}

export function hashCity(city?: string | null): string | undefined {
  if (!city || typeof city !== 'string') return undefined;
  const trimmed = city.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!trimmed) return undefined;
  return sha256(trimmed);
}

export function hashState(state?: string | null): string | undefined {
  if (!state || typeof state !== 'string') return undefined;
  const trimmed = state.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!trimmed) return undefined;
  return sha256(trimmed);
}

export function hashPostalCode(postalCode?: string | null): string | undefined {
  if (!postalCode || typeof postalCode !== 'string') return undefined;
  const trimmed = postalCode.trim().toLowerCase().replace(/\s+/g, '');
  if (!trimmed) return undefined;
  return sha256(trimmed);
}

export function hashCountry(country?: string | null): string | undefined {
  const norm = (country || 'India').trim().toLowerCase();
  const isoCode = norm === 'in' || norm === 'india' ? 'in' : norm.slice(0, 2);
  if (!isoCode) return undefined;
  return sha256(isoCode);
}

/**
 * Server-only Meta Conversions API (CAPI) Purchase dispatcher.
 * Dispatches a Purchase event to Meta Graph API for verified orders.
 * Never throws errors and never exposes access tokens or raw PII in logs.
 */
export async function sendMetaPurchase({
  order,
  eventId,
  clientIp,
  userAgent,
  sourceUrl,
}: SendMetaPurchaseParams): Promise<MetaCapiResult> {
  const pixelId =
    process.env.META_PIXEL_ID ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    DEFAULT_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const apiVersion = process.env.META_API_VERSION || 'v19.0';
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  const orderIdentifier =
    order.orderId || (order._id ? (typeof order._id === 'string' ? order._id : order._id.toString()) : 'unknown');

  if (!accessToken) {
    paymentLogger.info({
      event: 'META_CAPI_SKIPPED',
      orderId: orderIdentifier,
      razorpayPaymentId: order.razorpayPaymentId,
      details: { reason: 'META_ACCESS_TOKEN is not configured in environment' },
    });
    return {
      success: false,
      skipped: true,
      error: 'META_ACCESS_TOKEN is not configured',
    };
  }

  if (!pixelId) {
    paymentLogger.warn({
      event: 'META_CAPI_SKIPPED',
      orderId: orderIdentifier,
      razorpayPaymentId: order.razorpayPaymentId,
      details: { reason: 'Meta Pixel ID is missing' },
    });
    return {
      success: false,
      skipped: true,
      error: 'Meta Pixel ID is missing',
    };
  }

  try {
    const eventTime = Math.floor(
      (order.paidAt ? new Date(order.paidAt).getTime() : Date.now()) / 1000
    );

    const userData: Record<string, unknown> = {};

    const email = order.shippingAddress?.email || (order.user as any)?.email;
    const hashedEmail = hashEmail(email);
    if (hashedEmail) userData.em = [hashedEmail];

    const phone = order.shippingAddress?.phone || (order.user as any)?.phone;
    const hashedPhone = hashPhone(phone);
    if (hashedPhone) userData.ph = [hashedPhone];

    const name = order.shippingAddress?.fullName || (order.user as any)?.name;
    const hashedFirstName = hashFirstName(name);
    if (hashedFirstName) userData.fn = [hashedFirstName];

    const city = order.shippingAddress?.city;
    const hashedCity = hashCity(city);
    if (hashedCity) userData.ct = [hashedCity];

    const state = order.shippingAddress?.state;
    const hashedState = hashState(state);
    if (hashedState) userData.st = [hashedState];

    const postalCode = order.shippingAddress?.postalCode;
    const hashedPostalCode = hashPostalCode(postalCode);
    if (hashedPostalCode) userData.zp = [hashedPostalCode];

    const country = order.shippingAddress?.country;
    const hashedCountry = hashCountry(country);
    if (hashedCountry) userData.country = [hashedCountry];

    if (clientIp) userData.client_ip_address = clientIp;
    if (userAgent) userData.client_user_agent = userAgent;

    const contentIds = (order.items || []).map((item) =>
      getMetaCatalogId({
        productId: item.productId,
        sku: item.sku,
        variantName: item.variantName,
      })
    );

    const contents = (order.items || []).map((item) => ({
      id: getMetaCatalogId({
        productId: item.productId,
        sku: item.sku,
        variantName: item.variantName,
      }),
      quantity: Number(item.quantity) || 1,
      item_price: Number(item.price) || 0,
    }));

    const numItems = (order.items || []).reduce(
      (acc, item) => acc + (Number(item.quantity) || 1),
      0
    );

    const orderValue = Number(
      order.totalAmount ?? order.grand_total ?? order.subtotalAmount ?? 0
    );

    const eventPayload: Record<string, unknown> = {
      event_name: 'Purchase',
      event_time: eventTime,
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        currency: 'INR',
        value: orderValue,
        content_type: 'product',
        content_ids: contentIds,
        contents,
        num_items: numItems,
        order_id: order.orderId || (order._id ? (typeof order._id === 'string' ? order._id : order._id.toString()) : undefined),
      },
    };

    if (sourceUrl) {
      eventPayload.event_source_url = sourceUrl;
    }

    const requestBody: Record<string, unknown> = {
      data: [eventPayload],
    };

    if (testEventCode && testEventCode.trim()) {
      requestBody.test_event_code = testEventCode.trim();
    }

    const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = (await response.json().catch(() => ({}))) as Record<string, any>;

    if (!response.ok) {
      const errorMessage =
        responseData?.error?.message ||
        `HTTP ${response.status} ${response.statusText}`;
      paymentLogger.error({
        event: 'META_CAPI_PURCHASE_FAILED',
        orderId: orderIdentifier,
        razorpayPaymentId: order.razorpayPaymentId,
        amount: orderValue,
        details: {
          status: response.status,
          type: responseData?.error?.type,
          code: responseData?.error?.code,
          fbtraceId: responseData?.error?.fbtrace_id,
          errorMessage,
        },
      });
      return {
        success: false,
        error: errorMessage,
        fbtraceId: responseData?.error?.fbtrace_id,
      };
    }

    paymentLogger.info({
      event: 'META_CAPI_PURCHASE_SENT',
      orderId: orderIdentifier,
      razorpayPaymentId: order.razorpayPaymentId,
      amount: orderValue,
      details: {
        eventId,
        eventsReceived: responseData.events_received,
        fbtraceId: responseData.fbtrace_id,
        testEventCodeApplied: Boolean(testEventCode && testEventCode.trim()),
      },
    });

    return {
      success: true,
      eventsReceived: responseData.events_received,
      fbtraceId: responseData.fbtrace_id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    paymentLogger.error({
      event: 'META_CAPI_PURCHASE_EXCEPTION',
      orderId: orderIdentifier,
      razorpayPaymentId: order.razorpayPaymentId,
      error,
      details: { message: errorMsg },
    });
    return {
      success: false,
      error: errorMsg,
    };
  }
}
