"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Heart,
  User,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  MessageSquare,
  Mail,
  CalendarDays,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface UserSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userRole: string;
}

const UserSidebar = memo(function UserSidebar({ collapsed, onToggle, userRole }: UserSidebarProps) {
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadMessages();

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Profile", href: "/dashboard/profile", icon: User },
    ...(userRole === "buyer"
      ? [
          { label: "My Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
          { label: "My Appointments", href: "/dashboard/appointments", icon: CalendarCheck },
        ]
      : []),
    ...(userRole === "seller"
      ? [
          { label: "My Listings", href: "/dashboard/listings", icon: Building2 },
          { label: "Add Property", href: "/dashboard/listings/new", icon: Plus },
          { label: "Availability", href: "/dashboard/availability", icon: CalendarDays },
        ]
      : []),
    { label: "Messages", href: "/dashboard/messages", icon: Mail, hasBadge: true },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex fixed top-0 left-0 h-screen z-40 flex-col border-r border-border bg-card/80 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Home className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Luxe Estates
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">{userRole} Dashboard</span>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="user-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-r-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-emerald-500")} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap flex-1"
                >
                  {item.label}
                </motion.span>
              )}
              {(item as any).hasBadge && unreadCount > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
});

export default UserSidebar;
