import * as SQLite from "expo-sqlite";
import { GearKind, SHOP } from "../constants/game";

export type CatchSummary = {
  fish_id: string;
  count: number;
  max_size: number;
  aquarium: string;
  rank: string;
  last_caught_at: string;
};

export type InventoryRow = {
  item_id: string;
  equipped: number;
  purchased_at: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function db() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("fishing_walk.db").then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS catches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fish_id TEXT NOT NULL,
          size_cm REAL NOT NULL,
          rank TEXT NOT NULL,
          aquarium TEXT NOT NULL,
          coins INTEGER NOT NULL,
          caught_at TEXT NOT NULL,
          spot_id TEXT,
          spot_name TEXT,
          habitat TEXT,
          steps_at_catch INTEGER NOT NULL DEFAULT 0,
          is_personal_best INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS catches_fish_id_index ON catches(fish_id);
        CREATE INDEX IF NOT EXISTS catches_caught_at_index ON catches(caught_at);
        CREATE TABLE IF NOT EXISTS inventory (
          item_id TEXT PRIMARY KEY,
          equipped INTEGER NOT NULL DEFAULT 0,
          purchased_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS wallet (
          id INTEGER PRIMARY KEY CHECK(id=1),
          coins INTEGER NOT NULL CHECK(coins >= 0)
        );
        INSERT OR IGNORE INTO wallet(id, coins) VALUES(1, 200);
        CREATE TABLE IF NOT EXISTS step_days (
          day TEXT PRIMARY KEY,
          steps INTEGER NOT NULL CHECK(steps >= 0),
          source TEXT NOT NULL DEFAULT 'pedometer',
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO schema_migrations(version) VALUES(2);
      `);
      await ensureCatchColumns(database);
      return database;
    });
  }
  return dbPromise;
}

async function ensureCatchColumns(database: SQLite.SQLiteDatabase) {
  const columns = await database.getAllAsync<{ name: string }>("PRAGMA table_info(catches)");
  const names = new Set(columns.map((column) => column.name));
  const additions = [
    ["spot_id", "TEXT"],
    ["spot_name", "TEXT"],
    ["habitat", "TEXT"],
    ["steps_at_catch", "INTEGER NOT NULL DEFAULT 0"],
    ["is_personal_best", "INTEGER NOT NULL DEFAULT 0"],
  ] as const;
  for (const [name, definition] of additions) {
    if (!names.has(name)) await database.execAsync(`ALTER TABLE catches ADD COLUMN ${name} ${definition}`);
  }
}

export async function getCoins() {
  const row = await (await db()).getFirstAsync<{ coins: number }>("SELECT coins FROM wallet WHERE id=1");
  return row?.coins ?? 0;
}

export async function saveCatch(input: {
  fishId: string;
  size: number;
  rank: string;
  aquarium: string;
  coins: number;
  spotId: string;
  spotName: string;
  habitat: string;
  steps: number;
}) {
  const database = await db();
  const previous = await database.getFirstAsync<{ max_size: number }>(
    "SELECT MAX(size_cm) max_size FROM catches WHERE fish_id=?",
    input.fishId,
  );
  const isPersonalBest = input.size > (previous?.max_size ?? 0);
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO catches(
        fish_id,size_cm,rank,aquarium,coins,caught_at,spot_id,spot_name,habitat,steps_at_catch,is_personal_best
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      input.fishId, input.size, input.rank, input.aquarium, input.coins,
      new Date().toISOString(), input.spotId, input.spotName, input.habitat,
      input.steps, isPersonalBest ? 1 : 0,
    );
    await database.runAsync("UPDATE wallet SET coins=coins+? WHERE id=1", input.coins);
  });
  return isPersonalBest;
}

export async function getCatchSummaries() {
  return (await db()).getAllAsync<CatchSummary>(`
    SELECT fish_id, COUNT(*) count, MAX(size_cm) max_size, aquarium, rank,
           MAX(caught_at) last_caught_at
    FROM catches
    GROUP BY fish_id, aquarium, rank
    ORDER BY last_caught_at DESC
  `);
}

export async function getCatchStats() {
  const database = await db();
  const totals = await database.getFirstAsync<{ count: number; unique_count: number; largest: number }>(`
    SELECT COUNT(*) count, COUNT(DISTINCT fish_id) unique_count, COALESCE(MAX(size_cm),0) largest FROM catches
  `);
  return totals ?? { count: 0, unique_count: 0, largest: 0 };
}

export async function buyItem(itemId: string, cost: number) {
  const database = await db();
  let result: "ok" | "owned" | "insufficient" = "insufficient";
  await database.withTransactionAsync(async () => {
    const owned = await database.getFirstAsync("SELECT 1 FROM inventory WHERE item_id=?", itemId);
    if (owned) {
      result = "owned";
      return;
    }
    const wallet = await database.getFirstAsync<{ coins: number }>("SELECT coins FROM wallet WHERE id=1");
    if ((wallet?.coins ?? 0) < cost) return;
    await database.runAsync("UPDATE wallet SET coins=coins-? WHERE id=1", cost);
    await database.runAsync(
      "INSERT INTO inventory(item_id,equipped,purchased_at) VALUES(?,0,?)",
      itemId,
      new Date().toISOString(),
    );
    result = "ok";
  });
  return result;
}

export async function equipItem(itemId: string, kind: GearKind) {
  const kindIds = SHOP.filter((item) => item.kind === kind).map((item) => item.id);
  const database = await db();
  await database.withTransactionAsync(async () => {
    if (kindIds.length) {
      await database.runAsync(
        `UPDATE inventory SET equipped=0 WHERE item_id IN (${kindIds.map(() => "?").join(",")})`,
        ...kindIds,
      );
    }
    await database.runAsync("UPDATE inventory SET equipped=1 WHERE item_id=?", itemId);
  });
}

export async function unequipKind(kind: GearKind) {
  const kindIds = SHOP.filter((item) => item.kind === kind).map((item) => item.id);
  if (!kindIds.length) return;
  await (await db()).runAsync(
    `UPDATE inventory SET equipped=0 WHERE item_id IN (${kindIds.map(() => "?").join(",")})`,
    ...kindIds,
  );
}

export async function getInventory() {
  return (await db()).getAllAsync<InventoryRow>("SELECT item_id,equipped,purchased_at FROM inventory");
}

export async function getEquippedItems() {
  const inventory = await (await db()).getAllAsync<{ item_id: string }>(
    "SELECT item_id FROM inventory WHERE equipped=1",
  );
  return SHOP.filter((item) => inventory.some((row) => row.item_id === item.id));
}

export async function saveSteps(day: string, steps: number, source = "pedometer") {
  await (await db()).runAsync(
    `INSERT INTO step_days(day,steps,source,updated_at) VALUES(?,?,?,?)
     ON CONFLICT(day) DO UPDATE SET
       steps=MAX(step_days.steps,excluded.steps),
       source=excluded.source,
       updated_at=excluded.updated_at`,
    day,
    Math.max(0, Math.floor(steps)),
    source,
    new Date().toISOString(),
  );
}

export async function getStepsForMonth(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return (await db()).getAllAsync<{ day: string; steps: number }>(
    "SELECT day,steps FROM step_days WHERE day LIKE ? ORDER BY day",
    `${prefix}%`,
  );
}

export async function getTodaySteps(day: string) {
  const row = await (await db()).getFirstAsync<{ steps: number }>(
    "SELECT steps FROM step_days WHERE day=?",
    day,
  );
  return row?.steps ?? 0;
}

export async function setState(key: string, value: unknown) {
  await (await db()).runAsync(
    `INSERT INTO app_state(key,value,updated_at) VALUES(?,?,?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`,
    key,
    JSON.stringify(value),
    new Date().toISOString(),
  );
}

export async function getState<T>(key: string) {
  const row = await (await db()).getFirstAsync<{ value: string }>(
    "SELECT value FROM app_state WHERE key=?",
    key,
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}
