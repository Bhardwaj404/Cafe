import type { PaymentGateway, CreatePaymentResult, VerifyPaymentInput } from "./index"
import crypto from "crypto"

/**
 * Razorpay payment gateway — enabled when RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set.
 */
export class RazorpayGateway implements PaymentGateway {
  isMock = false as const
  private keyId: string
  private keySecret: string

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID!
    this.keySecret = process.env.RAZORPAY_KEY_SECRET!
  }

  async createOrder(
    amountPaise: number,
    orderId: string
  ): Promise<CreatePaymentResult> {
    try {
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `receipt_${orderId.slice(-8)}`,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        return { success: false, error: err.error?.description ?? "Payment creation failed" }
      }

      const data = await response.json() as { id: string }
      return {
        success: true,
        gatewayOrderId: data.id,
        clientData: { razorpayKeyId: this.keyId, razorpayOrderId: data.id },
      }
    } catch (err) {
      return { success: false, error: "Network error creating payment" }
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    const body = `${input.gatewayOrderId}|${input.gatewayPaymentId}`
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex")
    return expectedSignature === input.gatewaySignature
  }
}
