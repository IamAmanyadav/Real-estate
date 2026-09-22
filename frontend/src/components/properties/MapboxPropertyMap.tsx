"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Info, Navigation, Share2, Check } from "lucide-react";

interface MapboxPropertyMapProps {
  latitude: number;
  longitude: number;
}

export default function MapboxPropertyMap({ latitude, longitude }: MapboxPropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setTokenMissing(true);
      return;
    }
    mapboxgl.accessToken = token;

    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 15,
      interactive: true, // buyers can pan/zoom to see area
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    // Add marker for the property
    new mapboxgl.Marker({ color: "#10b981" })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude]);

  if (tokenMissing) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 text-sm flex items-center gap-2">
        <Info className="w-5 h-5 shrink-0" />
        <p>Mapbox token is missing. Please add <strong>NEXT_PUBLIC_MAPBOX_TOKEN</strong> to your environment variables.</p>
      </div>
    );
  }

  const [copied, setCopied] = useState(false);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  const handleShareLocation = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Property Location",
          text: "Check out this property location on the map!",
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-full h-[350px] sm:h-[450px] rounded-2xl border border-border/80 overflow-hidden shadow-sm group">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      />
      
      {/* Action Buttons Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2 sm:bottom-6 sm:left-6 sm:right-auto z-10">
        <button
          onClick={handleGetDirections}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
        >
          <Navigation className="w-4 h-4" />
          <span className="text-sm">Get Directions</span>
        </button>
        
        <button
          onClick={handleShareLocation}
          className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-foreground px-4 py-2.5 rounded-xl font-semibold shadow-lg border border-border transition-all active:scale-95"
          title="Share Location"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm sm:hidden md:inline">{copied ? "Copied!" : "Share"}</span>
        </button>
      </div>
    </div>
  );
}
