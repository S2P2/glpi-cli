#!/usr/bin/env node

/**
 * Compile glpi-cli into a standalone binary using Bun.
 * Usage: node scripts/compile.js
 * Requires: bun
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Ensure dist is built
if (!existsSync(resolve(root, "dist", "index.js"))) {
  console.log("Building dist first...");
  execSync("npx tsc", { cwd: root, stdio: "inherit" });
}

// Compile with Bun
const targets = [
  { target: "bun-windows-x64", ext: ".exe" },
  { target: "bun-linux-x64", ext: "" },
  { target: "bun-darwin-arm64", ext: "" },
];

for (const { target, ext } of targets) {
  const outfile = resolve(root, "dist", "bin", `glpi-${target}${ext}`);
  console.log(`Compiling for ${target}...`);
  try {
    execSync(
      `bun build --compile --target=${target} --outfile="${outfile}" "${resolve(root, "dist", "index.js")}"`,
      { cwd: root, stdio: "inherit" }
    );
    console.log(`  → ${outfile}`);
  } catch {
    console.log(`  ⚠ Skipped ${target} (may not be supported on this platform)`);
  }
}

console.log("\nDone. Binaries are in dist/bin/");
