import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bodyShape, occasions, skinTone, styleKeywords, vibeFilter, heightCm, gender } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const occasionLabels = occasions.join(", ");
    const keywordsStr = (styleKeywords || []).join(", ");

    const vibeDesc = {
      minimal: "clean, minimal, understated — avoid loud patterns or excess accessories. Think Bottega Veneta quiet luxury, Toteme, COS.",
      bold: "bold, high-impact, statement pieces — embrace color, patterns, and drama. Think Valentino, Versace, Off-White.",
      classic: "timeless, elegant, classic — tailored cuts and quality basics. Think Ralph Lauren, Brunello Cucinelli, The Row.",
      trendy: "on-trend, fashion-forward, zeitgeist — current runway and street style influences. Think what's trending on Pinterest and Instagram right now.",
    }[vibeFilter] || "balanced and versatile";

    const genderLabel = gender === "male" ? "man" : gender === "female" ? "woman" : "person";
    const genderPronoun = gender === "male" ? "him/his" : gender === "female" ? "her/hers" : "them/their";

    const footwearGuidance = gender === "male"
      ? "For footwear, ONLY suggest men's shoes: sneakers, loafers, Chelsea boots, Oxford shoes, derby shoes, monk straps, slides, sandals (men's style), or boots. NEVER suggest heels, pumps, mules, stilettos, wedges, or women's footwear."
      : gender === "female"
      ? "For footwear, suggest women's shoes: heels, pumps, mules, sneakers, ankle boots, sandals, loafers, flats, wedges, or stilettos as appropriate."
      : "For footwear, suggest gender-neutral options: sneakers, boots, loafers, or sandals.";

    const systemPrompt = `You are StyleMatch, a world-class AI fashion stylist with deep expertise in body-inclusive fashion, color theory, and personal styling. You have encyclopaedic knowledge of fashion from Pinterest, Instagram, Vogue, street style, and runway shows. Your recommendations are practical, specific, and empowering.

CRITICAL RULE: ${footwearGuidance}

Always recommend complete, gender-appropriate outfits for a ${genderLabel}. Every single item must be appropriate for ${genderPronoun}.`;

    const userPrompt = `Create 5 curated outfit ideas for a ${genderLabel} with the following profile:
- Gender: ${genderLabel}
- Body shape: ${bodyShape}
- Height: ${heightCm ? heightCm + "cm" : "not specified"}
- Skin tone: ${skinTone}
- Style preferences: ${keywordsStr || "open to suggestions"}
- Occasion(s): ${occasionLabels}
- Vibe filter: ${vibeDesc}

Return ONLY a valid JSON array (no markdown, no code blocks) with exactly 5 outfits. Each outfit MUST follow this exact structure:

[
  {
    "name": "creative editorial outfit name",
    "items": [
      { "type": "Top", "description": "Specific garment with fabric, cut, color detail" },
      { "type": "Bottom", "description": "Specific garment with fabric, cut, color detail" },
      { "type": "Footwear", "description": "Specific gender-appropriate shoe" },
      { "type": "Accessory", "description": "Watch, bag, belt, jewelry etc." }
    ],
    "colors": ["#hex1", "#hex2", "#hex3"],
    "colorNames": ["Color Name 1", "Color Name 2", "Color Name 3"],
    "why": "2-3 sentences explaining why this flatters their body shape and suits their skin tone",
    "occasion": "best occasion for this look",
    "inspiration": "Pinterest/Instagram aesthetic reference"
  }
]

RULES:
- Each outfit MUST have 4-6 items with types from: Top, Bottom, Footwear, Outerwear, Accessory, Layering, Innerwear
- Be VERY specific about cuts, fabrics, fits, and colors (e.g. "Slim-fit dark indigo selvedge denim jeans" not just "jeans")
- ${footwearGuidance}
- Make each outfit distinct and genuinely stylish
- Reference real fashion aesthetics`;

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

    let outfits;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      outfits = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse outfit recommendations");
    }

    // Normalize items: support both old string[] format and new {type, description} format
    outfits = outfits.map((outfit: any) => ({
      ...outfit,
      items: (outfit.items || []).map((item: any) => {
        if (typeof item === "string") {
          return { type: "Item", description: item };
        }
        return { type: item.type || "Item", description: item.description || String(item) };
      }),
    }));

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
