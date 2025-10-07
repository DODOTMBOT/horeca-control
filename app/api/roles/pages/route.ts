import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppRole } from "@prisma/client";
import { MENU } from "@/lib/menu.config";
import { isSystemPage } from "@/lib/acl-pages";

// GET ?tenantId=...&role=OWNER
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const role = searchParams.get("role") as AppRole | null;

  if (!tenantId || !role) return NextResponse.json({ error: "Bad Request" }, { status: 400 });

  // Только OWNER этого tenant может читать/редактировать матрицу
  const isOwner = await db.userRole.findFirst({ 
    where: { 
      userId: session.user.id, 
      tenantId, 
      role: { name: "OWNER" } 
    } 
  });
  if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db.rolePageAccess.findMany({ where: { tenantId, role } });
  // Вернём полный список страниц, подставив allowed из БД/дефолтов
  const map = new Map(rows.map((r: any) => [r.pageSlug, r.allowed]));
  const data = MENU.map(m => ({
    slug: m.slug,
    label: m.label,
    system: m.system,
    allowed: map.has(m.slug) ? map.get(m.slug)! : (role === "OWNER"),
  }));

  return NextResponse.json({ items: data });
}

// POST body: { tenantId, role, updates: Array<{slug: string, allowed: boolean}> }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tenantId, role, updates } = body as {
    tenantId: string; role: AppRole; updates: Array<{ slug: string; allowed: boolean }>;
  };
  if (!tenantId || !role || !Array.isArray(updates)) return NextResponse.json({ error: "Bad Request" }, { status: 400 });

  // Только OWNER этого tenant может править матрицу
  const isOwner = await db.userRole.findFirst({ 
    where: { 
      userId: session.user.id, 
      tenantId, 
      role: { name: "OWNER" } 
    } 
  });
  if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Запретить отключать системные страницы для OWNER и запрещать /owner где это критично
  for (const u of updates) {
    if (role === "OWNER" && isSystemPage(u.slug) && u.allowed === false) {
      return NextResponse.json({ error: `Cannot disable system page ${u.slug} for OWNER` }, { status: 400 });
    }
  }

  await db.$transaction(async (tx: any) => {
    for (const u of updates) {
      await tx.rolePageAccess.upsert({
        where: { tenantId_role_pageSlug: { tenantId, role, pageSlug: u.slug } },
        update: { allowed: u.allowed },
        create: { tenantId, role, pageSlug: u.slug, allowed: u.allowed },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
