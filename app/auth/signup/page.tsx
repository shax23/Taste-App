'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    neighbourhood: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? 'Sign up failed.');
      return;
    }

    // sign in, then onboard interests
    const signin = await signIn('credentials', {
      username: form.username,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signin?.error) {
      router.push('/auth/signin');
      return;
    }
    router.push('/interests');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-4xl italic">
            Taste<span className="not-italic text-accent">.</span>
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Find your people in Barcelona through what you love doing.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={update('username')}
            autoComplete="username"
            placeholder="lowercase, no spaces"
            autoFocus
            required
          />
          <Input
            label="Display name"
            name="displayName"
            value={form.displayName}
            onChange={update('displayName')}
            placeholder="How you appear to others"
            required
          />
          <Input
            label="Neighbourhood (optional)"
            name="neighbourhood"
            value={form.neighbourhood}
            onChange={update('neighbourhood')}
            placeholder="e.g. Gràcia, El Born, Eixample…"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            required
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
