"use client"

import { useState } from "react"
import { PricingCard } from "@/components/pricing/pricing-card"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Базовый",
    description: "Для небольших заведений",
    price: 0,
    priceId: "free",
    features: [
      "До 5 сотрудников",
      "Базовые отчеты",
      "Email поддержка",
      "1 заведение"
    ]
  },
  {
    name: "Профессиональный",
    description: "Для растущего бизнеса",
    price: 29,
    priceId: "price_professional", // Замените на реальный price_id из Stripe
    features: [
      "До 50 сотрудников",
      "Расширенная аналитика",
      "Приоритетная поддержка",
      "До 5 заведений",
      "Интеграции с POS"
    ],
    popular: true
  },
  {
    name: "Корпоративный",
    description: "Для крупных сетей",
    price: 99,
    priceId: "price_enterprise", // Замените на реальный price_id из Stripe
    features: [
      "Неограниченное количество сотрудников",
      "Полная аналитика и BI",
      "24/7 поддержка",
      "Неограниченное количество заведений",
      "Все интеграции",
      "Персональный менеджер"
    ]
  }
]

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [_loading, _setLoading] = useState(false)

  const handleSubscribe = async (priceId: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (priceId === "free") {
      // Обработка бесплатного плана
      router.push('/dashboard')
      return
    }

    _setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const { sessionId } = await response.json()
      
      if (sessionId) {
        // Перенаправляем на Stripe Checkout
        window.location.href = `https://checkout.stripe.com/pay/${sessionId}`
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      _setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Выберите план подписки
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Начните с бесплатного плана и масштабируйтесь по мере роста
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Все планы включают 14-дневный бесплатный пробный период
          </p>
        </div>
      </div>
    </div>
  )
}
