"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useClerk, useAuth } from "@clerk/nextjs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const clerk = useClerk();
  const isLoaded = clerk.loaded;
  const signIn = clerk.client?.signIn;
  const setActive = clerk.setActive;
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) {
      alert("Clerk is still loading in the background. Please wait a second!");
      return;
    }
    
    setError("");
    setIsLoading(true);

    try {
      if (step === 1) {
        const { supportedFirstFactors } = await signIn.create({
          identifier: email,
        });

        const passwordResetFactor = supportedFirstFactors?.find(
          (factor) => factor.strategy === "reset_password_email_code"
        );

        if (!passwordResetFactor) {
          throw new Error("Password reset is not supported for this account.");
        }

        await signIn.prepareFirstFactor({
          strategy: "reset_password_email_code",
          // @ts-ignore - The types are slightly tricky here but emailAddressId exists
          emailAddressId: passwordResetFactor.emailAddressId,
        });
        setStep(2);
      } else {
        const result = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code,
          password,
        });

        if (result.status === "complete") {
          // Explicitly sign the user out so they are forced to log in with their new password
          await clerk.signOut();
          
          setIsSuccess(true);
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        } else {
          setError("Failed to reset password. Check console.");
        }
      }
    } catch (err: any) {
      console.error("CLERK ERROR:", err);
      // Force an alert so we can absolutely see what Clerk is complaining about!
      alert("Error: " + (err.errors?.[0]?.longMessage || err.message || JSON.stringify(err)));
      setError(err.errors?.[0]?.longMessage || err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
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
              Forgot Your
              <br />
              <span className="text-emerald-200">Password?</span>
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed">
              No worries! Enter your email and we&apos;ll send you a link to
              reset your password in minutes.
            </p>
          </motion.div>

          {/* Security note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  Secure Reset Process
                </p>
                <p className="text-emerald-200/70 text-sm mt-1">
                  The reset link expires in 30 minutes and can only be used
                  once for your safety.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Form */}
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

          {!isSuccess ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Reset your password
                </h2>
                <p className="text-muted-foreground">
                  Enter the email address associated with your account and
                  we&apos;ll send you a reset link.
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {step === 1 ? (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
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
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-sm font-medium">
                        Verification Code
                      </Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors"
                          required
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
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 text-base font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {step === 1 ? "Sending reset link..." : "Resetting password..."}
                    </>
                  ) : (
                    <>
                      {step === 1 ? "Send Reset Link" : "Reset Password"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Check your email
              </h2>
              <p className="text-muted-foreground mb-2">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-6">
                {email}
              </p>
              <div className="p-4 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground mb-6">
                <p>
                  Didn&apos;t receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail("");
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            </motion.div>
          )}

          {/* Back to Login */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
