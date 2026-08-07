# Skill: Code Review

> Review AI-generated TypeScript/Node.js code. Produce a structured review report AND a cleaned rewrite.

## Trigger

Use this skill when the user asks to: review code, review a file, review a PR, check code quality, audit code, find issues in code, clean up code, or review AI-generated code.

## Inputs

The user provides one or more of:
- A file path or set of file paths
- A code block pasted inline
- A git diff or PR reference

## Process

### Step 1: Read and Understand

Read the entire file. Before flagging anything, understand:
- What is this code trying to do?
- What is the domain context?
- What are the public interfaces?

Do NOT start listing issues until you can explain the code's purpose in one sentence.

### Step 2: Detect Anti-Patterns (The Slop Scan)

Scan for each category systematically. Do not skip any.

**Unnecessary Abstractions**
- [ ] Wrapper functions that just forward arguments
- [ ] Helper classes where a plain function works
- [ ] Factory patterns for single-use instantiation
- [ ] "Manager"/"Handler"/"Service" classes that namespace 1-2 functions
- [ ] Abstract classes with a single implementation
- [ ] Premature interface extraction (one implementor, no polymorphism)
- [ ] **Passthrough generators**: async generator A that only calls async generator B and yields unchanged (or trivially mapped) results → inline or make B the public API
- [ ] **Context Bag**: custom `Context`/`Options` interface created to shuttle state between decomposed sub-classes → pass parent instance (`this`) instead
- [ ] **Ceremony interfaces**: dedicated type for a param object used by one function with <4 fields → use inline params
- [ ] Inline test: can you inline it and lose nothing?

**Over-Engineering**
- [ ] Edge case handling for impossible scenarios
- [ ] Premature generalization ("what if we need X later?")
- [ ] Config objects for constants that won't change
- [ ] Plugin/event architectures for non-extensible features
- [ ] Generics instantiated with only one type
- [ ] Builder patterns for simple objects (2-3 fields)

**Dead / Redundant Code**
- [ ] Unused imports
- [ ] Unreachable code paths
- [ ] No-op functions
- [ ] Commented-out code blocks
- [ ] Duplicated logic
- [ ] Assigned-but-never-read variables
- [ ] Redundant type assertions
- [ ] Leftover console.log / debug statements
- [ ] Orphaned TODO comments

**Excessive Nesting**
- [ ] If/else deeper than 2 levels → flatten with early returns
- [ ] Nested ternaries → extract to variables or if/else
- [ ] Callback pyramids → convert to async/await
- [ ] Long .then() chains mixed with async/await

**Function & File Coherence — The Monolith Instinct**
- [ ] Functions that handle an entire workflow end-to-end (fetch → parse → transform → persist)
- [ ] Methods with multiple distinct logical phases that could be separate functions
- [ ] Classes mixing I/O, parsing, business logic, and error handling in the same methods
- [ ] Files where you need to scroll to follow control flow
- [ ] Functions where top and bottom halves could work independently
- [ ] The "and" test: can you describe this function without using "and"?
- [ ] Utility dumping grounds (utils.ts, helpers.ts)
- [ ] **If monolith detected**: Does the code need decomposition? If yes, recommend: one class per responsibility, parent passes `this` to children, no ceremony types, no intermediate interfaces unless child is independently reusable

**Naming**
- [ ] Vague names: data, result, item, temp, info, stuff, val
- [ ] Functions not starting with verbs (for actions)
- [ ] Booleans missing is/has/should/can prefix
- [ ] Inconsistent conventions within the same file
- [ ] Abbreviations that aren't universally understood

**Comments**
- [ ] Missing top-of-method comments on non-trivial exported functions
- [ ] Comments restating the code
- [ ] Stale comments contradicting the code
- [ ] Missing "why" on non-obvious decisions

**Error Handling**
- [ ] Empty catch blocks
- [ ] Generic catch without context addition
- [ ] Try/catch wrapping entire function bodies
- [ ] Swallowed errors
- [ ] Missing error handling on I/O

**TypeScript-Specific**
- [ ] Overuse of `any` or `as` assertions
- [ ] Redundant type annotations (inference works)
- [ ] Overly complex generics
- [ ] Missing return types on exported functions
- [ ] Unjustified `!` non-null assertions

**Imports**
- [ ] Unused imports
- [ ] Full module imports when partial suffices
- [ ] Circular dependencies

**Silent Failures & Fake Output** *(🔴 highest priority — hardest to catch)*
- [ ] Functions that catch errors and return plausible defaults (empty arrays, `null`, `{}`) instead of propagating
- [ ] Validation functions that always return true or skip actual checks
- [ ] Try/catch that swallows exceptions and returns mock-shaped data
- [ ] Safety checks or guards present in original code but removed by AI to "simplify"
- [ ] Logging that formats but never writes to any destination
- [ ] Feature flags or permission checks that evaluate to no-op
- [ ] Deliberate error trigger test: what happens when this fails? Does it surface or hide?

**Code Duplication & Clone Drift** *(GitClear: 8x increase since 2021)*
- [ ] Same logic implemented in multiple files (AI didn't know about existing impl)
- [ ] Utility functions duplicating functionality of an imported library
- [ ] Near-identical functions differing only in minor parameters → consolidate
- [ ] Copied error handling boilerplate → extract shared handler
- [ ] Duplicated type definitions across files
- [ ] Re-implemented standard library or lodash functionality

**Performance Anti-Patterns** *(CodeRabbit: 8x more excessive I/O in AI code)*
- [ ] String concatenation inside loops
- [ ] Nested loops creating O(n²)+ where O(n) is possible
- [ ] N+1 queries (fetching related data inside a loop)
- [ ] `await` inside loops where `Promise.all` would parallelize
- [ ] Repeated computation that should be memoized
- [ ] Loading entire datasets when streaming/pagination works
- [ ] Synchronous file I/O in async contexts

**Hallucinated APIs & Outdated Patterns** *(Augment: 1 in 5 samples reference fake libs)*
- [ ] Method calls on nonexistent library methods
- [ ] npm packages that don't exist or are unmaintained
- [ ] Deprecated API usage (e.g., `url.parse()` → `new URL()`)
- [ ] Wrong method signatures (parameter order, missing required params)
- [ ] Browser APIs used in Node.js or vice versa

**Data Model & Schema Mismatches**
- [ ] Property access on fields that don't exist in the actual type
- [ ] Assumed API response shapes that don't match real endpoints
- [ ] Missing optional chaining on nullable fields
- [ ] Hardcoded enum values not matching source of truth

### Step 3: Produce the Review Report

Use this format:

```markdown
## Code Review: [filename]

### Summary
[1-2 sentence overall assessment. Be direct.]

### Issues Found

#### 🔴 Critical (must fix)
- **[Category]** — line X: [what's wrong]. Why: [why it matters]. Fix: [concrete suggestion].

#### 🟡 Important (should fix)
- **[Category]** — line X: [what's wrong]. Why: [why it matters]. Fix: [concrete suggestion].

#### 🔵 Minor (consider fixing)
- **[Category]** — line X: [what's wrong]. Why: [why it matters]. Fix: [concrete suggestion].

### Metrics
- Lines before: X → Lines after: Y (Z% reduction)
- Functions removed/inlined: N
- Abstractions eliminated: N
- Dead code removed: N lines
```

### Step 4: Produce the Rewrite

Apply all fixes from the report. Follow these rules strictly:

1. **Preserve behavior exactly.** Same inputs → same outputs. This is refactoring, not rewriting.
2. **Delete before you add.** First pass is always subtraction.
3. **Inline unnecessary abstractions.** Replace wrappers with underlying operations.
4. **Flatten nesting.** Deep if/else → early returns.
5. **Add top-of-method comments** on non-trivial functions. Format:
   ```typescript
   /**
    * [What this function does and why it exists]
    * [Any non-obvious decisions or constraints]
    */
   ```
6. **Remove dead code entirely.** Do not comment it out.
7. **Rename unclear variables** to self-documenting names.
8. **Minimal diff.** Don't rearrange code that's already fine.

### Step 5: Present Both Outputs

Present the review report first, then the rewritten code. End with a one-line summary of the most impactful change.

## Boundaries

- Do NOT add features or change behavior.
- Do NOT change public APIs without explicit warning.
- Do NOT introduce new dependencies.
- Do NOT review test files.
- Do NOT impose arbitrary length limits — coherence is the metric.
- Do NOT rewrite working code just because you'd write it differently.

## Conventions to Enforce

- **Early returns**: Guard clauses first. No deep nesting for happy paths.
- **Single responsibility**: One function = one job. One file = one concern.
- **Naming**: verb-first for actions (getUser), nouns for data (activeUsers), prefixed booleans (isReady).
- **Comments**: Top-of-method on non-trivial exports. Never restate the code.
- **Imports**: Remove unused. Don't question dependency choices.

## Calibration Examples

### Bad (AI slop):
```typescript
// Helper to check if user is valid
function isUserValid(user: User): boolean {
  return UserValidationHelper.getInstance().validate(user);
}

class UserValidationHelper {
  private static instance: UserValidationHelper;
  static getInstance(): UserValidationHelper {
    if (!UserValidationHelper.instance) {
      UserValidationHelper.instance = new UserValidationHelper();
    }
    return UserValidationHelper.instance;
  }
  validate(user: User): boolean {
    if (user !== null && user !== undefined) {
      if (user.email !== null && user.email !== undefined) {
        if (user.email.length > 0) {
          return true;
        }
      }
    }
    return false;
  }
}
```

### Good (reviewed):
```typescript
/**
 * Validates that a user has a non-empty email.
 * Used as a guard before sending transactional emails.
 */
function isUserValid(user: User): boolean {
  return Boolean(user?.email?.length);
}
```

What happened: singleton class eliminated (unnecessary abstraction), deep nesting flattened, null checks simplified, top-of-method comment added. Behavior preserved. 19 lines → 6 lines.
