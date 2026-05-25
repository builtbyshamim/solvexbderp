import type { Cache } from 'cache-manager';
export async function acquireLock(cacheManager: Cache, key: string, ttl = 5000) {
  const lockKey = `lock:${key}`;

  const exists = await cacheManager.get(lockKey);
  if (exists) return false;

  await cacheManager.set(lockKey, true, ttl);
  return true;
}

export async function releaseLock(cacheManager: Cache, key: string) {
  const lockKey = `lock:${key}`;
  await cacheManager.del(lockKey);
}
