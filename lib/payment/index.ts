/**
 * Payment gateway abstraction layer.
 * 
 * Default: Mock gateway (UPI, Card, Cash at Counter - all succeed immediately)
 * Production: Razorpay (enabled when RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set)
 */

export interface CreatePaymentResult {
  success: boolean
  gatewayOrderId?: string
  clientData?: Record<string, string> // data to send to client (e.g. Razorpay key)
  error?: string
}

export interface VerifyPaymentInput {
  orderId: string
  gatewayOrderId: string
  gatewayPaymentId: string
  gatewaySignature: string
}

export interface PaymentGateway {
  createOrder(amountPaise: number, orderId: string): Promise<CreatePaymentResult>
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>
  isMock: boolean
}

// Import the appropriate gateway
function getGateway(): PaymentGateway {
  if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
  ) {
    // Dynamically require to avoid loading Razorpay SDK in non-production
    const { RazorpayGateway } = require("./razorpay") as typeof import("./razorpay")
    return new RazorpayGateway()
  }
  const { MockGateway } = require("./mock") as typeof import("./mock")
  return new MockGateway()
}

export const paymentGateway = getGateway()
