import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { paymentGateway } from "@/lib/payment"
import { paymentVerifySchema } from "@/lib/validations"
import { broadcastOrderStatus } from "@/app/api/orders/[id]/status/route"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = paymentVerifySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  })

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // Verify Razorpay signature
  const isValid = await paymentGateway.verifyPayment({
    orderId,
    gatewayOrderId: razorpayOrderId,
    gatewayPaymentId: razorpayPaymentId,
    gatewaySignature: razorpaySignature,
  })

  if (!isValid) {
    await db.payment.update({
      where: { orderId },
      data: { status: "FAILED" },
    })
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
  }

  // Mark payment as paid
  await db.payment.update({
    where: { orderId },
    data: {
      status: "PAID",
      gatewayRef: razorpayPaymentId,
    },
  })

  // Broadcast status
  broadcastOrderStatus(orderId, "PLACED")

  return NextResponse.json({ success: true })
}
