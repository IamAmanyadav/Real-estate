"use client";

import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
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
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 sm:p-12 lg:p-16"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to Find Your
              <br />
              Perfect Home?
            </h2>
            <p className="text-emerald-100 text-lg max-w-xl mb-8 leading-relaxed">
              Let our expert agents guide you through the process. Whether you&apos;re
              buying, selling, or renting — we&apos;re here to help every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-8 text-base shadow-xl"
                asChild
              >
                <Link href="/properties">
                  Browse Properties
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 text-base border-white/30 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/contact">
                  <Phone className="w-4 h-4 mr-2" />
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
