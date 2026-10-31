import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/security/auth';
import { getConfig } from '@/config';
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
  const sessionToken = cookieStore.get('tikbot_session')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  try {
    const config = getConfig();
    const verified = verifySessionToken(sessionToken, config.SESSION_SECRET);
    if (!verified) {
      redirect('/login');
    }
  } catch {
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
