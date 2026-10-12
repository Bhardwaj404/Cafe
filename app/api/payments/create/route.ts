import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { paymentGateway } from "@/lib/payment"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orderId } = await request.json() as { orderId: string }
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  })

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (!order.payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 })
  }

  // If cash at counter — no gateway needed
  if (order.payment.method === "CASH_AT_COUNTER") {
    return NextResponse.json({
      mode: "cash",
      isMock: true,
      message: "Pay at the counter when collecting your order.",
    })
  }

  const result = await paymentGateway.createOrder(order.totalAmount, order.id)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Payment gateway error" },
      { status: 500 }
    )
  }

  // Update payment with gateway order ID
  await db.payment.update({
    where: { orderId: order.id },
    data: { gatewayOrderId: result.gatewayOrderId },
  })

  return NextResponse.json({
    mode: paymentGateway.isMock ? "mock" : "razorpay",
    isMock: paymentGateway.isMock,
    gatewayOrderId: result.gatewayOrderId,
    amount: order.totalAmount,
    ...result.clientData,
  })
}
