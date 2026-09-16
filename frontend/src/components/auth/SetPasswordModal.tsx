"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  canSkip?: boolean;
}

export function SetPasswordModal({
  open,
  onOpenChange,
  onSuccess,
  canSkip = true,
}: SetPasswordModalProps) {
  const { user: clerkUser } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isChanging = clerkUser?.passwordEnabled === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isChanging && !currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!clerkUser) {
      setError("User session not found. Please refresh the page.");
      return;
    }

    try {
      setLoading(true);
      await clerkUser.updatePassword({
        newPassword: password,
        currentPassword: isChanging ? currentPassword : undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to set password:", err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Failed to set password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("skipped_password_prompt", "true");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto sm:mx-0 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isChanging ? "Change Account Password" : "Set an Account Password"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isChanging
                ? "Update your password to keep your account secure."
                : "You signed in with Google. Create a password so you can also log in from other devices using your email and password."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isChanging ? "Password Updated Successfully!" : "Password Set Successfully!"}
            </p>
            <p className="text-xs text-muted-foreground">You can now use your password to log in on any device.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isChanging && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Current Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  className="rounded-xl bg-background/50 border-border"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10 rounded-xl bg-background/50 border-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Confirm Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="rounded-xl bg-background/50 border-border"
                required
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 py-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md cursor-pointer"
              >
                {loading ? "Saving..." : (isChanging ? "Update Password" : "Save Password")}
              </Button>
              {canSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={loading}
                  className="w-full sm:w-auto py-5 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Skip for now
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
