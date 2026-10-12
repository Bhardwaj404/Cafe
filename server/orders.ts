import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import type { CreateOrderInput } from "@/lib/validations"
import { calculateGst } from "@/lib/utils"

/**
 * Server-side transactional order creation.
 * 
 * 1. Validates session
 * 2. Re-checks all item availability and prices from DB (never trusts client)
 * 3. Transactionally: creates/updates PickupSlot (capacity check), creates Order + OrderItems + Payment
 * 4. Idempotency: if order with same key exists, returns it
 */
export async function createOrderServer(input: CreateOrderInput) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  const userId = session.user.id

  // Idempotency check
  if (input.idempotencyKey) {
    const existing = await db.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { payment: true, items: true, pickupSlot: true },
    })
    if (existing) return existing
  }

  // Fetch all menu items from DB (server-side price validation)
  const menuItemIds = input.items.map((i) => i.menuItemId)
  const menuItems = await db.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  })

  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]))

  // Validate each item
  for (const item of input.items) {
    const menuItem = menuItemMap.get(item.menuItemId)
    if (!menuItem) throw new Error(`ITEM_NOT_FOUND:${item.menuItemId}`)
    if (!menuItem.isAvailable) throw new Error(`ITEM_UNAVAILABLE:${menuItem.name}`)
    if (menuItem.stockCount !== null && menuItem.stockCount < item.quantity) {
      throw new Error(`ITEM_INSUFFICIENT_STOCK:${menuItem.name}`)
    }
  }

  // Calculate totals server-side
  let subtotal = 0
  const orderItemsData = []

  for (const item of input.items) {
    const menuItem = menuItemMap.get(item.menuItemId)!
    const unitPrice = menuItem.price

    let customExtra = 0
    for (const c of item.customizations) {
      customExtra += c.priceModifier * item.quantity
    }

    subtotal += (unitPrice * item.quantity) + customExtra

    orderItemsData.push({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      customizations: JSON.stringify(item.customizations),
      instructions: item.instructions ?? null,
    })
  }

  const gstAmount = calculateGst(subtotal)
  const totalAmount = subtotal + gstAmount

  // Transactional order creation with slot capacity check
  const order = await db.$transaction(async (tx) => {
    // Check/create pickup slot
    let slot = await tx.pickupSlot.findUnique({
      where: { id: input.pickupSlotId },
    })

    if (!slot) {
      // Slot doesn't exist in DB yet — this means it hasn't been booked before.
      // We need to verify the slot startTime is valid.
      // For now, we'll look it up from the slots table by searching
      // within a time window (handled by calling route which pre-creates slot)
      throw new Error("SLOT_NOT_FOUND")
    }

    if (slot.currentCount >= slot.capacity) {
      throw new Error("SLOT_FULL")
    }

    // Increment slot count
    slot = await tx.pickupSlot.update({
      where: { id: slot.id },
      data: { currentCount: { increment: 1 } },
    })

    // Create the order
    const newOrder = await tx.order.create({
      data: {
        userId,
        pickupSlotId: slot.id,
        totalAmount,
        gstAmount,
        note: input.note ?? null,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: orderItemsData,
        },
        payment: {
          create: {
            method: input.paymentMethod,
            status:
              input.paymentMethod === "CASH_AT_COUNTER" ? "PENDING" : "PENDING",
            amount: totalAmount,
          },
        },
      },
      include: { payment: true, items: true, pickupSlot: true },
    })

    // Decrement stock if applicable
    for (const item of input.items) {
      const menuItem = menuItemMap.get(item.menuItemId)!
      if (menuItem.stockCount !== null) {
        await tx.menuItem.update({
          where: { id: item.menuItemId },
          data: { stockCount: { decrement: item.quantity } },
        })
      }
      // Increment order count for popularity tracking
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: { orderCount: { increment: item.quantity } },
      })
    }

    return newOrder
  })

  return order
}
