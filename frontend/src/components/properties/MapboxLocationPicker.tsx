"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { MapPin, Info, Search } from "lucide-react";

interface MapboxLocationPickerProps {
  initialLatitude: number | null;
  initialLongitude: number | null;
  searchQuery?: string;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]; // Center of India

export default function MapboxLocationPicker({
  initialLatitude,
  initialLongitude,
  searchQuery,
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

    const updateMarkerAndState = (lng: number, lat: number) => {
      if (!marker.current) {
        marker.current = new mapboxgl.Marker({ draggable: true, color: "#10b981" })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        marker.current.on("dragend", () => {
          if (!marker.current) return;
          const lngLat = marker.current.getLngLat();
          setCurrentLat(lngLat.lat);
          setCurrentLng(lngLat.lng);
          onChange(lngLat.lat, lngLat.lng);
        });
      } else {
        marker.current.setLngLat([lng, lat]);
      }
      setCurrentLat(lat);
      setCurrentLng(lng);
      onChange(lat, lng);
    };

    // Add initial marker if coordinates are provided
    if (initialLatitude && initialLongitude) {
      updateMarkerAndState(initialLongitude, initialLatitude);
    }

    // Map click handling
    map.current.on("click", (e) => {
      const coords = e.lngLat;
      updateMarkerAndState(coords.lng, coords.lat);
    });

    // Add Geolocate Control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserHeading: true,
    });
    map.current.addControl(geolocate, "top-right");

    // Handle geolocate result
    geolocate.on("geolocate", (e: any) => {
      updateMarkerAndState(e.coords.longitude, e.coords.latitude);
    });

    // Add Geocoder Control
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      marker: false, // We manage our own marker
      placeholder: "Search for an address",
    });
    map.current.addControl(geocoder, "top-left");

    // Handle geocoder result
    geocoder.on("result", (e) => {
      const coords = e.result.center;
      updateMarkerAndState(coords[0], coords[1]);
    });

    // Expose geocoder to window for programmatic search from prop (dirty hack to bypass complex state refs)
    (window as any).__mapboxGeocoder = geocoder;

    return () => {
      if ((window as any).__mapboxGeocoder) delete (window as any).__mapboxGeocoder;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (searchQuery && (window as any).__mapboxGeocoder) {
      (window as any).__mapboxGeocoder.query(searchQuery);
    }
  }, [searchQuery]);

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
