---
title: "Trojan Output — Silent Failures & Fake Output"
impact: CRITICAL
tags: [silent-failure, error-handling, safety, correctness]
---

# Trojan Output

Code that appears to work but silently produces wrong or fake results. The most dangerous category — it passes tests and visual inspection.

**Impact: CRITICAL (undetected data corruption, silent data loss, false positives in validation)**

AI models sometimes produce code that catches errors and returns plausible defaults instead of propagating failures. IEEE Spectrum (2026) documented this as a growing failure mode where AI removes safety checks or creates plausible-looking fake output.

## Signals

- Functions that catch errors and return plausible defaults (`[]`, `null`, `{}`, `0`) instead of propagating
- Try/catch blocks that silently swallow exceptions and return empty arrays, null, or `{}`
- Validation functions that always return true (or skip actual validation)
- API calls wrapped in try/catch that return mock-shaped data on failure
- Safety checks or guards that were present in the original code but removed by the AI to "simplify"
- Logging functions that format output but never actually write to any destination
- Feature flags or permission checks that are present but evaluate to no-op

## Diagnostic Test

Deliberately trigger an error condition. Does the code surface the failure, or does it silently produce "reasonable-looking" output? If the latter, this is a silent failure.

## Incorrect

```typescript
async function getUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  } catch {
    // Silently returns a plausible-looking default instead of failing
    return { id, name: '', email: '', role: 'user' };
  }
}
```

The caller has no idea the fetch failed. Downstream code operates on fake data.

## Correct

```typescript
/**
 * Fetches a user by ID from the API.
 * Throws on network errors or non-OK responses — callers must handle failures.
 */
async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user ${id}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
```

Errors propagate. The caller decides what to do — retry, show an error, use a fallback. The decision is explicit, not hidden.
