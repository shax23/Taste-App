import type { Metadata } from 'next';
import { Instrument_Serif, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { TopNav } from '@/components/nav/TopNav';
import { BottomNav } from '@/components/nav/BottomNav';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Taste — discover through shared taste',
  description:
    'Explore what people with similar interests are doing in real life: the cafes they visit, the neighborhoods they roam, the activities they join.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="min-h-screen pb-20 md:pb-0">
        <Providers>
          <TopNav />
          <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
