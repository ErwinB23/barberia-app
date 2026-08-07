---
title: "Leaky Delegation — Separation of Concerns Violations"
impact: HIGH
tags: [separation-of-concerns, delegation, subservice, encapsulation, leaky-abstraction]
---

# Leaky Delegation

AI agents violate delegation boundaries. When a class delegates to a subclass or subservice, the AI performs subservice-level work directly in the parent — even when that work doesn't duplicate anything the subservice already does. The issue is not repetition. The issue is *misplaced responsibility*: the parent is doing work that belongs to the subservice's domain.

**Impact: HIGH (defeats the purpose of decomposition, blurs responsibility boundaries, makes the parent a second place to look for domain logic)**

This is the mirror image of Monolith Instinct. Where Monolith Instinct catches code that was never decomposed, Leaky Delegation catches code where the decomposition exists but the boundary is not respected — the parent does work that should live in the subservice, whether or not the subservice already does that work.

## Why AI Does This

AI models optimize for local coherence. When they see a parent class with a subservice, they perform domain-level work directly in the parent "for convenience" — formatting, validation, transformation, data manipulation — instead of pushing that work into the subservice where it belongs. This happens even when the subservice doesn't yet have the logic. The AI doesn't think "whose job is this?" — it thinks "where am I right now?" and writes the code there.

Common triggers:
- The AI is asked to "add a feature" and implements it in the parent instead of the subservice where it belongs
- The AI is asked to "fix a bug" in the parent and patches around the subservice's behavior rather than fixing the subservice
- The AI builds up input data, formats output, or applies domain-specific transformations in the parent — work that falls squarely within the subservice's responsibility
- The AI refactors for "clarity" and hoists subservice-domain logic into the parent so the reader "doesn't have to jump between files"
- The AI writes new domain logic in the parent that the subservice doesn't have yet, but *should* have — the logic belongs to the subservice's concern, not the parent's

## Signals

- **Misplaced domain logic**: Parent contains logic (formatting, validation, transformation, data assembly) that falls within the subservice's domain — regardless of whether the subservice currently implements it or not
- **Bypassed delegation**: Parent directly manipulates data or state that the subservice is responsible for, instead of calling the subservice
- **Parent doing subservice-level work**: Parent method performs work that only makes sense in the context of the subservice's responsibility (e.g., building email bodies when there's a NotificationService, applying discount rules when there's a PricingService)
- **Pre/post processing that belongs downstream**: Parent transforms inputs before passing to subservice, or transforms outputs after — when those transforms are part of the subservice's domain
- **Subservice knowledge leaking up**: Parent references subservice internals (private fields, internal data structures, implementation-specific constants) instead of using the subservice's public interface
- **Duplicated logic**: Parent contains logic that also exists in the subservice (a special case — but absence of duplication does NOT mean the boundary is clean)

## Diagnostic Tests

**Test 1 — Responsibility question** (primary test): For each block of logic in the parent, ask "whose job is this?" If the answer is the subservice — even if the subservice doesn't do it yet — the logic belongs in the subservice, not here. This is the definitive test. Duplication is one symptom; misplaced responsibility is the disease.

**Test 2 — Move test**: Could this logic be moved into the subservice and called from there instead? If yes, it should be. The parent should only contain orchestration (calling subservices in order, combining their results) — never domain logic that falls within a subservice's concern.

**Test 3 — Knowledge direction**: Does the parent know *how* the subservice works, or only *what* it does? If the parent knows implementation details (internal formats, private state shapes, step ordering, domain-specific rules), the boundary is leaking.

**Test 4 — New developer test**: If a new developer needed to understand or modify the subservice's behavior, would they also have to read the parent class? If yes, the parent is doing work that belongs in the subservice.

## Examples

### Bad: Parent reimplements subservice logic

```typescript
// Parent class duplicates formatting that belongs in NotificationService
class OrderProcessor {
  constructor(private notificationService: NotificationService) {}

  async processOrder(order: Order) {
    const result = await this.executeOrder(order);

    // ❌ This is NotificationService's job
    const subject = `Order ${order.id} confirmed`;
    const body = `Dear ${order.customerName},\nYour order #${order.id} totaling $${order.total} has been confirmed.`;
    const formattedBody = body.replace(/\n/g, '<br>');

    await this.notificationService.send(order.customerEmail, subject, formattedBody);
    return result;
  }
}
```

### Good: Parent delegates cleanly

```typescript
// Parent only calls NotificationService — formatting is the subservice's concern
class OrderProcessor {
  constructor(private notificationService: NotificationService) {}

  async processOrder(order: Order) {
    const result = await this.executeOrder(order);
    await this.notificationService.notifyOrderConfirmed(order);
    return result;
  }
}
```

### Bad: Parent bypasses subservice and manipulates its data directly

```typescript
class ReportGenerator {
  constructor(private dataAggregator: DataAggregator) {}

  async generate(query: ReportQuery) {
    // ❌ Directly querying and filtering — that's DataAggregator's responsibility
    const rawData = await this.db.query(query.sql);
    const filtered = rawData.filter(r => r.date >= query.startDate && r.date <= query.endDate);
    const grouped = this.groupByCategory(filtered);

    // Then also calling the aggregator (which does the same thing internally)
    const aggregated = await this.dataAggregator.aggregate(query);

    return this.merge(grouped, aggregated);
  }
}
```

### Good: Parent orchestrates, subservice executes

```typescript
class ReportGenerator {
  constructor(private dataAggregator: DataAggregator) {}

  async generate(query: ReportQuery) {
    const aggregated = await this.dataAggregator.aggregate(query);
    return this.formatReport(aggregated);
  }
}
```

## The Rule

When a class delegates to a subclass or subservice:

1. **The parent does NOT do the subservice's job.** Not partially, not "just this once," not "for convenience." If the logic falls within the subservice's domain of responsibility, it goes in the subservice — even if the subservice doesn't have it yet. The absence of duplication is irrelevant: the question is "whose concern is this?"
2. **The parent knows WHAT the subservice does, not HOW.** No references to subservice internals, no pre/post processing that belongs downstream, no domain-specific rules or transformations that the subservice should own.
3. **New features go where they belong.** If a new capability falls within the subservice's domain, implement it in the subservice, not the parent. The parent just calls it.
4. **Fixes go where they belong.** If a bug is in the subservice's domain, fix the subservice. Don't patch around it in the parent.
5. **When in doubt, push it down.** If logic could belong to either the parent or the subservice, it belongs in the subservice. The parent should be an orchestrator: thin, readable, and free of any logic that was already delegated to a subservice.

## When It's NOT Leaky Delegation

- **Cross-cutting concerns**: Logging, metrics, and tracing in the parent around subservice calls is fine — that's orchestration, not reimplementation.
- **Error handling at the boundary**: The parent catching and translating subservice errors is fine — each layer handles errors at its own level.
- **Coordination logic**: If the parent calls multiple subservices and combines their results, the combination logic belongs in the parent (it's orchestration, not delegation).
- **Interface adaptation**: Minor input transformation to match the subservice's public API is fine — as long as it's not duplicating logic the subservice should expose directly.
