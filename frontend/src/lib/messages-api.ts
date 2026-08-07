// ============================================
// Messages API Client — uses unified auth tokens
// ============================================

import axios from "axios";
import { API_BASE_URL } from "./constants";

const messagesApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token
messagesApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("luxe_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-logout on 401
messagesApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("luxe_token");
      localStorage.removeItem("luxe_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ConversationDetail {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  lastMessageAt: string;
  createdAt: string;
}

// ── Conversations ────────────────────────────────────────────────────────────

export async function getConversations(): Promise<ConversationItem[]> {
  const { data } = await messagesApi.get<ConversationItem[]>(
    "/messages/conversations"
  );
  return data;
}

export async function getOrCreateConversation(
  userId?: string
): Promise<ConversationDetail> {
  const body = userId ? { userId } : {};
  const { data } = await messagesApi.post<ConversationDetail>(
    "/messages/conversations",
    body
  );
  return data;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<MessageItem[]> {
  const { data } = await messagesApi.get<MessageItem[]>(
    `/messages/conversations/${conversationId}/messages`,
    { params: { page, limit } }
  );
  return data;
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<MessageItem> {
  const { data } = await messagesApi.post<MessageItem>(
    `/messages/conversations/${conversationId}/messages`,
    { content }
  );
  return data;
}

// ── Read Receipts ────────────────────────────────────────────────────────────

export async function markAsRead(
  conversationId: string
): Promise<{ markedRead: number }> {
  const { data } = await messagesApi.patch<{ markedRead: number }>(
    `/messages/conversations/${conversationId}/read`
  );
  return data;
}

// ── Unread Count ─────────────────────────────────────────────────────────────

export async function getUnreadCount(): Promise<number> {
  const { data } = await messagesApi.get<{ unreadCount: number }>(
    "/messages/unread-count"
  );
  return data.unreadCount;
}

export default messagesApi;
