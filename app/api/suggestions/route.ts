import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    // Get already-following IDs
    const following = await prisma.follow.findMany({ where: { followerId: u.userId }, select: { followingId: true } });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(u.userId); // exclude self
    // Find top users by XP not already followed
    const suggestions = await prisma.user.findMany({
      where: { id: { notIn: followingIds } },
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true, name: true, avatar: true, bio: true,
        plan: true, xp: true, level: true, streak: true,
        _count: { select: { blogs: true, followers: true } },
      },
    });
    return NextResponse.json({ success: true, suggestions });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
