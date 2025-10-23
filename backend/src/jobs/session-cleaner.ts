import { Worker, Queue } from "bullmq";
import { redis } from "../infra/redis";
import { cleanupSessions } from "../modules/session/cleanup";

const SESSION_QUEUE = "session-cleaner";

const connection = redis.duplicate({
  maxRetriesPerRequest: null,
});

export const queue = new Queue(SESSION_QUEUE, { connection });

export const worker = new Worker(
  SESSION_QUEUE,
  async () => {
    await cleanupSessions();
  },
  { connection, concurrency: 1 }
);

worker.on("failed", async (job, err) => {
  console.error(`Session cleanup job failed for ${job?.id}`, err);
});

let scheduled = false;

export const scheduleSessionCleanup = async () => {
  if (scheduled) {
    return;
  }

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
};
