import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserRole, getPartnerPoints, getCurrentPoint } from "@/lib/acl";
import { getMenuFor } from "@/lib/menu.filter";
import { prisma as db } from "@/lib/db/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PointSwitcherWrapper from "@/components/PointSwitcherWrapper";
import AppShellDynamic from "@/components/AppShellDynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.id && session?.user?.tenantId ? await getUserRole(session.user.id, session.user.tenantId) : null;
  
  // Получаем точки для партнеров
  const partnerPoints = session?.user?.id && userRole === "PARTNER" 
    ? await getPartnerPoints(session.user.id) 
    : [];
  
  // Получаем текущую точку
  const currentPoint = session?.user?.id && userRole === "POINT"
    ? await getCurrentPoint(session.user.id)
    : null;

  // Получаем отфильтрованное меню на основе ролей пользователя
  let filteredMenu = null;
  if (session?.user?.id && session?.user?.tenantId && userRole) {
    const rolesRows = await db.userRole.findMany({ 
      where: { 
        userId: session.user.id, 
        tenantId: session.user.tenantId 
      },
      select: {
        role: {
          select: { name: true }
        }
      }
    });
    const roles = rolesRows.map((r: any) => r.role.name.toUpperCase() as any);
    filteredMenu = await getMenuFor(session.user.tenantId, roles);
  }

  return (
    <AppShellDynamic 
      session={session}
      userRole={userRole}
      partnerPoints={partnerPoints}
      currentPoint={currentPoint}
      filteredMenu={filteredMenu}
    >
      {children}
    </AppShellDynamic>
  );
}
