import { PaymentProvider } from "./types"
import { MockPaymentProvider } from "./mock"

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.DEV_PAYMENT_PROVIDER || "mock"
  
  switch (provider) {
    case "mock":
      return new MockPaymentProvider()
    case "stripe":
      // TODO: Implement Stripe provider
      throw new Error("Stripe provider not implemented yet")
    case "yookassa":
      // TODO: Implement YooKassa provider
      throw new Error("YooKassa provider not implemented yet")
    default:
      throw new Error(`Unknown payment provider: ${provider}`)
  }
}
