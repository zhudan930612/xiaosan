---
name: experience-triage
description: Use when user asks 'where should this go', 'what layer should this be', 'should this be a skill or CLAUDE.md', 'I learned something new where do I put it', or after completing a task and wants to document the lesson
---

# Experience Triage

Your task: guide the user through a decision tree to determine which layer of the agent architecture a piece of experience belongs to.

## Step 1: Clarify the experience

Ask the user to describe the experience in one sentence. If vague, ask:
- Is this a rule that applies every time, or only in specific situations?
- Does this apply to one project or across all projects?
- Does this require executing actions, or just constraining model behavior?

## Step 2: Run the decision tree

Ask these five questions in order. The first match wins:

**Q1: Must this execute every time, zero exceptions, cannot rely on model self-discipline?**
Yes → Recommend `hook`. Give a hook configuration example.
No → Q2

**Q2: Does this need to execute real commands, query APIs, or read data?**
Yes → Recommend `script` or `MCP tool`, then call it from the relevant skill.
No → Q3

**Q3: Does this only apply to a specific directory, file type, or module?**
Yes → Recommend `nested CLAUDE.md` or `path-scoped rule` in that directory.
No → Q4

**Q4: Is this a multi-step process, checklist, or decision flow?**
Yes → Recommend a new `skill`. Provide a description field suggestion (must be triggerable).
No → Q5

**Q5: Is this a high-frequency default behavior or constraint that every session should know?**
Yes → Recommend adding to `CLAUDE.md` or `AGENTS.md`. Warn if current file exceeds 150 lines.
No → This experience may be too personal or one-off. Do not document it.

## Step 3: Provide a writing template

Based on the Q1-Q5 answer, provide a draft that can be written directly into the target file.

Requirements:
- Correct format (YAML frontmatter, Markdown headers, code blocks)
- Concrete, not vague ("do X when Y" not "please follow best practices")
- Include at least one specific example or counter-example

## Step 4: Suggest promotion

If the user has triggered the same skill for the same category of experience multiple times recently, suggest promoting that experience from skill up to CLAUDE.md.

## Output Format

```
[Triage Result] xxx layer
[Recommended Location] ~/.claude/xxx or project-root/xxx
[Writing Template]
(directly copyable Markdown draft)
[Follow-up]
(if applicable, suggest promotion or learning curve)
```
