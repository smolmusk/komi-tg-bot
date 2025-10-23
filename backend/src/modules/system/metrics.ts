import { redis } from "../../infra/redis";

export const recordMetric = async (name: string, value: number) => {
  await redis.set(`metric:${name}`, value.toString(), "EX", 60);
};

export const getMetric = async (name: string) => {
  const value = await redis.get(`metric:${name}`);
  return value != null ? Number(value) : null;
};
