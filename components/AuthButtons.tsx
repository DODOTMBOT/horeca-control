"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogIn, LogOut, User, UserPlus } from "lucide-react"
import { useEffect, useState } from "react"

export function AuthButtons() {
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button disabled>Загрузка...</Button>
  }

  if (status === "loading") {
    return <Button disabled>Загрузка...</Button>
  }

  if (session) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <User className="h-4 w-4" />
          <span>Привет, {session.user?.name || session.user?.email}!</span>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button>
              В дашборд
            </Button>
          </Link>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Link href="/signin">
        <Button className="w-full">
          <LogIn className="h-4 w-4 mr-2" />
          Войти
        </Button>
      </Link>
      <Link href="/signup">
        <Button variant="outline" className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Регистрация
        </Button>
      </Link>
    </div>
  )
}
