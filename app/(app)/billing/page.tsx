export const runtime = "nodejs";

import { requireSession, requireTenant } from "@/lib/guards"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, CheckCircle, XCircle } from "lucide-react"

async function createCheckoutSession(plan: "BASIC" | "PRO") {
  "use server"
  
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/billing/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  })

  if (!response.ok) {
    throw new Error("Failed to create checkout session")
  }

  const { url } = await response.json()
  return url
}

async function createPortalSession() {
  "use server"
  
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/billing/portal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to create portal session")
  }

  const { url } = await response.json()
  return url
}

export default async function BillingPage() {
  await requireSession()
  const tenantSession = await requireTenant()

  // Получить подписку tenant
  if (!tenantSession.user?.tenantId) {
    throw new Error("User has no tenant")
  }
  
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId: tenantSession.user.tenantId }
  })

  const isActive = subscription?.status === "ACTIVE"
  const currentPlan = subscription?.plan || "BASIC"
  const periodEnd = subscription?.currentPeriodEnd

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Биллинг</h1>
          <p className="text-gray-600">Управление подпиской и платежами</p>
        </div>

        <div className="space-y-6">

      {/* Текущая подписка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Текущая подписка
          </CardTitle>
          <CardDescription>
            Информация о вашей подписке
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Статус:</span>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Активна</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Неактивна</>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">План:</span>
              <Badge variant="outline">{currentPlan}</Badge>
            </div>
            
            {periodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Действует до:</span>
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {periodEnd.toLocaleDateString("ru-RU")}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Планы подписки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>BASIC</CardTitle>
            <CardDescription>Базовый план</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">₽0/месяц</div>
              <ul className="text-sm space-y-2">
                <li>• До 5 пользователей</li>
                <li>• Базовые функции</li>
                <li>• Email поддержка</li>
              </ul>
              <form action={async () => {
                "use server"
                const url = await createCheckoutSession("BASIC")
                // В реальном приложении здесь был бы redirect
                console.log("Redirect to:", url)
              }}>
                <Button 
                  type="submit" 
                  className="w-full"
                  variant={currentPlan === "BASIC" ? "outline" : "default"}
                  disabled={currentPlan === "BASIC"}
                >
                  {currentPlan === "BASIC" ? "Текущий план" : "Оформить BASIC"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PRO</CardTitle>
            <CardDescription>Профессиональный план</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold">₽2,990/месяц</div>
              <ul className="text-sm space-y-2">
                <li>• Неограниченные пользователи</li>
                <li>• Все функции</li>
                <li>• Приоритетная поддержка</li>
                <li>• API доступ</li>
              </ul>
              <form action={async () => {
                "use server"
                const url = await createCheckoutSession("PRO")
                // В реальном приложении здесь был бы redirect
                console.log("Redirect to:", url)
              }}>
                <Button 
                  type="submit" 
                  className="w-full"
                  variant={currentPlan === "PRO" ? "outline" : "default"}
                  disabled={currentPlan === "PRO"}
                >
                  {currentPlan === "PRO" ? "Текущий план" : "Оформить PRO"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Управление подпиской */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Управление подпиской</CardTitle>
            <CardDescription>
              Изменить или отменить подписку
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async () => {
              "use server"
              const url = await createPortalSession()
              // В реальном приложении здесь был бы redirect
              console.log("Redirect to portal:", url)
            }}>
              <Button type="submit" variant="outline">
                Управлять подпиской (мок)
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  )
}
