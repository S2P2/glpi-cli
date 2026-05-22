---
name: glpi-cli
description: Query and manage GLPI 11.x assets and tickets via the glpi CLI. Use when the user mentions GLPI items (computers, tickets, monitors, etc.), wants to interact with a GLPI instance from the terminal, or mentions IT asset/ITIL management.
---

# glpi-cli

> **Early project, personal use.** Not published on npm yet. May have rough edges. Verify important operations in the GLPI web UI before relying on them.

CLI for GLPI 11.x High-Level REST API (v2). Uses OAuth2 with auto-refreshing tokens.

## Setup

If not logged in, run once:

```bash
glpi login --server https://glpi.example.com --client-id <id>
```

Prompts for client secret, username, password. Saves token to `~/.config/glpi-cli/config.json`.

For scripting/CI, set `GLPI_TOKEN` env var or pass `--bearer-token`.

## Core Syntax

```bash
glpi <itemtype> <action> [id] [options]
glpi <resource> <action> [args...] [options]   # raw specli passthrough
```

## Item Types (Aliases)

**Assets**: `computer`, `monitor`, `network-equipment`, `printer`, `phone`, `peripheral`, `software`, `software-license`, `appliance`, `cable`, `cartridge`, `cartridge-item`, `certificate`, `consumable`, `consumable-item`, `rack`, `enclosure`, `line`, `passive-dc-equipment`, `database-instance`, `database`

**Assistance**: `ticket`, `change`, `problem`, `recurring-ticket`

## Actions

| Action | Usage | Example |
|--------|-------|---------|
| `list` | Collection query | `glpi computer list --limit 10` |
| `get` | Single item | `glpi computer get 123` |
| `create` | New item | `glpi ticket create --name "New" --content "Desc"` |
| `update` | Modify item | `glpi ticket update 456 --status 5` |
| `delete` | Remove item | `glpi computer delete 123` |

## Output Modes

| Flag | Behavior |
|------|----------|
| *(default)* | Pretty table for lists, key-value for details |
| `--json` | Full raw JSON response |
| `--json --columns id,name` | Filtered JSON — only requested fields |
| `--columns id,name,status` | Show only these columns in table |
| `--no-header` | Strip header row (for scripting/awk) |

## Common Patterns

```bash
# List computers, default columns
glpi computer list --limit 20

# Get specific ticket as JSON
glpi ticket get 42 --json

# Filter list with --columns for lean output
glpi computer list --columns id,name,serial,status

# Scripting: pipe-friendly list
glpi computer list --no-header --columns id,name | awk '{print $1}'

# Search/filter (passed through to GLPI API)
glpi ticket list --filter 'status==1' --limit 50

# Create with multiple fields
glpi ticket create --name "Broken printer" --content "Floor 3 printer jams" --urgency 3

# Raw specli for endpoints without aliases
glpi administrations list-user --limit 10
```

## Key Details

- **Auth resolution**: `--bearer-token` flag → `GLPI_TOKEN` env → saved config (auto-refreshes)
- **Datetime format**: `YYYY-MM-DD HH:MM` in table view, full ISO in `--json`
- **Nested objects**: rendered as `id: name` (e.g. entity, user, location)
- **Truncation**: columns capped at 25 chars with `…`
- **Numeric args**: auto-coerced from strings (pass `--limit 10` not `--limit "10"`)
- **Thai/CJK**: visual-width aligned correctly
