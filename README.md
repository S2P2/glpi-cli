# glpi-cli

CLI for interacting with [GLPI](https://www.glpi-project.org/) 11.x High-Level REST API (v2) via OAuth2.

Built on [specli](https://github.com/vercel-labs/specli) — auto-generated from the GLPI OpenAPI spec with curated aliases on top.

## Install

```bash
npm install -g glpi-cli
```

Or run without installing:

```bash
npx glpi-cli computer list --server https://glpi.example.com/api.php --bearer-token xxx
```

## Quick Start

### 1. Create an OAuth2 client in GLPI

Go to **Setup → OAuth Clients**, create a client with the **api** scope. Note the **Client ID** and **Client Secret**.

### 2. Get a token

```bash
curl -X POST https://glpi.example.com/api.php/token \
  -d "grant_type=password" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD" \
  -d "scope=api"
```

Or in PowerShell:

```powershell
$response = Invoke-RestMethod -Uri "https://glpi.example.com/api.php/token" `
  -Method POST `
  -Body @{
    grant_type    = "password"
    client_id     = "YOUR_CLIENT_ID"
    client_secret = "YOUR_CLIENT_SECRET"
    username      = "YOUR_USERNAME"
    password      = "YOUR_PASSWORD"
    scope         = "api"
  }
$response.access_token
```

### 3. Set credentials and run

```powershell
# PowerShell
$env:GLPI_SERVER = "https://glpi.example.com/api.php"
$env:GLPI_TOKEN = "your-access-token"

glpi computer list
glpi ticket list --limit 10
```

```bash
# Bash
export GLPI_SERVER="https://glpi.example.com/api.php"
export GLPI_TOKEN="your-access-token"

glpi computer list
glpi ticket list --limit 10
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
| `-h, --help` | Show help |
| `-v, --version` | Show version |

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
