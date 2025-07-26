import { Redis } from "@upstash/redis";

let redis: any = null;

export const getRedis = () => {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }

  return redis;
};
