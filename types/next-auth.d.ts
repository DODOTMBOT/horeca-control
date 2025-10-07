// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  type AppRole = "OWNER" | "PARTNER" | "POINT" | "EMPLOYEE" | "MANAGER";

  interface Session {
    user: {
      id: string;
      email: string | null;
      name?: string | null;
      image?: string | null;

      tenantId?: string | null;
      pointId?: string | null;
      isPlatformOwner?: boolean;
      role?: AppRole | null;
      roles?: string[];
    };
  }

  interface User {
    id: string;
    email: string | null;
    name?: string | null;
    image?: string | null;

    tenantId?: string | null;
    pointId?: string | null;
    isPlatformOwner?: boolean;
    role?: AppRole | null;
    roles?: string[];
  }
}