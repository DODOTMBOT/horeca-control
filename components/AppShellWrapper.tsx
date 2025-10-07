import { getUserPermissionsWithRole, getPartnerPoints, getCurrentPoint } from "@/lib/acl";
import { getVisibleMenuItems } from "@/lib/permissions";
import AppShell from "./AppShell";

interface AppShellWrapperProps {
  children: React.ReactNode;
  session: any;
  userRole: string | null;
}

export default async function AppShellWrapper({ 
  children, 
  session, 
  userRole 
}: AppShellWrapperProps) {
  // Получаем разрешения пользователя
  const { permissions } = await getUserPermissionsWithRole(
    session.user.id, 
    session.user.tenantId
  );
  
  // Получаем видимые пункты меню
  const visibleMenuItems = getVisibleMenuItems(permissions);
  
  // Получаем точки партнера (если есть права)
  const partnerPoints = permissions.points.viewPoints 
    ? await getPartnerPoints(session.user.id)
    : [];
  
  // Получаем текущую точку
  const currentPoint = session.user.pointId 
    ? await getCurrentPoint(session.user.pointId)
    : null;

  return (
    <AppShell
      session={session}
      userRole={userRole}
      partnerPoints={partnerPoints}
      currentPoint={currentPoint}
      visibleMenuItems={visibleMenuItems}
      permissions={permissions}
    >
      {children}
    </AppShell>
  );
}
