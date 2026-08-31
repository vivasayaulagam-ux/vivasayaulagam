export interface MetaContentItem {
  id: string;
  quantity: number;
  item_price: number;
}

export interface ViewContentPayload {
  content_ids: string[];
  content_type: 'product' | 'product_group';
  content_name: string;
  value: number;
  currency: 'INR' | string;
}

export interface AddToCartPayload {
  content_ids: string[];
  content_type: 'product' | 'product_group';
  content_name: string;
  value: number;
  currency: 'INR' | string;
  contents?: MetaContentItem[];
}

export interface InitiateCheckoutPayload {
  content_ids: string[];
  contents: MetaContentItem[];
  content_type: 'product' | 'product_group';
  num_items: number;
  value: number;
  currency: 'INR' | string;
}

export interface PurchasePayload {
  content_ids: string[];
  contents: MetaContentItem[];
  content_type: 'product' | 'product_group';
  num_items: number;
  value: number;
  currency: 'INR' | string;
}

export type MetaStandardEventPayload =
  | ViewContentPayload
  | AddToCartPayload
  | InitiateCheckoutPayload
  | PurchasePayload
  | Record<string, unknown>;

declare global {
  interface Window {
    fbq?: {
      (action: 'init', pixelId: string, options?: Record<string, unknown>): void;
      (action: 'track' | 'trackCustom', eventName: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: unknown;
  }
}
