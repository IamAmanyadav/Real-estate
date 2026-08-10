"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import UserSidebar from "@/components/dashboard/UserSidebar";
import UserHeader from "@/components/dashboard/UserHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (isAdmin) {
        // Admin accessing user dashboard → redirect to admin panel
        router.push("/admin");
      }
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <UserSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={user?.role || "buyer"}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"} ml-0 min-w-0`}>
        <UserHeader user={user} onLogout={logout} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
