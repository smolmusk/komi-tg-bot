import type { Scenes } from "telegraf";

export type SessionContext = Scenes.SceneContext<
  Scenes.SceneSessionData & {
    userId?: string;
    chatId?: string;
  }
>;
