import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId || !stripe) {
    return NextResponse.redirect(new URL('/profile?tab=subscription&error=invalid', req.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.redirect(new URL('/profile?tab=subscription&error=unpaid', req.url));
    }

    const email = session.metadata?.userEmail || session.customer_email;
    const plan = session.metadata?.plan as 'PREMIUM' | 'MAX' | undefined;

    if (!email || !plan || !['PREMIUM', 'MAX'].includes(plan)) {
      return NextResponse.redirect(new URL('/profile?tab=subscription&error=invalid', req.url));
    }

    await prisma.user.update({
      where: { email },
      data: {
        plan,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
    });

    return NextResponse.redirect(new URL(`/dashboard?upgraded=1&plan=${plan}`, req.url));
  } catch (err) {
    console.error('Stripe success handler error:', err);
    return NextResponse.redirect(new URL('/profile?tab=subscription&error=1', req.url));
  }
}
