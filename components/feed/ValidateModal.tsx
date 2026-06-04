'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { FeedPost } from './FeedCard';

export function ValidateModal({
  post,
  onClose,
  onValidated,
}: {
  post: FeedPost | null;
  onClose: () => void;
  onValidated: (postId: string) => void;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!post) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch('/api/validations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id, note: note.trim() || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not submit validation.');
      return;
    }
    onValidated(post.id);
    setNote('');
    onClose();
  }

  return (
    <Modal open={!!post} onClose={onClose} title="I tried this">
      {post && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Confirm you went because of{' '}
            <span className="font-medium text-text-primary">
              {post.user.displayName}
            </span>
            &rsquo;s recommendation. This strengthens their credibility.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Optional note — "this was exactly right"'
            rows={3}
            maxLength={280}
            className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm placeholder:text-text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'It delivered'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
