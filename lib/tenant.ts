import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type AppRole = 'OWNER' | 'PARTNER' | 'POINT' | 'EMPLOYEE';

export async function getTenantIdFromSessionStrict(): Promise<string> {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  if (!tenantId) throw new Error('No tenantId in session');
  return tenantId;
}

export async function getTenantIdFromSession(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return ((session?.user as any)?.tenantId as string | undefined) ?? null;
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function requireTenantId(): Promise<string> {
  const tenantId = await getTenantIdFromSession();
  if (!tenantId) throw new Error('No tenantId in session');
  return tenantId;
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export async function getUserContext(): Promise<{ userId: string; tenantId: string; role: AppRole }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Not authenticated');
  const tenantId = (session.user as any)?.tenantId as string | undefined;
  const role = (((session.user as any)?.role || 'EMPLOYEE') as string).toUpperCase() as AppRole;
  if (!tenantId) throw new Error('No tenantId in session');
  return { userId: session.user.id, tenantId, role };
}

export function canManageCourses(session: any): boolean {
  const role = (((session?.user as any)?.role || '') as string).toUpperCase();
  return role === 'OWNER' || role === 'MANAGER';
}

