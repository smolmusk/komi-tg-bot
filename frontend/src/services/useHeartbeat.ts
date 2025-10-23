import { useEffect, useState } from "react";

interface StatusState {
  status: "online" | "offline" | "connecting";
}

const buildHeartbeatPayload = (userId: string | null) => {
  if (userId == null) {
    return null;
  }

  const chatId =
    window.Telegram?.WebApp?.chat?.id ?? window.Telegram?.WebApp?.initDataUnsafe?.chat?.id;

  return {
    userId,
    chatId: chatId != null ? String(chatId) : undefined,
  };
};

export const useHeartbeat = (userId: string | null): StatusState => {
  const [status, setStatus] = useState<"online" | "offline" | "connecting">("connecting");

  useEffect(() => {
    if (userId == null) {
      setStatus("offline");
      return;
    }

    let cancelled = false;

    const send = async () => {
      try {
        setStatus((current) => (current === "online" ? current : "connecting"));
        const payload = buildHeartbeatPayload(userId);

        if (payload == null) {
          setStatus("offline");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/heartbeats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!cancelled) {
          setStatus(response.ok ? "online" : "offline");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("offline");
        }
      }
    };

    void send();

    const interval = window.setInterval(send, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [userId]);

  return { status };
};
