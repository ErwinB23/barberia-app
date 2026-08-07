---
title: "Identity Crisis — Naming Failures"
impact: HIGH
tags: [naming, readability, conventions]
---

# Identity Crisis

Naming that hides intent. The AI picks generic names because it doesn't understand your domain.

**Impact: HIGH (CodeRabbit found nearly 2x more naming inconsistencies in AI code)**

## Signals

- Ambiguous names: `data`, `result`, `response`, `item`, `temp`, `val`, `info`, `stuff`, `obj`
- Names that describe implementation rather than intent
- Inconsistent naming conventions within the same file
- Boolean variables without `is`/`has`/`should`/`can` prefix
- Functions that don't start with a verb (for actions)
- Abbreviations that aren't universally understood
- Same concept named differently in different files (inconsistency)
- Single-letter variables outside of loop counters or short lambdas

## Diagnostic Test

Could a new team member understand this name without reading the function body?

## Conventions

- **Actions**: verb-first — `getUser()`, `createOrder()`, `validateInput()`
- **Data**: descriptive nouns — `activeUsers`, `orderTotal`, `configPath`
- **Booleans**: prefixed — `isReady`, `hasPermission`, `shouldRetry`, `canAccess`
- **Pragmatic, not dogmatic**: whatever reads clearest wins. No rigid system.

## Incorrect

```typescript
const data = await fetch('/api/users');
const result = data.json();
const temp = result.filter(item => item.active);
const info = temp.map(item => ({ ...item, flag: true }));
```

## Correct

```typescript
const response = await fetch('/api/users');
const users = await response.json();
const activeUsers = users.filter(user => user.active);
const flaggedUsers = activeUsers.map(user => ({ ...user, isHighlighted: true }));
```

Every variable name tells you what's in it. No `data`, no `item`, no `temp`, no `flag`.
