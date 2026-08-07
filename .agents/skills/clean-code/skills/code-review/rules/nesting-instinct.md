---
title: "Nesting Instinct — Excessive Nesting & Complexity"
impact: HIGH
tags: [nesting, complexity, early-return, guard-clause]
---

# Nesting Instinct

Deeply nested control flow. The AI models code as a tree, not a pipeline.

**Impact: HIGH (39% increase in cognitive complexity per Agile Pain Relief 2025)**

## Signals

- If/else chains deeper than 2 levels
- Nested ternary operators
- `.then().then().then()` chains (should be async/await)
- Callback nesting (callback hell)
- Nested `try/catch` blocks
- Switch inside switch
- `if` inside `for` inside `if` — any 3-level nesting
- Mixing `.then()` chains with `async/await` in the same function

## Diagnostic Test

Can a stranger read this function top-to-bottom in one pass without scrolling back? If no, flatten it.

## Incorrect

```typescript
function processOrder(order: Order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.customer) {
        if (order.customer.isVerified) {
          const total = calculateTotal(order.items);
          if (total > 0) {
            return submitOrder(order, total);
          } else {
            throw new Error('Empty total');
          }
        } else {
          throw new Error('Customer not verified');
        }
      } else {
        throw new Error('No customer');
      }
    } else {
      throw new Error('No items');
    }
  } else {
    throw new Error('No order');
  }
}
```

## Correct

```typescript
/**
 * Validates and submits an order.
 * Guard clauses handle invalid states upfront; happy path runs flat.
 */
function processOrder(order: Order) {
  if (!order) throw new Error('No order');
  if (order.items.length === 0) throw new Error('No items');
  if (!order.customer) throw new Error('No customer');
  if (!order.customer.isVerified) throw new Error('Customer not verified');

  const total = calculateTotal(order.items);
  if (total <= 0) throw new Error('Empty total');

  return submitOrder(order, total);
}
```

6 levels of nesting → 0. Same logic, same errors. Reads top-to-bottom in one pass.
