import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./AuthPage";
import OnboardingPage from "./OnboardingPage";
import OccasionSelector from "./OccasionSelector";
import StyleResults from "./StyleResults";
import SavedLooksBoard from "./SavedLooksBoard";

type AppScreen = "auth" | "onboarding" | "occasion" | "results" | "board";

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

  if (screen === "occasion") {
    return <OccasionSelector onNext={handleOccasionNext} />;
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
      />
    );
  }

  return <OccasionSelector onNext={handleOccasionNext} />;
}

