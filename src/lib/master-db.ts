const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export async function checkMasterLead(placeId: string) {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/master_leads/${placeId}`;
    try {
        const res = await fetch(url);
        return res.ok; // If OK, it exists
    } catch {
        return false;
    }
}

export async function saveMasterLead(placeId: string, data: any) {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/master_leads?documentId=${placeId}`;
    
    // Convert flat JSON to Firestore format
    const fields: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue;
        fields[key] = { stringValue: String(value) };
    }
    
    fields["last_scraped"] = { timestampValue: new Date().toISOString() };

    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields }),
        });
        return true;
    } catch {
        return false;
    }
}
