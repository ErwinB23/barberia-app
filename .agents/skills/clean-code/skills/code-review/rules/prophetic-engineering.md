---
title: "Prophetic Engineering — Over-Engineering"
impact: HIGH
tags: [over-engineering, premature-generalization, yagni]
---

# Prophetic Engineering

Code that solves problems the codebase will never have. The AI optimizes for generality because it doesn't know your roadmap.

**Impact: HIGH (cognitive overhead, maintenance burden, obscured intent)**

## Signals

- Handling edge cases that will never occur in this context
- Premature generalization ("what if we need to support multiple databases later?")
- Configuration objects for values that will never change
- Plugin architectures for non-extensible features
- Event emitters where a direct function call works
- Generic type parameters that are always instantiated with one type
- Builder patterns for objects with 2-3 fields
- Strategy patterns with exactly one strategy
- Optional parameters that are always passed the same value
- "Options" objects with one field

## Diagnostic Test

Is this solving a current problem or a hypothetical future one? If hypothetical, kill it.

## Incorrect

```typescript
interface DatabaseAdapter<T extends DatabaseDriver = PostgresDriver> {
  query<R>(sql: string, params?: unknown[]): Promise<R>;
  connect(options?: ConnectionOptions): Promise<void>;
  disconnect(): Promise<void>;
}

class DatabaseFactory {
  static create<T extends DatabaseDriver>(type: string): DatabaseAdapter<T> {
    switch (type) {
      case 'postgres': return new PostgresAdapter() as DatabaseAdapter<T>;
      default: throw new Error(`Unknown database type: ${type}`);
    }
  }
}

// Usage — always Postgres, always will be
const db = DatabaseFactory.create('postgres');
```

## Correct

```typescript
/**
 * Postgres connection wrapper.
 * If we ever need a second database, we'll extract an interface then.
 */
class Database {
  async query<R>(sql: string, params?: unknown[]): Promise<R> {
    return this.pool.query(sql, params);
  }
}

const db = new Database();
```

Generic type parameter, factory pattern, adapter interface — all removed. One database, one class. If the requirement changes, refactor then.
