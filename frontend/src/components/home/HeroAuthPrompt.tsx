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
        <div className="flex flex-col items-center justify-center mt-4">
          <h3 className="text-sm sm:text-base font-medium tracking-widest text-white/80 mb-6 drop-shadow-md uppercase">
            Click to unlock the full portfolio
          </h3>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="group relative cursor-pointer rounded-3xl overflow-hidden aspect-[16/9] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.3)] border border-white/20 transition-all duration-500"
            onClick={() => window.location.href = "/login"}
          >
            {/* Background Image */}
            <img
              src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&auto=format&fit=crop&q=80"
              alt="Premium Real Estate"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            
            {/* Elegant Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/90 backdrop-blur-md flex items-center justify-center border border-emerald-400/50 shadow-lg mb-4 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-300">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                Explore Exclusive Properties
              </h4>
              <p className="text-emerald-400 text-xs sm:text-sm font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                Login to continue <span className="ml-1">→</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
