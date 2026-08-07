"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Loader2 } from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";
import { getOrCreateConversation } from "@/lib/messages-api";

export default function UserMessagesPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initConversation = useCallback(async () => {
    try {
      // Auto-creates conversation for the current user if none exists
      const conv = await getOrCreateConversation();
      setConversationId(conv.id);
      // For users, the conv response's userName is their own name
      // The admin name is fetched from the conversation list endpoint
      setAdminName("Luxe Estates Support");
    } catch (err) {
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initConversation();
  }, [initConversation]);

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-500" />
            Messages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chat with our support team
          </p>
        </motion.div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-emerald-500" />
            Messages
          </h1>
        </motion.div>
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              initConversation();
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-emerald-500" />
          Messages
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Chat with our support team
        </p>
      </motion.div>

      {/* Chat */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm"
        style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}
      >
        {conversationId && (
          <ChatWindow
            conversationId={conversationId}
            recipientName={adminName}
          />
        )}
      </motion.div>
    </div>
  );
}
