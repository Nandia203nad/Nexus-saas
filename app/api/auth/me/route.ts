import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { authService } from '@/lib/services/auth.service';
import { handleError } from '@/lib/errors';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const profile = await authService.getProfile(u.userId);
    return NextResponse.json({ success: true, user: profile });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
export async function PATCH(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { xp } = await req.json();
    if (typeof xp !== 'number' || xp < 0) return NextResponse.json({ message: 'Invalid XP value' }, { status: 400 });
    const current = await prisma.user.findUnique({ where: { id: u.userId }, select: { xp: true } });
    if (!current) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    if (xp <= (current.xp || 0)) return NextResponse.json({ success: true, xp: current.xp });
    const newLevel = Math.max(1, Math.floor(xp / 200));
    const updated = await prisma.user.update({
      where: { id: u.userId },
      data: { xp, level: newLevel },
      select: { xp: true, level: true },
    });
    return NextResponse.json({ success: true, xp: updated.xp, level: updated.level });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
