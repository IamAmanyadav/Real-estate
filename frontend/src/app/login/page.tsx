"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Verification states
  const [step, setStep] = useState<"login" | "verify">("login");
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState<any>(null);
  const [isSecondFactor, setIsSecondFactor] = useState(false);

  const { client, setActive } = useClerk();
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !client.signIn) return;
    setError("");
    setIsLoading(true);

    try {
      const result = await client.signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else if (result.status === "needs_first_factor" || result.status === "needs_second_factor" || result.status === "needs_client_trust") {
        const isSecond = result.status === "needs_second_factor" || result.status === "needs_client_trust";
        setIsSecondFactor(isSecond);
        
        const factors = isSecond ? result.supportedSecondFactors : result.supportedFirstFactors;
        
        // Find a supported factor (e.g., email_code, phone_code, totp)
        const emailCodeFactor = factors?.find((f) => f.strategy === "email_code");
        const phoneCodeFactor = factors?.find((f) => f.strategy === "phone_code");
        const totpFactor = factors?.find((f) => f.strategy === "totp");
        
        const selectedFactor = emailCodeFactor || phoneCodeFactor || totpFactor || factors?.[0];

        if (!selectedFactor) {
          setError("No supported verification methods found.");
          setIsLoading(false);
          return;
        }

        setFactor(selectedFactor);

        // Prepare the factor if it requires preparation (like sending an email/SMS code)
        if (selectedFactor.strategy === "email_code" || selectedFactor.strategy === "phone_code") {
          if (isSecond) {
            await client.signIn.prepareSecondFactor({
              strategy: selectedFactor.strategy,
              phoneNumberId: selectedFactor.phoneNumberId,
            } as any);
          } else {
            await client.signIn.prepareFirstFactor({
              strategy: selectedFactor.strategy,
              emailAddressId: selectedFactor.emailAddressId,
              phoneNumberId: selectedFactor.phoneNumberId,
            } as any);
          }
        }

        setStep("verify");
      } else {
        console.log(result);
        setError(`Unexpected status: ${result.status}. Check console.`);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !client.signIn || !factor) return;
    setError("");
    setIsLoading(true);

    try {
      let result;
      if (isSecondFactor) {
        result = await client.signIn.attemptSecondFactor({
          strategy: factor.strategy,
          code,
        });
      } else {
        result = await client.signIn.attemptFirstFactor({
          strategy: factor.strategy,
          code,
        });
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        console.log(result);
        setError(`Unexpected status after verification: ${result.status}`);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Verification failed. Invalid code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!client || !client.signIn || !factor) return;
    setError("");
    setIsLoading(true);

    try {
      if (factor.strategy === "email_code" || factor.strategy === "phone_code") {
        if (isSecondFactor) {
          await client.signIn.prepareSecondFactor({
            strategy: factor.strategy,
            phoneNumberId: factor.phoneNumberId,
          } as any);
        } else {
          await client.signIn.prepareFirstFactor({
            strategy: factor.strategy,
            emailAddressId: factor.emailAddressId,
            phoneNumberId: factor.phoneNumberId,
          } as any);
        }
        alert("Verification code resent successfully.");
      } else {
        setError("Resend is not supported for this verification method.");
      }
    } catch (err: any) {
      console.error("Resend error:", err);
      setError(err.errors?.[0]?.longMessage || err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep("login");
    setCode("");
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
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
              Welcome Back to
              <br />
              <span className="text-emerald-200">Your Property Hub</span>
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed">
              Access your personalized dashboard. Whether you&apos;re buying, selling, or managing
              — everything you need is right here.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            {[
              { value: "2,500+", label: "Properties" },
              { value: "1,800+", label: "Happy Clients" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-emerald-200/70">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background relative">
        <AnimatePresence mode="wait">
          {step === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
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
                  Sign in to your account
                </h2>
                <p className="text-muted-foreground">
                  Enter your credentials to access your dashboard
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

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-5">
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

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                      required
                      autoComplete="current-password"
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

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 p-5 rounded-xl bg-muted/50 border border-border text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Don&apos;t have an account yet?
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl border-emerald-500/30 hover:bg-emerald-500/5 hover:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-medium"
                  asChild
                >
                  <Link href="/register">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create an Account
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link href="/" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                  ← Back to Home
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToLogin}
                className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>

              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Verify your identity
                </h2>
                <p className="text-muted-foreground">
                  {factor?.strategy === "email_code" 
                    ? `We sent a verification code to your email (${factor.safeIdentifier || email}).`
                    : factor?.strategy === "phone_code"
                    ? `We sent a verification code to your phone ending in ${factor.safeIdentifier}.`
                    : factor?.strategy === "totp"
                    ? "Please enter the authentication code from your authenticator app."
                    : "Please complete the required verification step."}
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

              {/* Verification Form */}
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter the code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors text-center text-lg tracking-widest font-mono"
                    required
                    autoFocus
                  />
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
                      Verify and Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {(factor?.strategy === "email_code" || factor?.strategy === "phone_code") && (
                <div className="mt-8 p-5 rounded-xl bg-muted/50 border border-border text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Didn&apos;t receive the code?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl border-emerald-500/30 hover:bg-emerald-500/5 hover:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-medium"
                  >
                    Resend Code
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
