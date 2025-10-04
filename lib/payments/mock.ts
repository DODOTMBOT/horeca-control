import { PaymentProvider, PlanKey } from "./types"
import { prisma } from "@/lib/prisma"

export class MockPaymentProvider implements PaymentProvider {
  name = "mock" as const

  async createCheckoutSession(params: {
    tenantId: string;
    plan: PlanKey;
    successUrl: string;
    cancelUrl: string;
    userId: string;
  }): Promise<{ url: string }> {
    // Запретить работу в production, если не разрешено
    if (process.env.NODE_ENV === "production" && process.env.DEV_PAYMENT_ALLOW_IN_PROD !== "true") {
      throw new Error("Mock payment provider is not allowed in production")
    }

    const { tenantId, plan, successUrl } = params

    // Upsert subscription в базе данных
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30) // +30 дней

    await prisma.subscription.upsert({
      where: { tenantId },
      update: {
        plan,
        status: "ACTIVE",
        currentPeriodEnd,
        updatedAt: new Date()
      },
      create: {
        tenantId,
        plan,
        status: "ACTIVE",
        currentPeriodEnd,
      }
    })

    // Возвращаем URL с параметрами для успешной оплаты
    const url = new URL(successUrl)
    url.searchParams.set("mock", "1")
    url.searchParams.set("plan", plan)

    return { url: url.toString() }
  }

  async createPortalSession(params: {
    tenantId: string;
    userId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const { returnUrl } = params
    
    // Возвращаем URL портала (заглушка)
    const url = returnUrl || "/billing?portal=mock"
    return { url }
  }

  async verifyWebhook(_rawBody: string, _signature?: string): Promise<{ type: string; data: unknown }> {
    // Возвращаем фиктивное событие
    return {
      type: "payment.succeeded",
      data: {
        id: "mock_payment_" + Date.now(),
        amount: 1000,
        currency: "rub",
        status: "succeeded"
      }
    }
  }
}
