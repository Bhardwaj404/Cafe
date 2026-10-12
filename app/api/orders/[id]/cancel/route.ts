import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { canCancelOrder } from "@/lib/slots"

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/orders/[id]/cancel">
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params

  const order = await db.order.findUnique({
    where: { id },
    include: { payment: true, items: { include: { menuItem: true } } },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!canCancelOrder(order.status)) {
    return NextResponse.json(
      {
        error: `Order cannot be cancelled. Current status: ${order.status}. Only orders in "Placed" status can be cancelled.`,
      },
      { status: 409 }
    )
  }

  // Transactional cancellation
  await db.$transaction(async (tx) => {
    // Cancel order
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    })

    // Handle payment refund status
    if (order.payment) {
      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          status:
            order.payment.status === "PAID"
              ? "REFUND_INITIATED"
              : order.payment.status,
        },
      })
    }

    // Free pickup slot
    await tx.pickupSlot.update({
      where: { id: order.pickupSlotId },
      data: { currentCount: { decrement: 1 } },
    })

    // Restore stock
    for (const item of order.items) {
      if (item.menuItem.stockCount !== null) {
        await tx.menuItem.update({
          where: { id: item.menuItemId },
          data: { stockCount: { increment: item.quantity } },
        })
      }
    }
  })

  return NextResponse.json({ success: true, message: "Order cancelled successfully." })
}
