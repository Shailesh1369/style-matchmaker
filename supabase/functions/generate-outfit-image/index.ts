import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashPrompt(prompt: string): Promise<string> {
  const encoded = new TextEncoder().encode(prompt);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user from JWT
    const token = authHeader.replace("Bearer ", "");
    const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { gender, bodyShape, items, colors, colorNames, occasion } = await req.json();

    // Build prompt
    const genderLabel = gender === "male" ? "male" : gender === "female" ? "female" : "";
    const itemDescriptions = (items || [])
      .slice(0, 4)
      .map((item: { type: string; description: string }, i: number) => {
        const color = colorNames?.[i] || colors?.[i] || "";
        return `${item.description}${color ? ` in ${color}` : ""}`;
      })
      .join(", ");

    const prompt = `Full body fashion editorial illustration of a ${genderLabel} model with ${bodyShape} body type, wearing ${itemDescriptions}, styled for ${occasion}, clean minimal studio background, high fashion magazine style, sharp details, elegant standing pose, full body visible from head to toe`;

    const promptHash = await hashPrompt(prompt);

    // Check cache
    const { data: cached } = await supabase
      .from("outfit_images")
      .select("image_url")
      .eq("prompt_hash", promptHash)
      .maybeSingle();

    if (cached?.image_url) {
      return new Response(JSON.stringify({ imageUrl: cached.image_url, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate image via Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI image generation failed:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI image generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) throw new Error("No image returned from AI");

    // Extract base64 and upload to storage
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image data format");

    const ext = base64Match[1];
    const base64 = base64Match[2];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const filePath = `outfit-illustrations/${user.id}/${promptHash}.${ext}`;

    // Ensure bucket exists (ignore error if it already does)
    await supabase.storage.createBucket("outfit-images", { public: true }).catch(() => {});

    const { error: uploadError } = await supabase.storage
      .from("outfit-images")
      .upload(filePath, bytes, {
        contentType: `image/${ext}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload generated image");
    }

    const { data: publicUrlData } = supabase.storage
      .from("outfit-images")
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    // Cache in DB
    await supabase.from("outfit_images").upsert(
      { user_id: user.id, prompt_hash: promptHash, image_url: imageUrl },
      { onConflict: "prompt_hash" }
    );

    return new Response(JSON.stringify({ imageUrl, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-outfit-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
