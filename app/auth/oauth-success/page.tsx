'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect') || '/home';

    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.token && data?.user) {
          localStorage.setItem('nexus_token', data.token);
          localStorage.setItem('nexus_user', JSON.stringify(data.user));
        }
      })
      .finally(() => router.replace(redirect));
  }, [router, searchParams]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050810', color: '#f0f4f8', position: 'relative', zIndex: 1 }}>
      Signing you in...
    </main>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050810', color: '#f0f4f8' }}>Signing you in...</main>}>
      <OAuthSuccessContent />
    </Suspense>
  );
}
