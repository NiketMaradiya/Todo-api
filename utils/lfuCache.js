/**
 * Custom In-Memory LFU Cache
 *
 * Features:
 * - Stores data in Node.js application memory
 * - Maximum number of entries
 * - LFU (Least Frequently Used) eviction
 * - TTL expiration
 * - Frequency tracking
 * - Prefix-based invalidation
 * - Full cache clearing
 * - Cache statistics
 *
 * No Redis or external caching service is used.
 */

class LFUCache {
  constructor(options = {}) {
    this.maxSize = this.normalizePositiveInteger(
      options.maxSize,
      100
    );

    this.ttl = this.normalizePositiveInteger(
      options.ttl,
      60000
    );

    // key -> cache entry
    this.cache = new Map();
  }

  // =========================================================
  // Helpers
  // =========================================================

  normalizePositiveInteger(value, defaultValue) {
    const parsed = Number(value);

    if (
      !Number.isFinite(parsed) ||
      parsed <= 0
    ) {
      return defaultValue;
    }

    return Math.floor(parsed);
  }

  isExpired(entry) {
    if (!entry) {
      return true;
    }

    return Date.now() >= entry.expiresAt;
  }

  createEntry(key, data) {
    const now = Date.now();

    return {
      key,
      data,
      frequency: 1,
      createdAt: now,
      expiresAt: now + this.ttl,
    };
  }

  // =========================================================
  // GET
  // =========================================================

  get(key) {
    try {
      const entry = this.cache.get(key);

      // Cache miss
      if (!entry) {
        return null;
      }

      // TTL expired
      if (this.isExpired(entry)) {
        this.cache.delete(key);

        return null;
      }

      // Cache hit
      entry.frequency += 1;

      return entry.data;
    } catch (error) {
      // Cache failure must never break the API
      return null;
    }
  }

  // =========================================================
  // SET
  // =========================================================

  set(key, data) {
    try {
      if (!key) {
        return false;
      }

      // Remove expired entries before checking capacity
      this.cleanupExpired();

      // -----------------------------------------------------
      // Existing cache entry
      // -----------------------------------------------------

      if (this.cache.has(key)) {
        const existingEntry =
          this.cache.get(key);

        const now = Date.now();

        existingEntry.data = data;

        // Keep existing frequency.
        // Updating cached data should not artificially
        // increase usage frequency.
        existingEntry.createdAt = now;

        existingEntry.expiresAt =
          now + this.ttl;

        this.cache.set(
          key,
          existingEntry
        );

        return true;
      }

      // -----------------------------------------------------
      // Cache capacity reached
      // -----------------------------------------------------

      if (
        this.cache.size >=
        this.maxSize
      ) {
        this.evictLFU();
      }

      // -----------------------------------------------------
      // Add new entry
      // -----------------------------------------------------

      const entry =
        this.createEntry(
          key,
          data
        );

      this.cache.set(
        key,
        entry
      );

      return true;
    } catch (error) {
      // Cache failure must never break the API
      return false;
    }
  }

  // =========================================================
  // HAS
  // =========================================================

  has(key) {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        return false;
      }

      if (this.isExpired(entry)) {
        this.cache.delete(key);

        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  delete(key) {
    try {
      return this.cache.delete(key);
    } catch (error) {
      return false;
    }
  }

  // =========================================================
  // INVALIDATE PREFIX
  //
  // Example:
  //
  // invalidatePrefix("todos:userId:123:")
  //
  // This removes all Todo list cache entries belonging
  // to that user.
  // =========================================================

  invalidatePrefix(prefix) {
    try {
      if (
        typeof prefix !== "string" ||
        !prefix
      ) {
        return 0;
      }

      let removedCount = 0;

      for (const key of this.cache.keys()) {
        if (
          key.startsWith(prefix)
        ) {
          this.cache.delete(key);
          removedCount += 1;
        }
      }

      return removedCount;
    } catch (error) {
      return 0;
    }
  }

  // =========================================================
  // INVALIDATE ALL TODO CACHE
  //
  // Todo cache keys will use:
  // todos:userId:...
  // =========================================================

  invalidateTodos() {
    return this.invalidatePrefix(
      "todos:"
    );
  }

  // =========================================================
  // CLEAR ALL CACHE
  // =========================================================

  clear() {
    try {
      this.cache.clear();

      return true;
    } catch (error) {
      return false;
    }
  }

  // =========================================================
  // CLEANUP EXPIRED ENTRIES
  // =========================================================

  cleanupExpired() {
    try {
      let removedCount = 0;

      for (const [
        key,
        entry,
      ] of this.cache.entries()) {
        if (
          this.isExpired(entry)
        ) {
          this.cache.delete(key);

          removedCount += 1;
        }
      }

      return removedCount;
    } catch (error) {
      return 0;
    }
  }

  // =========================================================
  // LFU EVICTION
  //
  // Remove the entry with the lowest frequency.
  //
  // If multiple entries have the same frequency,
  // the oldest entry is removed first.
  // =========================================================

  evictLFU() {
    try {
      if (
        this.cache.size === 0
      ) {
        return null;
      }

      let leastUsedKey = null;
      let leastUsedEntry = null;

      for (const [
        key,
        entry,
      ] of this.cache.entries()) {
        // First entry
        if (!leastUsedEntry) {
          leastUsedKey = key;
          leastUsedEntry = entry;

          continue;
        }

        // Lower frequency wins
        if (
          entry.frequency <
          leastUsedEntry.frequency
        ) {
          leastUsedKey = key;
          leastUsedEntry = entry;

          continue;
        }

        // Same frequency:
        // older entry wins
        if (
          entry.frequency ===
            leastUsedEntry.frequency &&
          entry.createdAt <
            leastUsedEntry.createdAt
        ) {
          leastUsedKey = key;
          leastUsedEntry = entry;
        }
      }

      if (
        leastUsedKey !== null
      ) {
        this.cache.delete(
          leastUsedKey
        );

        return leastUsedKey;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // =========================================================
  // SIZE
  // =========================================================

  size() {
    try {
      this.cleanupExpired();

      return this.cache.size;
    } catch (error) {
      return 0;
    }
  }

  // =========================================================
  // STATS
  //
  // Useful for testing the LFU implementation.
  // =========================================================

  stats() {
    try {
      this.cleanupExpired();

      return {
        size: this.cache.size,
        maxSize: this.maxSize,
        ttl: this.ttl,

        entries:
          Array.from(
            this.cache.values()
          ).map(
            (entry) => ({
              key: entry.key,
              frequency:
                entry.frequency,
              createdAt:
                new Date(
                  entry.createdAt
                ),
              expiresAt:
                new Date(
                  entry.expiresAt
                ),
            })
          ),
      };
    } catch (error) {
      return {
        size: 0,
        maxSize: this.maxSize,
        ttl: this.ttl,
        entries: [],
      };
    }
  }
}

// =========================================================
// ENV CONFIGURATION
// =========================================================

const maxSize =
  process.env.CACHE_MAX_SIZE ||
  100;

const ttl =
  process.env.CACHE_TTL ||
  60000;

// =========================================================
// SINGLE CACHE INSTANCE
//
// This singleton is shared by the entire Node.js process.
// Server restart automatically clears the cache because
// everything exists only in application memory.
// =========================================================

const cache =
  new LFUCache({
    maxSize,
    ttl,
  });

module.exports = cache;