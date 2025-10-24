import "../styles/home.css";
import { useRateLimit } from "../services/useRateLimit";

interface HomePageProps {
  username: string | null;
  heartbeatStatus: "online" | "offline" | "connecting";
  globalClicks: string | null;
  clickerLoading: boolean;
  onIncrement: () => void;
  error: string | null;
}

const HomePage = ({
  username,
  heartbeatStatus,
  globalClicks,
  clickerLoading,
  onIncrement,
  error,
}: HomePageProps) => {
  const isConnected = heartbeatStatus === "online";
  const isConnecting = heartbeatStatus === "connecting";
  const { isLimited, retryAfter } = useRateLimit(error);

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="status-indicator">
          <div className={`status-dot ${heartbeatStatus}`}></div>
          <span className="status-text">
            {isConnected && "Connected"}
            {isConnecting && "Connecting..."}
            {!isConnected && !isConnecting && "Disconnected"}
          </span>
        </div>
        {username && <div className="user-name">Welcome 👋</div>}
      </div>

      {error && !isLimited && <div className="error-message">{error}</div>}

      <div className="game-container">
        <div className="global-stats-card">
          <div className="stat-label">🌍 Total Clicks</div>
          <div className="stat-value">{globalClicks || "0"}</div>
        </div>

        <button
          className="tap-button"
          onClick={onIncrement}
          disabled={!isConnected || clickerLoading || isLimited}
        >
          <span className="tap-emoji">👆</span>
          <span className="tap-text">
            {isLimited ? `Wait ${retryAfter}s` : "TAP"}
          </span>
        </button>

        <div className="tap-hint">
          {!isConnected && "Connect to start playing"}
          {isConnected && !isLimited && "Click to earn points!"}
          {isConnecting && "Connecting..."}
          {isLimited && `Rate limited! Try again in ${retryAfter} seconds`}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
