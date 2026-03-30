import { NextRequest, NextResponse } from "next/server";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export async function PATCH(req: NextRequest) {
  try {
    const { id, crmStatus, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing Lead ID" }, { status: 400 });
    }

    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/spa_leads/${id}?updateMask.fieldPaths=crmStatus&updateMask.fieldPaths=notes`;

    const firestoreFormat: any = {
      fields: {},
    };

    if (crmStatus !== undefined) {
      firestoreFormat.fields.crmStatus = { stringValue: crmStatus };
    }
    if (notes !== undefined) {
      firestoreFormat.fields.notes = { stringValue: notes };
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestoreFormat),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to update lead");
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/spa_leads/${id}`;
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
       throw new Error("Failed to delete lead from Firestore");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
