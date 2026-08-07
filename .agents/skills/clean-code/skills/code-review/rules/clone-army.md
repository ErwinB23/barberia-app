---
title: "Clone Army — Code Duplication & Clone Drift"
impact: HIGH
tags: [duplication, dry, refactoring, clones]
---

# Clone Army

AI generates by predicting tokens, not by understanding your codebase. It will re-implement logic that already exists.

**Impact: HIGH (inconsistent behavior, double maintenance, divergent bug fixes)**

GitClear (2025) measured an 8x increase in copy-pasted code blocks since 2021, while refactoring activity dropped from 25% to under 10% of all changes.

## Signals

- Same logic implemented in multiple files (the AI didn't know about the existing implementation)
- Utility functions that duplicate functionality of an already-imported library
- Near-identical functions with minor parameter differences (should be one parameterized function)
- Copied error handling boilerplate instead of a shared error handler
- Duplicated type definitions or interfaces across files
- Re-implemented standard library functionality (hand-rolled `flatMap`, `groupBy`, etc.)
- Multiple functions differing only in one parameter

## Diagnostic Test

Search the codebase for the core logic of this function. Does it already exist somewhere? If yes, consolidate.

## Incorrect

```typescript
// In user-service.ts
function formatUserError(error: Error, userId: string): string {
  return JSON.stringify({ scope: 'user-service', error: error.message, id: userId, timestamp: Date.now() });
}

// In order-service.ts — near-identical
function formatOrderError(error: Error, orderId: string): string {
  return JSON.stringify({ scope: 'order-service', error: error.message, id: orderId, timestamp: Date.now() });
}

// In payment-service.ts — near-identical again
function formatPaymentError(error: Error, paymentId: string): string {
  return JSON.stringify({ scope: 'payment-service', error: error.message, id: paymentId, timestamp: Date.now() });
}
```

## Correct

```typescript
// In errors.ts
/**
 * Formats a structured error log entry.
 * Used across services for consistent error reporting.
 */
function formatServiceError(scope: string, error: Error, entityId: string): string {
  return JSON.stringify({ scope, error: error.message, id: entityId, timestamp: Date.now() });
}
```

Three functions → one. Single source of truth. If the format needs to change, change it once.
