---
title: "Phantom Import — Hallucinated APIs & Outdated Patterns"
impact: CRITICAL
tags: [hallucination, deprecated, api, imports]
---

# Phantom Import

AI references nonexistent libraries, methods, or uses deprecated APIs from older training data.

**Impact: CRITICAL (runtime crashes, security vulnerabilities from deprecated APIs)**

Augment Code (2025) found 1 in 5 AI code samples references fake libraries or nonexistent methods. AI models learn from training data spanning years of code, including deprecated APIs and defunct packages.

## Signals

- Method calls on libraries that don't exist in the installed version
- npm packages referenced that don't exist or are unmaintained
- Deprecated Node.js APIs (`url.parse()`, `new Buffer()`, `fs.exists()`, `domain` module)
- Browser-only APIs used in Node.js context or vice versa
- Incorrect method signatures (wrong parameter order, missing required params)
- References to removed or renamed TypeScript compiler options

## Diagnostic Test

Do the imports resolve? Do the method signatures match the installed version's types? Check `node_modules/@types/` or the package's `.d.ts` files.

## Incorrect

```typescript
import { parseUrl } from 'url-parse-magic';  // this package doesn't exist

const parsed = url.parse('https://example.com');  // deprecated since Node 11
const buf = new Buffer('hello');                   // deprecated, security risk
const exists = fs.existsSync('/tmp/file');          // fine, but fs.exists() callback version is deprecated

// Wrong signature — readFile doesn't take options as second arg in this form
fs.readFile('/tmp/file', 'utf-8', { flag: 'r' }, callback);
```

## Correct

```typescript
const parsed = new URL('https://example.com');
const buf = Buffer.from('hello');

// readFile with correct signature
const content = await fs.promises.readFile('/tmp/file', { encoding: 'utf-8' });
```
