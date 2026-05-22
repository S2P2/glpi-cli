/**
 * glpi-cli config persistence
 *
 * Stores server URL, OAuth2 credentials, and tokens at:
 *   ~/.config/glpi-cli/config.json
 *
 * Override path via GLPI_CONFIG_DIR env var (for testing).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";

export interface Config {
  server: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

function configDir(): string {
  return process.env.GLPI_CONFIG_DIR ?? resolve(homedir(), ".config", "glpi-cli");
}

function configPath(): string {
  return resolve(configDir(), "config.json");
}

export function loadConfig(): Config | null {
  const path = configPath();
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Config;
}

export function saveConfig(config: Config): void {
  const dir = configDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(configPath(), JSON.stringify(config, null, 2), "utf-8");
}
