import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "../types";

const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`);
  if (!res.ok) {
    throw new Error("Failed to load leaderboard");
  }
  return await res.json();
};

const fetchGlobal = async (): Promise<string> => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard/global`);
  if (!res.ok) {
    throw new Error("Failed to load totals");
  }
  const json = (await res.json()) as { totalClicks: string };
  return json.totalClicks;
};

export const useLeaderboards = () => {
  const leaderboard = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 10000,
  });

  const global = useQuery({
    queryKey: ["global"],
    queryFn: fetchGlobal,
    refetchInterval: 10000,
  });

  return {
    entries: leaderboard.data ?? [],
    globalTotal: global.data ?? "0",
  };
};
