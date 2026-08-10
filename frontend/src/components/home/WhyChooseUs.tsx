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
    accent: "from-emerald-500 to-teal-500",
    bgAccent: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    icon: Handshake,
    title: "Transparent Transactions",
    description:
      "No hidden fees, no surprise charges. We believe in complete transparency — from listing price to closing costs. Our platform connects you directly with sellers for honest, straightforward deals.",
    accent: "from-blue-500 to-cyan-500",
    bgAccent: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: TrendingUp,
    title: "Market-Driven Pricing",
    description:
      "Our properties are priced based on real market data and expert appraisals. Whether you're buying or selling, you can trust that every valuation reflects the true worth of the property.",
    accent: "from-violet-500 to-purple-500",
    bgAccent: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    icon: Clock,
    title: "Fast & Simple Process",
    description:
      "List a property in minutes. Inquire about your dream home instantly. Our streamlined workflow removes unnecessary steps so you can focus on what matters — finding the perfect property.",
    accent: "from-amber-500 to-orange-500",
    bgAccent: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    description:
      "Have questions or need assistance? Our dedicated team is always ready to help — whether it's about a listing, an inquiry, or navigating the platform. We're just a message away.",
    accent: "from-rose-500 to-pink-500",
    bgAccent: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    icon: Award,
    title: "Trusted by Thousands",
    description:
      "Join a growing community of satisfied buyers and sellers. With years of experience and thousands of successful transactions, Luxe Estates is the name you can trust in premium real estate.",
    accent: "from-teal-500 to-emerald-500",
    bgAccent: "bg-teal-500/10",
    iconColor: "text-teal-500",
  },
];

export default function WhyChooseUs() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-play every 5 seconds
  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  const slide = SLIDES[current];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Why Luxe Estates
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4">
            Why Choose Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We go beyond just listings — we deliver trust, transparency, and a
            seamless real estate experience you can count on.
          </p>
        </motion.div>

        {/* Slider */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 sm:-translate-x-14 z-20 rounded-full w-9 h-9 sm:w-12 sm:h-12 border-border/60 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 sm:translate-x-14 z-20 rounded-full w-9 h-9 sm:w-12 sm:h-12 border-border/60 bg-background/90 backdrop-blur-sm shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Slide Content */}
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card min-h-[340px] sm:min-h-[280px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="p-6 sm:p-12 flex flex-col items-center text-center px-10 sm:px-16"
              >
                {/* Icon */}
                <div
                  className={`w-20 h-20 rounded-2xl ${slide.bgAccent} flex items-center justify-center mb-6`}
                >
                  <slide.icon className={`w-10 h-10 ${slide.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  <span
                    className={`bg-gradient-to-r ${slide.accent} bg-clip-text text-transparent`}
                  >
                    {slide.title}
                  </span>
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > current ? 1 : -1);
                  setCurrent(index);
                }}
                className={`rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-8 h-3 bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "w-3 h-3 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Mini Feature Grid below the slider */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-14"
        >
          {SLIDES.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > current ? 1 : -1);
                setCurrent(index);
              }}
              className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                index === current
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md"
                  : "border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-muted/50"
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
                className={`text-xs font-medium text-center leading-tight transition-colors ${
                  index === current
                    ? "text-foreground"
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
