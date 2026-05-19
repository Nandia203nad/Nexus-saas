import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError, AppError, ErrorMessages } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    if (u.role !== 'ADMIN') throw new AppError(ErrorMessages.FORBIDDEN, 403, 'FORBIDDEN');
    const [userCount, blogCount, commentCount, premiumCount, maxCount] = await Promise.all([
      prisma.user.count(), prisma.blog.count({ where: { published: true } }), prisma.comment.count(),
      prisma.user.count({ where: { plan: 'PREMIUM' } }), prisma.user.count({ where: { plan: 'MAX' } }),
    ]);
    const recentUsers = await prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, select: { id:true, name:true, email:true, plan:true, xp:true, level:true, createdAt:true, streak:true } });
    const recentBlogs = await prisma.blog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, where: { published: true }, include: { author: { select: { name:true } }, _count: { select: { comments:true, likes:true } } } });
    const topUsers = await prisma.user.findMany({ take: 9, orderBy: { xp: 'desc' }, select: { id:true, name:true, email:true, xp:true, level:true, plan:true, avatar:true, streak:true, _count: { select: { blogs:true, comments:true } } } });
    return NextResponse.json({ success: true, stats: { userCount, blogCount, commentCount, premiumCount, maxCount }, recentUsers, recentBlogs, topUsers });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
