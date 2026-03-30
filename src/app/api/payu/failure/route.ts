import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const txnid = formData.get("txnid");
  
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
  
  return NextResponse.redirect(`${baseUrl}/pricing?payment=failed&txnid=${txnid}`);
}
