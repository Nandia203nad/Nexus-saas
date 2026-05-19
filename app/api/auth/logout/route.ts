import { NextResponse } from 'next/server';
export async function POST() {
  const r = NextResponse.json({ success: true, message: 'Амжилттай гарлаа' });
  r.cookies.delete('nexus_token');
  return r;
}
