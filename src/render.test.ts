import { describe, it, expect } from "vitest";
import { getDefaultColumns, ALL_ALIASES, renderList, renderDetail, filterColumns } from "./render.js";

describe("getDefaultColumns", () => {
  it("returns curated columns for computer", () => {
    const cols = getDefaultColumns("computer");
    // GLPI web defaults: status, user, serial, type, model, location, date_mod, user_tech
    // Plus id and name which are always present
    expect(cols).toEqual([
      "id",
      "name",
      "status",
      "user",
      "serial",
      "type",
      "model",
      "location",
      "date_mod",
      "user_tech",
    ]);
  });

  it("returns curated columns for ticket", () => {
    const cols = getDefaultColumns("ticket");
    // GLPI web defaults for Ticket: status, date (opened), urgency, priority, date_mod, entity
    expect(cols).toContain("id");
    expect(cols).toContain("name");
    expect(cols).toContain("status");
    expect(cols).toContain("date");
    expect(cols).toContain("priority");
    expect(cols).toContain("date_mod");
  });

  it("returns fallback columns for uncured alias", () => {
    const cols = getDefaultColumns("cable");
    expect(cols).toEqual(["id", "name", "status", "entity"]);
  });

  it("returns fallback columns for unknown alias", () => {
    const cols = getDefaultColumns("something-unknown");
    expect(cols).toEqual(["id", "name", "status", "entity"]);
  });

  it("all aliases have a column definition", () => {
    // Every alias in the system should at least return something
    for (const alias of Object.keys(ALL_ALIASES)) {
      const cols = getDefaultColumns(alias);
      expect(cols.length).toBeGreaterThan(0);
      expect(cols).toContain("id");
      expect(cols).toContain("name");
    }
  });
});

describe("renderList", () => {
  const items = [
    { id: 1, name: "PC-01", status: { id: 1, name: "Production" }, entity: { id: 0, name: "Root entity" }, serial: "ABC123" },
    { id: 2, name: "Server-02", status: { id: 2, name: "In repair" }, entity: { id: 0, name: "Root entity" }, serial: null },
  ];

  it("renders aligned columns with header", () => {
    const out = renderList(items, ["id", "name", "status", "serial"]);
    const lines = out.split("\n");
    expect(lines[0]).toBe("ID  NAME       STATUS         SERIAL");
    expect(lines[1]).toBe("1   PC-01      1: Production  ABC123");
    expect(lines[2]).toBe("2   Server-02  2: In repair");
  });

  it("renders nested objects as id: name", () => {
    const out = renderList(items, ["id", "status", "entity"]);
    const lines = out.split("\n");
    expect(lines[1]).toContain("1: Production");
    expect(lines[1]).toContain("0: Root entity");
  });

  it("shows empty cell for null values", () => {
    const out = renderList(items, ["id", "name", "serial"]);
    const lines = out.split("\n");
    expect(lines[2]).toMatch(/^2\s+Server-02\s*$/);
  });

  it("omits header with showHeader false", () => {
    const out = renderList(items, ["id", "name"], { showHeader: false });
    const lines = out.split("\n");
    expect(lines[0]).toBe("1  PC-01");
    expect(lines[1]).toBe("2  Server-02");
  });

  it("respects custom columns via --columns", () => {
    const out = renderList(items, ["id", "name", "serial"]);
    const lines = out.split("\n");
    expect(lines[0]).toBe("ID  NAME       SERIAL");
    expect(lines[1]).toBe("1   PC-01      ABC123");
  });

  it("returns empty string for empty array", () => {
    const out = renderList([], ["id", "name"]);
    expect(out).toBe("");
  });

  it("truncates long values to max column width", () => {
    const longItems = [
      { id: 1, name: "A very long computer name that exceeds the limit" },
    ];
    const out = renderList(longItems, ["id", "name"]);
    const lines = out.split("\n");
    // name column should be truncated to 25 chars
    expect(lines[1]).toContain("A very long computer nam…");
    expect(lines[1].split(/\s{2,}/)[1].length).toBeLessThanOrEqual(25);
  });

  it("shortens ISO datetimes to YYYY-MM-DD HH:MM", () => {
    const dateItems = [
      { id: 1, date_mod: "2026-05-20T03:35:13+00:00" },
    ];
    const out = renderList(dateItems, ["id", "date_mod"]);
    expect(out).toContain("2026-05-20 03:35");
    expect(out).not.toContain(":13");
  });
});

describe("renderDetail", () => {
  it("renders single object as key-value pairs", () => {
    const item = { id: 42, name: "PC-01", serial: "ABC123" };
    const out = renderDetail(item);
    const lines = out.split("\n");
    expect(lines).toContain("id:     42");
    expect(lines).toContain("name:   PC-01");
    expect(lines).toContain("serial: ABC123");
  });

  it("renders nested objects as id: name", () => {
    const item = { id: 1, status: { id: 3, name: "Production" } };
    const out = renderDetail(item);
    expect(out).toContain("status: 3: Production");
  });

  it("omits null and undefined values", () => {
    const item = { id: 1, name: "PC-01", serial: null, comment: undefined };
    const out = renderDetail(item);
    expect(out).not.toContain("serial");
    expect(out).not.toContain("comment");
  });

  it("passes through primitive responses as-is", () => {
    expect(renderDetail(42)).toBe("42");
    expect(renderDetail("OK")).toBe("OK");
  });
});

describe("filterColumns", () => {
  it("filters array of objects to requested columns", () => {
    const items = [
      { id: 1, name: "PC-01", serial: "ABC", status: { id: 1, name: "Prod" } },
      { id: 2, name: "SRV-02", serial: "DEF", status: { id: 2, name: "Repair" } },
    ];
    const result = filterColumns(items, ["id", "name"]);
    expect(result).toEqual([
      { id: 1, name: "PC-01" },
      { id: 2, name: "SRV-02" },
    ]);
  });

  it("filters single object to requested columns", () => {
    const item = { id: 1, name: "PC-01", serial: "ABC" };
    const result = filterColumns(item, ["id", "name"]);
    expect(result).toEqual({ id: 1, name: "PC-01" });
  });

  it("returns null for null input", () => {
    expect(filterColumns(null, ["id"])).toBeNull();
  });

  it("passes through primitives unchanged", () => {
    expect(filterColumns(42, ["id"])).toBe(42);
    expect(filterColumns("OK", ["id"])).toBe("OK");
  });
});
