import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const user = await prisma.user.findUnique({ where: { id: u.userId }, select: { xp: true, level: true, plan: true, _count: { select: { blogs: true, comments: true } } } });
    const allBadges = await prisma.badge.findMany();
    const userBadges = await prisma.userBadge.findMany({ where: { userId: u.userId }, include: { badge: true } });
    const earnedIds = new Set(userBadges.map(b => b.badgeId));
    // Auto-award badges based on conditions
    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue;
      let earned = false;
      if (badge.condition === 'xp_100' && (user?.xp || 0) >= 100) earned = true;
      if (badge.condition === 'xp_1000' && (user?.xp || 0) >= 1000) earned = true;
      if (badge.condition === 'xp_5000' && (user?.xp || 0) >= 5000) earned = true;
      if (badge.condition === 'blogs_1' && (user?._count.blogs || 0) >= 1) earned = true;
      if (badge.condition === 'blogs_10' && (user?._count.blogs || 0) >= 10) earned = true;
      if (badge.condition === 'premium' && ['PREMIUM','MAX'].includes(u.plan)) earned = true;
      if (earned) {
        await prisma.userBadge.create({ data: { userId: u.userId, badgeId: badge.id } }).catch(() => {});
        earnedIds.add(badge.id);
      }
    }
    return NextResponse.json({ success: true, badges: allBadges.map(b => ({ ...b, earned: earnedIds.has(b.id) })) });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
