"use client";

import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

export function getStoredToken(): string | null {
  // Deprecated: APIs should use Clerk's getToken() instead
  return null;
}

export function useAuth() {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useClerkAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const user = useMemo(() => {
    if (!clerkUser) return null;
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      full_name: (clerkUser.publicMetadata.fullName as string) || (clerkUser.unsafeMetadata.fullName as string) || clerkUser.fullName || "",
      role: (clerkUser.publicMetadata.role as "admin" | "seller" | "buyer") || (clerkUser.unsafeMetadata.role as "admin" | "seller" | "buyer") || "buyer",
      avatar: clerkUser.imageUrl,
    };
  }, [clerkUser]);

  // We can't really do login here anymore since it's handled by Clerk's custom pages
  const login = useCallback(async () => {
    throw new Error("Login is now handled by Clerk pages directly.");
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    router.push("/login");
  }, [signOut, router]);

  const redirectByRole = useCallback(
    (userObj: NonNullable<typeof user>) => {
      if (userObj.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
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
    getToken,
  };
}
