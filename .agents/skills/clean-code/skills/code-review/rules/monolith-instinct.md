---
title: "Monolith Instinct — Function & File Bloat"
impact: HIGH
tags: [monolith, decomposition, single-responsibility, context-bag]
---

# Monolith Instinct

AI agents don't decompose proactively. They dump entire workflows into a single function or class. When forced to decompose, they reach for cargo-cult patterns instead of simple structure.

**Impact: HIGH (unreadable, untestable, impossible to maintain)**

This is a two-phase failure:
1. The AI writes a monolith — everything in one method
2. When the user says "split this up", the AI applies ceremony (Context interfaces, factories, abstract bases) instead of the simplest structural fix

## Signals — Undecomposed Monolith

- A single function that handles an entire workflow end-to-end (fetch -> parse -> transform -> persist)
- Methods longer than ~50 lines that contain multiple distinct logical phases
- A class that mixes I/O, parsing, business logic, and error handling in the same methods
- A file where you need to scroll to understand the control flow
- Functions where the top and bottom halves could work independently

## Signals — Bad Decomposition (what the AI does when told to split)

- Creates a `Context`/`SharedState` interface instead of just passing `this`
- Introduces abstract classes where composition would suffice
- Creates factory functions for objects that are only constructed once
- Adds an event/pub-sub system where direct method calls work
- Wraps each extracted class in its own dedicated interface (one implementor)
- More new types/interfaces created than new classes (ceremony > structure)

## What Good Decomposition Looks Like

- Each responsibility becomes its own class or module
- Parent instantiates children, passing `this` for shared access
- No intermediate interfaces unless the child is reusable independently
- The parent orchestrates; children execute. Control flow is visible in the parent.

## Diagnostic Tests

**Test 1**: Can you describe what this function does without using "and"? If no, it's a monolith — but the fix is to decompose *simply*, not to add architecture.

**Test 2**: After decomposition, count the new interfaces/types created. If there are more new types than new classes, the decomposition added more ceremony than structure.

## When NOT to Decompose

Sometimes a long function with clear phases is the right answer. If the phases share mutable state and splitting would create either a Context Bag or complex return-value threading, use **phase comments** instead:

```typescript
async *fetchProducts(params: FetchProductsParams) {
  // -- Phase 1: Discover sitemap entrypoints --
  const entrypoints = await this.discoverEntrypoints(params);

  // -- Phase 2: Discover product URLs --
  const urls = await this.discoverUrls(entrypoints, params);
  if (urls.length === 0) return;

  // -- Phase 3: Warm up extraction guide --
  const guide = await this.warmupGuide(urls, params);

  // -- Phase 4: Process batches --
  yield* this.processBatches(urls, guide, params);
}
```

Phase comments make the structure explicit without the overhead of Context Bags.
