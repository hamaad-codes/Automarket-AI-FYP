import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Zap, 
  Crown, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  CreditCard, 
  Landmark, 
  Receipt,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  customPackage?: { name: string; price: number; badge?: string; desc?: string };
  onSuccess?: () => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  car,
  customPackage,
  onSuccess,
}) => {
  const { toast } = useToast();

  // Check if mode is Dealer Subscription
  const isDealerSubscription = Boolean(customPackage || car?.title?.includes("Subscription"));
  const activePrice = customPackage ? customPackage.price : (isDealerSubscription ? car?.price : 0);
  const activePackageName = customPackage ? customPackage.name : (car?.title || "B2B Dealer Subscription");

  // Package Tier State (for ad boosting)
  const [selectedTier, setSelectedTier] = useState<"featured" | "urgent" | "vip">("featured");

  // Payment Method State: "bank_transfer" | "card"
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "card">("bank_transfer");

  // Input states
  const [senderBank, setSenderBank] = useState("");
  const [ibftRef, setIbftRef] = useState("");
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [copiedIban, setCopiedIban] = useState(false);

  // Process States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const packages = {
    featured: {
      name: "Featured Listing",
      price: 1499,
      duration: "15 Days",
      icon: Sparkles,
      color: "border-primary bg-primary/5 text-primary",
      badge: "Featured Ad",
      desc: "Top placement on Homepage & Search Results with glowing badge."
    },
    urgent: {
      name: "Urgent Sale Boost",
      price: 2499,
      duration: "30 Days",
      icon: Zap,
      color: "border-amber-500 bg-amber-500/5 text-amber-600",
      badge: "Urgent Tag",
      desc: "Red Urgent banner, 3x buyer inquiries & push alert to buyers."
    },
    vip: {
      name: "VIP Dealership Package",
      price: 4999,
      duration: "60 Days",
      icon: Crown,
      color: "border-purple-500 bg-purple-500/5 text-purple-600",
      badge: "VIP Deal",
      desc: "60-Day top ranking, Gold VIP Badge & Dedicated Customer Support."
    }
  };

  const currentPkg = isDealerSubscription
    ? { name: activePackageName, price: activePrice || 15000, duration: "30 Days", badge: customPackage?.badge || "B2B SaaS Plan" }
    : packages[selectedTier];

  const handleCopyIban = () => {
    navigator.clipboard.writeText("PK36MEZN0001020304050607");
    setCopiedIban(true);
    toast({ title: "Copied!", description: "Meezan Bank IBAN copied to clipboard." });
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleProcessPayment = async () => {
    if (paymentMethod === "bank_transfer") {
      if (!ibftRef || ibftRef.length < 5) {
        toast({ 
          title: "Validation Error", 
          description: "Please enter your IBFT Transaction Reference ID / Deposit Receipt No.", 
          variant: "destructive" 
        });
        return;
      }
    } else {
      if (!cardNumber || !cardExpiry || !cardCvv) {
        toast({ title: "Validation Error", description: "Please complete all credit/debit card fields", variant: "destructive" });
        return;
      }
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const txnId = ibftRef ? `IBFT-${ibftRef.toUpperCase()}` : `CARD-${Math.floor(100000 + Math.random() * 900000)}`;
        
        setReceiptData({
          txnId,
          amount: currentPkg.price,
          packageName: currentPkg.name,
          date: new Date().toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          paymentMethod: paymentMethod === "bank_transfer" ? "Direct Bank Wire (1Link IBFT)" : "Credit / Debit Card",
          carTitle: car?.title || "Showroom SaaS Plan"
        });

        setIsCompleted(true);
        toast({
          title: "Payment Verified! 🎉",
          description: `Your transaction for "${currentPkg.name}" has been completed.`
        });

        if (onSuccess) onSuccess();
      } catch (err: any) {
        console.error("Payment error:", err);
        toast({ title: "Payment Error", description: err.message || "Failed to complete transaction", variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    }, 1800);
  };

  const handleResetModal = () => {
    setIsCompleted(false);
    setReceiptData(null);
    onClose();
  };

  if (!car && !customPackage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleResetModal}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        {!isCompleted ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  🏦
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold font-heading text-foreground">
                    {isDealerSubscription ? "B2B Dealer Subscription Checkout" : "Direct Bank Checkout & Ad Boosting Gateway"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Activate "{currentPkg.name}" via Secure Direct Bank Wire (1Link/IBFT) or Credit Card.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Package Tier Selection */}
            {isDealerSubscription ? (
              <div className="bg-primary/5 border-2 border-primary rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Selected Showroom SaaS Plan</span>
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">{currentPkg.badge}</Badge>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <h3 className="font-heading font-bold text-lg text-foreground">{currentPkg.name}</h3>
                  <div className="text-right">
                    <span className="text-xs font-bold text-primary">PKR </span>
                    <span className="text-2xl font-extrabold text-foreground">{currentPkg.price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground"> / mo</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 my-2">
                <label className="text-xs font-bold text-foreground">1. Choose Promotion Package</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(packages) as Array<keyof typeof packages>).map((key) => {
                    const pkg = packages[key];
                    const Icon = pkg.icon;
                    const isSelected = selectedTier === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedTier(key)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? `${pkg.color} shadow-sm font-semibold`
                            : "border-border/60 bg-card hover:border-primary/40 text-muted-foreground"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Icon className="w-4 h-4" />
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs font-bold text-foreground">{pkg.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{pkg.desc}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-border/40">
                          <p className="text-xs font-bold text-primary">PKR {pkg.price.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground">{pkg.duration}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="space-y-3 my-2">
              <label className="text-xs font-bold text-foreground">2. Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "bank_transfer"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Landmark className="w-4 h-4 text-primary" />
                  Direct Bank Wire (1Link / IBFT)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 shadow-sm"
                      : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  Card (Visa / MasterCard)
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            <div className="bg-secondary/30 p-4 rounded-xl border border-border/40 space-y-3">
              {paymentMethod === "bank_transfer" ? (
                <div className="space-y-3">
                  {/* Official Company Bank Details */}
                  <div className="bg-card p-3 rounded-xl border border-primary/20 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center pb-1 border-b border-border/30">
                      <span className="font-bold text-primary flex items-center gap-1.5">
                        <Landmark className="w-4 h-4" /> Official Bank Account Details
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">1Link / Raast</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div><span className="text-muted-foreground">Bank Name:</span> <span className="font-bold text-foreground">Meezan Bank Ltd.</span></div>
                      <div><span className="text-muted-foreground">Account Title:</span> <span className="font-bold text-foreground">AutoMarket AI (Pvt) Ltd</span></div>
                      <div className="col-span-2 flex items-center justify-between bg-muted/60 p-2 rounded-lg">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">IBAN Number:</span>
                          <span className="font-mono font-bold text-xs text-foreground">PK36 MEZN 0001 0203 0405 0607</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={handleCopyIban} className="h-7 text-xs gap-1">
                          {copiedIban ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedIban ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Your Bank Name</label>
                      <Input
                        placeholder="e.g. HBL / Alfalah / Allied"
                        value={senderBank}
                        onChange={(e) => setSenderBank(e.target.value)}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">IBFT Ref / Txn ID *</label>
                      <Input
                        placeholder="e.g. 98421034"
                        value={ibftRef}
                        onChange={(e) => setIbftRef(e.target.value)}
                        className="h-10 text-xs rounded-xl font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    Transfer PKR {currentPkg.price.toLocaleString()} via mobile banking app (1Link / IBFT) & enter Txn Ref.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Card Number</label>
                    <Input
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="h-10 text-xs rounded-xl font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Expiry (MM/YY)</label>
                      <Input
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">CVV Code</label>
                      <Input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Total Payable Amount</p>
                <p className="font-bold text-lg text-primary">PKR {currentPkg.price.toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                Instant Verification
              </Badge>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="rounded-xl bg-primary shadow-premium font-semibold gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Bank Transaction...
                  </>
                ) : (
                  <>
                    Confirm Payment (PKR {currentPkg.price.toLocaleString()})
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Payment Success Digital Receipt View */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-2xl text-foreground">Bank Transfer Verified!</h3>
              <p className="text-xs text-muted-foreground mt-1">Your listing has been upgraded and boosted across AutoMarket AI.</p>
            </div>

            {/* Digital Receipt Card */}
            <div className="bg-card border border-border/60 rounded-xl p-4 text-left space-y-2 max-w-md mx-auto shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                  <Receipt className="w-4 h-4 text-primary" /> Official Banking Deposit Receipt
                </span>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
                  VERIFIED & PAID
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Txn Ref:</span> <span className="font-mono font-bold text-foreground">{receiptData?.txnId}</span></div>
                <div><span className="text-muted-foreground">Method:</span> <span className="font-semibold text-foreground">{receiptData?.method}</span></div>
                <div><span className="text-muted-foreground">Package:</span> <span className="font-semibold text-primary">{receiptData?.tierName}</span></div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="font-bold text-foreground">PKR {receiptData?.amount?.toLocaleString()}</span></div>
              </div>
            </div>

            <Button onClick={handleResetModal} className="rounded-xl px-8 bg-primary font-semibold shadow-premium">
              Done & View Boosted Listing
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
