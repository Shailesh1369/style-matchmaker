import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./AuthPage";
import OnboardingPage from "./OnboardingPage";
import OccasionSelector from "./OccasionSelector";
import StyleResults from "./StyleResults";
import SavedLooksBoard from "./SavedLooksBoard";
import ProfilePage from "./ProfilePage";
import CameraAnalysis from "./CameraAnalysis";
import { User, Camera, Compass, BookmarkCheck } from "lucide-react";

type AppScreen = "auth" | "onboarding" | "occasion" | "results" | "board" | "profile" | "camera";

interface Profile {
  body_shape: string;
  height_cm: number | null;
  skin_tone: string;
  style_keywords: string[];
  gender: string | null;
}

// sessionStorage keys
const SK_SCREEN    = "silhouette_screen";
const SK_OCCASIONS = "silhouette_occasions";
const SK_VIBE      = "silhouette_vibe";
const SK_PROFILE   = "silhouette_profile";   // ← NEW

function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function Index() {
  const { user, loading } = useAuth();

  // ── Restore ALL state from sessionStorage on mount ──────────────────────
  const [screen,      setScreen]      = useState<AppScreen>(readSession(SK_SCREEN, "auth"));
  const [profile,     setProfile]     = useState<Profile | null>(readSession<Profile | null>(SK_PROFILE, null));
  const [occasions,   setOccasions]   = useState<string[]>(readSession(SK_OCCASIONS, []));
  const [vibeFilter,  setVibeFilter]  = useState<string>(readSession(SK_VIBE, "minimal"));
  const [checkingProfile, setCheckingProfile] = useState(false);

  // ── Helpers that persist while navigating ───────────────────────────────
  const navigateTo = (s: AppScreen) => {
    sessionStorage.setItem(SK_SCREEN, JSON.stringify(s));
    setScreen(s);
  };

  const persistProfile = (p: Profile) => {
    sessionStorage.setItem(SK_PROFILE, JSON.stringify(p));
    setProfile(p);
  };

  // ── Auth effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigateTo("auth");
      return;
    }

    // If we already have a profile cached AND a valid screen, skip the DB call
    const cachedProfile = readSession<Profile | null>(SK_PROFILE, null);
    const cachedScreen  = readSession<AppScreen>(SK_SCREEN, "auth");

    if (cachedProfile?.body_shape && cachedScreen !== "auth") {
      // Just make sure React state is in sync — no navigation change
      setProfile(cachedProfile);
      return;
    }

    // Fresh load — check DB
    checkUserProfile();
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;
    setCheckingProfile(true);
    const { data } = await supabase
      .from("profiles")
      .select("body_shape, height_cm, skin_tone, style_keywords, gender")
      .eq("user_id", user.id)
      .maybeSingle();
    setCheckingProfile(false);

    if (data?.body_shape) {
      persistProfile(data as Profile);
      navigateTo("occasion");
    } else {
      navigateTo("onboarding");
    }
  };

  const handleOnboardingComplete = async () => {
    await checkUserProfile();
  };

  const handleOccasionNext = (selectedOccasions: string[], selectedVibe: string) => {
    sessionStorage.setItem(SK_OCCASIONS, JSON.stringify(selectedOccasions));
    sessionStorage.setItem(SK_VIBE, JSON.stringify(selectedVibe));
    setOccasions(selectedOccasions);
    setVibeFilter(selectedVibe);
    navigateTo("results");
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-float text-5xl">✨</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (screen === "onboarding") {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  const showBottomNav = ["occasion", "results", "board", "profile", "camera"].includes(screen);

  const renderContent = () => {
    if (screen === "profile") {
      return <ProfilePage onBack={() => navigateTo("occasion")} />;
    }
    if (screen === "camera" && profile) {
      return <CameraAnalysis profile={profile} onBack={() => navigateTo("occasion")} />;
    }
    if (screen === "results" && profile) {
      return (
        <StyleResults
          profile={profile}
          occasions={occasions}
          vibeFilter={vibeFilter}
          onGoToBoard={() => navigateTo("board")}
          onBack={() => navigateTo("occasion")}
        />
      );
    }
    if (screen === "board") {
      return (
        <SavedLooksBoard
          onBack={() => navigateTo("results")}
          onNewSearch={() => navigateTo("occasion")}
          gender={profile?.gender}
          bodyShape={profile?.body_shape}
        />
      );
    }
    return <OccasionSelector onNext={handleOccasionNext} />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-16">
        {renderContent()}
      </div>

      {showBottomNav && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            <button
              onClick={() => navigateTo("occasion")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                screen === "occasion" ? "text-blush" : "text-muted-foreground"
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Explore</span>
            </button>
            <button
              onClick={() => navigateTo("camera")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                screen === "camera" ? "text-blush" : "text-muted-foreground"
              }`}
            >
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Try-On</span>
            </button>
            <button
              onClick={() => navigateTo("board")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                screen === "board" ? "text-blush" : "text-muted-foreground"
              }`}
            >
              <BookmarkCheck className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Saved</span>
            </button>
            <button
              onClick={() => navigateTo("profile")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                screen === "profile" ? "text-blush" : "text-muted-foreground"
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
