import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import VehicleCard from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Crown, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Search, 
  Car, 
  Loader2, 
  MessageSquare,
  Calendar
} from "lucide-react";

export default function DedicatedShowroom() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dealer, setDealer] = useState<any | null>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchShowroomData();
  }, [slug]);

  const fetchShowroomData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/dealers/${slug}`);
      if (!res.ok) throw new Error("Showroom not found");

      const data = await res.json();
      setDealer(data.dealer);
      setCars(data.cars || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Showroom Error",
        description: err.message || "Failed to load showroom page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast({ title: "Copied!", description: "Dedicated Showroom URL copied to clipboard." });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredCars = cars.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Loading Dedicated Showroom...</span>
        </div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground/40" />
          <h2 className="text-2xl font-bold font-heading">Showroom Not Found</h2>
          <p className="text-xs text-muted-foreground">The showroom URL `/dealer/{slug}` could not be found or has expired.</p>
          <Button onClick={() => navigate("/dealer-pricing")} className="rounded-xl bg-primary">
            Explore Dealer Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Dedicated Showroom Header Banner */}
        <div className="bg-gradient-to-br from-card via-card to-primary/10 border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent-racing flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border-2 border-background">
                {dealer.dealerShowroomName ? dealer.dealerShowroomName.substring(0, 2).toUpperCase() : "SM"}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">
                    {dealer.dealerShowroomName || `${dealer.name} Motors`}
                  </h1>

                  {dealer.isVerifiedDealer && (
                    <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-xs gap-1 px-2.5 py-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Dealer
                    </Badge>
                  )}

                  {dealer.dealerTier === "enterprise" && (
                    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-xs gap-1 px-2.5 py-0.5">
                      <Crown className="w-3.5 h-3.5" /> Enterprise Showroom
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" /> {dealer.location || "Islamabad / Rawalpindi"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5 text-primary" /> {cars.length} Active Vehicles Listed</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-10 text-xs font-bold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 flex-1 sm:flex-initial"
              >
                {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copied URL" : "Share Showroom Link"}
              </Button>

              <Button
                onClick={() => {
                  toast({
                    title: "Showroom Contact",
                    description: `Phone: ${dealer.phone || "0300 1234567"} | Email: ${dealer.email}`
                  });
                }}
                className="h-10 text-xs font-bold gap-1.5 rounded-xl bg-primary text-white shadow-premium flex-1 sm:flex-initial"
              >
                <Phone className="w-4 h-4" />
                Contact Showroom
              </Button>
            </div>
          </div>
        </div>

        {/* Showroom Inventory Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-heading text-foreground">
              Available Inventory at {dealer.dealerShowroomName || "Showroom"}
            </h2>
            <p className="text-xs text-muted-foreground">Browse all verified vehicles listed directly by this showroom dealer.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search in this showroom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl border-border/60"
            />
          </div>
        </div>

        {/* Vehicle Inventory Grid */}
        {filteredCars.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3 bg-card rounded-3xl border border-border/50">
            <Car className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <h3 className="font-heading font-bold text-lg text-foreground">No vehicles found</h3>
            <p className="text-xs">This showroom currently has no active vehicles matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
