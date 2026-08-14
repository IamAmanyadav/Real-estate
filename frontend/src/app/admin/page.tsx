"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/lib/admin-api";
import type { DashboardData } from "@/types/admin";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 sm:h-28 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
          <div className="h-64 rounded-2xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Unable to load dashboard data</p>
        <p className="text-sm">Make sure the backend server is running.</p>
      </div>
    );
  }

  const { overview, propertyAnalytics, userAnalytics, recentActivity } = data;

  const statCards = [
    {
      title: "Total Properties",
      value: overview.totalProperties.toLocaleString(),
      icon: Building2,
      color: "from-emerald-500 to-teal-500",
      subtitle: `${overview.publishedProperties} published`,
    },
    {
      title: "Total Users",
      value: overview.totalUsers.toLocaleString(),
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      subtitle: `${overview.activeUsers} active`,
    },
    {
      title: "Inquiries",
      value: overview.totalInquiries.toLocaleString(),
      icon: MessageSquare,
      color: "from-amber-500 to-orange-500",
      subtitle: `${overview.newInquiries} new`,
    },
    {
      title: "Revenue",
      value: `$${(overview.totalRevenue / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "from-purple-500 to-pink-500",
      subtitle: "Total sold value",
    },
  ];

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">Real-time platform analytics and activity</p>
      </motion.div>

      {/* Stat Cards - Compact 2x2 Square Cards on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50 hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-3.5 sm:p-5 flex flex-col justify-between h-full min-h-[105px] sm:min-h-0">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md shrink-0`}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 line-clamp-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alert: Pending Verifications */}
      {overview.pendingVerifications > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {overview.pendingVerifications} properties pending verification
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
              Review and approve property listings to publish them on the platform.
            </p>
          </div>
          <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
            Action Required
          </Badge>
        </motion.div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                Properties by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(propertyAnalytics.byType).map(([type, count]) => {
                const total = Object.values(propertyAnalytics.byType).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm font-medium capitalize w-24">{type}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Users by Role */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Users by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(userAnalytics.byRole).map(([role, count]) => {
                  const colors: Record<string, string> = {
                    admin: "from-violet-500 to-purple-600",
                    seller: "from-emerald-500 to-teal-600",
                    buyer: "from-sky-500 to-blue-600",
                  };
                  return (
                    <div key={role} className="text-center p-4 rounded-xl bg-muted/50">
                      <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${colors[role] || colors.buyer} flex items-center justify-center text-white text-sm font-bold mb-2 shadow-lg`}>
                        {count}
                      </div>
                      <p className="text-sm font-medium capitalize">{role}s</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Verification Status + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Verification Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(propertyAnalytics.byVerification).map(([status, count]) => {
                const statusColors: Record<string, string> = {
                  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  under_review: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
                  published: "bg-green-500/10 text-green-700 dark:text-green-400",
                  sold: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
                  archived: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
                };
                return (
                  <div key={status} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColors[status] || "bg-muted"}>
                        {status.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.timestamp)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
