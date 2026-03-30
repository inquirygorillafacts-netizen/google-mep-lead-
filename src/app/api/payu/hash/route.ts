import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, productinfo, firstname, email, phone, txnid, userId, planName } = body;

    // Test credentials for PayU
    // User will replace these with real credentials later
    const PAYU_KEY = process.env.PAYU_KEY || "gtKFFx"; 
    const PAYU_SALT = process.env.PAYU_SALT || "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW";

    if (!amount || !productinfo || !firstname || !email || !txnid || !userId || !planName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    // Hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    // udf1 = userId, udf2 = planName
    const cryp = crypto.createHash('sha512');
    const text = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${userId}|${planName}|||||||||${PAYU_SALT}`;
    cryp.update(text);
    const hash = cryp.digest('hex');

    const PAYU_BASE_URL = process.env.PAYU_BASE_URL || "https://test.payu.in";

    return NextResponse.json({
      hash,
      key: PAYU_KEY,
      action: `${PAYU_BASE_URL}/_payment`,
      surl: `${baseUrl}/api/payu/success`,
      furl: `${baseUrl}/api/payu/failure`,
    });
  } catch (error) {
    console.error("PayU Hash Generation Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
