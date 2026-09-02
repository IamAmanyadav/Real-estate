import { Sparkles } from "lucide-react";
import Image from "next/image";
import HeroAuthPrompt from "./HeroAuthPrompt";

const PRESS_LOGOS = [
  { name: "Architectural Digest", label: "ARCHITECTURAL DIGEST" },
  { name: "Vogue Living", label: "VOGUE LIVING" },
  { name: "Forbes", label: "FORBES" },
  { name: "Dwell", label: "DWELL" },
  { name: "The Wall Street Journal", label: "WSJ REAL ESTATE" },
  { name: "Robb Report", label: "ROBB REPORT" },
];

export default function HeroSection() {
  return (
    <>
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
        {/* Full-Screen Luxury Architectural Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Background Image: Optimized for LCP */}
          <Image
            src="/images/hero-bg.jpg"
            alt="Luxury modern symmetrical villa"
            fill
            priority
            fetchPriority="high"
            className="object-cover object-[center_45%] animate-zoom-in"
            sizes="100vw"
            quality={85}
          />

          {/* Cinematic Vignette & Gradient Overlays for perfect text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-black/75" />
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Subtle warm glow orbs for luxury depth */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
        </div>

        {/* Top Spacer for balance */}
        <div className="relative z-10" />

        {/* Main Centered Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center my-auto py-8">
          {/* Subtitle / Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm font-medium tracking-[0.2em] uppercase mb-6 shadow-sm animate-fade-in-up [animation-delay:100ms] [animation-fill-mode:backwards]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            #India's Premium Real Estate Platform
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 uppercase animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
            <span className="block font-light tracking-widest text-white/90 text-3xl sm:text-5xl md:text-6xl mb-1">
              Find Your
            </span>
            <span className="block font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent drop-shadow-2xl">
              Dream Property
            </span>
          </h1>

          {/* Subtitle description */}
          <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
            Explore thousands of premium properties curated just for you. From luxury villas to modern apartments, your perfect home awaits.
          </p>

          {/* Extracted Interactive Auth/Search Prompt */}
          <HeroAuthPrompt />
        </div>

        {/* Stats Row Overlay at bottom */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-full border border-white/15 p-4 sm:px-8 sm:py-4 shadow-2xl animate-fade-in-up [animation-delay:500ms] [animation-fill-mode:backwards]">
            {[
              { value: "10+", label: "Properties" },
              { value: "5+", label: "Happy Clients" },
              { value: "1+", label: "Years" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat, idx) => (
              <div key={stat.label} className={`text-center ${idx !== 0 ? "sm:border-l sm:border-white/15" : ""}`}>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-[11px] sm:text-xs text-white/70 tracking-wider uppercase mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AS SEEN IN / Editorial Media Ribbon (Matching the Reference Mockup) */}
      <section className="bg-card/70 dark:bg-card/30 border-y border-border py-8 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs tracking-[0.3em] font-semibold text-muted-foreground uppercase mb-6">
            AS SEEN IN
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 md:gap-16 opacity-75">
            {PRESS_LOGOS.map((press) => (
              <span
                key={press.name}
                className="text-xs sm:text-sm md:text-base font-serif tracking-widest text-muted-foreground hover:text-foreground transition-colors uppercase font-medium"
              >
                {press.label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
