/**
 * glpi-cli login — OAuth2 password grant against GLPI token endpoint
 */

import { loadConfig, saveConfig, type Config } from "./config.js";

export interface LoginOptions {
  server: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

interface TokenError {
  error: string;
  error_description?: string;
}

export async function refreshAccessToken(): Promise<Config | null> {
  const config = loadConfig();
  if (!config || !config.refreshToken || !config.server || !config.clientId) {
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: config.refreshToken,
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    params.set("client_secret", config.clientSecret);
  }

  const url = config.server.replace(/\/+$/, "") + "/token";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as TokenError;
    const msg = err.error_description ?? err.error ?? `HTTP ${res.status}`;
    throw new Error(`Token refresh failed: ${msg}`);
  }

  const data = (await res.json()) as TokenResponse;

  const updated: Config = {
    ...config,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? config.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  saveConfig(updated);
  return updated;
}

export async function login(options: LoginOptions): Promise<Config> {
  const { server, clientId, clientSecret, username, password } = options;

  const params = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
    scope: "api",
  });

  const url = server.replace(/\/+$/, "") + "/token";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as TokenError;
    const msg = err.error_description ?? err.error ?? `HTTP ${res.status}`;
    throw new Error(`Login failed: ${msg}`);
  }

  const data = (await res.json()) as TokenResponse;

  const config: Config = {
    server,
    clientId,
    clientSecret,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  saveConfig(config);
  return config;
}
