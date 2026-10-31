import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, readSessionTokenFromCookies } from '@/security/auth';
import { Sidebar } from '@/components/Sidebar';
import { TopNavbar } from '@/components/TopNavbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OperationsProvider } from '@/context/OperationsContext';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = readSessionTokenFromCookies((name) => cookieStore.get(name));

  if (!sessionToken) {
    redirect('/login');
  }

  // Verify with SESSION_SECRET directly (same source as src/proxy.ts) so an unrelated
  // config validation failure can never bounce a valid session between /login and /dashboard.
  const secret = process.env.SESSION_SECRET;
  const verified = secret ? verifySessionToken(sessionToken, secret) : null;
  if (!verified) {
    redirect('/login');
  }

  return (
    <OperationsProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </OperationsProvider>
  );
}
