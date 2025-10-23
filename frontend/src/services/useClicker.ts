import { useMutation } from "@tanstack/react-query";

interface Options {
  userId: string | null;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const useClicker = ({ userId, onSuccess, onError }: Options) => {
  const mutation = useMutation({
    mutationKey: ["click", userId],
    mutationFn: async () => {
      if (userId == null) {
        throw new Error("User not initialised");
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/clicks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({ error: "Unknown error" }))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Failed to register click");
      }

      return (await res.json()) as { totalClicks: string; delta: number };
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to register click";
      onError?.(message);
    },
  });

  return {
    increment: async () => {
      await mutation.mutateAsync();
    },
    loading: mutation.isPending,
    error: mutation.error,
  };
};
