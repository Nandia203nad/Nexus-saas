import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── In-memory rate limit store ────────────────────────────────────────────────
const rateStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; window: number }> = {
  '/api/auth/login':    { max: 5,   window: 60_000 },   // brute-force protection
  '/api/auth/register': { max: 3,   window: 60_000 },   // signup flood
  '/api/ai':            { max: 20,  window: 60_000 },   // AI abuse
  '/api/stripe':        { max: 10,  window: 60_000 },   // payment replay
  '/api/comments':      { max: 30,  window: 60_000 },   // spam
  '/api/follow':        { max: 20,  window: 60_000 },   // follow bot
  'default':            { max: 120, window: 60_000 },   // general
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

// Cleans up expired entries to prevent memory leak (runs occasionally)
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;   // every 5 min
  lastCleanup = now;
  for (const [k, v] of rateStore.entries()) {
    if (v.resetAt < now) rateStore.delete(k);
  }
}

// ── Attack pattern signatures ─────────────────────────────────────────────────
const ATTACK_PATTERNS = [
  // Path traversal
  /\.\.[/\\]/,
  /\/etc\/passwd/i,
  /\/proc\/self/i,
  // Command injection
  /;.*\b(ls|cat|wget|curl|bash|sh|cmd|powershell)\b/i,
  // SQLi
  /('\s*or\s*'1'\s*=\s*'1|union\s+all\s+select|drop\s+table|exec\s*\(|xp_cmdshell)/i,
  // XSS in URL
  /<script[\s>]/i,
  /javascript:/i,
  /data:text\/html/i,
  // Known scanner user-agents
  /(sqlmap|nikto|masscan|nmap|dirbuster|gobuster|nuclei|burpsuite|acunetix|w3af)/i,
];

const BAD_EXTENSIONS = /\.(php|asp|aspx|cgi|pl|sh|bat|exe|dll|jsp)$/i;

// ── Routes that require a JWT Bearer token ────────────────────────────────────
const PROTECTED_PREFIXES = ['/home', '/dashboard', '/ai', '/profile', '/feed', '/skill-tree', '/videos'];

// ── Middleware entry ──────────────────────────────────────────────────────────
export function middleware(req: NextRequest) {
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

  // 2. Detect attack patterns in full URL and user-agent
  const fullUrl = decodeURIComponent(req.url);
  const ua = req.headers.get('user-agent') ?? '';
  if (ATTACK_PATTERNS.some(p => p.test(fullUrl) || p.test(ua))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. Block oversized bodies on non-file routes
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

  // 5. Method validation — only known methods allowed
  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  if (!ALLOWED_METHODS.includes(req.method)) {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  // 6. Protected page redirect — no token → login
  const isProtectedPage = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (isProtectedPage) {
    const token =
      req.cookies.get('nexus_token')?.value ??
      req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 7. Add security headers to every response
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('X-Download-Options', 'noopen');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://accounts.google.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://img.youtube.com https://*.supabase.co https://avatars.githubusercontent.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://accounts.google.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|woff2?|ttf)).*)',
  ],
};
