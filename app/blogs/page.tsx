'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BlogCard from '@/components/BlogCard';

interface Blog { id:string;title:string;excerpt?:string;coverImage?:string;isPremium:boolean;isLocked?:boolean;minPlan?:string;readTime:number;views:number;createdAt:string;author:{id:string;name:string;avatar?:string;level:number;plan?:string};tags:Array<{tag:{name:string;slug:string;color:string}}>;_count:{comments:number;likes:number} }
const TAGS=[{name:'TikTok',slug:'tiktok',cls:'t-cyan'},{name:'AI',slug:'ai',cls:'t-purple'},{name:'SEO',slug:'seo',cls:'t-green'},{name:'Маркетинг',slug:'marketing',cls:'t-magenta'},{name:'Freelance',slug:'freelance',cls:'t-orange'},{name:'Web3',slug:'web3',cls:'t-cyan'},{name:'Брэнд',slug:'brand',cls:'t-purple'},{name:'Tech',slug:'tech',cls:'t-green'},{name:'📚 Ном',slug:'book',cls:'t-yellow'}];

function BlogsContent() {
  const router=useRouter(); const sp=useSearchParams();
  const [blogs,setBlogs]=useState<Blog[]>([]); const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState(''); const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1); const [total,setTotal]=useState(0);
  const [activeTag,setActiveTag]=useState(sp.get('tag')||'');
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:'',content:'',excerpt:'',coverImage:'',isPremium:false,minPlan:'FREE' as 'FREE'|'PREMIUM'|'MAX',published:true,category:'general',tags:''});
  const [posting,setPosting]=useState(false);
  const [sortBy,setSortBy]=useState<'createdAt'|'views'|'likes'>('createdAt');

  useEffect(()=>{ if(!localStorage.getItem('nexus_token')){router.replace('/');return;} fetchBlogs('',1,sp.get('tag')||''); },[]);

  const fetchBlogs=useCallback(async(q='',pg=1,tag='')=>{
    setLoading(true);
    try{
      const token=localStorage.getItem('nexus_token');
      const params=new URLSearchParams({page:String(pg),limit:'9',...(q&&{search:q}),...(tag&&{tag})});
      const res=await fetch(`/api/blogs?${params}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
      const data=await res.json();
      if(data.success){setBlogs(data.blogs);setTotalPages(data.pagination.totalPages||1);setTotal(data.pagination.total||0);}
    }catch{}finally{setLoading(false);}
  },[]);

  const handleTag=(slug:string)=>{const next=activeTag===slug?'':slug;setActiveTag(next);setPage(1);fetchBlogs(search,1,next);router.push(next?`/blogs?tag=${next}`:'/blogs',{scroll:false});};

  const sorted=[...blogs].sort((a,b)=>sortBy==='views'?b.views-a.views:sortBy==='likes'?b._count.likes-a._count.likes:new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());

  const handlePost=async(e:React.FormEvent)=>{
    e.preventDefault();setPosting(true);
    try{
      const token=localStorage.getItem('nexus_token');
      if(!token){router.push('/auth/login');return;}
      const tagArr=form.tags?form.tags.split(',').map(t=>t.trim()).filter(Boolean):[];
      const res=await fetch('/api/blogs',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...form,tags:tagArr})});
      const data=await res.json();
      if(res.ok){setShowForm(false);setForm({title:'',content:'',excerpt:'',coverImage:'',isPremium:false,minPlan:'FREE',published:true,category:'general',tags:''});fetchBlogs(search,1,activeTag);alert('Published! +50 XP earned!');}
      else alert(data.message||'Error');
    }catch{alert('Network error');}finally{setPosting(false);}
  };

  return (
    <div style={{position:'relative',zIndex:1,minHeight:'100vh',background:'var(--bg)',color:'var(--text)'}}>
      <Navbar />
      <div style={{paddingTop:24,paddingBottom:22,borderBottom:'1px solid var(--border)'}}>
        <div className="container">
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:14,marginBottom:16}}>
            <div>
              <div className="editorial-label" style={{marginBottom:8}}>Transmission Hub</div>
              <h1 className="editorial-title" style={{fontSize:'clamp(1.3rem,3vw,1.9rem)'}}>All <span className="grad-text">Articles</span></h1>
              <p style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)',marginTop:3}}>{total} articles</p>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
              <input className="input" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);}} onKeyDown={e=>{if(e.key==='Enter'){setPage(1);fetchBlogs(search,1,activeTag);}}} style={{width:180,padding:'8px 12px',fontSize:'.8rem'}} />
              <div style={{display:'flex',gap:3}}>
                {(['createdAt','views','likes'] as const).map(s=>(
                  <button key={s} onClick={()=>setSortBy(s)} className="btn btn-xs" style={{fontFamily:'JetBrains Mono,monospace',background:sortBy===s?'rgba(99,179,237,0.14)':'rgba(99,179,237,0.04)',color:sortBy===s?'var(--cyan)':'var(--text3)',border:`1px solid ${sortBy===s?'rgba(99,179,237,0.35)':'rgba(99,179,237,0.1)'}`}}>
                    {s==='createdAt'?'Latest':s==='views'?'Trending':'Top'}
                  </button>
                ))}
              </div>
              <button onClick={()=>setShowForm(!showForm)} className={`btn btn-sm ${showForm?'btn-ghost':'btn-primary'}`}>{showForm?'✕ Cancel':'+ New Post'}</button>
            </div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
            <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.55rem',color:'var(--text3)'}}>Filter:</span>
            {TAGS.map(t=>(
              <button key={t.slug} onClick={()=>handleTag(t.slug)} className={`tag-pill ${t.cls}`} style={{cursor:'pointer',opacity:activeTag&&activeTag!==t.slug?0.4:1,transform:activeTag===t.slug?'scale(1.05)':'scale(1)'}}>
                {t.name}
              </button>
            ))}
            {activeTag&&<button onClick={()=>handleTag('')} className="btn btn-xs" style={{color:'var(--magenta)',fontFamily:'JetBrains Mono,monospace'}}>✕</button>}
          </div>
        </div>
      </div>
      <div className="container" style={{paddingTop:22,paddingBottom:60}}>
        {showForm&&(
          <div className="glass-card" style={{padding:24,marginBottom:24,border:'1px solid rgba(99,179,237,0.2)'}}>
            <div className="corner c-tl" /><div className="corner c-br" />
            <div className="editorial-label" style={{marginBottom:14}}>New Transmission</div>
            <form onSubmit={handlePost} style={{display:'flex',flexDirection:'column',gap:12}}>
              <input className="input" placeholder="Title * (min 5 chars)" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required minLength={5} />
              <input className="input" placeholder="Excerpt (brief summary)" value={form.excerpt} onChange={e=>setForm({...form,excerpt:e.target.value})} />
              <input className="input" placeholder="Cover image URL (optional)" value={form.coverImage} onChange={e=>setForm({...form,coverImage:e.target.value})} />
              <textarea className="input" placeholder="Content * (min 100 chars)" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} required minLength={100} style={{minHeight:160,fontFamily:'inherit',fontSize:'.95rem'}} />
              <input className="input" placeholder="Tags (comma separated: AI, SEO, TikTok)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
              <div style={{display:'flex',gap:18,flexWrap:'wrap',alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)'}}>Min Plan:</span>
                  {(['FREE','PREMIUM','MAX'] as const).map(p=>(
                    <button key={p} type="button" onClick={()=>setForm({...form,minPlan:p})} className="btn btn-xs" style={{fontFamily:'JetBrains Mono,monospace',background:form.minPlan===p?'rgba(99,179,237,0.14)':'transparent',color:form.minPlan===p?'var(--cyan)':'var(--text3)',border:`1px solid ${form.minPlan===p?'rgba(99,179,237,0.35)':'rgba(99,179,237,0.1)'}`}}>{p}</button>
                  ))}
                </div>
                <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text2)'}}>
                  <input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})} /> Publish Now
                </label>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.58rem',color:'var(--text3)',marginLeft:'auto'}}>{form.content.length} chars · ~{Math.max(1,Math.ceil(form.content.split(/\s+/).length/200))} min</span>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={posting}>{posting?'Publishing...':'📤 Publish (+50 XP)'}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        {loading?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:80,gap:14}}>
            <div style={{width:44,height:44,border:'3px solid rgba(99,179,237,0.15)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
            <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.68rem',color:'var(--cyan)'}}>Loading...</div>
          </div>
        ):sorted.length===0?(
          <div className="glass-card" style={{padding:60,textAlign:'center'}}>
            <div style={{fontSize:'3rem',marginBottom:14}}>📭</div>
            <h3 style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.82rem',color:'var(--text2)',marginBottom:10}}>No articles found</h3>
            <button onClick={()=>setShowForm(true)} className="btn btn-primary btn-sm">+ Write First Post</button>
          </div>
        ):(
          <>
            <div className="blog-grid">{sorted.map((blog,i)=><BlogCard key={blog.id} blog={blog} index={i} />)}</div>
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
    </div>
  );
}

export default function BlogsPage() {
  return <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:44,height:44,border:'3px solid rgba(99,179,237,0.15)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} /></div>}><BlogsContent /></Suspense>;
}
