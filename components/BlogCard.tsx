'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Blog {
  id:string; title:string; excerpt?:string; coverImage?:string;
  isPremium:boolean; isLocked?:boolean; minPlan?:string;
  readTime:number; views:number; createdAt:string;
  author:{id:string;name:string;avatar?:string;level:number;plan?:string};
  tags:Array<{tag:{name:string;slug:string;color:string}}>;
  _count:{comments:number;likes:number};
}

const TAG_IMG: Record<string, string> = {
  tiktok:'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=480&h=220&fit=crop&auto=format&q=70',
  ai:'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&h=220&fit=crop&auto=format&q=70',
  seo:'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=480&h=220&fit=crop&auto=format&q=70',
  marketing:'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=480&h=220&fit=crop&auto=format&q=70',
  freelance:'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=480&h=220&fit=crop&auto=format&q=70',
  web3:'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=480&h=220&fit=crop&auto=format&q=70',
  youtube:'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=480&h=220&fit=crop&auto=format&q=70',
  brand:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&h=220&fit=crop&auto=format&q=70',
  tech:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=220&fit=crop&auto=format&q=70',
  email:'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=480&h=220&fit=crop&auto=format&q=70',
  book:'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=480&h=220&fit=crop&auto=format&q=70',
  default:'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=480&h=220&fit=crop&auto=format&q=70',
};
const TAG_PILLS: Record<string,string> = { tiktok:'t-cyan', ai:'t-purple', seo:'t-green', marketing:'t-magenta', freelance:'t-orange', web3:'t-cyan', youtube:'t-magenta', brand:'t-purple', tech:'t-green', book:'t-yellow', default:'t-cyan' };
const PLAN_BADGE: Record<string,{label:string;cls:string}> = { FREE:{label:'Free',cls:'b-free'}, PREMIUM:{label:'Premium',cls:'b-premium'}, MAX:{label:'Max',cls:'b-max'} };

export default function BlogCard({ blog, index=0 }: { blog:Blog; index?:number }) {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(blog._count.likes);
  const [bookmarked, setBookmarked] = useState(false);

  const initials = blog.author.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2);
  const primarySlug = blog.tags[0]?.tag?.slug || '';
  const imgSrc = blog.coverImage || TAG_IMG[primarySlug] || TAG_IMG.default;
  const xp = blog.readTime * 4;
  const planBadge = PLAN_BADGE[blog.minPlan || 'FREE'] || PLAN_BADGE.FREE;

  const handleLike = async (e:React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const token = localStorage.getItem('nexus_token');
    if (!token) { window.location.href='/auth/login'; return; }
    const prev = liked; setLiked(!prev); setLikeCount(c => prev?c-1:c+1);
    try {
      const res = await fetch(`/api/blogs/${blog.id}/like`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) { setLiked(prev); setLikeCount(c=>prev?c+1:c-1); }
    } catch { setLiked(prev); setLikeCount(c=>prev?c+1:c-1); }
  };

  const handleBookmark = async (e:React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const token = localStorage.getItem('nexus_token');
    if (!token) { window.location.href='/auth/login'; return; }
    setBookmarked(b=>!b);
    try { await fetch(`/api/blogs/${blog.id}/bookmark`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}); }
    catch { setBookmarked(b=>!b); }
  };

  return (
    <div className="blog-card" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{animationDelay:`${index*0.06}s`}}>
      <div className="corner c-tl" style={{opacity:hovered?0.9:0.3,transition:'opacity 0.3s'}} />
      <div className="corner c-br" style={{opacity:hovered?0.9:0.3,transition:'opacity 0.3s'}} />

      {/* Image */}
      <Link href={`/blogs/${blog.id}`} style={{textDecoration:'none',display:'block'}}>
        <div style={{height:170,position:'relative',overflow:'hidden',borderRadius:'15px 15px 0 0',background:'var(--bg3)'}}>
          <img src={imgSrc} alt={blog.title} loading="lazy"
            style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.78,display:'block',transition:'transform 0.4s ease',transform:hovered?'scale(1.03)':'scale(1)'}}
            onError={e=>{(e.target as HTMLImageElement).src=TAG_IMG.default;}} />
          <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(5,8,16,0.72) 0%,transparent 55%)',pointerEvents:'none'}} />
          {/* Plan badge top-left */}
          <div style={{position:'absolute',top:10,left:10}}>
            <span className={`badge ${planBadge.cls}`} style={{fontSize:'.52rem',padding:'2px 7px'}}>{planBadge.label}</span>
          </div>
          {/* XP badge top-right */}
          <div style={{position:'absolute',top:10,right:10,background:'rgba(104,211,145,0.14)',border:'1px solid rgba(104,211,145,0.35)',borderRadius:5,padding:'2px 8px',fontFamily:'JetBrains Mono,monospace',fontSize:'.58rem',color:'var(--green)'}}>+{xp}XP</div>
          {/* Lock overlay */}
          {blog.isLocked && (
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
              <span style={{fontSize:'1.8rem'}}>🔒</span>
              <span className={`badge ${planBadge.cls}`} style={{fontSize:'.52rem'}}>Requires {planBadge.label}</span>
            </div>
          )}
          {/* Category stripe bottom-left - WDD style */}
          {blog.tags[0] && (
            <div style={{position:'absolute',bottom:10,left:10}}>
              <Link href={`/blogs?tag=${blog.tags[0].tag.slug}`} onClick={e=>e.stopPropagation()}
                className={`tag-pill ${TAG_PILLS[blog.tags[0].tag.slug]||'t-cyan'}`}
                style={{fontSize:'.54rem',padding:'3px 9px',backdropFilter:'blur(8px)',background:'rgba(9,14,26,0.7)'}}>
                #{blog.tags[0].tag.name}
              </Link>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div style={{padding:'16px 18px',flex:1,display:'flex',flexDirection:'column',gap:10}}>
        {/* Extra tags */}
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {blog.tags.slice(1,3).map((pt,i)=>(
            <Link key={i} href={`/blogs?tag=${pt.tag.slug}`} onClick={e=>e.stopPropagation()}
              className={`tag-pill ${TAG_PILLS[pt.tag.slug]||'t-cyan'}`} style={{fontSize:'.52rem'}}>
              #{pt.tag.name}
            </Link>
          ))}
        </div>

        {/* Title - editorial style */}
        <Link href={`/blogs/${blog.id}`} style={{textDecoration:'none'}}>
          <h3 style={{fontFamily:"'Playfair Display','Georgia',serif",fontSize:'.95rem',fontWeight:700,lineHeight:1.35,color:hovered?'var(--cyan)':'var(--text)',transition:'color 0.2s',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {blog.isLocked ? '🔒 ' : ''}{blog.title}
          </h3>
        </Link>

        {blog.excerpt && !blog.isLocked && (
          <p style={{fontSize:'.82rem',color:'var(--text2)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{blog.excerpt}</p>
        )}
        {blog.isLocked && <p style={{fontSize:'.78rem',color:'var(--text3)',fontFamily:'JetBrains Mono,monospace',fontStyle:'italic'}}>// Upgrade to access</p>}

        {/* Footer */}
        <div style={{marginTop:'auto',paddingTop:10,borderTop:'1px solid rgba(99,179,237,0.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:27,height:27,borderRadius:'50%',background:'linear-gradient(135deg,var(--cyan),var(--purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.58rem',fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#050810',flexShrink:0}}>
              {blog.author.avatar?<img src={blog.author.avatar} alt="" style={{width:27,height:27,borderRadius:'50%',objectFit:'cover'}} />:initials}
            </div>
            <div>
              <div style={{fontSize:'.74rem',fontWeight:600,color:'var(--text)',lineHeight:1}}>{blog.author.name}</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.57rem',color:'var(--cyan)',lineHeight:1}}>Lv.{blog.author.level}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <button onClick={handleLike} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3,color:liked?'var(--magenta)':'var(--text3)',fontFamily:'JetBrains Mono,monospace',fontSize:'.68rem',padding:'3px 6px',borderRadius:5,transition:'all 0.2s'}}>
              {liked?'♥':'♡'} {likeCount}
            </button>
            <span style={{color:'var(--text3)',fontSize:'.68rem',fontFamily:'JetBrains Mono,monospace'}}>💬{blog._count.comments}</span>
            <button onClick={handleBookmark} style={{background:'none',border:'none',cursor:'pointer',color:bookmarked?'var(--cyan)':'var(--text3)',fontSize:'.9rem',padding:'3px 4px',transition:'all 0.2s'}}>
              {bookmarked?'◈':'◇'}
            </button>
          </div>
        </div>

        <Link href={`/blogs/${blog.id}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',textDecoration:'none',padding:'7px 12px',background:hovered?'rgba(99,179,237,0.1)':'rgba(99,179,237,0.04)',border:`1px solid ${hovered?'rgba(99,179,237,0.3)':'rgba(99,179,237,0.1)'}`,borderRadius:7,transition:'all 0.2s'}}>
          <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.62rem',color:'var(--cyan)'}}>Read Article</span>
          <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.62rem',color:'var(--cyan)'}}>→</span>
        </Link>
      </div>
    </div>
  );
}
