import { Redis } from "@upstash/redis";

// Lazy singleton — only created when first accessed
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

/**
 * Cache-aside pattern: return cached value or fetch from DB.
 * If Redis is unavailable or errors, falls back to the fetcher silently.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const client = getRedis();
  if (!client) return fetcher();

  try {
    const cached = await client.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // Redis read failed — fall through to fetcher
  }

  const fresh = await fetcher();

  try {
    await client.set(key, fresh, { ex: ttlSeconds });
  } catch {
    // Redis write failed — data still returned from DB
  }

  return fresh;
}

/**
 * Delete a single cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch {
    // Redis delete failed — stale data will expire via TTL
  }
}

/**
 * Delete multiple cache keys at once.
 */
export async function invalidateCacheKeys(
  ...keys: string[]
): Promise<void> {
  if (keys.length === 0) return;
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(...keys);
  } catch {
    // Redis delete failed — stale data will expire via TTL
  }
}
