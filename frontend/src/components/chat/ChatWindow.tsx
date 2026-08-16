"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  MessageCircle,
  CheckCheck,
  Check,
  Radio,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMessages,
  sendMessage as restSendMessage,
  markAsRead,
  type MessageItem,
} from "@/lib/messages-api";
import { useAuth } from "@/hooks/useAuth";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { refreshGlobalUnreadCount } from "@/hooks/useUnreadCount";

interface ChatWindowProps {
  conversationId: string;
  /** Name shown in the header (the other party) */
  recipientName: string;
  /** Called when a new message is sent (to update parent state) */
  onMessageSent?: () => void;
}

export default function ChatWindow({
  conversationId,
  recipientName,
  onMessageSent,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  }, []);

  // Helper to reliably check whether a message was sent by the current user
  const isOwnMessage = useCallback(
    (msg: MessageItem): boolean => {
      if (!currentUser) return false;

      // 1. Direct Clerk ID match
      if (msg.senderClerkId && msg.senderClerkId === currentUser.id) {
        return true;
      }
      // 2. Direct user ID match
      if (msg.senderId && msg.senderId === currentUser.id) {
        return true;
      }
      // 3. Fallback role match for 2-party chat (Admin <-> User)
      if (currentUser.role === "admin") {
        return msg.senderRole === "admin";
      } else {
        return msg.senderRole !== "admin";
      }
    },
    [currentUser]
  );

  // Handle incoming message from WebSocket
  const handleNewWsMessage = useCallback(
    (incoming: MessageItem) => {
      setMessages((prev) => {
        // If already exists by server id, update it
        const exists = prev.some((m) => m.id === incoming.id);
        if (exists) {
          return prev.map((m) => (m.id === incoming.id ? incoming : m));
        }

        // Reconcile and replace optimistic temporary message
        const matchOptimisticIndex = prev.findIndex(
          (m) =>
            m.id.startsWith("temp-") &&
            m.content.trim() === incoming.content.trim()
        );

        if (matchOptimisticIndex !== -1) {
          const updated = [...prev];
          updated[matchOptimisticIndex] = incoming;
          return updated;
        }

        return [...prev, incoming];
      });

      scrollToBottom();
      onMessageSent?.();

      // If message is from the other person, send mark_read
      if (!isOwnMessage(incoming)) {
        sendMarkRead();
        refreshGlobalUnreadCount();
      }
    },
    [isOwnMessage, onMessageSent, scrollToBottom]
  );

  // Handle read receipt from WebSocket
  const handleMessagesRead = useCallback(
    (readerId: string) => {
      if (readerId !== currentUser?.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            isOwnMessage(msg) ? { ...msg, isRead: true } : msg
          )
        );
      }
    },
    [currentUser?.id, isOwnMessage]
  );

  const {
    status: wsStatus,
    isConnected,
    isOtherTyping,
    typingUserName,
    sendMessage: wsSendMessage,
    sendTyping,
    sendMarkRead,
  } = useChatWebSocket({
    conversationId,
    onNewMessage: handleNewWsMessage,
    onMessagesRead: handleMessagesRead,
  });

  // Initial message fetch — ONLY runs when conversationId changes
  useEffect(() => {
    let isCancelled = false;
    if (!conversationId) return;

    setLoading(true);
    getMessages(conversationId)
      .then((data) => {
        if (!isCancelled) {
          setMessages(data || []);
          markAsRead(conversationId).catch(() => {});
          sendMarkRead();
          refreshGlobalUnreadCount();
          scrollToBottom("instant");
        }
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [conversationId, sendMarkRead, scrollToBottom]);

  // Typing debounce emitter
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    // Emit typing active
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTyping(false);
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: MessageItem = {
      id: tempId,
      conversationId,
      senderId: currentUser?.id || "",
      senderClerkId: currentUser?.id || "",
      senderName: currentUser?.full_name || "You",
      senderRole: currentUser?.role || "",
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const sentViaWs = isConnected && wsSendMessage(content);
      if (!sentViaWs) {
        const sent = await restSendMessage(conversationId, content);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? sent : m))
        );
      }
      onMessageSent?.();
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatDateSeparator = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    const curr = new Date(messages[index].createdAt).toDateString();
    return prev !== curr;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm text-muted-foreground mt-3">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/50 bg-card/60 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-emerald-500/20">
              {recipientName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {isConnected && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{recipientName}</p>
            <p className="text-xs text-muted-foreground">
              {messages.length > 0
                ? `${messages.length} message${messages.length !== 1 ? "s" : ""}`
                : "Start a conversation"}
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-xs font-medium border border-border/40">
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                Live
              </span>
            </>
          ) : wsStatus === "connecting" ? (
            <>
              <Radio className="w-3 h-3 text-amber-500 animate-pulse" />
              <span className="text-amber-600 dark:text-amber-400 text-[11px]">
                Connecting...
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground text-[11px]">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Send a message to start the conversation with {recipientName}.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isOwn = isOwnMessage(msg);
              return (
                <div key={msg.id}>
                  {/* Date Separator */}
                  {shouldShowDateSeparator(idx) && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[11px] text-muted-foreground font-medium px-2">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isOwn
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md"
                          : "bg-muted/80 text-foreground rounded-bl-md border border-border/30"
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-[11px] font-semibold mb-0.5 text-emerald-600 dark:text-emerald-400">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span
                          className={`text-[10px] ${
                            isOwn ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                        {isOwn &&
                          (msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-white/80" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-white/60" />
                          ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Live Typing Indicator Banner */}
        <AnimatePresence>
          {isOtherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 text-muted-foreground text-xs w-fit mb-2"
            >
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
              <span className="font-medium">
                {typingUserName || recipientName} is typing...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/50 bg-card/60 backdrop-blur-sm shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 placeholder:text-muted-foreground/60 transition-all max-h-32"
              style={{ minHeight: "42px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "42px";
                target.style.height = Math.min(target.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="rounded-xl h-[42px] w-[42px] bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
