import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionTier = "free" | "pro";

interface SubscriptionData {
  tier: SubscriptionTier;
  status: string;
  startedAt: string | null;
  endsAt: string | null;
  loading: boolean;
}

export function useSubscription(): SubscriptionData {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [status, setStatus] = useState("active");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status, subscription_started_at, subscription_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setTier((data.subscription_tier as SubscriptionTier) || "free");
        setStatus(data.subscription_status || "active");
        setStartedAt(data.subscription_started_at);
        setEndsAt(data.subscription_ends_at);
      }
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { tier, status, startedAt, endsAt, loading };
}

export function isPro(tier: SubscriptionTier): boolean {
  return tier === "pro";
}
