// FashionIllustration.tsx
// Place this in src/components/FashionIllustration.tsx
// Use this INSTEAD of BodyTypeReference on the results card

import { useEffect, useState } from "react";
import { generateFashionImage } from "@/utils/generateFashionImage";

interface FashionIllustrationProps {
  gender: string;
  bodyShape: string;
  occasion: string;
  outfitItems: string[];
  colors: string[];
  colorNames: string[];
}

export default function FashionIllustration({
  gender,
  bodyShape,
  occasion,
  outfitItems,
  colors,
  colorNames,
}: FashionIllustrationProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchImage() {
      setLoading(true);
      setFailed(false);

      const url = await generateFashionImage({
        gender,
        bodyShape,
        occasion,
        outfitItems,
        colors: colorNames.length ? colorNames : colors,
      });

      if (cancelled) return;

      if (url) {
        setImageUrl(url);
      } else {
        setFailed(true);
      }
      setLoading(false);
    }

    fetchImage();
    return () => { cancelled = true; };
  }, [gender, bodyShape, occasion, outfitItems.join(","), colors.join(",")]);

  // Loading skeleton
  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "320px",
          borderRadius: "1rem",
          background: "linear-gradient(90deg, #1a1a2e 25%, #2a2a3e 50%, #1a1a2e 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: "13px",
        }}
      >
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        ✨ Generating your look...
      </div>
    );
  }

  // Fallback — if generation fails, show a clean lookbook card
  if (failed || !imageUrl) {
    return (
      <div
        style={{
          width: "100%",
          borderRadius: "1rem",
          background: "#111",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Color palette strip */}
        <div style={{ display: "flex", gap: "8px" }}>
          {colors.map((color, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "2px solid rgba(255,255,255,0.15)",
                }}
              />
              <span style={{ fontSize: "9px", color: "#888" }}>
                {colorNames[i] || color}
              </span>
            </div>
          ))}
        </div>

        {/* Outfit items with color dots */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {outfitItems.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: colors[i] || colors[0],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "13px", color: "#ccc" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Success — show the AI generated fashion illustration
  return (
    <div style={{ width: "100%", borderRadius: "1rem", overflow: "hidden" }}>
      <img
        src={imageUrl}
        alt="AI generated outfit illustration"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: "1rem",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
