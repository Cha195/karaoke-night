import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

const getRedisClient = () => {
  if (!redis) {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error(
        "Missing Upstash Redis credentials. Make sure KV_REST_API_URL and KV_REST_API_TOKEN are set."
      );
    }
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return redis;
};

// Export the original getRedis function for direct use if needed
export const getRedis = getRedisClient;
