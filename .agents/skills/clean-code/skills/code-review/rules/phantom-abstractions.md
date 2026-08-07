---
title: "Phantom Abstractions — Unnecessary Abstractions"
impact: HIGH
tags: [abstraction, wrapper, singleton, context-bag, passthrough]
---

# Phantom Abstractions

Code structures that exist but serve no purpose. The AI creates them because its training data is saturated with enterprise patterns.

**Impact: HIGH (cognitive overhead, indirection without benefit, harder debugging)**

## Signals

- Wrapper functions that add no logic (just forwarding arguments)
- Helper classes where a plain function suffices
- Factory patterns for things instantiated exactly once
- "Manager", "Handler", "Service" classes that are just namespaces for two functions
- Abstract base classes with a single implementation
- Interfaces extracted prematurely (only one implementor, no polymorphism needed)
- Singleton patterns for stateless utilities — use module scope instead

### Passthrough Generators

An async generator that only calls another async generator and yields its results unchanged or with a trivial transform.

```typescript
// BAD: fetchProducts is a passthrough — it only wraps fetchProductBatches
async *fetchProducts(params): AsyncGenerator<StoreProduct[]> {
  for await (const batch of this.fetchProductBatches(params)) {
    yield this.toStoreProducts(batch);
  }
}
```

If the transform is trivial, inline it into the source generator and make that the public method.

### Context Bag Anti-Pattern

When decomposing a monolith into sub-classes, AI creates a `Context` or `Options` interface to shuttle shared state between them. This is almost always wrong — just pass the parent instance (`this`) to child services.

```typescript
// BAD: Context Bag
interface ScraperContext {
  storeDomain: string;
  runId: string;
  fetchFn: FetchFn;
  config: StoreConfig;
}

class SitemapService {
  constructor(private ctx: ScraperContext) {}
}

// GOOD: pass the parent
class SitemapService {
  constructor(private scraper: ScraperAdapter) {}
}
```

A custom `Context` type is only justified if the sub-classes are used independently — not just by this parent.

### Ceremony Interfaces

Creating a dedicated interface/type for a parameter object that is only used by one function and has fewer than 4 fields.

## Diagnostic Test

Can you inline this abstraction and lose nothing? If yes, kill it.

## Incorrect

```typescript
class UserValidationHelper {
  private static instance: UserValidationHelper;
  static getInstance(): UserValidationHelper {
    if (!UserValidationHelper.instance) {
      UserValidationHelper.instance = new UserValidationHelper();
    }
    return UserValidationHelper.instance;
  }
  validate(user: User): boolean {
    return Boolean(user?.email?.length);
  }
}

function isUserValid(user: User): boolean {
  return UserValidationHelper.getInstance().validate(user);
}
```

## Correct

```typescript
/**
 * Validates that a user has a non-empty email.
 * Used as a guard before sending transactional emails.
 */
function isUserValid(user: User): boolean {
  return Boolean(user?.email?.length);
}
```

Singleton class eliminated. 19 lines to 6. Same behavior.
