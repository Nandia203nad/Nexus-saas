import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const files = await prisma.portfolioFile.findMany({ where: { userId: u.userId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, files });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}

export async function POST(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { name, type, content } = await req.json();
    if (!name || !content) return NextResponse.json({ message: 'Нэр болон агуулга шаардлагатай' }, { status: 400 });
    const file = await prisma.portfolioFile.create({
      data: { userId: u.userId, name, type: type || 'analysis', content, size: content.length },
    });
    return NextResponse.json({ success: true, file }, { status: 201 });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID шаардлагатай' }, { status: 400 });
    await prisma.portfolioFile.deleteMany({ where: { id, userId: u.userId } });
    return NextResponse.json({ success: true, message: 'Файл устгагдлаа' });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
