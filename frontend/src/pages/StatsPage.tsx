import "../styles/stats.css";
import { useUserStats } from "../services/useUserStats";

interface StatsPageProps {
  userId: string | null;
}

const StatsPage = ({ userId }: StatsPageProps) => {
  const { stats, loading, error } = useUserStats(userId);

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatNumber = (num: string | undefined): string => {
    if (!num) return "0";
    return Number(num).toLocaleString();
  };

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>📊 Your Stats</h1>
        <p className="stats-subtitle">Track your progress</p>
      </div>

      {error && <div className="stats-error">⚠️ Failed to load stats: {error}</div>}

      {loading ? (
        <div className="stats-loading">Loading your stats...</div>
      ) : stats ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon">👤</div>
              <div className="stat-card-label">Username</div>
              <div className="stat-card-value">{stats.username || "Not Set"}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">🏆</div>
              <div className="stat-card-label">Rank</div>
              <div className="stat-card-value">{stats.rank ? `#${stats.rank}` : "No rank"}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">👆</div>
              <div className="stat-card-label">Total Clicks</div>
              <div className="stat-card-value">{formatNumber(stats.totalClicks)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">⏰</div>
              <div className="stat-card-label">Joined</div>
              <div className="stat-card-value">{formatDate(stats.createdAt)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">🟢</div>
              <div className="stat-card-label">Last Active</div>
              <div className="stat-card-value">
                {stats.lastActiveAt ? formatDate(stats.lastActiveAt) : "Just now"}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">🎮</div>
              <div className="stat-card-label">User ID</div>
              <div className="stat-card-value-small">{stats.id}</div>
            </div>
          </div>

          <div className="stats-info">
            <div className="info-section">
              <h3>🎯 How to Play</h3>
              <ul>
                <li>Tap the button as fast as you can</li>
                <li>Earn points with each click</li>
                <li>Climb the leaderboard</li>
                <li>Compete with friends</li>
              </ul>
            </div>

            <div className="info-section">
              <h3>💡 Tips & Tricks</h3>
              <ul>
                <li>Rate limited to 25 clicks/second</li>
                <li>Your rank updates every 10 seconds</li>
                <li>Session stays active for 24 hours</li>
                <li>Invite friends to compete</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="stats-empty">No stats available</div>
      )}
    </div>
  );
};

export default StatsPage;
