import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/lib/messages-api";

export function useUnreadMessages() {
  return useQuery({
    queryKey: ["unreadMessagesCount"],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 25000,
  });
}
