# glpi-cli

CLI for interacting with [GLPI](https://www.glpi-project.org/) 11.x High-Level REST API (v2) via OAuth2.

Built on [specli](https://github.com/vercel-labs/specli) — auto-generated from the GLPI OpenAPI spec with curated aliases on top.

## Install

```bash
npm install -g glpi-cli
```

Or run without installing:

```bash
npx glpi-cli computer list
```

(After `glpi login`, no server or token flags needed.)

## Quick Start

### 1. Create an OAuth2 client in GLPI

Go to **Setup → OAuth Clients**, create a client with the **api** scope. Note the **Client ID** and **Client Secret**.

### 2. Login

```bash
glpi login
```

Follow the prompts — enter your server root URL (e.g. `https://glpi.example.com`), client ID, client secret, username, and password. Sensitive fields are masked.

All fields can also be passed as flags or env vars (no prompts):

```bash
# All via flags
glpi login --server https://glpi.example.com --client-id ID --client-secret SECRET --username admin --password pass

# All via env vars
GLPI_SERVER=https://glpi.example.com GLPI_CLIENT_ID=ID GLPI_CLIENT_SECRET=SECRET GLPI_USERNAME=admin GLPI_PASSWORD=pass glpi login
```

Token is saved to `~/.config/glpi-cli/config.json` and auto-refreshed when expired.

### 3. Run commands

No need to set tokens manually after `glpi login`. The server URL and token are stored and auto-refreshed.

For CI/scripting, you can still use env vars or flags:

```bash
# PowerShell
$env:GLPI_SERVER = "https://glpi.example.com/api.php"
$env:GLPI_TOKEN = "your-access-token"

# Bash
export GLPI_SERVER="https://glpi.example.com/api.php"
export GLPI_TOKEN="your-access-token"
```

Then run commands as normal:

```bash
glpi computer list
glpi ticket list --limit 10
glpi computer list --columns id,name,serial    # Specific columns
glpi computer list --no-header                 # Scripting-friendly
glpi computer list --json --columns id,name    # Lean JSON for agents
glpi computer get 123                          # Key-value detail view
```

## Commands

### Alias Shortcuts

Short commands for common Assets and Assistance item types:

```bash
glpi computer list                       # List computers
glpi computer get 123                    # Get computer #123
glpi computer create --name "New PC"     # Create a computer
glpi computer update 123 --name "Renamed" # Update computer #123
glpi computer delete 123                 # Delete computer #123

glpi ticket list                         # List tickets
glpi ticket list --filter 'status==1'    # List open tickets
glpi ticket get 456                      # Get ticket #456
glpi ticket create --name "Bug" --content "Description"
glpi ticket update 456 --name "Updated"  # Update ticket #456
glpi ticket delete 456                   # Delete ticket #456
```

### Available Aliases

**Assets:**

| Alias | GLPI Type |
|---|---|
| `computer` | Computer |
| `monitor` | Monitor |
| `network-equipment` | Network Equipment |
| `printer` | Printer |
| `phone` | Phone |
| `peripheral` | Peripheral |
| `software` | Software |
| `software-license` | Software License |
| `appliance` | Appliance |
| `cable` | Cable |
| `cartridge` | Cartridge |
| `cartridge-item` | Cartridge Item |
| `certificate` | Certificate |
| `consumable` | Consumable |
| `consumable-item` | Consumable Item |
| `rack` | Rack |
| `enclosure` | Enclosure |
| `line` | Line |
| `passive-dc-equipment` | Passive DC Equipment |
| `database-instance` | Database Instance |
| `database` | Database |

**Assistance:**

| Alias | GLPI Type |
|---|---|
| `ticket` | Ticket |
| `change` | Change |
| `problem` | Problem |
| `recurring-ticket` | Recurring Ticket |

Each alias supports: `list`, `get <id>`, `create`, `update <id>`, `delete <id>`.

### Raw Commands

For any endpoint not covered by aliases, use the full specli resource/action path:

```bash
glpi administrations list-user           # List users
glpi managements list-contract           # List contracts
glpi setups list-plugin                  # List plugins
glpi status list-all                     # GLPI health check
```

### Actions

Every alias and raw command supports the same flags as the GLPI API:

```bash
--limit 10              # Max items to return
--start 20              # Offset for pagination
--filter 'name==like*HP*'  # RSQL filter
--sort '-date_mod'      # Sort (prefix with - for descending)
```

## Global Options

| Option | Description |
|---|---|
| `--server <url>` | GLPI API base URL (or `GLPI_SERVER` env) |
| `--bearer-token <token>` | OAuth2 bearer token (or `GLPI_TOKEN` env) |
| `--oauth-token <token>` | Alias for `--bearer-token` |
| `--json` | Machine-readable JSON output |
| `--columns <a,b,c>` | Show only specified fields (works with `--json` too) |
| `--no-header` | Omit column headers in list output |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## Login Options

All prompted interactively if not provided. Sensitive fields are masked.

| Option | Env var | Description |
|---|---|---|
| `--server <url>` | `GLPI_SERVER` | GLPI root URL (e.g. `https://glpi.example.com`) |
| `--client-id <id>` | `GLPI_CLIENT_ID` | OAuth2 client ID |
| `--client-secret <secret>` | `GLPI_CLIENT_SECRET` | OAuth2 client secret |
| `--username <user>` | `GLPI_USERNAME` | GLPI username |
| `--password <pass>` | `GLPI_PASSWORD` | GLPI password |

## Profiles

For managing multiple GLPI instances, use specli's built-in profile system:

```bash
npx specli profile set --name prod --server https://glpi.example.com/api.php --bearer-token xxx
npx specli profile set --name staging --server https://staging.example.com/api.php --bearer-token yyy
npx specli profile use --name prod
```

## Compiled Binary

Download a standalone binary (no Node.js required) from [GitHub Releases](https://github.com/user/glpi-cli/releases).

Or compile yourself (requires [Bun](https://bun.sh/)):

```bash
npm run compile
```

## API Compatibility

- **GLPI 11.x** — High-Level REST API (v2)
- **Authentication** — OAuth2 (password grant, authorization code grant)
- **OpenAPI spec** — Based on GLPI HL REST API v2.3.0

## Requirements

- Node.js 18+
- GLPI 11.x with OAuth2 client configured

## License

MIT
