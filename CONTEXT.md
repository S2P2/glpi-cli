# glpi-cli — Project Context

## What it is

CLI tool for interacting with **GLPI 11.x** High-Level REST API (v2) via OAuth2. Wraps [specli](https://github.com/vercel-labs/specli) with curated aliases for common Assets/Assistance item types.

## Architecture

```
src/
├── index.ts        # CLI entry — arg parsing, alias dispatch, specli calls
├── config.ts       # Token persistence (~/.config/glpi-cli/config.json)
├── login.ts        # OAuth2 password grant + refresh token flow
├── config.test.ts  # Config round-trip tests
└── login.test.ts   # Login + refresh token tests
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

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Engine | specli + thin TypeScript wrapper | Don't rebuild HTTP client; specli handles spec parsing, validation, requests |
| Auth storage | Own config file, not specli profiles | specli's secret storage doesn't work on Node.js (Bun-only) |
| Password masking | Raw mode stdin with `*` echo | Works cross-platform including Windows; avoids readline echo leaks |
| Scope | v1: single profile | KISS; specli profiles available for multi-instance later |

## Current state (v0.2.0)

- [x] Core CLI with 25 aliases (21 Assets + 4 Assistance)
- [x] Raw specli passthrough for all endpoints
- [x] `glpi login` — interactive OAuth2 password grant
- [x] Token persistence + auto-refresh
- [x] Masked prompts (password, client secret)
- [x] Server URL normalization (root → /api.php)
- [x] Config provides server + token fallback after login
- [x] Test suite (vitest, 7 tests)
- [ ] Pretty table output (currently raw JSON)
- [ ] npm publish
- [ ] GitHub Actions CI (build + binary releases)
