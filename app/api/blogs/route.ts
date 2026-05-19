import { NextRequest, NextResponse } from 'next/server';
import { blogService } from '@/lib/services/blog.service';
import { blogSchema, paginationSchema } from '@/lib/schemas';
import { getAuthUser, optionalAuth } from '@/lib/auth';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = optionalAuth(req);
    const { searchParams } = new URL(req.url);
    const params = paginationSchema.parse({ page: searchParams.get('page')||1, limit: searchParams.get('limit')||10, search: searchParams.get('search')||undefined, tag: searchParams.get('tag')||undefined, category: searchParams.get('category')||undefined });
    const result = await blogService.getBlogs(params, authUser?.plan);
    return NextResponse.json({ success: true, ...result });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const body = await req.json();
    const v = blogSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ message: 'Оролтын өгөгдөл буруу', errors: v.error.flatten().fieldErrors }, { status: 400 });
    const blog = await blogService.createBlog(v.data, authUser.userId);
    return NextResponse.json({ success: true, blog }, { status: 201 });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
