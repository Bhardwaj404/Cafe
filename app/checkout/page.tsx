'use client'

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCartStore } from "@/lib/cart"
import { formatPrice, calculateGst, formatTime, getTodayDateStr } from "@/lib/utils"
import {
  Clock,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag
} from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"

interface SlotOption {
  id: string | null
  startTime: string
  endTime: string
  capacity: number
  currentCount: number
  isFull: boolean
  isAvailable: boolean
  label: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, subtotal, clearCart } = useCartStore()

  const [slots, setSlots] = React.useState<SlotOption[]>([])
  const [selectedSlotIndex, setSelectedSlotIndex] = React.useState<number | null>(null)
  const [loadingSlots, setLoadingSlots] = React.useState(true)
  const [selectedDate, setSelectedDate] = React.useState<string>("")

  const [orderNote, setOrderNote] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState<"UPI" | "CARD" | "CASH_AT_COUNTER">("UPI")
  const [submitting, setSubmitting] = React.useState(false)

  // Redirect if unauthenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout")
    }
  }, [status, router])

  // Fetch slots for selected date
  React.useEffect(() => {
    const today = getTodayDateStr()
    setSelectedDate(today)

    async function loadSlots(dateStr: string) {
      try {
        setLoadingSlots(true)
        const res = await fetch(`/api/slots?date=${dateStr}&maxPrepTime=20`)
        if (!res.ok) {
          toast.error("Could not load pickup slots")
          return
        }
        const data = await res.json()
        setSlots(data.slots || [])

        // Set default to earliest slot if available
        if (data.earliestSlotIndex !== null && data.earliestSlotIndex !== undefined) {
          setSelectedSlotIndex(data.earliestSlotIndex)
        } else {
          // Find first available slot
          const firstAvail = (data.slots as SlotOption[]).findIndex((s: SlotOption) => s.isAvailable)
          setSelectedSlotIndex(firstAvail >= 0 ? firstAvail : null)
        }
      } catch (err) {
        toast.error("Failed to fetch slots")
      } finally {
        setLoadingSlots(false)
      }
    }

    if (status === "authenticated") {
      loadSlots(today)
    }
  }, [status])

  const sub = subtotal()
  const gst = calculateGst(sub)
  const total = sub + gst

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Your cart is empty
        </h2>
        <p className="text-sm text-zinc-500">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Menu</span>
        </Link>
      </div>
    )
  }

  const selectedSlot = selectedSlotIndex !== null ? slots[selectedSlotIndex] : null

  const handlePlaceOrder = async () => {
    if (!selectedSlot) {
      toast.error("Please select a pickup time slot")
      return
    }

    if (selectedSlot.isFull) {
      toast.error("The selected slot is full. Please pick another time.")
      return
    }

    try {
      setSubmitting(true)

      // Step 1: Ensure slot exists in DB via POST /api/slots
      const slotRes = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedSlot.startTime,
          date: selectedDate,
        }),
      })

      if (!slotRes.ok) {
        throw new Error("Failed to reserve slot")
      }
      const dbSlot = await slotRes.json()

      // Step 2: Create order via POST /api/orders
      const idempotencyKey = crypto.randomUUID()
      const orderPayload = {
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          customizations: i.customizations,
          instructions: i.instructions || undefined,
        })),
        pickupSlotId: dbSlot.id,
        note: orderNote.trim() || undefined,
        paymentMethod,
        idempotencyKey,
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        toast.error(orderData.error || "Order creation failed")
        return
      }

      // Step 3: Trigger payment confirmation if online
      if (paymentMethod !== "CASH_AT_COUNTER") {
        await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.id }),
        })
      }

      // Fire confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      clearCart()
      toast.success("Order Placed Successfully! 🎉")
      router.push(`/orders?placed=true&orderId=${orderData.id}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to place order")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure Campus Preorder</span>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
        Review & Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Slot Picker & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Choose Pickup Slot */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  1. Select Pickup Time Slot
                </h2>
              </div>
              <span className="text-xs font-semibold text-zinc-500">
                Today ({selectedDate})
              </span>
            </div>

            <p className="text-xs text-zinc-500">
              Kitchen pre-cooks your order fresh so it&apos;s piping hot when you arrive at the counter!
            </p>

            {loadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-xs">
                No slots available for today. The cafeteria may currently be closed.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {slots.map((slot, idx) => {
                  const isSelected = selectedSlotIndex === idx
                  const spotsLeft = slot.capacity - slot.currentCount

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.isAvailable || slot.isFull}
                      onClick={() => setSelectedSlotIndex(idx)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500 shadow-xs"
                          : slot.isFull || !slot.isAvailable
                          ? "border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-400 opacity-60 cursor-not-allowed"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm">
                          {formatTime(slot.startTime)}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 fill-amber-100 dark:fill-amber-900" />
                        )}
                      </div>

                      <div className="mt-2 text-[10px] font-semibold flex items-center justify-between">
                        {slot.isFull ? (
                          <span className="text-red-500 uppercase">Slot Full</span>
                        ) : !slot.isAvailable ? (
                          <span className="text-zinc-400">Past Time</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} left
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section 2: Order Notes */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              2. Special Instructions (Optional)
            </h2>
            <textarea
              rows={2}
              placeholder="e.g. Please pack curry separately, extra spoons, calling Arjun when ready..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-amber-500"
              maxLength={300}
            />
          </div>

          {/* Section 3: Payment Method */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              3. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "UPI",
                  title: "UPI / QR",
                  desc: "Google Pay, PhonePe, Paytm",
                  icon: QrCode,
                },
                {
                  id: "CARD",
                  title: "Debit / Credit Card",
                  desc: "Visa, Mastercard, RuPay",
                  icon: CreditCard,
                },
                {
                  id: "CASH_AT_COUNTER",
                  title: "Pay at Counter",
                  desc: "Cash or POS upon pickup",
                  icon: Banknote,
                },
              ].map((m) => {
                const Icon = m.icon
                const isSelected = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-amber-600 mb-2" />
                    <div>
                      <p className="font-bold text-xs sm:text-sm">{m.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Bill & Place Order CTA */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-5 sticky top-24">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Order Summary ({items.length} item{items.length > 1 ? "s" : ""})
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
              {items.map((item) => {
                const itemCustomExtra = item.customizations.reduce(
                  (s, c) => s + c.priceModifier,
                  0
                )
                const lineTotal = (item.price + itemCustomExtra) * item.quantity

                return (
                  <div key={item.menuItemId} className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.quantity}x {item.name}
                      </p>
                      {item.customizations.length > 0 && (
                        <p className="text-[10px] text-zinc-400">
                          {item.customizations.map((c) => c.selectedOption).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {formatPrice(lineTotal)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Bill computation */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span>{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>GST (5%)</span>
                <span>{formatPrice(gst)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total Payable</span>
                <span className="text-amber-600 dark:text-amber-400 text-base">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Slot reminder */}
            {selectedSlot && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  Pickup Scheduled:
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !selectedSlot || selectedSlot.isFull}
              id="place-order-btn"
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Confirm Order • {formatPrice(total)}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
