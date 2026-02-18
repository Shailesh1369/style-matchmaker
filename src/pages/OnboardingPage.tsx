import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Upload, ChevronRight, ChevronLeft, Check, X } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const BODY_SHAPES = [
  { id: "hourglass", label: "Hourglass", emoji: "⌛", desc: "Defined waist, balanced bust & hips" },
  { id: "pear", label: "Pear", emoji: "🍐", desc: "Hips wider than shoulders" },
  { id: "apple", label: "Apple", emoji: "🍎", desc: "Fuller midsection, slimmer legs" },
  { id: "rectangle", label: "Rectangle", emoji: "▭", desc: "Balanced, athletic proportions" },
  { id: "inverted_triangle", label: "Inverted Triangle", emoji: "🔺", desc: "Broad shoulders, narrow hips" },
];

const SKIN_TONES = [
  { id: "fair", label: "Fair", color: "#FDDBB4" },
  { id: "light", label: "Light", color: "#F5C5A3" },
  { id: "medium", label: "Medium", color: "#D4956A" },
  { id: "tan", label: "Tan", color: "#C17F5A" },
  { id: "deep", label: "Deep", color: "#8B5E3C" },
  { id: "rich", label: "Rich", color: "#4A2C17" },
];

const STYLE_KEYWORDS = [
  "Streetwear", "Minimalist", "Boho", "Elegant", "Y2K",
  "Office Chic", "Cottagecore", "Athleisure", "Vintage", "Romantic",
  "Preppy", "Edgy", "Coastal", "Dark Academia", "Maximalist"
];

interface OnboardingPageProps {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [bodyShape, setBodyShape] = useState("");
  const [height, setHeight] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [styleKeywords, setStyleKeywords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraMode(true);
    } catch {
      toast.error("Camera access denied. Please upload a photo instead.");
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(blob));
      stopCamera();
    }, "image/jpeg");
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraMode(false);
  };

  const toggleKeyword = (kw: string) => {
    setStyleKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/profile.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = data.publicUrl;
      }

      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: user.user_metadata?.display_name || "",
        body_shape: bodyShape,
        height_cm: height ? parseInt(height) : null,
        skin_tone: skinTone,
        style_keywords: styleKeywords,
        photo_url: photoUrl,
      }, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Profile saved! Let's find your style. ✨");
      onComplete();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return true; // photo is optional
    if (step === 2) return !!bodyShape;
    if (step === 3) return !!skinTone && !!height;
    if (step === 4) return styleKeywords.length >= 1;
    return false;
  };

  const next = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else handleSave();
  };

  const prev = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">S</span>
        </div>
        <span className="font-black text-xl tracking-tight">StyleMatch</span>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? "bg-blush" : "bg-sand-dark"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Step {step} of 4</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {/* Step 1: Photo */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black mb-2">Add your photo</h1>
              <p className="text-muted-foreground">Optional — helps us give better style tips based on your look</p>
            </div>

            {cameraMode ? (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-3xl bg-foreground aspect-[3/4] object-cover"
                />
                <div className="flex gap-3">
                  <Button onClick={capturePhoto} className="flex-1 h-12 rounded-xl bg-blush text-white hover:opacity-90">
                    <Camera className="w-4 h-4 mr-2" /> Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="h-12 rounded-xl">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : photoPreview ? (
              <div className="space-y-4">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full rounded-3xl aspect-[3/4] object-cover"
                />
                <Button
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" /> Remove Photo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[3/4] max-h-72 rounded-3xl border-2 border-dashed border-blush bg-blush-light flex flex-col items-center justify-center gap-4 hover:bg-blush/10 transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blush/20 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blush" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Upload a photo</p>
                    <p className="text-sm text-muted-foreground">Full body works best</p>
                  </div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-blush text-blush hover:bg-blush/5"
                >
                  <Camera className="w-4 h-4 mr-2" /> Mirror Mode — Take a Live Photo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Body Shape */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black mb-2">Your body shape</h1>
              <p className="text-muted-foreground">Select what resonates most with you</p>
            </div>
            <div className="space-y-3">
              {BODY_SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => setBodyShape(shape.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    bodyShape === shape.id
                      ? "border-blush bg-blush-light"
                      : "border-border bg-card hover:border-blush/40"
                  }`}
                >
                  <span className="text-3xl">{shape.emoji}</span>
                  <div>
                    <p className="font-bold">{shape.label}</p>
                    <p className="text-sm text-muted-foreground">{shape.desc}</p>
                  </div>
                  {bodyShape === shape.id && (
                    <Check className="w-5 h-5 text-blush ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Height & Skin Tone */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-black mb-2">Your details</h1>
              <p className="text-muted-foreground">Helps tailor fabric and proportions</p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Height (cm)</Label>
              <Input
                type="number"
                placeholder="e.g. 165"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="h-12 rounded-xl"
                min="100"
                max="250"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold">Skin Tone</Label>
              <div className="grid grid-cols-3 gap-3">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSkinTone(tone.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      skinTone === tone.id ? "border-blush" : "border-border"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: tone.color }}
                    />
                    <span className="text-xs font-medium">{tone.label}</span>
                    {skinTone === tone.id && (
                      <Check className="w-3 h-3 text-blush -mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Style Keywords */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black mb-2">Your vibe ✨</h1>
              <p className="text-muted-foreground">Pick styles you love (choose as many as you like)</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {STYLE_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  onClick={() => toggleKeyword(kw)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                    styleKeywords.includes(kw)
                      ? "bg-blush border-blush text-white"
                      : "bg-card border-border text-foreground hover:border-blush/50"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
            {styleKeywords.length > 0 && (
              <p className="text-sm text-blush font-medium">
                {styleKeywords.length} style{styleKeywords.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="p-6 flex gap-3">
        {step > 1 && (
          <Button
            onClick={prev}
            variant="outline"
            className="h-14 w-14 rounded-2xl p-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <Button
          onClick={next}
          disabled={!canProceed() || saving}
          className="flex-1 h-14 rounded-2xl text-base font-bold bg-primary text-primary-foreground hover:opacity-90"
        >
          {saving ? "Saving..." : step === 4 ? "Find My Style 🎉" : (
            <span className="flex items-center gap-2">
              {step === 1 ? (photoPreview ? "Looks great!" : "Skip for now") : "Continue"}
              <ChevronRight className="w-5 h-5" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
