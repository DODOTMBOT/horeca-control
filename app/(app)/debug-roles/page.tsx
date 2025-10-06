'use client';

import { useSession } from 'next-auth/react';

export default function DebugRolesPage() {
  const { data: session, status } = useSession();

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug Roles</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="font-semibold mb-2">Session Status</h2>
            <p><strong>Status:</strong> {status}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="font-semibold mb-2">Session Data</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="font-semibold mb-2">User Role</h2>
            <p><strong>Role:</strong> {(session?.user as any)?.role || 'null'}</p>
            <p><strong>Roles:</strong> {JSON.stringify((session?.user as any)?.roles || [])}</p>
            <p><strong>Tenant ID:</strong> {(session?.user as any)?.tenantId || 'null'}</p>
            <p><strong>Point ID:</strong> {(session?.user as any)?.pointId || 'null'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
