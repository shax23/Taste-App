'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, ListOrdered, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/explore', icon: Map, label: 'Map' },
  { href: '/onboarding', icon: ListOrdered, label: 'My List' },
  { href: '/profile/me', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/auth')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                active ? 'text-accent' : 'text-text-muted'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
