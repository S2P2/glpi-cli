#!/usr/bin/env node

/**
 * glpi-cli — CLI for interacting with GLPI API
 *
 * Thin wrapper around specli that provides:
 * - Short aliases for common Assets/Assistance commands
 * - Full access to all GLPI API endpoints via raw specli paths
 */

import { specli, isSuccess, isError } from "specli";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = resolve(__dirname, "..", "openapi.json");

// ── Alias map ───────────────────────────────────────────────────────────
// alias → [specli resource, action prefix in specli]
const ALIASES: Record<string, [string, string]> = {
  // Assets
  computer: ["assets", "computer"],
  monitor: ["assets", "monitor"],
  "network-equipment": ["assets", "network-equipment"],
  printer: ["assets", "printer"],
  phone: ["assets", "phone"],
  peripheral: ["assets", "peripheral"],
  software: ["assets", "software"],
  "software-license": ["assets", "software-license"],
  appliance: ["assets", "appliance"],
  cable: ["assets", "cable"],
  cartridge: ["assets", "cartridge"],
  "cartridge-item": ["assets", "cartridge-item"],
  certificate: ["assets", "certificate"],
  consumable: ["assets", "consumable"],
  "consumable-item": ["assets", "consumable-item"],
  rack: ["assets", "rack"],
  enclosure: ["assets", "enclosure"],
  line: ["assets", "line"],
  "passive-dc-equipment": ["assets", "passive-dc-equipment"],
  "database-instance": ["assets", "database-instance"],
  database: ["assets", "database"],
  // Assistance
  ticket: ["assistances", "ticket"],
  change: ["assistances", "change"],
  problem: ["assistances", "problem"],
  "recurring-ticket": ["assistances", "recurring-ticket"],
};

const ACTIONS = ["list", "get", "create", "update", "delete"] as const;

// ── Helpers ─────────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | string[]> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        const val = arg.slice(eqIdx + 1);
        pushFlag(flags, key, val);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        pushFlag(flags, arg.slice(2), argv[++i]);
      } else {
        flags[arg.slice(2)] = "true";
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function pushFlag(
  flags: Record<string, string | string[]>,
  key: string,
  val: string
) {
  if (flags[key] === undefined) {
    flags[key] = val;
  } else if (Array.isArray(flags[key])) {
    (flags[key] as string[]).push(val);
  } else {
    flags[key] = [flags[key] as string, val];
  }
}

/** Coerce numeric strings to numbers so specli validates correctly */
function coerceFlags(flags: Record<string, string | string[]>): Record<string, string | number | (string | number)[]> {
  const result: Record<string, string | number | (string | number)[]> = {};
  for (const [key, val] of Object.entries(flags)) {
    if (Array.isArray(val)) {
      result[key] = val.map(v => coerceValue(v));
    } else {
      result[key] = coerceValue(val);
    }
  }
  return result;
}

function coerceValue(val: string): string | number {
  if (/^\d+$/.test(val)) {
    return parseInt(val, 10);
  }
  return val;
}

function extractGlobalOpts(flags: Record<string, string | string[]>) {
  const server = (flags.server as string) || process.env.GLPI_SERVER;
  const bearerToken =
    (flags["bearer-token"] as string) ||
    (flags["oauth-token"] as string) ||
    process.env.GLPI_TOKEN;
  const json = flags.json === "true";
  // Remove consumed keys from flags
  delete flags.server;
  delete flags["bearer-token"];
  delete flags["oauth-token"];
  delete flags.json;
  return { server, bearerToken, json };
}

// ── Main ────────────────────────────────────────────────────────────────

// Polyfill HOME for Windows (specli expects HOME, Windows has USERPROFILE)
if (!process.env.HOME && process.env.USERPROFILE) {
  process.env.HOME = process.env.USERPROFILE;
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (argv.includes("--version") || argv.includes("-v")) {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "..", "package.json"), "utf-8")
    );
    console.log(pkg.version);
    process.exit(0);
  }

  const { positional, flags } = parseArgs(argv);
  const { server, bearerToken, json } = extractGlobalOpts(flags);

  if (positional.length === 0) {
    printHelp();
    process.exit(1);
  }

  const api = await specli({ spec: SPEC_PATH, server, bearerToken });

  const first = positional[0];
  const alias = ALIASES[first];

  if (alias) {
    // Alias mode: glpi <itemtype> <action> [id] [--flags...]
    const [resource, prefix] = alias;
    const action = positional[1];
    const actionArgs = positional.slice(2);

    if (!action || !ACTIONS.includes(action as (typeof ACTIONS)[number])) {
      console.error(`Usage: glpi ${first} <list|get|create|update|delete> [id] [options]`);
      process.exit(1);
    }

    const specliAction = `${action}-${prefix}`;
    const result = await api.exec(resource, specliAction, actionArgs, coerceFlags(flags));
    printResult(result, json);
  } else {
    // Raw mode: glpi <resource> <action> [args...] [--flags...]
    const resource = positional[0];
    const action = positional[1];
    const actionArgs = positional.slice(2);

    if (!action) {
      console.error(`Usage: glpi <resource> <action> [args...] [options]`);
      console.error(`Run 'glpi --help' for available resources.`);
      process.exit(1);
    }

    const result = await api.exec(resource, action, actionArgs, coerceFlags(flags));
    printResult(result, json);
  }
}

import type { CommandResult } from "specli";

function printResult(result: CommandResult, json: boolean) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (isSuccess(result)) {
    const body = result.response.body;
    if (typeof body === "string") {
      console.log(body);
    } else {
      console.log(JSON.stringify(body, null, 2));
    }
  } else if (isError(result)) {
    console.error("error:", result.message);
    process.exit(1);
  }
}

function printHelp() {
  const pkg = JSON.parse(
    readFileSync(resolve(__dirname, "..", "package.json"), "utf-8")
  );
  console.log(`glpi v${pkg.version} — CLI for interacting with GLPI API

USAGE
  glpi <itemtype> <action> [id] [options]    Alias shortcut
  glpi <resource> <action> [args...] [options]  Raw specli command

ALIASES (Assets)
  computer, monitor, network-equipment, printer, phone, peripheral,
  software, software-license, appliance, cable, cartridge, cartridge-item,
  certificate, consumable, consumable-item, rack, enclosure, line,
  passive-dc-equipment, database-instance, database

ALIASES (Assistance)
  ticket, change, problem, recurring-ticket

ACTIONS
  list, get, create, update, delete

EXAMPLES
  glpi computer list --limit 10
  glpi computer get 123
  glpi ticket list --filter 'status==1'
  glpi ticket create --name "New ticket" --content "Description"
  glpi assets list-computer --limit 5        # raw specli command

GLOBAL OPTIONS
  --server <url>          GLPI API base URL (or GLPI_SERVER env)
  --bearer-token <token>  OAuth2 bearer token (or GLPI_TOKEN env)
  --oauth-token <token>   Alias for --bearer-token
  --json                  Machine-readable JSON output
  -h, --help              Show this help
  -v, --version           Show version

AUTH
  Set your token via env:
    Bash:   export GLPI_TOKEN=xxx
    PowerShell: $env:GLPI_TOKEN = "xxx"
  Or pass with every call: --bearer-token xxx

  For multiple profiles, use specli's profile system:
    npx specli profile set --name prod --server https://glpi.example.com/api.php --bearer-token xxx
`);
}

main().catch((err) => {
  console.error("error:", err.message);
  process.exit(1);
});
