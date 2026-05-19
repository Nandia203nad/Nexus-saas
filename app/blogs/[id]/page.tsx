'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const REACTIONS = [{ emoji: '🔥', key: 'fire', label: 'Fire' }, { emoji: '💡', key: 'insight', label: 'Insightful' }, { emoji: '❤️', key: 'love', label: 'Love' }, { emoji: '🚀', key: 'epic', label: 'Epic' }, { emoji: '🤔', key: 'think', label: 'Thinking' }];
const TAG_IMG: Record<string,string> = { tiktok:'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=900&h=400&fit=crop&auto=format&q=75', ai:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&h=400&fit=crop&auto=format&q=75', seo:'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=900&h=400&fit=crop&auto=format&q=75', marketing:'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=900&h=400&fit=crop&auto=format&q=75', freelance:'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&h=400&fit=crop&auto=format&q=75', web3:'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=900&h=400&fit=crop&auto=format&q=75', book:'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&h=400&fit=crop&auto=format&q=75', default:'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=900&h=400&fit=crop&auto=format&q=75' };
const TAG_CLASSES: Record<string,string> = { tiktok:'t-cyan', ai:'t-purple', seo:'t-green', marketing:'t-magenta', freelance:'t-orange', web3:'t-cyan', book:'t-yellow', default:'t-cyan' };

interface Blog { id:string;title:string;content:string;excerpt?:string;coverImage?:string;isPremium:boolean;minPlan?:string;readTime:number;views:number;createdAt:string;author:{id:string;name:string;avatar?:string;level:number;xp:number};tags:Array<{tag:{name:string;slug:string}}>;comments:Array<{id:string;content:string;createdAt:string;author:{id:string;name:string;avatar?:string;level:number}}>;_count:{likes:number;bookmarks:number} }

export default function BlogDetailPage() {
  const { id } = useParams(); const router = useRouter();
  const [blog, setBlog] = useState<Blog|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [reactions, setReactions] = useState<Record<string,number>>({ fire: 12, insight: 8, love: 15, epic: 5, think: 3 });
  const [myReaction, setMyReaction] = useState<string|null>(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [xpEarned, setXpEarned] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const token = localStorage.getItem('nexus_token');
        const res = await fetch(`/api/blogs/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = await res.json();
        if (!res.ok) { setError(data.message); return; }
        setBlog(data.blog); setLikeCount(data.blog._count.likes);
      } catch { setError('Network error'); }
      finally { setLoading(false); }
    };
    fetchBlog();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const dH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = Math.min(100, Math.round(dH > 0 ? (window.scrollY / dH) * 100 : 0));
      setScrollPct(pct);
      if (pct >= 80 && !xpEarned) setXpEarned(true);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [xpEarned]);

  const handleLike = async () => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.push('/auth/login'); return; }
    const prev = liked; setLiked(!prev); setLikeCount(c => prev ? c - 1 : c + 1);
    const res = await fetch(`/api/blogs/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { setLiked(prev); setLikeCount(c => prev ? c + 1 : c - 1); }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.push('/auth/login'); return; }
    setBookmarked(b => !b);
    await fetch(`/api/blogs/${id}/bookmark`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  };

  const handleReaction = (key: string) => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.push('/auth/login'); return; }
    setReactions(prev => {
      const next = { ...prev };
      if (myReaction === key) { next[key] = Math.max(0, next[key] - 1); setMyReaction(null); }
      else { if (myReaction) next[myReaction] = Math.max(0, next[myReaction] - 1); next[key] = (next[key] || 0) + 1; setMyReaction(key); }
      return next;
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.push('/auth/login'); return; }
    setCommenting(true);
    try {
      const res = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ content: comment, blogId: id }) });
      const data = await res.json();
      if (res.ok) { setBlog(prev => prev ? { ...prev, comments: [data.comment, ...prev.comments] } : prev); setComment(''); }
      else alert(data.message);
    } catch { alert('Error posting comment'); }
    finally { setCommenting(false); }
  };

  const handleDeleteComment = async (cid: string) => {
    if (!confirm('Delete this comment?')) return;
    const token = localStorage.getItem('nexus_token');
    if (!token) return;
    const res = await fetch(`/api/comments/${cid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setBlog(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== cid) } : prev);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      <Navbar />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(99,179,237,0.15)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.68rem', color: 'var(--cyan)' }}>Loading article...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', gap: 16 }}>
        <div style={{ fontSize: '3.5rem' }}>{error.includes('Premium') || error.includes('Plan') ? '🔒' : '😕'}</div>
        <h2 className="editorial-title" style={{ fontSize: '1rem', color: 'var(--magenta)' }}>{error.includes('Premium') || error.includes('Plan') ? 'Subscription Required' : 'Article Not Found'}</h2>
        <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.75rem', color: 'var(--text3)', maxWidth: 400, textAlign: 'center' }}>{error}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/blogs" className="btn btn-secondary btn-sm">← Back</Link>
          {(error.includes('Premium') || error.includes('Plan')) && <Link href="/profile" className="btn btn-primary btn-sm">Upgrade Plan</Link>}
        </div>
      </div>
    </div>
  );

  if (!blog) return null;

  const authorInitials = blog.author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const imgSrc = blog.coverImage || TAG_IMG[blog.tags[0]?.tag?.slug || 'default'] || TAG_IMG.default;
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('nexus_user') || '{}'); } catch { return {}; } })();
  const xpReward = blog.readTime * 4;

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }} ref={contentRef}>
      {/* Reading progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001, height: 3, background: 'rgba(99,179,237,0.08)' }}>
        <div style={{ height: '100%', width: `${scrollPct}%`, background: 'linear-gradient(90deg,var(--cyan),var(--purple),var(--magenta))', transition: 'width 0.1s linear', boxShadow: '0 0 6px rgba(99,179,237,0.5)' }} />
      </div>

      {/* XP toast */}
      {xpEarned && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, background: 'rgba(104,211,145,0.12)', border: '1px solid rgba(104,211,145,0.4)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp 0.4s ease', boxShadow: '0 0 18px rgba(104,211,145,0.2)' }}>
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', color: 'var(--green)', fontWeight: 700 }}>+{xpReward} XP EARNED!</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>Article read complete</div>
          </div>
        </div>
      )}

      <Navbar />
      <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <Link href="/blogs" className="btn btn-ghost btn-sm" style={{ marginBottom: 22, display: 'inline-flex', fontFamily: 'JetBrains Mono,monospace', fontSize: '.68rem' }}>← All Articles</Link>

          {/* Cover image */}
          <div style={{ height: 340, borderRadius: 'var(--card-radius)', overflow: 'hidden', marginBottom: 28, position: 'relative' }}>
            <img src={imgSrc} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).src = TAG_IMG.default; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(5,8,16,0.75) 0%,transparent 55%)' }} />
            {/* Tags on image */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 7 }}>
              {blog.tags.slice(0, 3).map((pt, i) => (
                <Link key={i} href={`/blogs?tag=${pt.tag.slug}`} className={`tag-pill ${TAG_CLASSES[pt.tag.slug] || 't-cyan'}`} style={{ fontSize: '.6rem', backdropFilter: 'blur(8px)', background: 'rgba(9,14,26,0.75)' }}>#{pt.tag.name}</Link>
              ))}
            </div>
            {/* XP badge */}
            <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(104,211,145,0.14)', border: '1px solid rgba(104,211,145,0.38)', borderRadius: 6, padding: '4px 10px', fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: 'var(--green)' }}>+{xpReward} XP</div>
          </div>

          {/* Header card */}
          <div className="glass-card" style={{ padding: '26px 30px', marginBottom: 20 }}>
            <div className="corner c-tl" /><div className="corner c-tr" />
            <h1 className="editorial-title" style={{ fontSize: 'clamp(1.4rem,4vw,2.2rem)', lineHeight: 1.2, marginBottom: 20 }}>{blog.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,var(--cyan),var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.88rem', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: '#050810', flexShrink: 0 }}>
                  {blog.author.avatar ? <img src={blog.author.avatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} /> : authorInitials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{blog.author.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>Lv.{blog.author.level} · {blog.author.xp.toLocaleString()}XP · {new Date(blog.createdAt).toLocaleDateString('mn-MN')} · {blog.readTime} min</div>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: liked ? 'rgba(237,100,166,0.1)' : 'rgba(99,179,237,0.04)', border: `1px solid ${liked ? 'rgba(237,100,166,0.4)' : 'rgba(99,179,237,0.15)'}`, borderRadius: 7, cursor: 'pointer', color: liked ? 'var(--magenta)' : 'var(--text2)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.68rem', transition: 'all 0.2s' }}>
                  {liked ? '♥' : '♡'} {likeCount}
                </button>
                <button onClick={handleBookmark} style={{ padding: '8px 10px', background: bookmarked ? 'rgba(99,179,237,0.1)' : 'rgba(99,179,237,0.03)', border: `1px solid ${bookmarked ? 'rgba(99,179,237,0.4)' : 'rgba(99,179,237,0.12)'}`, borderRadius: 7, cursor: 'pointer', color: bookmarked ? 'var(--cyan)' : 'var(--text3)', fontSize: '1rem', transition: 'all 0.2s' }}>
                  {bookmarked ? '◈' : '◇'}
                </button>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono,monospace', fontSize: '.65rem', color: 'var(--text3)', padding: '8px 10px', background: 'rgba(99,179,237,0.03)', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 7 }}>👁 {blog.views}</span>
              </div>
            </div>
          </div>

          {/* Reactions bar */}
          <div className="glass-card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'var(--text3)' }}>React:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {REACTIONS.map(r => (
                <button key={r.key} onClick={() => handleReaction(r.key)} title={r.label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: myReaction === r.key ? 'rgba(99,179,237,0.12)' : 'rgba(99,179,237,0.03)', border: `1px solid ${myReaction === r.key ? 'rgba(99,179,237,0.4)' : 'rgba(99,179,237,0.1)'}`, borderRadius: 20, cursor: 'pointer', fontSize: '.88rem', fontFamily: 'JetBrains Mono,monospace', color: myReaction === r.key ? 'var(--cyan)' : 'var(--text2)', transition: 'all 0.2s', transform: myReaction === r.key ? 'scale(1.05)' : 'scale(1)' }}>
                  <span>{r.emoji}</span>
                  {reactions[r.key] > 0 && <span style={{ fontSize: '.62rem', color: myReaction === r.key ? 'var(--cyan)' : 'var(--text3)' }}>{reactions[r.key]}</span>}
                </button>
              ))}
            </div>
            {/* Read progress */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>Read: {scrollPct}%</span>
              <div style={{ width: 60, height: 4, background: 'rgba(99,179,237,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${scrollPct}%`, background: 'linear-gradient(90deg,var(--cyan),var(--purple))', borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
            </div>
          </div>

          {/* XP Banner */}
          <div style={{ background: 'rgba(104,211,145,0.05)', border: '1px solid rgba(104,211,145,0.18)', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.3rem' }}>⚡</span>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.68rem', color: 'var(--green)', fontWeight: 700 }}>+{xpReward} XP Reward</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>Read 80%+ to earn · Content Creation skill</div>
            </div>
            {xpEarned && <span className="badge b-green" style={{ marginLeft: 'auto', fontSize: '.58rem' }}>✓ Earned</span>}
          </div>

          {/* Content */}
          <div className="glass-card" style={{ padding: '28px 32px', marginBottom: 24 }}>
            <div className="corner c-tl" style={{ opacity: 0.3 }} />
            <div className="prose" style={{ maxWidth: '100%' }}>
              {blog.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="editorial-title" style={{ fontSize: '1.6rem', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(99,179,237,0.12)' }}>{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="editorial-title" style={{ fontSize: '1.15rem', color: 'var(--cyan)', marginTop: 24, marginBottom: 10 }}>{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginTop: 18, marginBottom: 8 }}>{line.slice(4)}</h3>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{line.slice(2, -2)}</p>;
                if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ color: 'var(--text2)', marginBottom: 5, marginLeft: 20, lineHeight: 1.75 }}>{line.slice(2)}</li>;
                if (line.match(/^\d+\. /)) return <li key={i} style={{ color: 'var(--text2)', marginBottom: 5, marginLeft: 20, lineHeight: 1.75 }}>{line.replace(/^\d+\. /, '')}</li>;
                if (line.trim() === '') return <div key={i} style={{ height: 12 }} />;
                return <p key={i} style={{ color: 'var(--text2)', lineHeight: 1.85, marginBottom: 10, fontSize: '1.02rem' }}>{line}</p>;
              })}
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 32, padding: '14px 18px', background: 'rgba(99,179,237,0.03)', border: '1px solid rgba(99,179,237,0.08)', borderRadius: 10 }}>
            <div className="editorial-label" style={{ marginBottom: 10 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {blog.tags.map((pt, i) => (
                <Link key={i} href={`/blogs?tag=${pt.tag.slug}`} className={`tag-pill ${TAG_CLASSES[pt.tag.slug] || 't-cyan'}`} style={{ fontSize: '.62rem', padding: '4px 12px' }}>#{pt.tag.name}</Link>
              ))}
              {blog.tags.length === 0 && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.65rem', color: 'var(--text3)' }}>// No tags</span>}
            </div>
          </div>

          {/* Comments */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div className="editorial-label">Comments ({blog.comments.length})</div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(99,179,237,0.2),transparent)' }} />
            </div>

            {/* Comment form */}
            <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
              <div className="corner c-tl" style={{ borderColor: 'var(--purple)', opacity: 0.4 }} />
              <form onSubmit={handleComment} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>// Add comment (+10 XP)</div>
                <textarea className="input" placeholder="Share your thoughts..." value={comment} onChange={e => setComment(e.target.value)} required minLength={1} style={{ minHeight: 88, fontSize: '.95rem' }} />
                <button type="submit" disabled={commenting} className="btn btn-purple btn-sm" style={{ alignSelf: 'flex-start' }}>
                  {commenting ? 'Posting...' : '💬 Post Comment'}
                </button>
              </form>
            </div>

            {/* Comments list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {blog.comments.map(c => {
                const ci = c.author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const isOwn = currentUser?.id === c.author.id;
                return (
                  <div key={c.id} className="glass-card" style={{ padding: '16px 20px', border: '1px solid rgba(159,122,234,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--purple),var(--magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {c.author.avatar ? <img src={c.author.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : ci}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{c.author.name}</div>
                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>Lv.{c.author.level} · {new Date(c.createdAt).toLocaleDateString('mn-MN')}</div>
                      </div>
                      {isOwn && (
                        <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,129,129,0.45)', fontSize: '.75rem', fontFamily: 'JetBrains Mono,monospace', transition: 'color 0.2s' }} onMouseOver={e => (e.currentTarget.style.color = '#fc8181')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(252,129,129,0.45)')}>Delete</button>
                      )}
                    </div>
                    <p style={{ color: 'var(--text2)', fontSize: '.92rem', lineHeight: 1.7 }}>{c.content}</p>
                  </div>
                );
              })}
              {blog.comments.length === 0 && (
                <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>💬</div>
                  <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', color: 'var(--text3)' }}>// First commenter earns +10 XP bonus</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
