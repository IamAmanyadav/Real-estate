"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Bell, MessageSquare, Building2, Home, User as UserIcon } from "lucide-react";
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
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserHeaderProps {
  user: { id: string; full_name: string; email: string; role: string; avatar: string | null } | null;
  onLogout: () => void;
}

export default function UserHeader({ user, onLogout }: UserHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: unreadCount = 0 } = useUnreadMessages();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayAvatar = profile?.avatar || user?.avatar;
  const isSeller = user?.role === "seller";
  const roleLabel = isSeller ? "Seller" : "Buyer";

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground leading-tight">
            Welcome back, {user?.full_name?.split(" ")[0] || "User"}!
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isSeller 
                ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20" 
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            }`}>
              {isSeller ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
              {roleLabel} Mode
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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
              <DropdownMenuItem onClick={() => router.push('/dashboard/messages')} className="cursor-pointer gap-3 p-3">
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
            <DropdownMenuItem onClick={() => router.push('/dashboard/messages')} className="cursor-pointer justify-center text-emerald-600 font-medium">
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

        {/* User Info & Dropdown */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-accent/60 transition-colors text-left cursor-pointer outline-none">
                    {displayAvatar ? (
                      <img src={getImageUrl(displayAvatar) || ""} alt={user.full_name} className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-foreground leading-tight">{user.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl">
                <div className="px-3 py-2">
                  <p className="text-sm font-bold text-foreground">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/select-role")} className="cursor-pointer gap-2.5 rounded-xl py-2.5 text-xs font-medium focus:bg-teal-500/10 focus:text-teal-600">
                  <Building2 className="w-4 h-4 text-teal-500" />
                  <span>Switch Account / Role</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer gap-2.5 rounded-xl py-2.5 text-xs font-medium">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer gap-2.5 rounded-xl py-2.5 text-xs font-medium text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

