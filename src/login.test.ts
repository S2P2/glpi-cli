import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { login, refreshAccessToken } from "./login.js";
import { loadConfig, saveConfig, type Config } from "./config.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let dir: string;
let originalEnv: string | undefined;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "glpi-cli-test-"));
  originalEnv = process.env.GLPI_CONFIG_DIR;
  process.env.GLPI_CONFIG_DIR = dir;
});

afterEach(() => {
  process.env.GLPI_CONFIG_DIR = originalEnv;
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

function mockTokenResponse(overrides: Record<string, unknown> = {}) {
  const body = JSON.stringify({
    access_token: "access-abc",
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: "refresh-xyz",
    scope: "api",
    ...overrides,
  });

  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => JSON.parse(body),
    text: async () => body,
  }));
}

describe("login", () => {
  it("POSTs to token endpoint with password grant and persists config", async () => {
    const fetchMock = mockTokenResponse();
    vi.stubGlobal("fetch", fetchMock);

    const result = await login({
      server: "https://glpi.example.com/api.php",
      clientId: "my-client",
      clientSecret: "my-secret",
      username: "admin",
      password: "pass123",
    });

    // Called the right endpoint
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://glpi.example.com/api.php/token");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });

    // Sent correct body
    const body = init?.body as string;
    expect(body).toContain("grant_type=password");
    expect(body).toContain("client_id=my-client");
    expect(body).toContain("client_secret=my-secret");
    expect(body).toContain("username=admin");
    expect(body).toContain("password=pass123");
    expect(body).toContain("scope=api");

    // Returned config with tokens
    expect(result.accessToken).toBe("access-abc");
    expect(result.refreshToken).toBe("refresh-xyz");
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(result.server).toBe("https://glpi.example.com/api.php");
    expect(result.clientId).toBe("my-client");

    // Persisted to disk
    const loaded = loadConfig();
    expect(loaded).toEqual(result);
  });

  describe("refreshAccessToken", () => {
    it("POSTs with refresh_token grant and updates config", async () => {
      // First, persist an expired config
      const expiredConfig: Config = {
        server: "https://glpi.example.com/api.php",
        clientId: "my-client",
        clientSecret: "my-secret",
        accessToken: "old-access",
        refreshToken: "old-refresh",
        expiresAt: Date.now() - 1000, // expired
      };
      saveConfig(expiredConfig);

      const fetchMock = mockTokenResponse({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 7200,
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await refreshAccessToken();

      // Called refresh endpoint
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://glpi.example.com/api.php/token");
      const body = init?.body as string;
      expect(body).toContain("grant_type=refresh_token");
      expect(body).toContain("refresh_token=old-refresh");
      expect(body).toContain("client_id=my-client");
      expect(body).toContain("client_secret=my-secret");

      // Updated config
      expect(result.accessToken).toBe("new-access");
      expect(result.refreshToken).toBe("new-refresh");
      expect(result.expiresAt).toBeGreaterThan(Date.now());

      // Persisted
      const loaded = loadConfig();
      expect(loaded!.accessToken).toBe("new-access");
    });

    it("returns null when no config or no refresh token", async () => {
      // No config at all
      expect(await refreshAccessToken()).toBeNull();

      // Config without refresh token
      saveConfig({
        server: "https://glpi.example.com/api.php",
        clientId: "my-client",
        clientSecret: "secret",
        accessToken: "some-token",
      });
      expect(await refreshAccessToken()).toBeNull();
    });
  });

  it("throws on non-OK response with error message", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: "invalid_client", error_description: "Bad credentials" }),
    }));

    await expect(
      login({
        server: "https://glpi.example.com/api.php",
        clientId: "bad",
        clientSecret: "bad",
        username: "admin",
        password: "wrong",
      })
    ).rejects.toThrow(/401|invalid_client|Bad credentials/);
  });
});
