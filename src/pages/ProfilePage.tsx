import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Share2, Save, User, Palette, Ruler, Calendar } from "lucide-react";

interface ProfilePageProps {
  onBack: () => void;
}

const GENDERS = [
  { id: "female", label: "Female", emoji: "👩" },
  { id: "male", label: "Male", emoji: "👨" },
  { id: "non_binary", label: "Non-Binary", emoji: "🧑" },
];

const SKIN_TONES = [
  { id: "fair", label: "Fair", color: "#FDDBB4" },
  { id: "light", label: "Light", color: "#F5C5A3" },
  { id: "medium", label: "Medium", color: "#D4956A" },
  { id: "tan", label: "Tan", color: "#C17F5A" },
  { id: "deep", label: "Deep", color: "#8B5E3C" },
  { id: "rich", label: "Rich", color: "#4A2C17" },
];

const STYLE_KEYWORDS_FEMALE = [
  "Streetwear", "Minimalist", "Boho", "Elegant", "Y2K",
  "Office Chic", "Cottagecore", "Athleisure", "Vintage", "Romantic",
  "Preppy", "Edgy", "Coastal", "Dark Academia", "Maximalist"
];

const STYLE_KEYWORDS_MALE = [
  "Streetwear", "Minimalist", "Smart Casual", "Business", "Techwear",
  "Athleisure", "Vintage", "Preppy", "Edgy", "Coastal",
  "Dark Academia", "Old Money", "Hypebeast", "Workwear", "Military"
];

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [bodyShape, setBodyShape] = useState("");
  const [styleKeywords, setStyleKeywords] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");

  const styleOptions = gender === "male" ? STYLE_KEYWORDS_MALE : STYLE_KEYWORDS_FEMALE;

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setAge(data.age?.toString() || "");
      setGender(data.gender || "");
      setHeightCm(data.height_cm?.toString() || "");
      setSkinTone(data.skin_tone || "");
      setBodyShape(data.body_shape || "");
      setStyleKeywords((data.style_keywords as string[]) || []);
      setDisplayName(data.display_name || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      age: age ? parseInt(age) : null,
      gender,
      height_cm: heightCm ? parseInt(heightCm) : null,
      skin_tone: skinTone,
      body_shape: bodyShape,
      style_keywords: styleKeywords,
      display_name: displayName,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to save");
    else toast.success("Profile updated ✨");
  };

  const handleReferFriend = async () => {
    const text = `Hey! Check out StyleMatch — an AI-powered fashion stylist that curates outfits based on your body, skin tone & style. Try it: ${window.location.origin}`;
    if (navigator.share) {
      await navigator.share({ title: "StyleMatch", text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Referral link copied!");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const toggleKeyword = (kw: string) => {
    setStyleKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-float text-5xl">👤</div>
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
          <h1 className="text-2xl font-black">My Profile</h1>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        {/* Display Name */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2 text-blush">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Personal Info</span>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="h-11 rounded-xl bg-muted border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Age
              </Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                min="13"
                max="100"
                className="h-11 rounded-xl bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Height (cm)
              </Label>
              <Input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                min="100"
                max="250"
                className="h-11 rounded-xl bg-muted border-border"
              />
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blush">Gender</span>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGender(g.id);
                  setStyleKeywords([]);
                }}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  gender === g.id ? "border-blush bg-blush-light" : "border-border bg-muted"
                }`}
              >
                <span className="text-xl">{g.emoji}</span>
                <span className="text-xs font-semibold">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skin Tone */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2 text-blush">
            <Palette className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Skin Tone</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {SKIN_TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSkinTone(t.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                  skinTone === t.id ? "border-blush" : "border-transparent"
                }`}
              >
                <div className="w-8 h-8 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: t.color }} />
                <span className="text-[10px]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style Taste History */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blush">Style Preferences</span>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((kw) => (
              <button
                key={kw}
                onClick={() => toggleKeyword(kw)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  styleKeywords.includes(kw)
                    ? "bg-blush border-blush text-white"
                    : "bg-muted border-border text-muted-foreground hover:border-blush/50"
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-2xl text-base font-bold bg-blush text-white hover:opacity-90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>

        {/* Refer a Friend */}
        <button
          onClick={handleReferFriend}
          className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border hover:border-blush/40 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center">
            <Share2 className="w-5 h-5 text-blush" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-sm">Refer a Friend</p>
            <p className="text-xs text-muted-foreground">Share StyleMatch with friends</p>
          </div>
        </button>

        {/* Log Out */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full h-12 rounded-2xl text-base font-semibold border-destructive text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
