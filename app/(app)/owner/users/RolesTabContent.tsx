"use client";

import { RolesTable } from "../roles/RolesTable";

interface RolesTabContentProps {
  roles: Array<{
    id: string;
    name: string;
    permissions: Record<string, unknown>;
  }>;
}

export function RolesTabContent({ roles }: RolesTabContentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Управление ролями</h2>
      <RolesTable roles={roles} />
    </div>
  );
}
