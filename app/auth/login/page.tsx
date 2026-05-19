'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('nexus_token')) {
      router.replace('/home');
    }
  }, [router]);

  useEffect(() => {
    const googleError = searchParams.get('error');
    if (googleError) setError(googleError);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Имэйл болон нууц үгээ оруулна уу.');
      return;
    }
    setLoading(true);
    const redirect = searchParams.get('redirect') || '/home';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        router.replace(redirect);
        return;
      }

      setError(data.message || 'Нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.');
    } catch {
      setError('Сүлжээний алдаа гарлаа. Интернет холболтоо шалгана уу.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 460px', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', zIndex: 1 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .login-visual { display: none !important; }
          .login-shell { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <section className="login-visual" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <Image src="/logins.jpg" alt="Nexus login" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,8,16,0.10), rgba(5,8,16,0.38))' }} />
        <div style={{ position: 'absolute', left: 52, right: 52, bottom: 52 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 'clamp(2.6rem, 5vw, 4.8rem)', lineHeight: 1.06, margin: 0, textShadow: '0 8px 34px rgba(0,0,0,.44)' }}>
            Make Blog<br />
            <span style={{ color: '#c8f7f5' }}>Creation Easy</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.76)', maxWidth: 460, lineHeight: 1.7, marginTop: 18 }}>
            Sign in to manage your blogs, AI analysis, portfolio files, XP, and skill tree progress.
          </p>
        </div>
      </section>

      <section style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 40px', background: 'linear-gradient(180deg, rgba(7,10,18,.82), rgba(5,8,16,.88))' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 28 }}>
            <span style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,.28)', display: 'inline-flex' }}>
              <Image src="/nexus-logo.jpg" alt="Nexus" width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} priority />
            </span>
            <span>
              <strong style={{ display: 'block', color: '#fff', fontSize: '1.1rem' }}>Welcome back</strong>
              <small style={{ display: 'block', color: 'rgba(255,255,255,.46)', marginTop: 3 }}>Nexus account login</small>
            </span>
          </Link>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 13, padding: 28, borderRadius: 24, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 0 40px rgba(11,164,160,0.22), 0 0 80px rgba(11,164,160,0.10), 0 24px 64px rgba(0,0,0,.38)', backdropFilter: 'blur(28px)' }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,.72)', fontSize: '.78rem', marginBottom: 7, fontWeight: 700 }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,.72)', fontSize: '.78rem', marginBottom: 7, fontWeight: 700 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  style={{ width: '100%', padding: '13px 80px 13px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', padding: '7px 9px', borderRadius: 9, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.72)', cursor: 'pointer', fontSize: '.75rem' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: '#ffb4b4', background: 'rgba(255,100,100,.12)', border: '1px solid rgba(255,100,100,.22)', borderRadius: 10, padding: '10px 12px', fontSize: '.82rem' }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', padding: 14, borderRadius: 12, border: '1px solid rgba(11,164,160,.42)', background: 'linear-gradient(135deg,#0ba4a0,#08c0c0)', color: '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .65 : 1 }}>
              {loading && <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.34)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />}
              Log In
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,.28)', fontSize: '.72rem' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
              <span>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
            </div>

            <a
              href={`/api/auth/google/start?redirect=${encodeURIComponent(searchParams.get('redirect') || '/home')}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.07)', color: '#fff', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none', transition: 'background .18s, border-color .18s', boxSizing: 'border-box' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.12)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,.32)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.07)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,.18)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign in with Google
            </a>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: '.78rem' }}>
              <Link href="/auth/forgot-password" style={{ color: 'rgba(255,255,255,.56)', textDecoration: 'none' }}>Forgot password?</Link>
              <Link href="/auth/register" style={{ color: '#c8f7f5', textDecoration: 'none', fontWeight: 700 }}>Create account</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#050810' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
