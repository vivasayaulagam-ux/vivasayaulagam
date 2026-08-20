import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toWeightKg } from '@/lib/shipping';

export interface CartItem {
  id: string;
  productId?: string;
  variantId?: string;
  variantName?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  weight?: number;
  unit?: string;
  weightUnit?: string;
  weightKg?: number;
  sku?: string;
  isOutOfStock?: boolean;
  isCombo?: boolean;
  comboWeight?: number;
  isFreeShipping?: boolean;
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (item: CartItem) => void;
  updateItemMetadata: (id: string, metadata: Partial<Omit<CartItem, 'id' | 'quantity'>>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      addItem: (newItem) => {
        const quantity = Number.isFinite(newItem.quantity) ? Math.max(1, Math.floor(newItem.quantity)) : 1;
        const price = Number.isFinite(newItem.price) ? Math.max(0, newItem.price) : 0;
        let weightKg: number;
        if (newItem.isCombo) {
          weightKg = newItem.comboWeight || newItem.weightKg || 0;
        } else {
          weightKg = newItem.weightKg || toWeightKg(newItem.weight, newItem.unit || newItem.weightUnit || 'kg', newItem.name);
        }
        const productId = String(newItem.productId || newItem.id.split('-')[0]);
        const unit = newItem.unit || newItem.weightUnit || 'kg';
        const itemToAdd = {
          ...newItem,
          productId,
          quantity,
          price,
          unit,
          weightUnit: newItem.weightUnit || unit,
          weightKg,
        };

        set((state) => {
          const existingItem = state.items.find((item) => item.id === itemToAdd.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === itemToAdd.id
                  ? (() => {
                      const keepExistingVariantMetadata = Boolean(
                        item.variantName && !itemToAdd.variantName
                      );
                      return {
                      ...item,
                      ...itemToAdd,
                      name: keepExistingVariantMetadata ? item.name : itemToAdd.name,
                      variantId: itemToAdd.variantId || item.variantId,
                      variantName: itemToAdd.variantName || item.variantName,
                      sku: itemToAdd.sku || item.sku,
                      weight: keepExistingVariantMetadata ? item.weight : itemToAdd.weight,
                      unit: keepExistingVariantMetadata ? item.unit : itemToAdd.unit,
                      weightUnit: keepExistingVariantMetadata ? item.weightUnit : itemToAdd.weightUnit,
                      weightKg: keepExistingVariantMetadata ? item.weightKg : itemToAdd.weightKg,
                      quantity: item.quantity + itemToAdd.quantity,
                      };
                    })()
                  : item
              ),
            };
          }
          return { items: [...state.items, itemToAdd] };
        });
      },
      updateItemMetadata: (id, metadata) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const merged = { ...item, ...metadata };
              let weightKg: number;
              if (merged.isCombo) {
                weightKg = merged.comboWeight || merged.weightKg || 0;
              } else {
                weightKg = metadata.weightKg || toWeightKg(
                  merged.weight,
                  merged.unit || merged.weightUnit || 'kg',
                  merged.name
                );
              }
              return {
                ...merged,
                unit: merged.unit || merged.weightUnit || 'kg',
                weightUnit: merged.weightUnit || merged.unit || 'kg',
                weightKg,
              };
            }
            return item;
          }),
        }));
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateQuantity: (id, quantity) => {
        const nextQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
        set((state) => ({
          items: nextQuantity <= 0
            ? state.items.filter((item) => item.id !== id)
            : state.items.map((item) =>
                item.id === id ? { ...item, quantity: nextQuantity } : item
              ),
        }));
      },
      clearCart: () => set({ items: [] }),
      totalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'vivasaya-cart-storage',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
