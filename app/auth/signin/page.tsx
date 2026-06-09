'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // email + no password → passwordless email sign-in
    const res =
      identifier.includes('@') && !password
        ? await signIn('email', { email: identifier, redirect: false })
        : await signIn('credentials', {
            username: identifier,
            password,
            redirect: false,
          });
    setLoading(false);
    if (res?.error) {
      setError(
        identifier.includes('@') && !password
          ? 'No account found for that email.'
          : 'Invalid username or password.'
      );
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email or username"
        name="identifier"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoComplete="username"
        autoFocus
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder="Not needed if you signed up with email"
      />
      {error && <p className="text-sm text-accent">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-4xl italic">
            Taste<span className="not-italic text-accent">.</span>
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Discover through shared taste, not followers.
          </p>
        </div>
        <Suspense>
          <SignInForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-text-muted">
          New here?{' '}
          <Link href="/auth/signup" className="font-medium text-accent underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-8 rounded-xl bg-surface-2 p-3 text-center text-xs text-text-muted">
          Demo: sign in as <span className="font-medium text-text-primary">mira</span> /{' '}
          <span className="font-medium text-text-primary">taste123</span>
        </p>
      </div>
    </div>
  );
}
