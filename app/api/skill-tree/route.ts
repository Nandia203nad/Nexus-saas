import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
import { getParentIds, getSkillNode, SKILL_TREE_NODES } from '@/lib/skill-tree-data';

export const dynamic = 'force-dynamic';

function canUsePlan(node: { premium?: boolean; maxOnly?: boolean }, plan: string) {
  if (node.maxOnly) return plan === 'MAX';
  if (node.premium) return plan === 'PREMIUM' || plan === 'MAX';
  return true;
}

async function ensureSkill(nodeId: string) {
  const node = getSkillNode(nodeId);
  if (!node) return null;

  return prisma.skill.upsert({
    where: { slug: node.id },
    create: {
      id: node.id,
      slug: node.id,
      name: node.label,
      icon: node.icon,
      category: node.category,
      xpRequired: node.xp,
      prerequisites: getParentIds(node.id).join(','),
    },
    update: {
      name: node.label,
      icon: node.icon,
      category: node.category,
      xpRequired: node.xp,
      prerequisites: getParentIds(node.id).join(','),
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const [user, progress] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { id: true, name: true, email: true, avatar: true, plan: true, xp: true, level: true },
      }),
      prisma.userSkill.findMany({ where: { userId: authUser.userId }, select: { skillId: true, xp: true, level: true, unlockedAt: true } }),
    ]);

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, user, progress });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const { skillId } = await req.json();
    const node = getSkillNode(String(skillId || ''));
    if (!node) return NextResponse.json({ message: 'Skill not found' }, { status: 404 });

    const [user, completed] = await Promise.all([
      prisma.user.findUnique({ where: { id: authUser.userId }, select: { id: true, plan: true, xp: true } }),
      prisma.userSkill.findMany({ where: { userId: authUser.userId }, select: { skillId: true } }),
    ]);
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const completedIds = new Set(completed.map(item => item.skillId));
    const parents = getParentIds(node.id);
    const hasParents = node.id === 'starter' || parents.every(parentId => completedIds.has(parentId));
    if (!hasParents) return NextResponse.json({ message: 'Complete prerequisite skills first.' }, { status: 403 });
    if (!canUsePlan(node, user.plan)) return NextResponse.json({ message: node.maxOnly ? 'MAX plan is required.' : 'Premium plan is required.' }, { status: 403 });

    await ensureSkill(node.id);
    const alreadyDone = completedIds.has(node.id);

    const progress = await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: user.id, skillId: node.id } },
      create: { userId: user.id, skillId: node.id, xp: node.xp, level: 1 },
      update: {},
    });

    const nextXp = alreadyDone ? user.xp : user.xp + node.xp;
    const nextLevel = Math.max(1, Math.floor(nextXp / 200) + 1);
    const updatedUser = alreadyDone
      ? await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, avatar: true, plan: true, xp: true, level: true } })
      : await prisma.user.update({
          where: { id: user.id },
          data: { xp: nextXp, level: nextLevel },
          select: { id: true, name: true, email: true, avatar: true, plan: true, xp: true, level: true },
        });

    return NextResponse.json({
      success: true,
      alreadyDone,
      progress,
      user: updatedUser,
      nodes: SKILL_TREE_NODES.length,
    });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
