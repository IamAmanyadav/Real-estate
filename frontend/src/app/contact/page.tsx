import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Luxe Estates. Our expert team is ready to help you find your dream property or answer any questions.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
