import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get('plan') as 'PREMIUM' | 'MAX' | null;
  const userId = searchParams.get('userId');
  const origin = req.headers.get('origin') || 'http://localhost:3000';
  if (!plan || !userId || !['PREMIUM','MAX'].includes(plan)) {
    return NextResponse.redirect(new URL('/profile?tab=subscription&error=invalid', req.url));
  }
  try {
    await prisma.user.update({ where: { id: userId }, data: { plan } });
    // Redirect to dashboard after successful payment
    return NextResponse.redirect(new URL(`/dashboard?upgraded=1&plan=${plan}`, req.url));
  } catch {
    return NextResponse.redirect(new URL('/profile?tab=subscription&error=1', req.url));
  }
}
