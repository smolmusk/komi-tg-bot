import "../styles/stats.css";

interface StatsPageProps {
  userId: string | null;
}

const StatsPage = ({ userId }: StatsPageProps) => {
  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>📊 Your Stats</h1>
        <p className="stats-subtitle">Track your progress</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">👤</div>
          <div className="stat-card-label">User ID</div>
          <div className="stat-card-value">{userId}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🎮</div>
          <div className="stat-card-label">Status</div>
          <div className="stat-card-value">Active</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">⏰</div>
          <div className="stat-card-label">Session</div>
          <div className="stat-card-value">Live</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🔗</div>
          <div className="stat-card-label">Version</div>
          <div className="stat-card-value">1.0.0</div>
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
      </div>
    </div>
  );
};

export default StatsPage;
