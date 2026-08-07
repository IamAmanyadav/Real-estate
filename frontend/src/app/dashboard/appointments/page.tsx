"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Timer,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBuyerAppointments } from "@/lib/appointment-api";
import { formatDate } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Pending Approval", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Timer },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: XCircle },
  completed: { label: "Completed", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: Trophy },
  rescheduled: { label: "Rescheduled", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: RotateCcw },
};

export default function BuyerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const data = await getBuyerAppointments(params as Parameters<typeof getBuyerAppointments>[0]);
      setAppointments(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-emerald-500" />
          My Appointments
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your scheduled property visits ({total} total)
        </p>
      </motion.div>

      {/* Status Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "" },
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f.value
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-muted hover:bg-accent text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Appointment List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : appointments.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <CalendarDays className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
          <p className="text-muted-foreground text-sm">
            {statusFilter
              ? "Try changing your filter."
              : "Browse properties and schedule a visit to get started."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt, i) => {
            const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Date badge */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {new Date(appt.slotDate + "T00:00:00").toLocaleDateString("en", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {new Date(appt.slotDate + "T00:00:00").getDate()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold leading-tight">{appt.propertyTitle}</h3>
                            {appt.propertyAddress && (
                              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {appt.propertyAddress}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            {appt.startTime} – {appt.endTime}
                          </span>
                          <span>
                            Seller: <span className="text-foreground font-medium">{appt.sellerName}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span>Requested {formatDate(appt.createdAt)}</span>
                        </div>

                        {/* Admin notes */}
                        {appt.adminNotes && (
                          <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Admin Note</p>
                            <p className="text-sm">{appt.adminNotes}</p>
                          </div>
                        )}

                        {/* Cancellation reason */}
                        {appt.status === "cancelled" && appt.cancellationReason && (
                          <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Cancellation Reason</p>
                            <p className="text-sm">{appt.cancellationReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
