import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPaymentProvider } from "@/lib/payments"
import { prisma } from "@/lib/prisma"

export async function POST(_request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Найти tenant текущего пользователя
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenants: true }
    })

    if (!user?.tenantId) {
      return NextResponse.json({ error: "User has no tenant" }, { status: 400 })
    }

    // Создать portal session
    const provider = getPaymentProvider()
    const portalSession = await provider.createPortalSession({
      tenantId: user.tenantId,
      userId: session.user.id,
      returnUrl: `${process.env.NEXTAUTH_URL}/billing`
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
