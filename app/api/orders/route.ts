import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createOrderSchema } from "@/lib/validations"
import { createOrderServer } from "@/server/orders"

// Simple in-memory rate limiter
const orderRequests = new Map<string, { count: number; resetAt: number }>()
const MAX_ORDERS_PER_MINUTE = 5

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = orderRequests.get(userId)
  if (!entry || entry.resetAt < now) {
    orderRequests.set(userId, { count: 1, resetAt: now + 60000 })
    return true
  }
  if (entry.count >= MAX_ORDERS_PER_MINUTE) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    )
  }

  const body = await request.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const order = await createOrderServer(parsed.data)
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order creation failed"

    if (message === "SLOT_FULL") {
      return NextResponse.json(
        { error: "The selected pickup slot is now full. Please choose another time." },
        { status: 409 }
      )
    }
    if (message.startsWith("ITEM_UNAVAILABLE:")) {
      const item = message.split(":")[1]
      return NextResponse.json(
        { error: `"${item}" is no longer available. Please remove it from your cart.` },
        { status: 409 }
      )
    }
    if (message.startsWith("ITEM_INSUFFICIENT_STOCK:")) {
      const item = message.split(":")[1]
      return NextResponse.json(
        { error: `Not enough stock for "${item}". Please reduce quantity.` },
        { status: 409 }
      )
    }
    if (message === "SLOT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Pickup slot not found. Please re-select a pickup time." },
        { status: 409 }
      )
    }

    console.error("Order creation error:", err)
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { menuItem: true },
      },
      payment: true,
      pickupSlot: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}
