import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', fontFamily: "'Inter', system-ui, sans-serif", position: 'relative', zIndex: 1 }}>
      <style>{`
        @media (max-width: 860px) {
          .login-visual { display: none !important; }
          .login-shell { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <section className="login-visual" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <Image src="/logins.jpg" alt="Nexus login" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,8,16,0.10), rgba(5,8,16,0.38))' }} />
        <div style={{ position: 'absolute', left: 52, right: 52, bottom: 52 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 'clamp(2.6rem, 5vw, 4.8rem)', lineHeight: 1.06, margin: 0, textShadow: '0 8px 34px rgba(0,0,0,.44)' }}>
            Make Blog<br />
            <span style={{ color: '#c8f7f5' }}>Creation Easy</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.76)', maxWidth: 460, lineHeight: 1.7, marginTop: 18 }}>
            Sign in to manage your blogs, AI analysis, portfolio files, XP, and skill tree progress.
          </p>
        </div>
      </section>

      <section style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 40px', background: 'linear-gradient(180deg, rgba(7,10,18,.82), rgba(5,8,16,.88))' }}>
        <div id="clerk-captcha" />
        <SignIn
          appearance={{
            elements: {
              rootBox: { width: '100%' },
              card: {
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 0 40px rgba(11,164,160,0.22), 0 24px 64px rgba(0,0,0,.38)',
                backdropFilter: 'blur(28px)',
                borderRadius: '24px',
              },
              headerTitle: { color: '#fff' },
              headerSubtitle: { color: 'rgba(255,255,255,0.5)' },
              socialButtonsBlockButton: {
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                borderRadius: '12px',
              },
              socialButtonsBlockButtonText: { color: '#fff' },
              dividerLine: { background: 'rgba(255,255,255,0.12)' },
              dividerText: { color: 'rgba(255,255,255,0.4)' },
              formFieldLabel: { color: 'rgba(255,255,255,0.72)' },
              formFieldInput: {
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                borderRadius: '12px',
              },
              formButtonPrimary: {
                background: 'linear-gradient(135deg,#0ba4a0,#08c0c0)',
                border: '1px solid rgba(11,164,160,0.42)',
                borderRadius: '12px',
                fontWeight: 800,
              },
              footerActionLink: { color: '#c8f7f5' },
              identityPreviewText: { color: '#fff' },
              identityPreviewEditButton: { color: '#c8f7f5' },
            },
          }}
        />
      </section>
    </main>
  );
}
