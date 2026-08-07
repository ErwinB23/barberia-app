---
title: "Comment Theater — Missing or Excessive Comments"
impact: LOW
tags: [comments, documentation, jsdoc]
---

# Comment Theater

Comments that perform documentation without achieving it.

**Impact: LOW (cognitive noise) to MEDIUM (missing critical context)**

## Signals — Noise Comments (remove)

- `// increment counter` above `counter++`
- `// returns the user` above `return user`
- `// constructor` above `constructor()`
- JSDoc that repeats parameter names without adding meaning: `@param name - the name`
- Stale comments that contradict the current code

## Signals — Missing Comments (add)

- No top-of-method comment on complex exported functions
- Missing "why" comments on non-obvious decisions
- Missing comments on functions with side effects or non-obvious behavior

## Correct Pattern

Each non-trivial exported function gets a brief top-of-method comment:

```typescript
/**
 * Validates that a user has a non-empty email.
 * Used as a guard before sending transactional emails.
 */
function isUserValid(user: User): boolean {
  return Boolean(user?.email?.length);
}
```

The comment explains PURPOSE (what + why) and CONTEXT (when it's used). It does not restate the code. If you need a "what" comment, the code's naming or structure has failed — fix the code, don't add a comment.
