import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter',system-ui,sans-serif", position: 'relative' }}>
      <style>{`
        @media(max-width:860px) { .reg-left-img { display:none!important; } }
      `}</style>

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
            {[['✓', 'Үнэгүй эхлэх'], ['✓', 'XP & Skill Tree'], ['✓', 'AI Agent']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.75)', fontSize: '.84rem' }}>
                <span style={{ color: '#68d391', fontWeight: 700 }}>{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 40px', background: 'rgba(8,5,20,0.92)' }}>
        <SignUp
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: {
                background: 'rgba(255,255,255,0.09)',
                backdropFilter: 'blur(52px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderTop: '1.5px solid rgba(255,255,255,0.52)',
                borderRadius: '28px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
              },
              headerTitle: { color: '#fff' },
              headerSubtitle: { color: 'rgba(255,255,255,0.5)' },
              socialButtonsBlockButton: {
                background: 'rgba(255,255,255,0.11)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#fff',
                borderRadius: '12px',
              },
              socialButtonsBlockButtonText: { color: '#fff' },
              dividerLine: { background: 'rgba(255,255,255,0.14)' },
              dividerText: { color: 'rgba(255,255,255,0.32)' },
              formFieldLabel: { color: 'rgba(255,255,255,0.72)' },
              formFieldInput: {
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#fff',
                borderRadius: '12px',
              },
              formButtonPrimary: {
                background: 'linear-gradient(135deg,rgba(11,164,160,0.88),rgba(8,192,192,0.88))',
                border: '1px solid rgba(11,164,160,0.5)',
                borderRadius: '12px',
                fontWeight: 700,
              },
              footerActionLink: { color: '#c8f7f5' },
              identityPreviewText: { color: '#fff' },
              identityPreviewEditButton: { color: '#c8f7f5' },
            },
          }}
        />
      </div>
    </div>
  );
}
