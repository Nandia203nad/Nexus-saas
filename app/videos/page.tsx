'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { VideoItem } from '@/lib/video-data';

type VideoForm = {
  id?: string;
  title: string;
  author: string;
  youtube: string;
  duration: string;
  views: string;
  cat: string;
  level: string;
  xp: number;
  desc: string;
  tags: string;
};

const LEVEL_COLOR: Record<string, string> = {
  Beginner: 'var(--green)',
  Intermediate: 'var(--cyan)',
  Advanced: 'var(--magenta)',
};

const CATS = [
  { k: 'all', l: 'All' },
  { k: 'marketing', l: 'Marketing' },
  { k: 'ai', l: 'AI & Tech' },
  { k: 'seo', l: 'SEO' },
  { k: 'freelance', l: 'Freelance' },
  { k: 'brand', l: 'Brand' },
];

const EMPTY_FORM: VideoForm = {
  title: '',
  author: '',
  youtube: '',
  duration: '00:00',
  views: '0',
  cat: 'marketing',
  level: 'Beginner',
  xp: 50,
  desc: '',
  tags: '',
};

function thumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<VideoItem | null>(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [canManageVideos, setCanManageVideos] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<VideoForm>(EMPTY_FORM);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchRaw), 220);
    return () => clearTimeout(timer);
  }, [searchRaw]);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) {
      router.replace('/');
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
      setCanManageVideos(Boolean(user?.id || user?.email));
    } catch {
      setCanManageVideos(false);
    }

    fetch('/api/videos', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Video list failed to load');
        setVideos(data.videos || []);
      })
      .catch(err => setError(err.message || 'Video list failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return videos.filter(video => {
      const matchesFilter = filter === 'all' || video.cat === filter;
      const matchesSearch = !query ||
        video.title.toLowerCase().includes(query) ||
        video.author.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, videos]);

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEditForm(video: VideoItem) {
    setForm({
      id: video.id,
      title: video.title,
      author: video.author,
      youtube: video.yt,
      duration: video.duration,
      views: video.views,
      cat: video.cat,
      level: video.level,
      xp: video.xp,
      desc: video.desc,
      tags: video.tags.join(', '),
    });
    setFormOpen(true);
  }

  async function saveVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem('nexus_token');
    if (!token) return router.replace('/');

    setSaving(true);
    setError('');

    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/videos', {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Video save failed');

      setVideos(current => {
        if (form.id) return current.map(video => video.id === data.video.id ? data.video : video);
        return [data.video, ...current];
      });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />

      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}
          onClick={event => { if (event.target === event.currentTarget) setSelected(null); }}
        >
          <div style={{ width: '100%', maxWidth: 920, background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border2)', borderRadius: 'var(--card-radius)', overflow: 'hidden', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selected.yt}?autoplay=1&rel=0&modestbranding=1`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                title={selected.title}
              />
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <h2 className="editorial-title" style={{ fontSize: '.95rem', flex: 1, lineHeight: 1.35 }}>{selected.title}</h2>
                <button onClick={() => setSelected(null)} aria-label="Close video" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '1.2rem', flexShrink: 0 }}>x</button>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10, fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>
                <span>{selected.author}</span>
                <span>{selected.views} views</span>
                <span>{selected.duration}</span>
              </div>
              <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.65, marginBottom: 12 }}>{selected.desc}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge b-cyan" style={{ fontSize: '.52rem' }}>{selected.cat.toUpperCase()}</span>
                <span className="badge" style={{ background: `${LEVEL_COLOR[selected.level] || 'var(--cyan)'}15`, color: LEVEL_COLOR[selected.level] || 'var(--cyan)', border: `1px solid ${LEVEL_COLOR[selected.level] || 'var(--cyan)'}33`, fontSize: '.52rem' }}>{selected.level}</span>
                <span className="badge b-green" style={{ fontSize: '.52rem' }}>+{selected.xp} XP</span>
                {selected.tags.map(tag => <span key={tag} className="tag-pill t-cyan" style={{ fontSize: '.5rem', padding: '2px 7px' }}>#{tag}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={event => { if (event.target === event.currentTarget) setFormOpen(false); }}>
          <form onSubmit={saveVideo} className="glass-card" style={{ width: '100%', maxWidth: 720, padding: 22, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h2 className="editorial-title" style={{ fontSize: '1rem' }}>{form.id ? 'Replace video URL' : 'Add video URL'}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="btn btn-sm">Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
              <input className="input" required placeholder="Title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
              <input className="input" required placeholder="Author" value={form.author} onChange={event => setForm({ ...form, author: event.target.value })} />
              <input className="input" required placeholder="YouTube URL or video ID" value={form.youtube} onChange={event => setForm({ ...form, youtube: event.target.value })} />
              <input className="input" placeholder="Duration e.g. 12:30" value={form.duration} onChange={event => setForm({ ...form, duration: event.target.value })} />
              <input className="input" placeholder="Views e.g. 2.1K" value={form.views} onChange={event => setForm({ ...form, views: event.target.value })} />
              <input className="input" type="number" min={0} placeholder="XP" value={form.xp} onChange={event => setForm({ ...form, xp: Number(event.target.value) })} />
              <select className="input" value={form.cat} onChange={event => setForm({ ...form, cat: event.target.value })}>
                {CATS.filter(cat => cat.k !== 'all').map(cat => <option key={cat.k} value={cat.k}>{cat.l}</option>)}
              </select>
              <select className="input" value={form.level} onChange={event => setForm({ ...form, level: event.target.value })}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <textarea className="input" required rows={4} placeholder="Description" value={form.desc} onChange={event => setForm({ ...form, desc: event.target.value })} />
            <input className="input" placeholder="Tags, comma separated" value={form.tags} onChange={event => setForm({ ...form, tags: event.target.value })} />
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving...' : form.id ? 'Replace video' : 'Add video'}</button>
          </form>
        </div>
      )}

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <div className="editorial-label" style={{ marginBottom: 10 }}>Video Academy</div>
            <h1 className="editorial-title" style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', marginBottom: 6 }}>Professional <span className="grad-text">Video Lessons</span></h1>
            <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>Салбар бүрийн видео хичээлийг үзэж, мэдлэгээ бататган XP цуглуулаарай.</p>
          </div>
          {canManageVideos && <button onClick={openCreateForm} className="btn">+ Add URL</button>}
        </div>

        {error && (
          <div className="glass-card" style={{ padding: 14, marginBottom: 18, borderColor: 'rgba(252,129,129,0.35)', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          <input className="input" placeholder="Search videos..." value={searchRaw} onChange={event => setSearchRaw(event.target.value)} style={{ width: 230, padding: '9px 14px', fontSize: '.82rem' }} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CATS.map(cat => (
              <button key={cat.k} onClick={() => setFilter(cat.k)} className="btn btn-sm" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', background: filter === cat.k ? 'rgba(99,179,237,0.14)' : 'rgba(99,179,237,0.04)', color: filter === cat.k ? 'var(--cyan)' : 'var(--text3)', border: `1px solid ${filter === cat.k ? 'rgba(99,179,237,0.35)' : 'rgba(99,179,237,0.1)'}` }}>{cat.l}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="glass-card" style={{ padding: 42, textAlign: 'center', color: 'var(--text3)' }}>Loading videos...</div>
        ) : (
          <div className="grid-3">
            {filtered.map((video, index) => (
              <div key={video.id} onClick={() => setSelected(video)} className="vid-card" style={{ animationDelay: `${index * 0.06}s`, cursor: 'pointer' }}>
                <div className="corner c-tl" />
                <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', overflow: 'hidden', borderRadius: 'var(--card-radius) var(--card-radius) 0 0' }}>
                  <img src={thumbnailUrl(video.yt)} alt={video.title} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }} onError={event => { (event.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.yt}/mqdefault.jpg`; }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.22)', transition: 'background 0.2s' }} className="vid-overlay">
                    <div className="play-btn">Play</div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.78)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 4, padding: '2px 7px', fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text)' }}>{video.duration}</div>
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(104,211,145,0.12)', border: '1px solid rgba(104,211,145,0.3)', borderRadius: 4, padding: '2px 7px', fontFamily: 'JetBrains Mono,monospace', fontSize: '.57rem', color: 'var(--green)' }}>+{video.xp}XP</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <h3 className="editorial-title" style={{ fontSize: '.78rem', marginBottom: 7, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</h3>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>
                    <span>{video.author}</span><span>{video.views} views</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge b-cyan" style={{ fontSize: '.5rem' }}>{video.cat.toUpperCase()}</span>
                    <span className="badge" style={{ background: `${LEVEL_COLOR[video.level] || 'var(--cyan)'}12`, color: LEVEL_COLOR[video.level] || 'var(--cyan)', border: `1px solid ${LEVEL_COLOR[video.level] || 'var(--cyan)'}30`, fontSize: '.5rem' }}>{video.level}</span>
                    {canManageVideos && (
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" onClick={event => { event.stopPropagation(); openEditForm(video); }} style={{ fontSize: '.55rem', padding: '5px 8px' }}>Replace</button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>...</div>
            <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', color: 'var(--text3)' }}>No videos found</p>
          </div>
        )}
      </div>
    </div>
  );
}
