import { useEffect, useState } from "react";
import { useUsername } from "../services/useUsername";
import "../styles/username-setup.css";

interface UsernameSetupPageProps {
  userId: string;
  telegramUsername?: string;
  onComplete: (username: string) => void;
}

const UsernameSetupPage = ({
  userId,
  telegramUsername,
  onComplete,
}: UsernameSetupPageProps) => {
  const [selectedUsername, setSelectedUsername] = useState("");
  const [customUsername, setCustomUsername] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    suggestions,
    loading,
    error,
    validating,
    validationMessage,
    isValid,
    getSuggestions,
    validateUsername,
    setUsername,
  } = useUsername();

  useEffect(() => {
    void getSuggestions(telegramUsername);
  }, [telegramUsername]);

  const handleSelectSuggestion = (username: string) => {
    setSelectedUsername(username);
    setShowCustomInput(false);
    setCustomUsername("");
    void validateUsername(username);
  };

  const handleCustomChange = (value: string) => {
    setCustomUsername(value);
    setSelectedUsername("");

    if (value.length >= 3) {
      void validateUsername(value);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    const usernameToSet = showCustomInput ? customUsername : selectedUsername;

    if (!usernameToSet || !isValid) {
      return;
    }

    setSubmitting(true);

    try {
      const success = await setUsername(userId, usernameToSet);

      if (success) {
        onComplete(usernameToSet);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentUsername = showCustomInput ? customUsername : selectedUsername;
  const canSubmit = isValid && currentUsername.length >= 3 && !submitting;

  return (
    <div className="username-setup-page">
      <div className="setup-container">
        <div className="setup-header">
          <h1>🎮 Choose Your Username</h1>
          <p>Pick a unique name to compete on the leaderboard</p>
        </div>

        {error && <div className="setup-error">{error}</div>}

        <div className="setup-section">
          <h2>Suggested Names</h2>
          {loading ? (
            <div className="loading-spinner">Loading suggestions...</div>
          ) : (
            <div className="suggestions-grid">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className={`suggestion-button ${
                    selectedUsername === suggestion ? "selected" : ""
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  disabled={submitting}
                >
                  <span className="suggestion-text">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="setup-divider">
          <span>OR</span>
        </div>

        <div className="setup-section">
          <h2>Create Custom</h2>
          <div className="custom-input-wrapper">
            <input
              type="text"
              className={`custom-input ${showCustomInput ? "active" : ""}`}
              placeholder="Enter your username (3-20 chars)"
              value={customUsername}
              onChange={(e) => {
                setShowCustomInput(true);
                handleCustomChange(e.target.value);
              }}
              maxLength={20}
              disabled={submitting}
            />
            {customUsername && (
              <span className="char-count">
                {customUsername.length}/20
              </span>
            )}
          </div>

          {customUsername && (
            <div
              className={`validation-status ${
                validating ? "validating" : isValid ? "valid" : "invalid"
              }`}
            >
              {validating ? (
                <span>✳️ Checking availability...</span>
              ) : isValid ? (
                <span>✅ {validationMessage}</span>
              ) : (
                <span>❌ {validationMessage}</span>
              )}
            </div>
          )}
        </div>

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? "Setting Username..." : "Let's Play! 🚀"}
        </button>

        <div className="username-rules">
          <p>💡 Username rules:</p>
          <ul>
            <li>3-20 characters long</li>
            <li>Letters, numbers, dashes & underscores only</li>
            <li>Must be unique</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetupPage;
