mport { useState, useEffect } from "react";
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
const SK_SCREEN = "silhouette_screen";
const SK_OCCASIONS = "silhouette_occasions";
const SK_VIBE = "silhouette_vibe";

export default function Index() {
  const { user, loading } = useAuth();

  // Restore screen from sessionStorage so tab switches don't reset navigation
  const restoredScreen = sessionStorage.getItem(SK_SCREEN) as AppScreen | null;
  const restoredOccasions = sessionStorage.getItem(SK_OCCASIONS);
  const restoredVibe = sessionStorage.getItem(SK_VIBE);

  const [screen, setScreen] = useState<AppScreen>(restoredScreen || "auth");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [occasions, setOccasions] = useState<string[]>(restoredOccasions ? JSON.parse(restoredOccasions) : []);
  const [vibeFilter, setVibeFilter] = useState(restoredVibe || "minimal");
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Persist screen whenever it changes
  const navigateTo = (s: AppScreen) => {
    sessionStorage.setItem(SK_SCREEN, s);
    setScreen(s);
  };

  // Persist occasions + vibe
  const handleOccasionNext = (selectedOccasions: string[], selectedVibe: string) => {
    sessionStorage.setItem(SK_OCCASIONS, JSON.stringify(selectedOccasions));
    sessionStorage.setItem(SK_VIBE, selectedVibe);
    setOccasions(selectedOccasions);
    setVibeFilter(selectedVibe);
    navigateTo("results");
  };

  useEffect(() => {
    if (!user) {
      navigateTo("auth");
      return;
    }
    // If we restored a valid screen from session, just reload profile silently
    // without changing the screen — user stays where they were
    checkUserProfile(!!restoredScreen && restoredScreen !== "auth");
  }, [user]);

  const checkUserProfile = async (silent = false) => {
    if (!user) return;
    if (!silent) setCheckingProfile(true);
    const { data } = await supabase
      .from("profiles")
      .select("body_shape, height_cm, skin_tone, style_keywords, gender")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!silent) setCheckingProfile(false);

    if (data?.body_shape) {
      setProfile(data as Profile);
      // Only navigate if we don't have a restored screen
      if (!silent) navigateTo("occasion");
    } else {
      if (!silent) navigateTo("onboarding");
    }
  };

  const handleOnboardingComplete = async () => {
    await checkUserProfile();
  };

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
