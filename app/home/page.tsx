'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BlogCard from '@/components/BlogCard';
import FollowSuggestions from '@/components/FollowSuggestions';

interface Blog { id:string;title:string;excerpt?:string;coverImage?:string;isPremium:boolean;isLocked?:boolean;minPlan?:string;readTime:number;views:number;createdAt:string;author:{id:string;name:string;avatar?:string;level:number;plan?:string};tags:Array<{tag:{name:string;slug:string;color:string}}>;_count:{comments:number;likes:number} }
const TAGS = [{name:'TikTok',slug:'tiktok',cls:'t-cyan'},{name:'AI',slug:'ai',cls:'t-purple'},{name:'SEO',slug:'seo',cls:'t-green'},{name:'Маркетинг',slug:'marketing',cls:'t-magenta'},{name:'Freelance',slug:'freelance',cls:'t-orange'},{name:'Web3',slug:'web3',cls:'t-cyan'},{name:'Брэнд',slug:'brand',cls:'t-purple'},{name:'Tech',slug:'tech',cls:'t-green'},{name:'📚 Ном',slug:'book',cls:'t-yellow'}];

export default function HomePage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTag, setActiveTag] = useState('');
  const [sortBy, setSortBy] = useState<'latest'|'views'|'likes'>('latest');
  const debRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!localStorage.getItem('nexus_token')) { router.replace('/'); return; }
    fetchBlogs();
  }, []);

  const fetchBlogs = useCallback(async (q='',pg=1,tag='') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nexus_token');
      const params = new URLSearchParams({page:String(pg),limit:'10',...(q&&{search:q}),...(tag&&{tag})});
      const res = await fetch(`/api/blogs?${params}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
      const data = await res.json();
      if (data.success) { setBlogs(data.blogs); setTotalPages(data.pagination.totalPages||1); setTotal(data.pagination.total||0); }
    } catch {}
    finally { setLoading(false); }
  },[]);

  const handleSearch = (val:string) => { setSearch(val); clearTimeout(debRef.current); debRef.current = setTimeout(()=>{setPage(1);fetchBlogs(val,1,activeTag);},400); };
  const handleTag = (slug:string) => { const next=activeTag===slug?'':slug; setActiveTag(next); setPage(1); fetchBlogs(search,1,next); };
  const sorted = [...blogs].sort((a,b)=>sortBy==='views'?b.views-a.views:sortBy==='likes'?b._count.likes-a._count.likes:new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());

  return (
    <div style={{position:'relative',zIndex:1,minHeight:'100vh',background:'var(--bg)',color:'var(--text)'}}>
      <Navbar />
      <div style={{paddingTop:24,paddingBottom:22,borderBottom:'1px solid var(--border)'}}>
        <div className="container">
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:18}}>
            <div>
              <div className="editorial-label" style={{marginBottom:8}}>Live Transmissions</div>
              <h1 className="editorial-title" style={{fontSize:'clamp(1.5rem,3vw,2.2rem)'}}>Trending <span className="grad-text">Blogs</span></h1>
              <p style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)',marginTop:4}}>{total} articles</p>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
              <input className="input" placeholder="Search articles..." value={search} onChange={e=>handleSearch(e.target.value)} style={{width:200,padding:'9px 14px',fontSize:'.82rem'}} />
              <div style={{display:'flex',gap:3}}>
                {(['latest','views','likes'] as const).map(s=>(
                  <button key={s} onClick={()=>setSortBy(s)} className="btn btn-xs" style={{fontFamily:'JetBrains Mono,monospace',background:sortBy===s?'rgba(99,179,237,0.14)':'rgba(99,179,237,0.04)',color:sortBy===s?'var(--cyan)':'var(--text3)',border:`1px solid ${sortBy===s?'rgba(99,179,237,0.35)':'rgba(99,179,237,0.1)'}`}}>
                    {s==='latest'?'Latest':s==='views'?'Trending':'Top'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.56rem',color:'var(--text3)'}}>Filter:</span>
            {TAGS.map(t=>(
              <button key={t.slug} onClick={()=>handleTag(t.slug)} className={`tag-pill ${t.cls}`} style={{cursor:'pointer',opacity:activeTag&&activeTag!==t.slug?0.4:1,transform:activeTag===t.slug?'scale(1.05)':'scale(1)'}}>
                {t.name}
              </button>
            ))}
            {activeTag&&<button onClick={()=>handleTag('')} className="btn btn-xs" style={{color:'var(--magenta)',fontFamily:'JetBrains Mono,monospace'}}>✕</button>}
          </div>
        </div>
      </div>

      {/* Two-column layout: blogs + suggestions sidebar */}
      <div className="container" style={{paddingTop:24,paddingBottom:60}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:28,alignItems:'start'}}>
          {/* Main blog grid */}
          <div>
            {loading ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:80,gap:14}}>
                <div style={{width:44,height:44,border:'3px solid rgba(99,179,237,0.15)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
                <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.68rem',color:'var(--cyan)'}}>Loading articles...</div>
              </div>
            ) : sorted.length===0 ? (
              <div className="glass-card" style={{padding:60,textAlign:'center'}}>
                <div style={{fontSize:'3rem',marginBottom:14}}>📭</div>
                <h3 style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.82rem',color:'var(--text2)'}}>No articles found</h3>
              </div>
            ) : (
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:20}}>
                  {sorted.map((blog,i)=><BlogCard key={blog.id} blog={blog} index={i} />)}
                </div>
                {totalPages>1&&(
                  <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:48}}>
                    <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={()=>{const p=page-1;setPage(p);fetchBlogs(search,p,activeTag);}}>← Prev</button>
                    {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                      <button key={p} onClick={()=>{setPage(p);fetchBlogs(search,p,activeTag);}} className="btn btn-xs" style={{background:page===p?'var(--cyan)':'transparent',color:page===p?'#050810':'var(--text3)',border:`1px solid ${page===p?'var(--cyan)':'var(--border)'}`,minWidth:32}}>{p}</button>
                    ))}
                    <button className="btn btn-secondary btn-sm" disabled={page===totalPages} onClick={()=>{const p=page+1;setPage(p);fetchBlogs(search,p,activeTag);}}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar: Follow Suggestions */}
          <div style={{position:'sticky',top:80,display:'flex',flexDirection:'column',gap:16}}>
            <FollowSuggestions compact={true} />
            {/* Quick links */}
            <div style={{background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'var(--card-radius)',padding:16,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--cyan)',marginBottom:12,letterSpacing:'.08em'}}>QUICK LINKS</div>
              {[['/skill-tree','🌳 Skill Tree'],['/feed','📰 My Feed'],['/ai','🤖 AI Agent'],['/videos','🎬 Videos'],['/dashboard','📊 Dashboard']].map(([href,label])=>(
                <a key={href} href={href} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',color:'var(--text2)',textDecoration:'none',fontSize:'.84rem',borderBottom:'1px solid rgba(99,179,237,0.06)',transition:'color .2s'}}
                  onMouseOver={e=>(e.currentTarget.style.color='var(--cyan)')}
                  onMouseOut={e=>(e.currentTarget.style.color='var(--text2)')}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
