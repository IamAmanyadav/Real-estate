"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Users, Trash2, Shield, Ban, CheckCircle, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminUsers, updateUserStatus, deleteAdminUser } from "@/lib/admin-api";
import type { AdminUser, PaginatedResponse } from "@/types/admin";
import { useDebounce } from "@/hooks/useDebounce";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  suspended: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  pending_verification: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  rejected: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

const roleColors: Record<string, string> = {
  admin: "from-violet-500 to-purple-600",
  seller: "from-emerald-500 to-teal-600",
  buyer: "from-sky-500 to-blue-600",
};

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      setData(await getAdminUsers(params));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatus = async (id: string, status: string) => {
    try { await updateUserStatus(id, status); fetchUsers(); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try { await deleteAdminUser(id); fetchUsers(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">Manage buyers, sellers, and admin accounts</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10 rounded-xl" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending_verification">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-card border animate-pulse" />)}</div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColors[u.role] || roleColors.buyer} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg`}>
                      {u.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold truncate">{u.fullName}</h3>
                        <Badge variant="secondary" className="text-xs capitalize">{u.role}</Badge>
                        <Badge variant="outline" className={statusColors[u.status] || ""}>{u.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{u.email} {u.propertyCount > 0 && `• ${u.propertyCount} properties`}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {u.status === "pending_verification" && (
                        <Button size="sm" variant="outline" className="rounded-full text-emerald-600 text-xs" onClick={() => handleStatus(u.id, "active")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Verify
                        </Button>
                      )}
                      {u.status === "active" && u.role !== "admin" && (
                        <Button size="sm" variant="outline" className="rounded-full text-amber-600 text-xs" onClick={() => handleStatus(u.id, "suspended")}>
                          <Ban className="w-3 h-3 mr-1" /> Suspend
                        </Button>
                      )}
                      {u.status === "suspended" && (
                        <Button size="sm" variant="outline" className="rounded-full text-emerald-600 text-xs" onClick={() => handleStatus(u.id, "active")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Activate
                        </Button>
                      )}
                      {u.role !== "admin" && (
                        <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No users found</p>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full">Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="rounded-full">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
