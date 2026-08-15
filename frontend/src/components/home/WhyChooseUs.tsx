"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Handshake,
  TrendingUp,
  Clock,
  HeadphonesIcon,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    icon: Shield,
    title: "Verified Listings Only",
    description:
      "Every property on Luxe Estates goes through a rigorous admin verification process. We ensure authenticity of ownership documents, property details, and images before any listing goes live.",
    accent: "from-emerald-400 to-teal-300",
    iconColor: "text-emerald-400",
    image: "/images/why-choose-1.jpg",
  },
  {
    icon: Handshake,
    title: "Transparent Transactions",
    description:
      "No hidden fees, no surprise charges. We believe in complete transparency — from listing price to closing costs. Our platform connects you directly with sellers for honest, straightforward deals.",
    accent: "from-blue-400 to-cyan-300",
    iconColor: "text-blue-400",
    image: "/images/why-choose-2.jpg",
  },
  {
    icon: TrendingUp,
    title: "Market-Driven Pricing",
    description:
      "Our properties are priced based on real market data and expert appraisals. Whether you're buying or selling, you can trust that every valuation reflects the true worth of the property.",
    accent: "from-violet-400 to-purple-300",
    iconColor: "text-purple-400",
    image: "/images/why-choose-3.jpg",
  },
  {
    icon: Clock,
    title: "Fast & Simple Process",
    description:
      "List a property in minutes. Inquire about your dream home instantly. Our streamlined workflow removes unnecessary steps so you can focus on what matters — finding the perfect property.",
    accent: "from-amber-400 to-orange-300",
    iconColor: "text-amber-400",
    image: "/images/why-choose-4.jpg",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    description:
      "Have questions or need assistance? Our dedicated team is always ready to help — whether it's about a listing, an inquiry, or navigating the platform. We're just a message away.",
    accent: "from-rose-400 to-pink-300",
    iconColor: "text-rose-400",
    image: "/images/why-choose-5.jpg",
  },
  {
    icon: Award,
    title: "Trusted by Thousands",
    description:
      "Join a growing community of satisfied buyers and sellers. With years of experience and thousands of successful transactions, Luxe Estates is the name you can trust in premium real estate.",
    accent: "from-teal-400 to-emerald-300",
    iconColor: "text-teal-400",
    image: "/images/why-choose-6.jpg",
  },
];

export default function WhyChooseUs() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-play every 6 seconds
  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em]">
            Why Luxe Estates
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2 mb-4 tracking-tight">
            Why Choose Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg font-light">
            We go beyond just listings — we deliver trust, transparency, and a
            seamless real estate experience you can count on.
          </p>
        </motion.div>

        {/* Large Slider Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            className="absolute left-3 sm:-left-7 top-1/2 -translate-y-1/2 z-30 rounded-full w-12 h-12 sm:w-16 sm:h-16 border-white/30 bg-black/50 hover:bg-black/80 backdrop-blur-xl text-white shadow-2xl transition-all duration-200"
          >
            <ChevronLeft className="w-7 h-7" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            className="absolute right-3 sm:-right-7 top-1/2 -translate-y-1/2 z-30 rounded-full w-12 h-12 sm:w-16 sm:h-16 border-white/30 bg-black/50 hover:bg-black/80 backdrop-blur-xl text-white shadow-2xl transition-all duration-200"
          >
            <ChevronRight className="w-7 h-7" />
          </Button>

          {/* Expanded Card with Zero-Gap Crossfade */}
          <div className="relative overflow-hidden rounded-3xl sm:rounded-[3rem] border border-white/20 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.45)] min-h-[540px] sm:min-h-[580px] lg:min-h-[620px] bg-black">
            {/* Seamless Layered Background Images */}
            {SLIDES.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={false}
                animate={{
                  opacity: idx === current ? 1 : 0,
                  scale: idx === current ? 1 : 1.06,
                }}
                transition={{
                  opacity: { duration: 0.8, ease: "easeInOut" },
                  scale: { duration: 1.4, ease: "easeOut" },
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <div
                  className="w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url('${item.image}')` }}
                />
              </motion.div>
            ))}

            {/* High-Clarity Transparent Overlays (Vivid Image + Sharp Readability) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/45 pointer-events-none" />
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />

            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col justify-between items-center text-center p-8 sm:p-14 lg:p-18 min-h-[540px] sm:min-h-[580px] lg:min-h-[620px]">
              {/* Top Slide Counter Tag */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white/95 text-xs sm:text-sm font-semibold tracking-widest uppercase shadow-md">
                <span>0{current + 1}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/60">0{SLIDES.length}</span>
              </div>

              {/* Main Content Area */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="my-auto py-6 max-w-4xl flex flex-col items-center"
                >
                  {/* Icon */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/30 flex items-center justify-center mb-8 shadow-2xl">
                    <slide.icon className={`w-10 h-10 sm:w-12 sm:h-12 ${slide.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-xl tracking-tight font-serif">
                    <span
                      className={`bg-gradient-to-r ${slide.accent} bg-clip-text text-transparent`}
                    >
                      {slide.title}
                    </span>
                  </h3>

                  {/* Description with high clarity */}
                  <div className="bg-black/35 backdrop-blur-md rounded-2xl sm:rounded-3xl px-8 py-6 border border-white/15 shadow-xl max-w-3xl">
                    <p className="text-white/95 text-base sm:text-xl md:text-2xl leading-relaxed font-light drop-shadow">
                      {slide.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-2.5 pt-4">
                {SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`rounded-full transition-all duration-300 ${
                      index === current
                        ? "w-12 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 shadow-lg"
                        : "w-3 h-3 bg-white/35 hover:bg-white/60"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mini Feature Grid below the slider */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-14 max-w-6xl mx-auto"
        >
          {SLIDES.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`group flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                index === current
                  ? "border-emerald-500 bg-emerald-500/15 dark:bg-emerald-950/50 shadow-lg shadow-emerald-500/15 scale-[1.02]"
                  : "border-border/60 hover:border-emerald-500/40 hover:bg-muted/50"
              }`}
            >
              <item.icon
                className={`w-6 h-6 transition-colors ${
                  index === current
                    ? item.iconColor
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span
                className={`text-xs font-medium text-center leading-snug transition-colors ${
                  index === current
                    ? "text-foreground font-bold"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {item.title}
              </span>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


