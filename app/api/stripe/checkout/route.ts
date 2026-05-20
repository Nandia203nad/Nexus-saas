import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

const PRICE_IDS: Record<string, string | undefined> = {
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID,
  MAX: process.env.STRIPE_MAX_PRICE_ID,
};

export async function POST(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { plan } = await req.json();

    if (!['PREMIUM', 'MAX'].includes(plan)) {
      return NextResponse.json({ message: 'Буруу төлөвлөгөө' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const dbUser = await prisma.user.findUnique({ where: { id: u.userId }, select: { email: true } });
    if (!dbUser) return NextResponse.json({ message: 'Хэрэглэгч олдсонгүй' }, { status: 404 });

    if (!stripe) return NextResponse.json({ message: 'Stripe тохируулаагүй байна' }, { status: 500 });

    const priceId = PRICE_IDS[plan];
    if (!priceId) return NextResponse.json({ message: 'Price ID тохируулаагүй байна' }, { status: 500 });

    const session = await stripe.checkout.sessions.create({
      customer_email: dbUser.email,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/profile?tab=subscription&cancelled=1`,
      metadata: { userId: u.userId, userEmail: dbUser.email, plan },
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
