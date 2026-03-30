import { NextRequest, NextResponse } from "next/server";

const API_KEY = "AIzaSyA87g86GEcAcJE3LTlNdBTnVvT2NocL5a4";
const FIREBASE_PROJECT_ID = "studio-3850868995-4f1cf";

interface Lead {
  Name: string;
  Phone: string;
  Rating: number;
  Total_Reviews: number;
  Address: string;
  Est_Price: string;
  Website: string | null;
}

// Helper to save to Firestore via REST
async function saveToFirestore(lead: Lead, commitId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/spa_leads`;

  const firestoreFormat = {
    fields: {
      name: { stringValue: lead.Name },
      phone: { stringValue: lead.Phone || "N/A" },
      rating: { stringValue: String(lead.Rating) },
      reviews: { integerValue: String(lead.Total_Reviews) },
      address: { stringValue: lead.Address },
      est_price: { stringValue: lead.Est_Price },
      website: { stringValue: lead.Website || "" },
      crmStatus: { stringValue: "new" },
      commitId: { stringValue: commitId },
      timestamp: { timestampValue: new Date().toISOString() },
      notes: { stringValue: "" }
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestoreFormat),
    });
    const resValue = await response.json();
    return !!resValue.name;
  } catch {
    return false;
  }
}

async function createCommit(commitId: string, category: string, city: string, state: string, goal: number) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/commits?documentId=${commitId}`;

  const firestoreFormat = {
    fields: {
      category: { stringValue: category },
      city: { stringValue: city },
      state: { stringValue: state },
      goal: { integerValue: String(goal) },
      leadCount: { integerValue: "0" },
      timestamp: { timestampValue: new Date().toISOString() },
    },
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestoreFormat),
    });
    return true;
  } catch {
    return false;
  }
}

async function updateCommitCount(commitId: string, count: number) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/commits/${commitId}?updateMask.fieldPaths=leadCount`;

  const firestoreFormat = {
    fields: {
      leadCount: { integerValue: String(count) },
    },
  };

  try {
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestoreFormat),
    });
  } catch {}
}

// SSE Route
export async function POST(req: NextRequest) {
  try {
    const { category, state, district, goal = 20, filters } = await req.json();
    const city = district; // Legacy support or specific mapping
    
    // Default Filter Logic: If disabled, everything is accepted
    const filterCfg = filters?.enabled ? filters : {
      minRating: 0,
      minReviews: 0,
      requireNoWebsite: false,
      requirePhone: false
    };

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        function sendMsg(msg: string) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message: msg })}\n\n`));
        }

        try {
          if (!API_KEY) {
            sendMsg("⚠️ KRIPYA APNA GOOGLE PLACES API KEY DALEIN.");
            controller.close();
            return;
          }

          const query = `${category} in ${city}, ${state}`;
          const commitId = `commit_${Date.now()}`;
          
          sendMsg(`🚀 BHARAT ENGINE: Tracing ${query}...`);
          sendMsg(`📦 CREATING COMMIT: ${commitId}...`);
          
          if (filters?.enabled) {
            sendMsg(`🛡️ [SYSTEM]: Applying Security Filters (Rating > ${filterCfg.minRating}+, Reviews > ${filterCfg.minReviews}+) 🌪️`);
          } else {
            sendMsg(`📡 [SYSTEM]: FULL SPECTRUM SCAN ACTIVE (Filters Disabled) 🌪️`);
          }

          await createCommit(commitId, category, city, state, goal);

          let collectedCounter = 0;
          let pageToken: string | null = null;
          let pageLoads = 0;

          while (collectedCounter < goal && pageLoads < 5) {
            pageLoads++;
            let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
              query
            )}&key=${API_KEY}`;
            if (pageToken) url += `&pagetoken=${pageToken}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.error_message) {
              sendMsg(`❌ API Error: ${data.error_message}`);
              break;
            }

            const results = data.results || [];
            if (results.length === 0) {
              sendMsg(`ℹ️ No more results found for this area.`);
              break;
            }

            for (const place of results) {
              if (collectedCounter >= goal) break;

              const placeId = place.place_id;
              const rating = place.rating || 0;
              const userRatingsTotal = place.user_ratings_total || 0;

              // CUSTOM FILTER LOGIC
              const ratingPass = rating >= filterCfg.minRating;
              const reviewsPass = userRatingsTotal >= filterCfg.minReviews;
              
              if (ratingPass && reviewsPass) {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,formatted_address&key=${API_KEY}`;
                
                const detailRes = await fetch(detailsUrl);
                const detailData = await detailRes.json();
                const details = detailData.result || {};
                const website = details.website;
                const phone = details.formatted_phone_number;

                // ADDITIONAL FILTERS
                const websitePass = !filterCfg.requireNoWebsite || !website;
                const phonePass = !filterCfg.requirePhone || !!phone;

                if (websitePass && phonePass) {
                  const estPrices = ["₹5,000", "₹7,500", "₹10,000"];
                  const estPrice = estPrices[Math.floor(Math.random() * estPrices.length)];

                  const lead: Lead = {
                    Name: details.name || place.name || "N/A",
                    Phone: phone || "No Phone",
                    Rating: rating,
                    Total_Reviews: userRatingsTotal,
                    Address: details.formatted_address || place.formatted_address || "N/A",
                    Est_Price: estPrice,
                    Website: website || null,
                  };

                  sendMsg(`✅ FOUND: ${lead.Name} (${phone}) - Reviews: ${userRatingsTotal}`);

                  const success = await saveToFirestore(lead, commitId);
                  if (success) {
                    collectedCounter++;
                    sendMsg(`💾 SAVED: [${collectedCounter}/${goal}] Leads tagged to ${commitId}.`);
                    await updateCommitCount(commitId, collectedCounter);
                  }
                }
              }
            }

            pageToken = data.next_page_token;
            if (!pageToken) break;

            sendMsg(`⏳ Loading next page of results...`);
            await new Promise((res) => setTimeout(res, 2000));
          }

          sendMsg(`🏁 FINISHED. Extracted & Saved to Vault: ${collectedCounter}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ complete: true })}\n\n`));
        } catch (e: unknown) {
          sendMsg(`❌ Error: ${e instanceof Error ? e.message : "Unknown error"}`);
        } finally {
          sendMsg("DONE");
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
