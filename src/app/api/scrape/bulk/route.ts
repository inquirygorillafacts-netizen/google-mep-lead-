import { NextRequest, NextResponse } from "next/server";
import { checkMasterLead, saveMasterLead } from "@/lib/master-db";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { category, state, district, city } = await req.json();
    const query = `${category} in ${city || district}, ${state}`;
    
    console.log(`[BULK SCRAPE] Logic started for: ${query}`);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendMsg(msg: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        }

        try {
          let collectedCounter = 0;
          let skippedCounter = 0;
          let pageToken: string | null = null;
          let pageLoads = 0;

          // We do up to 3 pages (Google Max) per district/query
          while (pageLoads < 3) {
            pageLoads++;
            let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
            if (pageToken) url += `&pagetoken=${pageToken}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.error_message) {
              sendMsg({ error: data.error_message });
              break;
            }

            const results = data.results || [];
            if (results.length === 0) break;

            for (const place of results) {
              const placeId = place.place_id;

              // 1. DEDUPLICATION CHECK (SAVES MONEY)
              const alreadyExists = await checkMasterLead(placeId);
              if (alreadyExists) {
                skippedCounter++;
                continue; 
              }

              // 2. FETCH DETAILS (ONLY FOR NEW LEADS)
              const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,formatted_address,url,rating,user_ratings_total&key=${API_KEY}`;
              const detailRes = await fetch(detailUrl);
              const detailData = await detailRes.json();
              const details = detailData.result || {};

              const phone = details.formatted_phone_number;
              const name = details.name || place.name;

              // 3. STRICT PHONE FILTER
              if (!phone) {
                // We still save to master_leads so we don't pay 
                // for the search again, but we mark it as "No Phone"
                await saveMasterLead(placeId, { name, status: "no_phone" });
                continue;
              }

              // 4. SAVE TO MASTER
              const leadData = {
                name: name,
                phone: phone,
                address: details.formatted_address || place.formatted_address || "N/A",
                website: details.website || "",
                maps_url: details.url || "",
                rating: details.rating || 0,
                reviews: details.user_ratings_total || 0,
                category: category,
                state: state,
                district: district || city,
                status: "active"
              };

              const saved = await saveMasterLead(placeId, leadData);
              if (saved) {
                collectedCounter++;
                sendMsg({ 
                    lead: { name: leadData.name, phone: leadData.phone, website: leadData.website },
                    stats: { collectedCounter, skippedCounter }
                });
              }
            }

            pageToken = data.next_page_token;
            if (!pageToken) break;
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for token to become active
          }

          sendMsg({ complete: true, finalStats: { collectedCounter, skippedCounter } });
        } catch (e: any) {
          sendMsg({ error: e.message });
        } finally {
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
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
