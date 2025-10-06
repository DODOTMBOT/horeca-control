export const runtime = "nodejs";

import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { getUserRole } from "@/lib/acl"

// Роли уже созданы через скрипт cleanup-roles.js

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== "production",
  session: { strategy: "jwt" },
  pages: { 
    signIn: "/signin",
    signOut: "/"
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: {}, password: {} },
          async authorize(creds) {
            try {
              console.log('🔧 Authorize called with:', { email: creds?.email });
              
              const email = (creds?.email || "").trim().toLowerCase()
              const password = String(creds?.password || "")
              if (!email || !password) {
                console.log('❌ Missing email or password');
                return null;
              }
              
              const user = await prisma.user.findUnique({ where: { email } })
              if (!user || !user.passwordHash) {
                console.log('❌ User not found or no password hash');
                return null;
              }
              
              const ok = await bcrypt.compare(password, user.passwordHash)
              if (!ok) {
                console.log('❌ Password mismatch');
                return null;
              }
              
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
    async jwt({ token, user }) {
      console.log('🔧 JWT callback called:', { userId: token.sub, user: user?.email });
      
      const userId = (user && (user as unknown as Record<string, unknown>).id) || token.sub;
      if (!userId || typeof userId !== 'string') {
        console.log('❌ No valid userId found');
        return token;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            tenantId: true,
            isPlatformOwner: true,
            pointId: true,
            tenant: { select: { id: true, name: true } },
            UserRole: {
              where: token?.tenantId ? { tenantId: token.tenantId as string } : undefined,
              select: { 
                role: {
                  select: {
                    name: true
                  }
                }, 
                tenantId: true 
              }
            }
          }
        });
        
        if (!dbUser) {
          console.log('❌ User not found in database');
          return token;
        }

        console.log('✅ User found:', { email: dbUser.email, isPlatformOwner: dbUser.isPlatformOwner });

        // Получаем роль пользователя по новой системе
        const userRole = await getUserRole(userId, dbUser.tenantId);
        console.log('🎭 User role determined:', userRole);
        
        // В новой системе у нас только одна роль на пользователя
        const roles = userRole ? [userRole] : [];

        (token as Record<string, unknown>).roles = roles;
        (token as Record<string, unknown>).role = userRole; // Новая роль
        (token as Record<string, unknown>).tenantId = dbUser.tenantId ?? null;
        (token as Record<string, unknown>).pointId = dbUser.pointId ?? null;
        (token as Record<string, unknown>).isPlatformOwner = userRole === "Owner";
        
        console.log('✅ JWT token updated:', { role: userRole, roles, isPlatformOwner: userRole === "Owner" });
        return token;
      } catch (error) {
        console.error('❌ Error in JWT callback:', error);
        return token;
      }
    },
    async session({ session, token }) {
      console.log('🔧 Session callback called:', { token: token.sub, role: (token as any).role });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!session.user) session.user = {} as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).id = token.sub;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).roles = (token as any).roles || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).role = (token as any).role; // Новая роль
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).tenantId = (token as any).tenantId ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).pointId = (token as any).pointId ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).isPlatformOwner = !!(token as any).isPlatformOwner;
      
      console.log('✅ Session updated:', { 
        email: session.user.email, 
        role: (session.user as any).role,
        isPlatformOwner: (session.user as any).isPlatformOwner 
      });
      
      return session;
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