import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { handleError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  email?: string;
  name?: string;
  picture?: string;
};

function getRedirectUri(req: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/api/auth/google/callback`;
}

function failureRedirect(req: NextRequest, message: string) {
  const url = new URL('/auth/login', req.nextUrl.origin);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const savedState = req.cookies.get('nexus_google_state')?.value;
  const redirect = req.cookies.get('nexus_google_redirect')?.value || '/home';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !state || !savedState || state !== savedState) {
    return failureRedirect(req, 'Google sign in was cancelled or expired.');
  }
  if (!clientId || !clientSecret) {
    return failureRedirect(req, 'Google OAuth is not configured.');
  }

  try {
    const redirectUri = getRedirectUri(req);
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json() as GoogleTokenResponse;

    if (!tokenRes.ok || !tokenData.access_token) {
      return failureRedirect(req, tokenData.error_description || tokenData.error || 'Google token exchange failed.');
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json() as GoogleProfile;

    if (!profileRes.ok || !profile.email) {
      return failureRedirect(req, 'Google profile email could not be read.');
    }

    const result = await authService.googleAuth({
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatar: profile.picture,
    });

    const url = new URL('/auth/oauth-success', req.nextUrl.origin);
    url.searchParams.set('redirect', redirect);

    const res = NextResponse.redirect(url);
    res.cookies.set('nexus_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800,
      path: '/',
    });
    res.cookies.delete('nexus_google_state');
    res.cookies.delete('nexus_google_redirect');
    return res;
  } catch (error) {
    const e = handleError(error);
    return failureRedirect(req, e.message || 'Google sign in failed.');
  }
}
