import { prisma } from "../../infra/prisma";

const TIMEOUT_MINUTES = 5;

export const cleanupSessions = async () => {
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
};
