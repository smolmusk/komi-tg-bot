import { Markup } from "telegraf";

export const buildMainMenu = () => {
  return [
    [Markup.button.callback("Tap!", "CLICK_INCREMENT")],
    [Markup.button.callback("Refresh Leaderboard", "REFRESH_LEADERBOARD")],
  ];
};
