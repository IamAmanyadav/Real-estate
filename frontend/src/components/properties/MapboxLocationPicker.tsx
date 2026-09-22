"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Info } from "lucide-react";

interface MapboxLocationPickerProps {
  initialLatitude: number | null;
  initialLongitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]; // Center of India

export default function MapboxLocationPicker({
  initialLatitude,
  initialLongitude,
  onChange,
}: MapboxLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(initialLatitude);
  const [currentLng, setCurrentLng] = useState<number | null>(initialLongitude);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setTokenMissing(true);
      return;
    }
    mapboxgl.accessToken = token;

    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    const startLng = initialLongitude ?? DEFAULT_CENTER[0];
    const startLat = initialLatitude ?? DEFAULT_CENTER[1];
    const startZoom = initialLatitude && initialLongitude ? 14 : 4;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [startLng, startLat],
      zoom: startZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add initial marker if coordinates are provided
    if (initialLatitude && initialLongitude) {
      marker.current = new mapboxgl.Marker({ draggable: true, color: "#10b981" })
        .setLngLat([initialLongitude, initialLatitude])
        .addTo(map.current);

      marker.current.on("dragend", () => {
        if (!marker.current) return;
        const lngLat = marker.current.getLngLat();
        setCurrentLat(lngLat.lat);
        setCurrentLng(lngLat.lng);
        onChange(lngLat.lat, lngLat.lng);
      });
    }

    // Map click handling
    map.current.on("click", (e) => {
      const coords = e.lngLat;
      
      if (!marker.current) {
        marker.current = new mapboxgl.Marker({ draggable: true, color: "#10b981" })
          .setLngLat(coords)
          .addTo(map.current!);

        marker.current.on("dragend", () => {
          if (!marker.current) return;
          const lngLat = marker.current.getLngLat();
          setCurrentLat(lngLat.lat);
          setCurrentLng(lngLat.lng);
          onChange(lngLat.lat, lngLat.lng);
        });
      } else {
        marker.current.setLngLat(coords);
      }

      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);
      onChange(coords.lat, coords.lng);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  if (tokenMissing) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 text-sm flex items-center gap-2">
        <Info className="w-5 h-5 shrink-0" />
        <p>Mapbox token is missing. Please add <strong>NEXT_PUBLIC_MAPBOX_TOKEN</strong> to your environment variables.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span>Click on the map or drag the pin to set the exact property location.</span>
        </div>
        {currentLat && currentLng && (
          <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          </div>
        )}
      </div>
      <div 
        ref={mapContainer} 
        className="w-full h-[400px] rounded-xl border border-border/80 overflow-hidden shadow-sm"
      />
    </div>
  );
}
