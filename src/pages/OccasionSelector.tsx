import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const OCCASIONS = [
  { id: "casual", label: "Casual Day Out", emoji: "☀️", desc: "Relaxed & effortless" },
  { id: "date_night", label: "Date Night", emoji: "🌙", desc: "Romantic & alluring" },
  { id: "office", label: "Office", emoji: "💼", desc: "Polished & professional" },
  { id: "wedding", label: "Wedding / Formal", emoji: "💍", desc: "Elegant & statement" },
  { id: "festival", label: "Festival", emoji: "🎪", desc: "Bold & expressive" },
  { id: "gym", label: "Gym & Active", emoji: "🏋️", desc: "Functional & stylish" },
  { id: "travel", label: "Travel", emoji: "✈️", desc: "Comfortable & chic" },
];

const VIBE_FILTERS = [
  { id: "minimal", label: "Minimal", desc: "Clean, understated" },
  { id: "bold", label: "Bold", desc: "High-impact looks" },
  { id: "classic", label: "Classic", desc: "Timeless elegance" },
  { id: "trendy", label: "Trendy", desc: "Right now fashion" },
];

interface OccasionSelectorProps {
  onNext: (occasions: string[], vibeFilter: string) => void;
}

export default function OccasionSelector({ onNext }: OccasionSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [vibe, setVibe] = useState("minimal");

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );

  return (
    <div className="flex flex-col min-h-screen gradient-hero">
      <div className="p-6">
        <h1 className="text-3xl font-black mb-1">What's the occasion?</h1>
        <p className="text-muted-foreground text-sm">Pick all that apply — we'll curate outfits for each</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* Occasions */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          {OCCASIONS.map((occ) => (
            <button
              key={occ.id}
              onClick={() => toggle(occ.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                selected.includes(occ.id)
                  ? "border-blush bg-blush-light"
                  : "border-border bg-card hover:border-blush/40"
              }`}
            >
              <span className="text-3xl">{occ.emoji}</span>
              <div className="flex-1">
                <p className="font-bold">{occ.label}</p>
                <p className="text-sm text-muted-foreground">{occ.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selected.includes(occ.id) ? "bg-blush border-blush" : "border-muted-foreground"
              }`}>
                {selected.includes(occ.id) && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Vibe Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-black mb-1">Vibe Filter</h2>
          <p className="text-sm text-muted-foreground mb-4">Sets the AI's style tone</p>
          <div className="grid grid-cols-2 gap-3">
            {VIBE_FILTERS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVibe(v.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  vibe === v.id
                    ? "border-blush bg-blush-light"
                    : "border-border bg-card hover:border-blush/40"
                }`}
              >
                <p className="font-bold capitalize">{v.label}</p>
                <p className="text-xs text-muted-foreground">{v.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <Button
          disabled={selected.length === 0}
          onClick={() => onNext(selected, vibe)}
          className="w-full h-14 rounded-2xl text-base font-bold bg-primary text-primary-foreground hover:opacity-90"
        >
          <span className="flex items-center gap-2">
            Get My Outfit Ideas ✨
            <ChevronRight className="w-5 h-5" />
          </span>
        </Button>
      </div>
    </div>
  );
}
