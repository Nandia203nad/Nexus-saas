import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    // Get IDs of users this user follows
    const follows = await prisma.follow.findMany({ where: { followerId: u.userId }, select: { followingId: true } });
    const followingIds = follows.map(f => f.followingId);
    followingIds.push(u.userId); // Include own posts
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where: { published: true, authorId: { in: followingIds } },
        skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { author: { select: { id:true, name:true, avatar:true, level:true, plan:true } }, tags: { include: { tag: true } }, _count: { select: { comments:true, likes:true } } },
      }),
      prisma.blog.count({ where: { published: true, authorId: { in: followingIds } } }),
    ]);
    const planRank = { FREE: 0, PREMIUM: 1, MAX: 2 };
    const userRank = planRank[u.plan as keyof typeof planRank] || 0;
    return NextResponse.json({ success: true, blogs: blogs.map(b => ({ ...b, isLocked: planRank[b.minPlan as keyof typeof planRank] > userRank })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
