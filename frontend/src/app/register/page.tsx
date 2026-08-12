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
  const [pendingVerification, setPendingVerification] = useState(false);
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
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
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
      
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Registration failed. Please try again.");
    } finally {
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
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Luxe Estates</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Join the Premier
              <br />
              <span className="text-emerald-200">Real Estate Platform</span>
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed">
              Create your account to start buying or selling properties.
              Your dream home or next big sale is just a click away.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 space-y-4"
          >
            {[
              { icon: Home, text: "Browse verified property listings" },
              { icon: Store, text: "List and manage your properties" },
              { icon: Building2, text: "Admin-verified for trust & safety" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-emerald-100/90">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-white" />
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

          {pendingVerification ? (
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
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">I want to</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === "buyer"
                      ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10"
                      : "border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-accent/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    role === "buyer"
                      ? "bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/25"
                      : "bg-muted"
                  }`}>
                    <Home className={`w-5 h-5 ${role === "buyer" ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-semibold ${role === "buyer" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                    Buy Property
                  </span>
                  <span className="text-[11px] text-muted-foreground">Browse & inquire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    role === "seller"
                      ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10"
                      : "border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-accent/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    role === "seller"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25"
                      : "bg-muted"
                  }`}>
                    <Store className={`w-5 h-5 ${role === "seller" ? "text-white" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-sm font-semibold ${role === "seller" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                    Sell Property
                  </span>
                  <span className="text-[11px] text-muted-foreground">List & manage</span>
                </button>
              </div>
            </div>

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
                  placeholder="Min. 12 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                  minLength={12}
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
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div id="clerk-captcha"></div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 text-base font-medium"
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
