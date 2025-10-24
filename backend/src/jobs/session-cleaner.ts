import { Worker, Queue } from "bullmq";
import { redis } from "../infra/redis";
import { cleanupSessions } from "../modules/session/cleanup";

const SESSION_QUEUE = "session-cleaner";

const connection = redis.duplicate({
  maxRetriesPerRequest: null,
});

connection.on("error", (error) => {
  console.error("Session cleaner Redis connection error", error);
});

export const queue = new Queue(SESSION_QUEUE, { connection });

export const worker = new Worker(
  SESSION_QUEUE,
  async () => {
    await cleanupSessions();
  },
  { connection, concurrency: 1 }
);

queue.on("error", (error) => {
  console.error("Session queue error", error);
});

worker.on("error", (error) => {
  console.error("Session worker error", error);
});

worker.on("failed", async (job, err) => {
  console.error(`Session cleanup job failed for ${job?.id}`, err);
});

let scheduled = false;

export const scheduleSessionCleanup = async () => {
  if (scheduled) {
    return;
  }

  try {
    await queue.add(
      "cleanup",
      {},
      {
        repeat: {
          every: 60000,
        },
        jobId: "session-cleanup-repeating",
      }
    );
    scheduled = true;
  } catch (error) {
    console.error("Failed to schedule session cleanup", error);
  }
};
