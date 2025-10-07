import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserRole, getPartnerPoints, getCurrentPoint } from "@/lib/acl";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PointSwitcherWrapper from "@/components/PointSwitcherWrapper";
import AppShell from "@/components/AppShell";

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

  return (
    <AppShell 
      session={session}
      userRole={userRole}
      partnerPoints={partnerPoints}
      currentPoint={currentPoint}
    >
      {children}
    </AppShell>
  );
}
