import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { googleAuthSchema } from '@/lib/schemas';
import { handleError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const v = googleAuthSchema.safeParse(body);
    if (!v.success) {
      return NextResponse.json(
        { message: 'Please enter a valid Google email address.', errors: v.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const result = await authService.googleAuth(v.data);
    const res = NextResponse.json({ success: true, user: result.user, token: result.token });
    res.cookies.set('nexus_token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 604800,
    });
    return res;
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
