'use client';

import dynamic from 'next/dynamic';

const MiniMapInner = dynamic(() => import('./MiniMapInner'), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-2xl" />,
});

export function MiniMap(props: { lat: number; lng: number; category: string }) {
  return <MiniMapInner {...props} />;
}
