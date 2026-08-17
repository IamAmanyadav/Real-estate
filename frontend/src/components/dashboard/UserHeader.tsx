"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/buyer-api";
import { getImageUrl } from "@/lib/utils";

interface UserHeaderProps {
  user: { full_name: string; email: string; role: string; avatar: string | null } | null;
  onLogout: () => void;
}

export default function UserHeader({ user, onLogout }: UserHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: unreadCount = 0 } = useUnreadMessages();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayAvatar = profile?.avatar || user?.avatar;

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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold px-1 shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-64 rounded-xl">
            <div className="px-3 py-2 text-sm font-semibold text-foreground">Notifications</div>
            <DropdownMenuSeparator />
            {unreadCount > 0 ? (
              <DropdownMenuItem onClick={() => window.location.href = '/dashboard/messages'} className="cursor-pointer gap-3 p-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">New Messages</span>
                  <span className="text-xs text-muted-foreground">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
                </div>
              </DropdownMenuItem>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/dashboard/messages'} className="cursor-pointer justify-center text-emerald-600 font-medium">
              View all messages
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
            {displayAvatar ? (
              <img src={getImageUrl(displayAvatar) || ""} alt={user.full_name} className="w-8 h-8 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                {user.full_name?.charAt(0) || "U"}
              </div>
            )}
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
