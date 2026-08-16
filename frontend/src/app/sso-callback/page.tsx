"use client";

import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function SSOCallback() {
  const { user, isLoaded } = useUser();
  const [isUpdating, setIsUpdating] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    const checkAndUpdateRole = async () => {
      if (user) {
        const pendingRole = localStorage.getItem("pending_oauth_role");
        
        // If there's a pending role from the signup screen, inject it into the user's metadata
        if (pendingRole) {
          // Check if it's already set to avoid unnecessary updates
          if (user.unsafeMetadata?.role !== pendingRole) {
            try {
              await user.update({
                unsafeMetadata: {
                  ...user.unsafeMetadata,
                  role: pendingRole
                }
              });
            } catch (err) {
              console.error("Failed to update role during OAuth callback:", err);
            }
          }
          localStorage.removeItem("pending_oauth_role");
        }
      }
      setIsUpdating(false);
    };
    
    checkAndUpdateRole();
  }, [isLoaded, user]);

  if (isUpdating || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <AuthenticateWithRedirectCallback />;
}
