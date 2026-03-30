import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const PLAN_QUOTAS: Record<string, number> = {
  "Starter": 1000,
  "Growth": 5000,
  "Pro": 9999999 // Unlimited
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const txnid = formData.get("txnid");
    const status = formData.get("status");
    const userId = formData.get("udf1")?.toString();
    const planName = formData.get("udf2")?.toString();

    // PayU sends form data (application/x-www-form-urlencoded)
    // Verify the reverse hash sent by PayU to ensure transaction integrity
    const PAYU_SALT = process.env.PAYU_SALT || "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW";
    const PAYU_KEY = process.env.PAYU_KEY || "gtKFFx";

    const hash = formData.get("hash") as string;
    const amount = formData.get("amount") as string;
    const email = formData.get("email") as string;
    const firstname = formData.get("firstname") as string;
    const productinfo = formData.get("productinfo") as string;
    const udf1 = formData.get("udf1") as string;
    const udf2 = formData.get("udf2") as string;
    const udf3 = formData.get("udf3") as string || "";
    const udf4 = formData.get("udf4") as string || "";
    const udf5 = formData.get("udf5") as string || "";
    const udf6 = formData.get("udf6") as string || "";
    const udf7 = formData.get("udf7") as string || "";
    const udf8 = formData.get("udf8") as string || "";
    const udf9 = formData.get("udf9") as string || "";
    const udf10 = formData.get("udf10") as string || "";

    // Reverse hash formula: salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const hashString = `${PAYU_SALT}|${status}|${udf10}|${udf9}|${udf8}|${udf7}|${udf6}|${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
    const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

    if (calculatedHash !== hash) {
      console.error("PayU Hash Mismatch! Potential fraud attempt.", { calculatedHash, receivedHash: hash });
      // In case of mismatch, redirect with error
      const host = req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
      return NextResponse.redirect(`${baseUrl}/profile?payment=error&reason=hash_mismatch`);
    }

    if (status === "success" && userId && planName) {
      const quota = PLAN_QUOTAS[planName] || 50;
      
      // Calculate expiry date: 30 days from now
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          plan: planName.toLowerCase(),
          quota: quota,
          expiryDate: expiryDate,
          updatedAt: serverTimestamp()
        });
        console.log(`Successfully updated plan for user ${userId} to ${planName}`);
      } catch (dbError) {
        console.error("Firestore update failed:", dbError);
        // Even if DB update fails, we might still want to redirect, but log the error
      }
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
