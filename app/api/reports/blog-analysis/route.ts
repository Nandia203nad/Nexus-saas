import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

function analyzeText(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const headings = (content.match(/^#{1,3}\s+/gm) || []).length;
  const sentences = content.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean);
  const avgWordsPerSentence = sentences.length ? Math.round(words.length / sentences.length) : words.length;
  const seoScore = Math.max(
    35,
    Math.min(
      100,
      45 +
        Math.min(25, headings * 5) +
        Math.min(20, Math.floor(words.length / 120) * 4) +
        (avgWordsPerSentence <= 24 ? 10 : 0),
    ),
  );

  return {
    wordCount: words.length,
    estimatedReadTime: Math.max(1, Math.ceil(words.length / 200)),
    headings,
    sentenceCount: sentences.length,
    avgWordsPerSentence,
    seoScore,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);

    const [user, authoredBlogs, likedBlogs, bookmarkedBlogs, portfolioFiles] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { id: true, name: true, email: true, plan: true, xp: true, level: true },
      }),
      prisma.blog.findMany({
        where: { authorId: authUser.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          tags: { include: { tag: true } },
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
      }),
      prisma.like.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          blog: {
            include: {
              author: { select: { name: true } },
              tags: { include: { tag: true } },
              _count: { select: { likes: true, comments: true, bookmarks: true } },
            },
          },
        },
      }),
      prisma.bookmark.findMany({
        where: { userId: authUser.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          blog: {
            include: {
              author: { select: { name: true } },
              tags: { include: { tag: true } },
              _count: { select: { likes: true, comments: true, bookmarks: true } },
            },
          },
        },
      }),
      prisma.portfolioFile.findMany({
        where: { userId: authUser.userId, type: { in: ['analysis', 'report', 'strategy', 'research'] } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const authored = authoredBlogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      status: blog.published ? 'Published' : 'Draft',
      category: blog.category,
      tags: blog.tags.map((item) => item.tag.name).join(', '),
      views: blog.views,
      likes: blog._count.likes,
      comments: blog._count.comments,
      bookmarks: blog._count.bookmarks,
      readTime: blog.readTime,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      ...analyzeText(blog.content),
    }));

    const interactedMap = new Map<string, {
      id: string;
      title: string;
      author: string;
      category: string;
      tags: string;
      views: number;
      likes: number;
      comments: number;
      bookmarks: number;
      readTime: number;
      interactions: Set<string>;
      interactedAt: Date;
    }>();

    likedBlogs.forEach(({ blog, createdAt }) => {
      interactedMap.set(blog.id, {
        id: blog.id,
        title: blog.title,
        author: blog.author.name,
        category: blog.category,
        tags: blog.tags.map((item) => item.tag.name).join(', '),
        views: blog.views,
        likes: blog._count.likes,
        comments: blog._count.comments,
        bookmarks: blog._count.bookmarks,
        readTime: blog.readTime,
        interactions: new Set(['Liked']),
        interactedAt: createdAt,
      });
    });

    bookmarkedBlogs.forEach(({ blog, createdAt }) => {
      const existing = interactedMap.get(blog.id);
      if (existing) {
        existing.interactions.add('Bookmarked');
        if (createdAt > existing.interactedAt) existing.interactedAt = createdAt;
        return;
      }
      interactedMap.set(blog.id, {
        id: blog.id,
        title: blog.title,
        author: blog.author.name,
        category: blog.category,
        tags: blog.tags.map((item) => item.tag.name).join(', '),
        views: blog.views,
        likes: blog._count.likes,
        comments: blog._count.comments,
        bookmarks: blog._count.bookmarks,
        readTime: blog.readTime,
        interactions: new Set(['Bookmarked']),
        interactedAt: createdAt,
      });
    });

    const interacted = Array.from(interactedMap.values()).map((item) => ({
      ...item,
      interactions: Array.from(item.interactions).join(', '),
    }));

    const processed = portfolioFiles.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      createdAt: file.createdAt,
      ...analyzeText(file.content),
    }));

    const totals = {
      authored: authored.length,
      published: authored.filter((blog) => blog.status === 'Published').length,
      drafts: authored.filter((blog) => blog.status === 'Draft').length,
      interacted: interacted.length,
      processed: processed.length,
      totalViews: authored.reduce((sum, blog) => sum + blog.views, 0),
      totalLikes: authored.reduce((sum, blog) => sum + blog.likes, 0),
      totalComments: authored.reduce((sum, blog) => sum + blog.comments, 0),
      averageSeoScore: authored.length
        ? Math.round(authored.reduce((sum, blog) => sum + blog.seoScore, 0) / authored.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      user,
      totals,
      authored,
      interacted,
      processed,
    });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
