export interface Product {
  id: number | string;
  name: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  averageRating?: number;
  reviewCount: number;
  category: string;
  categories?: string[];
  emoji: string;
  bgColor: string;
  isNew: boolean;
  isBestSeller: boolean;
  image?: string;
  images?: string[];
  description?: string;
  weight?: number;
  weightUnit?: string;
  variants?: { type: string; value: string; price?: number; additionalPrice?: number; stock?: number }[];
  trackInventory?: boolean;
  quantity?: number;
  stock_quantity?: number;
  stock_status?: string;
  is_out_of_stock?: boolean;
}

export const products: Product[] = [];

export const newProducts: Product[] = [];
export const bestSellers: Product[] = [];
export const limitedDeals: Product[] = [];
export const honeyProducts: Product[] = [];
