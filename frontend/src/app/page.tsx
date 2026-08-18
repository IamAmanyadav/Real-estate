import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import dynamic from 'next/dynamic';

const WhyChooseUs = dynamic(() => import("@/components/home/WhyChooseUs"), { ssr: true });
const StatsSection = dynamic(() => import("@/components/home/StatsSection"), { ssr: true });
const Testimonials = dynamic(() => import("@/components/home/Testimonials"), { ssr: true });
const CTASection = dynamic(() => import("@/components/home/CTASection"), { ssr: true });

export const metadata: Metadata = {
  title: "Luxe Estates — Find Your Dream Property",
  description:
    "Discover premium homes, apartments, condos, and villas. Luxe Estates connects you with the finest properties and expert agents for a seamless real estate experience.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyChooseUs />
      <StatsSection />
      <Testimonials />
      <CTASection />
    </>
  );
}
