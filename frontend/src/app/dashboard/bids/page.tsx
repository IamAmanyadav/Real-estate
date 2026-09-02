"use client";

import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import Link from "next/link";
import {
  Gavel,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  MapPin,
  Flame,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMyBids } from "@/lib/bidding-api";
import { formatPrice } from "@/lib/utils";
import type { MyBidItem } from "@/types";

export default function BuyerMyBidsPage() {
  const [bids, setBids] = useState<MyBidItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const data = await getMyBids();
      setBids(data);
    } catch (err) {
      console.error("Failed to load user bids", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500 text-slate-950 font-bold">
              BUYER DASHBOARD
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <Gavel className="w-7 h-7 text-amber-500" />
            My Active & Past Bids
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your bids, outbid warnings, and live auction standings in real time.
          </p>
        </div>
        <Button onClick={fetchBids} variant="outline" size="sm" className="rounded-xl">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : bids.length === 0 ? (
        <Card className="border-border/60 p-12 text-center">
          <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold text-foreground">No bids placed yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Browse our verified luxury properties with active dynamic bidding to place your first offer!
          </p>
          <Button asChild className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
            <Link href="/properties">Browse Live Auctions</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {bids.map((b) => (
            <Card
              key={b.id}
              className={`border-2 transition-all rounded-2xl overflow-hidden ${
                b.is_winning
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : b.is_outbid
                  ? "border-amber-500/30 bg-card/80"
                  : "border-border/60 bg-card/80"
              }`}
            >
              <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                  {/* Property Image Thumbnail */}
                  <div className="w-full sm:w-24 h-20 rounded-xl overflow-hidden bg-muted/60 relative shrink-0 border border-border/60">
                    {b.property_image ? (
                      <img
                        src={
                          b.property_image.startsWith("/uploads")
                            ? `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}${b.property_image}`
                            : b.property_image
                        }
                        alt={b.property_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground/40">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {b.property_code && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {b.property_code}
                        </Badge>
                      )}
                      {b.is_winning ? (
                        <Badge className="bg-emerald-500 text-slate-950 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> HIGHEST BIDDER
                        </Badge>
                      ) : b.is_outbid ? (
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/40 flex items-center gap-1 font-semibold">
                          <Flame className="w-3 h-3" /> OUTBID
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-700 text-white font-semibold">
                          {b.bid_status.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <Link
                      href={`/properties/${b.property_id}`}
                      className="text-lg font-bold text-foreground hover:text-amber-500 transition-colors block truncate"
                    >
                      {b.property_title}
                    </Link>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{b.property_city}, {b.property_state}</span>
                      <span className="mx-1.5">•</span>
                      <span>Placed on {new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/50">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Your Bid Offer</span>
                    <div className="text-2xl font-extrabold font-mono text-foreground">
                      {formatPrice(b.amount)}
                    </div>
                    {b.current_highest_bid && b.current_highest_bid > b.amount && (
                      <div className="text-[11px] text-amber-500 font-mono">
                        Top Bid: {formatPrice(b.current_highest_bid)}
                      </div>
                    )}
                  </div>

                  <Button asChild size="sm" className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1">
                    <Link href={`/properties/${b.property_id}`}>
                      Open Live Auction <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
