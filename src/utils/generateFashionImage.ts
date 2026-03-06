// generateFashionImage.ts
// Place this in src/utils/generateFashionImage.ts

interface FashionImageParams {
  gender: string;
  bodyShape: string;
  occasion: string;
  outfitItems: string[];   // e.g. ["blazer", "chinos", "boots"]
  colors: string[];        // e.g. ["Charcoal Grey", "Navy Blue", "Black"]
}

export async function generateFashionImage(
  params: FashionImageParams
): Promise<string | null> {
  const { gender, bodyShape, occasion, outfitItems, colors } = params;

  // Build a rich fashion prompt from outfit data
  const outfitDescription = outfitItems
    .map((item, i) => `${item} in ${colors[i] || colors[0]}`)
    .join(", ");

  const prompt = `Full body fashion editorial illustration of a ${gender} model with ${bodyShape} body type, wearing ${outfitDescription}, styled for ${occasion}, clean minimal studio background, high fashion magazine editorial style, sharp clothing details, elegant confident pose, professional fashion photography lighting`;

  const negativePrompt =
    "deformed, blurry, bad anatomy, extra limbs, watermark, text, logo, ugly, duplicate, mutated, cartoon, anime";

  try {
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: negativePrompt, weight: -1 },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 768,       // Portrait ratio — better for full body fashion
          steps: 30,
          samples: 1,
          style_preset: "fashion",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Stability AI error:", error);
      return null;
    }

    const data = await response.json();
    const base64Image = data.artifacts?.[0]?.base64;

    if (!base64Image) return null;

    // Return as a usable image src
    return `data:image/png;base64,${base64Image}`;
  } catch (err) {
    console.error("Fashion image generation failed:", err);
    return null;
  }
}
