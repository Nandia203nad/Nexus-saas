import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { plan } = await req.json();
    if (!['PREMIUM','MAX'].includes(plan)) return NextResponse.json({ message: 'Invalid plan' }, { status: 400 });
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const user = await prisma.user.findUnique({ where: { id: u.userId }, select: { email: true, name: true } });
    const planPrices = {
      PREMIUM: { amount: 300, name: 'Nexus Premium' },
      MAX: { amount: 700, name: 'Nexus Max' },
    };
    const planInfo = planPrices[plan as 'PREMIUM'|'MAX'];
    // Production: create real Stripe checkout session
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const session = await stripe.checkout.sessions.create({
    //   customer_email: user?.email,
    //   mode: 'subscription',
    //   line_items: [{ price: process.env[`STRIPE_${plan}_PRICE_ID`], quantity: 1 }],
    //   success_url: `${origin}/api/stripe/success?plan=${plan}&userId=${u.userId}`,
    //   cancel_url: `${origin}/profile?tab=subscription&cancelled=1`,
    //   metadata: { userId: u.userId, plan },
    // });
    // return NextResponse.json({ success: true, url: session.url });
    // Demo mode: simulate payment then redirect to dashboard
    const successUrl = `${origin}/api/stripe/success?plan=${plan}&userId=${u.userId}`;
    return NextResponse.json({
      success: true,
      url: successUrl,
      sessionId: `cs_demo_${Date.now()}`,
      plan: planInfo,
      message: `${planInfo.name} - $${planInfo.amount/100}/month`,
    });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
