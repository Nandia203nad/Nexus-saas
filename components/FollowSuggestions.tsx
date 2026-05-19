'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Suggestion {
  id: string; name: string; avatar?: string; bio?: string;
  plan: string; xp: number; level: number; streak: number;
  _count: { blogs: number; followers: number };
}

const PLAN_COLOR: Record<string,string> = { FREE: '#68d391', PREMIUM: '#0ba4a0', MAX: '#9f7aea' };

export default function FollowSuggestions({ compact = false }: { compact?: boolean }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) return;
    fetch(`/api/suggestions?limit=${compact ? 4 : 8}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setSuggestions(d.suggestions); })
      .finally(() => setLoading(false));
  }, [compact]);

  const handleFollow = async (userId: string) => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { window.location.href = '/auth/login'; return; }
    const res = await fetch('/api/follow', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ targetUserId: userId }) });
    const data = await res.json();
    if (res.ok) {
      setFollowing(prev => {
        const next = new Set(prev);
        if (data.following) next.add(userId); else next.delete(userId);
        return next;
      });
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 28, height: 28, border: '2px solid rgba(11,164,160,0.2)', borderTopColor: '#0ba4a0', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (suggestions.length === 0) return null;

  if (compact) return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#1a2e3b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#0ba4a0' }}>👥</span> Who to Follow
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {suggestions.slice(0, 4).map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${PLAN_COLOR[s.plan] || '#0ba4a0'}` }}>
              {s.avatar ? <img src={s.avatar} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=0ba4a0&color=fff&size=80`; }} />
                : <div style={{ width: '100%', height: '100%', background: '#0ba4a0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.72rem' }}>{s.name.slice(0,2).toUpperCase()}</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.82rem', color: '#1a2e3b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
              <div style={{ fontSize: '.68rem', color: '#6b7c8d' }}>Lv.{s.level} · {s._count.followers} followers</div>
            </div>
            <button onClick={() => handleFollow(s.id)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${following.has(s.id) ? '#6b7c8d' : '#0ba4a0'}`, background: following.has(s.id) ? 'transparent' : '#0ba4a0', color: following.has(s.id) ? '#6b7c8d' : '#fff', fontWeight: 700, fontSize: '.68rem', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
              {following.has(s.id) ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
      <Link href="/home" style={{ display: 'block', textAlign: 'center', marginTop: 14, color: '#0ba4a0', fontWeight: 600, fontSize: '.78rem', textDecoration: 'none' }}>See all suggestions →</Link>
    </div>
  );

  // Full card grid
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: '#0ba4a0', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Architects to Follow</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 800, color: '#1a2e3b' }}>Discover the Community</h3>
        </div>
        <Link href="/feed" style={{ color: '#0ba4a0', fontWeight: 600, fontSize: '.8rem', textDecoration: 'none' }}>View Feed →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
        {suggestions.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', transition: 'all .25s', border: '2px solid transparent', textAlign: 'center' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0ba4a0'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', border: `2.5px solid ${PLAN_COLOR[s.plan] || '#0ba4a0'}`, boxShadow: '0 3px 10px rgba(0,0,0,0.1)' }}>
              {s.avatar ? <img src={s.avatar} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=0ba4a0&color=fff&size=120`; }} />
                : <div style={{ width: '100%', height: '100%', background: '#0ba4a0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.85rem' }}>{s.name.slice(0,2).toUpperCase()}</div>}
            </div>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#1a2e3b', marginBottom: 4 }}>{s.name}</div>
            {s.bio && <div style={{ fontSize: '.72rem', color: '#6b7c8d', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.bio}</div>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ background: `${PLAN_COLOR[s.plan] || '#0ba4a0'}18`, color: PLAN_COLOR[s.plan] || '#0ba4a0', borderRadius: 10, padding: '2px 9px', fontSize: '.62rem', fontWeight: 700, border: `1px solid ${PLAN_COLOR[s.plan] || '#0ba4a0'}30` }}>{s.plan}</span>
              <span style={{ background: 'rgba(11,164,160,0.08)', color: '#0ba4a0', borderRadius: 10, padding: '2px 9px', fontSize: '.62rem', fontWeight: 700 }}>Lv.{s.level}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 14, fontSize: '.72rem', color: '#6b7c8d' }}>
              <span>📝 {s._count.blogs}</span><span>👥 {s._count.followers}</span><span>🔥 {s.streak}</span>
            </div>
            <button onClick={() => handleFollow(s.id)} style={{ width: '100%', padding: '9px', borderRadius: 22, border: `1.5px solid ${following.has(s.id) ? '#6b7c8d' : '#0ba4a0'}`, background: following.has(s.id) ? 'transparent' : '#0ba4a0', color: following.has(s.id) ? '#6b7c8d' : '#fff', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', transition: 'all .2s' }}>
              {following.has(s.id) ? '✓ Following' : '+ Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
