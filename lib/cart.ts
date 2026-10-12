'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartCustomization {
  customizationId: string
  label: string
  selectedOption: string
  priceModifier: number
}

export interface CartItem {
  menuItemId: string
  name: string
  price: number // base price in paise
  imageUrl: string
  dietType: 'VEG' | 'NON_VEG' | 'EGG'
  quantity: number
  customizations: CartCustomization[]
  instructions?: string
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateInstructions: (menuItemId: string, instructions: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Computed
  totalItems: () => number
  subtotal: () => number
  maxPrepTime: () => number
}

// We need menuItem details stored in cart - attach prepTime
const prepTimes: Record<string, number> = {}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.menuItemId === item.menuItemId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), 10) }
                  : i
              ),
              isOpen: true,
            }
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
            isOpen: true,
          }
        })
      },

      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        }))
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity: Math.min(quantity, 10) } : i
          ),
        }))
      },

      updateInstructions: (menuItemId, instructions) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, instructions } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => {
          const customExtra = item.customizations.reduce(
            (m, c) => m + c.priceModifier,
            0
          )
          return sum + (item.price + customExtra) * item.quantity
        }, 0),

      maxPrepTime: () => {
        // stored externally since cart doesn't hold prepTime
        return 20 // default; real value fetched from menu API
      },
    }),
    {
      name: 'bitesbay-cart',
      // Only persist items, not isOpen
      partialize: (state) => ({ items: state.items }),
    }
  )
)
