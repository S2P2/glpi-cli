# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-22

### Added

- `glpi login` — interactive OAuth2 login with password grant
  - Prompts for server URL, client ID, client secret, username, password
  - Sensitive fields (password, client secret) are masked with `***`
  - All fields overridable via flags (`--server`, `--client-id`, etc.) or env vars (`GLPI_SERVER`, `GLPI_CLIENT_ID`, etc.)
  - Server URL accepts root path (e.g. `https://glpi.example.com`) — auto-appends `/api.php`
- Token persistence at `~/.config/glpi-cli/config.json`
- Auto-refresh expired tokens using refresh_token grant
- Server URL and token resolved from config after login — no flags needed for subsequent commands
- Pretty table output for list commands — aligned columns with header row
  - Default columns match GLPI web UI display preferences per alias
  - Fallback columns (`id, name, status, entity`) for uncured aliases
  - Nested `{ id, name }` objects rendered as `id: name`
  - Datetime values shortened to `YYYY-MM-DD HH:MM`
  - Long values truncated to 25 chars with `…`
  - Thai/CJK text alignment via `string-width` library
- Detail view for single-item responses — key-value pairs
- `--columns <a,b,c>` flag — show only specified fields (works with `--json` too)
- `--no-header` flag — omit column headers for scripting
- `render.ts` module with 21 tests

## [0.1.0] - 2026-05-22

### Added

- Initial release
- CLI wrapper around [specli](https://github.com/vercel-labs/specli) for GLPI 11.x High-Level REST API v2
- Alias shortcuts for Assets (21 item types) and Assistance (4 item types) with `list`, `get`, `create`, `update`, `delete` actions
- Raw specli passthrough for all other GLPI API endpoints (2,454 total)
- OAuth2 bearer token auth via `--bearer-token` flag or `GLPI_TOKEN` env var
- Server URL via `--server` flag or `GLPI_SERVER` env var
- `--json` flag for machine-readable output
- Windows `HOME`/`USERPROFILE` polyfill for specli profile system
- Numeric flag coercion (fixes `--limit 5` integer validation)
- Patched OpenAPI spec (4 missing `$ref` schemas, invalid `format: "string"` declarations)
- Compiled binary support via `npm run compile` (Bun)
- Dual binary names: `glpi` and `glpi-cli`
