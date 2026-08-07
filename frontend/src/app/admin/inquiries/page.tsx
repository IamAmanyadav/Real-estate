"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, Trash2, Mail, Phone, Filter,
  CheckCircle, Eye, Reply, XCircle, Send, X, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getAdminInquiries, updateInquiryStatus, deleteAdminInquiry,
} from "@/lib/admin-api";
import type { AdminInquiry, PaginatedResponse } from "@/types/admin";
import { useDebounce } from "@/hooks/useDebounce";

const sColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  read: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  responded: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  closed: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

export default function AdminInquiriesPage() {
  const [data, setData] = useState<PaginatedResponse<AdminInquiry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const dSearch = useDebounce(search, 300);

  // Response dialog state
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, string | number> = { page, limit: 10 };
      if (dSearch) p.search = dSearch;
      if (statusFilter !== "all") p.inquiryStatus = statusFilter;
      setData(await getAdminInquiries(p));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [dSearch, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string, adminNotes?: string) => {
    try { await updateInquiryStatus(id, status, adminNotes); load(); }
    catch (e) { console.error(e); }
  };

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) return;
    setResponding(true);
    try {
      await updateInquiryStatus(id, "responded", responseText.trim());
      setRespondingTo(null);
      setResponseText("");
      load();
    } catch (e) { console.error(e); }
    finally { setResponding(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    try { await deleteAdminInquiry(id); load(); }
    catch (e) { console.error(e); }
  };

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return iso; }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Inquiry Management</h1>
        <p className="text-muted-foreground text-sm">
          View and respond to property inquiries
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search inquiries..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <Filter className="w-3 h-3 mr-2" /><SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card border animate-pulse" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((inq, i) => (
            <motion.div key={inq.id} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg">
                      {inq.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{inq.name}</h3>
                        <Badge variant="outline" className={sColors[inq.inquiryStatus] || ""}>
                          {inq.inquiryStatus}
                        </Badge>
                        {inq.propertyTitle && (
                          <span className="text-xs text-muted-foreground">
                            re: {inq.propertyTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {inq.email}
                        </span>
                        {inq.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {inq.phone}
                          </span>
                        )}
                        <span>{fmtDate(inq.createdAt)}</span>
                      </div>
                      {/* Expandable message */}
                      <p className={`text-sm text-foreground/80 ${expanded === inq.id ? "" : "line-clamp-2"}`}>
                        {inq.message}
                      </p>
                      {inq.message.length > 120 && (
                        <button onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}
                          className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 hover:underline">
                          {expanded === inq.id ? "Show less" : "Read more"}
                        </button>
                      )}

                      {/* Show existing admin notes if any */}
                      {inq.adminNotes && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Admin Response:</p>
                          <p className="text-xs text-foreground/70">{inq.adminNotes}</p>
                        </div>
                      )}

                      {/* Inline Response Form */}
                      <AnimatePresence>
                        {respondingTo === inq.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Write your response:</p>
                              <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Type your response to this inquiry..."
                                rows={3}
                                className="rounded-lg text-sm resize-none"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-full text-xs"
                                  onClick={() => { setRespondingTo(null); setResponseText(""); }}
                                  disabled={responding}
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="rounded-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleRespond(inq.id)}
                                  disabled={responding || !responseText.trim()}
                                >
                                  {responding ? (
                                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending...</>
                                  ) : (
                                    <><Send className="w-3 h-3 mr-1" /> Send Response</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {inq.inquiryStatus === "new" && (
                        <Button size="sm" variant="outline"
                          className="rounded-full text-blue-600 text-xs"
                          onClick={() => updateStatus(inq.id, "read")}>
                          <Eye className="w-3 h-3 mr-1" /> Mark Read
                        </Button>
                      )}
                      {(inq.inquiryStatus === "new" || inq.inquiryStatus === "read") && (
                        <Button size="sm" variant="outline"
                          className="rounded-full text-emerald-600 text-xs"
                          onClick={() => {
                            setRespondingTo(respondingTo === inq.id ? null : inq.id);
                            setResponseText("");
                          }}>
                          <Reply className="w-3 h-3 mr-1" /> Respond
                        </Button>
                      )}
                      {inq.inquiryStatus !== "closed" && (
                        <Button size="sm" variant="outline"
                          className="rounded-full text-gray-600 text-xs"
                          onClick={() => updateStatus(inq.id, "closed")}>
                          <XCircle className="w-3 h-3 mr-1" /> Close
                        </Button>
                      )}
                      <Button size="sm" variant="ghost"
                        className="rounded-full text-destructive"
                        onClick={() => remove(inq.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No inquiries found</p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => setPage(page - 1)} className="rounded-full">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)} className="rounded-full">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
