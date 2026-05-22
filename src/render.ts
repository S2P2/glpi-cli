/**
 * render.ts — Output rendering for glpi-cli
 *
 * Column map and rendering logic for list/detail views.
 */

// ── Alias map (duplicated from index.ts to avoid circular deps) ───────
export const ALL_ALIASES: Record<string, [string, string]> = {
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
  ticket: ["assistances", "ticket"],
  change: ["assistances", "change"],
  problem: ["assistances", "problem"],
  "recurring-ticket": ["assistances", "recurring-ticket"],
};

// ── Default columns per alias (matching GLPI web UI) ──────────────────
// Based on glpi_displaypreferences seed data from GLPI 11.0.5
const CURATED_COLUMNS: Record<string, string[]> = {
  // Assets — common pattern: entity, manufacturer, serial/type/model, location, date_mod, user
  computer: ["id", "name", "status", "user", "serial", "type", "model", "location", "date_mod", "user_tech"],
  monitor: ["id", "name", "status", "entity", "manufacturer", "location", "type", "model", "date_mod", "user"],
  "network-equipment": ["id", "name", "status", "entity", "manufacturer", "location", "type", "model", "network", "date_mod"],
  printer: ["id", "name", "status", "entity", "manufacturer", "location", "type", "model", "date_mod"],
  phone: ["id", "name", "status", "entity", "manufacturer", "location", "type", "model", "date_mod", "user"],
  peripheral: ["id", "name", "status", "entity", "manufacturer", "location", "type", "model", "date_mod", "user"],
  software: ["id", "name", "entity", "manufacturer", "location", "date_mod"],
  "software-license": ["id", "name", "entity", "manufacturer", "date_mod"],

  // Assistance — status, date, urgency/priority, date_mod
  ticket: ["id", "name", "status", "date", "urgency", "priority", "date_mod", "entity"],
  change: ["id", "name", "status", "date", "urgency", "priority", "date_mod", "entity"],
  problem: ["id", "name", "status", "date", "urgency", "priority", "date_mod", "entity"],
};

const FALLBACK_COLUMNS = ["id", "name", "status", "entity"];

export function getDefaultColumns(alias: string): string[] {
  return CURATED_COLUMNS[alias] ?? FALLBACK_COLUMNS;
}

import stringWidth from "string-width";

// ── Value formatting ──────────────────────────────────────────────────

const MAX_COL_WIDTH = 25;

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && "id" in (val as object) && "name" in (val as object)) {
    const obj = val as { id: unknown; name: unknown };
    return `${obj.id}: ${obj.name}`;
  }
  // Shorten ISO datetimes to YYYY-MM-DD HH:MM
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s)) {
    return s.slice(0, 10) + " " + s.slice(11, 16);
  }
  return s;
}

function padEndVisual(str: string, width: number): string {
  return str + " ".repeat(Math.max(0, width - stringWidth(str)));
}

function truncate(s: string, max: number): string {
  if (stringWidth(s) <= max) return s;
  let truncated = s;
  while (stringWidth(truncated + "…") > max && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

// ── List renderer ─────────────────────────────────────────────────────

export interface ListOptions {
  showHeader?: boolean; // default true
}

export function renderList(
  items: Record<string, unknown>[],
  columns: string[],
  opts: ListOptions = {}
): string {
  if (items.length === 0) return "";

  const showHeader = opts.showHeader !== false;

  // Compute formatted values and column widths
  const rows = items.map((item) =>
    columns.map((col) => formatValue(item[col]))
  );

  // Header labels = uppercase column names
  const headers = columns.map((c) => c.toUpperCase());

  // Compute max width per column
  const widths = columns.map((_, i) => {
    const dataW = Math.max(...rows.map((r) => stringWidth(r[i])));
    if (!showHeader) return dataW;
    const headerW = stringWidth(headers[i]);
    return Math.max(dataW, headerW);
  });

  // Cap column widths
  const cappedWidths = widths.map((w) => Math.min(w, MAX_COL_WIDTH));

  const lines: string[] = [];

  if (showHeader) {
    lines.push(headers.map((h, i) => padEndVisual(truncate(h, cappedWidths[i]), cappedWidths[i])).join("  "));
  }

  for (const row of rows) {
    lines.push(row.map((v, i) => padEndVisual(truncate(v, cappedWidths[i]), cappedWidths[i])).join("  ").trimEnd());
  }

  return lines.join("\n");
}

// ── Detail renderer ───────────────────────────────────────────────────

export function renderDetail(body: unknown): string {
  if (body === null || body === undefined) return "";
  if (typeof body !== "object") return String(body);

  const entries = Object.entries(body as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined);

  if (entries.length === 0) return "";

  // Compute label width
  const maxLabel = Math.max(...entries.map(([k]) => k.length));

  return entries
    .map(([key, val]) => `${(key + ": ").padEnd(maxLabel + 2)}${formatValue(val)}`)
    .join("\n");
}

// ── Column filtering (for --json --columns) ───────────────────────────

export function filterColumns(body: unknown, columns: string[]): unknown {
  if (body === null) return null;
  if (typeof body !== "object") return body;

  if (Array.isArray(body)) {
    return body.map((item) => pickFields(item, columns));
  }

  return pickFields(body as Record<string, unknown>, columns);
}

function pickFields(obj: unknown, columns: string[]): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return {};
  const result: Record<string, unknown> = {};
  for (const col of columns) {
    if (col in (obj as Record<string, unknown>)) {
      result[col] = (obj as Record<string, unknown>)[col];
    }
  }
  return result;
}
