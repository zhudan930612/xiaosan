---
name: agent-browser
description: Use when automating web interactions, extracting structured data from pages, filling forms programmatically, or testing web UIs
---

# Browser Automation with agent-browser

## Installation

```bash
npm install -g agent-browser
agent-browser install
```

## Core Workflow

1. Navigate: `agent-browser open <url>`
2. Snapshot: `agent-browser snapshot -i` (returns elements with refs like `@e1`, `@e2`)
3. Interact using refs from the snapshot
4. Re-snapshot after navigation or significant DOM changes

## Quick Reference

### Navigation

```bash
agent-browser open <url>      # Navigate to URL
agent-browser close           # Close browser
```

### Snapshot

```bash
agent-browser snapshot -i         # Interactive elements only (recommended)
```

### Interactions (use @refs from snapshot)

```bash
agent-browser click @e1           # Click element
agent-browser fill @e2 "text"     # Clear and type
agent-browser press Enter         # Press key
agent-browser hover @e1           # Hover
agent-browser select @e1 "value"  # Select dropdown
```

### Get Information

```bash
agent-browser get text @e1        # Get element text
agent-browser get title           # Get page title
agent-browser get url             # Get current URL
```

### Screenshots

```bash
agent-browser screenshot path.png     # Save to file
agent-browser screenshot --full       # Full page
```

### Wait

```bash
agent-browser wait @e1                 # Wait for element
agent-browser wait --text "Success"    # Wait for text
agent-browser wait --load networkidle  # Wait for network idle
```

## Example: Form Submission

```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
# Output shows: textbox "Email" [ref=e1], textbox "Password" [ref=e2], button "Submit" [ref=e3]

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i  # Check result
```

## Example: Authentication with Saved State

```bash
# Login once
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "username"
agent-browser fill @e2 "password"
agent-browser click @e3
agent-browser wait --url "/dashboard"
agent-browser state save auth.json

# Later sessions: load saved state
agent-browser state load auth.json
agent-browser open https://app.example.com/dashboard
```

## Sessions

```bash
agent-browser --session test1 open site-a.com
agent-browser --session test2 open site-b.com
agent-browser session list
```

## Options

- `--session <name>` uses an isolated session
- `--json` provides JSON output
- `--full` takes a full page screenshot
- `--headed` shows the browser window
- `--timeout` sets the command timeout

## Notes

- Refs are stable per page load but change on navigation
- Always snapshot after navigation to get new refs
- Use fill instead of type for input fields to ensure existing text is cleared

For the complete command reference, see `references/commands.md`.
