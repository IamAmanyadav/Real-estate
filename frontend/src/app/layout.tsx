import { ClerkProvider } from "@clerk/nextjs";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Luxe Estates — Premium Real Estate",
    template: "%s | Luxe Estates",
  },
  description:
    "Discover your dream property with Luxe Estates. Browse premium homes, apartments, condos, and villas with expert guidance from our world-class team.",
  keywords: [
    "real estate",
    "luxury homes",
    "property",
    "buy home",
    "rent property",
    "apartments",
    "condos",
    "villas",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          >
          <ConditionalLayout>{children}</ConditionalLayout>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}