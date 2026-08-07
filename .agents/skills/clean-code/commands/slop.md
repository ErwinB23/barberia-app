---
name: slop
description: Quick slop scan (diagnosis only, no rewrite)
allowed-tools: Read, Grep, Glob
argument-hint: [file-path]
---

Read the skill at `skills/slop-detector/SKILL.md` and follow its instructions.

Scan the code at @$ARGUMENTS for AI slop patterns. Produce a severity table and slop score. Do NOT rewrite — diagnosis only. If no file is specified, ask the user which file to scan.
