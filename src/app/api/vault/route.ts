import { NextRequest, NextResponse } from "next/server";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// DELETE for specific lead or an entire commit batch
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const commitId = searchParams.get("commitId");

    if (!id && !commitId) {
      return NextResponse.json({ error: "Missing ID or commitId" }, { status: 400 });
    }

    if (id) {
       // Delete single lead
       const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/spa_leads/${id}`;
       const res = await fetch(url, { method: "DELETE" });
       if (!res.ok) throw new Error("Failed to delete lead from Firestore");
    }

    if (commitId) {
       // Delete entire commit (the batch document)
       const commitUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/commits/${commitId}`;
       await fetch(commitUrl, { method: "DELETE" });

       // Note: To delete all leads in a batch, we'd ideally need a batch delete or a cloud function.
       // For now, we're deleting the commit document. The UI will filter out orphan leads.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
