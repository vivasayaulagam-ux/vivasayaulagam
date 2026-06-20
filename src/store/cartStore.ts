import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toWeightKg } from '@/lib/shipping';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  weight?: number;
  weightUnit?: string;
  isOutOfStock?: boolean;
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (item: CartItem) => void;
  updateItemMetadata: (id: string, metadata: Partial<Pick<CartItem, 'image' | 'name' | 'price' | 'weight' | 'weightUnit' | 'isOutOfStock'>>) => void;
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
        const weight = toWeightKg(newItem.weight, newItem.weightUnit || 'kg');
        const itemToAdd = { ...newItem, quantity, price, weight, weightUnit: 'kg' };

        set((state) => {
          const existingItem = state.items.find((item) => item.id === itemToAdd.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === itemToAdd.id
                  ? {
                      ...item,
                      quantity: item.quantity + itemToAdd.quantity,
                      weight: item.weight || itemToAdd.weight,
                      weightUnit: item.weightUnit || itemToAdd.weightUnit,
                    }
                  : item
              ),
            };
          }
          return { items: [...state.items, itemToAdd] };
        });
      },
      updateItemMetadata: (id, metadata) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...metadata,
                  weight: metadata.weight !== undefined ? toWeightKg(metadata.weight, metadata.weightUnit || 'kg') : item.weight,
                  weightUnit: metadata.weight !== undefined ? 'kg' : (metadata.weightUnit || item.weightUnit),
                }
              : item
          ),
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
