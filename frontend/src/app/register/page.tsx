"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, Eye, EyeOff, Lock, Mail, User, ArrowRight,
  AlertCircle, Loader2, Home, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type Role = "buyer" | "seller";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"role" | "method" | "manual" | "verify">("role");
  const [code, setCode] = useState("");

  const { client, setActive } = useClerk();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !client.signUp) {
      setError("Clerk is still loading. Please wait or refresh the page.");
      return;
    }
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const createdSignUp = await client.signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { 
          role,
          fullName 
        },
      });

      if (createdSignUp.status === "complete") {
         // No verification needed, log them in
         await setActive({ session: createdSignUp.createdSessionId });
         router.push("/dashboard");
         return;
      }

      if (typeof client.signUp.prepareVerification === "function") {
        await client.signUp.prepareVerification({ strategy: "email_code" });
      } else if (typeof (client.signUp as any).prepareEmailAddressVerification === "function") {
        await (client.signUp as any).prepareEmailAddressVerification({ strategy: "email_code" });
      } else {
        throw new Error("Could not find Clerk verification method on client.signUp.");
      }
      
      setStep("verify");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!client || !client.signUp) return;
    setIsLoading(true);
    try {
      localStorage.setItem("pending_oauth_role", role);
      await client.signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error("Google sign up error:", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Google Sign Up failed.");
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !client.signUp) return;
    setError("");
    setIsLoading(true);
    try {
      let completeSignUp;
      if (typeof client.signUp.attemptVerification === "function") {
        completeSignUp = await client.signUp.attemptVerification({
          strategy: "email_code",
          code,
        });
      } else if (typeof (client.signUp as any).attemptEmailAddressVerification === "function") {
        completeSignUp = await (client.signUp as any).attemptEmailAddressVerification({
          code,
        });
      } else {
        throw new Error("Verification method missing on client.signUp.");
      }

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/dashboard");
      } else {
        console.log(completeSignUp);
        setError("Verification incomplete. Check console.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Waterfront Luxury Living Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        {/* Background Image: Waterfront Luxury Villa Dining overlooking Sea */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('/images/auth-bg.jpg')`,
          }}
        />

        {/* Elegant Subtle Dark Gradient Overlays for High Image Clarity & Sharp Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 h-full w-full">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide drop-shadow">Luxe Estates</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="my-auto max-w-lg"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold tracking-widest uppercase mb-6 shadow-sm">
              <span>Premier Marketplace</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg font-serif">
              Join the Premier
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Real Estate Platform
              </span>
            </h1>
            <p className="text-white/90 text-lg leading-relaxed drop-shadow">
              Create your account to start buying or selling properties.
              Your dream home or next big sale is just a click away.
            </p>
          </motion.div>

          {/* Features Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/35 backdrop-blur-xl rounded-2xl border border-white/20 p-5 space-y-3 shadow-2xl"
          >
            {[
              { icon: Home, text: "Browse verified luxury property listings" },
              { icon: Store, text: "List and manage your prime properties" },
              { icon: Building2, text: "Admin-verified for maximum trust & safety" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                  <item.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Luxe Estates
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Create your account
            </h2>
            <p className="text-muted-foreground">
              Sign up to get started with Luxe Estates
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <div id="clerk-captcha"></div>

          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                <div className="relative">
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Email
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : step === "role" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">I want to</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setRole("buyer")}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                      role === "buyer"
                        ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10 scale-[1.02]"
                        : "border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-accent/30"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      role === "buyer"
                        ? "bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/25"
                        : "bg-muted"
                    }`}>
                      <Home className={`w-6 h-6 ${role === "buyer" ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="text-center">
                      <span className={`block text-base font-bold ${role === "buyer" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                        Buy Property
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 block">Browse & inquire</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("seller")}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                      role === "seller"
                        ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10 scale-[1.02]"
                        : "border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-accent/30"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      role === "seller"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25"
                        : "bg-muted"
                    }`}>
                      <Store className={`w-6 h-6 ${role === "seller" ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="text-center">
                      <span className={`block text-base font-bold ${role === "seller" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                        Sell Property
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 block">List & manage</span>
                    </div>
                  </button>
                </div>
              </div>
              <Button
                onClick={() => setStep("method")}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 text-base font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : step === "method" ? (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                className="w-full h-14 rounded-xl border-border hover:bg-accent hover:text-accent-foreground font-medium text-base shadow-sm"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground font-medium">Or</span>
                </div>
              </div>

              <Button
                onClick={() => setStep("manual")}
                variant="secondary"
                className="w-full h-14 rounded-xl font-medium text-base shadow-sm"
              >
                <Mail className="w-5 h-5 mr-3" />
                Sign up with Email
              </Button>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                >
                  ← Back to role selection
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 h-12 rounded-xl bg-muted/50 focus:bg-background transition-colors ${
                      confirmPassword && password !== confirmPassword 
                        ? "border-2 border-red-500 focus:border-red-500" 
                        : "border-border"
                    }`}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 text-base font-medium mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setStep("method")}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-sm text-muted-foreground">
            <Link href="/" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
              ← Back to Home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
