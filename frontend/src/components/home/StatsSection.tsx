"use client";

import { motion } from "framer-motion";
import { Building2, Award, ThumbsUp, Users2 } from "lucide-react";

const STATS_DATA = [
  { value: "5+", label: "Properties Sold", icon: Building2 },
  { value: "1", label: "Years Experience", icon: Award },
  { value: "98%", label: "Client Satisfaction", icon: ThumbsUp },
  { value: "10+", label: "Verified Listings", icon: Users2 },
];

export default function StatsSection() {
  return (
    <section className="relative h-[220px] sm:h-[260px] flex items-center justify-center overflow-hidden my-4 sm:my-8">
      {/* High-Clarity Panoramic Living Room Background Cropped from Top */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-[center_30%] bg-no-repeat"
          style={{
            backgroundImage: `url('/images/stats-bg.jpg')`,
          }}
        />
        {/* Subtle Overlay */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full relative z-10">
        {/* Compact, Sleek Glassmorphic Stats Floating Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-full border border-white/25 shadow-[0_15px_35px_rgba(0,0,0,0.5)] px-6 py-3.5 sm:px-10 sm:py-4.5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {STATS_DATA.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`flex flex-col items-center text-center ${
                    index !== 0 ? "sm:border-l sm:border-white/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-md font-serif">
                      {stat.value}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium tracking-wider text-white/90 uppercase drop-shadow">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


