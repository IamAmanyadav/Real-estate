"use client";

import { motion } from "framer-motion";
import { Search, MessageCircle, Users } from "lucide-react";
import { useState, useMemo } from "react";
import type { ConversationItem } from "@/lib/messages-api";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (conversation: ConversationItem) => void;
  loading?: boolean;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading = false,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.userName.toLowerCase().includes(q) ||
        c.userEmail.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string }> = {
      buyer: {
        label: "Buyer",
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
      seller: {
        label: "Seller",
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      },
      admin: {
        label: "Admin",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
    };
    const c = config[role] || config.buyer;
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.color}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground mt-3">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 placeholder:text-muted-foreground/60 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5" style={{ minHeight: 0 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              {search ? (
                <Search className="w-6 h-6 text-muted-foreground/50" />
              ) : (
                <Users className="w-6 h-6 text-muted-foreground/50" />
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No conversations match your search" : "No conversations yet"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {search
                ? "Try different keywords"
                : "Users will appear here when they start a chat"}
            </p>
          </div>
        ) : (
          filtered.map((conv, i) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelect(conv)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200",
                selectedId === conv.id
                  ? "bg-emerald-500/10 ring-1 ring-emerald-500/20"
                  : "hover:bg-accent/60"
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {conv.userName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {conv.userName}
                    </span>
                    {getRoleBadge(conv.userRole)}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">
                  {conv.lastMessage || "No messages yet"}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Footer count */}
      {conversations.length > 0 && (
        <div className="px-4 py-2 border-t border-border/50 shrink-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" />
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
