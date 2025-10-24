import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "../types";
import { API_BASE_URL } from "../config/api";

const fetchLeaderboard = async (userId?: string): Promise<{
  entries: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;
}> => {
  const url = userId 
    ? `${API_BASE_URL}/api/leaderboard?userId=${userId}`
    : `${API_BASE_URL}/api/leaderboard`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load leaderboard");
  }
  return await res.json();
};

const fetchGlobal = async (): Promise<string> => {
  const res = await fetch(`${API_BASE_URL}/api/leaderboard/global`);
  if (!res.ok) {
    throw new Error("Failed to load totals");
  }
  const json = (await res.json()) as { totalClicks: string };
  return json.totalClicks;
};

export const useLeaderboards = (userId?: string) => {
  const leaderboard = useQuery({
    queryKey: ["leaderboard", userId],
    queryFn: () => fetchLeaderboard(userId),
    staleTime: 0,
  });

  const global = useQuery({
    queryKey: ["global"],
    queryFn: fetchGlobal,
    staleTime: 0,
  });

  return {
    entries: leaderboard.data?.entries ?? [],
    userRank: leaderboard.data?.userRank ?? null,
    globalTotal: global.data ?? "0",
  };
};
