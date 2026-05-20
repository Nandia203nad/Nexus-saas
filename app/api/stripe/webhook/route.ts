import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe тохируулаагүй' }, { status: 500 });

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.metadata?.userEmail || session.customer_email;
      const plan = session.metadata?.plan;

      if (email && plan && ['PREMIUM', 'MAX'].includes(plan)) {
        await prisma.user.update({
          where: { email },
          data: {
            plan: plan as 'PREMIUM' | 'MAX',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: 'FREE', stripeSubscriptionId: null },
      });
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: 'FREE' },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
