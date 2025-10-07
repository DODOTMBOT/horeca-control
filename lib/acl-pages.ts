import "server-only";
import { prisma as db } from "@/lib/db/client";
import { MENU } from "@/lib/menu.config";
import { AppRole } from "@/lib/acl";

// Role-based page access control functions

export async function getRolePageMap(tenantId: string, role: AppRole) {
  const rows = await db.rolePageAccess.findMany({ where: { tenantId, role } });
  const map = new Map(rows.map((r: any) => [r.pageSlug, r.allowed]));
  return map;
}

export function defaultAllowed(role: AppRole, slug: string): boolean {
  if (role === "OWNER") return true;
  // системные страницы без OWNER по умолчанию запрещены
  return false;
}

export function isSystemPage(slug: string) {
  return !!MENU.find(m => m.slug === slug && m.system);
}

export async function getAllowedSlugs(tenantId: string, role: AppRole) {
  const map = await getRolePageMap(tenantId, role);
  return MENU
    .filter(m => (map.has(m.slug) ? map.get(m.slug)! : defaultAllowed(role, m.slug)))
    .map(m => m.slug);
}
