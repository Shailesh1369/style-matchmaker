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

export default function Index() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<AppScreen>("auth");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [vibeFilter, setVibeFilter] = useState("minimal");
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      setScreen("auth");
      return;
    }
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
      setProfile(data as Profile);
      setScreen("occasion");
    } else {
      setScreen("onboarding");
    }
  };

  const handleOnboardingComplete = async () => {
    await checkUserProfile();
  };

  const handleOccasionNext = (selectedOccasions: string[], selectedVibe: string) => {
    setOccasions(selectedOccasions);
    setVibeFilter(selectedVibe);
    setScreen("results");
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

  // Screens that need bottom nav
  const showBottomNav = ["occasion", "results", "board", "profile", "camera"].includes(screen);

  const renderContent = () => {
    if (screen === "profile") {
      return <ProfilePage onBack={() => setScreen("occasion")} />;
    }
    if (screen === "camera" && profile) {
      return <CameraAnalysis profile={profile} onBack={() => setScreen("occasion")} />;
    }
    if (screen === "results" && profile) {
      return (
        <StyleResults
          profile={profile}
          occasions={occasions}
          vibeFilter={vibeFilter}
          onGoToBoard={() => setScreen("board")}
          onBack={() => setScreen("occasion")}
        />
      );
    }
    if (screen === "board") {
      return (
        <SavedLooksBoard
          onBack={() => setScreen("results")}
          onNewSearch={() => setScreen("occasion")}
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
              onClick={() => setScreen("occasion")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                screen === "occasion" ? "text-blush" : "text-muted-foreground"
              }`}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Explore</span>
            </button>
            <button
              onClick={() => setScreen("camera")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                screen === "camera" ? "text-blush" : "text-muted-foreground"
              }`}
            >
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Try-On</span>
            </button>
            <button
              onClick={() => setScreen("board")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                screen === "board" ? "text-blush" : "text-muted-foreground"
              }`}
            >
              <BookmarkCheck className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Saved</span>
            </button>
            <button
              onClick={() => setScreen("profile")}
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
