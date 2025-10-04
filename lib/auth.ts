import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== "production",
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        try {
          const email = (creds?.email || "").trim().toLowerCase()
          const password = String(creds?.password || "")
          if (!email || !password) return null
          
          const user = await prisma.user.findUnique({ where: { email } })
          if (!user || !user.passwordHash) return null
          
          const ok = await bcrypt.compare(password, user.passwordHash)
          if (!ok) return null
          
          console.log("✅ Auth working - User signed in:", user.email)
          return { id: user.id, email: user.email, name: user.name || null }
        } catch (error) {
          console.error("[authorize]", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        // Get user with tenant info
        const userWithTenant = await prisma.user.findUnique({
          where: { id: user.id },
          include: { tenants: true }
        })
        token.isPlatformOwner = userWithTenant?.isPlatformOwner || false
        token.tenantId = userWithTenant?.tenantId || null
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string
        session.user.isPlatformOwner = token.isPlatformOwner as boolean
        session.user.tenantId = token.tenantId as string | null
      }
      return session
    },
  },
}

// Унифицированный хелпер для серверных компонентов
export async function auth() {
  return getServerSession(authOptions)
}

// Для обратной совместимости
export const authConfig = authOptions

// Логи для проверки конфигурации
console.log("[auth] config ok:", !!process.env.NEXTAUTH_SECRET, process.env.NEXTAUTH_URL)