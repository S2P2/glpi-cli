# glpi-cli — Project Context

## What it is

CLI tool for interacting with **GLPI 11.x** High-Level REST API (v2) via OAuth2. Wraps [specli](https://github.com/vercel-labs/specli) with curated aliases for common Assets/Assistance item types.

## Architecture

```
src/
├── index.ts        # CLI entry — arg parsing, alias dispatch, specli calls
├── config.ts       # Token persistence (~/.config/glpi-cli/config.json)
├── login.ts        # OAuth2 password grant + refresh token flow
├── render.ts       # Output rendering — list tables, detail key-value, column map
├── config.test.ts  # Config round-trip tests
├── login.test.ts   # Login + refresh token tests
└── render.test.ts  # Rendering tests (21 tests)
```

- **specli** — programmatic API (`api.exec(resource, action, args, flags)`) driven by patched `openapi.json`
- **Single profile** — one config file, one GLPI instance at a time
- **Token resolution order**: `--bearer-token` flag → `GLPI_TOKEN` env → saved config (with auto-refresh)

## Key terms

| Term | Meaning |
|---|---|
| Alias | Short name for an item type (e.g. `computer` → `assets` resource, `computer` prefix) |
| Raw command | Full specli resource/action path (e.g. `administrations list-user`) |
| Config | Persisted auth state at `~/.config/glpi-cli/config.json` — server, clientId, clientSecret, tokens |
| Normalized server | User enters root URL (e.g. `https://glpi.example.com`), code appends `/api.php` |
| List view | Tabular output for collection endpoints — aligned columns with header row, one item per line |
| Detail view | Key-value output for single-item endpoints — one field per line, label-aligned |
| Default columns | Curated field set per alias, matching GLPI web UI display preferences |
| Fallback columns | Convention-based default (`id, name, status, entity`) for aliases without curated web defaults |

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Engine | specli + thin TypeScript wrapper | Don't rebuild HTTP client; specli handles spec parsing, validation, requests |
| Auth storage | Own config file, not specli profiles | specli's secret storage doesn't work on Node.js (Bun-only) |
| Password masking | Raw mode stdin with `*` echo | Works cross-platform including Windows; avoids readline echo leaks |
| Scope | v1: single profile | KISS; specli profiles available for multi-instance later |
| Output engine | Hand-rolled rendering + `string-width` | Simple aligned columns + key-value doesn't justify a full table library; `string-width` solves Thai/CJK combining-mark alignment |
| List format | Aligned columns with header row, `--no-header` for scripting | Matches familiar CLI patterns (`ls -l`, `kubectl get`); pipe-friendly |
| Detail format | Key-value pairs, raw field names as labels | Complete and consistent from day one; human labels and sections can layer on later |
| Nested objects | Always `id: name` in table/detail | Actionable — copy-paste ready for follow-up commands; consistent rule for all columns |
| Null/empty values | Empty cell | Cleanest visual; dashes or `N/A` add noise at scale |
| Default columns source | GLPI web UI display preferences (`glpi_displaypreferences`) | Zero learning curve for users coming from GLPI web |
| Fallback for uncured aliases | `id, name, status, entity` if they exist | Better than raw JSON for every alias we haven't curated yet |
| `--columns` flag | Comma-separated field names, no dot notation | Simple to parse and type; nested objects always render as `id: name` |
| `--json` alone | Full raw response | Machine-readable escape hatch — every field, no truncation |
| `--json --columns` | Filtered JSON — only requested fields | Agent-friendly: lean output for arbitrary AI agents |
| Write actions (create/update/delete) | Render by response shape — object → key-value, primitive → plain print | No artificial confirmation messages; show what the API returns |

## Current state (v0.2.0)

- [x] Core CLI with 25 aliases (21 Assets + 4 Assistance)
- [x] Raw specli passthrough for all endpoints
- [x] `glpi login` — interactive OAuth2 password grant
- [x] Token persistence + auto-refresh
- [x] Masked prompts (password, client secret)
- [x] Server URL normalization (root → /api.php)
- [x] Config provides server + token fallback after login
- [x] Test suite (vitest, 28 tests)
- [x] Pretty table output — list view (aligned columns), detail view (key-value), --columns, --no-header
- [ ] npm publish
- [ ] GitHub Actions CI (build + binary releases)
