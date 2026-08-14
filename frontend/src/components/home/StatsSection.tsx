"use client";

import { motion } from "framer-motion";
import { Building, Users, Award, TrendingUp } from "lucide-react";
import { COMPANY_STATS } from "@/lib/constants";

const icons = [Building, Users, Award, TrendingUp];

export default function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {COMPANY_STATS.map((stat, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-emerald-100 text-sm font-medium">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
