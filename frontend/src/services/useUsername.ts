import { useState } from "react";
import { API_BASE_URL } from "../config/api";

export interface UseUsernameReturn {
  suggestions: string[];
  loading: boolean;
  error: string | null;
  validating: boolean;
  validationMessage: string | null;
  isValid: boolean;
  getSuggestions: (telegramUsername?: string) => Promise<void>;
  validateUsername: (username: string) => Promise<void>;
  setUsername: (userId: string, username: string) => Promise<boolean>;
}

export const useUsername = (): UseUsernameReturn => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const getSuggestions = async (telegramUsername?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/username/suggestions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramUsername }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }

      const data = (await response.json()) as { suggestions: string[] };
      setSuggestions(data.suggestions);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error getting suggestions";
      setError(message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = async (username: string) => {
    setValidating(true);
    setValidationMessage(null);
    setIsValid(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/username/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );

      const data = (await response.json()) as {
        valid: boolean;
        message?: string;
      };

      if (data.valid) {
        setIsValid(true);
        setValidationMessage("Username is available!");
      } else {
        setIsValid(false);
        setValidationMessage(data.message || "Username is not available");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Validation error";
      setIsValid(false);
      setValidationMessage(message);
    } finally {
      setValidating(false);
    }
  };

  const setUsername = async (userId: string, username: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/username/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string };
        throw new Error(data.message || "Failed to set username");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error setting username";
      setError(message);
      return false;
    }
  };

  return {
    suggestions,
    loading,
    error,
    validating,
    validationMessage,
    isValid,
    getSuggestions,
    validateUsername,
    setUsername,
  };
};
