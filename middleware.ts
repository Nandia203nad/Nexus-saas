import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── In-memory rate limit store ────────────────────────────────────────────────
const rateStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; window: number }> = {
  '/api/auth/login':    { max: 5,   window: 60_000 },
  '/api/auth/register': { max: 3,   window: 60_000 },
  '/api/ai':            { max: 20,  window: 60_000 },
  '/api/stripe':        { max: 10,  window: 60_000 },
  '/api/comments':      { max: 30,  window: 60_000 },
  '/api/follow':        { max: 20,  window: 60_000 },
  'default':            { max: 120, window: 60_000 },
};

function getLimit(pathname: string) {
  for (const [path, lim] of Object.entries(RATE_LIMITS)) {
    if (path !== 'default' && pathname.startsWith(path)) return lim;
  }
  return RATE_LIMITS['default'];
}

function allowed(ip: string, pathname: string): boolean {
  const key = `${ip}::${pathname}`;
  const lim = getLimit(pathname);
  const now = Date.now();
  const rec = rateStore.get(key);
  if (!rec || rec.resetAt < now) {
    rateStore.set(key, { count: 1, resetAt: now + lim.window });
    return true;
  }
  if (rec.count >= lim.max) return false;
  rec.count++;
  return true;
}

let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [k, v] of rateStore.entries()) {
    if (v.resetAt < now) rateStore.delete(k);
  }
}

// ── Attack pattern signatures ─────────────────────────────────────────────────
const ATTACK_PATTERNS = [
  /\.\.[/\\]/,
  /\/etc\/passwd/i,
  /\/proc\/self/i,
  /;.*\b(ls|cat|wget|curl|bash|sh|cmd|powershell)\b/i,
  /('\s*or\s*'1'\s*=\s*'1|union\s+all\s+select|drop\s+table|exec\s*\(|xp_cmdshell)/i,
  /<script[\s>]/i,
  /javascript:/i,
  /data:text\/html/i,
  /(sqlmap|nikto|masscan|nmap|dirbuster|gobuster|nuclei|burpsuite|acunetix|w3af)/i,
];

const BAD_EXTENSIONS = /\.(php|asp|aspx|cgi|pl|sh|bat|exe|dll|jsp)$/i;

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function addSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('X-Download-Options', 'noopen');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://accounts.google.com https://cdnjs.cloudflare.com https://*.clerk.accounts.dev https://clerk.nexus-saas-gold.vercel.app",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://img.youtube.com https://*.supabase.co https://avatars.githubusercontent.com https://img.clerk.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://accounts.google.com https://*.clerk.com https://*.clerk.accounts.dev",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://*.clerk.accounts.dev",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );
}

// ── Protected routes (require Clerk session) ──────────────────────────────────
const isProtected = createRouteMatcher([
  '/home(.*)',
  '/dashboard(.*)',
  '/ai(.*)',
  '/profile(.*)',
  '/feed(.*)',
  '/skill-tree(.*)',
  '/videos(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  maybeCleanup();

  // 1. Block suspicious file extension probes
  if (BAD_EXTENSIONS.test(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Detect attack patterns
  const fullUrl = decodeURIComponent(req.url);
  const ua = req.headers.get('user-agent') ?? '';
  if (ATTACK_PATTERNS.some(p => p.test(fullUrl) || p.test(ua))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. Block oversized bodies
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (req.method !== 'GET' && contentLength > 5_000_000 && !pathname.startsWith('/api/portfolio')) {
    return NextResponse.json({ message: 'Request too large' }, { status: 413 });
  }

  // 4. Rate limiting on API routes
  if (pathname.startsWith('/api/')) {
    if (!allowed(ip, pathname)) {
      return NextResponse.json(
        { message: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Limit': '5' } }
      );
    }
  }

  // 5. Method validation
  if (!ALLOWED_METHODS.includes(req.method)) {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  // 6. Clerk auth protection for protected routes
  if (isProtected(req)) {
    await auth.protect();
  }

  // 7. Add security headers
  const res = NextResponse.next();
  addSecurityHeaders(res);
  return res;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|woff2?|ttf)).*)',
  ],
};
