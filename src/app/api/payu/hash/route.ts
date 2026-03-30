import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, productinfo, firstname, email, phone, txnid } = body;

    // Test credentials for PayU
    // User will replace these with real credentials later
    const PAYU_KEY = process.env.PAYU_KEY || "gtKFFx"; 
    const PAYU_SALT = process.env.PAYU_SALT || "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW";

    if (!amount || !productinfo || !firstname || !email || !txnid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const cryp = crypto.createHash('sha512');
    const text = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;
    cryp.update(text);
    const hash = cryp.digest('hex');

    return NextResponse.json({
      hash,
      key: PAYU_KEY,
      surl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payu/success`,
      furl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payu/failure`,
    });
  } catch (error) {
    console.error("PayU Hash Generation Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
