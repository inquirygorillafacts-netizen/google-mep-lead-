import { NextResponse } from "next/server";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const PLAN_QUOTAS: Record<string, number> = {
  "Starter": 1000,
  "Growth": 5000,
  "Pro": 9999999 // Unlimited
};

export async function POST(req: Request) {
  try {
    // PayU sends form data (application/x-www-form-urlencoded)
    const formData = await req.formData();
    const txnid = formData.get("txnid");
    const status = formData.get("status");
    const userId = formData.get("udf1")?.toString();
    const planName = formData.get("udf2")?.toString();

    // In a real app, verify the reverse hash sent by PayU here before marking as success
    
    if (status === "success" && userId && planName) {
      const quota = PLAN_QUOTAS[planName] || 50;
      
      // Calculate expiry date: 30 days from now
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=plan&updateMask.fieldPaths=quota&updateMask.fieldPaths=expiryDate&updateMask.fieldPaths=updatedAt`;
      
      const firestoreFormat: any = {
        fields: {
          plan: { stringValue: planName.toLowerCase() },
          quota: { integerValue: String(quota) },
          expiryDate: { stringValue: expiryDate },
          updatedAt: { timestampValue: new Date().toISOString() }
        }
      };

      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(firestoreFormat),
      });
    }
    
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    
    // Redirect to a frontend success page or dashboard
    return NextResponse.redirect(`${baseUrl}/profile?payment=success&txnid=${txnid}`);
  } catch (error) {
    console.error("Payment success processing failed:", error);
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    return NextResponse.redirect(`${baseUrl}/profile?payment=error`);
  }
}
