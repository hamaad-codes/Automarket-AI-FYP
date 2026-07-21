import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, FileText, Camera, KeyRound, Save, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

const Profile = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data states
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    profilePicture: "",
  });

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

    fetchUserData();
  }, [toast]);

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

      // Update in profile details in DB
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
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Profile <span className="text-primary">Settings</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Update your contact details, bio, profile picture, and account settings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Avatar & Quick Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-card border border-border/50 rounded-2xl p-6 text-center shadow-premium relative overflow-hidden">
                {/* Decorative border */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-accent" />

                <div className="relative inline-block mt-4">
                  {/* Profile Picture */}
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

                    {/* Overlay camera icon */}
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
            </div>

            {/* Right Column - Tabs/Forms */}
            <div className="md:col-span-2 space-y-6">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
