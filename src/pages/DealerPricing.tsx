import React, { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  CheckCircle2, 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  HelpCircle,
  Landmark,
  ExternalLink,
  Users,
  Car
} from "lucide-react";
import { PaymentGatewayModal } from "@/components/PaymentGatewayModal";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

export default function DealerPricing() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "enterprise">("pro");
  const [showroomName, setShowroomName] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const plans = {
    starter: {
      name: "Starter Dealer",
      badge: "Small Dealer",
      price: 5000,
      icon: Car,
      color: "border-primary/40 bg-card text-primary",
      features: [
        "Up to 10 Car Listings",
        "Basic Inventory Management",
        "Direct Phone Lead Capture",
        "Standard Search Listing",
        "Dealer Analytics Dashboard"
      ],
      cta: "Subscribe Starter"
    },
    pro: {
      name: "Pro Dealer",
      badge: "Most Popular ⭐",
      price: 15000,
      icon: Sparkles,
      color: "border-primary bg-primary/10 text-primary shadow-lg ring-2 ring-primary/50",
      features: [
        "Up to 30 Car Listings",
        "⭐ Verified Dealer Badge on All Ads",
        "Priority Customer Support",
        "3x Search Visibility & Boost",
        "Full Dealer Analytics Suite",
        "Dedicated Showroom Contact Card"
      ],
      cta: "Subscribe Pro Dealer"
    },
    enterprise: {
      name: "Enterprise Dealer",
      badge: "Showroom Suite 👑",
      price: 30000,
      icon: Crown,
      color: "border-purple-500 bg-purple-500/10 text-purple-600 shadow-xl",
      features: [
        "Unlimited Car Listings",
        "🌐 Dedicated Showroom URL (/dealer/city-motors)",
        "⭐ Gold VIP Verified Badge",
        "Dedicated Account Manager",
        "Top Homepage Showroom Placement",
        "Featured & Urgent Promotion Included"
      ],
      cta: "Subscribe Enterprise"
    }
  };

  const handleStartSubscription = (planKey: "starter" | "pro" | "enterprise") => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      toast({ title: "Login Required", description: "Please login to subscribe to a B2B Showroom Package." });
      navigate("/login");
      return;
    }

    setSelectedPlan(planKey);
    setIsCheckoutOpen(true);
  };

  const currentSelectedPlanData = plans[selectedPlan];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fade-in">
        {/* Admin Overview Banner */}
        {(() => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.role === 'admin') {
            return (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-semibold text-purple-600">
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <span>👑 <strong>Platform Admin View:</strong> These are the B2B SaaS Subscriptions offered to car showrooms & dealers.</span>
                </span>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin')} className="h-7 text-[11px] font-bold border-purple-500/30 text-purple-600 hover:bg-purple-500/10">
                  Manage Subscribed Showrooms in Admin Panel
                </Button>
              </div>
            );
          }
          return null;
        })()}

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-xs uppercase tracking-widest">
            🏢 B2B Showroom SaaS Subscriptions
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-foreground tracking-tight">
            Grow Your Car Showroom & Reach Millions of Buyers
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Choose a monthly dealership subscription plan. Get verified showroom badges, dedicated URLs (`/dealer/city-motors`), and unlimited vehicle listings.
          </p>
        </div>

        {/* Showroom Name Quick Setup */}
        <div className="max-w-md mx-auto bg-card border border-border/60 p-4 rounded-2xl shadow-sm space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary" /> Enter Your Showroom Name (Optional)
          </label>
          <Input
            placeholder="e.g. City Motors Rawalpindi"
            value={showroomName}
            onChange={(e) => setShowroomName(e.target.value)}
            className="h-10 text-xs rounded-xl"
          />
          <p className="text-[11px] text-muted-foreground">
            Enterprise plans get a dedicated URL e.g. <span className="font-mono text-primary font-bold">/dealer/{showroomName ? showroomName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : "city-motors"}</span>
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 pt-4">
          {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => {
            const plan = plans[key];
            const Icon = plan.icon;
            const isPro = key === "pro";

            return (
              <div
                key={key}
                className={`rounded-3xl border p-8 flex flex-col justify-between transition-all relative ${plan.color}`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    MOST POPULAR FOR SHOWROOMS
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5">
                      {plan.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-2xl text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-sm font-bold text-primary">PKR</span>
                      <span className="text-4xl font-extrabold font-heading text-foreground">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal"> / month</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Package Features:</p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  {(() => {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const isAdmin = user.role === 'admin';

                    if (isAdmin) {
                      return (
                        <Button
                          onClick={() => navigate("/admin")}
                          className="w-full h-12 rounded-xl text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-premium"
                        >
                          <Crown className="w-4 h-4" />
                          👑 Admin: Manage Showrooms
                        </Button>
                      );
                    }

                    return (
                      <Button
                        onClick={() => handleStartSubscription(key)}
                        className={`w-full h-12 rounded-xl text-xs font-bold shadow-premium gap-2 ${
                          isPro ? "bg-primary hover:bg-primary/90 text-white" : ""
                        }`}
                        variant={isPro ? "default" : "outline"}
                      >
                        {plan.cta}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Showroom Benefits Grid */}
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground font-heading">⭐ Verified Dealer Status</h4>
              <p className="text-xs text-muted-foreground mt-1">Build instant buyer trust with official verified dealership badges on all your cars.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground font-heading">🌐 Dedicated Showroom URL</h4>
              <p className="text-xs text-muted-foreground mt-1">Get your own branded showroom link (`/dealer/city-motors`) to share on WhatsApp & social media.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground font-heading">🏦 Direct Bank Wire IBFT</h4>
              <p className="text-xs text-muted-foreground mt-1">Instant monthly activation via Meezan Bank 1Link / IBFT or Credit Card.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Gateway Modal Integration for B2B Subscription */}
      {isCheckoutOpen && (
        <PaymentGatewayModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          car={{ title: `${currentSelectedPlanData.name} Subscription`, price: currentSelectedPlanData.price }}
          customPackage={{
            name: currentSelectedPlanData.name,
            price: currentSelectedPlanData.price,
            badge: currentSelectedPlanData.badge
          }}
          onSuccess={async () => {
            try {
              const token = localStorage.getItem("token");
              const res = await fetch(`${API_BASE_URL}/api/dealers/subscribe`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-auth-token": token || ""
                },
                body: JSON.stringify({
                  tier: selectedPlan,
                  showroomName: showroomName || "Showroom Dealer",
                  showroomSlug: showroomName ? showroomName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : "city-motors",
                  paymentMethod: "Direct Bank Wire (1Link IBFT)",
                  transactionId: `SUB-${Date.now().toString().slice(-6)}`
                })
              });

              if (res.ok) {
                const data = await res.json();
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const updatedUser = { ...user, ...data.user };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                toast({
                  title: "Subscription Activated! 🏢🎉",
                  description: `Your ${currentSelectedPlanData.name} has been activated.`
                });

                if (data.user?.dealerShowroomSlug) {
                  navigate(`/dealer/${data.user.dealerShowroomSlug}`);
                } else {
                  navigate("/profile");
                }
              }
            } catch (err) {
              console.error(err);
            } finally {
              setIsCheckoutOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
