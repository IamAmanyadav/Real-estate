"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Building2,
  Menu,
  Sun,
  Moon,
  Phone,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_LINKS, APP_NAME } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user: authUser } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardHref = authUser?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                  pathname === link.href
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
                aria-label="Toggle dark mode"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            )}

            <Show when="signed-out">
              <Button variant="ghost" className="hidden sm:inline-flex rounded-full" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="default" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 rounded-full px-6" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              {authUser && (
                <Button
                  variant="default"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 rounded-full px-6 mr-2"
                  asChild
                >
                  <Link href={dashboardHref}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
            </Show>
          </div>

          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
                aria-label="Toggle dark mode"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Menu className="h-5 w-5" />
                    </Button>
                  }
                />
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetTitle className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-lg">{APP_NAME}</span>
                </SheetTitle>
                <nav className="flex flex-col gap-2">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        pathname === link.href
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <Show when="signed-out">
                      <Button className="w-full mb-2 bg-accent text-accent-foreground hover:bg-accent/80 rounded-full" asChild>
                        <Link href="/login" onClick={() => setOpen(false)}>
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </Link>
                      </Button>
                      <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full" asChild>
                        <Link href="/register" onClick={() => setOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </Show>
                    <Show when="signed-in">
                      {authUser && (
                        <Button
                          className="w-full mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full"
                          asChild
                        >
                          <Link href={dashboardHref} onClick={() => setOpen(false)}>
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Dashboard
                          </Link>
                        </Button>
                      )}
                    </Show>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
