import { LRUCache } from "lru-cache";

export interface RateLimitOptions {
  interval: number;
  limit: number;
}

const rateLimiters = new Map<string, LRUCache<string, number[]>>();

export function rateLimit(options: RateLimitOptions) {
  const key = `${options.interval}-${options.limit}`;

  if (!rateLimiters.has(key)) {
    rateLimiters.set(
      key,
      new LRUCache<string, number[]>({
        max: 5000,
        ttl: options.interval,
      }),
    );
  }

  const cache = rateLimiters.get(key)!;

  return {
    check(identifier: string): { success: boolean; remaining: number } {
      const now = Date.now();
      const windowStart = now - options.interval;

      const requests = (cache.get(identifier) || []).filter((t) => t > windowStart);

      if (requests.length >= options.limit) {
        return { success: false, remaining: 0 };
      }

      requests.push(now);
      cache.set(identifier, requests);

      return {
        success: true,
        remaining: options.limit - requests.length,
      };
    },
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
