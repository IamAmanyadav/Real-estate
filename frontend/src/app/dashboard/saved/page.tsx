"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SavedPropertiesPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Saved Properties</h1>
        <p className="text-muted-foreground text-sm">Properties you&apos;ve saved for later</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center py-20"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-rose-500/60" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Coming Soon
          </span>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Save Your Favorite Properties</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          We&apos;re building a way for you to save and organize your favorite listings.
          In the meantime, browse our available properties and submit inquiries directly.
        </p>
        <Button asChild className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <Link href="/properties">
            Browse Properties
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
