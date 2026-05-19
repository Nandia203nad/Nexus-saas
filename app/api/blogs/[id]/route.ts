import { NextRequest, NextResponse } from 'next/server';
import { blogService } from '@/lib/services/blog.service';
import { blogSchema } from '@/lib/schemas';
import { getAuthUser, optionalAuth } from '@/lib/auth';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = optionalAuth(req);
    const blog = await blogService.getBlogById(params.id, authUser?.plan);
    return NextResponse.json({ success: true, blog });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message, code: e.code }, { status: e.status }); }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUser(req);
    const body = await req.json();
    const v = blogSchema.partial().safeParse(body);
    if (!v.success) return NextResponse.json({ message: 'Оролтын өгөгдөл буруу' }, { status: 400 });
    const blog = await blogService.updateBlog(params.id, v.data, authUser.userId);
    return NextResponse.json({ success: true, blog });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = getAuthUser(req);
    const result = await blogService.deleteBlog(params.id, authUser.userId, authUser.role);
    return NextResponse.json({ success: true, ...result });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
