import type { Metadata } from "next";
import FAQPageClient from "./FAQPageClient";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about buying, selling, and renting properties with Luxe Estates.",
};

export default function FAQPage() {
  return <FAQPageClient />;
}
