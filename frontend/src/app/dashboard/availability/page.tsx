"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarPlus,
  Clock,
  Trash2,
  Loader2,
  Building2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSellerAvailability,
  createTimeSlot,
  deleteTimeSlot,
  getSellerAppointments,
} from "@/lib/appointment-api";
import { getSellerProperties } from "@/lib/seller-api";
import { formatDate } from "@/lib/utils";
import type { TimeSlot, Appointment, SellerProperty } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  completed: { label: "Completed", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  rescheduled: { label: "Rescheduled", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

export default function SellerAvailabilityPage() {
  // ── State ──────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [properties, setProperties] = useState<SellerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"availability" | "appointments">("availability");

  // Create slot form
  const [showForm, setShowForm] = useState(false);
  const [formPropertyId, setFormPropertyId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("10:00");
  const [formEndTime, setFormEndTime] = useState("11:00");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────

  const fetchProperties = useCallback(async () => {
    try {
      const res = await getSellerProperties({ limit: 100 });
      setProperties(res.items);
      if (res.items.length > 0 && !formPropertyId) {
        setFormPropertyId(res.items[0].id);
      }
    } catch {}
  }, []);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerAvailability({ page, limit: 15 });
      setSlots(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSellerAppointments({ page, limit: 15 });
      setAppointments(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (tab === "availability") fetchSlots();
    else fetchAppointments();
  }, [tab, fetchSlots, fetchAppointments]);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!formPropertyId || !formDate || !formStartTime || !formEndTime) {
      setFormError("All fields are required.");
      return;
    }
    setCreating(true);
    try {
      await createTimeSlot({
        propertyId: formPropertyId,
        slotDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
      });
      setFormSuccess("Time slot created successfully!");
      setFormDate("");
      fetchSlots();
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create slot.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Delete this time slot?")) return;
    try {
      await deleteTimeSlot(slotId);
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete slot.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-emerald-500" />
          Availability & Appointments
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your property visit time slots and view booked appointments
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["availability", "appointments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-muted hover:bg-accent text-muted-foreground"
            }`}
          >
            {t === "availability" ? "My Time Slots" : "Visit Requests"}
          </button>
        ))}
      </div>

      {/* ── Availability Tab ─────────────────────────────────────────── */}
      {tab === "availability" && (
        <div className="space-y-6">
          {/* Create Slot Form */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setShowForm(!showForm)}
              >
                <div className="flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold">Create New Time Slot</span>
                </div>
                <motion.div animate={{ rotate: showForm ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                </motion.div>
              </div>

              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="pt-0 pb-5 px-5">
                      <form onSubmit={handleCreateSlot} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Property */}
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Property</label>
                            <select
                              value={formPropertyId}
                              onChange={(e) => setFormPropertyId(e.target.value)}
                              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                            >
                              <option value="">Select property…</option>
                              {properties.map((p) => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                              ))}
                            </select>
                          </div>
                          {/* Date */}
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Date</label>
                            <input
                              type="date"
                              value={formDate}
                              onChange={(e) => setFormDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                            />
                          </div>
                          {/* Start Time */}
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Start Time</label>
                            <input
                              type="time"
                              value={formStartTime}
                              onChange={(e) => setFormStartTime(e.target.value)}
                              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                            />
                          </div>
                          {/* End Time */}
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">End Time</label>
                            <input
                              type="time"
                              value={formEndTime}
                              onChange={(e) => setFormEndTime(e.target.value)}
                              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
                            />
                          </div>
                        </div>

                        {formError && (
                          <div className="flex items-center gap-2 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {formError}
                          </div>
                        )}
                        {formSuccess && (
                          <div className="flex items-center gap-2 text-emerald-500 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            {formSuccess}
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={creating}
                          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        >
                          {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Create Slot
                        </Button>
                      </form>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* Slots List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : slots.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <CalendarDays className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time slots created</h3>
              <p className="text-muted-foreground text-sm">
                Create available time slots so buyers can schedule property visits.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, i) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="border-border/50 hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Date badge */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs text-emerald-600 font-medium">
                          {new Date(slot.slotDate + "T00:00:00").toLocaleDateString("en", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-emerald-600">
                          {new Date(slot.slotDate + "T00:00:00").getDate()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{slot.propertyTitle}</h4>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{slot.startTime} – {slot.endTime}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            slot.isBooked
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          }`}>
                            {slot.isBooked ? "Booked" : "Available"}
                          </span>
                        </div>
                      </div>

                      {!slot.isBooked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Appointments Tab ─────────────────────────────────────────── */}
      {tab === "appointments" && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : appointments.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <CalendarDays className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No visit requests yet</h3>
              <p className="text-muted-foreground text-sm">
                When buyers book visits for your properties, they will appear here.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt, i) => {
                const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                return (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="border-border/50 hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs text-emerald-600 font-medium">
                              {new Date(appt.slotDate + "T00:00:00").toLocaleDateString("en", { month: "short" })}
                            </span>
                            <span className="text-lg font-bold text-emerald-600">
                              {new Date(appt.slotDate + "T00:00:00").getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-semibold">{appt.propertyTitle}</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Buyer: <span className="text-foreground">{appt.buyerName}</span> • {appt.buyerEmail}
                                </p>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {appt.startTime} – {appt.endTime}
                              </span>
                              <span>Requested {formatDate(appt.createdAt)}</span>
                            </div>
                            {appt.adminNotes && (
                              <div className="mt-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm">
                                <span className="text-emerald-600 font-medium text-xs">Admin: </span>
                                {appt.adminNotes}
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
