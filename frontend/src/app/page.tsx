import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import StatsSection from "@/components/home/StatsSection";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";

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
