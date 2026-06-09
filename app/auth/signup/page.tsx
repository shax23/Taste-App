'use client';

import { useEffect, useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.13 7.13 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#ig)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="url(#ig)" strokeWidth="2" />
      <circle cx="17.6" cy="6.4" r="1.3" fill="url(#ig)" />
      <defs>
        <linearGradient id="ig" x1="2" y1="22" x2="22" y2="2">
          <stop stopColor="#FD5949" />
          <stop offset="0.5" stopColor="#D6249F" />
          <stop offset="1" stopColor="#285AEB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}

const SOCIALS = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
] as const;

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getProviders().then((p) => {
      if (!p) return;
      setAvailable(
        Object.fromEntries(SOCIALS.map((s) => [s.id, s.id in p]))
      );
    });
  }, []);

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

    // sign in by email, then build your list (reciprocity gate)
    const signin = await signIn('email', { email: form.email, redirect: false });
    setLoading(false);
    if (signin?.error) {
      router.push('/auth/signin');
      return;
    }
    router.push('/onboarding');
    router.refresh();
  }

  function connect(id: string, label: string) {
    if (available[id]) {
      signIn(id, { callbackUrl: '/onboarding' });
    } else {
      setError(
        `${label} sign-in isn't connected yet — it needs ${label} API keys (coming soon).`
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-4xl italic">
            Taste<span className="not-italic text-accent">.</span>
          </p>
          <p className="mt-3 text-sm text-text-muted">
            Find your people through what you love doing.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Display name"
            name="displayName"
            value={form.displayName}
            onChange={update('displayName')}
            placeholder="How you appear to others"
            autoFocus
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs uppercase tracking-wide text-text-muted">
            or connect with
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="space-y-2.5">
          {SOCIALS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => connect(id, label)}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
            >
              <Icon />
              Connect {label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
