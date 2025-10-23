import { LeaderboardService } from "../../leaderboard/service";

const leaderboardService = new LeaderboardService();

export const buildLeaderboardMessage = async (currentUserId: string) => {
  const top = await leaderboardService.getTop20();

  const lines = top.map((entry) => {
    const indicator = entry.userId === currentUserId ? "👉" : "";
    const name = entry.username ?? "Anonymous";
    return `${indicator} #${entry.rank} — ${name}: ${entry.totalClicks}`;
  });

  if (lines.length === 0) {
    return "No leaderboard data yet. Be the first to click!";
  }

  return ["Top Clickers:", ...lines].join("\n");
};
