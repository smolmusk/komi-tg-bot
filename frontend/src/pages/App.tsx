import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useHeartbeat } from "../services/useHeartbeat";
import { useLeaderboards } from "../services/useLeaderboards";
import { useClicker } from "../services/useClicker";
import Leaderboard from "../components/Leaderboard";
import GlobalStats from "../components/GlobalStats";
import Controls from "../components/Controls";
import SessionStatus from "../components/SessionStatus";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: number;
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

const App = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get userId from Telegram Web App
    const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    if (telegramUserId != null) {
      setUserId(String(telegramUserId));
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

  return (
    <div className="container">
      <SessionStatus status={heartbeat.status} />
      {error != null ? <div className="error-banner">{error}</div> : null}
      <GlobalStats totalClicks={leaderboard.globalTotal} />
      <Controls
        onClick={clicker.increment}
        disabled={clicker.loading || heartbeat.status !== "online"}
      />
      <Leaderboard entries={leaderboard.entries} />
    </div>
  );
};

export default App;
