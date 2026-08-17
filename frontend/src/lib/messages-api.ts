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

import { attachAuthToken } from "./utils";

// Attach JWT token to every request
messagesApi.interceptors.request.use(attachAuthToken);

// Removed legacy 401 auto-logout interceptor to allow multi-device Clerk sessions

// ── Types ────────────────────────────────────────────────────────────────────

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderClerkId?: string | null;
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

// ── Admin Actions ────────────────────────────────────────────────────────────

export async function deleteConversation(conversationId: string): Promise<void> {
  await messagesApi.delete(`/messages/conversations/${conversationId}`);
}

export async function downloadConversation(conversationId: string): Promise<string> {
  const { data } = await messagesApi.get<string>(`/messages/conversations/${conversationId}/download`);
  return data;
}

export default messagesApi;
