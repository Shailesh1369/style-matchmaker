// generateFashionImage.ts
// Place this in src/utils/generateFashionImage.ts

interface FashionImageParams {
  gender: string;
  bodyShape: string;
  occasion: string;
  outfitItems: string[];
  colors: string[];
}

export async function generateFashionImage(
  params: FashionImageParams
): Promise<string | null> {
  const { gender, bodyShape, occasion, outfitItems, colors } = params;

  // Build strong gender-specific terms so the model never gets confused
  const isMale = gender?.toLowerCase() === "male";

  const genderTerms = isMale
    ? {
        subject: "man, male model, masculine figure",
        body: "male body, men's fashion",
        pronoun: "men's clothing, menswear",
      }
    : {
        subject: "woman, female model, feminine figure",
        body: "female body, women's fashion",
        pronoun: "women's clothing, womenswear",
      };

  const negativeGender = isMale
    ? "woman, female, girl, feminine, dress, skirt, heels"
    : "man, male, boy, masculine, suit and tie";

  const outfitDescription = outfitItems
    .map((item, i) => `${item} in ${colors[i] || colors[0]}`)
    .join(", ");

  const prompt = `${genderTerms.subject}, ${genderTerms.body}, ${bodyShape} body type, ${genderTerms.pronoun}, wearing ${outfitDescription}, styled for ${occasion}, full body shot, clean minimal studio background, high fashion magazine editorial style, sharp clothing details, elegant confident pose, professional fashion photography lighting`;

  const negativePrompt = `${negativeGender}, deformed, blurry, bad anatomy, extra limbs, watermark, text, logo, ugly, duplicate, mutated, cartoon, anime, wrong gender`;

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
          cfg_scale: 10,   // Higher = model follows prompt more strictly
          height: 1024,
          width: 768,
          steps: 35,       // More steps = more accurate to prompt
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

    return `data:image/png;base64,${base64Image}`;
  } catch (err) {
    console.error("Fashion image generation failed:", err);
    return null;
  }
}
