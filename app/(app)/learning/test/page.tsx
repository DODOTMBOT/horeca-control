'use client';

import { useSession } from 'next-auth/react';

export default function TestPage() {
  const { data: session, status } = useSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <div className="space-y-4">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Session:</strong> {JSON.stringify(session, null, 2)}</p>
      </div>
    </div>
  );
}
