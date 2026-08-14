"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Loader2 } from "lucide-react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import {
  getConversations,
  type ConversationItem,
} from "@/lib/messages-api";

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelect = (conv: ConversationItem) => {
    setSelectedConv(conv);
  };

  const handleMessageSent = () => {
    // Refresh conversation list to update last message
    fetchConversations();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-emerald-500" />
          Messages
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage conversations with buyers and sellers
        </p>
      </motion.div>

      {/* Chat Layout */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm"
        style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}
      >
        <div className="flex h-full">
          {/* Conversation List */}
          <div className="w-80 border-r border-border/50 shrink-0 hidden md:block">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.id || null}
              onSelect={handleSelect}
              loading={loading}
            />
          </div>

          {/* Mobile Conversation List (shown when no conversation selected) */}
          <div className={`md:hidden w-full ${selectedConv ? "hidden" : "block"}`}>
            <ConversationList
              conversations={conversations}
              selectedId={null}
              onSelect={handleSelect}
              loading={loading}
            />
          </div>

          {/* Chat Window */}
          <div className={`flex-1 ${!selectedConv ? "hidden md:flex" : "flex"} flex-col`}>
            {selectedConv ? (
              <>
                {/* Mobile back button */}
                <div className="md:hidden px-3 py-2 border-b border-border/50">
                  <button
                    onClick={() => setSelectedConv(null)}
                    className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    ← Back to conversations
                  </button>
                </div>
                <div className="flex-1" style={{ minHeight: 0 }}>
                  <ChatWindow
                    key={selectedConv.id}
                    conversationId={selectedConv.id}
                    recipientName={selectedConv.userName}
                    onMessageSent={handleMessageSent}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-emerald-500/60" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Choose a conversation from the list to view and reply to messages
                  from buyers and sellers.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
