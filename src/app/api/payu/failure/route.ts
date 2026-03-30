import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const txnid = formData.get("txnid");
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  return NextResponse.redirect(`${baseUrl}/pricing?payment=failed&txnid=${txnid}`);
}
