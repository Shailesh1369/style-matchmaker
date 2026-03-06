import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, X, Loader2, RotateCcw, BookmarkCheck, Shirt } from "lucide-react";
import OutfitIllustration from "@/components/OutfitIllustration";

interface OutfitItem {
  type: string;
  description: string;
}

interface Outfit {
  name: string;
  items: OutfitItem[];
  colors: string[];
  colorNames: string[];
  why: string;
  occasion: string;
  inspiration?: string;
}

interface StyleResultsProps {
  profile: {
    body_shape: string;
    height_cm: number | null;
    skin_tone: string;
    style_keywords: string[];
    gender: string | null;
  };
  occasions: string[];
  vibeFilter: string;
  onGoToBoard: () => void;
  onBack: () => void;
}

const TYPE_EMOJI: Record<string, string> = {
  Top: "👕", Bottom: "👖", Footwear: "👟", Outerwear: "🧥", Accessory: "💍", Layering: "🧣", Innerwear: "👔", Item: "✦",
  Kurta: "👕", Blazer: "🧥", "T-Shirt": "👕", "Polo Shirt": "👕", Henley: "👕", "Crop Top": "👕", "Button-Down Shirt": "👔",
  Hoodie: "🧥", Sweatshirt: "🧥", "Tank Top": "👕", Shacket: "🧥", "Denim Jacket": "🧥", "Leather Jacket": "🧥", "Trench Coat": "🧥",
  Chinos: "👖", "Cargo Pants": "👖", "Palazzo Pants": "👖", "Skinny Jeans": "👖", "Wide-Leg Trousers": "👖", "Pleated Skirt": "👗",
  Sneakers: "👟", "Chelsea Boots": "👢", Loafers: "👞", Heels: "👠", Mules: "👡", Sandals: "👡",
  "Crossbody Bag": "👜", Watch: "⌚", "Statement Earrings": "💎", Belt: "🔗", Sunglasses: "🕶️",
};

export default function StyleResults({
  profile,
  occasions,
  vibeFilter,
  onGoToBoard,
  onBack,
}: StyleResultsProps) {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setCurrentIndex(0);
    setDone(false);
    setSavedCount(0);
    try {
      const { data, error } = await supabase.functions.invoke("style-recommendations", {
        body: {
          bodyShape: profile.body_shape,
          occasions,
          skinTone: profile.skin_tone,
          styleKeywords: profile.style_keywords,
          vibeFilter,
          heightCm: profile.height_cm,
          gender: profile.gender,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setOutfits(data.outfits || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get recommendations";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const saveOutfit = async (outfit: Outfit) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("saved_looks").insert({
        user_id: user.id,
        outfit_name: outfit.name,
        clothing_items: outfit.items.map((i) => `${i.type}: ${i.description}`),
        color_palette: outfit.colorNames,
        color_hex: outfit.colors,
        why_it_suits: outfit.why,
        occasions,
        vibe_filter: vibeFilter,
      } as any);
      if (error) throw error;
      setSavedCount((c) => c + 1);
      toast.success(`💾 "${outfit.name}" saved to your board!`);
    } catch {
      toast.error("Failed to save outfit");
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (currentIndex >= outfits.length) return;
    const outfit = outfits[currentIndex];

    setSwipeDir(direction);
    if (direction === "right") await saveOutfit(outfit);

    setTimeout(() => {
      setSwipeDir(null);
      if (currentIndex + 1 >= outfits.length) setDone(true);
      else setCurrentIndex((i) => i + 1);
    }, 350);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center flex-col gap-6">
        <div className="animate-float">
          <div className="w-20 h-20 rounded-3xl bg-blush flex items-center justify-center shadow-soft">
            <span className="text-4xl">✨</span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black mb-2">Curating your looks...</h2>
          <p className="text-muted-foreground">Our AI stylist is at work</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-blush" />
      </div>
    );
  }

  if (done || outfits.length === 0) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center flex-col gap-6 p-6">
        <div className="w-24 h-24 rounded-3xl bg-blush-light flex items-center justify-center text-5xl">
          🎉
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black mb-2">You're all done!</h2>
          <p className="text-muted-foreground mb-1">
            {savedCount > 0
              ? `You saved ${savedCount} outfit${savedCount > 1 ? "s" : ""} to your board`
              : outfits.length === 0
              ? "No outfits were generated. Try different options."
              : "You skipped all looks this time"}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {savedCount > 0 && (
            <Button
              onClick={onGoToBoard}
              className="h-14 rounded-2xl text-base font-bold bg-blush text-secondary-foreground hover:opacity-90"
            >
              <BookmarkCheck className="w-5 h-5 mr-2" /> View Saved Looks
            </Button>
          )}
          <Button
            onClick={fetchRecommendations}
            variant="outline"
            className="h-14 rounded-2xl text-base font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Get New Recommendations
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            className="h-12 rounded-2xl text-muted-foreground"
          >
            Change Occasion
          </Button>
        </div>
      </div>
    );
  }

  const current = outfits[currentIndex];

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Your Looks</h1>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {outfits.length} · Swipe to save
          </p>
        </div>
        <button
          onClick={onGoToBoard}
          className="flex items-center gap-1.5 text-sm text-blush font-semibold"
        >
          <BookmarkCheck className="w-4 h-4" />
          Board {savedCount > 0 && `(${savedCount})`}
        </button>
      </div>

      {/* Card */}
      <div className="flex-1 px-6 pb-4 flex flex-col">
        <div
          className={`flex-1 bg-card rounded-3xl shadow-card border border-border p-6 flex flex-col gap-5 transition-all overflow-y-auto ${
            swipeDir === "left"
              ? "animate-swipe-left"
              : swipeDir === "right"
              ? "animate-swipe-right"
              : ""
          }`}
        >
          {/* AI Fashion Illustration */}
          <div className="h-56 rounded-2xl overflow-hidden bg-muted/30 border border-border mb-2">
            <OutfitIllustration
              gender={profile.gender}
              bodyShape={profile.body_shape}
              items={current.items}
              colors={current.colors}
              colorNames={current.colorNames}
              occasion={current.occasion}
              className="h-full"
            />
          </div>

          {/* Outfit name & occasion */}
          <div>
            <div className="inline-block px-3 py-1 bg-blush-light rounded-full text-xs font-semibold text-blush mb-3">
              {current.occasion}
            </div>
            <h2 className="text-2xl font-black leading-tight">{current.name}</h2>
          </div>

          {/* Color Palette */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Color Palette</p>
            <div className="flex gap-3 items-center">
              {current.colors.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 rounded-xl shadow-md border border-border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{current.colorNames?.[i] || ""}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clothing Items — categorized */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5" /> The Look
            </p>
            <div className="space-y-3">
              {current.items.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{TYPE_EMOJI[item.type] || "✦"}</span>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blush">{item.type}</span>
                      <p className="text-sm font-medium text-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pl-8">
                    {[
                      { name: "Myntra", url: `https://www.myntra.com/${encodeURIComponent(item.description)}` },
                      { name: "Ajio", url: `https://www.ajio.com/search/?text=${encodeURIComponent(item.description)}` },
                      { name: "Amazon", url: `https://www.amazon.in/s?k=${encodeURIComponent(item.description)}` },
                    ].map((store) => (
                      <a
                        key={store.name}
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground hover:text-blush hover:border-blush transition-all"
                      >
                        {store.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why it suits */}
          <div className="bg-blush-light rounded-2xl p-4 mt-auto">
            <p className="text-xs font-semibold text-blush mb-1">Why it works for you</p>
            <p className="text-sm text-foreground leading-relaxed">{current.why}</p>
            {current.inspiration && (
              <p className="text-[10px] text-muted-foreground mt-2 italic">✦ Inspired by: {current.inspiration}</p>
            )}
          </div>
        </div>

        {/* Swipe Buttons */}
        <div className="flex gap-4 mt-5 items-center justify-center">
          <button
            onClick={() => handleSwipe("left")}
            className="w-16 h-16 rounded-full bg-card border-2 border-border shadow-card flex items-center justify-center hover:border-destructive hover:bg-destructive/5 transition-all group"
          >
            <X className="w-6 h-6 text-muted-foreground group-hover:text-destructive" />
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-[10px] text-muted-foreground">Skip</p>
            <div className="w-px h-8 bg-border" />
            <p className="text-[10px] text-muted-foreground">Save</p>
          </div>
          <button
            onClick={() => handleSwipe("right")}
            className="w-16 h-16 rounded-full bg-blush shadow-soft flex items-center justify-center hover:opacity-90 transition-all"
          >
            <Heart className="w-6 h-6 text-secondary-foreground" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mt-4">
          {outfits.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-6 bg-blush" : i < currentIndex ? "w-1.5 bg-blush/40" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
