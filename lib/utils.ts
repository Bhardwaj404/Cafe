/**
 * Utility functions
 */

/** Format paise to INR string e.g. 4500 → "₹45.00" */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`
}

/** Parse INR string to paise e.g. "45.00" → 4500 */
export function parsePriceToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/** Calculate GST (5%) on amount in paise, returns GST in paise */
export function calculateGst(amountPaise: number, rate = 0.05): number {
  return Math.round(amountPaise * rate)
}

/** Format minutes as "X min" or "X hr Y min" */
export function formatPrepTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Format a date string "YYYY-MM-DD" as "Today", "Tomorrow" or "Mon, 13 Oct" */
export function formatDateLabel(dateStr: string): string {
  const today = new Date()
  const date = new Date(dateStr + "T00:00:00")
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}

/** Format a DateTime as "1:15 PM" */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
}

/** Format a DateTime as "Mon, 13 Oct at 1:15 PM" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/** Get today's date as "YYYY-MM-DD" in IST */
export function getTodayDateStr(): string {
  const now = new Date()
  // Adjust for IST (UTC+5:30)
  const ist = new Date(now.getTime() + (330 - now.getTimezoneOffset()) * 60000)
  return ist.toISOString().split("T")[0]
}

/** cn — merge class names (tailwind-merge) */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate a short order number from CUID */
export function shortOrderId(id: string): string {
  return id.slice(-8).toUpperCase()
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/** Format order status for display */
export function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    PLACED: "Order Placed",
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready for Pickup",
    COLLECTED: "Collected",
    CANCELLED: "Cancelled",
  }
  return map[status] ?? status
}

/** Compute countdown string from target date */
export function getCountdown(target: Date | string): string {
  const t = typeof target === "string" ? new Date(target) : target
  const diff = t.getTime() - Date.now()
  if (diff <= 0) return "Now"
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    return `${h}h ${mins % 60}m`
  }
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}
