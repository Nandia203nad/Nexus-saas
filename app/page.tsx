'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [topicSearch, setTopicSearch] = useState('');
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem('nexus_token')) { router.replace('/home'); return; }
    setLoaded(true);
    // Auto-rotate testimonials
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % 5), 4000);
    return () => clearInterval(t);
  }, [router]);

  if (!loaded) return <div style={{ minHeight:'100vh', background:'#0ba4a0', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} /></div>;

  const FEATURES_TOP = [
    { icon:'⚡', emoji:'⚡', title:'XP Engine', color:'#0ba4a0', desc:'Блог бичих, унших бүрд XP цуглуул. Level ахиулж CV-д харуул.' },
    { icon:'🌳', emoji:'🌳', title:'Skill Tree', color:'#ff6b8a', desc:'Marketing, AI, Design — бүх мэргэшлийг нэг системд хөгжүүл.' },
    { icon:'🤖', emoji:'🤖', title:'AI Agent', color:'#0ba4a0', desc:'Контент бүтээх, шинжлэх, санал авах — AI туслагч.' },
  ];
  const FEATURES_BOT = [
    { icon:'👥', title:'Follow System', color:'#ff6b8a', desc:'Хэрэглэгчдийг дагаж, персонал feed харах.' },
    { icon:'💼', title:'Portfolio', color:'#0ba4a0', desc:'AI шинжилгээний үр дүнг файл болгон хадгалах.' },
    { icon:'💳', title:'Free/$3/$7', color:'#ff6b8a', desc:'Хэрэгцээдээ тохирсон багц сонгоод upgrade хий.' },
    { icon:'📊', title:'Dashboard', color:'#0ba4a0', desc:'XP, streak, skill statistics — бүгдийг нэг газарт.' },
  ];

  const TESTIMONIALS = [
    { name:'Батболд Д', role:'TikTok маркетер', plan:'PREMIUM', xp:5620, avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text:'Nexus платформ дээр блог бичиж эхэлснээс хойш XP 5000-аас давж, Premium багцад хүрлээ. Skill tree нь миний карьерийг шинэ түвшинд гаргасан!' },
    { name:'Сарнай О', role:'AI контент бүтээгч', plan:'PREMIUM', xp:6100, avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', text:'ChatGPT болон Claude-тай холбогдсон AI Agent маань контент бүтээлтийг 5 дахин хурдасгасан. Ямар гайхалтай платформ!' },
    { name:'Болдбаатар Х', role:'Web3 стратегист', plan:'MAX', xp:7200, avatar:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', text:'MAX багцын AI ном нийтлэх функц бол гайхалтай! Судалгаагаа автоматаар ном болгох боломжтой болсон нь маш чухал давуу тал.' },
    { name:'Энхтуяа Б', role:'Freelance coach', plan:'PREMIUM', xp:5150, avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text:'Follow систем нь зорилтот хэрэглэгчдийг олоход маш тус болдог. Персонал feed нь өдөр бүр шинэ зүйл сурах боломж өгдөг.' },
    { name:'Мөнхбаяр Ц', role:'SEO мэргэжилтэн', plan:'PREMIUM', xp:5800, avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', text:'Dashboard-ын аналитик нь блогийн гүйцэтгэлийг ойлгоход маш тустай. XP streak-ийн систем маш урам зоригтой!' },
  ];

  const ALL_TOPICS = ['Artificial Intelligence','ChatGPT','Machine Learning','Deep Learning','Large Language Models','Blockchain','Bitcoin','Ethereum','DeFi','NFT','Data Science','Analytics','SQL','Data Visualization','Programming','JavaScript','Python','React','Flutter','DevOps','Docker','Kubernetes','AWS','Marketing','SEO','Writing','Book Reviews','Art','Gaming','Metaverse','CSS','HTML','Java','Angular','Frontend Engineering','iOS Development','Android','Databricks','Terraform','Creative Nonfiction','Generative Art','Game Design','Indie Game','Fine Art','Contemporary Art'];
  const filteredTopics = ALL_TOPICS.filter(t => !topicSearch || t.toLowerCase().includes(topicSearch.toLowerCase()));

  const handleCheckout = async (plan: 'PREMIUM' | 'MAX') => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.push('/auth/register'); return; }
    try {
      const res = await fetch('/api/stripe/checkout', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify({ plan }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert('Stripe холболтод алдаа гарлаа. Дараа дахин оролдоно уу.'); }
  };

  return (
    <div style={{ minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", overflowX:'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes scrollLeft{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes scrollRight{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
        @keyframes testimonialFade{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes topicGlow{0%,100%{box-shadow:0 0 0 0 rgba(11,164,160,0)}50%{box-shadow:0 0 12px 2px rgba(11,164,160,0.3)}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes float3d{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        .nav-link{color:rgba(255,255,255,.85);font-weight:500;font-size:.92rem;text-decoration:none;padding:4px 0;border-bottom:2px solid transparent;transition:all .2s}
        .nav-link:hover,.nav-link.active{color:#fff;border-bottom-color:#fff}
        .btn-coral{background:#ff6b8a;color:#fff;border:none;padding:15px 36px;border-radius:50px;font-weight:700;font-size:1rem;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px;text-decoration:none;box-shadow:0 8px 24px rgba(255,107,138,.35)}
        .btn-coral:hover{background:#ff5577;transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,107,138,.45)}
        .btn-white{background:#fff;color:#0ba4a0;border:none;padding:15px 32px;border-radius:50px;font-weight:700;font-size:1rem;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px;text-decoration:none}
        .btn-white:hover{background:#f0fafa;transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,255,255,.2)}
        .circle-card{background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:30px;box-shadow:0 4px 32px rgba(0,0,0,.08);transition:all .3s;cursor:pointer;border:3px solid transparent;flex-shrink:0}
        .circle-card:hover{transform:translateY(-8px) scale(1.04);border-color:#0ba4a0;box-shadow:0 16px 48px rgba(11,164,160,.2)}
        .plan-card{background:#fff;border-radius:24px;padding:36px 28px;box-shadow:0 4px 28px rgba(0,0,0,.07);transition:all .3s;border:2.5px solid transparent;position:relative;overflow:visible}
        .plan-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(11,164,160,.14)}
        .plan-card.featured{border-color:#0ba4a0}
        .topic-chip{display:inline-flex;align-items:center;padding:6px 14px;border-radius:24px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .3s;margin:4px;border:1.5px solid;white-space:nowrap}
        .section-wave{background:linear-gradient(160deg,#0ba4a0 0%,#08d0cc 40%,#0ba4a0 100%)}
        @media(max-width:900px){
          .plans-row{flex-direction:column!important}
        }
      `}</style>

      {/* ─── HERO — full-screen background image ─── */}
      <section id="hero" style={{ position:'relative', overflow:'hidden', minHeight:'100vh' }}>

        {/* Full-screen background image */}
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <Image
            src="/hero-bg.jpg"
            alt="Nexus hero"
            fill
            style={{ objectFit:'cover', objectPosition:'center top' }}
            priority
          />
          {/* Left gradient overlay — text readable, right side image clear */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(100deg, rgba(4,12,28,0.93) 0%, rgba(6,18,38,0.82) 38%, rgba(8,24,44,0.45) 62%, rgba(0,0,0,0.08) 100%)' }} />
          {/* Bottom fade for wave */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:180, background:'linear-gradient(to top, rgba(4,12,28,0.55), transparent)' }} />
        </div>

        {/* Nav */}
        <nav style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 48px', maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(255,255,255,0.4)', boxShadow:'0 0 12px rgba(255,255,255,0.2)', flexShrink:0 }}>
              <Image src="/nexus-logo.jpg" alt="Nexus" width={42} height={42} style={{ objectFit:'cover', width:'100%', height:'100%' }} priority />
            </div>
            <span style={{ color:'#fff', fontWeight:800, fontSize:'1.25rem', letterSpacing:'.03em' }}>Nexus</span>
          </div>
          <div style={{ display:'flex', gap:36, alignItems:'center' }}>
            {[['#hero','HOME'],['#features','FEATURES'],['#plans','PLANS'],['#faq','FAQ']].map(([href,label]) => (
              <a key={label} href={href} className={`nav-link${label==='HOME'?' active':''}`}>{label}</a>
            ))}
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <Link href="/auth/login" style={{ color:'#fff', fontWeight:600, fontSize:'.92rem', textDecoration:'none', padding:'8px 20px' }}>SIGN IN</Link>
            <Link href="/auth/register" className="btn-white" style={{ padding:'10px 24px', fontSize:'.9rem' }}>SIGN UP</Link>
          </div>
        </nav>

        {/* Hero content — left-aligned, over the image */}
        <div style={{ position:'relative', zIndex:5, maxWidth:1280, margin:'0 auto', padding:'0 48px 80px', display:'flex', flexDirection:'column', justifyContent:'center', minHeight:'calc(100vh - 86px)' }}>
          <div style={{ maxWidth:600 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }}>
              {['Content','XP Engine','Skill Tree','AI Agent'].map(t => (
                <span key={t} style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.28)', borderRadius:50, padding:'6px 16px', fontSize:'.85rem', color:'#fff', fontWeight:500 }}>{t}</span>
              ))}
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:'clamp(3rem,5.5vw,5.2rem)', color:'#fff', lineHeight:1.06, marginBottom:24, letterSpacing:'-.02em', textShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
              Make Blog<br />
              <span style={{ color:'#7ef4f0' }}>Creation Easy</span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'1.08rem', lineHeight:1.8, marginBottom:36, maxWidth:480, textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>
              Мэдлэгээ хуваалц, брэндээ өсгө, XP цуглуулж skill tree нээ. AI Agent болон Follow систем нэгэн дор — Nexus дэлхий бүхэнтэй холбогддог.
            </p>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:52 }}>
              <Link href="/auth/register" className="btn-coral" style={{ fontSize:'1.02rem', padding:'15px 38px' }}>
                FREE SIGN UP →
              </Link>
              <Link href="/auth/login" className="btn-white" style={{ fontSize:'1.02rem', padding:'15px 28px' }}>
                Sign In
              </Link>
            </div>
            <div style={{ display:'flex', gap:36, alignItems:'center' }}>
              {[['9+','Architects'],['10','Articles'],['5K+','XP Earned']].map(([val,lbl]) => (
                <div key={lbl}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:900, color:'#fff', lineHeight:1, textShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>{val}</div>
                  <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'.8rem', marginTop:4 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating badges over the image */}
        <div style={{ position:'absolute', top:'28%', right:'6%', zIndex:6, animation:'bob 3s ease-in-out infinite', willChange:'transform' }}>
          <div style={{ background:'#ff6b8a', borderRadius:14, padding:'10px 18px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 28px rgba(255,107,138,0.5)' }}>
            <span style={{ fontSize:'1.1rem' }}>⚡</span>
            <span style={{ fontWeight:800, fontSize:'.9rem', color:'#fff' }}>+50 XP</span>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:'22%', right:'12%', zIndex:6, animation:'bob 3.5s ease-in-out .8s infinite', willChange:'transform' }}>
          <div style={{ background:'rgba(255,255,255,0.96)', borderRadius:14, padding:'10px 18px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 28px rgba(0,0,0,0.22)' }}>
            <span style={{ fontSize:'1.1rem' }}>🌳</span>
            <span style={{ fontWeight:800, fontSize:'.9rem', color:'#0ba4a0' }}>Skill Tree</span>
          </div>
        </div>

        {/* Wave bottom */}
        <div style={{ position:'absolute', bottom:-2, left:0, right:0, lineHeight:0, zIndex:8 }}>
          <svg viewBox="0 0 1440 80" style={{ width:'100%', display:'block' }}>
            <path d="M0,60 C360,0 1080,80 1440,30 L1440,80 L0,80 Z" fill="#f0f4f8"/>
          </svg>
        </div>
      </section>

      {/* ─── FEATURES with infinite scroll ─── */}
      <section id="features" style={{ background:'#f0f4f8', padding:'90px 0 60px', overflow:'hidden' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 48px', marginBottom:52 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#0ba4a0' }} />
            <span style={{ color:'#0ba4a0', fontWeight:700, fontSize:'.88rem', letterSpacing:'.1em', textTransform:'uppercase' }}>Platform Features</span>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#0ba4a0' }} />
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:800, color:'#1a2e3b', textAlign:'center', lineHeight:1.2, marginBottom:0 }}>
            Everything You Need<br />to <span style={{ color:'#0ba4a0' }}>Create & Grow</span>
          </h2>
        </div>

        {/* Infinite scroll LEFT → RIGHT (top row) */}
        <div style={{ overflow:'hidden', marginBottom:32 }}>
          <div ref={scrollRef1} style={{ display:'flex', gap:36, width:'max-content', animation:'scrollLeft 30s linear infinite' }}>
            {[...FEATURES_TOP,...FEATURES_TOP,...FEATURES_TOP].map((f,i) => (
              <div key={i} className="circle-card" style={{ width:200, height:200 }}
                onClick={() => router.push('/home')}>
                <div style={{ fontSize:'2.4rem', marginBottom:10 }}>{f.emoji}</div>
                <div style={{ fontWeight:800, fontSize:'.9rem', color:f.color, marginBottom:7 }}>{f.title}</div>
                <div style={{ fontSize:'.72rem', color:'#6b7c8d', lineHeight:1.55, maxWidth:130 }}>{f.desc}</div>
                <button onClick={() => router.push('/home')} style={{ marginTop:10, color:f.color, background:'none', border:'none', fontWeight:700, fontSize:'.72rem', cursor:'pointer', textDecoration:'underline' }}>LEARN MORE</button>
              </div>
            ))}
          </div>
        </div>

        {/* Infinite scroll RIGHT → LEFT (bottom row) */}
        <div style={{ overflow:'hidden' }}>
          <div ref={scrollRef2} style={{ display:'flex', gap:36, width:'max-content', animation:'scrollRight 35s linear infinite' }}>
            {[...FEATURES_BOT,...FEATURES_BOT,...FEATURES_BOT].map((f,i) => (
              <div key={i} className="circle-card" style={{ width:185, height:185 }}>
                <div style={{ fontSize:'2rem', marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontWeight:800, fontSize:'.83rem', color:f.color, marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:'.7rem', color:'#6b7c8d', lineHeight:1.5, textAlign:'center', maxWidth:120 }}>{f.desc}</div>
                <button onClick={() => router.push('/home')} style={{ marginTop:8, color:f.color, background:'none', border:'none', fontWeight:700, fontSize:'.7rem', cursor:'pointer', textDecoration:'underline' }}>LEARN MORE</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS — orbiting avatars ─── */}
      <section style={{ background:'#fff', padding:'90px 48px', overflow:'hidden' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff6b8a' }} />
            <span style={{ color:'#ff6b8a', fontWeight:700, fontSize:'.88rem', letterSpacing:'.1em', textTransform:'uppercase' }}>Community</span>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff6b8a' }} />
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:800, color:'#1a2e3b', textAlign:'center', lineHeight:1.2, marginBottom:52 }}>
            WHAT OUR <span style={{ color:'#0ba4a0' }}>ARCHITECTS</span> SAY
          </h2>
          <div style={{ position:'relative', height:620 }}>
            {/* Orbit rings — bigger */}
            <div style={{ position:'absolute', left:'50%', top:'42%', transform:'translate(-50%,-50%)', width:540, height:540, borderRadius:'50%', border:'1px dashed rgba(11,164,160,0.22)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', left:'50%', top:'42%', transform:'translate(-50%,-50%)', width:400, height:400, borderRadius:'50%', border:'1px solid rgba(11,164,160,0.07)', pointerEvents:'none' }} />
            {/* Orbiting avatar circles */}
            {TESTIMONIALS.map((t,i) => {
              const isActive = activeTestimonial === i;
              return (
                <div key={t.name}
                  onClick={() => setActiveTestimonial(i)}
                  style={{
                    position:'absolute', left:'50%', top:'42%',
                    marginLeft:-35, marginTop:-35,
                    animation:'orbit 26s linear infinite',
                    animationDelay:`${-(i/5)*26}s`,
                    zIndex: isActive ? 8 : 3,
                    cursor:'pointer',
                  }}
                >
                  <div style={{
                    width:70, height:70,
                    borderRadius:'50%', overflow:'hidden',
                    border: isActive ? '3px solid #0ba4a0' : '2.5px solid rgba(11,164,160,0.3)',
                    boxShadow: isActive ? '0 0 0 6px rgba(11,164,160,0.18),0 8px 28px rgba(0,0,0,0.18)' : '0 2px 10px rgba(0,0,0,0.12)',
                    transition:'all .35s',
                    transform: isActive ? 'scale(1.25)' : 'scale(1)',
                    background:'#e0f7f7',
                  }}>
                    <img src={t.avatar} alt={t.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.background='#0ba4a0'; }} />
                  </div>
                  {isActive && (
                    <div style={{ position:'absolute', bottom:-22, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', fontSize:'.62rem', fontWeight:700, color:'#0ba4a0', background:'rgba(255,255,255,0.95)', padding:'2px 8px', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', pointerEvents:'none' }}>
                      {t.name.split(' ')[0]}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Center — open testimonial text, no card */}
            <div style={{ position:'absolute', left:'50%', top:'42%', transform:'translate(-50%,-50%)', width:280, zIndex:10, textAlign:'center', animation:'testimonialFade .5s ease' }} key={activeTestimonial}>
              <div style={{ fontSize:'3.2rem', color:'rgba(11,164,160,0.55)', fontFamily:"'Playfair Display',serif", lineHeight:1, marginBottom:4 }}>"</div>
              <p style={{ fontSize:'.9rem', color:'#2d4a5a', lineHeight:1.8, fontStyle:'italic', marginBottom:10, fontWeight:500 }}>{TESTIMONIALS[activeTestimonial].text}</p>
              <div style={{ fontWeight:800, fontSize:'.9rem', color:'#1a2e3b', marginBottom:2 }}>{TESTIMONIALS[activeTestimonial].name}</div>
              <div style={{ fontSize:'.74rem', color:'#0ba4a0', marginBottom:12, fontWeight:600 }}>{TESTIMONIALS[activeTestimonial].role}</div>
            </div>
            {/* Dots below */}
            <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
              {TESTIMONIALS.map((_,i) => (
                <div key={i} onClick={() => setActiveTestimonial(i)} style={{ width:i===activeTestimonial?28:8, height:8, borderRadius:4, background:i===activeTestimonial?'#0ba4a0':'rgba(11,164,160,0.22)', transition:'all .3s', cursor:'pointer' }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── EXPLORE TOPICS — animated chips ─── */}
      <section style={{ background:'#f0f4f8', padding:'80px 48px', overflow:'hidden' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:800, color:'#1a2e3b', textAlign:'center', marginBottom:12 }}>Explore Topics</h2>
          <p style={{ textAlign:'center', color:'#6b7c8d', marginBottom:28, fontSize:'.95rem' }}>Мянган нийтлэл, онолын болон практик мэдлэг</p>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
            <input type="text" placeholder="Search topics..." value={topicSearch} onChange={e=>setTopicSearch(e.target.value)}
              style={{ padding:'12px 22px', border:'2px solid rgba(11,164,160,0.25)', borderRadius:50, fontSize:'.9rem', outline:'none', width:280, fontFamily:'inherit', color:'#1a2e3b', transition:'border .2s' }}
              onFocus={e=>(e.target.style.borderColor='#0ba4a0')}
              onBlur={e=>(e.target.style.borderColor='rgba(11,164,160,0.25)')} />
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:0 }}>
            {filteredTopics.map((t,i) => {
              const hues = ['#0ba4a0','#ff6b8a','#9f7aea','#f6ad55','#68d391','#63b3ed','#fc8181'];
              const color = hues[i % hues.length];
              return (
                <Link key={t} href={`/blogs?tag=${t.toLowerCase().replace(/\s+/g,'-')}`}
                  className="topic-chip"
                  style={{ color, borderColor:`${color}40`, background:`${color}0d`, animationDelay:`${i*0.05}s` }}
                  onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.background=color; el.style.color='#fff'; el.style.transform='scale(1.08) translateY(-2px)'; el.style.boxShadow=`0 6px 16px ${color}40`; }}
                  onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.background=`${color}0d`; el.style.color=color; el.style.transform='scale(1) translateY(0)'; el.style.boxShadow='none'; }}>
                  {t}
                </Link>
              );
            })}
          </div>
          {filteredTopics.length === 0 && <p style={{ textAlign:'center', color:'#6b7c8d', marginTop:20 }}>No topics found for "{topicSearch}"</p>}
        </div>
      </section>

      {/* ─── PLANS — enhanced Stripe checkout ─── */}
      <section id="plans" style={{ padding:'90px 48px', background:'linear-gradient(160deg,#0ba4a0 0%,#08d0cc 50%,#0ba4a0 100%)' }}>
        <div style={{ maxWidth:1050, margin:'0 auto' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, color:'#fff', textAlign:'center', marginBottom:10 }}>Simple, Transparent</h2>
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.85)', marginBottom:56, fontSize:'1rem' }}>Хэрэгцээдээ тохирсон багц сонго</p>
          <div className="plans-row" style={{ display:'flex', gap:28, justifyContent:'center', alignItems:'stretch', flexWrap:'wrap' }}>
            {[
              { name:'FREE', price:'$0', period:'forever', icon:'🆓', color:'#68d391', textColor:'#2d7a5c',
                features:['Blog унших & бичих','XP & Level систем','Basic Skill Tree','AI (5/сар)','Follow систем','Comments & Like'],
                cta:'Get Started', action:'free', featured:false },
              { name:'PREMIUM', price:'$3', period:'/month', icon:'💎', color:'#0ba4a0', textColor:'#0ba4a0',
                features:['Free бүгд','Premium контент','AI (50/сар)','Skill Tree Advanced','Portfolio файл','Analytics','Book Reviews'],
                cta:'Get Started', action:'PREMIUM', featured:true },
              { name:'MAX', price:'$7', period:'/month', icon:'🚀', color:'#9f7aea', textColor:'#7c3aed',
                features:['Premium бүгд','Бүх контент','AI (200/сар)','Skill Tree PRO','AI ном нийтлэл','Хувийн ментор','MAX exclusive'],
                cta:'Get Started', action:'MAX', featured:false },
            ].map(p => (
              <div key={p.name} className={`plan-card${p.featured?' featured':''}`}
                style={{ flex:1, minWidth:280, maxWidth:320, ...(p.featured?{transform:'scale(1.04)',zIndex:2}:{}) }}>
                {p.featured && (
                  <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'#ff6b8a', color:'#fff', padding:'5px 22px', borderRadius:20, fontWeight:800, fontSize:'.75rem', boxShadow:'0 4px 14px rgba(255,107,138,0.4)' }}>MOST POPULAR</div>
                )}
                <div style={{ textAlign:'center', marginBottom:22 }}>
                  <div style={{ fontSize:'2.6rem', marginBottom:12 }}>{p.icon}</div>
                  <div style={{ fontWeight:800, fontSize:'.95rem', color:p.textColor, marginBottom:10, letterSpacing:'.06em' }}>{p.name}</div>
                  <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:4 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.8rem', fontWeight:900, color:'#1a2e3b' }}>{p.price}</span>
                    <span style={{ color:'#6b7c8d', fontSize:'.88rem' }}>{p.period}</span>
                  </div>
                </div>
                <div style={{ height:1, background:'rgba(0,0,0,0.06)', marginBottom:20 }} />
                <ul style={{ listStyle:'none', padding:0, marginBottom:28 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display:'flex', gap:10, alignItems:'flex-start', fontSize:'.88rem', color:'#4a5568', marginBottom:10 }}>
                      <span style={{ color:p.textColor, fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => {
                  if (p.action === 'free') router.push('/auth/register');
                  else handleCheckout(p.action as 'PREMIUM'|'MAX');
                }} style={{ width:'100%', padding:'14px', background:p.featured?'#0ba4a0':'transparent', color:p.featured?'#fff':p.textColor, border:`2.5px solid ${p.textColor}`, borderRadius:50, fontWeight:800, fontSize:'.9rem', cursor:'pointer', transition:'all .25s', boxShadow:p.featured?`0 8px 24px ${p.color}33`:'none' }}
                  onMouseOver={e=>{ const el=e.currentTarget as HTMLElement; el.style.background=p.textColor; el.style.color='#fff'; el.style.transform='translateY(-2px)'; }}
                  onMouseOut={e=>{ const el=e.currentTarget as HTMLElement; el.style.background=p.featured?p.textColor:'transparent'; el.style.color=p.featured?'#fff':p.textColor; el.style.transform='translateY(0)'; }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.7)', fontSize:'.82rem', marginTop:28 }}>
            🔒 Stripe-р аюулгүй төлбөр · Дурын үед цуцлах боломжтой · PCI DSS нийцтэй
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ background:'#f0f4f8', padding:'80px 48px' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.6rem)', fontWeight:800, color:'#1a2e3b', textAlign:'center', marginBottom:48 }}>
            Frequently Asked <span style={{ color:'#0ba4a0' }}>Questions</span>
          </h2>
          {[
            { q:'Nexus платформ юу вэ?', a:'Nexus бол контент бүтээгчдэд зориулсан SaaS платформ. Блог бичих, XP цуглуулах, skill tree нээх, AI agent ашиглах бүгдийг нэгэн дор хийж болно. Суппабейс PostgreSQL дотооды өгөгдлийн сан ашиглаж байна.' },
            { q:'Блог бичиж эхлэхийн тулд юу хийх вэ?', a:'Бүртгүүлсний дараа Home → "New Blog" товч дарж эхлэх боломжтой. Гарчиг, агуулга, хамааруулах tag сонгоод нийтлэх хэсэгт товших хангалттай. Эхний нийтлэлийн дараа +50 XP автоматаар нэмэгдэнэ. Зураг нэмэхэд Unsplash URL эсвэл өөрийн зураг хэрэглэж болно.' },
            { q:'Блог сайтаа SEO-д тааруулах хамгийн чухал зөвлөгөө юу вэ?', a:'1) Гарчигт үндсэн түлхүүр үгийг оруул — хайлтын системд 50-60 тэмдэгтийн хязгаарт байх нь хамгийн тохиромжтой. 2) Нийтлэл тус бүрт өвөрмөц tag оруул: JavaScript, AI, Marketing гэх мэт тодорхой категорийг сонго. 3) Нийтлэлийн эхний 150 тэмдэгт нь автоматаар meta description болдог учир энэ хэсэгт үгийг сайн сонго. 4) Байнга нийтлэх (долоо хоногт 2-3 удаа) нь Google-ийн crawl давтамжийг нэмэгдүүлдэг.' },
            { q:'Байнгын уншигч олох хамгийн үр дүнтэй арга юу вэ?', a:'Follow системийн ачаар та бусад бүтээгчдийг дагаж, тэдний feed-д гарч ирэх боломжтой. Мөн: 1) Нийтлэл бичсэний дараа холбогдох topic chip дарж community-д хуваалц. 2) Бусдын нийтлэлд сэтгэгдэл үлдээж харилцаа тогтоо (+10 XP). 3) Streak-ийг хадгалаарай — 7 хоногийн streak нь "Featured Creator" тагт орох боломж нэмэгдүүлнэ. 4) PREMIUM багцад Portfolio файл байрлуулж профайлаа баяжуул.' },
            { q:'AI Agent-ийг хэрхэн хамгийн үр дүнтэй ашиглах вэ?', a:'AI → Generate Draft табад сэдэв оруулаад Template chip дарснаар structured draft авна (FREE: 5/сар, PREMIUM: 50/сар). Analyze табад бэлэн нийтлэлийг оруулбал SEO score, унших цаг, сайжруулах зөвлөгөө гарна. MAX багцын хэрэглэгчид "AI ном нийтлэх" функцийг ашиглаж судалгааны материалыг автоматаар e-book болгон хөрвүүлж болно.' },
            { q:'XP систем болон Skill Tree хэрхэн ажилладаг вэ?', a:'Блог бичихэд +50XP, сэтгэгдэл +10XP, like +5XP, нийтлэл унших +readTime×4 XP авна. 1000 XP → Level 2; 5000 XP → Premium Skill Tree нэвтрэх эрх. Skill Tree-д Marketing, AI, Design, SEO, Writing зэрэг 15+ чиглэлийн мэргэшлийн зам байгаа бөгөөд Quest дуусгасны дараа Badge нэмэгддэг. Badge нь CV болон профайлд харагддаг.' },
            { q:'Stripe төлбөрийн систем хэрхэн ажилладаг вэ?', a:'Premium ($3/сар) эсвэл Max ($7/сар) сонгосны дараа Stripe Checkout хуудасруу шилжинэ. Карт оруулж төлбөр хийсний дараа автоматаар Dashboard-руу чиглүүлэгдэж, тухайн багцын боломжууд нэн даруй нэмэгдэнэ. Дурын үед Settings → Subscription хэсгийг дарж цуцлах боломжтой. Цуцалсны дараа үлдсэн сарын хугацааг бүрэн ашиглах боломжтой.' },
            { q:'Ямар төрлийн нийтлэл хамгийн их уншигч татдаг вэ?', a:'Манай платформын статистик дүн шинжилгээгээр: 1) "Хэрхэн..." гарчигтай заавар нийтлэл 3.2× илүү views авдаг. 2) 5-8 минутын унших цагтай нийтлэл хамгийн өндөр like/view харьцаатай. 3) AI, Blockchain, Marketing сэдэвт нийтлэл organic reach хамгийн өндөр. 4) Зургаар баяжуулсан, жагсаалт ашигласан нийтлэл нь plain text-ээс 2× урт хугацаанд хуудаст үлдэж байгаа (time on page).' },
            { q:'Supabase болон орчны хувьсагч тохируулах заавар?', a:'supabase.com дээр project үүсгэж Settings → Database → Connection String-аас DATABASE_URL болон DIRECT_URL авна. .env.local файлд тохируулж npx prisma db push командаар schema ачаална. STRIPE_SECRET_KEY нь Stripe Dashboard → Developers → API Keys-аас, ANTHROPIC_API_KEY нь console.anthropic.com-оос авна. JWT_SECRET-д аль ч урт санамсаргүй мөр ашигла.' },
          ].map((item,i) => (
            <details key={i} style={{ marginBottom:12, background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', border:'1.5px solid rgba(11,164,160,0.08)' }}>
              <summary style={{ padding:'18px 22px', fontWeight:700, fontSize:'.95rem', color:'#1a2e3b', cursor:'pointer', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center', userSelect:'none' }}>
                {item.q} <span style={{ color:'#0ba4a0', fontSize:'1.3rem', fontWeight:400 }}>+</span>
              </summary>
              <div style={{ padding:'0 22px 18px', color:'#6b7c8d', lineHeight:1.8, fontSize:'.9rem', borderTop:'1px solid rgba(11,164,160,0.08)' }}>{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ background:'#fff', padding:'80px 48px' }}>
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'#f0fafa', border:'3px solid #0ba4a0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:'2rem', boxShadow:'0 4px 20px rgba(11,164,160,0.2)' }}>❤️</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.8rem,4vw,2.5rem)', fontWeight:900, color:'#1a2e3b', marginBottom:14 }}>
            Get paid doing what you love
          </h2>
          <p style={{ color:'#6b7c8d', fontSize:'1rem', marginBottom:32, lineHeight:1.75 }}>Мэдлэгээ хуваалцаж, нийгэмлэг байгуул, XP цуглуулаарай. Nexus дээр бүгд холбогддог.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <input type="email" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)}
              style={{ padding:'14px 22px', border:'2px solid rgba(11,164,160,0.25)', borderRadius:50, fontSize:'.92rem', outline:'none', width:260, fontFamily:'inherit', transition:'border .2s' }}
              onFocus={e=>(e.target.style.borderColor='#0ba4a0')} onBlur={e=>(e.target.style.borderColor='rgba(11,164,160,0.25)')} />
            <Link href={`/auth/register${email?`?email=${encodeURIComponent(email)}`:''}`} className="btn-coral">
              Become an Architect
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#1a2e3b', padding:'48px', color:'rgba(255,255,255,0.7)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:24, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(255,255,255,0.2)' }}>
              <Image src="/nexus-logo.jpg" alt="Nexus" width={38} height={38} style={{ objectFit:'cover', width:'100%', height:'100%' }} />
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:'1rem' }}>Nexus</div>
              <div style={{ fontSize:'.72rem', opacity:0.5 }}>Everything Connects</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            {[['/', 'Home'],['/auth/login','Login'],['/auth/register','Register'],['/home','Feed'],['/skill-tree','Skills']].map(([href,label]) => (
              <Link key={href} href={href} style={{ color:'rgba(255,255,255,0.55)', textDecoration:'none', fontSize:'.85rem', transition:'color .2s' }}
                onMouseOver={e=>(e.currentTarget.style.color='#0ba4a0')}
                onMouseOut={e=>(e.currentTarget.style.color='rgba(255,255,255,0.55)')}>
                {label}
              </Link>
            ))}
          </div>
          <div style={{ fontSize:'.78rem', opacity:0.4 }}>© 2026 Nexus. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
