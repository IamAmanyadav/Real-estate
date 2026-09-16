"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@clerk/nextjs";
import { SetPasswordModal } from "@/components/auth/SetPasswordModal";
import {
  Building2,
  Home,
  ArrowRight,
  Search,
  Heart,
  Gavel,
  CalendarCheck,
  PlusCircle,
  TrendingUp,
  MessageSquare,
  CalendarDays,
  Sparkles,
  ArrowLeftRight,
  LogOut,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin, setActiveRole, logout } = useAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Check if Google user has no password set
  useEffect(() => {
    if (isUserLoaded && clerkUser) {
      if (clerkUser.passwordEnabled === false) {
        setShowPasswordModal(true);
      }
    }
  }, [isUserLoaded, clerkUser]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (isAdmin) {
        router.push("/admin");
      }
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  const handleSelectRole = async (role: "buyer" | "seller") => {
    setSelectedRole(role);
    setIsSubmitting(true);
    try {
      if (setActiveRole) {
        await setActiveRole(role);
      } else {
        localStorage.setItem("active_dashboard_role", role);
      }
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to set active role:", err);
      router.push("/dashboard");
    }
  };

  if (loading || !isAuthenticated || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "there";

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col justify-between">
      {/* Dynamic Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full border-b border-border/60 bg-card/40 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Luxe Estates
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            Signed in as <strong className="text-foreground">{user?.email}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto relative z-10 my-auto">
        {/* Header Branding & Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8 sm:mb-10 space-y-2.5 max-w-2xl"
        >

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Welcome, <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Choose how you would like to use Luxe Estates today. You can freely switch anytime.
          </p>
        </motion.div>

        {/* Dual Role Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full mb-8">
          {/* Buyer Card */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative rounded-3xl p-6 sm:p-8 bg-card/80 dark:bg-card/40 border-2 border-border/80 hover:border-emerald-500/60 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between backdrop-blur-xl"
          >
            <div>
              {/* Card Top Icon & Badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform p-3">
                  <Home className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Buyer / Explorer
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Continue as Buyer
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm mb-6 leading-relaxed">
                Discover dream homes, save properties, submit purchase inquiries, and participate in real-time auctions.
              </p>

              {/* Features List */}
              <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-foreground/85">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <span>Browse luxury homes & virtual tours</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <span>Save favorite listings & price alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Gavel className="w-3.5 h-3.5" />
                  </div>
                  <span>Place live bids in property auctions</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Book in-person viewing appointments</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => handleSelectRole("buyer")}
              disabled={isSubmitting}
              className="w-full py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-600/25 group-hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting && selectedRole === "buyer" ? "Entering..." : "Enter as Buyer"}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Seller Card */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative rounded-3xl p-6 sm:p-8 bg-card/80 dark:bg-card/40 border-2 border-border/80 hover:border-teal-500/60 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-teal-500/10 flex flex-col justify-between backdrop-blur-xl"
          >
            <div>
              {/* Card Top Icon & Badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform p-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  Seller / Homeowner
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Continue as Seller
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm mb-6 leading-relaxed">
                List luxury properties, manage buyer offers & inquiries, host auctions, and set viewing availability.
              </p>

              {/* Features List */}
              <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-foreground/85">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-3.5 h-3.5" />
                  </div>
                  <span>Create & publish high-end property listings</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span>Start live auctions & set reserve prices</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span>Review offers and chat with verified buyers</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </div>
                  <span>Manage visitation calendar & appointments</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => handleSelectRole("seller")}
              disabled={isSubmitting}
              className="w-full py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-teal-600/25 group-hover:shadow-teal-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isSubmitting && selectedRole === "seller" ? "Entering..." : "Enter as Seller"}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* Helpful Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-xs text-muted-foreground bg-muted/40 border border-border/60 py-3 px-5 rounded-2xl w-full max-w-2xl"
        >
          <div className="flex items-center gap-2 shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-foreground">Flexible Account:</span>
          </div>
          <span>You can switch between Buyer and Seller modes at any time from your dashboard header.</span>
        </motion.div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full py-4 text-center text-[11px] text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} Luxe Estates. All rights reserved.
      </footer>

      {/* Set Password Prompt Modal for Google Users */}
      <SetPasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        canSkip={true}
      />
    </div>
  );
}
