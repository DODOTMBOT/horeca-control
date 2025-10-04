import { NextRequest, NextResponse } from "next/server"
import { getPaymentProvider } from "@/lib/payments"

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("stripe-signature") || request.headers.get("x-yookassa-signature")

    const provider = getPaymentProvider()
    
    if (!provider.verifyWebhook) {
      return NextResponse.json({ error: "Webhook verification not supported" }, { status: 400 })
    }

    const event = await provider.verifyWebhook(rawBody, signature || undefined)

    // Здесь можно обработать событие webhook
    console.log("Webhook event received:", event.type, event.data)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
