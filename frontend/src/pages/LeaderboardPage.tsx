import "../styles/leaderboard.css";
import type { LeaderboardEntry } from "../types";

interface LeaderboardPageProps {
  leaderboardEntries: LeaderboardEntry[];
}

const LeaderboardPage = ({ leaderboardEntries }: LeaderboardPageProps) => {
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🎯";
  };

  const formatClicks = (clicks: string) => {
    const num = BigInt(clicks);
    if (num >= BigInt(1000000)) {
      return (Number(num) / 1000000).toFixed(1) + "M";
    }
    if (num >= BigInt(1000)) {
      return (Number(num) / 1000).toFixed(1) + "K";
    }
    return clicks;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p className="leaderboard-subtitle">Top Players</p>
      </div>

      <div className="leaderboard-list">
        {leaderboardEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No players yet. Be the first!</p>
          </div>
        ) : (
          leaderboardEntries.map((entry) => (
            <div key={entry.userId} className="leaderboard-row">
              <div className="rank-section">
                <span className="rank-medal">{getMedalEmoji(entry.rank)}</span>
                <span className="rank-number">#{entry.rank}</span>
              </div>

              <div className="player-section">
                <div className="player-name">{entry.username || `Player ${entry.userId}`}</div>
                <div className="player-id">@{entry.userId}</div>
              </div>

              <div className="clicks-section">
                <div className="clicks-value">{formatClicks(entry.totalClicks)}</div>
                <div className="clicks-label">clicks</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
