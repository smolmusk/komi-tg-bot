import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useHeartbeat } from "../services/useHeartbeat";
import { useLeaderboards } from "../services/useLeaderboards";
import { useClicker } from "../services/useClicker";
import HomePage from "../pages/HomePage";
import LeaderboardPage from "../pages/LeaderboardPage";
import StatsPage from "../pages/StatsPage";
import "../styles/app.css";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
          chat?: {
            id: number;
          };
        };
        chat?: {
          id: number;
        };
      };
    };
  }
}

type Page = "home" | "leaderboard" | "stats";

const App = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("home");

  useEffect(() => {
    const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const tgUsername = window.Telegram?.WebApp?.initDataUnsafe?.user?.username;
    const firstName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;

    console.log("Telegram Web App data:", {
      hasWebApp: !!window.Telegram?.WebApp,
      userId: telegramUserId,
      username: tgUsername,
      firstName,
    });

    if (telegramUserId != null) {
      console.log("✅ Telegram userId found:", telegramUserId);
      setUserId(String(telegramUserId));
      setUsername(tgUsername || firstName || `User ${telegramUserId}`);
    } else {
      console.error("❌ No Telegram userId found");
    }
  }, []);

  const heartbeat = useHeartbeat(userId);
  const leaderboard = useLeaderboards();
  const clicker = useClicker({
    userId,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: ["global"] });
      setError(null);
    },
    onError: (message) => {
      setError(message);
    },
  });

  if (!userId) {
    return (
      <div className="app-container">
        <div className="app-content">
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            username={username}
            heartbeatStatus={heartbeat.status}
            globalClicks={leaderboard.globalTotal}
            clickerLoading={clicker.loading}
            onIncrement={clicker.increment}
            error={error}
          />
        );
      case "leaderboard":
        return <LeaderboardPage leaderboardEntries={leaderboard.entries} />;
      case "stats":
        return <StatsPage userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <div className="app-content">{renderPage()}</div>

      <div className="app-navigation">
        <button
          className={`nav-button ${currentPage === "home" ? "active" : ""}`}
          onClick={() => setCurrentPage("home")}
        >
          <span className="nav-icon">🎮</span>
          <span className="nav-label">Play</span>
        </button>
        <button
          className={`nav-button ${currentPage === "leaderboard" ? "active" : ""}`}
          onClick={() => setCurrentPage("leaderboard")}
        >
          <span className="nav-icon">🏆</span>
          <span className="nav-label">Ranking</span>
        </button>
        <button
          className={`nav-button ${currentPage === "stats" ? "active" : ""}`}
          onClick={() => setCurrentPage("stats")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Stats</span>
        </button>
      </div>
    </div>
  );
};

export default App;
