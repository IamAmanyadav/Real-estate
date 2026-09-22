"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Info } from "lucide-react";

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

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[350px] sm:h-[450px] rounded-2xl border border-border/80 overflow-hidden shadow-sm"
    />
  );
}
