import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getRedirectUri(req: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/api/auth/google/callback`;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ message: 'GOOGLE_CLIENT_ID is not configured' }, { status: 500 });
  }

  const redirect = req.nextUrl.searchParams.get('redirect') || '/home';
  const state = crypto.randomUUID();
  const redirectUri = getRedirectUri(req);
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('state', state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set('nexus_google_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });
  res.cookies.set('nexus_google_redirect', redirect, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });
  return res;
}
