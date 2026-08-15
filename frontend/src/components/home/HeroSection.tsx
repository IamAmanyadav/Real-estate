"use client";

import { motion } from "framer-motion";
import { Sparkles, LogIn, UserPlus, Lock, ShieldCheck, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SearchBar from "@/components/properties/SearchBar";
import { useAuth } from "@/hooks/useAuth";

const PRESS_LOGOS = [
  { name: "Architectural Digest", label: "ARCHITECTURAL DIGEST" },
  { name: "Vogue Living", label: "VOGUE LIVING" },
  { name: "Forbes", label: "FORBES" },
  { name: "Dwell", label: "DWELL" },
  { name: "The Wall Street Journal", label: "WSJ REAL ESTATE" },
  { name: "Robb Report", label: "ROBB REPORT" },
];

export default function HeroSection() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <>
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
        {/* Full-Screen Luxury Architectural Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="w-full h-full"
          >
            {/* Background Image: Exact user provided luxury symmetrical modern villa */}
            <div
              className="w-full h-full bg-cover bg-[center_45%] bg-no-repeat transition-transform duration-1000"
              style={{
                backgroundImage: `url('/images/hero-bg.jpg')`,
              }}
            />
          </motion.div>

          {/* Cinematic Vignette & Gradient Overlays for perfect text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-black/75" />
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Subtle warm glow orbs for luxury depth */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
        </div>

        {/* Top Spacer for balance */}
        <div className="relative z-10" />

        {/* Main Centered Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center my-auto py-8">
          {/* Subtitle / Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            #India's Premium Real Estate Platform
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 uppercase"
          >
            <span className="block font-light tracking-widest text-white/90 text-3xl sm:text-5xl md:text-6xl mb-1">
              Find Your
            </span>
            <span className="block font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent drop-shadow-2xl">
              Dream Property
            </span>
          </motion.h1>

          {/* Subtitle description */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow"
          >
            Explore thousands of premium properties curated just for you. From luxury villas to modern apartments, your perfect home awaits.
          </motion.p>

          {/* Conditional: Search Bar (authenticated) or Auth Prompt (unauthenticated) */}
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


        </div>

        {/* Stats Row Overlay at bottom */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-full border border-white/15 p-4 sm:px-8 sm:py-4 shadow-2xl"
          >
            {[
              { value: "10+", label: "Properties" },
              { value: "5+", label: "Happy Clients" },
              { value: "1+", label: "Years" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat, idx) => (
              <div key={stat.label} className={`text-center ${idx !== 0 ? "sm:border-l sm:border-white/15" : ""}`}>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-[11px] sm:text-xs text-white/70 tracking-wider uppercase mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AS SEEN IN / Editorial Media Ribbon (Matching the Reference Mockup) */}
      <section className="bg-card/70 dark:bg-card/30 border-y border-border py-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs tracking-[0.3em] font-semibold text-muted-foreground uppercase mb-6">
            AS SEEN IN
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 md:gap-16 opacity-75">
            {PRESS_LOGOS.map((press) => (
              <span
                key={press.name}
                className="text-xs sm:text-sm md:text-base font-serif tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase font-medium"
              >
                {press.label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

