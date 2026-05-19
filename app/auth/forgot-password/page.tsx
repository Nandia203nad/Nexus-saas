'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true); setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'radial-gradient(ellipse at 20% 50%, #1a0533 0%, #0d0321 40%, #080215 100%)',position:'relative',overflow:'hidden'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
      <div style={{position:'absolute',top:'-10%',right:'-5%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(138,109,239,0.25) 0%,transparent 70%)',pointerEvents:'none'}} />
      <div style={{width:'100%',maxWidth:440,position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <Link href="/" style={{textDecoration:'none',display:'inline-block'}}>
            <div style={{width:64,height:64,borderRadius:'50%',overflow:'hidden',border:'3px solid rgba(138,109,239,0.5)',boxShadow:'0 0 24px rgba(138,109,239,0.35)',margin:'0 auto 12px'}}>
              <Image src="/nexus-logo.jpg" alt="Nexus" width={64} height={64} style={{objectFit:'cover',width:'100%',height:'100%'}} />
            </div>
            <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'1.3rem',color:'#fff',letterSpacing:'.2em',textShadow:'0 0 16px rgba(138,109,239,0.6)'}}>NEXUS</div>
          </Link>
        </div>
        <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(24px)',borderRadius:24,padding:'28px 30px'}}>
          {sent ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:'3rem',marginBottom:16}}>📧</div>
              <h2 style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.9rem',color:'#68d391',marginBottom:10,letterSpacing:'.05em'}}>Имэйл илгээгдлээ!</h2>
              <p style={{color:'rgba(255,255,255,0.6)',fontSize:'.85rem',lineHeight:1.65,marginBottom:20}}>{email} хаягт нууц үг сэргээх холбоос илгээгдлээ. Имэйлээ шалгана уу.</p>
              <Link href="/auth/login" style={{color:'#8a6def',fontFamily:'JetBrains Mono,monospace',fontSize:'.75rem',textDecoration:'none',letterSpacing:'.06em'}}>← Нэвтрэх хуудасруу буцах</Link>
            </div>
          ) : (
            <>
              <div style={{textAlign:'center',marginBottom:22}}>
                <div style={{fontSize:'2rem',marginBottom:10}}>🔐</div>
                <h2 style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.88rem',color:'#fff',letterSpacing:'.08em',marginBottom:6}}>Нууц үг сэргээх</h2>
                <p style={{color:'rgba(255,255,255,0.5)',fontSize:'.8rem',lineHeight:1.65}}>Бүртгэлтэй имэйл хаягаа оруулна уу. Сэргээх холбоос илгээнэ.</p>
              </div>
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.55rem',color:'rgba(255,255,255,0.4)',letterSpacing:'.14em',marginBottom:7,textTransform:'uppercase'}}>Email Address</div>
                  <input type="email" placeholder="architect@nexus.mn" value={email} onChange={e=>setEmail(e.target.value)} required
                    style={{width:'100%',padding:'13px 16px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'#fff',fontSize:'.92rem',outline:'none',fontFamily:'inherit'}} />
                </div>
                <button type="submit" disabled={loading} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#8a6def,#5e43c3)',border:'none',borderRadius:12,color:'#fff',fontWeight:700,fontSize:'.9rem',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  {loading?<><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}} />Илгээж байна...</>:'Сэргээх холбоос илгээх →'}
                </button>
              </form>
              <div style={{textAlign:'center',marginTop:18}}>
                <Link href="/auth/login" style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'rgba(255,255,255,0.4)',textDecoration:'none',letterSpacing:'.06em'}}>← Нэвтрэх хуудасруу буцах</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
