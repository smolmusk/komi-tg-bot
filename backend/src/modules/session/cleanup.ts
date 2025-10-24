import { prisma } from "../../infra/prisma";

const TIMEOUT_MINUTES = 5;

export const cleanupSessions = async () => {
  try {
    const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

    await prisma.session.updateMany({
      where: {
        lastHeartbeatAt: {
          lt: cutoff,
        },
        status: "ACTIVE",
      },
      data: {
        status: "INACTIVE",
      },
    });
  } catch (error) {
    const err = error as any;
    // Gracefully handle table not existing (common in new deployments)
    if (err.code === "P2021") {
      console.warn("⚠️  Session table does not exist yet, skipping cleanup");
      return;
    }
    throw error;
  }
};
