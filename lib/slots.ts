/**
 * Slot generation and capacity logic.
 * 
 * Slots are computed on-the-fly from CafeteriaSettings.
 * Only "booked" slots exist in the DB as PickupSlot records.
 */

import type { CafeteriaSettings, PickupSlot } from "@prisma/client"

export interface SlotInfo {
  id: string | null // null = not yet created in DB
  startTime: Date
  endTime: Date
  capacity: number
  currentCount: number
  isFull: boolean
  isAvailable: boolean // not in past, not full
  label: string // "1:15 PM"
}

/**
 * Generate all slots for a given date based on cafeteria settings.
 * Merges with existing DB slots for count data.
 */
export function generateSlots(
  dateStr: string, // "YYYY-MM-DD"
  settings: Pick<CafeteriaSettings, "openTime" | "closeTime" | "slotLengthMinutes" | "slotCapacity">,
  existingSlots: PickupSlot[],
  nowOverride?: Date
): SlotInfo[] {
  const now = nowOverride ?? new Date()
  const [openH, openM] = settings.openTime.split(":").map(Number)
  const [closeH, closeM] = settings.closeTime.split(":").map(Number)

  const dayStart = new Date(`${dateStr}T00:00:00`)
  const openTime = new Date(dayStart)
  openTime.setHours(openH, openM, 0, 0)
  const closeTime = new Date(dayStart)
  closeTime.setHours(closeH, closeM, 0, 0)

  const slots: SlotInfo[] = []
  let cursor = new Date(openTime)

  while (cursor < closeTime) {
    const slotStart = new Date(cursor)
    const slotEnd = new Date(cursor.getTime() + settings.slotLengthMinutes * 60000)

    // Find matching DB slot
    const existing = existingSlots.find(
      (s) => Math.abs(s.startTime.getTime() - slotStart.getTime()) < 1000
    )

    const capacity = existing?.capacity ?? settings.slotCapacity
    const currentCount = existing?.currentCount ?? 0
    const isFull = currentCount >= capacity

    slots.push({
      id: existing?.id ?? null,
      startTime: slotStart,
      endTime: slotEnd,
      capacity,
      currentCount,
      isFull,
      isAvailable: slotStart > now && !isFull,
      label: formatSlotTime(slotStart),
    })

    cursor = new Date(slotEnd)
  }

  return slots
}

function formatSlotTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Find the earliest available slot for a given date.
 * earliestAllowedTime = now + maxPrepTime + bufferMinutes
 */
export function findEarliestSlot(
  slots: SlotInfo[],
  maxPrepTimeMinutes: number,
  bufferMinutes: number,
  nowOverride?: Date
): SlotInfo | null {
  const now = nowOverride ?? new Date()
  const earliest = new Date(now.getTime() + (maxPrepTimeMinutes + bufferMinutes) * 60000)

  return (
    slots.find((s) => s.isAvailable && s.startTime >= earliest) ?? null
  )
}

/**
 * Calculate the earliest pickup time given a cart's max prep time.
 */
export function calcEarliestPickupTime(
  maxPrepTimeMinutes: number,
  bufferMinutes: number,
  slotLengthMinutes: number,
  nowOverride?: Date
): Date {
  const now = nowOverride ?? new Date()
  const minPickup = new Date(
    now.getTime() + (maxPrepTimeMinutes + bufferMinutes) * 60000
  )
  // Round up to next slot boundary
  const slotMs = slotLengthMinutes * 60000
  const rounded = new Date(Math.ceil(minPickup.getTime() / slotMs) * slotMs)
  return rounded
}

/**
 * Check if an order can be cancelled (only if status is PLACED).
 */
export function canCancelOrder(status: string): boolean {
  return status === "PLACED"
}

/**
 * Calculate order totals from items (paise).
 */
export function calculateOrderTotal(
  items: Array<{ unitPrice: number; quantity: number; customizations: string }>
): { subtotal: number; gst: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    let price = item.unitPrice * item.quantity
    try {
      const customizations = JSON.parse(item.customizations) as Array<{
        priceModifier: number
      }>
      price += customizations.reduce((m, c) => m + (c.priceModifier ?? 0), 0) * item.quantity
    } catch {
      // ignore invalid JSON
    }
    return sum + price
  }, 0)

  const gst = Math.round(subtotal * 0.05)
  const total = subtotal + gst

  return { subtotal, gst, total }
}
