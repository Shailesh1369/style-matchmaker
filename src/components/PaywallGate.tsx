import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallGateProps {
  featureName: string;
  onUpgrade: () => void;
}

export default function PaywallGate({ featureName, onUpgrade }: PaywallGateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-blush-light flex items-center justify-center">
        <Lock className="w-8 h-8 text-blush" />
      </div>
      <h3 className="text-xl font-black text-foreground">Pro Feature</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        <span className="font-semibold text-foreground">{featureName}</span> is available on the Pro plan.
        Upgrade to unlock all premium features.
      </p>
      <Button
        onClick={onUpgrade}
        className="h-12 px-8 rounded-2xl text-base font-bold bg-blush text-secondary-foreground hover:opacity-90 gap-2"
      >
        <Crown className="w-4 h-4" />
        Upgrade to Pro — ₹200/mo
      </Button>
    </div>
  );
}
