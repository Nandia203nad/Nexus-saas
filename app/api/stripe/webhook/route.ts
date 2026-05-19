import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  // In production: verify Stripe webhook signature
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  try {
    const event = JSON.parse(body);
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const userId = session?.metadata?.userId;
      const plan = session?.metadata?.plan;
      if (userId && plan && ['PREMIUM','MAX'].includes(plan)) {
        await prisma.user.update({ where: { id: userId }, data: { plan, stripeCustomerId: session.customer } });
      }
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data?.object;
      const userId = sub?.metadata?.userId;
      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } });
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
