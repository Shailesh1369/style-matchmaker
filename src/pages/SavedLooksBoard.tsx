import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Trash2, StickyNote, Share2, ChevronDown, ChevronUp,
  Sparkles, ArrowLeft, Plus, Eye, X
} from "lucide-react";
import BodyTypeReference from "@/components/BodyTypeReference";

interface SavedLook {
  id: string;
  outfit_name: string;
  clothing_items: string[];
  color_palette: string[];
  why_it_suits: string | null;
  occasions: string[];
  vibe_filter: string | null;
  notes: string | null;
  created_at: string;
}

interface SavedLooksBoardProps {
  onBack: () => void;
  onNewSearch: () => void;
  gender?: string | null;
  bodyShape?: string;
}

export default function SavedLooksBoard({ onBack, onNewSearch, gender, bodyShape }: SavedLooksBoardProps) {
  const { user } = useAuth();
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [viewingLook, setViewingLook] = useState<SavedLook | null>(null);

  useEffect(() => {
    fetchLooks();
  }, [user]);

  const fetchLooks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_looks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load saved looks");
    else setLooks(data || []);
    setLoading(false);
  };

  const deleteLook = async (id: string) => {
    const { error } = await supabase.from("saved_looks").delete().eq("id", id);
    if (error) toast.error("Failed to delete look");
    else {
      setLooks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Look removed from board");
    }
  };

  const saveNote = async (id: string) => {
    const { error } = await supabase
      .from("saved_looks")
      .update({ notes: noteText })
      .eq("id", id);
    if (error) toast.error("Failed to save note");
    else {
      setLooks((prev) => prev.map((l) => l.id === id ? { ...l, notes: noteText } : l));
      setEditingNoteId(null);
      toast.success("Note saved ✨");
    }
  };

  const shareOutfit = async (look: SavedLook) => {
    const text = `✨ StyleMatch Look: "${look.outfit_name}"\n\n🎨 ${look.color_palette.join(", ")}\n\n👗 Items:\n${look.clothing_items.map((i) => `• ${i}`).join("\n")}\n\n💡 ${look.why_it_suits || ""}`;
    if (navigator.share) {
      await navigator.share({ title: look.outfit_name, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const OCCASION_LABELS: Record<string, string> = {
    casual: "☀️ Casual",
    date_night: "🌙 Date Night",
    office: "💼 Office",
    wedding: "💍 Formal",
    festival: "🎪 Festival",
    gym: "🏋️ Gym",
    travel: "✈️ Travel",
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-float text-5xl">📌</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black">My Style Board</h1>
          <p className="text-xs text-muted-foreground">{looks.length} saved look{looks.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={onNewSearch}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blush text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {looks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <div className="w-24 h-24 rounded-3xl bg-blush-light flex items-center justify-center text-5xl">
            📌
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black mb-2">Your board is empty</h2>
            <p className="text-muted-foreground">Swipe right on outfit recommendations to save them here</p>
          </div>
          <Button
            onClick={onNewSearch}
            className="h-14 rounded-2xl px-8 text-base font-bold bg-primary text-primary-foreground"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Get Style Recommendations
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="columns-1 sm:columns-2 gap-4 space-y-4">
            {looks.map((look) => {
              const isExpanded = expandedId === look.id;
              return (
                <div
                  key={look.id}
                  className="break-inside-avoid bg-card rounded-3xl border border-border shadow-card overflow-hidden"
                >
                  {/* Color bar */}
                  <div className="h-2 flex">
                    {look.color_palette.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: `hsl(${(i * 60 + 340) % 360}, 50%, ${55 + i * 8}%)` }}
                      />
                    ))}
                  </div>

                  <div className="p-5">
                    {/* Name & occasions */}
                    <div className="mb-3">
                      <h3 className="font-black text-lg leading-tight mb-2">{look.outfit_name}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {look.occasions?.slice(0, 3).map((occ) => (
                          <span key={occ} className="text-[10px] font-medium px-2 py-0.5 bg-blush-light text-blush rounded-full">
                            {OCCASION_LABELS[occ] || occ}
                          </span>
                        ))}
                        {look.vibe_filter && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-sand rounded-full text-muted-foreground capitalize">
                            {look.vibe_filter}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Color swatches */}
                    <div className="flex gap-2 mb-4">
                      {look.color_palette.map((name, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            className="w-7 h-7 rounded-lg border border-white shadow-sm"
                            style={{ backgroundColor: `hsl(${(i * 60 + 340) % 360}, 50%, ${55 + i * 8}%)` }}
                          />
                          <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[40px]">{name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Items preview */}
                    <div className="space-y-1.5 mb-4">
                      {(isExpanded ? look.clothing_items : look.clothing_items.slice(0, 2)).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blush flex-shrink-0" />
                          <p className="text-xs text-foreground">{item}</p>
                        </div>
                      ))}
                      {!isExpanded && look.clothing_items.length > 2 && (
                        <p className="text-xs text-muted-foreground pl-3.5">
                          +{look.clothing_items.length - 2} more items
                        </p>
                      )}
                    </div>

                    {/* Expanded: Why it suits + notes */}
                    {isExpanded && (
                      <div className="space-y-3">
                        {look.why_it_suits && (
                          <div className="bg-blush-light rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-blush mb-1">Why it works for you</p>
                            <p className="text-xs text-foreground">{look.why_it_suits}</p>
                          </div>
                        )}

                        {/* Notes */}
                        {editingNoteId === look.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="e.g. Buy this for Diwali..."
                              className="w-full text-xs p-3 rounded-xl border border-blush bg-card resize-none focus:outline-none focus:ring-2 focus:ring-blush/30"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveNote(look.id)}
                                className="flex-1 rounded-xl text-xs h-8 bg-blush text-white hover:opacity-90"
                              >
                                Save Note
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingNoteId(null)}
                                className="rounded-xl text-xs h-8"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteId(look.id);
                              setNoteText(look.notes || "");
                            }}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            {look.notes ? look.notes : "Add a note..."}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : look.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? "Less" : "More"}
                      </button>
                      <button
                        onClick={() => setViewingLook(look)}
                        className="flex items-center gap-1 text-xs font-semibold text-blush hover:opacity-80"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Look
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => shareOutfit(look)}
                        className="w-8 h-8 rounded-xl bg-sand flex items-center justify-center hover:bg-sand-dark transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteLook(look.id)}
                        className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3D View Final Look Modal */}
      {viewingLook && (
        <div className="fixed inset-0 z-50 bg-background/95 flex flex-col animate-in fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-black">{viewingLook.outfit_name}</h2>
            <button onClick={() => setViewingLook(null)} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-4">
            <BodyTypeReference
              gender={gender || "female"}
              bodyShape={bodyShape || "rectangle"}
              colors={viewingLook.color_palette.map((_, i) => `hsl(${(i * 60 + 340) % 360}, 50%, ${55 + i * 8}%)`)}
              className="h-full max-h-[40vh]"
            />
          </div>
          <div className="p-4 border-t border-border space-y-3 max-h-[35vh] overflow-y-auto">
            <div className="flex gap-2 flex-wrap">
              {viewingLook.occasions.map((occ) => (
                <span key={occ} className="text-[10px] font-medium px-2 py-0.5 bg-blush-light text-blush rounded-full">
                  {occ}
                </span>
              ))}
            </div>
            <div className="space-y-1.5">
              {viewingLook.clothing_items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blush flex-shrink-0" />
                  <p className="text-xs text-foreground">{item}</p>
                </div>
              ))}
            </div>
            {viewingLook.why_it_suits && (
              <div className="bg-blush-light rounded-xl p-3">
                <p className="text-[10px] font-semibold text-blush mb-1">Why it works</p>
                <p className="text-xs text-foreground">{viewingLook.why_it_suits}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
