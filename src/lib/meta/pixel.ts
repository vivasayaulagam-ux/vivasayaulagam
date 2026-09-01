import {
  AddToCartPayload,
  InitiateCheckoutPayload,
  MetaStandardEventPayload,
  PurchasePayload,
  ViewContentPayload,
} from './eventTypes';

export const DEFAULT_META_PIXEL_ID = '1403915078507915';

export function getMetaPixelId(): string {
  return (
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    DEFAULT_META_PIXEL_ID
  );
}

/**
 * Production-safe wrapper to trigger Meta Pixel events.
 * Never throws errors and never interrupts storefront execution if blocked or not loaded.
 */
export function trackPixelEvent(
  eventName: string,
  data?: MetaStandardEventPayload,
  options?: { eventID?: string }
): void {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.fbq === 'function') {
      if (data && options) {
        window.fbq('track', eventName, data as Record<string, unknown>, options);
      } else if (data) {
        window.fbq('track', eventName, data as Record<string, unknown>);
      } else {
        window.fbq('track', eventName);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[MetaPixel] Failed to dispatch event "${eventName}":`, error);
    }
  }
}

/**
 * Standard PageView event
 */
export function trackPageView(): void {
  trackPixelEvent('PageView');
}

/**
 * Standard ViewContent event
 */
export function trackViewContent(payload: ViewContentPayload): void {
  trackPixelEvent('ViewContent', payload);
}

/**
 * Standard AddToCart event
 */
export function trackAddToCart(payload: AddToCartPayload): void {
  trackPixelEvent('AddToCart', payload);
}

/**
 * Standard InitiateCheckout event
 */
export function trackInitiateCheckout(payload: InitiateCheckoutPayload): void {
  trackPixelEvent('InitiateCheckout', payload);
}

/**
 * Standard Purchase event
 */
export function trackPurchase(payload: PurchasePayload, eventId?: string): void {
  trackPixelEvent('Purchase', payload, eventId ? { eventID: eventId } : undefined);
}
