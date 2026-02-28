import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, bodyShape, skinTone, styleKeywords, gender, heightCm } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const genderLabel = gender === "male" ? "man" : gender === "female" ? "woman" : "person";
    const keywordsStr = (styleKeywords || []).join(", ");

    const userPrompt = `Analyze the outfit in this photo for a ${genderLabel} with:
- Body shape: ${bodyShape}
- Skin tone: ${skinTone}
- Height: ${heightCm ? heightCm + "cm" : "not specified"}
- Style preferences: ${keywordsStr || "open to suggestions"}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "currentOutfitAnalysis": "2-3 sentences analyzing what they're wearing, what works and what doesn't",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "suggestedOutfit": {
    "name": "creative outfit name",
    "items": ["specific item 1", "specific item 2", "specific item 3", "footwear", "accessory"],
    "why": "why this would work better for their body and style"
  },
  "shoppingLinks": [
    {"item": "Item display name", "query": "search query for shopping"},
    {"item": "Item display name", "query": "search query for shopping"}
  ]
}

All suggestions must be gender-appropriate for a ${genderLabel}. Reference current fashion trends from Pinterest and Instagram.`;

    // Use gemini-2.5-flash for vision capability
    const messages: any[] = [
      { role: "system", content: `You are StyleMatch, a world-class AI fashion analyst. You analyze outfit photos and provide actionable styling advice. All recommendations must be gender-appropriate for a ${genderLabel}.` },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed. Please top up in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from AI");

    let analysis;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse outfit analysis");
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("outfit-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
