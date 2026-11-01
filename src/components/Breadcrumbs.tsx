import React from 'react';
import Link from 'next/link';

export interface BreadcrumbsContextData {
  campaigns?: Array<{ id: string; title: string }>;
  accounts?: Array<{ id: string; username: string }>;
  publishJobs?: Array<{ id: string; title: string }>;
}

export interface BreadcrumbsProps {
  pathname: string;
  searchParams?: URLSearchParams | { get: (key: string) => string | null };
  contextData?: BreadcrumbsContextData;
}

export function Breadcrumbs({ pathname, searchParams, contextData }: BreadcrumbsProps) {
  const getSection = () => {
    if (pathname.includes('/research')) return { name: 'Research Intelligence', href: '/dashboard/research' };
    if (pathname.includes('/trends')) return { name: 'Trends', href: '/dashboard/trends' };
    if (pathname.includes('/hooks')) return { name: 'Hook Lab', href: '/dashboard/hooks' };
    if (pathname.includes('/competitors')) return { name: 'Competitors', href: '/dashboard/competitors' };
    if (pathname.includes('/creators')) return { name: 'Creators CRM', href: '/dashboard/creators' };
    if (pathname.includes('/live')) return { name: 'Live Intel', href: '/dashboard/live' };
    if (pathname.includes('/calendar')) return { name: 'Calendar', href: '/dashboard/calendar' };
    if (pathname.includes('/composer')) return { name: 'Composer', href: '/dashboard/composer' };
    if (pathname.includes('/media')) return { name: 'Media Library', href: '/dashboard/media' };
    if (pathname.includes('/inbox')) return { name: 'Comment Inbox', href: '/dashboard/inbox' };
    if (pathname.includes('/reports')) return { name: 'Reports', href: '/dashboard/reports' };
    if (pathname.includes('/accounts')) return { name: 'Farm Accounts', href: '/dashboard/accounts' };
    if (pathname.includes('/campaigns')) return { name: 'Engagement Campaigns', href: '/dashboard/campaigns' };
    if (pathname.includes('/publishing')) return { name: 'Content & Publishing', href: '/dashboard/publishing' };
    if (pathname.includes('/panel')) return { name: 'Farm Services & Launch', href: '/dashboard/panel' };
    if (pathname.includes('/compliance')) return { name: 'Compliance & Audit', href: '/dashboard/compliance' };
    if (pathname.includes('/settings')) return { name: 'System Settings', href: '/dashboard/settings' };
    return { name: 'Overview', href: '/dashboard' };
  };

  const section = getSection();
  const focusId = searchParams?.get('focus');
  const accountId = searchParams?.get('account');
  const tab = searchParams?.get('tab');

  let entityLabel: string | null = null;

  if (focusId) {
    const matchedCamp = contextData?.campaigns?.find((c) => c.id === focusId);
    if (matchedCamp) {
      entityLabel = matchedCamp.title;
    }

    const matchedAcc = contextData?.accounts?.find((a) => a.id === focusId);
    if (matchedAcc) {
      entityLabel = `@${matchedAcc.username}`;
    }

    const matchedJob = contextData?.publishJobs?.find((j) => j.id === focusId);
    if (matchedJob) {
      entityLabel = matchedJob.title;
    }
  } else if (accountId) {
    const matchedAcc = contextData?.accounts?.find((a) => a.id === accountId);
    if (matchedAcc) {
      entityLabel = `@${matchedAcc.username}`;
    }
  }

  let tabLabel: string | null = null;
  if (tab) {
    if (tab === 'COMMENT_BANK') tabLabel = 'Comment Bank';
    else if (tab === 'PROXIES') tabLabel = 'Proxy Pool';
    else if (tab === 'ACCOUNTS') tabLabel = 'Identities';
    else if (tab === 'CAMPAIGNS') tabLabel = 'Campaigns';
    else tabLabel = tab;
  }

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs">
      <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
        Dashboard
      </Link>
      <span className="text-slate-500">/</span>
      {entityLabel || tabLabel ? (
        <Link href={section.href} className="text-slate-400 hover:text-white transition-colors">
          {section.name}
        </Link>
      ) : (
        <span className="text-white font-semibold">{section.name}</span>
      )}
      {tabLabel && (
        <>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300 font-medium">{tabLabel}</span>
        </>
      )}
      {entityLabel && (
        <>
          <span className="text-slate-500">/</span>
          <span className="text-cyan-400 font-semibold truncate max-w-[180px]">{entityLabel}</span>
        </>
      )}
    </nav>
  );
}
