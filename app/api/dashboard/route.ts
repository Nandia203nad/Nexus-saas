import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);

    const [user, blogCount, commentCount, likeCount, skillProgress, quizAttempts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { id: true, name: true, email: true, xp: true, level: true, plan: true, streak: true, avatar: true, createdAt: true },
      }),
      prisma.blog.count({ where: { authorId: authUser.userId, published: true } }),
      prisma.comment.count({ where: { authorId: authUser.userId } }),
      prisma.like.count({ where: { userId: authUser.userId } }),
      prisma.skillTopicProgress.findMany({ where: { userId: authUser.userId } }),
      prisma.skillTopicQuizAttempt.findMany({ where: { userId: authUser.userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    const [totalUsers, totalPosts] = await Promise.all([
      prisma.user.count(),
      prisma.blog.count({ where: { published: true } }),
    ]);

    const recentBlogs = await prisma.blog.findMany({
      where: { authorId: authUser.userId, published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { comments: true, likes: true } } },
    });

    const topicsRead = skillProgress.filter(p => p.read).length;
    const quizPassed = skillProgress.filter(p => p.quizPassed).length;
    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
      : 0;

    return NextResponse.json({
      success: true,
      user,
      stats: {
        blogCount,
        commentCount,
        likeCount,
        topicsRead,
        quizPassed,
        avgQuizScore,
        totalXp: user?.xp || 0,
        level: user?.level || 1,
        streak: user?.streak || 0,
      },
      recentBlogs,
      platform: { totalUsers, totalPosts },
    });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
