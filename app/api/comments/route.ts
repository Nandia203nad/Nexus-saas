import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '@/lib/services/comment.service';
import { commentSchema } from '@/lib/schemas';
import { getAuthUser } from '@/lib/auth';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try { const { searchParams } = new URL(req.url); return NextResponse.json({ success: true, comments: await commentService.getComments(searchParams.get('blogId')||'') }); }
  catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
export async function POST(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const body = await req.json();
    const v = commentSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ message: 'Буруу өгөгдөл' }, { status: 400 });
    return NextResponse.json({ success: true, comment: await commentService.createComment(v.data, u.userId) }, { status: 201 });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
