---
name: cleanup
description: Mechanical code cleanup (rewrite only, no report)
allowed-tools: Read, Grep, Glob, Write, Edit
argument-hint: [file-path]
---

Read the skill at `skills/code-cleanup/SKILL.md` and follow its instructions.

Apply the 10-pass cleanup pipeline to the code at @$ARGUMENTS. Output the cleaned file directly. No report — just the fixed code with // REVIEW: flags where human judgment is needed. If no file is specified, ask the user which file to clean.
