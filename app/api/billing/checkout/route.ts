export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPaymentProvider } from "@/lib/payments"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan } = await request.json()
    
    if (!plan || !["BASIC", "PRO"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Найти tenant текущего пользователя
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenants: true }
    })

    if (!user?.tenantId) {
      return NextResponse.json({ error: "User has no tenant" }, { status: 400 })
    }

    // Создать checkout session
    const provider = getPaymentProvider()
    const checkoutSession = await provider.createCheckoutSession({
      tenantId: user.tenantId,
      plan: plan as "BASIC" | "PRO",
      successUrl: `${process.env.NEXTAUTH_URL}/billing?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
      userId: session.user.id
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
