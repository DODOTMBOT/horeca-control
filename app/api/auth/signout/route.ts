import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      // Очищаем сессию
      // NextAuth автоматически очистит JWT токен
    }
    
    // Редиректим на главную страницу
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
