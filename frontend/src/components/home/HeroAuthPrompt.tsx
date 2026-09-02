"use client";

import { m as motion } from "framer-motion";
import { LogIn, UserPlus, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SearchBar from "@/components/properties/SearchBar";
import { useAuth } from "@/hooks/useAuth";

export default function HeroAuthPrompt() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="max-w-4xl mx-auto mb-8"
    >
      {loading ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      ) : isAuthenticated ? (
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-3 sm:p-4 border border-white/20 shadow-2xl">
          <SearchBar variant="hero" />
        </div>
      ) : (
        <div className="bg-transparent text-white max-w-xl mx-auto py-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-medium tracking-wide text-white mb-1.5 drop-shadow-md">
            Sign in to explore properties
          </h3>
          <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto mb-6 leading-relaxed font-light drop-shadow">
            Create a free account or log in to search listings, schedule visits, and connect with sellers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-950/60 rounded-full px-8 h-11 text-xs font-semibold uppercase tracking-wider transition-all duration-200"
              asChild
            >
              <Link href="/login">
                <LogIn className="w-3.5 h-3.5 mr-2" />
                Sign In
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-full px-8 h-11 text-xs font-semibold uppercase tracking-wider border-white/40 hover:border-white bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-200 shadow-lg"
              asChild
            >
              <Link href="/register">
                <UserPlus className="w-3.5 h-3.5 mr-2" />
                Create Account
              </Link>
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/70 drop-shadow">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Free to join · No credit card required
          </div>
        </div>
      )}
    </motion.div>
  );
}
