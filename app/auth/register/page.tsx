'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const OAUTH_STEPS = [
  'Google OAuth холбогдож байна...',
  'Credentials шалгаж байна...',
  'Профайл мэдээлэл татаж байна...',
  'Аккаунт үүсгэж байна...',
  'Сесс эхлүүлж байна...',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [oauthStep, setOauthStep] = useState(0);
  const [googleModal, setGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleEmailErr, setGoogleEmailErr] = useState('');

  const startGoogleOAuth = () => {
    setOauthStep(1);
    window.location.href = '/api/auth/google/start?redirect=/home';
  };

  useEffect(() => {
    if (localStorage.getItem('nexus_token')) router.replace('/home');
  }, [router]);

  useEffect(() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    setStrength(s);
  }, [form.password]);

  const proceedGoogle = async (email: string) => {
    setGoogleModal(false);
    setOauthStep(1);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanEmail.split('@')[0], email: cleanEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        router.push('/home'); return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Google бүртгэл амжилтгүй боллоо.');
    } catch {
      setError('Google бүртгэл амжилтгүй боллоо. Дахин оролдоно уу.');
    } finally {
      setOauthStep(0);
    }
  };

  const handleGoogleConfirm = () => {
    if (!googleEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(googleEmail)) {
      setGoogleEmailErr('Зөв Gmail хаяг оруулна уу'); return;
    }
    proceedGoogle(googleEmail.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      router.push('/home');
    } catch { setError('Сүлжээний алдаа гарлаа'); }
    finally { setLoading(false); }
  };

  const sColors = ['rgba(255,255,255,0.1)', '#fc8181', '#f6ad55', '#68d391', '#0ba4a0'];
  const sLabels = ['', 'Сул', 'Дунд', 'Сайн', 'Аюулгүй'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter',system-ui,sans-serif", position: 'relative' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideRight { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(.93) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .rg-input {
          width: 100%; padding: 13px 16px 13px 42px;
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.22);
          border-top: 1px solid rgba(255,255,255,0.4);
          border-radius: 12px; color: #fff; font-size: .93rem;
          outline: none; transition: all .2s; font-family: inherit;
          backdrop-filter: blur(8px);
        }
        .rg-input:focus { border-color: rgba(11,164,160,0.75); background: rgba(11,164,160,0.08); box-shadow: 0 0 0 3px rgba(11,164,160,0.15); }
        .rg-input::placeholder { color: rgba(255,255,255,0.3); }
        .btn-google-rg {
          width: 100%; padding: 13px 18px;
          background: rgba(255,255,255,0.11);
          border: 1px solid rgba(255,255,255,0.22);
          border-top: 1px solid rgba(255,255,255,0.42);
          border-radius: 12px; display: flex; align-items: center; gap: 13px;
          cursor: pointer; color: rgba(255,255,255,0.92);
          font-size: .93rem; font-weight: 600; font-family: inherit;
          transition: all .22s; backdrop-filter: blur(10px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .btn-google-rg:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.42); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        .btn-register { flex:1; padding:13px; background:linear-gradient(135deg,rgba(11,164,160,0.88),rgba(8,192,192,0.88)); border:1px solid rgba(11,164,160,0.5); border-top:1px solid rgba(11,200,200,0.7); border-radius:12px; color:#fff; font-weight:700; font-size:.95rem; cursor:pointer; transition:all .22s; font-family:inherit; backdrop-filter:blur(8px); box-shadow:0 4px 16px rgba(11,164,160,0.35),inset 0 1px 0 rgba(255,255,255,0.25); }
        .btn-register:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 28px rgba(11,164,160,0.5); }
        .btn-register:disabled { opacity:.5; cursor:not-allowed; }
        .btn-signin-rg { flex:1; padding:13px; background:rgba(124,58,237,0.72); border:1px solid rgba(159,122,234,0.45); border-top:1px solid rgba(180,150,255,0.65); border-radius:12px; color:#fff; font-weight:700; font-size:.95rem; cursor:pointer; transition:all .22s; font-family:inherit; text-decoration:none; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(8px); box-shadow:0 4px 16px rgba(124,58,237,0.3),inset 0 1px 0 rgba(255,255,255,0.2); }
        .btn-signin-rg:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(124,58,237,0.45); }
        .google-input-rg { width:100%; padding:12px 16px; border:1.5px solid rgba(66,133,244,0.4); border-radius:10px; font-size:.93rem; outline:none; transition:all .2s; font-family:inherit; color:#1a1a2e; background:#f8faff; }
        .google-input-rg:focus { border-color:#4285F4; box-shadow:0 0 0 3px rgba(66,133,244,0.14); }
        @media(max-width:860px) { .reg-left-img { display:none!important; } .reg-right-panel { max-width:100%!important; } }
      `}</style>

      {/* ── Left: logins.jpg full height ── */}
      <div className="reg-left-img" style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <Image src="/logins.jpg" alt="Nexus" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(5,8,16,0.12) 0%, rgba(5,8,16,0.35) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 52, left: 52, right: 52 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#fff', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1.18, textShadow: '0 2px 24px rgba(0,0,0,0.6)', marginBottom: 12 }}>
            Join the<br /><span style={{ color: '#c8f7f5' }}>Nexus Community</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '.96rem', lineHeight: 1.7 }}>
            Мэдлэгээ хуваалц, брэндээ өсгө,<br />AI технологи ашиглан контент бүтээ
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 20 }}>
            {[['✓','Үнэгүй эхлэх'],['✓','XP & Skill Tree'],['✓','AI Agent']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.75)', fontSize: '.84rem' }}>
                <span style={{ color: '#68d391', fontWeight: 700 }}>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Liquid Glass form ── */}
      <div className="reg-right-panel" style={{ width: '100%', maxWidth: 480, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 40px', animation: 'slideRight .45s ease' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <Image src="/logins.jpg" alt="" fill style={{ objectFit: 'cover', objectPosition: 'right center' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,5,20,0.82)' }} />
        </div>

        {/* Liquid Glass card */}
        <div style={{
          position: 'relative', zIndex: 2, width: '100%', maxWidth: 400,
          background: 'rgba(255,255,255,0.09)',
          backdropFilter: 'blur(52px) saturate(180%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(52px) saturate(180%) brightness(1.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderTop: '1.5px solid rgba(255,255,255,0.52)',
          borderLeft: '1.5px solid rgba(255,255,255,0.28)',
          borderRadius: 28,
          padding: '32px 32px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.1)',
        }}>
          {/* Top shimmer */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.65) 40%,rgba(11,164,160,0.5) 65%,transparent)', borderRadius:'28px 28px 0 0', pointerEvents:'none' }} />

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.42)', boxShadow: '0 0 18px rgba(11,164,160,0.35)', flexShrink: 0 }}>
              <Image src="/nexus-logo.jpg" alt="Nexus" width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} priority />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>Create Account</div>
              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '.72rem', marginTop: 2 }}>Үнэгүй эхлэх · Бүх функц ашиглах</div>
            </div>
          </Link>

          {error && <div style={{ background:'rgba(252,129,129,0.13)', border:'1px solid rgba(252,129,129,0.32)', borderRadius:10, padding:'10px 14px', color:'#fc8181', fontSize:'.82rem', marginBottom:14 }}>⚠ {error}</div>}

          {oauthStep > 0 ? (
            <div>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ width:36, height:36, border:'3px solid rgba(255,255,255,0.15)', borderTopColor:'#0ba4a0', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 12px' }} />
                <div style={{ color:'#c8f7f5', fontSize:'.84rem', fontWeight:600 }}>
                  {oauthStep <= 5 ? OAUTH_STEPS[oauthStep - 1] : '✓ Амжилттай бүртгүүллээ!'}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {OAUTH_STEPS.map((step, i) => {
                  const done = oauthStep > i + 1, active = oauthStep === i + 1;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 11px', background: done?'rgba(104,211,145,0.09)':active?'rgba(11,164,160,0.11)':'rgba(255,255,255,0.03)', borderRadius:9, fontSize:'.77rem', color: done?'#68d391':active?'#c8f7f5':'rgba(255,255,255,0.28)', transition:'all .3s', border:`1px solid ${done?'rgba(104,211,145,0.18)':active?'rgba(11,164,160,0.22)':'transparent'}` }}>
                      <div style={{ width:17, height:17, borderRadius:'50%', border:`1px solid ${done?'#68d391':active?'#0ba4a0':'rgba(255,255,255,0.18)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'.62rem' }}>
                        {done ? '✓' : active ? <div style={{ width:7, height:7, border:'1.5px solid #0ba4a0', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .6s linear infinite' }} /> : i+1}
                      </div>
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Google only */}
              <div style={{ marginBottom:16 }}>
                <button type="button" className="btn-google-rg" onClick={startGoogleOAuth}>
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google-р бүртгүүлэх
                </button>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.14)' }} />
                <span style={{ fontSize:'.7rem', color:'rgba(255,255,255,0.32)', whiteSpace:'nowrap' }}>эсвэл email-р бүртгүүлэх</span>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.14)' }} />
              </div>

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {/* Name */}
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)', fontSize:'.92rem', pointerEvents:'none' }}>👤</div>
                  <input className="rg-input" type="text" placeholder="Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required minLength={2} />
                </div>
                {/* Email */}
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)', fontSize:'.92rem', pointerEvents:'none' }}>✉</div>
                  <input className="rg-input" type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
                </div>
                {/* Password */}
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)', fontSize:'.85rem', pointerEvents:'none' }}>🔒</div>
                  <input className="rg-input" type={showPw?'text':'password'} placeholder="Password (8+ тэмдэгт)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={8} style={{ paddingRight:46 }} />
                  <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.38)', fontSize:'.86rem' }}>
                    {showPw?'🙈':'👁'}
                  </button>
                </div>
                {/* Strength meter */}
                {form.password && (
                  <div>
                    <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                      {[1,2,3,4].map(l=><div key={l} style={{ flex:1, height:3, borderRadius:2, background:strength>=l?sColors[strength]:'rgba(255,255,255,0.1)', transition:'background .3s' }} />)}
                    </div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'.56rem', color:sColors[strength] }}>{sLabels[strength]}</div>
                  </div>
                )}

                <div style={{ display:'flex', gap:10, marginTop:2 }}>
                  <button type="submit" disabled={loading} className="btn-register">
                    {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><div style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />Үүсгэж байна...</span> : 'Sign Up →'}
                  </button>
                  <Link href="/auth/login" style={{ flex:1, textDecoration:'none' }}>
                    <button type="button" className="btn-signin-rg" style={{ width:'100%' }}>Log In</button>
                  </Link>
                </div>
              </form>

              <p style={{ marginTop:14, fontSize:'.67rem', color:'rgba(255,255,255,0.24)', textAlign:'center', lineHeight:1.65 }}>
                Бүртгүүлснээр Nexus-ийн{' '}
                <Link href="/terms" style={{ color:'rgba(11,164,160,0.72)', textDecoration:'underline' }}>үйлчилгээний нөхцөл</Link>
                -ийг зөвшөөрч байна
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Google Email Modal ── */}
      {googleModal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)' }}
          onClick={e => { if(e.target===e.currentTarget) setGoogleModal(false); }}>
          <div style={{ background:'#fff', borderRadius:22, padding:'30px 26px', width:'100%', maxWidth:370, margin:20, boxShadow:'0 24px 64px rgba(0,0,0,0.32)', animation:'modalIn .3s ease' }}>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <svg width="42" height="42" viewBox="0 0 24 24" style={{ margin:'0 auto 10px', display:'block' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div style={{ fontWeight:800, fontSize:'1.02rem', color:'#1a1a2e' }}>Google-р бүртгүүлэх</div>
              <div style={{ fontSize:'.78rem', color:'#6b7c8d', marginTop:4 }}>Gmail хаягаа оруулна уу</div>
            </div>
            <input className="google-input-rg" type="email" placeholder="yourname@gmail.com" value={googleEmail}
              onChange={e=>{setGoogleEmail(e.target.value);setGoogleEmailErr('');}}
              onKeyDown={e=>e.key==='Enter'&&handleGoogleConfirm()} autoFocus />
            {googleEmailErr && <div style={{ color:'#fc8181', fontSize:'.74rem', marginTop:5 }}>⚠ {googleEmailErr}</div>}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={()=>setGoogleModal(false)} style={{ flex:1, padding:'11px', background:'#f1f5f9', border:'none', borderRadius:10, fontWeight:600, fontSize:'.88rem', cursor:'pointer', color:'#4a5568' }}>Цуцлах</button>
              <button onClick={handleGoogleConfirm} style={{ flex:2, padding:'11px', background:'linear-gradient(135deg,#4285F4,#3367d6)', border:'none', borderRadius:10, fontWeight:700, fontSize:'.88rem', cursor:'pointer', color:'#fff', boxShadow:'0 4px 12px rgba(66,133,244,0.4)' }}>Үргэлжлүүлэх →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
