import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Camera, 
  KeyRound, 
  Save, 
  Loader2, 
  Car as CarIcon, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  PlusCircle
} from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { useNavigate } from "react-router-dom";
import { PaymentGatewayModal } from "@/components/PaymentGatewayModal";
import { Sparkles, Zap, Building2, ExternalLink } from "lucide-react";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab State: "settings" | "my_listings"
  const [activeTab, setActiveTab] = useState<"settings" | "my_listings">("settings");

  // Profile data states
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    profilePicture: "",
  });

  // Boost Modal State
  const [boostCarModal, setBoostCarModal] = useState<any | null>(null);

  // User's own car listings state
  const [myCars, setMyCars] = useState<any[]>([]);
  const [isCarsLoading, setIsCarsLoading] = useState(false);

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Loading/UI states
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === "my_listings") {
      fetchMyCars();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { "x-auth-token": token },
      });

      if (!res.ok) throw new Error("Failed to fetch user data");

      const data = await res.json();
      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        profilePicture: data.profilePicture || "",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not load profile details. Please log in again.",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const fetchMyCars = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setIsCarsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/cars/user/my-listings`, {
        headers: { "x-auth-token": token },
      });
      if (res.ok) {
        const data = await res.json();
        setMyCars(data);
      }
    } catch (err) {
      console.error("Failed to fetch user listings", err);
      toast({ title: "Error", description: "Failed to load your vehicle listings", variant: "destructive" });
    } finally {
      setIsCarsLoading(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/cars/${carId}`, {
        method: "DELETE",
        headers: { "x-auth-token": token }
      });

      if (!res.ok) throw new Error("Failed to delete car");

      toast({ title: "Listing Deleted", description: "Your car listing was removed." });
      setMyCars((prev) => prev.filter((c) => c._id !== carId));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete listing", variant: "destructive" });
    }
  };

  // Handle avatar upload click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle avatar file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploadingAvatar(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
        method: "POST",
        headers: {
          "x-auth-token": token,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload avatar image");

      const data = await res.json();
      setProfile((prev) => ({ ...prev, profilePicture: data.url }));

      // Update profile details in DB
      await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ profilePicture: data.url }),
      });

      // Update localStorage cached user
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        parsed.profilePicture = data.url;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      toast({
        title: "Avatar Updated",
        description: "Profile picture uploaded successfully!",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload avatar image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save profile information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          bio: profile.bio,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to save profile");
      }

      const updated = await res.json();

      // Update localStorage cached user
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        parsed.name = updated.name;
        parsed.phone = updated.phone;
        parsed.bio = updated.bio;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      toast({
        title: "Profile Saved",
        description: "Your profile information has been updated.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to save profile information",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password form handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Failed to change password");
      }

      toast({
        title: "Success",
        description: "Your password has been changed successfully.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">Loading profile details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                User <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account settings, profile, and active vehicle listings.
              </p>
            </div>

            {/* Main Tabs */}
            <div className="flex items-center gap-2 bg-card p-1.5 border border-border/50 rounded-2xl shadow-sm">
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "settings"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" />
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab("my_listings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "my_listings"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CarIcon className="w-4 h-4" />
                My Vehicles
                {myCars.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-primary-foreground/20 text-primary-foreground text-[10px] px-1.5 py-0.5">
                    {myCars.length}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Avatar & Quick Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-card border border-border/50 rounded-2xl p-6 text-center shadow-premium relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-accent" />

                <div className="relative inline-block mt-4">
                  <div
                    onClick={handleAvatarClick}
                    className="w-32 h-32 rounded-full border-4 border-background bg-secondary/80 flex items-center justify-center overflow-hidden cursor-pointer group shadow-premium-lg"
                  >
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt={profile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="font-heading font-bold text-3xl text-primary uppercase">
                        {profile.name.substring(0, 2)}
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-white">
                      <Camera className="w-6 h-6" />
                    </div>

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full text-white">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <div className="mt-4">
                  <h3 className="font-heading font-semibold text-lg text-foreground">{profile.name}</h3>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>

                {profile.phone && (
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 py-2 rounded-xl">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>

              {/* B2B Showroom SaaS Subscription Status Card */}
              {(() => {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const tier = user.dealerTier || 'none';
                const slug = user.dealerShowroomSlug;
                const isVerified = user.isVerifiedDealer;

                return (
                  <div className="bg-gradient-to-br from-card to-primary/5 border border-primary/20 rounded-2xl p-5 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <Building2 className="w-4 h-4 text-primary" /> Showroom SaaS Tier
                      </div>
                      <Badge variant="outline" className={`capitalize text-xs font-bold ${
                        tier === 'enterprise' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        tier === 'pro' ? 'bg-primary/10 text-primary border-primary/20' :
                        tier === 'starter' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {tier === 'none' ? 'Free Seller' : `${tier} Dealer`}
                      </Badge>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="font-bold text-foreground line-clamp-1">{user.dealerShowroomName || 'Individual Seller'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Listing Quota: <span className="font-bold text-foreground">{myCars.length} / {user.maxListingsLimit || 5} cars</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 space-y-2">
                      {slug ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dealer/${slug}`)}
                          className="w-full text-xs font-bold gap-1.5 h-9 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Showroom (`/dealer/${slug}`)
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        onClick={() => navigate('/dealer-pricing')}
                        className="w-full text-xs font-bold gap-1.5 h-9 rounded-xl bg-primary shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> {tier === 'none' ? 'Upgrade to Showroom SaaS' : 'Manage Dealer Plans'}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column - Active Tab Content */}
            <div className="md:col-span-2 space-y-6">
              {activeTab === "settings" ? (
                <>
                  {/* Form 1: General Info */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-premium">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/30">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="font-heading font-semibold text-lg text-foreground">General Details</h3>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={profile.name}
                              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                              className="pl-11 h-11 rounded-xl"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Contact Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={profile.phone}
                              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                              placeholder="e.g. +92 300 1234567"
                              className="pl-11 h-11 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Email Address (Non-editable)</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                          <Input
                            value={profile.email}
                            disabled
                            className="pl-11 h-11 rounded-xl bg-secondary/30 text-muted-foreground border-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">User Bio / Tagline</label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-4.5 w-4 h-4 text-muted-foreground" />
                          <Textarea
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            placeholder="Tell potential buyers about yourself or your dealership..."
                            className="pl-11 pt-3 min-h-[100px] rounded-xl resize-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          type="submit"
                          disabled={isSavingProfile}
                          className="h-11 rounded-xl px-6 bg-primary font-semibold shadow-premium hover:shadow-premium-lg transition-all"
                        >
                          {isSavingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Form 2: Password Change */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-premium">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/30">
                      <KeyRound className="w-5 h-5 text-primary" />
                      <h3 className="font-heading font-semibold text-lg text-foreground">Change Password</h3>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Current Password</label>
                        <Input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          placeholder="Enter current password"
                          className="h-11 rounded-xl"
                          required
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">New Password</label>
                          <Input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            placeholder="Min 6 characters"
                            className="h-11 rounded-xl"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
                          <Input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            placeholder="Re-enter new password"
                            className="h-11 rounded-xl"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          type="submit"
                          disabled={isChangingPassword}
                          className="h-11 rounded-xl px-6 bg-primary font-semibold shadow-premium hover:shadow-premium-lg transition-all"
                        >
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <KeyRound className="w-4 h-4 mr-2" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                /* My Vehicle Listings Tab */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-xl text-foreground">My Vehicles</h3>
                      <p className="text-xs text-muted-foreground">View and manage your posted car listings.</p>
                    </div>
                    <Button 
                      onClick={() => navigate("/create-listing")}
                      className="rounded-xl gap-2 h-10 px-4 bg-primary shadow-premium"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Post New Car
                    </Button>
                  </div>

                  {isCarsLoading ? (
                    <div className="text-center py-12 bg-card border border-border/50 rounded-2xl">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Loading your listings...</p>
                    </div>
                  ) : myCars.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-border/50 rounded-2xl p-8">
                      <CarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <h4 className="font-heading font-semibold text-lg text-foreground mb-1">No Car Listings Found</h4>
                      <p className="text-xs text-muted-foreground mb-4">You haven't posted any vehicles yet.</p>
                      <Button onClick={() => navigate("/create-listing")} className="rounded-xl">
                        Post Your First Car
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myCars.map((car) => (
                        <div 
                          key={car._id} 
                          className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                <img src={car.image || '/placeholder-car.jpg'} alt={car.title} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className="font-heading font-bold text-base text-foreground line-clamp-1">{car.title}</h4>
                                <p className="text-xs text-muted-foreground">{car.make} {car.model} ({car.year}) • {car.location}</p>
                                <p className="font-bold text-sm text-primary mt-0.5">PKR {car.price?.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {car.isFeatured ? (
                                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-[10px] px-2 py-0.5 shadow-sm">
                                  ★ FEATURED
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBoostCarModal(car)}
                                  className="h-8 text-xs font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10 rounded-lg"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Boost Ad
                                </Button>
                              )}

                              <Badge 
                                variant="outline" 
                                className={`capitalize text-xs font-semibold ${
                                  car.status === 'active' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                  car.status === 'pending' ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                  car.status === 'revision_requested' ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                                  "bg-destructive/10 text-destructive border-destructive/20"
                                }`}
                              >
                                {car.status === 'active' ? 'Live & Approved' : car.status === 'revision_requested' ? 'Action Required' : car.status}
                              </Badge>

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => navigate(`/vehicles/${car._id}`)}
                                title="View Page"
                                className="h-8 w-8"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Button>

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => navigate(`/edit-listing/${car._id}`)}
                                title="Edit Listing"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteCar(car._id)}
                                title="Delete Listing"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Highlighted Admin Revision Requested Note */}
                          {car.status === 'revision_requested' && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                  Admin Feedback & Price Suggestion:
                                </div>
                                <p className="text-xs text-amber-900/90 pl-5">
                                  "{car.adminNotes || "Admin requested a review of your vehicle asking price or listing details."}"
                                </p>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => navigate(`/edit-listing/${car._id}`)}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex-shrink-0 gap-1.5 shadow-sm"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit Price & Resubmit
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Payment Gateway Boosting Modal */}
      {boostCarModal && (
        <PaymentGatewayModal
          isOpen={!!boostCarModal}
          onClose={() => setBoostCarModal(null)}
          car={boostCarModal}
          onSuccess={() => {
            fetchMyCars();
            setBoostCarModal(null);
          }}
        />
      )}
    </div>
  );
};

export default Profile;
