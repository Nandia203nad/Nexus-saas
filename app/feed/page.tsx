'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BlogCard from '@/components/BlogCard';

interface Blog { id:string;title:string;excerpt?:string;coverImage?:string;isPremium:boolean;isLocked?:boolean;minPlan?:string;readTime:number;views:number;createdAt:string;author:{id:string;name:string;avatar?:string;level:number;plan?:string};tags:Array<{tag:{name:string;slug:string;color:string}}>;_count:{comments:number;likes:number} }

export default function FeedPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!localStorage.getItem('nexus_token')) { router.replace('/'); return; }
    fetchFeed();
  }, []);

  const fetchFeed = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_token');
      const res = await fetch(`/api/feed?page=${pg}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setBlogs(data.blogs); setTotalPages(data.pagination?.totalPages || 1); }
    } catch {}
    finally { setLoading(false); }
  }, []);

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="editorial-label" style={{ marginBottom: 10 }}>Personal Feed</div>
          <h1 className="editorial-title" style={{ fontSize: 'clamp(1.3rem,3vw,1.9rem)' }}>Following <span className="grad-text">Feed</span></h1>
          <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginTop: 6 }}>Дагаж буй хүмүүсийн сүүлийн нийтлэлүүд</p>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(99,179,237,0.15)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : blogs.length === 0 ? (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>👥</div>
            <h3 style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.82rem', color: 'var(--text2)', marginBottom: 10 }}>Feed хоосон байна</h3>
            <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: 20 }}>Хэрэглэгчдийг дагаж, тэдний контентыг энд харна уу</p>
            <a href="/home" className="btn btn-primary btn-sm">Explore Blogs →</a>
          </div>
        ) : (
          <>
            <div className="blog-grid">{blogs.map((blog, i) => <BlogCard key={blog.id} blog={blog} index={i} />)}</div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
                <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={() => { const p=page-1; setPage(p); fetchFeed(p); }}>← Prev</button>
                <button className="btn btn-secondary btn-sm" disabled={page===totalPages} onClick={() => { const p=page+1; setPage(p); fetchFeed(p); }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
