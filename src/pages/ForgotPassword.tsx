import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Reset Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [devCode, setDevCode] = useState(""); // Holds mock code for testing convenience
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Something went wrong");
      }

      setDevCode("");
      toast({
        title: "Code Sent",
        description: "Please check your Gmail inbox for the 6-digit verification code.",
      });
      setStep(2);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to request reset code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Invalid code");
      }

      toast({
        title: "Code Verified",
        description: "Please enter your new password.",
      });
      setStep(3);
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.message || "Code verification failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully. Please log in.",
      });
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Decorative Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="w-full max-w-md bg-card border border-border/50 shadow-premium-lg rounded-2xl p-8 z-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 group transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Sign In
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter Verification Code"}
            {step === 3 && "Set New Password"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {step === 1 && "Enter your email address and we'll send you a 6-digit OTP code to verify your identity."}
            {step === 2 && `Enter the 6-digit verification code sent to ${email}.`}
            {step === 3 && "Create a secure, strong password for your AutoMarket account."}
          </p>
        </div>

        {/* Step 1: Send Code */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-12 h-12 rounded-xl"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-semibold shadow-premium hover:shadow-premium-lg transition-all">
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">6-Digit Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., 123456"
                  className="pl-12 h-12 rounded-xl tracking-widest font-mono text-center text-lg"
                  required
                />
              </div>
            </div>



            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-semibold shadow-premium hover:shadow-premium-lg transition-all">
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
            >
              Didn't get the code? Change email and retry
            </button>
          </form>
        )}

        {/* Step 3: Set Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-semibold shadow-premium hover:shadow-premium-lg transition-all">
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
