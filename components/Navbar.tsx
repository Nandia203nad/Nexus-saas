'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  xp: number;
  level: number;
  avatar?: string;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: '#68d391',
  PREMIUM: '#0ba4a0',
  MAX: '#9f7aea',
};

const NAV = [
  { href: '/home', label: 'Home' },
  { href: '/blogs', label: 'Blogs' },
  { href: '/videos', label: 'Videos' },
  { href: '/skill-tree', label: 'Skills' },
  { href: '/feed', label: 'Feed' },
  { href: '/ai', label: 'AI' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}

    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_token');
    setUser(null);
    router.push('/');
  };

  const initials = user?.name?.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2) || 'NX';
  const planColor = PLAN_COLORS[user?.plan || 'FREE'] || '#0ba4a0';

  return (
    <nav
      className="site-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        minHeight: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 24px',
        background: scrolled ? 'rgba(5,8,16,0.94)' : 'rgba(5,8,16,0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(99,179,237,0.12)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}
    >
      <style jsx global>{`
        .site-nav-links { display: flex; align-items: center; gap: 2px; min-width: 0; }
        .site-nav-user { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        @media (max-width: 900px) {
          .site-nav { padding: 8px 12px !important; align-items: flex-start !important; flex-wrap: wrap; }
          .site-nav-links { order: 3; width: 100%; overflow-x: auto; padding-bottom: 3px; scrollbar-width: thin; }
          .site-nav-links .nav-link { white-space: nowrap; }
          .site-nav-user { margin-left: auto; }
        }
        @media (max-width: 560px) {
          .site-nav-brand-copy { display: none; }
          .site-nav-user .user-copy { display: none; }
          .site-nav-user .btn { padding: 7px 10px; font-size: .68rem !important; }
        }
      `}</style>

      <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(11,164,160,0.6)', boxShadow: '0 0 10px rgba(11,164,160,0.3)', flexShrink: 0 }}>
          <Image src="/nexus-logo.jpg" alt="Nexus" width={34} height={34} style={{ objectFit: 'cover', width: '100%', height: '100%' }} priority />
        </div>
        <div className="site-nav-brand-copy">
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: '.88rem', color: '#0ba4a0', letterSpacing: '.12em', lineHeight: 1 }}>NEXUS</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.44rem', color: 'var(--text3)', letterSpacing: '.15em', lineHeight: 1, marginTop: 2 }}>EVERYTHING CONNECTS</div>
        </div>
      </Link>

      <div className="site-nav-links">
        {NAV.map(item => (
          <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`} style={{ fontSize: '.78rem' }}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="site-nav-user">
        {user ? (
          <>
            <Link
              href="/profile"
              style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '5px 12px', background: 'rgba(11,164,160,0.08)', border: '1px solid rgba(11,164,160,0.2)', borderRadius: 8, transition: 'all 0.2s' }}
              onMouseOver={event => { event.currentTarget.style.borderColor = 'rgba(11,164,160,0.4)'; }}
              onMouseOut={event => { event.currentTarget.style.borderColor = 'rgba(11,164,160,0.2)'; }}
            >
              <div style={{ width: 27, height: 27, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${planColor}` }}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={event => { (event.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ba4a0&color=fff&size=54`; }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#0ba4a0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.6rem' }}>{initials}</div>
                )}
              </div>
              <div className="user-copy" style={{ lineHeight: 1 }}>
                <div style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.57rem', color: planColor }}>Lv.{user.level} - {user.xp}XP - {user.plan}</div>
              </div>
            </Link>
            <button onClick={logout} className="btn btn-ghost btn-sm" style={{ fontSize: '.75rem' }}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link
              href="/auth/register"
              style={{ background: '#0ba4a0', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', textDecoration: 'none', transition: 'all .2s' }}
              onMouseOver={event => { event.currentTarget.style.background = '#099895'; }}
              onMouseOut={event => { event.currentTarget.style.background = '#0ba4a0'; }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
