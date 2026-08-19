const LFUCache = require("../utils/lfuCache");

describe("Custom In-Memory LFU Cache", () => {
  // ==========================================
  // Reset cache before every test
  // ==========================================

  beforeEach(() => {
    LFUCache.clear();
  });

  // ==========================================
  // Basic SET / GET
  // ==========================================

  test("should store and retrieve cached data", () => {
    LFUCache.set(
      "test:key",
      {
        message: "hello",
      }
    );

    const result =
      LFUCache.get(
        "test:key"
      );

    expect(result).toEqual({
      message: "hello",
    });
  });

  // ==========================================
  // Cache Miss
  // ==========================================

  test("should return null for cache miss", () => {
    const result =
      LFUCache.get(
        "missing:key"
      );

    expect(result).toBeNull();
  });

  // ==========================================
  // Frequency Tracking
  // ==========================================

  test("should increase frequency on every cache hit", () => {
    LFUCache.set(
      "frequency:key",
      "data"
    );

    LFUCache.get(
      "frequency:key"
    );

    LFUCache.get(
      "frequency:key"
    );

    LFUCache.get(
      "frequency:key"
    );

    const stats =
      LFUCache.stats();

    const entry =
      stats.entries.find(
        (item) =>
          item.key ===
          "frequency:key"
      );

    expect(
      entry
    ).toBeDefined();

    // Initial frequency = 1
    // Three cache hits = +3
    // Expected = 4
    expect(
      entry.frequency
    ).toBe(4);
  });

  // ==========================================
  // Maximum Size
  // ==========================================

  test("should never exceed maximum cache size", () => {
    const originalMaxSize =
      LFUCache.maxSize;

    LFUCache.maxSize = 3;

    LFUCache.set(
      "A",
      "Data A"
    );

    LFUCache.set(
      "B",
      "Data B"
    );

    LFUCache.set(
      "C",
      "Data C"
    );

    LFUCache.set(
      "D",
      "Data D"
    );

    expect(
      LFUCache.size()
    ).toBeLessThanOrEqual(
      3
    );

    LFUCache.maxSize =
      originalMaxSize;
  });

  // ==========================================
  // LFU Eviction
  //
  // A -> 10 hits
  // B -> 5 hits
  // C -> 1 hit
  //
  // Add D
  //
  // Expected:
  // A -> keep
  // B -> keep
  // C -> remove
  // D -> add
  // ==========================================

  test(
    "should remove the least frequently used item when cache is full",
    () => {
      const originalMaxSize =
        LFUCache.maxSize;

      LFUCache.maxSize = 3;

      LFUCache.set(
        "A",
        "Data A"
      );

      LFUCache.set(
        "B",
        "Data B"
      );

      LFUCache.set(
        "C",
        "Data C"
      );

      // A frequency:
      // Initial 1 + 10 hits = 11
      for (
        let i = 0;
        i < 10;
        i++
      ) {
        LFUCache.get("A");
      }

      // B frequency:
      // Initial 1 + 5 hits = 6
      for (
        let i = 0;
        i < 5;
        i++
      ) {
        LFUCache.get("B");
      }

      // C frequency:
      // Initial 1 + 1 hit = 2
      LFUCache.get("C");

      // Add D
      LFUCache.set(
        "D",
        "Data D"
      );

      // A should stay
      expect(
        LFUCache.get("A")
      ).toBe("Data A");

      // B should stay
      expect(
        LFUCache.get("B")
      ).toBe("Data B");

      // C should have been evicted
      expect(
        LFUCache.get("C")
      ).toBeNull();

      // D should exist
      expect(
        LFUCache.get("D")
      ).toBe("Data D");

      expect(
        LFUCache.size()
      ).toBe(3);

      LFUCache.maxSize =
        originalMaxSize;
    }
  );

  // ==========================================
  // Same Frequency
  //
  // If two entries have the same frequency,
  // the oldest entry should be removed.
  // ==========================================

  test(
    "should remove the oldest item when frequencies are equal",
    () => {
      const originalMaxSize =
        LFUCache.maxSize;

      LFUCache.maxSize = 2;

      LFUCache.set(
        "old",
        "Old Data"
      );

      // Make sure creation timestamps
      // are different.
      return new Promise(
        (resolve) => {
          setTimeout(() => {
            LFUCache.set(
              "new",
              "New Data"
            );

            LFUCache.set(
              "latest",
              "Latest Data"
            );

            expect(
              LFUCache.get(
                "old"
              )
            ).toBeNull();

            expect(
              LFUCache.get(
                "new"
              )
            ).toBe(
              "New Data"
            );

            expect(
              LFUCache.get(
                "latest"
              )
            ).toBe(
              "Latest Data"
            );

            LFUCache.maxSize =
              originalMaxSize;

            resolve();
          }, 5);
        }
      );
    }
  );

  // ==========================================
  // TTL Expiration
  // ==========================================

  test(
    "should expire cached data after TTL",
    () => {
      const originalTTL =
        LFUCache.ttl;

      LFUCache.ttl = 20;

      LFUCache.set(
        "ttl:key",
        "TTL Data"
      );

      expect(
        LFUCache.get(
          "ttl:key"
        )
      ).toBe(
        "TTL Data"
      );

      return new Promise(
        (resolve) => {
          setTimeout(() => {
            expect(
              LFUCache.get(
                "ttl:key"
              )
            ).toBeNull();

            expect(
              LFUCache.has(
                "ttl:key"
              )
            ).toBe(false);

            LFUCache.ttl =
              originalTTL;

            resolve();
          }, 40);
        }
      );
    }
  );

  // ==========================================
  // Expired Cache Must Not Count Towards Size
  // ==========================================

  test(
    "should remove expired entries during cleanup",
    () => {
      const originalTTL =
        LFUCache.ttl;

      LFUCache.ttl = 20;

      LFUCache.set(
        "expired:1",
        "Data 1"
      );

      LFUCache.set(
        "expired:2",
        "Data 2"
      );

      expect(
        LFUCache.size()
      ).toBe(2);

      return new Promise(
        (resolve) => {
          setTimeout(() => {
            const removed =
              LFUCache.cleanupExpired();

            expect(
              removed
            ).toBe(2);

            expect(
              LFUCache.size()
            ).toBe(0);

            LFUCache.ttl =
              originalTTL;

            resolve();
          }, 40);
        }
      );
    }
  );

  // ==========================================
  // Prefix Invalidation
  // ==========================================

  test(
    "should invalidate all entries matching a prefix",
    () => {
      LFUCache.set(
        "todos:user1:page1",
        "Page 1"
      );

      LFUCache.set(
        "todos:user1:page2",
        "Page 2"
      );

      LFUCache.set(
        "todos:user2:page1",
        "User 2 Page 1"
      );

      LFUCache.set(
        "other:key",
        "Other Data"
      );

      const removed =
        LFUCache.invalidatePrefix(
          "todos:user1:"
        );

      expect(
        removed
      ).toBe(2);

      expect(
        LFUCache.get(
          "todos:user1:page1"
        )
      ).toBeNull();

      expect(
        LFUCache.get(
          "todos:user1:page2"
        )
      ).toBeNull();

      expect(
        LFUCache.get(
          "todos:user2:page1"
        )
      ).toBe(
        "User 2 Page 1"
      );

      expect(
        LFUCache.get(
          "other:key"
        )
      ).toBe(
        "Other Data"
      );
    }
  );

  // ==========================================
  // Todo Cache Invalidation
  // ==========================================

  test(
    "should invalidate all Todo cache entries",
    () => {
      LFUCache.set(
        "todos:user1:status:pending",
        "User 1 Data"
      );

      LFUCache.set(
        "todos:user2:status:completed",
        "User 2 Data"
      );

      LFUCache.set(
        "settings:user1",
        "Settings"
      );

      const removed =
        LFUCache.invalidateTodos();

      expect(
        removed
      ).toBe(2);

      expect(
        LFUCache.get(
          "todos:user1:status:pending"
        )
      ).toBeNull();

      expect(
        LFUCache.get(
          "todos:user2:status:completed"
        )
      ).toBeNull();

      expect(
        LFUCache.get(
          "settings:user1"
        )
      ).toBe(
        "Settings"
      );
    }
  );

  // ==========================================
  // Delete
  // ==========================================

  test("should delete a single cache entry", () => {
    LFUCache.set(
      "delete:key",
      "Data"
    );

    expect(
      LFUCache.has(
        "delete:key"
      )
    ).toBe(true);

    const deleted =
      LFUCache.delete(
        "delete:key"
      );

    expect(
      deleted
    ).toBe(true);

    expect(
      LFUCache.has(
        "delete:key"
      )
    ).toBe(false);
  });

  // ==========================================
  // Clear
  // ==========================================

  test("should clear the complete cache", () => {
    LFUCache.set(
      "key1",
      "Data 1"
    );

    LFUCache.set(
      "key2",
      "Data 2"
    );

    LFUCache.set(
      "key3",
      "Data 3"
    );

    expect(
      LFUCache.size()
    ).toBe(3);

    LFUCache.clear();

    expect(
      LFUCache.size()
    ).toBe(0);

    expect(
      LFUCache.get("key1")
    ).toBeNull();

    expect(
      LFUCache.get("key2")
    ).toBeNull();

    expect(
      LFUCache.get("key3")
    ).toBeNull();
  });

  // ==========================================
  // Existing Key Update
  //
  // Updating an existing key should replace
  // its data without creating a second entry.
  // ==========================================

  test(
    "should update existing cache data without increasing cache size",
    () => {
      LFUCache.set(
        "same:key",
        "Old Data"
      );

      const firstStats =
        LFUCache.stats();

      const firstEntry =
        firstStats.entries.find(
          (item) =>
            item.key ===
            "same:key"
        );

      expect(
        firstEntry.frequency
      ).toBe(1);

      LFUCache.set(
        "same:key",
        "New Data"
      );

      expect(
        LFUCache.size()
      ).toBe(1);

      expect(
        LFUCache.get(
          "same:key"
        )
      ).toBe(
        "New Data"
      );
    }
  );

  // ==========================================
  // Stats
  // ==========================================

  test("should return cache statistics", () => {
    LFUCache.set(
      "stats:key1",
      "Data 1"
    );

    LFUCache.set(
      "stats:key2",
      "Data 2"
    );

    LFUCache.get(
      "stats:key1"
    );

    const stats =
      LFUCache.stats();

    expect(
      stats
    ).toHaveProperty(
      "size"
    );

    expect(
      stats
    ).toHaveProperty(
      "maxSize"
    );

    expect(
      stats
    ).toHaveProperty(
      "ttl"
    );

    expect(
      Array.isArray(
        stats.entries
      )
    ).toBe(true);

    const entry =
      stats.entries.find(
        (item) =>
          item.key ===
          "stats:key1"
      );

    expect(
      entry.frequency
    ).toBe(2);
  });

  // ==========================================
  // Different Users Must Have Separate Keys
  // ==========================================

  test(
    "should keep different users' cached data separate",
    () => {
      const user1Key =
        "todos:role:user:userId:user1:search::status:pending:priority::dueDate::page:1:limit:10:sort:newest";

      const user2Key =
        "todos:role:user:userId:user2:search::status:pending:priority::dueDate::page:1:limit:10:sort:newest";

      LFUCache.set(
        user1Key,
        {
          user: "user1",
        }
      );

      LFUCache.set(
        user2Key,
        {
          user: "user2",
        }
      );

      expect(
        LFUCache.get(
          user1Key
        )
      ).toEqual({
        user: "user1",
      });

      expect(
        LFUCache.get(
          user2Key
        )
      ).toEqual({
        user: "user2",
      });

      expect(
        LFUCache.get(
          user1Key
        )
      ).not.toEqual(
        LFUCache.get(
          user2Key
        )
      );
    }
  );

  // ==========================================
  // Different Query Parameters Must Have
  // Separate Cache Entries
  // ==========================================

  test(
    "should keep different Todo query combinations separate",
    () => {
      const pendingKey =
        "todos:userId:123:status:pending:page:1:limit:10";

      const completedKey =
        "todos:userId:123:status:completed:page:1:limit:10";

      const pageTwoKey =
        "todos:userId:123:status:pending:page:2:limit:10";

      LFUCache.set(
        pendingKey,
        "Pending Data"
      );

      LFUCache.set(
        completedKey,
        "Completed Data"
      );

      LFUCache.set(
        pageTwoKey,
        "Page 2 Data"
      );

      expect(
        LFUCache.get(
          pendingKey
        )
      ).toBe(
        "Pending Data"
      );

      expect(
        LFUCache.get(
          completedKey
        )
      ).toBe(
        "Completed Data"
      );

      expect(
        LFUCache.get(
          pageTwoKey
        )
      ).toBe(
        "Page 2 Data"
      );

      expect(
        LFUCache.size()
      ).toBe(3);
    }
  );

  // ==========================================
  // Cache Failure Should Not Throw
  // ==========================================

  test(
    "cache operations should fail safely without throwing",
    () => {
      expect(() =>
        LFUCache.get(
          null
        )
      ).not.toThrow();

      expect(() =>
        LFUCache.delete(
          null
        )
      ).not.toThrow();

      expect(() =>
        LFUCache.invalidatePrefix(
          null
        )
      ).not.toThrow();

      expect(() =>
        LFUCache.clear()
      ).not.toThrow();
    }
  );
});