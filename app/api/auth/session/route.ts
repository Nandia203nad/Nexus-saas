import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { authService } from '@/lib/services/auth.service';
import { handleError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('nexus_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const authUser = getAuthUser(req);
    const user = await authService.getProfile(authUser.userId);
    return NextResponse.json({ success: true, token, user });
  } catch (error) {
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
