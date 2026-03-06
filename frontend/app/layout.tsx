import type { Metadata } from 'next';
import './globals.css';
import SakuraPetals from '@/components/SakuraPetals';

export const metadata: Metadata = {
  title: 'KimetsuTask — Slay Your Tasks ✨',
  description: 'A cute gamified anime todo app. Complete missions, earn XP, level up and bloom!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-bg" />
        <SakuraPetals />
        {children}
      </body>
    </html>
  );
}
