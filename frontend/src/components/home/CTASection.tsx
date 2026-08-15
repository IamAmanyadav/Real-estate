"use client";

import { motion } from "framer-motion";
import { Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] p-6 sm:p-12 lg:p-16 bg-black min-h-[540px] sm:min-h-[620px] flex items-center"
        >
          {/* Background Image: Zoomed-out Sunset Penthouse Living Room Interior */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-[center_25%] bg-no-repeat transition-transform duration-1000"
            style={{
              backgroundImage: `url('/images/cta-bg.jpg')`,
            }}
          />

          {/* Minimal Soft Vignette so the whole room & sunset sky shine through */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />

          {/* Frosted Glass Content Panel */}
          <div className="relative z-10 max-w-xl bg-black/45 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/20 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white/90 text-xs font-semibold tracking-widest uppercase mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Personalized Guidance</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight font-serif drop-shadow-lg">
              Ready to Find Your
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                Perfect Home?
              </span>
            </h2>

            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-8 drop-shadow">
              Let our expert agents guide you through the process. Whether you&apos;re
              buying, selling, or renting — we&apos;re here to help every step of the way.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-emerald-950 hover:bg-white/90 rounded-full px-8 py-6 text-base font-semibold shadow-2xl hover:scale-105 transition-all"
                asChild
              >
                <Link href="/contact">
                  <Phone className="w-4 h-4 mr-2 text-emerald-700" />
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

