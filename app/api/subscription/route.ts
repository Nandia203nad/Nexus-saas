import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription.service';
import { getAuthUser } from '@/lib/auth';
import { handleError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try { const u = getAuthUser(req); return NextResponse.json({ success: true, ...(await subscriptionService.getPlanInfo(u.userId)) }); }
  catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
export async function POST(req: NextRequest) {
  try {
    const u = getAuthUser(req);
    const { action, plan } = await req.json();
    if (action === 'upgrade' && (plan === 'PREMIUM' || plan === 'MAX')) {
      return NextResponse.json({ success: true, ...(await subscriptionService.upgradePlan(u.userId, plan)) });
    }
    if (action === 'downgrade') {
      return NextResponse.json({ success: true, ...(await subscriptionService.downgradePlan(u.userId)) });
    }
    return NextResponse.json({ message: 'Буруу үйлдэл' }, { status: 400 });
  } catch (error) { const e = handleError(error); return NextResponse.json({ message: e.message }, { status: e.status }); }
}
