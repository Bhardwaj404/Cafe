'use client'

import React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { formatPrice, formatTime, formatDateTime } from "@/lib/utils"
import {
  ChefHat,
  Clock,
  CheckCircle2,
  PackageCheck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RotateCw,
  Utensils,
  Search,
  Sliders,
  BellRing
} from "lucide-react"
import { toast } from "sonner"

interface AdminOrderItem {
  id: string
  quantity: number
  unitPrice: number
  customizations: string
  instructions: string | null
  menuItem: {
    name: string
    prepTimeMinutes: number
    dietType: string
  }
}

interface AdminOrder {
  id: string
  status: "PLACED" | "PREPARING" | "READY_FOR_PICKUP" | "COLLECTED" | "CANCELLED"
  totalAmount: number
  note: string | null
  createdAt: string
  user: {
    name: string
    email: string
    studentId: string | null
  }
  pickupSlot: {
    startTime: string
    endTime: string
    date: string
  }
  payment: {
    status: string
    method: string
  } | null
  items: AdminOrderItem[]
}

interface DashboardMetrics {
  totalOrdersToday: number
  paidRevenueToday: number
  activePreparing: number
  readyForPickup: number
}

const KANBAN_COLUMNS = [
  {
    status: "PLACED",
    title: "1. New Orders",
    icon: Clock,
    color: "border-blue-500/30 bg-blue-500/5",
    badgeColor: "bg-blue-500 text-white",
    nextAction: "PREPARING",
    nextActionLabel: "Start Cooking 🍳",
  },
  {
    status: "PREPARING",
    title: "2. Cooking in Kitchen",
    icon: ChefHat,
    color: "border-amber-500/30 bg-amber-500/5",
    badgeColor: "bg-amber-500 text-white",
    nextAction: "READY_FOR_PICKUP",
    nextActionLabel: "Mark Ready 🔔",
  },
  {
    status: "READY_FOR_PICKUP",
    title: "3. Ready at Counter",
    icon: PackageCheck,
    color: "border-emerald-500/30 bg-emerald-500/5",
    badgeColor: "bg-emerald-500 text-white",
    nextAction: "COLLECTED",
    nextActionLabel: "Handover ✅",
  },
] as const

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [orders, setOrders] = React.useState<AdminOrder[]>([])
  const [metrics, setMetrics] = React.useState<DashboardMetrics>({
    totalOrdersToday: 0,
    paidRevenueToday: 0,
    activePreparing: 0,
    readyForPickup: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [searchFilter, setSearchFilter] = React.useState("")

  // Authentication Guard
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin")
    } else if (status === "authenticated" && session?.user?.role !== "STAFF") {
      toast.error("Staff access only")
      router.push("/")
    }
  }, [status, session, router])

  // Load Admin Data
  const loadData = React.useCallback(async () => {
    try {
      const [ordersRes, dashRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/dashboard"),
      ])

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData)
      }

      if (dashRes.ok) {
        const dashData = await dashRes.json()
        setMetrics({
          totalOrdersToday: dashData.todayOrders?.length || 0,
          paidRevenueToday: dashData.totalRevenue || 0,
          activePreparing:
            dashData.todayOrders?.filter((o: any) => o.status === "PREPARING")?.length || 0,
          readyForPickup:
            dashData.todayOrders?.filter((o: any) => o.status === "READY_FOR_PICKUP")?.length || 0,
        })
      }
    } catch {
      // quiet refresh error
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh interval (every 8s)
  React.useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "STAFF") {
      loadData()
      const interval = setInterval(loadData, 8000)
      return () => clearInterval(interval)
    }
  }, [status, session, loadData])

  // Status transition handler
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingId(orderId)
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to update status")
        return
      }

      toast.success(`Order updated to ${nextStatus.replace(/_/g, " ")}!`)
      loadData()
    } catch {
      toast.error("Failed to change order status")
    } finally {
      setUpdatingId(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 mt-3">Connecting to BitesBay Kitchen Stream...</p>
      </div>
    )
  }

  const filteredOrders = orders.filter((o) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    const matchName = o.user.name.toLowerCase().includes(q)
    const matchToken = o.id.toLowerCase().includes(q)
    const matchItem = o.items.some((i) => i.menuItem.name.toLowerCase().includes(q))
    return matchName || matchToken || matchItem
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-xl">
              🧑‍🍳
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Kitchen Operations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time prep station Kanban board with automatic live order updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by student or dish..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-1">
          <span className="text-xs font-medium text-zinc-500">Orders Today</span>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {metrics.totalOrdersToday}
          </p>
          <span className="text-[10px] text-zinc-400">Total preorders placed</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-1">
          <span className="text-xs font-medium text-zinc-500">Today&apos;s Revenue</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatPrice(metrics.paidRevenueToday)}
          </p>
          <span className="text-[10px] text-zinc-400">Paid orders tally</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-1">
          <span className="text-xs font-medium text-zinc-500">Cooking Now</span>
          <p className="text-2xl font-black text-amber-500">
            {orders.filter((o) => o.status === "PREPARING").length}
          </p>
          <span className="text-[10px] text-zinc-400">In chef queue</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-1">
          <span className="text-xs font-medium text-zinc-500">Ready at Counter</span>
          <p className="text-2xl font-black text-emerald-600">
            {orders.filter((o) => o.status === "READY_FOR_PICKUP").length}
          </p>
          <span className="text-[10px] text-zinc-400">Awaiting student pickup</span>
        </div>
      </div>

      {/* Live Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KANBAN_COLUMNS.map((column) => {
          const ColumnIcon = column.icon
          const columnOrders = filteredOrders.filter((o) => o.status === column.status)

          return (
            <div
              key={column.status}
              className={`p-4 rounded-3xl border-2 flex flex-col space-y-4 min-h-[500px] ${column.color}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <ColumnIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {column.title}
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${column.badgeColor}`}
                >
                  {columnOrders.length}
                </span>
              </div>

              {/* Order Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {columnOrders.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 text-xs">
                    No orders in this stage
                  </div>
                ) : (
                  columnOrders.map((order) => {
                    const token = `#BB-${order.id.slice(-4).toUpperCase()}`

                    return (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 hover:shadow-md transition-shadow"
                      >
                        {/* Token & Slot Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-black text-xs px-2 py-0.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                              {token}
                            </span>
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1">
                              {order.user.name}
                            </h4>
                            {order.user.studentId && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ID: {order.user.studentId}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                              {formatTime(order.pickupSlot.startTime)}
                            </span>
                            <span className="text-[10px] text-zinc-400">Pickup Slot</span>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="space-y-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                          {order.items.map((i) => (
                            <div key={i.id} className="space-y-0.5">
                              <div className="flex justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                                <span>{i.quantity}x {i.menuItem.name}</span>
                              </div>
                              {i.instructions && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-300 italic">
                                  Note: {i.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Order Special Note */}
                        {order.note && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-900 dark:text-amber-200">
                            <strong>Note:</strong> {order.note}
                          </div>
                        )}

                        {/* Total + Advance Button */}
                        <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {formatPrice(order.totalAmount)}
                          </span>

                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, column.nextAction)
                            }
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {updatingId === order.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>{column.nextActionLabel}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
