"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Shield, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getProfile, updateProfile } from "@/lib/buyer-api";
import type { UserProfile } from "@/lib/buyer-api";
import ProfileAvatarUpload from "@/components/dashboard/ProfileAvatarUpload";

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setAvatar(profile.avatar || null);
    } else if (user) {
      setFullName(user.full_name || "");
    }
  }, [profile, user]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated: any) => {
      queryClient.setQueryData(["profile"], updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: () => {
      setSaveError("Failed to update profile. Please try again.");
    }
  });

  const handleSave = () => {
    setSaveError("");
    setSaveSuccess(false);
    updateMutation.mutate({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      avatar: avatar || undefined,
    });
  };

  const handleCancel = () => {
    // Reset to current profile data
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setAvatar(profile.avatar || null);
    }
    setIsEditing(false);
    setSaveError("");
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
      seller: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      buyer: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    };
    return colors[role] || colors.buyer;
  };

  const formatMemberSince = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const displayName = profile?.fullName || user?.full_name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const displayRole = profile?.role || user?.role || "buyer";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account information</p>
      </motion.div>

      {/* Success / Error Messages */}
      {saveSuccess && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Profile updated successfully!
        </motion.div>
      )}
      {saveError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {saveError}
        </motion.div>
      )}

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <ProfileAvatarUpload 
                currentAvatar={avatar} 
                name={displayName} 
                onUploadSuccess={(url) => {
                  setAvatar(url);
                  setIsEditing(true); // Switch to edit mode so they can save
                }} 
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold">{displayName}</h2>
                  <Badge variant="outline" className={getRoleBadge(displayRole)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {displayRole.charAt(0).toUpperCase()}{displayRole.slice(1)}
                  </Badge>
                  {profile?.isVerified && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{displayEmail}</p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="rounded-full"
                      disabled={updateMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </Label>
                {isEditing ? (
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl" />
                ) : (
                  <p className="text-sm font-medium">{displayName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email
                </Label>
                <p className="text-sm font-medium">{displayEmail}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </Label>
                {isEditing ? (
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="rounded-xl" />
                ) : (
                  <p className="text-sm font-medium">{profile?.phone || "Not provided"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Role
                </Label>
                <p className="text-sm font-medium capitalize">{displayRole}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Member Since
                </Label>
                <p className="text-sm font-medium">
                  {profile?.createdAt ? formatMemberSince(profile.createdAt) : "—"}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label className="text-sm text-muted-foreground">Bio</Label>
              {isEditing ? (
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." className="rounded-xl min-h-[80px]" />
              ) : (
                <p className="text-sm text-foreground">{profile?.bio || "No bio provided yet."}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Contact admin to reset your password</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" disabled>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
