---
title: "Error Amnesia — Error Handling Anti-Patterns"
impact: CRITICAL
tags: [error-handling, try-catch, robustness]
---

# Error Amnesia

Error handling that pretends errors don't happen, or handles them in ways that hide information.

**Impact: CRITICAL (hidden bugs, impossible debugging, data corruption)**

CodeRabbit found error handling gaps are nearly 2x more common in AI-generated code. AI agents produce code that catches errors generically, swallows them silently, or wraps entire functions in try/catch as a "safety" pattern that actually destroys error context.

## Signals

- Empty catch blocks: `catch (e) {}`
- Catch-and-log-only: `catch (e) { console.error(e) }` with no re-throw or recovery
- Generic catch without adding context: `catch (e) { throw e }` (adds nothing)
- Try/catch wrapping an entire function body
- No error handling on file I/O, network calls, or JSON.parse
- Mixing error handling patterns (sometimes throw, sometimes return null, sometimes callback)
- Inconsistent error patterns within the same module

## Diagnostic Test

Trace every catch block. Does it: (1) add context and re-throw, (2) recover meaningfully, or (3) neither? Category 3 is Error Amnesia.

## Incorrect

```typescript
async function processOrder(order: Order) {
  try {
    const validated = validateOrder(order);
    const payment = await chargePayment(validated);
    const confirmation = await sendConfirmation(payment);
    return confirmation;
  } catch (error) {
    console.error('Something went wrong:', error);
    return null;
  }
}
```

If `chargePayment` fails, the payment might have been partially processed. The caller gets `null` and has no idea why. The error is logged but not actionable.

## Correct

```typescript
/**
 * Processes an order through validation, payment, and confirmation.
 * Each step throws with context on failure — callers handle the error at the appropriate level.
 */
async function processOrder(order: Order): Promise<Confirmation> {
  const validated = validateOrder(order);

  let payment: Payment;
  try {
    payment = await chargePayment(validated);
  } catch (error) {
    throw new Error(`Payment failed for order ${order.id}: ${error.message}`, { cause: error });
  }

  return sendConfirmation(payment);
}
```

Each failure point adds context. The caller gets a meaningful error, not `null`. The `cause` chain preserves the original error for debugging.
