import { prisma } from '../db';
import { AppError } from '../errors';

export const PLANS = {
  FREE: {
    name: 'Free', price: 0, xpBonus: 0, aiCredits: 5,
    stripePriceId: null,
    features: ['Блог унших & бичих', 'XP систем', 'Skill tree (Basic)', 'AI Agent (5/сар)', 'Сэтгэгдэл & Like', 'Follow систем'],
  },
  PREMIUM: {
    name: 'Premium', price: 3, xpBonus: 2, aiCredits: 50,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    features: ['Free бүгд', 'Premium контент', 'AI ноорог (50/сар)', 'Portfolio файл', 'Дэлгэрэнгүй аналитик', 'Skill tree Advanced (5000XP)', 'API хандалт', 'Book reviews'],
  },
  MAX: {
    name: 'Max', price: 7, xpBonus: 5, aiCredits: 200,
    stripePriceId: process.env.STRIPE_MAX_PRICE_ID || 'price_max',
    features: ['Premium бүгд', 'Бүх контент', 'AI (200/сар)', 'Skill tree PRO', 'AI ном нийтлэл', 'Хувийн ментор', 'Тэргүүлэх зэрэглэл', 'MAX exclusive content'],
  },
};

export class SubscriptionService {
  async createCheckoutSession(userId: string, plan: 'PREMIUM' | 'MAX', origin: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Хэрэглэгч олдсонгүй', 404, 'NOT_FOUND');

    // In production: use real Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const session = await stripe.checkout.sessions.create({...})
    // For demo with valid env: simulate checkout
    const planInfo = PLANS[plan];
    return {
      url: `${origin}/api/stripe/success?plan=${plan}&userId=${userId}`,
      sessionId: `cs_demo_${Date.now()}`,
      plan: planInfo,
    };
  }

  async upgradePlan(userId: string, plan: 'PREMIUM' | 'MAX') {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan },
      select: { id: true, email: true, plan: true, name: true },
    });
    return { user, message: `${PLANS[plan].name} эрх амжилттай идэвхжлаа!` };
  }

  async downgradePlan(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan: 'FREE' },
      select: { id: true, email: true, plan: true },
    });
    return { user, message: 'Free төлөвлөгөөнд буцлаа' };
  }

  async getPlanInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, xp: true, level: true, stripeSubscriptionId: true },
    });
    return { currentPlan: user?.plan || 'FREE', plans: PLANS };
  }
}
export const subscriptionService = new SubscriptionService();
