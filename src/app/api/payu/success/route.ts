import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // PayU sends form data (application/x-www-form-urlencoded)
  const formData = await req.formData();
  const txnid = formData.get("txnid");
  const amount = formData.get("amount");
  const status = formData.get("status");

  // In a real app, verify the reverse hash sent by PayU here before marking as success
  
  // Replace with actual domain in production
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  // Redirect to a frontend success page or dashboard
  return NextResponse.redirect(`${baseUrl}/profile?payment=success&txnid=${txnid}`);
}
