import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, X, ArrowLeft, Loader2, RotateCcw, Upload } from "lucide-react";

interface CameraAnalysisProps {
  profile: {
    body_shape: string;
    height_cm: number | null;
    skin_tone: string;
    style_keywords: string[];
    gender: string | null;
  };
  onBack: () => void;
}

interface AnalysisResult {
  currentOutfitAnalysis: string;
  improvements: string[];
  suggestedOutfit: {
    name: string;
    items: string[];
    why: string;
  };
  shoppingLinks: { item: string; query: string }[];
}

export default function CameraAnalysis({ profile, onBack }: CameraAnalysisProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      toast.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhoto(dataUrl);
    stopCamera();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!photo) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("outfit-analysis", {
        body: {
          imageBase64: photo,
          bodyShape: profile.body_shape,
          skinTone: profile.skin_tone,
          styleKeywords: profile.style_keywords,
          gender: profile.gender,
          heightCm: profile.height_cm,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data.analysis);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setResult(null);
  };

  const buildShopLink = (query: string, store: string) => {
    const q = encodeURIComponent(query);
    if (store === "myntra") return `https://www.myntra.com/${q}`;
    if (store === "ajio") return `https://www.ajio.com/search/?text=${q}`;
    return `https://www.amazon.in/s?k=${q}`;
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black">Virtual Try-On</h1>
          <p className="text-xs text-muted-foreground">Snap your outfit, get AI suggestions</p>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {result ? (
          /* Results */
          <div className="space-y-5">
            {photo && (
              <img src={photo} alt="Your outfit" className="w-full rounded-2xl aspect-[3/4] object-cover border border-border" />
            )}

            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-blush">Current Outfit Analysis</p>
              <p className="text-sm leading-relaxed">{result.currentOutfitAnalysis}</p>
            </div>

            {result.improvements.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gold">Improvements</p>
                <div className="space-y-2">
                  {result.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-gold text-sm">✦</span>
                      <p className="text-sm">{imp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blush-light rounded-2xl border border-border p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-blush">Suggested Instead</p>
              <h3 className="font-black text-lg">{result.suggestedOutfit.name}</h3>
              <div className="space-y-1.5">
                {result.suggestedOutfit.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blush" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic">{result.suggestedOutfit.why}</p>
            </div>

            {/* Shopping links */}
            {result.shoppingLinks && result.shoppingLinks.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-blush">🛍️ Shop the Look</p>
                <div className="space-y-3">
                  {result.shoppingLinks.map((link, i) => (
                    <div key={i} className="space-y-1.5">
                      <p className="text-sm font-semibold">{link.item}</p>
                      <div className="flex gap-2">
                        {["myntra", "ajio", "amazon"].map((store) => (
                          <a
                            key={store}
                            href={buildShopLink(link.query, store)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground hover:text-blush hover:border-blush transition-all"
                          >
                            {store}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full h-12 rounded-2xl">
              <RotateCcw className="w-4 h-4 mr-2" /> Try Another Photo
            </Button>
          </div>
        ) : analyzing ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20">
            <div className="animate-float">
              <div className="w-20 h-20 rounded-3xl bg-blush flex items-center justify-center shadow-soft">
                <span className="text-4xl">🔍</span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2">Analyzing your outfit...</h2>
              <p className="text-muted-foreground text-sm">Our AI stylist is reviewing your look</p>
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-blush" />
          </div>
        ) : photo ? (
          <div className="space-y-4">
            <img src={photo} alt="Preview" className="w-full rounded-2xl aspect-[3/4] object-cover border border-border" />
            <Button onClick={analyze} className="w-full h-14 rounded-2xl text-base font-bold bg-blush text-white hover:opacity-90">
              ✨ Analyze My Outfit
            </Button>
            <Button onClick={reset} variant="outline" className="w-full h-12 rounded-2xl">
              <X className="w-4 h-4 mr-2" /> Retake
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cameraActive ? (
              <div className="space-y-4">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl aspect-[3/4] object-cover bg-muted" />
                <div className="flex gap-3">
                  <Button onClick={capture} className="flex-1 h-14 rounded-2xl bg-blush text-white hover:opacity-90 text-base font-bold">
                    <Camera className="w-5 h-5 mr-2" /> Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="h-14 rounded-2xl px-5">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-10">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-3xl bg-blush-light mx-auto flex items-center justify-center text-5xl">
                    📸
                  </div>
                  <h2 className="text-2xl font-black">What are you wearing?</h2>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Take a photo of your current outfit and our AI will analyze it and suggest improvements
                  </p>
                </div>
                <Button onClick={startCamera} className="w-full h-14 rounded-2xl text-base font-bold bg-blush text-white hover:opacity-90">
                  <Camera className="w-5 h-5 mr-2" /> Open Camera
                </Button>
                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <span className="relative bg-background px-4 text-xs text-muted-foreground">or</span>
                </div>
                <Button onClick={() => fileRef.current?.click()} variant="outline" className="w-full h-12 rounded-2xl">
                  <Upload className="w-4 h-4 mr-2" /> Upload a Photo
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
