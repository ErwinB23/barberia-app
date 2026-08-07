---
name: review
description: Review AI-generated code (report + rewrite)
allowed-tools: Read, Grep, Glob, Write
argument-hint: [file-path]
---

Read the skill at `skills/code-review/SKILL.md` and follow its instructions.

Review the code at @$ARGUMENTS. Produce both a structured review report AND a cleaned rewrite following the code-review skill process. If no file is specified, ask the user which file to review.
