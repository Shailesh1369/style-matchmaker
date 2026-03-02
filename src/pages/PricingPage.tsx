import { Check, X, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

interface PricingPageProps {
  onBack: () => void;
}

const FEATURES = [
  { name: "Basic style recommendations", free: true, pro: true },
  { name: "Occasion-based outfits", free: true, pro: true },
  { name: "Save up to 5 looks", free: true, pro: false },
  { name: "Unlimited saved looks", free: false, pro: true },
  { name: "AI outfit analysis (camera)", free: false, pro: true },
  { name: "Advanced vibe filters", free: false, pro: true },
  { name: "Personalized color palettes", free: false, pro: true },
  { name: "Shopping links & suggestions", free: false, pro: true },
  { name: "Priority style updates", free: false, pro: true },
];

export default function PricingPage({ onBack }: PricingPageProps) {
  const { tier } = useSubscription();

  const handleUpgrade = () => {
    toast.info("Stripe integration coming soon! You'll be able to subscribe once connected.");
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black">Choose Your Plan</h1>
          <p className="text-xs text-muted-foreground">Unlock your full style potential</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
        {/* Plans */}
        <div className="grid gap-4">
          {/* Free Plan */}
          <div
            className={`rounded-2xl border-2 p-5 space-y-4 transition-all ${
              tier === "free"
                ? "border-blush bg-card"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-black">Free</h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Get started with basics</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">₹0</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
            </div>
            {tier === "free" && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                Current Plan
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div
            className={`rounded-2xl border-2 p-5 space-y-4 transition-all relative overflow-hidden ${
              tier === "pro"
                ? "border-blush bg-card"
                : "border-blush/40 bg-card"
            }`}
          >
            {/* Glow accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blush/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center justify-between relative">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-blush" />
                  <h2 className="text-lg font-black">Pro</h2>
                  <span className="px-2 py-0.5 rounded-full bg-blush text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                    Popular
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Full styling experience</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blush">₹200</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
            </div>

            {tier === "pro" ? (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blush-light text-xs font-semibold text-blush">
                <Crown className="w-3 h-3" /> Active
              </div>
            ) : (
              <Button
                onClick={handleUpgrade}
                className="w-full h-11 rounded-xl text-sm font-bold bg-blush text-secondary-foreground hover:opacity-90 gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blush">Feature Comparison</h3>
          </div>
          <div className="divide-y divide-border">
            {FEATURES.map((feat) => (
              <div key={feat.name} className="flex items-center px-4 py-3">
                <span className="flex-1 text-sm text-foreground">{feat.name}</span>
                <div className="flex gap-8">
                  <div className="w-10 flex justify-center">
                    {feat.free ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="w-10 flex justify-center">
                    {feat.pro ? (
                      <Check className="w-4 h-4 text-blush" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Column headers */}
          <div className="flex items-center px-4 py-2 bg-muted/50 border-t border-border">
            <span className="flex-1" />
            <div className="flex gap-8">
              <span className="w-10 text-center text-[10px] font-bold uppercase text-muted-foreground">Free</span>
              <span className="w-10 text-center text-[10px] font-bold uppercase text-blush">Pro</span>
            </div>
          </div>
        </div>

        {/* FAQ-like note */}
        <div className="text-center space-y-1 pb-4">
          <p className="text-xs text-muted-foreground">Cancel anytime. No hidden fees.</p>
          <p className="text-xs text-muted-foreground">Payments powered by Stripe 🔒</p>
        </div>
      </div>
    </div>
  );
}
