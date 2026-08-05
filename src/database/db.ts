import * as SQLite from "expo-sqlite";
import { GearKind, SHOP } from "../constants/game";
import { calculatePlayerProgress, CATCH_EXP, PlayerProgress } from "../constants/player";

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

export type CatchHistoryRow = {
  id: number;
  fish_id: string;
  size_cm: number;
  caught_at: string;
  spot_name: string | null;
  habitat: string | null;
  is_personal_best: number;
};

export type AquariumPreference = {
  fish_id: string;
  favorite: number;
  visible: number;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const STG_TEST_POINTS = process.env.EXPO_PUBLIC_APP_ENV === "stg" ? 9999 : 0;

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
        CREATE TABLE IF NOT EXISTS point_spends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT NOT NULL UNIQUE,
          points INTEGER NOT NULL CHECK(points >= 0),
          spent_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS consumable_spends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT NOT NULL,
          points INTEGER NOT NULL CHECK(points >= 0),
          spent_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS bait_inventory (
          item_id TEXT PRIMARY KEY,
          quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
          selected INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS aquarium_preferences (
          fish_id TEXT PRIMARY KEY,
          favorite INTEGER NOT NULL DEFAULT 0,
          visible INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS player_progress (
          id INTEGER PRIMARY KEY CHECK(id=1),
          total_exp INTEGER NOT NULL DEFAULT 0 CHECK(total_exp >= 0),
          updated_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO player_progress(id,total_exp,updated_at) VALUES(1,0,datetime('now'));
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

export async function getWalkPoints() {
  const database = await db();
  const earned = await database.getFirstAsync<{ points: number }>(
    "SELECT COALESCE(CAST(SUM(steps) / 100 AS INTEGER),0) points FROM step_days",
  );
  const spent = await database.getFirstAsync<{ points: number }>(
    `SELECT
      COALESCE((SELECT SUM(points) FROM point_spends),0)
      + COALESCE((SELECT SUM(points) FROM consumable_spends),0) points`,
  );
  return Math.max(0, STG_TEST_POINTS + (earned?.points ?? 0) - (spent?.points ?? 0));
}

export async function getTotalSteps() {
  const row = await (await db()).getFirstAsync<{ steps: number }>(
    "SELECT COALESCE(SUM(steps),0) steps FROM step_days",
  );
  return Math.max(0, row?.steps ?? 0);
}

export async function saveCatch(input: {
  fishId: string;
  size: number;
  rank: string;
  aquarium: string;
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
  const expGained = CATCH_EXP[input.rank as keyof typeof CATCH_EXP] ?? CATCH_EXP.E;
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO catches(
        fish_id,size_cm,rank,aquarium,coins,caught_at,spot_id,spot_name,habitat,steps_at_catch,is_personal_best
      ) VALUES(?,?,?,?,0,?,?,?,?,?,?)`,
      input.fishId, input.size, input.rank, input.aquarium,
      new Date().toISOString(), input.spotId, input.spotName, input.habitat,
      input.steps, isPersonalBest ? 1 : 0,
    );
    await database.runAsync(
      "UPDATE player_progress SET total_exp=total_exp+?,updated_at=? WHERE id=1",
      expGained, new Date().toISOString(),
    );
  });
  const progression = await getPlayerProgress();
  return { isPersonalBest, expGained, progression };
}

export async function getPlayerProgress(): Promise<PlayerProgress> {
  const row = await (await db()).getFirstAsync<{ total_exp: number }>("SELECT total_exp FROM player_progress WHERE id=1");
  return calculatePlayerProgress(row?.total_exp ?? 0);
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

export async function getCatchHistory() {
  return (await db()).getAllAsync<CatchHistoryRow>(`
    SELECT id,fish_id,size_cm,caught_at,spot_name,habitat,is_personal_best
    FROM catches ORDER BY caught_at DESC
  `);
}

export async function getAquariumPreferences() {
  return (await db()).getAllAsync<AquariumPreference>(
    "SELECT fish_id,favorite,visible FROM aquarium_preferences",
  );
}

export async function setAquariumFavorite(fishId: string, favorite: boolean) {
  await (await db()).runAsync(
    `INSERT INTO aquarium_preferences(fish_id,favorite,visible) VALUES(?,?,1)
     ON CONFLICT(fish_id) DO UPDATE SET favorite=excluded.favorite`,
    fishId, favorite ? 1 : 0,
  );
}

export async function setAquariumVisible(fishId: string, visible: boolean) {
  await (await db()).runAsync(
    `INSERT INTO aquarium_preferences(fish_id,favorite,visible) VALUES(?,0,?)
     ON CONFLICT(fish_id) DO UPDATE SET visible=excluded.visible`,
    fishId, visible ? 1 : 0,
  );
}

export async function exportDatabaseBytes() {
  return (await db()).serializeAsync();
}

export async function restoreDatabaseBytes(bytes: Uint8Array) {
  const source = await SQLite.deserializeDatabaseAsync(bytes);
  try {
    await SQLite.backupDatabaseAsync({ sourceDatabase: source, destDatabase: await db() });
  } finally {
    await source.closeAsync();
  }
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
    const earned = await database.getFirstAsync<{ points: number }>(
      "SELECT COALESCE(CAST(SUM(steps) / 100 AS INTEGER),0) points FROM step_days",
    );
    const spent = await database.getFirstAsync<{ points: number }>(
      `SELECT
        COALESCE((SELECT SUM(points) FROM point_spends),0)
        + COALESCE((SELECT SUM(points) FROM consumable_spends),0) points`,
    );
    if (STG_TEST_POINTS + (earned?.points ?? 0) - (spent?.points ?? 0) < cost) return;
    await database.runAsync(
      "INSERT INTO inventory(item_id,equipped,purchased_at) VALUES(?,0,?)",
      itemId,
      new Date().toISOString(),
    );
    await database.runAsync(
      "INSERT INTO point_spends(item_id,points,spent_at) VALUES(?,?,?)",
      itemId,
      cost,
      new Date().toISOString(),
    );
    result = "ok";
  });
  return result;
}

export async function buyOutfitSet(stage: number, cost: number) {
  const safeStage = Math.max(1, Math.min(4, Math.floor(stage)));
  const itemIds = [`hat${safeStage}`, `top${safeStage}`, `bottom${safeStage}`, `shoes${safeStage}`];
  const database = await db();
  let result: "ok" | "owned" | "insufficient" = "insufficient";
  await database.withTransactionAsync(async () => {
    const owned = await database.getAllAsync<{ item_id: string }>(`SELECT item_id FROM inventory WHERE item_id IN (${itemIds.map(() => "?").join(",")})`, ...itemIds);
    if (owned.length === itemIds.length) { result = "owned"; return; }
    const earned = await database.getFirstAsync<{ points: number }>("SELECT COALESCE(CAST(SUM(steps) / 100 AS INTEGER),0) points FROM step_days");
    const spent = await database.getFirstAsync<{ points: number }>(`SELECT COALESCE((SELECT SUM(points) FROM point_spends),0) + COALESCE((SELECT SUM(points) FROM consumable_spends),0) points`);
    if (STG_TEST_POINTS + (earned?.points ?? 0) - (spent?.points ?? 0) < cost) return;
    const now = new Date().toISOString();
    for (const itemId of itemIds) await database.runAsync("INSERT OR IGNORE INTO inventory(item_id,equipped,purchased_at) VALUES(?,0,?)", itemId, now);
    await database.runAsync("INSERT INTO point_spends(item_id,points,spent_at) VALUES(?,?,?)", `outfit${safeStage}`, cost, now);
    result = "ok";
  });
  return result;
}

export async function buyBait(itemId: string, unitCost: number, quantity = 1) {
  const safeQuantity = Math.max(1, Math.min(10, Math.floor(quantity)));
  const cost = unitCost * safeQuantity;
  const database = await db();
  let ok = false;
  await database.withTransactionAsync(async () => {
    const earned = await database.getFirstAsync<{ points: number }>(
      "SELECT COALESCE(CAST(SUM(steps) / 100 AS INTEGER),0) points FROM step_days",
    );
    const spent = await database.getFirstAsync<{ points: number }>(
      `SELECT
        COALESCE((SELECT SUM(points) FROM point_spends),0)
        + COALESCE((SELECT SUM(points) FROM consumable_spends),0) points`,
    );
    if (STG_TEST_POINTS + (earned?.points ?? 0) - (spent?.points ?? 0) < cost) return;
    await database.runAsync(
      "INSERT INTO consumable_spends(item_id,points,spent_at) VALUES(?,?,?)",
      itemId, cost, new Date().toISOString(),
    );
    await database.runAsync(
      `INSERT INTO bait_inventory(item_id,quantity,selected) VALUES(?,?,0)
       ON CONFLICT(item_id) DO UPDATE SET quantity=quantity+excluded.quantity`,
      itemId, safeQuantity,
    );
    const selected = await database.getFirstAsync("SELECT 1 FROM bait_inventory WHERE selected=1 AND quantity>0");
    if (!selected) await database.runAsync("UPDATE bait_inventory SET selected=1 WHERE item_id=?", itemId);
    ok = true;
  });
  return ok;
}

export async function getBaitInventory() {
  return (await db()).getAllAsync<{ item_id: string; quantity: number; selected: number }>(
    "SELECT item_id,quantity,selected FROM bait_inventory",
  );
}

export async function selectBait(itemId: string) {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.runAsync("UPDATE bait_inventory SET selected=0");
    await database.runAsync("UPDATE bait_inventory SET selected=1 WHERE item_id=? AND quantity>0", itemId);
  });
}

export async function getSelectedBait() {
  return (await db()).getFirstAsync<{ item_id: string; quantity: number }>(
    "SELECT item_id,quantity FROM bait_inventory WHERE selected=1 AND quantity>0",
  );
}

export async function consumeSelectedBait() {
  const database = await db();
  let itemId: string | null = null;
  await database.withTransactionAsync(async () => {
    const selected = await database.getFirstAsync<{ item_id: string; quantity: number }>(
      "SELECT item_id,quantity FROM bait_inventory WHERE selected=1 AND quantity>0",
    );
    if (!selected) return;
    itemId = selected.item_id;
    await database.runAsync("UPDATE bait_inventory SET quantity=quantity-1 WHERE item_id=?", selected.item_id);
    if (selected.quantity <= 1) {
      await database.runAsync("UPDATE bait_inventory SET selected=0 WHERE item_id=?", selected.item_id);
      const next = await database.getFirstAsync<{ item_id: string }>(
        "SELECT item_id FROM bait_inventory WHERE quantity>0 ORDER BY item_id LIMIT 1",
      );
      if (next) await database.runAsync("UPDATE bait_inventory SET selected=1 WHERE item_id=?", next.item_id);
    }
  });
  return itemId;
}

export async function getTodayCatchCount(dayPrefix: string) {
  const row = await (await db()).getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) count FROM catches WHERE caught_at LIKE ?",
    `${dayPrefix}%`,
  );
  return row?.count ?? 0;
}

export async function getTodayCatchProgress(dayPrefix: string) {
  const row = await (await db()).getFirstAsync<{ count: number; high_rank_count: number }>(
    `SELECT COUNT(*) count,
      COALESCE(SUM(CASE WHEN rank IN ('B','A','S','SS','SSS') THEN 1 ELSE 0 END),0) high_rank_count
     FROM catches WHERE caught_at LIKE ?`,
    `${dayPrefix}%`,
  );
  return row ?? { count: 0, high_rank_count: 0 };
}

export async function grantBait(itemId: string, quantity = 1) {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO bait_inventory(item_id,quantity,selected) VALUES(?,?,0)
       ON CONFLICT(item_id) DO UPDATE SET quantity=quantity+excluded.quantity`,
      itemId, safeQuantity,
    );
    const selected = await database.getFirstAsync("SELECT 1 FROM bait_inventory WHERE selected=1 AND quantity>0");
    if (!selected) await database.runAsync("UPDATE bait_inventory SET selected=1 WHERE item_id=?", itemId);
  });
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

export async function equipOutfitSet(stage: number) {
  const safeStage = Math.max(1, Math.min(4, Math.floor(stage)));
  const itemIds = [`hat${safeStage}`, `top${safeStage}`, `bottom${safeStage}`, `shoes${safeStage}`];
  const database = await db();
  const owned = await database.getAllAsync<{ item_id: string }>(
    `SELECT item_id FROM inventory WHERE item_id IN (${itemIds.map(() => "?").join(",")})`,
    ...itemIds,
  );
  if (owned.length !== itemIds.length) return false;
  const apparelIds = SHOP.filter((item) => ["hat", "top", "bottom", "shoes"].includes(item.kind)).map((item) => item.id);
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE inventory SET equipped=0 WHERE item_id IN (${apparelIds.map(() => "?").join(",")})`,
      ...apparelIds,
    );
    await database.runAsync(
      `UPDATE inventory SET equipped=1 WHERE item_id IN (${itemIds.map(() => "?").join(",")})`,
      ...itemIds,
    );
  });
  return true;
}

export async function unequipOutfit() {
  const apparelIds = SHOP.filter((item) => ["hat", "top", "bottom", "shoes"].includes(item.kind)).map((item) => item.id);
  await (await db()).runAsync(
    `UPDATE inventory SET equipped=0 WHERE item_id IN (${apparelIds.map(() => "?").join(",")})`,
    ...apparelIds,
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
       steps=excluded.steps,
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
