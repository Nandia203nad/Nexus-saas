import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppError, ErrorMessages, handleError } from '@/lib/errors';
import { DEFAULT_VIDEOS, VideoItem } from '@/lib/video-data';

export const dynamic = 'force-dynamic';

const videoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  author: z.string().min(2),
  duration: z.string().min(1).default('00:00'),
  views: z.string().min(1).default('0'),
  cat: z.string().min(1).default('marketing'),
  level: z.string().min(1).default('Beginner'),
  xp: z.coerce.number().int().min(0).max(10000).default(50),
  youtube: z.string().optional(),
  yt: z.string().optional(),
  desc: z.string().min(2),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
});

function requireVideoManager(req: NextRequest) {
  return getAuthUser(req);
}

function requireAdmin(req: NextRequest) {
  const user = getAuthUser(req);
  if (user.role !== 'ADMIN') throw new AppError(ErrorMessages.FORBIDDEN, 403, 'FORBIDDEN');
  return user;
}

function extractYoutubeId(value?: string) {
  if (!value) return '';
  const trimmed = value.trim();
  const directId = /^[a-zA-Z0-9_-]{11}$/.test(trimmed);
  if (directId) return trimmed;

  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /[?&]vi=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  return '';
}

function normalizeTags(tags?: string[] | string) {
  if (Array.isArray(tags)) return tags.map(tag => tag.trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  return [];
}

function toVideoItem(video: {
  id: string;
  title: string;
  author: string;
  duration: string;
  views: string;
  category: string;
  level: string;
  xp: number;
  youtubeId: string;
  desc: string;
  tags: string[];
}): VideoItem {
  return {
    id: video.id,
    title: video.title,
    author: video.author,
    duration: video.duration,
    views: video.views,
    cat: video.category,
    level: video.level,
    xp: video.xp,
    yt: video.youtubeId,
    desc: video.desc,
    tags: video.tags,
  };
}

export async function GET() {
  try {
    const videos = await prisma.video.findMany({ orderBy: { createdAt: 'desc' } });
    const savedVideos = videos.map(toVideoItem);
    const savedById = new Map(savedVideos.map(video => [video.id, video]));
    const defaultIds = new Set(DEFAULT_VIDEOS.map(video => video.id));
    const replacedDefaults = DEFAULT_VIDEOS.map(video => savedById.get(video.id) || video);
    const addedVideos = savedVideos.filter(video => !defaultIds.has(video.id));

    const res = NextResponse.json({ success: true, videos: [...addedVideos, ...replacedDefaults] });
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res;
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireVideoManager(req);
    const parsed = videoSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ message: 'Video data is invalid', errors: parsed.error.flatten().fieldErrors }, { status: 400 });

    const youtubeId = extractYoutubeId(parsed.data.youtube || parsed.data.yt);
    if (!youtubeId) return NextResponse.json({ message: 'Valid YouTube URL or video ID is required' }, { status: 400 });

    const video = await prisma.video.create({
      data: {
        title: parsed.data.title,
        author: parsed.data.author,
        duration: parsed.data.duration,
        views: parsed.data.views,
        category: parsed.data.cat,
        level: parsed.data.level,
        xp: parsed.data.xp,
        youtubeId,
        desc: parsed.data.desc,
        tags: normalizeTags(parsed.data.tags),
      },
    });

    return NextResponse.json({ success: true, video: toVideoItem(video) }, { status: 201 });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    requireAdmin(req);
    const parsed = videoSchema.safeParse(await req.json());
    if (!parsed.success || !parsed.data.id) return NextResponse.json({ message: 'Video id and data are required' }, { status: 400 });

    const youtubeId = extractYoutubeId(parsed.data.youtube || parsed.data.yt);
    if (!youtubeId) return NextResponse.json({ message: 'Valid YouTube URL or video ID is required' }, { status: 400 });

    const video = await prisma.video.upsert({
      where: { id: parsed.data.id },
      create: {
        id: parsed.data.id,
        title: parsed.data.title,
        author: parsed.data.author,
        duration: parsed.data.duration,
        views: parsed.data.views,
        category: parsed.data.cat,
        level: parsed.data.level,
        xp: parsed.data.xp,
        youtubeId,
        desc: parsed.data.desc,
        tags: normalizeTags(parsed.data.tags),
      },
      update: {
        title: parsed.data.title,
        author: parsed.data.author,
        duration: parsed.data.duration,
        views: parsed.data.views,
        category: parsed.data.cat,
        level: parsed.data.level,
        xp: parsed.data.xp,
        youtubeId,
        desc: parsed.data.desc,
        tags: normalizeTags(parsed.data.tags),
      },
    });

    return NextResponse.json({ success: true, video: toVideoItem(video) });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'Video id is required' }, { status: 400 });

    await prisma.video.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}


