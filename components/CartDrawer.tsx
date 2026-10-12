'use client'

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/cart"
import { formatPrice, calculateGst } from "@/lib/utils"
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  MessageSquare
} from "lucide-react"

export function CartDrawer() {
  const router = useRouter()
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    updateInstructions,
    clearCart,
    subtotal
  } = useCartStore()

  // Prevent scroll when cart is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const sub = subtotal()
  const gst = calculateGst(sub)
  const total = sub + gst

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Your Order ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                  Your cart is empty
                </h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                  Craving something delicious? Add hot snacks, meals, or drinks from the menu!
                </p>
                <button
                  onClick={closeCart}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-all"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemCustomExtra = item.customizations.reduce(
                  (sum, c) => sum + c.priceModifier,
                  0
                )
                const unitTotal = item.price + itemCustomExtra
                const lineTotal = unitTotal * item.quantity

                return (
                  <div
                    key={item.menuItemId}
                    className="p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {/* Diet Icon Badge */}
                        <div
                          className={`mt-1 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                            item.dietType === "VEG"
                              ? "border-green-600"
                              : item.dietType === "EGG"
                              ? "border-amber-600"
                              : "border-red-600"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.dietType === "VEG"
                                ? "bg-green-600"
                                : item.dietType === "EGG"
                                ? "bg-amber-600"
                                : "bg-red-600"
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </h4>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1 shadow-xs">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 p-0.5"
                          aria-label="Decrease quantity"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="font-bold text-xs w-4 text-center text-zinc-900 dark:text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 p-0.5"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Customizations tags */}
                    {item.customizations.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.customizations.map((c, i) => (
                          <span
                            key={i}
                            className="bg-zinc-200/60 dark:bg-zinc-700/50 px-2 py-0.5 rounded-md"
                          >
                            {c.label}: {c.selectedOption}
                            {c.priceModifier > 0 && ` (+${formatPrice(c.priceModifier)})`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Special Instructions note */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <MessageSquare className="w-3 h-3 shrink-0" />
                      <input
                        type="text"
                        placeholder="Add cooking note (e.g. extra spicy)..."
                        value={item.instructions ?? ""}
                        onChange={(e) =>
                          updateInstructions(item.menuItemId, e.target.value)
                        }
                        className="w-full bg-transparent border-none text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Bill & Checkout */}
          {items.length > 0 && (
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(sub)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5% GST)</span>
                  <span>{formatPrice(gst)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-900 dark:text-zinc-100 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                  <span>To Pay</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    closeCart()
                    router.push("/checkout")
                  }}
                  id="checkout-proceed-btn"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <span>Select Pickup Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
