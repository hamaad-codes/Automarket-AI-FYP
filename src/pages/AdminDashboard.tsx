import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Check, 
  X, 
  Eye, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Mail,
  Calendar,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Loader2,
  DollarSign,
  Building2,
  BarChart3,
  ExternalLink,
  Crown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "revision_requested" | "approved" | "rejected" | "users" | "dealers" | "platform_analytics">("pending");
  
  // Inspection Modal States
  const [selectedCar, setSelectedCar] = useState<any | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [revisionReason, setRevisionReason] = useState("overpriced");
  const [submittingAction, setSubmittingAction] = useState(false);
  
  // AI Valuation States
  const [aiPrice, setAiPrice] = useState<number | null>(null);
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [valuationDiff, setValuationDiff] = useState<number | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = '';
      if (activeTab === 'users') {
        url = `${API_BASE_URL}/api/auth/users`;
      } else if (activeTab === 'dealers') {
        url = `${API_BASE_URL}/api/dealers`;
      } else if (activeTab === 'platform_analytics') {
        url = `${API_BASE_URL}/api/cars/admin/list?status=active`;
      } else {
        const status = activeTab === 'approved' ? 'active' : activeTab;
        url = `${API_BASE_URL}/api/cars/admin/list?status=${status}`;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { 'x-auth-token': token || '' }
      });
      const resData = await response.json();
      setData(Array.isArray(resData) ? resData : (resData.cars || []));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: `Failed to fetch ${activeTab}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (carId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars/${carId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({ 
        title: "Success", 
        description: `Listing updated to ${newStatus} successfully` 
      });
      setIsInspectOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update listing status", variant: "destructive" });
    }
  };

  // Open inspection modal and evaluate AI price automatically
  const handleOpenInspect = async (car: any) => {
    setSelectedCar(car);
    setAdminNotes(car.adminNotes || "");
    setRevisionReason(car.revisionReason || "overpriced");
    setAiPrice(car.aiEstimatedPrice || null);
    setIsInspectOpen(true);

    // Run AI Price Evaluation
    evaluateCarPriceWithAI(car);
  };

  const evaluateCarPriceWithAI = async (car: any) => {
    try {
      setIsAiEvaluating(true);
      
      let make = car.make || "";
      let model = car.model || "";
      if (!make || make.toLowerCase() === (car.title || '').toLowerCase()) {
        const titleParts = (car.title || "Honda Civic").trim().split(" ");
        make = titleParts[0] || "Honda";
        model = titleParts.slice(1).join(" ") || "Civic";
      }

      const res = await fetch(`${API_BASE_URL}/api/cars/predict-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: make || "Honda",
          model: model || "Civic",
          year: car.year || 2024,
          bodyType: car.bodyType || "Sedan",
          mileage: car.mileage || "50,000 km",
          fuelType: car.fuelType || "Petrol",
          transmission: car.transmission || "Automatic",
          color: car.color || "White",
          location: car.location || "Rawalpindi",
          engineDisplacement: car.engineDisplacement || "1800 cc"
        })
      });

      if (res.ok) {
        const data = await res.json();
        const predicted = data.predictedPrice || data.price;
        if (predicted) {
          setAiPrice(predicted);
          const diff = ((car.price - predicted) / predicted) * 100;
          setValuationDiff(Math.round(diff));
        }
      }
    } catch (err) {
      console.error("AI Price evaluation error:", err);
    } finally {
      setIsAiEvaluating(false);
    }
  };

  const handleUseAiSuggestedNote = () => {
    if (!aiPrice || !selectedCar) return;
    const diffText = valuationDiff && valuationDiff > 0 ? `+${valuationDiff}% above estimated market value` : '';
    const suggestedNote = `AI Market Valuation indicates this vehicle's fair market value is approximately PKR ${aiPrice.toLocaleString()} (${diffText}). Your current asking price is PKR ${selectedCar.price.toLocaleString()}. Please adjust your price or update vehicle details.`;
    setAdminNotes(suggestedNote);
    setRevisionReason("overpriced");
  };

  const handleSendRevisionRequest = async () => {
    if (!selectedCar) return;
    if (!adminNotes.trim()) {
      toast({ title: "Validation", description: "Please enter feedback notes for the seller.", variant: "destructive" });
      return;
    }

    try {
      setSubmittingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cars/${selectedCar._id}/request-revision`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ 
          adminNotes,
          revisionReason,
          aiEstimatedPrice: aiPrice
        })
      });

      if (!response.ok) throw new Error("Failed to send revision request");

      toast({ 
        title: "Revision Requested", 
        description: "Notification & Direct Message sent to the seller successfully!" 
      });
      setIsInspectOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to request revision", variant: "destructive" });
    } finally {
      setSubmittingAction(false);
    }
  };

  const tabs = [
    { id: "pending", label: "Pending Approval", icon: Clock },
    { id: "revision_requested", label: "Needs Revision", icon: AlertTriangle },
    { id: "approved", label: "Approved", icon: CheckCircle },
    { id: "rejected", label: "Rejected", icon: XCircle },
    { id: "users", label: "Users", icon: Users },
    { id: "dealers", label: "Showrooms & SaaS Tiers", icon: Building2 },
    { id: "platform_analytics", label: "Platform Revenue & Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Admin <span className="text-gradient">Moderation & AI Valuation</span>
            </h1>
            <p className="text-muted-foreground">
              Review car listings, inspect vehicle specs, verify AI market valuations, and request seller price revisions.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-premium"
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <Badge variant="secondary" className={`ml-2 ${activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : ""}`}>
                {activeTab === tab.id ? data.length : ""}
              </Badge>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-premium overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                {activeTab === 'users' ? (
                  <>
                    <TableHead className="font-heading font-semibold">User</TableHead>
                    <TableHead className="font-heading font-semibold">Contact</TableHead>
                    <TableHead className="font-heading font-semibold">Role</TableHead>
                    <TableHead className="font-heading font-semibold">Joined</TableHead>
                  </>
                ) : activeTab === 'dealers' ? (
                  <>
                    <TableHead className="font-heading font-semibold">Showroom / Dealer</TableHead>
                    <TableHead className="font-heading font-semibold">SaaS Tier</TableHead>
                    <TableHead className="font-heading font-semibold">Badge Status</TableHead>
                    <TableHead className="font-heading font-semibold">Showroom Link</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Actions</TableHead>
                  </>
                ) : activeTab === 'platform_analytics' ? (
                  <>
                    <TableHead className="font-heading font-semibold">Metric</TableHead>
                    <TableHead className="font-heading font-semibold">Platform Value</TableHead>
                    <TableHead className="font-heading font-semibold">Status</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Action</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-heading font-semibold">Vehicle</TableHead>
                    <TableHead className="font-heading font-semibold">Seller</TableHead>
                    <TableHead className="font-heading font-semibold">Asking Price</TableHead>
                    <TableHead className="font-heading font-semibold">Status</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Actions</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTab === 'users' ? (
                data.map((user) => (
                  <TableRow key={user._id} className="hover:bg-muted/50 border-border/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={user.role === 'admin' ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : ""}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : activeTab === 'dealers' ? (
                data.map((dealer) => (
                  <TableRow key={dealer._id} className="hover:bg-muted/50 border-border/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{dealer.dealerShowroomName || `${dealer.name} Motors`}</p>
                          <p className="text-xs text-muted-foreground">{dealer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize font-bold text-xs bg-primary/10 text-primary border-primary/20">
                        {dealer.dealerTier || 'starter'} Plan
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dealer.isVerifiedDealer ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-bold text-xs gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified ⭐
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Standard Dealer</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-primary font-semibold">
                        /dealer/{dealer.dealerShowroomSlug || 'showroom'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dealer/${dealer.dealerShowroomSlug || dealer._id}`)}
                        className="h-8 text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10 rounded-lg"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Showroom Page
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : activeTab === 'platform_analytics' ? (
                <>
                  <TableRow className="hover:bg-muted/50 border-border/50">
                    <TableCell className="font-bold">Total Platform SaaS Subscriptions</TableCell>
                    <TableCell className="font-extrabold text-primary">PKR 185,000 / month</TableCell>
                    <TableCell><Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-bold">Active MRR</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => navigate('/dealer-pricing')} className="h-8 text-xs font-bold bg-primary rounded-lg">
                        Manage SaaS Plans
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-muted/50 border-border/50">
                    <TableCell className="font-bold">Total Active Marketplace Inventory</TableCell>
                    <TableCell className="font-extrabold text-foreground">{data.length} Vehicles Listed</TableCell>
                    <TableCell><Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">Live Listings</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => navigate('/analytics')} className="h-8 text-xs font-bold text-primary border-primary/30 rounded-lg">
                        Open System Analytics
                      </Button>
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                data.map((car) => (
                  <TableRow key={car._id} className="hover:bg-muted/50 border-border/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img src={car.image || '/placeholder-car.jpg'} alt={car.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{car.title}</p>
                          <p className="text-xs text-muted-foreground">{car.make} {car.model} ({car.year}) • {car.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{car.sellerName || car.user?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{car.sellerEmail || car.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-primary">PKR {car.price?.toLocaleString()}</p>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${
                          car.status === 'active' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                          car.status === 'pending' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                          car.status === 'revision_requested' ? "bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold" :
                          "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {car.status === 'active' ? 'Approved' : car.status === 'revision_requested' ? 'Revision Needed' : car.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => handleOpenInspect(car)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect & Evaluate
                        </Button>
                        {car.status !== 'active' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600"
                            onClick={() => handleStatusUpdate(car._id, 'active')}
                            title="Approve Listing"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {car.status !== 'rejected' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleStatusUpdate(car._id, 'rejected')}
                            title="Reject Listing"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">No listings in {activeTab}</h3>
              <p className="text-muted-foreground">Everything looks clean!</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}
        </div>
      </main>

      {/* Car Inspection & AI Valuation Dialog */}
      <Dialog open={isInspectOpen} onOpenChange={setIsInspectOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          {selectedCar && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl font-bold font-heading text-foreground">
                      Inspection & AI Valuation
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Review vehicle details, compare with AI market valuation, and provide seller feedback.
                    </DialogDescription>
                  </div>
                  <Badge 
                    variant="outline"
                    className="capitalize font-medium"
                  >
                    Status: {selectedCar.status}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Car Banner & Summary */}
              <div className="grid md:grid-cols-3 gap-4 my-2">
                <div className="md:col-span-1 rounded-xl overflow-hidden bg-muted border border-border/50 h-44">
                  <img 
                    src={selectedCar.image || '/placeholder-car.jpg'} 
                    alt={selectedCar.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
                  <h3 className="font-heading font-bold text-lg text-foreground">{selectedCar.title}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div><span className="font-semibold text-foreground">Make/Model:</span> {selectedCar.make} {selectedCar.model}</div>
                    <div><span className="font-semibold text-foreground">Year:</span> {selectedCar.year}</div>
                    <div><span className="font-semibold text-foreground">Mileage:</span> {selectedCar.mileage}</div>
                    <div><span className="font-semibold text-foreground">Engine:</span> {selectedCar.engineDisplacement || 'N/A'}</div>
                    <div><span className="font-semibold text-foreground">Transmission:</span> {selectedCar.transmission}</div>
                    <div><span className="font-semibold text-foreground">City:</span> {selectedCar.location}</div>
                  </div>
                  <div className="pt-1 flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">Seller: <span className="font-semibold text-foreground">{selectedCar.sellerName || selectedCar.user?.name}</span> ({selectedCar.sellerEmail})</div>
                  </div>
                </div>
              </div>

              {/* AI Valuation Checker Banner */}
              <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/30 rounded-xl p-4 my-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h4 className="font-heading font-bold text-sm text-foreground">AI Market Price Valuation Engine</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                    onClick={() => evaluateCarPriceWithAI(selectedCar)}
                  >
                    <RefreshCw className={`w-3 h-3 ${isAiEvaluating ? 'animate-spin' : ''}`} />
                    Re-evaluate
                  </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-card/80 p-3 rounded-lg border border-border/40">
                    <p className="text-xs text-muted-foreground">Seller Asking Price</p>
                    <p className="font-bold text-base text-foreground">PKR {selectedCar.price?.toLocaleString()}</p>
                  </div>

                  <div className="bg-card/80 p-3 rounded-lg border border-border/40">
                    <p className="text-xs text-muted-foreground">AI Estimated Market Value</p>
                    <p className="font-bold text-base text-primary">
                      {isAiEvaluating ? (
                        <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating...
                        </span>
                      ) : aiPrice ? (
                        `PKR ${aiPrice.toLocaleString()}`
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>

                  <div className="bg-card/80 p-3 rounded-lg border border-border/40 flex flex-col justify-center items-center">
                    <p className="text-xs text-muted-foreground">Valuation Verdict</p>
                    {isAiEvaluating ? (
                      <span className="text-xs text-muted-foreground">Checking...</span>
                    ) : valuationDiff !== null ? (
                      valuationDiff > 10 ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 mt-1 font-bold">
                          🔴 Overpriced (+{valuationDiff}%)
                        </Badge>
                      ) : valuationDiff < -10 ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 mt-1 font-bold">
                          🟡 Underpriced ({valuationDiff}%)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 mt-1 font-bold">
                          🟢 Fair Market Price
                        </Badge>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground mt-1">Pending Check</span>
                    )}
                  </div>
                </div>

                {aiPrice && (
                  <div className="mt-3 pt-2 border-t border-primary/20 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUseAiSuggestedNote}
                      className="h-7 text-xs text-primary font-semibold hover:bg-primary/20 gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Auto-fill AI Suggested Price Feedback
                    </Button>
                  </div>
                )}
              </div>

              {/* Revision Request / Feedback Form */}
              <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h4 className="font-heading font-semibold text-sm text-foreground">Admin Feedback & Revision Request</h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Feedback Category / Reason</label>
                    <select
                      value={revisionReason}
                      onChange={(e) => setRevisionReason(e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="overpriced">Price Higher Than Market Value</option>
                      <option value="blurry_images">Images Blurry or Low Quality</option>
                      <option value="incomplete_details">Incomplete Vehicle Specifications</option>
                      <option value="invalid_location">Location or Registration Mismatch</option>
                      <option value="other">Other Correction Required</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Feedback Note for Seller (Sent via In-App Notification & Direct Chat)</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter explicit feedback for the seller e.g. Your listed price PKR 4,500,000 is higher than market rate PKR 3,800,000. Please adjust your price."
                    className="min-h-[80px] rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsInspectOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate(selectedCar._id, 'rejected')}
                  className="rounded-xl gap-1"
                >
                  <X className="w-4 h-4" />
                  Reject Listing
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleSendRevisionRequest}
                  disabled={submittingAction}
                  className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl gap-1 font-semibold"
                >
                  {submittingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  Request Seller Revision
                </Button>

                <Button
                  onClick={() => handleStatusUpdate(selectedCar._id, 'active')}
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white gap-1 font-semibold"
                >
                  <Check className="w-4 h-4" />
                  Approve & Publish
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
