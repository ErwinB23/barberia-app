---
title: "Walking Dead — Dead & Redundant Code"
impact: CRITICAL
tags: [dead-code, unused, cleanup, imports]
---

# Walking Dead

Code that compiles but does nothing. The AI generates it because removal requires understanding, and generation is cheaper than reasoning about what's needed.

**Impact: CRITICAL (cognitive noise, misleading readers, increased bundle size)**

GitClear (2025) found that refactoring activity dropped from 25% to under 10% of all code changes since AI adoption. AI adds but rarely subtracts.

## Signals

- Imports not referenced anywhere in the file
- Variables assigned then never read
- Functions defined then never called (verify across files)
- Catch blocks that are empty or just `console.error` with no re-throw
- Type assertions that match the already-inferred type (`x as string` when x is already string)
- Commented-out code blocks (>2 lines)
- `console.log` / `console.debug` statements left behind
- TODO/FIXME/HACK comments with no issue tracker reference
- No-op functions (functions whose body does nothing meaningful)
- Unreachable code paths (code after unconditional return/throw)

## Diagnostic Test

Delete it. Does anything break? Does anything change? If no, it was dead.

## Incorrect

```typescript
import { format } from 'date-fns';           // never used
import { Logger } from './logger';            // never used
import { validateInput, sanitize } from './utils';

const DEBUG = false;                          // never read

function processData(input: string) {
  // const oldResult = legacyProcess(input);  // commented-out code
  console.log('processing:', input);          // debug log
  const sanitized = sanitize(input);
  const result = validateInput(sanitized) as boolean;  // redundant assertion
  return result;
}

function unusedHelper() {                     // never called
  return 'this does nothing';
}
```

## Correct

```typescript
import { validateInput, sanitize } from './utils';

/**
 * Sanitizes input and validates it.
 * Returns true if the input passes all validation rules.
 */
function processData(input: string): boolean {
  const sanitized = sanitize(input);
  return validateInput(sanitized);
}
```

Four imports → one. Debug logs gone. Commented code gone. Unused function gone. Redundant assertion gone. Same behavior.
