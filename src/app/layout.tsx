import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'tikbot — Research + TikTok Farm Dashboard',
  description: 'Single-operator dashboard for TikTok research, content archiving, and governed farm orchestration',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
