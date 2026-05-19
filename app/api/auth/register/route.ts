import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { registerSchema } from '@/lib/schemas';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = registerSchema.safeParse(body);
    if (!v.success) return NextResponse.json({ message: 'Оролтын өгөгдөл буруу', errors: v.error.flatten().fieldErrors }, { status: 400 });
    const result = await authService.register(v.data);
    const res = NextResponse.json({ success: true, user: result.user, token: result.token }, { status: 201 });
    res.cookies.set('nexus_token', result.token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 604800 });
    return res;
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
