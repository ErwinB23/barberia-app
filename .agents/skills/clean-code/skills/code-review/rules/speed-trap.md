---
title: "Speed Trap — Performance Anti-Patterns"
impact: HIGH
tags: [performance, io, loops, async, n-plus-one]
---

# Speed Trap

AI optimizes for clarity and correctness, not runtime efficiency.

**Impact: HIGH in hot paths, MEDIUM elsewhere (degraded UX, timeout errors, memory exhaustion)**

CodeRabbit (2025) found excessive I/O operations are 8x more common in AI-generated code.

## Signals

- `await` inside `for`/`forEach` loops where `Promise.all` would parallelize
- Nested loops creating O(n^2) or worse complexity where O(n) is possible
- N+1 query patterns (fetching related data one-by-one inside a loop)
- String concatenation inside loops (should use array join)
- Repeated computation of the same value (should be memoized or cached)
- Loading entire datasets into memory when streaming or pagination would work
- Synchronous file I/O in async contexts
- Creating new objects/arrays inside hot loops instead of reusing

## Diagnostic Test

What happens when this runs against 10x the expected input size? If it degrades non-linearly, flag it.

## Incorrect

```typescript
async function enrichUsers(userIds: string[]): Promise<EnrichedUser[]> {
  const enriched: EnrichedUser[] = [];
  for (const id of userIds) {
    const user = await fetchUser(id);           // sequential: 100 users = 100 round trips
    const profile = await fetchProfile(id);     // another sequential round trip
    enriched.push({ ...user, ...profile });
  }
  return enriched;
}
```

100 users = 200 sequential network calls. Linear in time, but the constant is a network round trip.

## Correct

```typescript
/**
 * Enriches users by fetching user and profile data in parallel batches.
 * Batches avoid overwhelming the API while still parallelizing within each batch.
 */
async function enrichUsers(userIds: string[]): Promise<EnrichedUser[]> {
  const batchSize = 10;
  const results: EnrichedUser[] = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const enriched = await Promise.all(
      batch.map(async (id) => {
        const [user, profile] = await Promise.all([fetchUser(id), fetchProfile(id)]);
        return { ...user, ...profile };
      }),
    );
    results.push(...enriched);
  }

  return results;
}
```

Parallelized within batches. 100 users = 10 batches of 10, each batch parallelized. 20x fewer round trips.
