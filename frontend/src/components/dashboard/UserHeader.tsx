"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useUnreadCount } from "@/hooks/useUnreadCount";

interface UserHeaderProps {
  user: { full_name: string; email: string; role: string; avatar: string | null } | null;
  onLogout: () => void;
}

export default function UserHeader({ user, onLogout }: UserHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { unreadCount } = useUnreadCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const roleLabel = user?.role === "seller" ? "Seller" : "Buyer";

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Welcome back, {user?.full_name?.split(" ")[0] || "User"}!
        </h2>
        <p className="text-xs text-muted-foreground">{roleLabel} Dashboard</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => window.location.href = '/dashboard/messages'}>
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold px-1 shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
              {user.full_name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-full text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
