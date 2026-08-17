"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2,
  Heart,
  MessageSquare,
  TrendingUp,
  Eye,
  ArrowRight,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSellerDashboardStats } from "@/lib/seller-api";
import { getBuyerDashboardStats } from "@/lib/buyer-api";
import type { SellerDashboardStats, BuyerDashboardStats } from "@/types";

export default function UserDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const isSeller = user?.role === "seller";
  const isBuyer = user?.role === "buyer";

  const [sellerStats, setSellerStats] = useState<SellerDashboardStats | null>(null);
  const [buyerStats, setBuyerStats] = useState<BuyerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        if (isSeller) {
          const data = await getSellerDashboardStats();
          setSellerStats(data);
        } else if (isBuyer) {
          const data = await getBuyerDashboardStats();
          setBuyerStats(data);
        }
      } catch {
        // Stats will remain null, showing defaults
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStats();
  }, [user, isSeller, isBuyer]);

  useEffect(() => {
    if (isAdmin) {
      router.push("/admin");
    }
  }, [isAdmin, router]);

  const stats = isSeller
    ? [
        {
          title: "My Listings",
          value: sellerStats ? sellerStats.totalListings.toString() : "—",
          icon: Building2,
          color: "from-emerald-500 to-teal-500",
          change: sellerStats ? `${sellerStats.pendingListings} pending` : "",
        },
        {
          title: "Approved & Published",
          value: sellerStats ? (sellerStats.approvedListings + sellerStats.publishedListings).toString() : "—",
          icon: CheckCircle2,
          color: "from-blue-500 to-indigo-500",
          change: "Live on the platform",
        },
        {
          title: "Inquiries Received",
          value: sellerStats ? sellerStats.totalInquiriesReceived.toString() : "—",
          icon: MessageSquare,
          color: "from-amber-500 to-orange-500",
          change: "From interested buyers",
        },
        {
          title: "Rejected",
          value: sellerStats ? sellerStats.rejectedListings.toString() : "—",
          icon: XCircle,
          color: "from-red-500 to-rose-500",
          change: "Needs revision",
        },
      ]
    : [
        {
          title: "Total Inquiries",
          value: buyerStats ? buyerStats.totalInquiries.toString() : "—",
          icon: MessageSquare,
          color: "from-blue-500 to-indigo-500",
          change: "All inquiries sent",
        },
        {
          title: "Purchase Requests",
          value: buyerStats ? buyerStats.purchaseRequests.toString() : "—",
          icon: ShoppingCart,
          color: "from-purple-500 to-pink-500",
          change: "Serious offers",
        },
        {
          title: "Pending Responses",
          value: buyerStats ? buyerStats.pendingResponses.toString() : "—",
          icon: Clock,
          color: "from-amber-500 to-orange-500",
          change: "Awaiting admin review",
        },
        {
          title: "Responded",
          value: buyerStats ? buyerStats.respondedInquiries.toString() : "—",
          icon: CheckCircle2,
          color: "from-emerald-500 to-teal-500",
          change: "Received responses",
        },
      ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {user?.full_name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-emerald-100/80 max-w-lg">
            {isSeller
              ? "Manage your property listings, track inquiries, and grow your real estate business."
              : "Explore properties, track your inquiries, and find your dream home."}
          </p>
          <Button
            className="mt-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/20 rounded-full"
            asChild
          >
            <Link href={isSeller ? "/dashboard/listings" : "/properties"}>
              {isSeller ? "Manage Listings" : "Browse Properties"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid - Compact 2x2 Square Cards on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full min-h-[105px] sm:min-h-0">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">
                      {loading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shrink-0`}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 line-clamp-1">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role-specific quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/properties" className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Browse Properties</p>
                  <p className="text-xs text-muted-foreground">Explore new listings</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>

              {isBuyer && (
                <Link href="/dashboard/inquiries" className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">My Inquiries</p>
                    <p className="text-xs text-muted-foreground">Track your property inquiries</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              )}

              {isSeller && (
                <>
                  <Link href="/dashboard/listings" className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">My Listings</p>
                      <p className="text-xs text-muted-foreground">View and manage properties</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>

                  <Link href="/dashboard/listings/new" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Add New Listing</p>
                      <p className="text-xs text-muted-foreground">List a new property</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:text-emerald-700 transition-colors" />
                  </Link>
                </>
              )}

              <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Update Profile</p>
                  <p className="text-xs text-muted-foreground">Edit your information</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Getting Started Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                {isSeller ? "Seller Tips" : "Getting Started"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(isSeller
                ? [
                    { icon: Building2, title: "Add detailed descriptions", desc: "Properties with complete details get approved faster" },
                    { icon: Eye, title: "Upload quality images", desc: "Listings with 5+ images get 3x more inquiries" },
                    { icon: Star, title: "Include all documents", desc: "Upload ownership docs to speed up verification" },
                  ]
                : [
                    { icon: Building2, title: "Browse approved listings", desc: "All listed properties are admin-verified" },
                    { icon: MessageSquare, title: "Submit inquiries", desc: "Ask questions or make purchase requests" },
                    { icon: Clock, title: "Track your requests", desc: "Monitor the status of all your inquiries" },
                  ]
              ).map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <tip.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tip.title}</p>
                    <p className="text-xs text-muted-foreground">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
