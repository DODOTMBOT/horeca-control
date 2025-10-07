import { MENU } from "@/lib/menu.config";
import { getAllowedSlugs } from "@/lib/acl-pages";
import { AppRole } from "@/lib/acl";

export async function getMenuFor(tenantId: string, roles: AppRole[]) {
  // если юзер OWNER — показываем все
  if (roles.includes("OWNER")) return MENU;

  // иначе пересечение по allowed хотя бы для одной роли юзера
  const allowedSets = await Promise.all(roles.map(r => getAllowedSlugs(tenantId, r)));
  const allowed = new Set(allowedSets.flat());
  return MENU.filter(m => allowed.has(m.slug));
}
