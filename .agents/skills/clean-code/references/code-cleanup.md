# Skill: Code Cleanup

> Apply mechanical cleanup transforms to AI-generated TypeScript/Node.js code. No judgment calls — just deterministic fixes.

## Trigger

Use this skill when the user asks to: clean up code, remove dead code, fix imports, flatten nesting, simplify code, strip slop, or tidy a file.

## Purpose

This is the **rewrite-only** sibling of `code-review`. No report, no analysis — just the cleaned code. Use it when you already know the code is sloppy and you want it fixed without commentary.

It applies a fixed set of mechanical transforms. If a transform can't preserve behavior with certainty, it skips it and flags it with an inline `// REVIEW:` comment for the human.

## Transform Pipeline

Apply these in order. Each pass should be complete before moving to the next.

### Pass 1: Dead Code Removal

Remove, in this order:
1. Unused imports
2. Unused variables (assigned but never read)
3. Unused functions (defined but never called — verify across the file; if unsure, add `// REVIEW: possibly unused`)
4. Commented-out code blocks (>2 lines)
5. Console.log / console.debug statements
6. Redundant type assertions (`x as Type` where x is already that Type)
7. Empty catch blocks → replace with `// REVIEW: empty catch - intentional?`

### Pass 2: Flatten Nesting

For each function in the file:
1. Identify guard conditions (input validation, null checks, error conditions)
2. Move guard conditions to the top as early returns:
   ```typescript
   // Before
   function process(input: Input) {
     if (input) {
       if (input.isValid) {
         // ...50 lines of logic...
       } else {
         throw new Error('invalid');
       }
     } else {
       throw new Error('missing input');
     }
   }

   // After
   function process(input: Input) {
     if (!input) throw new Error('missing input');
     if (!input.isValid) throw new Error('invalid');

     // ...50 lines of logic (now at top level)...
   }
   ```
3. Convert nested ternaries to `if/else` or extracted variables
4. Convert `.then()` chains to `async/await` where the function is already async

### Pass 3: Inline Phantom Abstractions

For each class and function, check:
- **Single-method classes** → convert to a standalone function
- **Wrapper functions** (only forward arguments to another function) → inline at call sites
- **Singleton utility classes** → convert to module-scoped functions
- **Factory functions that always return one type** → replace with direct construction

- **Passthrough generators** (async generator A that only yields from generator B with zero or trivial transform) → make B the public method, delete A
- **Context Bag interfaces** (custom `Context`/`Options` type created to shuttle parent state to child classes) → flag: `// REVIEW: Context Bag — consider passing parent instance instead`

Only inline when the abstraction adds **zero logic**. If it adds even one condition, one transform, one default — keep it.

Note: Context Bag refactoring is flagged, not auto-applied, because it changes constructor signatures across multiple files.

### Pass 4: Naming Fixes

Apply only **safe renames** (file-scoped, non-exported symbols):
- `data` → name based on what the data contains (e.g., `userData`, `orderPayload`)
- `result` → name based on the operation (e.g., `parsedConfig`, `validationResult`)
- `temp` → name based on purpose or remove if only used once
- `item` in loops → name based on the collection (`users.map(user => ...)` not `users.map(item => ...)`)
- Boolean variables → add `is`/`has`/`should`/`can` prefix

For **exported symbols**, do NOT rename. Instead add: `// REVIEW: consider renaming — [suggestion]`

### Pass 5: Add Missing Comments

For each non-trivial exported function that lacks a top comment:
```typescript
/**
 * [One sentence: what this does and why]
 * [Optional: non-obvious decisions, constraints, or side effects]
 */
```

Rules:
- "Non-trivial" = more than 5 lines, or has branching logic, or has side effects
- Never restate the function name. `/** Gets a user */` above `getUser()` is useless.
- Focus on WHY it exists and any non-obvious behavior.
- If you can't infer the purpose, write: `/** REVIEW: purpose unclear — needs documentation */`

### Pass 6: Silent Failure Scan

For each try/catch block and error handling path:
1. Check if catch blocks return plausible defaults (`[]`, `null`, `{}`) instead of propagating — add `// REVIEW: silent failure — catch returns default instead of throwing`
2. Check if validation functions have actual validation logic (not always-true)
3. Check if error logging actually writes somewhere (not just formatting)
4. Check if safety guards were removed during AI refactoring — compare with types/interfaces to see if null checks are missing on nullable fields

This pass does NOT fix silent failures — it only flags them with `// REVIEW:` because fixing them requires understanding the intended behavior.

### Pass 7: Duplicate Detection

For each non-trivial function (>5 lines):
1. Search the file for near-identical logic blocks
2. If two blocks share >70% of their logic, flag: `// REVIEW: duplicated logic — consider extracting shared function`
3. Check if a function re-implements a method already available from an imported library
4. Check for copied error handling boilerplate that should be a shared handler

### Pass 8: Performance Quick Scan

Flag (do not fix — performance changes can alter behavior):
1. `await` inside `for`/`forEach` loops → `// REVIEW: sequential awaits — consider Promise.all for parallelization`
2. Nested loops on large collections → `// REVIEW: O(n²) — consider using Map/Set for lookup`
3. String concatenation in loops → `// REVIEW: consider array.join() for performance`
4. Repeated expensive computations → `// REVIEW: consider memoizing this value`

### Pass 9: Import Cleanup

1. Remove all unused imports
2. Sort remaining imports: external packages first, then internal (relative) imports, separated by a blank line
3. Prefer named imports over namespace imports when <4 items are used

## Output Format

Output the cleaned file. At the top, add a brief comment block:

```typescript
/**
 * Cleanup applied:
 * - Removed N unused imports
 * - Inlined N abstractions
 * - Flattened N nested blocks
 * - Added N method comments
 * - Removed N lines of dead code
 * - Flagged N silent failure risks
 * - Flagged N duplicate logic blocks
 * - Flagged N performance concerns
 * - Total: N items flagged for human review (search "REVIEW:")
 */
```

## Safety Rules

1. **NEVER change behavior.** Same inputs must produce same outputs. If in doubt, don't touch it.
2. **NEVER rename exported symbols.** Other files depend on them. Flag with `// REVIEW:` instead.
3. **NEVER remove error handling**, even if it looks wrong. Flag it instead.
4. **NEVER remove functions you're not 100% sure are unused.** If the function could be called dynamically (string-based dispatch, event handlers), flag it.
5. **Mark uncertainty.** Anywhere you're less than certain, use `// REVIEW:` comments. The human decides.

## Boundaries

- Production code only. Skip test files.
- TypeScript/Node.js only. Don't apply to config files, JSON, YAML, etc.
- One file at a time. For multi-file cleanup, the user should invoke this skill per file or use `code-review` for architectural analysis.
- Don't split files. Don't change the module boundary. Work within the existing file.
