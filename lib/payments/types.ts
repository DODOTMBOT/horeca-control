export type PlanKey = "BASIC" | "PRO";

export type CheckoutSession = { url: string };

export interface PaymentProvider {
  name: "mock" | "stripe" | "yookassa";
  createCheckoutSession(params: {
    tenantId: string;
    plan: PlanKey;
    successUrl: string;
    cancelUrl: string;
    userId: string;
  }): Promise<CheckoutSession>;
  createPortalSession(params: {
    tenantId: string;
    userId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;
  verifyWebhook?(rawBody: string, signature?: string): Promise<{ type: string; data: unknown }>;
}
