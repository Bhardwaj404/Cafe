import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { updateOrderStatusSchema } from "@/lib/validations"

// SSE broadcast map: orderId -> Set<(data: string) => void>
export const sseClients = new Map<string, Set<(data: string) => void>>()

export function broadcastOrderStatus(orderId: string, status: string) {
  const listeners = sseClients.get(orderId)
  if (listeners) {
    const data = JSON.stringify({ status, timestamp: new Date().toISOString() })
    listeners.forEach((send) => send(data))
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/orders/[id]/status">
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await ctx.params
  const body = await request.json()
  const parsed = updateOrderStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { id },
    include: { payment: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const updates: Parameters<typeof db.order.update>[0]["data"] = {
    status: parsed.data.status,
  }

  // If staff marks cash order as COLLECTED, mark payment as PAID
  if (
    parsed.data.status === "COLLECTED" &&
    order.payment?.method === "CASH_AT_COUNTER" &&
    order.payment?.status === "PENDING"
  ) {
    await db.payment.update({
      where: { orderId: id },
      data: { status: "PAID" },
    })
  }

  const updated = await db.order.update({
    where: { id },
    data: updates,
    include: { payment: true, items: { include: { menuItem: true } }, pickupSlot: true },
  })

  // Broadcast to SSE listeners
  broadcastOrderStatus(id, parsed.data.status)

  return NextResponse.json(updated)
}
