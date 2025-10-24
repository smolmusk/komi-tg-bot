import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../config/api";

export interface UserStats {
  id: string;
  username: string | null;
  clicks: string;
  totalClicks: string;
  lastActiveAt: string | null;
  createdAt: string;
  rank: number;
}

const fetchUserStats = async (telegramId: string): Promise<UserStats> => {
  const res = await fetch(`${API_BASE_URL}/api/users/telegram/${telegramId}`);
  if (!res.ok) {
    throw new Error("Failed to load user stats");
  }
  return await res.json();
};

export const useUserStats = (userId: string | null) => {
  const query = useQuery({
    queryKey: ["userStats", userId],
    queryFn: () => fetchUserStats(userId!),
    enabled: !!userId,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  return {
    stats: query.data,
    loading: query.isPending,
    error: query.error?.message,
  };
};
