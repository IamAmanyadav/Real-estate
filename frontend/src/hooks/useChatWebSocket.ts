"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/constants";
import type { MessageItem } from "@/lib/messages-api";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseChatWebSocketOptions {
  conversationId: string | null;
  onNewMessage?: (msg: MessageItem) => void;
  onMessagesRead?: (readerId: string) => void;
}

export function useChatWebSocket({
  conversationId,
  onNewMessage,
  onMessagesRead,
}: UseChatWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Keep callback refs up to date to avoid stale closures in event listeners
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  const onMessagesReadRef = useRef(onMessagesRead);
  onMessagesReadRef.current = onMessagesRead;

  // Retrieve auth token from Clerk or localStorage
  const getAuthToken = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    try {
      const clerk = (window as any).Clerk;
      if (clerk && clerk.session) {
        const token = await clerk.session.getToken();
        if (token) return token;
      }
    } catch {
      // ignore
    }
    return localStorage.getItem("luxe_token");
  };

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!conversationId || isUnmountedRef.current) return;

    cleanup();
    setStatus("connecting");

    const token = await getAuthToken();
    if (!token) {
      setStatus("error");
      return;
    }

    try {
      // Build WebSocket URL from API_BASE_URL
      const baseUrl = API_BASE_URL.replace(/^http/, "ws");
      const wsUrl = `${baseUrl}/messages/ws/${conversationId}?token=${encodeURIComponent(token)}`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) {
          socket.close();
          return;
        }
        setStatus("connected");
        retryCountRef.current = 0;

        // Keep-alive heartbeat ping every 25 seconds
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const type = payload.type;

          if (type === "new_message" && payload.data) {
            onNewMessageRef.current?.(payload.data as MessageItem);
          } else if (type === "typing") {
            const { userName, isTyping } = payload;
            if (isTyping) {
              setTypingUserName(userName || "Someone");
              setIsOtherTyping(true);
              // Auto-reset typing state after 3 seconds of silence
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              typingTimerRef.current = setTimeout(() => {
                setIsOtherTyping(false);
              }, 3000);
            } else {
              setIsOtherTyping(false);
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            }
          } else if (type === "messages_read") {
            onMessagesReadRef.current?.(payload.readerId);
          }
        } catch {
          // ignore non-JSON messages (e.g. pong)
        }
      };

      socket.onerror = () => {
        setStatus("error");
      };

      socket.onclose = (event) => {
        if (isUnmountedRef.current) return;
        setStatus("disconnected");

        // Attempt reconnection with exponential backoff if not closed normally
        if (event.code !== 1000 && event.code !== 1008) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      setStatus("error");
    }
  }, [conversationId, cleanup]);

  useEffect(() => {
    isUnmountedRef.current = false;
    if (conversationId) {
      connect();
    }

    const handleOnline = () => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && wsRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isUnmountedRef.current = true;
      cleanup();
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversationId, connect, cleanup]);

  // Outgoing action: Send a chat message over WS
  const sendMessage = useCallback((content: string): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "chat_message",
          content,
        })
      );
      return true;
    }
    return false;
  }, []);

  // Outgoing action: Send typing indicator over WS
  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          isTyping,
        })
      );
    }
  }, []);

  // Outgoing action: Mark messages as read over WS
  const sendMarkRead = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "mark_read",
        })
      );
    }
  }, []);

  return {
    status,
    isConnected: status === "connected",
    isOtherTyping,
    typingUserName,
    sendMessage,
    sendTyping,
    sendMarkRead,
    reconnect: connect,
  };
}
