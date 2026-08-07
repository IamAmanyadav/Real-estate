"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCog,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Timer,
  User,
  Building2,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminAppointments, updateAppointmentStatus } from "@/lib/appointment-api";
import { formatDate } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Timer },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  completed: { label: "Completed", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Trophy },
  rescheduled: { label: "Rescheduled", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: RotateCcw },
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const data = await getAdminAppointments(params as Parameters<typeof getAdminAppointments>[0]);
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

  const handleAction = async (appointmentId: string, status: string) => {
    setProcessing(true);
    try {
      await updateAppointmentStatus(appointmentId, {
        status,
        adminNotes: actionNotes || undefined,
      });
      setActionId(null);
      setActionNotes("");
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update appointment.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCog className="w-6 h-6 text-emerald-500" />
          Appointment Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and manage all property visit appointments ({total} total)
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
          { label: "Rescheduled", value: "rescheduled" },
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
            {statusFilter ? "Try changing your filter." : "No property visit appointments have been made yet."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt, i) => {
            const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const isExpanded = actionId === appt.id;
            return (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={`overflow-hidden border-border/50 transition-all duration-300 ${
                  isExpanded ? "ring-2 ring-emerald-500/20 shadow-lg" : "hover:shadow-md"
                }`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Date badge */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs text-emerald-600 font-medium">
                          {new Date(appt.slotDate + "T00:00:00").toLocaleDateString("en", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-emerald-600">
                          {new Date(appt.slotDate + "T00:00:00").getDate()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-500" />
                              {appt.propertyTitle}
                            </h3>
                            {appt.propertyAddress && (
                              <p className="text-xs text-muted-foreground mt-0.5 ml-6">{appt.propertyAddress}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Buyer / Seller info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-muted-foreground">Buyer:</span>
                            <span className="font-medium truncate">{appt.buyerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-muted-foreground">Seller:</span>
                            <span className="font-medium truncate">{appt.sellerName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            {appt.startTime} – {appt.endTime}
                          </span>
                          <span>Requested {formatDate(appt.createdAt)}</span>
                        </div>

                        {appt.adminNotes && (
                          <div className="mt-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm">
                            <span className="text-emerald-600 font-medium text-xs">Notes: </span>
                            {appt.adminNotes}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {appt.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                                disabled={processing}
                                onClick={() => handleAction(appt.id, "approved")}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 text-xs h-8"
                                disabled={processing}
                                onClick={() => {
                                  if (isExpanded) {
                                    setActionId(null);
                                    setActionNotes("");
                                  } else {
                                    setActionId(appt.id);
                                  }
                                }}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {appt.status === "approved" && (
                            <Button
                              size="sm"
                              className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                              disabled={processing}
                              onClick={() => handleAction(appt.id, "completed")}
                            >
                              <Trophy className="w-3.5 h-3.5 mr-1" />
                              Mark Completed
                            </Button>
                          )}
                        </div>

                        {/* Expanded cancel form */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 overflow-hidden"
                            >
                              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                                <label className="text-sm font-medium">Cancellation Note (optional)</label>
                                <textarea
                                  value={actionNotes}
                                  onChange={(e) => setActionNotes(e.target.value)}
                                  placeholder="Reason for cancellation…"
                                  className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 outline-none"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                                    disabled={processing}
                                    onClick={() => handleAction(appt.id, "cancelled")}
                                  >
                                    {processing && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                    Confirm Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-lg text-xs h-8"
                                    onClick={() => { setActionId(null); setActionNotes(""); }}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
