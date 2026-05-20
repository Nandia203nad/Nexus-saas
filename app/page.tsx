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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem('nexus_token')) { router.replace('/home'); return; }
    setLoaded(true);
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % 5), 4000);
    return () => clearInterval(t);
  }, [router]);

  if (!loaded) return (
    <div style={{ minHeight: '100vh', background: '#0ba4a0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  );

  const FEATURES_TOP = [
    { icon: '⚡', emoji: '⚡', title: 'XP Engine', color: '#0ba4a0', desc: 'Блог бичих, унших бүрд XP цуглуул. Level ахиулж CV-д харуул.' },
    { icon: '🌳', emoji: '🌳', title: 'Skill Tree', color: '#ff6b8a', desc: 'Marketing, AI, Design — бүх мэргэшлийг нэг системд хөгжүүл.' },
    { icon: '🤖', emoji: '🤖', title: 'AI Agent', color: '#0ba4a0', desc: 'Контент бүтээх, шинжлэх, санал авах — AI туслагч.' },
  ];
  const FEATURES_BOT = [
    { icon: '👥', title: 'Follow System', color: '#ff6b8a', desc: 'Хэрэглэгчдийг дагаж, персонал feed харах.' },
    { icon: '💼', title: 'Portfolio', color: '#0ba4a0', desc: 'AI шинжилгээний үр дүнг файл болгон хадгалах.' },
    { icon: '💳', title: 'Free/$3/$7', color: '#ff6b8a', desc: 'Хэрэгцээдээ тохирсон багц сонгоод upgrade хий.' },
    { icon: '📊', title: 'Dashboard', color: '#0ba4a0', desc: 'XP, streak, skill statistics — бүгдийг нэг газарт.' },
  ];

  const TESTIMONIALS = [
    { name: 'Батболд Д', role: 'TikTok маркетер', plan: 'PREMIUM', xp: 5620, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'Nexus платформ дээр блог бичиж эхэлснээс хойш XP 5000-аас давж, Premium багцад хүрлээ. Skill tree нь миний карьерийг шинэ түвшинд гаргасан!' },
    { name: 'Сарнай О', role: 'AI контент бүтээгч', plan: 'PREMIUM', xp: 6100, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', text: 'ChatGPT болон Claude-тай холбогдсон AI Agent маань контент бүтээлтийг 5 дахин хурдасгасан. Ямар гайхалтай платформ!' },
    { name: 'Болдбаатар Х', role: 'Web3 стратегист', plan: 'MAX', xp: 7200, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', text: 'MAX багцын AI ном нийтлэх функц бол гайхалтай! Судалгаагаа автоматаар ном болгох боломжтой болсон нь маш чухал давуу тал.' },
    { name: 'Энхтуяа Б', role: 'Freelance coach', plan: 'PREMIUM', xp: 5150, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Follow систем нь зорилтот хэрэглэгчдийг олоход маш тус болдог. Персонал feed нь өдөр бүр шинэ зүйл сурах боломж өгдөг.' },
    { name: 'Мөнхбаяр Ц', role: 'SEO мэргэжилтэн', plan: 'PREMIUM', xp: 5800, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', text: 'Dashboard-ын аналитик нь блогийн гүйцэтгэлийг ойлгоход маш тустай. XP streak-ийн систем маш урам зоригтой!' },
  ];

  const ALL_TOPICS = ['Artificial Intelligence', 'ChatGPT', 'Machine Learning', 'Deep Learning', 'Large Language Models', 'Blockchain', 'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Data Science', 'Analytics', 'SQL', 'Data Visualization', 'Programming', 'JavaScript', 'Python', 'React', 'Flutter', 'DevOps', 'Docker', 'Kubernetes', 'AWS', 'Marketing', 'SEO', 'Writing', 'Book Reviews', 'Art', 'Gaming', 'Metaverse', 'CSS', 'HTML', 'Java', 'Angular', 'Frontend Engineering', 'iOS Development', 'Android', 'Databricks', 'Terraform', 'Creative Nonfiction', 'Generative Art', 'Game Design', 'Indie Game', 'Fine Art', 'Contemporary Art'];
  const filteredTopics = ALL_TOPICS.filter(t => !topicSearch || t.toLowerCase().includes(topicSearch.toLowerCase()));

  const handleCheckout = async (plan: 'PREMIUM' | 'MAX') => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.push('/auth/register'); return; }
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert('Stripe холболтод алдаа гарлаа. Дараа дахин оролдоно уу.'); }
  };

  const PLANS = [
    {
      name: 'FREE', price: '$0', period: 'forever', icon: '🆓', color: '#22c55e', textColor: '#16a34a', btnBg: '#22c55e',
      features: ['Blog унших & бичих', 'XP & Level систем', 'Basic Skill Tree', 'AI (5/сар)', 'Follow систем', 'Comments & Like'],
      cta: 'Get Started Free', action: 'free', featured: false,
    },
    {
      name: 'PREMIUM', price: '$3', period: '/month', icon: '💎', color: '#0ba4a0', textColor: '#0ba4a0', btnBg: '#0ba4a0',
      features: ['Free бүгд', 'Premium контент', 'AI (50/сар)', 'Skill Tree Advanced', 'Portfolio файл', 'Analytics', 'Book Reviews'],
      cta: 'Start Premium', action: 'PREMIUM', featured: true,
    },
    {
      name: 'MAX', price: '$7', period: '/month', icon: '🚀', color: '#9f7aea', textColor: '#7c3aed', btnBg: '#9f7aea',
      features: ['Premium бүгд', 'Бүх контент', 'AI (200/сар)', 'Skill Tree PRO', 'AI ном нийтлэл', 'Хувийн ментор', 'MAX exclusive'],
      cta: 'Go MAX', action: 'MAX', featured: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", overflowX: 'hidden', background: '#fff' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes scrollLeft{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes scrollRight{0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
        @keyframes testimonialFade{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}

        /* ─── BUTTONS ─── */
        .btn-coral{background:#ff6b8a;color:#fff;border:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:.95rem;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px;text-decoration:none;box-shadow:0 6px 20px rgba(255,107,138,.35);white-space:nowrap}
        .btn-coral:hover{background:#ff5577;transform:translateY(-2px);box-shadow:0 10px 28px rgba(255,107,138,.45)}
        .btn-white{background:#fff;color:#0ba4a0;border:2px solid rgba(255,255,255,.6);padding:14px 28px;border-radius:50px;font-weight:700;font-size:.95rem;cursor:pointer;transition:all .25s;display:inline-flex;align-items:center;gap:8px;text-decoration:none;white-space:nowrap}
        .btn-white:hover{background:rgba(255,255,255,.9);transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,255,255,.2)}

        /* ─── NAV ─── */
        .landing-nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:18px 48px;max-width:1280px;margin:0 auto}
        .nav-links{display:flex;gap:28px;align-items:center}
        .nav-link{color:rgba(255,255,255,.85);font-weight:500;font-size:.88rem;text-decoration:none;padding:4px 0;border-bottom:2px solid transparent;transition:all .2s}
        .nav-link:hover,.nav-link.active{color:#fff;border-bottom-color:#fff}
        .nav-ctas{display:flex;gap:10px;align-items:center}
        .mobile-menu-btn{display:none;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;width:40px;height:40px;border-radius:10px;font-size:1.2rem;cursor:pointer;align-items:center;justify-content:center;backdrop-filter:blur(10px)}
        .mobile-menu{display:none;position:absolute;top:100%;left:16px;right:16px;background:rgba(8,24,44,.96);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px;flex-direction:column;gap:4px;z-index:20;box-shadow:0 20px 60px rgba(0,0,0,.4)}
        .mobile-menu a{color:rgba(255,255,255,.85);text-decoration:none;font-weight:600;font-size:.9rem;padding:12px 16px;border-radius:10px;display:block;transition:all .18s}
        .mobile-menu a:hover{background:rgba(255,255,255,.08);color:#fff}
        .mobile-menu.open{display:flex}

        /* ─── HERO ─── */
        .hero-section{position:relative;overflow:hidden;min-height:100vh;display:flex;flex-direction:column}
        .hero-content-wrap{position:relative;z-index:5;flex:1;display:flex;align-items:center;padding:0 48px 80px;max-width:1280px;margin:0 auto;width:100%}
        .hero-title{font-family:'Playfair Display',serif;font-weight:900;font-size:clamp(2.6rem,5.5vw,5.2rem);color:#fff;line-height:1.06;margin-bottom:22px;letter-spacing:-.02em;text-shadow:0 4px 24px rgba(0,0,0,.4)}
        .hero-subtitle{color:rgba(255,255,255,.9);font-size:1rem;line-height:1.8;margin-bottom:32px;max-width:460px;text-shadow:0 2px 8px rgba(0,0,0,.3)}
        .hero-tags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
        .hero-tag{background:rgba(255,255,255,.15);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.28);border-radius:50px;padding:5px 14px;font-size:.82rem;color:#fff;font-weight:500}
        .hero-badges-wrap{position:absolute;top:50%;right:5%;z-index:6;display:flex;flex-direction:column;gap:18px;transform:translateY(-50%)}
        .hero-badge{border-radius:14px;padding:10px 18px;display:flex;align-items:center;gap:8px}
        .hero-stats{display:flex;gap:32px;align-items:center;flex-wrap:wrap}
        .hero-stat-val{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:#fff;line-height:1;text-shadow:0 2px 12px rgba(0,0,0,.4)}
        .hero-stat-lbl{color:rgba(255,255,255,.65);font-size:.78rem;margin-top:3px}

        /* ─── CIRCLE CARDS ─── */
        .circle-card{background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:28px;box-shadow:0 4px 28px rgba(0,0,0,.07);transition:all .3s;cursor:pointer;border:3px solid transparent;flex-shrink:0}
        .circle-card:hover{transform:translateY(-8px) scale(1.04);border-color:#0ba4a0;box-shadow:0 16px 44px rgba(11,164,160,.2)}

        /* ─── PLAN CARDS ─── */
        .plans-row{display:flex;gap:24px;justify-content:center;align-items:stretch;flex-wrap:wrap}
        .plan-card{background:#fff;border-radius:24px;padding:36px 26px 32px;box-shadow:0 4px 28px rgba(0,0,0,.07);transition:all .3s;border:2.5px solid transparent;position:relative;overflow:visible;flex:1;min-width:280px;max-width:340px;display:flex;flex-direction:column}
        .plan-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(11,164,160,.14)}
        .plan-card.featured{border-color:#0ba4a0;box-shadow:0 8px 40px rgba(11,164,160,.18)}
        .plan-btn{width:100%;padding:15px;border:none;border-radius:50px;font-weight:800;font-size:.92rem;cursor:pointer;transition:all .28s;margin-top:auto;letter-spacing:.01em}
        .plan-btn:hover{transform:translateY(-2px);filter:brightness(1.1);box-shadow:0 8px 24px rgba(0,0,0,.18)}
        .plan-btn:active{transform:translateY(0)}

        /* ─── TOPIC CHIP ─── */
        .topic-chip{display:inline-flex;align-items:center;padding:6px 14px;border-radius:24px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .3s;margin:4px;border:1.5px solid;white-space:nowrap}

        /* ─── FAQ ─── */
        details summary::-webkit-details-marker{display:none}

        /* ══════════════════════════════════════
           RESPONSIVE — 900px
        ══════════════════════════════════════ */
        @media(max-width:900px){
          .landing-nav{padding:14px 20px}
          .nav-links{display:none}
          .nav-ctas .btn-white{display:none}
          .mobile-menu-btn{display:flex}
          .hero-content-wrap{padding:0 24px 60px}
          .hero-badges-wrap{display:none}
          .hero-stats{gap:20px}
          .plan-card{min-width:260px}
        }

        /* ══════════════════════════════════════
           RESPONSIVE — 640px
        ══════════════════════════════════════ */
        @media(max-width:640px){
          .hero-section{min-height:100svh}
          .hero-content-wrap{padding:0 18px 50px;align-items:flex-end;padding-bottom:70px}
          .hero-title{font-size:2.4rem;margin-bottom:16px}
          .hero-subtitle{font-size:.92rem}
          .hero-tags{display:none}
          .hero-stats{gap:18px}
          .hero-stat-val{font-size:1.6rem}
          .plans-row{flex-direction:column;align-items:center;gap:18px}
          .plan-card{min-width:0;width:100%;max-width:100%;transform:none!important}
          .plan-card.featured{transform:none!important}
          section{padding-left:18px!important;padding-right:18px!important}
          .landing-nav{padding:12px 16px}
          .features-head{padding:0 18px!important}
          .testimonials-section{padding:60px 18px!important}
          .topics-section{padding:60px 18px!important}
          .cta-section{padding:60px 18px!important}
          footer{padding:36px 18px!important}
          .footer-inner{flex-direction:column;gap:18px;text-align:center}
          .footer-links{justify-content:center;flex-wrap:wrap}
          .orbit-container{height:480px!important}
        }

        /* ══════════════════════════════════════
           RESPONSIVE — 400px
        ══════════════════════════════════════ */
        @media(max-width:400px){
          .hero-title{font-size:2rem}
          .btn-coral,.btn-white{padding:12px 22px;font-size:.88rem}
          .hero-btns{flex-direction:column;gap:10px}
          .hero-btns a{width:100%;justify-content:center}
        }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="hero-section" id="hero">

        {/* Background image — full bleed, sharp */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Image
            src="/hero-bg.jpg"
            alt="Nexus hero background"
            fill
            sizes="100vw"
            quality={100}
            priority
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
          {/* Dark overlay — left readable, right keeps image */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(4,12,28,.94) 0%, rgba(6,18,38,.85) 35%, rgba(8,22,44,.52) 58%, rgba(0,0,0,.12) 100%)' }} />
          {/* Subtle bottom fade for content below */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(to top, rgba(4,12,28,.65) 0%, transparent 100%)' }} />
        </div>

        {/* Nav */}
        <nav style={{ position: 'relative', zIndex: 20 }}>
          <div className="landing-nav">
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,.38)', boxShadow: '0 0 14px rgba(255,255,255,.18)', flexShrink: 0 }}>
                <Image src="/nexus-logo.jpg" alt="Nexus" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} priority />
              </div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.18rem', letterSpacing: '.03em' }}>Nexus</span>
            </Link>

            {/* Desktop nav links */}
            <div className="nav-links">
              {[['#hero', 'HOME'], ['#features', 'FEATURES'], ['#plans', 'PLANS'], ['#faq', 'FAQ']].map(([href, label]) => (
                <a key={label} href={href} className={`nav-link${label === 'HOME' ? ' active' : ''}`}>{label}</a>
              ))}
            </div>

            {/* CTA + mobile hamburger */}
            <div className="nav-ctas" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link href="/auth/login" style={{ color: 'rgba(255,255,255,.88)', fontWeight: 600, fontSize: '.88rem', textDecoration: 'none', padding: '8px 14px', whiteSpace: 'nowrap' }}>SIGN IN</Link>
              <Link href="/auth/register" className="btn-white" style={{ padding: '9px 22px', fontSize: '.88rem' }}>SIGN UP</Link>
              <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <div className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`} style={{ position: 'absolute', top: '100%', left: 16, right: 16 }}>
            {[['#features', 'Features'], ['#plans', 'Plans'], ['#faq', 'FAQ'], ['/auth/login', 'Sign In'], ['/auth/register', 'Sign Up →']].map(([href, label]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)}>{label}</a>
            ))}
          </div>
        </nav>

        {/* Hero content */}
        <div className="hero-content-wrap">
          <div style={{ maxWidth: 580 }}>
            <div className="hero-tags">
              {['Content', 'XP Engine', 'Skill Tree', 'AI Agent'].map(t => (
                <span key={t} className="hero-tag">{t}</span>
              ))}
            </div>
            <h1 className="hero-title">
              Make Blog<br />
              <span style={{ color: '#7ef4f0' }}>Creation Easy</span>
            </h1>
            <p className="hero-subtitle">
              Мэдлэгээ хуваалц, брэндээ өсгө, XP цуглуулж skill tree нээ. AI Agent болон Follow систем нэгэн дор — Nexus дэлхий бүхэнтэй холбогддог.
            </p>
            <div className="hero-btns" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
              <Link href="/auth/register" className="btn-coral">FREE SIGN UP →</Link>
              <Link href="/auth/login" className="btn-white">Sign In</Link>
            </div>
            <div className="hero-stats">
              {[['9+', 'Architects'], ['10', 'Articles'], ['5K+', 'XP Earned']].map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="hero-stat-val">{val}</div>
                  <div className="hero-stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating badges — hidden on mobile via CSS */}
        <div className="hero-badges-wrap">
          <div className="hero-badge" style={{ background: '#ff6b8a', boxShadow: '0 8px 28px rgba(255,107,138,.5)', animation: 'bob 3s ease-in-out infinite' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span style={{ fontWeight: 800, fontSize: '.9rem', color: '#fff' }}>+50 XP</span>
          </div>
          <div className="hero-badge" style={{ background: 'rgba(255,255,255,.96)', boxShadow: '0 8px 28px rgba(0,0,0,.22)', animation: 'bob 3.5s ease-in-out .8s infinite' }}>
            <span style={{ fontSize: '1.1rem' }}>🌳</span>
            <span style={{ fontWeight: 800, fontSize: '.9rem', color: '#0ba4a0' }}>Skill Tree</span>
          </div>
          <div className="hero-badge" style={{ background: 'rgba(11,164,160,.9)', boxShadow: '0 8px 28px rgba(11,164,160,.4)', animation: 'bob 4s ease-in-out 1.4s infinite' }}>
            <span style={{ fontSize: '1.1rem' }}>🤖</span>
            <span style={{ fontWeight: 800, fontSize: '.9rem', color: '#fff' }}>AI Agent</span>
          </div>
        </div>

        {/* Wave to features */}
        <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, lineHeight: 0, zIndex: 8 }}>
          <svg viewBox="0 0 1440 80" style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
            <path d="M0,55 C320,5 820,80 1440,28 L1440,80 L0,80 Z" fill="#f0f4f8" />
          </svg>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ background: '#f0f4f8', padding: '90px 0 60px', overflow: 'hidden' }}>
        <div className="features-head" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ba4a0' }} />
            <span style={{ color: '#0ba4a0', fontWeight: 700, fontSize: '.88rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>Platform Features</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ba4a0' }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: '#1a2e3b', textAlign: 'center', lineHeight: 1.2, marginBottom: 0 }}>
            Everything You Need<br />to <span style={{ color: '#0ba4a0' }}>Create & Grow</span>
          </h2>
        </div>

        <div style={{ overflow: 'hidden', marginBottom: 32 }}>
          <div ref={scrollRef1} style={{ display: 'flex', gap: 32, width: 'max-content', animation: 'scrollLeft 30s linear infinite' }}>
            {[...FEATURES_TOP, ...FEATURES_TOP, ...FEATURES_TOP].map((f, i) => (
              <div key={i} className="circle-card" style={{ width: 196, height: 196 }} onClick={() => router.push('/home')}>
                <div style={{ fontSize: '2.2rem', marginBottom: 9 }}>{f.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: '.88rem', color: f.color, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: '.7rem', color: '#6b7c8d', lineHeight: 1.55, maxWidth: 126, textAlign: 'center' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflow: 'hidden' }}>
          <div ref={scrollRef2} style={{ display: 'flex', gap: 32, width: 'max-content', animation: 'scrollRight 35s linear infinite' }}>
            {[...FEATURES_BOT, ...FEATURES_BOT, ...FEATURES_BOT].map((f, i) => (
              <div key={i} className="circle-card" style={{ width: 180, height: 180 }}>
                <div style={{ fontSize: '1.9rem', marginBottom: 7 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '.82rem', color: f.color, marginBottom: 5 }}>{f.title}</div>
                <div style={{ fontSize: '.68rem', color: '#6b7c8d', lineHeight: 1.5, textAlign: 'center', maxWidth: 118 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="testimonials-section" style={{ background: '#fff', padding: '90px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b8a' }} />
            <span style={{ color: '#ff6b8a', fontWeight: 700, fontSize: '.88rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>Community</span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b8a' }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: '#1a2e3b', textAlign: 'center', lineHeight: 1.2, marginBottom: 48 }}>
            WHAT OUR <span style={{ color: '#0ba4a0' }}>ARCHITECTS</span> SAY
          </h2>
          <div className="orbit-container" style={{ position: 'relative', height: 580 }}>
            <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', width: 520, height: 520, borderRadius: '50%', border: '1px dashed rgba(11,164,160,.22)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', width: 380, height: 380, borderRadius: '50%', border: '1px solid rgba(11,164,160,.07)', pointerEvents: 'none' }} />
            {TESTIMONIALS.map((t, i) => {
              const isActive = activeTestimonial === i;
              return (
                <div key={t.name} onClick={() => setActiveTestimonial(i)}
                  style={{ position: 'absolute', left: '50%', top: '42%', marginLeft: -35, marginTop: -35, animation: 'orbit 26s linear infinite', animationDelay: `${-(i / 5) * 26}s`, zIndex: isActive ? 8 : 3, cursor: 'pointer' }}>
                  <div style={{ width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', border: isActive ? '3px solid #0ba4a0' : '2.5px solid rgba(11,164,160,.3)', boxShadow: isActive ? '0 0 0 6px rgba(11,164,160,.18),0 8px 28px rgba(0,0,0,.18)' : '0 2px 10px rgba(0,0,0,.12)', transition: 'all .35s', transform: isActive ? 'scale(1.25)' : 'scale(1)', background: '#e0f7f7' }}>
                    <img src={t.avatar} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.background = '#0ba4a0'; }} />
                  </div>
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '.62rem', fontWeight: 700, color: '#0ba4a0', background: 'rgba(255,255,255,.95)', padding: '2px 8px', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.1)', pointerEvents: 'none' }}>
                      {t.name.split(' ')[0]}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', width: 280, zIndex: 10, textAlign: 'center', animation: 'testimonialFade .5s ease' }} key={activeTestimonial}>
              <div style={{ fontSize: '3rem', color: 'rgba(11,164,160,.55)', fontFamily: "'Playfair Display',serif", lineHeight: 1, marginBottom: 4 }}>"</div>
              <p style={{ fontSize: '.88rem', color: '#2d4a5a', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 10, fontWeight: 500 }}>{TESTIMONIALS[activeTestimonial].text}</p>
              <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#1a2e3b', marginBottom: 2 }}>{TESTIMONIALS[activeTestimonial].name}</div>
              <div style={{ fontSize: '.74rem', color: '#0ba4a0', fontWeight: 600 }}>{TESTIMONIALS[activeTestimonial].role}</div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {TESTIMONIALS.map((_, i) => (
                <div key={i} onClick={() => setActiveTestimonial(i)} style={{ width: i === activeTestimonial ? 28 : 8, height: 8, borderRadius: 4, background: i === activeTestimonial ? '#0ba4a0' : 'rgba(11,164,160,.22)', transition: 'all .3s', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TOPICS ─── */}
      <section className="topics-section" style={{ background: '#f0f4f8', padding: '80px 48px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: '#1a2e3b', textAlign: 'center', marginBottom: 10 }}>Explore Topics</h2>
          <p style={{ textAlign: 'center', color: '#6b7c8d', marginBottom: 26, fontSize: '.95rem' }}>Мянган нийтлэл, онолын болон практик мэдлэг</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <input type="text" placeholder="Search topics..." value={topicSearch} onChange={e => setTopicSearch(e.target.value)}
              style={{ padding: '11px 22px', border: '2px solid rgba(11,164,160,.25)', borderRadius: 50, fontSize: '.9rem', outline: 'none', width: 'min(280px, 100%)', fontFamily: 'inherit', color: '#1a2e3b', transition: 'border .2s', background: '#fff' }}
              onFocus={e => (e.target.style.borderColor = '#0ba4a0')}
              onBlur={e => (e.target.style.borderColor = 'rgba(11,164,160,.25)')} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {filteredTopics.map((t, i) => {
              const hues = ['#0ba4a0', '#ff6b8a', '#9f7aea', '#f6ad55', '#68d391', '#63b3ed', '#fc8181'];
              const color = hues[i % hues.length];
              return (
                <Link key={t} href={`/blogs?tag=${t.toLowerCase().replace(/\s+/g, '-')}`}
                  className="topic-chip"
                  style={{ color, borderColor: `${color}40`, background: `${color}0d` }}
                  onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = color; el.style.color = '#fff'; el.style.transform = 'scale(1.08) translateY(-2px)'; }}
                  onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${color}0d`; el.style.color = color; el.style.transform = ''; }}>
                  {t}
                </Link>
              );
            })}
          </div>
          {filteredTopics.length === 0 && <p style={{ textAlign: 'center', color: '#6b7c8d', marginTop: 20 }}>No topics found for "{topicSearch}"</p>}
        </div>
      </section>

      {/* ─── PLANS ─── */}
      <section id="plans" style={{ padding: '90px 48px', background: 'linear-gradient(160deg,#0ba4a0 0%,#08d0cc 50%,#0ba4a0 100%)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 8 }}>Simple, Transparent</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.85)', marginBottom: 52, fontSize: '1rem' }}>Хэрэгцээдээ тохирсон багц сонго</p>

          <div className="plans-row">
            {PLANS.map(p => (
              <div key={p.name} className={`plan-card${p.featured ? ' featured' : ''}`}
                style={p.featured ? { transform: 'scale(1.04)', zIndex: 2, borderColor: '#0ba4a0', boxShadow: '0 12px 50px rgba(11,164,160,.25)' } : {}}>

                {p.featured && (
                  <div style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', background: '#ff6b8a', color: '#fff', padding: '5px 20px', borderRadius: 20, fontWeight: 800, fontSize: '.74rem', boxShadow: '0 4px 14px rgba(255,107,138,.4)', whiteSpace: 'nowrap' }}>
                    ★ MOST POPULAR
                  </div>
                )}

                {/* Icon + Name + Price */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>{p.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: '.92rem', color: p.textColor, marginBottom: 8, letterSpacing: '.08em' }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '2.8rem', fontWeight: 900, color: '#1a2e3b', lineHeight: 1 }}>{p.price}</span>
                    <span style={{ color: '#6b7c8d', fontSize: '.88rem' }}>{p.period}</span>
                  </div>
                </div>

                <div style={{ height: 1, background: 'rgba(0,0,0,.07)', marginBottom: 18 }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24, flex: 1 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: '.87rem', color: '#4a5568', marginBottom: 9 }}>
                      <span style={{ color: p.textColor, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button — always solid, always visible */}
                <button
                  className="plan-btn"
                  onClick={() => {
                    if (p.action === 'free') router.push('/auth/register');
                    else handleCheckout(p.action as 'PREMIUM' | 'MAX');
                  }}
                  style={{
                    background: p.btnBg,
                    color: '#fff',
                    boxShadow: `0 6px 20px ${p.btnBg}44`,
                  }}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.72)', fontSize: '.82rem', marginTop: 30 }}>
            🔒 Stripe-р аюулгүй төлбөр · Дурын үед цуцлах боломжтой · PCI DSS нийцтэй
          </p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ background: '#f0f4f8', padding: '80px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: '#1a2e3b', textAlign: 'center', marginBottom: 44 }}>
            Frequently Asked <span style={{ color: '#0ba4a0' }}>Questions</span>
          </h2>
          {[
            { q: 'Nexus платформ юу вэ?', a: 'Nexus бол контент бүтээгчдэд зориулсан SaaS платформ. Блог бичих, XP цуглуулах, skill tree нээх, AI agent ашиглах бүгдийг нэгэн дор хийж болно.' },
            { q: 'Блог бичиж эхлэхийн тулд юу хийх вэ?', a: 'Бүртгүүлсний дараа Home → "New Blog" товч дарж эхлэх боломжтой. Эхний нийтлэлийн дараа +50 XP автоматаар нэмэгдэнэ.' },
            { q: 'XP систем болон Skill Tree хэрхэн ажилладаг вэ?', a: 'Блог бичихэд +50XP, сэтгэгдэл +10XP, like +5XP. 1000 XP → Level 2; 5000 XP → Premium Skill Tree нэвтрэх эрх.' },
            { q: 'Stripe төлбөрийн систем хэрхэн ажилладаг вэ?', a: 'Premium ($3/сар) эсвэл Max ($7/сар) сонгосны дараа Stripe Checkout хуудасруу шилжинэ. Төлбөр хийсний дараа тухайн багцын боломжууд нэн даруй нэмэгдэнэ.' },
            { q: 'AI Agent-ийг хэрхэн хамгийн үр дүнтэй ашиглах вэ?', a: 'AI → Generate Draft табад сэдэв оруулаад draft авна (FREE: 5/сар, PREMIUM: 50/сар). Analyze табад нийтлэлийг оруулбал SEO score, зөвлөгөө гарна.' },
            { q: 'Байнгын уншигч олох хамгийн үр дүнтэй арга юу вэ?', a: 'Follow системийн ачаар та бусдыг дагаж, тэдний feed-д гарч ирнэ. Streak хадгалаарай — 7 хоногийн streak нь "Featured Creator" тагт орох боломж нэмэгдүүлнэ.' },
          ].map((item, i) => (
            <details key={i} style={{ marginBottom: 10, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', border: '1.5px solid rgba(11,164,160,.08)' }}>
              <summary style={{ padding: '17px 20px', fontWeight: 700, fontSize: '.94rem', color: '#1a2e3b', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                {item.q} <span style={{ color: '#0ba4a0', fontSize: '1.2rem', fontWeight: 400, flexShrink: 0, marginLeft: 12 }}>+</span>
              </summary>
              <div style={{ padding: '0 20px 16px', color: '#6b7c8d', lineHeight: 1.8, fontSize: '.9rem', borderTop: '1px solid rgba(11,164,160,.08)' }}>{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section" style={{ background: '#fff', padding: '80px 48px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#f0fafa', border: '3px solid #0ba4a0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', fontSize: '1.9rem', boxShadow: '0 4px 20px rgba(11,164,160,.2)' }}>❤️</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 900, color: '#1a2e3b', marginBottom: 12 }}>
            Get paid doing what you love
          </h2>
          <p style={{ color: '#6b7c8d', fontSize: '1rem', marginBottom: 30, lineHeight: 1.75 }}>Мэдлэгээ хуваалцаж, нийгэмлэг байгуул, XP цуглуулаарай. Nexus дээр бүгд холбогддог.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ padding: '13px 22px', border: '2px solid rgba(11,164,160,.25)', borderRadius: 50, fontSize: '.92rem', outline: 'none', width: 'min(260px, 100%)', fontFamily: 'inherit', transition: 'border .2s', color: '#1a2e3b' }}
              onFocus={e => (e.target.style.borderColor = '#0ba4a0')}
              onBlur={e => (e.target.style.borderColor = 'rgba(11,164,160,.25)')} />
            <Link href={`/auth/register${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="btn-coral">
              Become an Architect
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#1a2e3b', padding: '44px 48px' }}>
        <div className="footer-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,.2)', flexShrink: 0 }}>
              <Image src="/nexus-logo.jpg" alt="Nexus" width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>Nexus</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)' }}>Everything Connects</div>
            </div>
          </div>
          <div className="footer-links" style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[['/', 'Home'], ['/auth/login', 'Login'], ['/auth/register', 'Register'], ['/home', 'Feed'], ['/skill-tree', 'Skills']].map(([href, label]) => (
              <Link key={href} href={href} style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: '.84rem', transition: 'color .2s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#0ba4a0')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,.5)')}>
                {label}
              </Link>
            ))}
          </div>
          <div style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.35)' }}>© 2026 Nexus. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
