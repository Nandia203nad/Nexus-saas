import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || req.nextUrl.origin}/api/auth/google/callback`;

  return NextResponse.json({
    configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    redirectUri,
    message: 'Add this exact redirectUri to Google Cloud Console > OAuth client > Authorized redirect URIs.',
  });
}
