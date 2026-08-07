---
title: "Type System Cosplay — TypeScript Type Abuse"
impact: MEDIUM
tags: [typescript, types, any, generics, assertions]
---

# Type System Cosplay

Using TypeScript's type system in ways that add complexity without adding safety.

**Impact: MEDIUM (harder to read, false sense of safety, type errors masked)**

## Signals

- `any` used more than once in a file
- `as` type assertions that could be replaced with proper typing or type guards
- Redundant type annotations where inference is clear: `const x: string = "hello"`
- Overly complex mapped/conditional types that could be simplified
- Generic types with >2 type parameters
- `!` non-null assertion without an accompanying comment explaining why it's safe
- Union types that should be discriminated unions (no discriminant field)
- Missing return type annotations on exported functions

## Diagnostic Test

Remove the type annotation. Does TypeScript still infer correctly? If yes, the annotation was redundant. For `as` assertions: could a type guard or type narrowing achieve the same thing more safely?

## Incorrect

```typescript
const name: string = 'Alice';
const age: number = 30;
const isActive: boolean = true;

function getUser(id: string): User {
  const data = fetchUserData(id) as any;
  return data as User;
}

interface Wrapper<T, U, V extends Record<string, T>> {
  value: T;
  meta: U;
  lookup: V;
}
```

## Correct

```typescript
const name = 'Alice';
const age = 30;
const isActive = true;

/**
 * Fetches and validates user data from the API.
 * Throws if the response doesn't match the User shape.
 */
function getUser(id: string): User {
  const data = fetchUserData(id);
  if (!isUser(data)) throw new Error(`Invalid user data for ${id}`);
  return data;
}
```

Redundant annotations removed (inference handles them). Unsafe `as any` → runtime validation with a type guard. Complex generic simplified.
