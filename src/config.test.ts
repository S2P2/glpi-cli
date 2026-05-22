import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, saveConfig, type Config } from "./config.js";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Override CONFIG_DIR for tests
const ORIGINAL_CONFIG_DIR: string | undefined = undefined;

function withTempDir() {
  let dir: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "glpi-cli-test-"));
    originalEnv = process.env.GLPI_CONFIG_DIR;
    process.env.GLPI_CONFIG_DIR = dir;
  });

  afterEach(() => {
    process.env.GLPI_CONFIG_DIR = originalEnv;
    rmSync(dir, { recursive: true, force: true });
  });

  return () => dir;
}

const getDir = withTempDir();

describe("config", () => {
  describe("save + load round-trip", () => {
    it("persists and retrieves config values", () => {
      const config: Config = {
        server: "https://glpi.example.com/api.php",
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        accessToken: "access-abc",
        refreshToken: "refresh-xyz",
        expiresAt: Date.now() + 3600_000,
      };

      saveConfig(config);
      const loaded = loadConfig();

      expect(loaded).toEqual(config);
    });

    it("returns null when no config file exists", () => {
      expect(loadConfig()).toBeNull();
    });

    it("overwrites existing config on save", () => {
      const first: Config = {
        server: "https://first.example.com/api.php",
        clientId: "client-1",
        clientSecret: "secret-1",
        accessToken: "token-1",
      };
      const second: Config = {
        server: "https://second.example.com/api.php",
        clientId: "client-2",
        clientSecret: "secret-2",
        accessToken: "token-2",
        refreshToken: "refresh-2",
        expiresAt: Date.now() + 7200_000,
      };

      saveConfig(first);
      saveConfig(second);
      const loaded = loadConfig();

      expect(loaded).toEqual(second);
    });
  });
});
