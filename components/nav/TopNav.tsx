'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Discover' },
  { href: '/explore', label: 'Explore' },
  { href: '/onboarding', label: 'My List' },
  { href: '/profile/me', label: 'Profile' },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (pathname?.startsWith('/auth')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl italic">Taste</span>
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors',
                  active
                    ? 'text-accent'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text-primary'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {status === 'authenticated' && session?.user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center"
              aria-label="Account menu"
            >
              <Avatar
                src={session.user.avatarUrl}
                name={session.user.displayName ?? session.user.username ?? '?'}
                size="sm"
              />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-sm">
                <Link
                  href="/profile/me"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-text-primary hover:bg-surface-2"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="block w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface-2"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
