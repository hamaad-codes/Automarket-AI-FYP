import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { API_BASE_URL } from "@/config/api";

// TODO: Add your MongoDB connection here
// import { connectToMongoDB } from "@/lib/mongodb";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleCallback = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Google registration failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Success",
        description: "Registered & Logged in with Google successfully!",
      });

      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Google Auth Error",
        description: err.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      const google = (window as any).google;
      const btnContainer = document.getElementById("google-signin-btn");
      if (google && btnContainer) {
        google.accounts.id.initialize({
          client_id: "592873775672-35e3ulc278b2fos28a3o96p6ji9cqgo0.apps.googleusercontent.com",
          callback: handleGoogleCallback,
        });

        google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          width: 382,
          shape: "rectangular",
        });
      }
    };

    initializeGoogle();

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if ((window as any).google && document.getElementById("google-signin-btn")) {
        initializeGoogle();
        clearInterval(interval);
      } else if (attempts >= 20) { // Stop checking after 10 seconds (20 * 500ms)
        clearInterval(interval);
        console.warn("Google Sign-In script failed to load. (Possibly blocked by ad-blocker)");
        const btnContainer = document.getElementById("google-signin-btn");
        if (btnContainer && btnContainer.innerHTML === "") {
          btnContainer.innerHTML = `<div class="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-2.5 rounded-lg border border-yellow-200 text-center w-full">Google Sign-In script blocked (Check ad-blocker)</div>`;
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Registration verification code send failed');
      }

      setDevCode("");
      toast({
        title: "Verification Code Sent",
        description: "Please check your Gmail inbox for the 6-digit verification code.",
      });
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Registration failed',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Registration verification failed');
      }

      console.log("Register and verify successful:", data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast({
        title: "Success",
        description: "Registered & verified successfully!",
      });

      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || 'Failed to verify code and register',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Section - Hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

          {/* Floating Particles */}
          <div className="absolute top-1/4 left-1/3 animate-float">
            <Sparkles className="h-6 w-6 text-primary/30" />
          </div>
          <div className="absolute bottom-1/3 right-1/3 animate-float" style={{ animationDelay: '2s' }}>
            <Sparkles className="h-4 w-4 text-primary/20" />
          </div>
        </div>

        <div className="relative z-10 p-12 lg:p-16 flex flex-col justify-center">
          <Link to="/" className="mb-12 flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-racing rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative h-12 w-12 bg-primary rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-foreground group-hover:text-primary transition-colors">
              Auto<span className="text-primary">Market</span>
            </span>
          </Link>

          <div className="max-w-lg animate-fade-in">
            <p className="text-primary font-semibold tracking-wide text-sm mb-4 uppercase">
              Get Started Today
            </p>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
              Create your{" "}
              <span className="text-gradient">account</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users finding their perfect vehicles with AI-powered assistance.
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-foreground font-medium">Access to 15,000+ vehicle listings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-foreground font-medium">AI-powered search & recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-foreground font-medium">Secure transactions & verified dealers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="relative h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="font-heading font-bold text-2xl tracking-tight text-foreground">
                Auto<span className="text-primary">Market</span>
              </span>
            </Link>
          </div>

          <div className="bg-card rounded-2xl shadow-premium-lg p-8">
            <h2 className="font-heading text-2xl font-bold text-center text-card-foreground mb-2">
              {step === 1 ? "Create Account" : "Verify Email"}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {step === 1 ? "Fill in your details to get started" : `Enter the 6-digit verification code sent to ${email}`}
            </p>

            {step === 1 ? (
              <form onSubmit={handleRequestVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 rounded-xl border-border bg-background/50 input-focus"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Email address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 rounded-xl border-border bg-background/50 input-focus"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 rounded-xl border-border bg-background/50 pr-12 input-focus"
                      placeholder="••••••••"
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

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-12 rounded-xl border-border bg-background/50 pr-12 input-focus"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-0.5 mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending code..." : "Create Account"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="w-full flex justify-center">
                  <div id="google-signin-btn" className="w-full flex justify-center" />
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-12 rounded-xl border-border bg-background/50 tracking-widest font-mono text-center text-lg input-focus"
                    placeholder="e.g., 123456"
                    required
                  />
                </div>



                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify & Sign Up"}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
                >
                  Change account details / email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;