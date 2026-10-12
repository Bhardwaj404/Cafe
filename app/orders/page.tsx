'use client'

import React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { formatPrice, formatTime, formatDateTime } from "@/lib/utils"
import { useCartStore } from "@/lib/cart"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  QrCode,
  ChefHat,
  PackageCheck,
  Ban,
  ShoppingBag,
  ArrowRight,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface OrderItemData {
  id: string
  quantity: number
  unitPrice: number
  instructions: string | null
  customizations: string // JSON
  menuItem: {
    id: string
    name: string
    imageUrl: string
    price: number
    dietType: "VEG" | "NON_VEG" | "EGG"
  }
}

interface OrderData {
  id: string
  status: "PLACED" | "PREPARING" | "READY_FOR_PICKUP" | "COLLECTED" | "CANCELLED"
  totalAmount: number
  gstAmount: number
  note: string | null
  createdAt: string
  pickupSlot: {
    id: string
    startTime: string
    endTime: string
    date: string
  }
  payment: {
    method: string
    status: string
    amount: number
  } | null
  items: OrderItemData[]
}

const STATUS_STEPS = [
  { key: "PLACED", label: "Order Placed", icon: Clock },
  { key: "PREPARING", label: "In Kitchen", icon: ChefHat },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup", icon: PackageCheck },
  { key: "COLLECTED", label: "Collected", icon: CheckCircle2 },
]

export default function OrdersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [orders, setOrders] = React.useState<OrderData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [cancellingId, setCancellingId] = React.useState<string | null>(null)
  const { addItem } = useCartStore()

  // Load orders
  const fetchOrders = React.useCallback(async () => {
    try {
      const res = await fetch("/api/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch {
      toast.error("Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/orders")
      return
    }
    if (status === "authenticated") {
      fetchOrders()
      // Polling every 6s for live counter updates
      const interval = setInterval(fetchOrders, 6000)
      return () => clearInterval(interval)
    }
  }, [status, router, fetchOrders])

  // Handle Cancellation
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return

    try {
      setCancellingId(orderId)
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Cannot cancel order")
        return
      }

      toast.success("Order cancelled successfully")
      fetchOrders()
    } catch {
      toast.error("Error cancelling order")
    } finally {
      setCancellingId(null)
    }
  }

  // Handle Reorder
  const handleReorder = (order: OrderData) => {
    order.items.forEach((item) => {
      let customs: any[] = []
      try {
        customs = JSON.parse(item.customizations)
      } catch {}

      addItem({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        imageUrl: item.menuItem.imageUrl,
        dietType: item.menuItem.dietType,
        quantity: item.quantity,
        customizations: customs,
        instructions: item.instructions || undefined,
      })
    })

    toast.success("Items added back to your cart!")
    router.push("/")
  }

  const activeOrders = orders.filter((o) => o.status !== "COLLECTED" && o.status !== "CANCELLED")
  const pastOrders = orders.filter((o) => o.status === "COLLECTED" || o.status === "CANCELLED")

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 mt-3">Loading your campus preorders...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Track active cafeteria preparations and show your QR token at pickup.
          </p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-300 transition-colors text-xs flex items-center gap-1.5"
          title="Refresh orders"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            No orders placed yet
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Ready for breakfast, snacks, or lunch? Head over to the menu to place your first preorder!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
          >
            <span>Browse Campus Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Orders Section */}
          {activeOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Active Preorders ({activeOrders.length})
              </h2>

              <div className="space-y-6">
                {activeOrders.map((order) => {
                  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status)
                  const tokenNumber = `#BB-${order.id.slice(-4).toUpperCase()}`

                  return (
                    <div
                      key={order.id}
                      className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-amber-500/30 shadow-xl space-y-6"
                    >
                      {/* Top Bar: Order ID, Token, Pickup Slot */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-extrabold text-sm shadow-xs">
                              {tokenNumber}
                            </span>
                            <span className="text-xs text-zinc-400">
                              Placed {formatDateTime(order.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Pickup Slot:{" "}
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              {formatTime(order.pickupSlot.startTime)} -{" "}
                              {formatTime(order.pickupSlot.endTime)}
                            </span>
                          </p>
                        </div>

                        {/* Status pill */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              order.status === "READY_FOR_PICKUP"
                                ? "bg-green-500 text-white animate-pulse"
                                : order.status === "PREPARING"
                                ? "bg-amber-500 text-white"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {/* Status Stepper Progression */}
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {STATUS_STEPS.map((step, idx) => {
                          const Icon = step.icon
                          const isDone = idx <= currentStepIdx
                          const isCurrent = idx === currentStepIdx

                          return (
                            <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                              <div
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                                  isCurrent
                                    ? "bg-amber-500 text-white shadow-md ring-4 ring-amber-500/20"
                                    : isDone
                                    ? "bg-emerald-500 text-white"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs font-semibold leading-tight ${
                                  isCurrent
                                    ? "text-amber-600 dark:text-amber-400 font-bold"
                                    : isDone
                                    ? "text-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-400"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Items + QR Code Pickup Section */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        {/* Items list */}
                        <div className="md:col-span-2 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Ordered Items
                          </h4>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40"
                              >
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {item.quantity}x {item.menuItem.name}
                                  </span>
                                  {item.instructions && (
                                    <p className="text-[10px] text-zinc-400 italic">
                                      Note: &quot;{item.instructions}&quot;
                                    </p>
                                  )}
                                </div>
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                  {formatPrice(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 flex justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100 border-t border-zinc-100 dark:border-zinc-800">
                            <span>Total (incl. GST)</span>
                            <span className="text-amber-600 dark:text-amber-400 text-sm">
                              {formatPrice(order.totalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Pickup QR Token Card */}
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-750 flex flex-col items-center justify-center text-center space-y-2">
                          <div className="p-2 bg-white rounded-xl shadow-xs">
                            <QRCodeSVG
                              value={`BITESBAY-ORDER:${order.id}:${tokenNumber}`}
                              size={100}
                              level="M"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                            Scan at Counter
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Token: {tokenNumber}
                          </span>
                        </div>
                      </div>

                      {/* Cancel action if order is still PLACED */}
                      {order.status === "PLACED" && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancel Order</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past Orders Section */}
          {pastOrders.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Order History ({pastOrders.length})
              </h2>

              <div className="space-y-3">
                {pastOrders.map((order) => {
                  const isCancelled = order.status === "CANCELLED"
                  const tokenNumber = `#BB-${order.id.slice(-4).toUpperCase()}`

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {tokenNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              isCancelled
                                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500">
                          {order.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(", ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {formatPrice(order.totalAmount)}
                        </span>

                        <button
                          onClick={() => handleReorder(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
