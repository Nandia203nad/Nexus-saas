import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/lib/services/comment.service';
import { getAuthUser } from '@/lib/auth';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try { const u = getAuthUser(req); return NextResponse.json({ success: true, ...(await commentService.deleteComment(params.id, u.userId, u.role)) }); }
  catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
