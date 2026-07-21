import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { API_BASE_URL } from "@/config/api";

// TODO: Add your MongoDB connection here
// import { connectToMongoDB } from "@/lib/mongodb";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
      if (!res.ok) throw new Error(data.msg || "Google login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Success",
        description: "Logged in with Google successfully!",
      });

      // Quick reload/navigate to main page
      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Google Login Error",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      console.log("Login attempt successful:", data);

      toast({
        title: "Success",
        description: "Login successful!",
      });
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Error",
        description: errorMessage,
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
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

          {/* Animated Road Line */}
          <div className="absolute bottom-32 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute bottom-32 animate-drive">
            <Car className="h-8 w-8 text-primary/40" />
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
              Welcome Back
            </p>
            <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
              Sign in to your{" "}
              <span className="text-gradient">account</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Access your personalized dashboard, saved searches, and continue your vehicle journey.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-card/80 backdrop-blur rounded-full text-sm font-medium text-foreground shadow-sm">
                🚗 Smart Recommendations
              </div>
              <div className="px-4 py-2 bg-card/80 backdrop-blur rounded-full text-sm font-medium text-foreground shadow-sm">
                🔔 Price Alerts
              </div>
              <div className="px-4 py-2 bg-card/80 backdrop-blur rounded-full text-sm font-medium text-foreground shadow-sm">
                📊 Market Insights
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
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
              Welcome Back
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Enter your credentials to continue
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-border"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="w-full flex justify-center">
                <div id="google-signin-btn" className="w-full flex justify-center" />
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;