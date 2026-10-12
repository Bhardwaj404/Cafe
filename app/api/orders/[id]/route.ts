import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/orders/[id]">
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: true } },
      payment: true,
      pickupSlot: true,
      user: { select: { name: true, email: true, studentId: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // Students can only see their own orders
  if (
    session.user.role !== "STAFF" &&
    order.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(order)
}
