import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BodyTypeReference from "@/components/BodyTypeReference";

interface OutfitItem {
  type: string;
  description: string;
}

interface OutfitIllustrationProps {
  gender: string | null;
  bodyShape: string;
  items: OutfitItem[];
  colors: string[];
  colorNames: string[];
  occasion: string;
  className?: string;
}

export default function OutfitIllustration({
  gender,
  bodyShape,
  items,
  colors,
  colorNames,
  occasion,
  className = "",
}: OutfitIllustrationProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      setLoading(true);
      setFailed(false);
      setImageUrl(null);

      try {
        const { data, error } = await supabase.functions.invoke("generate-outfit-image", {
          body: { gender, bodyShape, items, colors, colorNames, occasion },
        });

        if (cancelled) return;
        if (error || data?.error) {
          console.warn("Outfit image generation failed:", error || data?.error);
          setFailed(true);
          return;
        }

        setImageUrl(data.imageUrl);
      } catch (err) {
        if (!cancelled) {
          console.warn("Outfit image generation error:", err);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    generate();
    return () => { cancelled = true; };
  }, [gender, bodyShape, occasion, JSON.stringify(items), JSON.stringify(colors)]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <Skeleton className="w-32 h-40 rounded-2xl" />
          <div className="flex gap-1">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
          </div>
          <p className="text-[10px] text-muted-foreground animate-pulse">Generating illustration…</p>
        </div>
      </div>
    );
  }

  if (failed || !imageUrl) {
    return (
      <BodyTypeReference
        gender={gender}
        bodyShape={bodyShape}
        colors={colors}
        colorNames={colorNames}
        className={className}
        showColorLegend
      />
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={imageUrl}
        alt={`AI-generated fashion illustration for ${occasion}`}
        className="h-full w-auto max-w-full object-contain rounded-2xl"
        loading="lazy"
      />
    </div>
  );
}
