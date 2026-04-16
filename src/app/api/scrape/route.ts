import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

interface Lead {
  Name: string;
  Phone: string;
  Rating: number;
  Total_Reviews: number;
  Address: string;
  Est_Price: string;
  Website: string | null;
  MapsUrl: string;
}

// Helper to get User Data
async function getUserData(userId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return null;
    return {
      quota: parseInt(data.fields.quota?.integerValue || "0"),
      usedQuota: parseInt(data.fields.usedQuota?.integerValue || "0"),
      dailyRuns: parseInt(data.fields.dailyRuns?.integerValue || "0"),
      lastRunDate: data.fields.lastRunDate?.stringValue || null,
      plan: data.fields.plan?.stringValue || "free",
      expiryDate: data.fields.expiryDate?.stringValue || null
    };
  } catch {
    return null;
  }
}

// Helper to update Daily Usage
// Helper to update Daily Usage & Reset Quota on a new day
async function updateDailyUsage(userId: string, runs: number, date: string, resetUsedQuota: boolean) {
  let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=dailyRuns&updateMask.fieldPaths=lastRunDate`;
  if (resetUsedQuota) url += `&updateMask.fieldPaths=usedQuota`;
  
  const fields: any = {
    dailyRuns: { integerValue: String(runs) },
    lastRunDate: { stringValue: date }
  };
  if (resetUsedQuota) fields.usedQuota = { integerValue: "0" };

  const firestoreFormat = { fields };
  
  try {
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestoreFormat),
    });
  } catch {}
}

// Helper to update User Used Quota
async function updateUserUsedQuota(userId: string, newUsedQuota: number) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=usedQuota`;
  const firestoreFormat = {
    fields: {
      usedQuota: { integerValue: String(newUsedQuota) },
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

// Helper to save to Firestore via REST
async function saveToFirestore(lead: Lead, commitId: string, userId: string) {
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
      maps_url: { stringValue: lead.MapsUrl || "" },
      crmStatus: { stringValue: "new" },
      commitId: { stringValue: commitId },
      userId: { stringValue: userId },
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

async function createCommit(commitId: string, category: string, city: string, state: string, goal: number, userId: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/commits?documentId=${commitId}`;

  const firestoreFormat = {
    fields: {
      category: { stringValue: category },
      city: { stringValue: city },
      state: { stringValue: state },
      goal: { integerValue: String(goal) },
      leadCount: { integerValue: "0" },
      userId: { stringValue: userId },
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
    const { category, state, district, goal = 20, filters, userId } = await req.json();
    const city = district; // Legacy support or specific mapping
    
    if (!userId) {
      return NextResponse.json({ error: "Missing User ID. Please login." }, { status: 401 });
    }
    
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

          const userData = await getUserData(userId);
          if (!userData) {
            sendMsg("❌ User account not found. Please refresh and try again.");
            controller.close();
            return;
          }

          // --- PLAN-BASED LIMITS ---
          const today = new Date().toISOString().split('T')[0];
          let dailyRuns = userData.dailyRuns || 0;
          const lastRunDate = userData.lastRunDate || today;

          // 1. Reset daily runs and usedQuota if it's a new day
          let isNewDay = false;
          if (lastRunDate !== today) {
            dailyRuns = 0;
            userData.usedQuota = 0;
            isNewDay = true;
          }

          // 2. Daily Run Limit (Free Tier)
          if (userData.plan === "free" && dailyRuns >= 2) {
            sendMsg(`⚠️ DAILY LIMIT REACHED: Free users are limited to 2 sessions per day. Please upgrade for unlimited sessions.`);
            controller.close();
            return;
          }

          // 3. Define Daily Limits Based on Plans
          const planStr = (userData.plan || "free").toLowerCase();
          let dailyLimit = 0;
          if (planStr === "free") dailyLimit = 10;
          else if (planStr === "starter") dailyLimit = 500;
          else if (planStr === "pro") dailyLimit = 2500;
          else if (planStr === "elite" || planStr === "premium") dailyLimit = 5000;
          else dailyLimit = 100; // safe fallback

          let actualGoal = goal;
          
          if (planStr === "free") {
            actualGoal = Math.min(goal, 10);
            if (goal > 10) sendMsg(`ℹ️ [FREE TIER NOTICE]: Capping session at 10 leads. Upgrade to unlock full extraction.`);
          }

          // 4. Daily Expiry Check
          if (userData.usedQuota >= dailyLimit) {
            sendMsg(`⚠️ DAILY QUOTA EXHAUSTED: You have used your ${dailyLimit} leads for today on the ${userData.plan.toUpperCase()} plan. Wait until tomorrow or upgrade.`);
            controller.close();
            return;
          }

          if (userData.plan !== "free" && userData.expiryDate) {
            const expiry = new Date(userData.expiryDate);
            if (expiry < new Date()) {
              sendMsg(`❌ PLAN EXPIRED: Your ${userData.plan} plan expired on ${expiry.toLocaleDateString()}. Please renew at profile -> billing.`);
              controller.close();
              return;
            }
          }

          // 5. Update Daily Usage immediately upon start
          await updateDailyUsage(userId, dailyRuns + 1, today, isNewDay);

          const query = `${category} in ${city}, ${state}`;
          const commitId = `commit_${Date.now()}`;
          
          sendMsg(`🚀 BHARAT ENGINE: Tracing ${query}...`);
          sendMsg(`📦 CREATING COMMIT: ${commitId}...`);
          
          if (filters?.enabled) {
            sendMsg(`🛡️ [SYSTEM]: Applying Security Filters (Rating > ${filterCfg.minRating}+, Reviews > ${filterCfg.minReviews}+) 🌪️`);
          } else {
            sendMsg(`📡 [SYSTEM]: FULL SPECTRUM SCAN ACTIVE (Filters Disabled) 🌪️`);
          }

          // Adjust goal if it exceeds remaining daily quota
          const remainingDailyQuota = dailyLimit - userData.usedQuota;
          
          if (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.includes("localhost")) {
            sendMsg(`🔓 [DEV MODE]: Bhai limit bypass kar di gayi hai local testing ke liye.`);
          } else {
            actualGoal = Math.min(actualGoal, remainingDailyQuota);
            if (actualGoal < goal && planStr !== "free") {
              sendMsg(`ℹ️ Adjusting goal to ${actualGoal} because you only have that many leads left for TODAY.`);
            }
          }

          await createCommit(commitId, category, city, state, actualGoal, userId);

          let collectedCounter = 0;
          let currentUsedQuota = userData.usedQuota;
          let pageToken: string | null = null;
          let pageLoads = 0;

          while (collectedCounter < actualGoal && pageLoads < 5) {
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
              if (collectedCounter >= actualGoal) break;

              // STRICT CATEGORY MATCH (Now handles Typos)
              const categoryWords = category.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
              let categoryMatch = false;
              if (categoryWords.length === 0) categoryMatch = true; 
              else {
                const nameStr = (place.name || "").toLowerCase();
                const typesStr = (place.types || []).join(" ").toLowerCase();
                categoryMatch = categoryWords.some((word: string) => {
                    if (nameStr.includes(word) || typesStr.includes(word)) return true;
                    // Typo resilience for 'architecture' / 'architect'
                    if (word.includes('arch')) return nameStr.includes('arch') || typesStr.includes('arch');
                    return false;
                });
              }
              if (!categoryMatch) continue;

              const placeId = place.place_id;
              const rating = place.rating || 0;
              const userRatingsTotal = place.user_ratings_total || 0;

              // CUSTOM FILTER LOGIC
              const ratingPass = rating >= filterCfg.minRating;
              const reviewsPass = userRatingsTotal >= filterCfg.minReviews;
              
              if (ratingPass && reviewsPass) {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,formatted_address,url&key=${API_KEY}`;
                
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
                    MapsUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`
                  };

                  sendMsg(`✅ FOUND: ${lead.Name} (${phone}) - Reviews: ${userRatingsTotal}`);

                  const success = await saveToFirestore(lead, commitId, userId);
                  if (success) {
                    collectedCounter++;
                    currentUsedQuota++;
                    sendMsg(`💾 SAVED: [${collectedCounter}/${actualGoal}] Leads tagged to ${commitId}.`);
                    await updateCommitCount(commitId, collectedCounter);
                    await updateUserUsedQuota(userId, currentUsedQuota);
                  }
                }
              }
            }

            pageToken = data.next_page_token;
            if (!pageToken) {
              if (collectedCounter < actualGoal) {
                sendMsg(`⚠️ [SYSTEM]: Area exhausted. Found ${collectedCounter}/${actualGoal} strict matches in this region.`);
              }
              break;
            }

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
