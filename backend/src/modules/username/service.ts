import { prisma } from "../../infra/prisma";

const ADJECTIVES = [
  "Swift",
  "Mighty",
  "Sharp",
  "Bright",
  "Quick",
  "Bold",
  "Wild",
  "Wise",
  "Cool",
  "Epic",
  "Cosmic",
  "Sonic",
  "Turbo",
  "Nova",
  "Cyber",
  "Phoenix",
];

const NOUNS = [
  "Tiger",
  "Eagle",
  "Dragon",
  "Wolf",
  "Phoenix",
  "Falcon",
  "Viper",
  "Storm",
  "Blaze",
  "Thunder",
  "Shadow",
  "Spirit",
  "Ghost",
  "Knight",
  "Titan",
  "Beast",
];

const generateSuggestionsFromTelegramUsername = (telegramUsername: string): string[] => {
  const base = telegramUsername.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  const suggestions: string[] = [];

  // Suggestion 1: Original with number
  if (base) {
    suggestions.push(`${base}${Math.floor(Math.random() * 1000)}`);
  }

  // Suggestion 2-4: Random adjective + noun combinations
  for (let i = 0; i < 3; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    suggestions.push(`${adj}${noun}${Math.floor(Math.random() * 100)}`);
  }

  return suggestions.slice(0, 4);
};

export const getUsernamesSuggestions = (telegramUsername: string | undefined): string[] => {
  return generateSuggestionsFromTelegramUsername(telegramUsername || "Player");
};

export const validateUsername = async (username: string): Promise<{
  valid: boolean;
  message?: string;
}> => {
  if (!username || username.length < 3 || username.length > 20) {
    return {
      valid: false,
      message: "Username must be 3-20 characters long",
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      message: "Username can only contain letters, numbers, dashes, and underscores",
    };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { username },
    });

    if (existing) {
      return {
        valid: false,
        message: "This username is already taken",
      };
    }
  } catch (error) {
    console.error("Username validation error:", error);
    return {
      valid: false,
      message: "Validation error occurred",
    };
  }

  return { valid: true };
};

export const setUsername = async (
  userId: string,
  username: string
): Promise<{
  success: boolean;
  message?: string;
}> => {
  const validation = await validateUsername(username);

  if (!validation.valid) {
    return {
      success: false,
      message: validation.message,
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: "Failed to set username",
    };
  }
};
