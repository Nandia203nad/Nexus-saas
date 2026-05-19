import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { targetUserId } = await req.json();
    if (!targetUserId || targetUserId === u.userId) return NextResponse.json({ message: 'Invalid' }, { status: 400 });
    const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: u.userId, followingId: targetUserId } } });
    if (existing) {
      await prisma.follow.delete({ where: { followerId_followingId: { followerId: u.userId, followingId: targetUserId } } });
      return NextResponse.json({ success: true, following: false });
    }
    await prisma.follow.create({ data: { followerId: u.userId, followingId: targetUserId } });
    return NextResponse.json({ success: true, following: true });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
export async function GET(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || u.userId;
    const [followers, following] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);
    let isFollowing = false;
    if (userId !== u.userId) {
      const f = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: u.userId, followingId: userId } } });
      isFollowing = !!f;
    }
    return NextResponse.json({ success: true, followers, following, isFollowing });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
