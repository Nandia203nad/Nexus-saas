import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
import { getSkillTopic, SKILL_TOPICS } from '@/lib/skill-tree-data';

export const dynamic = 'force-dynamic';

const REACTIONS = ['like', 'insight', 'fire', 'bookmark'];

async function awardXp(userId: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
  if (!user) return null;
  const xp = user.xp + amount;
  return prisma.user.update({
    where: { id: userId },
    data: { xp, level: Math.max(1, Math.floor(xp / 200) + 1) },
    select: { id: true, name: true, email: true, avatar: true, plan: true, xp: true, level: true },
  });
}

async function topicPayload(topicId: string, userId: string) {
  const topic = getSkillTopic(topicId);
  if (!topic) return null;

  const [comments, reactions, progress, attempts] = await Promise.all([
    prisma.skillTopicComment.findMany({
      where: { topicId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { author: { select: { id: true, name: true, avatar: true, level: true, plan: true } } },
    }),
    prisma.skillTopicReaction.findMany({ where: { topicId } }),
    prisma.skillTopicProgress.findUnique({ where: { topicId_userId: { topicId, userId } } }),
    prisma.skillTopicQuizAttempt.findMany({ where: { topicId, userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const counts = REACTIONS.reduce<Record<string, number>>((acc, type) => {
    acc[type] = reactions.filter(reaction => reaction.type === type).length;
    return acc;
  }, {});
  const mine = reactions.filter(reaction => reaction.userId === userId).map(reaction => reaction.type);

  return { topic, comments, reactions: { counts, mine }, progress, attempts };
}

function makeAiResult(action: string, topicId: string) {
  const topic = getSkillTopic(topicId);
  if (!topic) return null;

  if (action === 'ai_generate') {
    return {
      title: `${topic.title}: generated content draft`,
      outline: [
        `Why ${topic.title} matters`,
        'Core principles',
        'Practical example for Nexus blogs',
        'Checklist before publishing',
      ],
      draft: `# ${topic.title}\n\n${topic.summary}\n\n${topic.body.join('\n\n')}\n\nUse this topic to create a focused blog post with a clear promise, concrete examples, and a measurable next step.`,
    };
  }

  return {
    seoScore: Math.min(100, 70 + topic.body.length * 5),
    strengths: ['Clear learning objective', 'Good fit for blog skill progression', 'Can be turned into a quiz or article'],
    suggestions: ['Add one concrete example', 'Include a reader action step', 'Connect the topic to a measurable content outcome'],
  };
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const topicId = req.nextUrl.searchParams.get('topicId') || SKILL_TOPICS[0].id;
    const payload = await topicPayload(topicId, authUser.userId);
    if (!payload) return NextResponse.json({ message: 'Topic not found' }, { status: 404 });
    return NextResponse.json({ success: true, topics: SKILL_TOPICS, ...payload });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const body = await req.json();
    const action = String(body.action || '');
    const topicId = String(body.topicId || '');
    const topic = getSkillTopic(topicId);
    if (!topic) return NextResponse.json({ message: 'Topic not found' }, { status: 404 });

    let user = null;
    let ai = null;

    if (action === 'comment') {
      const content = String(body.content || '').trim();
      if (content.length < 2) return NextResponse.json({ message: 'Comment is too short' }, { status: 400 });
      await prisma.skillTopicComment.create({ data: { topicId, authorId: authUser.userId, content } });
    } else if (action === 'reaction') {
      const type = String(body.type || '');
      if (!REACTIONS.includes(type)) return NextResponse.json({ message: 'Invalid reaction' }, { status: 400 });
      const existing = await prisma.skillTopicReaction.findUnique({ where: { topicId_userId_type: { topicId, userId: authUser.userId, type } } });
      if (existing) await prisma.skillTopicReaction.delete({ where: { topicId_userId_type: { topicId, userId: authUser.userId, type } } });
      else await prisma.skillTopicReaction.create({ data: { topicId, userId: authUser.userId, type } });
    } else if (action === 'read') {
      const existing = await prisma.skillTopicProgress.findUnique({ where: { topicId_userId: { topicId, userId: authUser.userId } } });
      await prisma.skillTopicProgress.upsert({
        where: { topicId_userId: { topicId, userId: authUser.userId } },
        create: { topicId, userId: authUser.userId, read: true, readAt: new Date() },
        update: { read: true, readAt: existing?.readAt || new Date() },
      });
      if (!existing?.read) user = await awardXp(authUser.userId, topic.readXp);
    } else if (action === 'quiz') {
      const answers = Array.isArray(body.answers) ? body.answers : [];
      const correct = topic.quiz.reduce((sum, question, index) => sum + (Number(answers[index]) === question.answer ? 1 : 0), 0);
      const score = Math.round((correct / topic.quiz.length) * 100);
      const passed = score >= 70;
      await prisma.skillTopicQuizAttempt.create({ data: { topicId, userId: authUser.userId, score, passed } });
      const existing = await prisma.skillTopicProgress.findUnique({ where: { topicId_userId: { topicId, userId: authUser.userId } } });
      await prisma.skillTopicProgress.upsert({
        where: { topicId_userId: { topicId, userId: authUser.userId } },
        create: { topicId, userId: authUser.userId, read: false, quizPassed: passed, quizScore: score, completedAt: passed ? new Date() : null },
        update: { quizPassed: existing?.quizPassed || passed, quizScore: Math.max(existing?.quizScore || 0, score), completedAt: passed ? (existing?.completedAt || new Date()) : existing?.completedAt },
      });
      if (passed && !existing?.quizPassed) user = await awardXp(authUser.userId, topic.quizXp);
    } else if (action === 'ai_generate' || action === 'ai_analyze') {
      ai = makeAiResult(action, topicId);
    } else if (action === 'tldr') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        const client = new Anthropic({ apiKey });
        const res = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 256,
          messages: [{
            role: 'user',
            content: `Summarize this blog skill topic in exactly 2-3 sentences (TLDR). Be concise and actionable.\n\nTopic: ${topic.title}\n${topic.summary}\n\n${topic.body.slice(0, 3).join(' ')}`,
          }],
        });
        const tldr = res.content[0].type === 'text' ? res.content[0].text : topic.summary;
        ai = { tldr };
      } else {
        ai = { tldr: topic.summary };
      }
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const payload = await topicPayload(topicId, authUser.userId);
    return NextResponse.json({ success: true, user, ai, ...payload });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
