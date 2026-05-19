import { NextRequest, NextResponse } from 'next/server';
import { blogService } from '@/lib/services/blog.service';
import { getAuthUser } from '@/lib/auth';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try { const u = getAuthUser(req); return NextResponse.json({ success: true, ...(await blogService.toggleBookmark(params.id, u.userId)) }); }
  catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
