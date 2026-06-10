import NodeCache = require("node-cache");

// Standard TTL is 2 minutes (120 seconds). Adjust per route as needed.
export const appCache = new NodeCache({ stdTTL: 120, checkperiod: 150 });

/**
 * Middleware or utility to get/set cached data.
 * Usage:
 * const cached = getCache<Product[]>("top_products");
 * if (cached) return cached;
 * // ... fetch from db ...
 * setCache("top_products", products, 60); // cache for 60 seconds
 */
export function getCache<T>(key: string): T | undefined {
  return appCache.get<T>(key);
}

export function setCache<T>(key: string, data: T, ttlSeconds?: number): boolean {
  if (ttlSeconds) {
    return appCache.set(key, data, ttlSeconds);
  }
  return appCache.set(key, data);
}

export function invalidateCache(key: string): void {
  appCache.del(key);
}

export function flushCache(): void {
  appCache.flushAll();
}
