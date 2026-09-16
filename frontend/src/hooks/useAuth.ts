"use client";

import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function getStoredToken(): string | null {
  // Deprecated: APIs should use Clerk's getToken() instead
  return null;
}

export function useAuth() {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const hasSyncedRole = useRef(false);

  const [localActiveRole, setLocalActiveRole] = useState<"buyer" | "seller" | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("active_dashboard_role");
      if (stored === "buyer" || stored === "seller") return stored;
    }
    return null;
  });

  // Listen for role updates across different hook instances and browser tabs
  useEffect(() => {
    const handleRoleSync = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("active_dashboard_role");
        if (stored === "buyer" || stored === "seller") {
          setLocalActiveRole(stored);
        }
      }
    };

    window.addEventListener("storage", handleRoleSync);
    window.addEventListener("active_role_changed", handleRoleSync);
    return () => {
      window.removeEventListener("storage", handleRoleSync);
      window.removeEventListener("active_role_changed", handleRoleSync);
    };
  }, []);

  // Sync pending OAuth role if present
  useEffect(() => {
    if (!isUserLoaded || !clerkUser || hasSyncedRole.current) return;

    const pendingRole = typeof window !== "undefined" ? localStorage.getItem("pending_oauth_role") : null;
    if (pendingRole && (pendingRole === "seller" || pendingRole === "buyer")) {
      hasSyncedRole.current = true;
      setLocalActiveRole(pendingRole);
      localStorage.setItem("active_dashboard_role", pendingRole);
      window.dispatchEvent(new CustomEvent("active_role_changed", { detail: pendingRole }));

      if (clerkUser.unsafeMetadata?.role !== pendingRole) {
        clerkUser.update({
          unsafeMetadata: {
            ...clerkUser.unsafeMetadata,
            role: pendingRole,
          },
        }).then(() => {
          localStorage.removeItem("pending_oauth_role");
        }).catch((err) => {
          console.error("Failed to sync pending OAuth role:", err);
          localStorage.removeItem("pending_oauth_role");
        });
      } else {
        localStorage.removeItem("pending_oauth_role");
      }
    }
  }, [isUserLoaded, clerkUser]);

  const setActiveRole = useCallback(
    async (role: "buyer" | "seller") => {
      setLocalActiveRole(role);
      if (typeof window !== "undefined") {
        localStorage.setItem("active_dashboard_role", role);
        window.dispatchEvent(new CustomEvent("active_role_changed", { detail: role }));
      }
      if (clerkUser && clerkUser.unsafeMetadata?.role !== role) {
        try {
          await clerkUser.update({
            unsafeMetadata: {
              ...clerkUser.unsafeMetadata,
              role,
            },
          });
        } catch (err) {
          console.error("Failed to update Clerk role:", err);
        }
      }
    },
    [clerkUser]
  );

  const switchRole = useCallback(async () => {
    let currentRole = localActiveRole;
    if (!currentRole && typeof window !== "undefined") {
      const stored = localStorage.getItem("active_dashboard_role");
      if (stored === "buyer" || stored === "seller") currentRole = stored;
    }
    if (!currentRole) {
      currentRole = (clerkUser?.unsafeMetadata?.role as "buyer" | "seller") || "buyer";
    }
    const nextRole: "buyer" | "seller" = currentRole === "seller" ? "buyer" : "seller";
    await setActiveRole(nextRole);
    return nextRole;
  }, [localActiveRole, clerkUser, setActiveRole]);

  const user = useMemo(() => {
    if (!clerkUser) return null;
    const isUserAdmin = clerkUser.publicMetadata?.role === "admin" || clerkUser.primaryEmailAddress?.emailAddress === "ishuthapa877@gmail.com";
    
    let computedRole: "admin" | "seller" | "buyer" = "buyer";
    if (isUserAdmin) {
      computedRole = "admin";
    } else if (localActiveRole) {
      computedRole = localActiveRole;
    } else if (clerkUser.unsafeMetadata?.role === "seller" || clerkUser.publicMetadata?.role === "seller") {
      computedRole = "seller";
    } else {
      computedRole = "buyer";
    }

    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      full_name: (clerkUser.publicMetadata?.fullName as string) || (clerkUser.unsafeMetadata?.fullName as string) || clerkUser.fullName || "",
      role: computedRole,
      avatar: clerkUser.imageUrl,
    };
  }, [clerkUser, localActiveRole]);

  // We can't really do login here anymore since it's handled by Clerk's custom pages
  const login = useCallback(async () => {
    throw new Error("Login is now handled by Clerk pages directly.");
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("active_dashboard_role");
      localStorage.removeItem("pending_oauth_role");
    }
    await signOut();
    router.push("/login");
  }, [signOut, router]);

  const redirectByRole = useCallback(
    (userObj: NonNullable<typeof user>) => {
      if (userObj.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/select-role");
      }
    },
    [router]
  );

  return {
    user,
    loading: !isUserLoaded || !isAuthLoaded,
    login,
    logout,
    redirectByRole,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isSeller: user?.role === "seller",
    isBuyer: user?.role === "buyer",
    setActiveRole,
    switchRole,
    getToken,
  };
}


