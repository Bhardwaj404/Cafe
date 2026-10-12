import type { PaymentGateway, CreatePaymentResult, VerifyPaymentInput } from "./index"

/**
 * Mock payment gateway — all payments succeed immediately.
 * Used when RAZORPAY_KEY_ID is not set.
 */
export class MockGateway implements PaymentGateway {
  isMock = true as const

  async createOrder(
    amountPaise: number,
    orderId: string
  ): Promise<CreatePaymentResult> {
    // Simulate a small network delay
    await new Promise((r) => setTimeout(r, 200))
    return {
      success: true,
      gatewayOrderId: `mock_order_${orderId.slice(-8)}`,
      clientData: { mode: "mock" },
    }
  }

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    // Mock always succeeds
    return true
  }
}
