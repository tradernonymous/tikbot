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
        {children}
      </body>
    </html>
  );
}
