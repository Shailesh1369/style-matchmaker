import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bodyShape, occasions, skinTone, styleKeywords, vibeFilter, heightCm } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const occasionLabels = occasions.join(", ");
    const keywordsStr = (styleKeywords || []).join(", ");
    const vibeDesc = {
      minimal: "clean, minimal, understated — avoid loud patterns or excess accessories",
      bold: "bold, high-impact, statement pieces — embrace color, patterns, and drama",
      classic: "timeless, elegant, classic — think tailored cuts and quality basics",
      trendy: "on-trend, fashion-forward, zeitgeist — current runway influences",
    }[vibeFilter] || "balanced and versatile";

    const systemPrompt = `You are StyleMatch, a world-class AI fashion stylist with expertise in body-inclusive fashion, color theory, and personal styling. Your recommendations are practical, specific, and empowering. You create looks that celebrate the wearer's unique features.`;

    const userPrompt = `Create 5 curated outfit ideas for someone with the following profile:
- Body shape: ${bodyShape}
- Height: ${heightCm ? heightCm + "cm" : "not specified"}
- Skin tone: ${skinTone}
- Style preferences: ${keywordsStr || "open to suggestions"}
- Occasion(s): ${occasionLabels}
- Vibe filter: ${vibeDesc}

Return ONLY a valid JSON array (no markdown, no code blocks) with exactly 5 outfits. Each outfit must follow this exact structure:
[
  {
    "name": "outfit name (creative, catchy)",
    "items": ["item 1", "item 2", "item 3", "item 4"],
    "colors": ["#hex1", "#hex2", "#hex3"],
    "colorNames": ["Color Name 1", "Color Name 2", "Color Name 3"],
    "why": "2-3 sentences explaining why this specifically flatters their body shape and suits their skin tone",
    "occasion": "best occasion for this look"
  }
]

Make each outfit distinct and genuinely stylish. Be specific about cuts, fabrics, and silhouettes. Explain WHY each piece flatters the body shape.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed. Please top up in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from AI");

    // Parse the JSON response
    let outfits;
    try {
      // Strip any markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      outfits = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse outfit recommendations");
    }

    return new Response(JSON.stringify({ outfits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("style-recommendations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
