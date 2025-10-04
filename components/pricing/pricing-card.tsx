"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface PricingCardProps {
  name: string
  description: string
  price: number
  priceId: string
  features: string[]
  popular?: boolean
  onSubscribe: (priceId: string) => void
}

export function PricingCard({ 
  name, 
  description, 
  price, 
  priceId, 
  features, 
  popular = false,
  onSubscribe 
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      await onSubscribe(priceId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`relative ${popular ? 'border-primary shadow-lg' : ''}`}>
      {popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          Популярный
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="text-3xl font-bold">
          {price === 0 ? 'Бесплатно' : `$${price}/месяц`}
        </div>
      </CardHeader>
      
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Выбрать план'}
        </Button>
      </CardFooter>
    </Card>
  )
}
