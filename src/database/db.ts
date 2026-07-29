import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function db() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("fishing_walk.db").then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS catches (
          id INTEGER PRIMARY KEY AUTOINCREMENT, fish_id TEXT NOT NULL, size_cm REAL NOT NULL,
          rank TEXT NOT NULL, aquarium TEXT NOT NULL, coins INTEGER NOT NULL, caught_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS inventory (
          item_id TEXT PRIMARY KEY, equipped INTEGER NOT NULL DEFAULT 0, purchased_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS wallet (id INTEGER PRIMARY KEY CHECK(id=1), coins INTEGER NOT NULL);
        INSERT OR IGNORE INTO wallet(id, coins) VALUES(1, 200);
        CREATE TABLE IF NOT EXISTS step_days (day TEXT PRIMARY KEY, steps INTEGER NOT NULL, updated_at TEXT NOT NULL);
      `);
      return database;
    });
  }
  return dbPromise;
}

export async function getCoins() {
  const row = await (await db()).getFirstAsync<{coins:number}>("SELECT coins FROM wallet WHERE id=1");
  return row?.coins ?? 0;
}

export async function saveCatch(fishId:string,size:number,rank:string,aquarium:string,coins:number) {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.runAsync("INSERT INTO catches(fish_id,size_cm,rank,aquarium,coins,caught_at) VALUES(?,?,?,?,?,?)",fishId,size,rank,aquarium,coins,new Date().toISOString());
    await database.runAsync("UPDATE wallet SET coins=coins+? WHERE id=1",coins);
  });
}

export async function buyItem(itemId:string,cost:number) {
  const database = await db();
  let ok = false;
  await database.withTransactionAsync(async () => {
    const owned = await database.getFirstAsync("SELECT 1 FROM inventory WHERE item_id=?",itemId);
    const wallet = await database.getFirstAsync<{coins:number}>("SELECT coins FROM wallet WHERE id=1");
    if (!owned && (wallet?.coins ?? 0) >= cost) {
      await database.runAsync("UPDATE wallet SET coins=coins-? WHERE id=1",cost);
      await database.runAsync("INSERT INTO inventory(item_id,equipped,purchased_at) VALUES(?,0,?)",itemId,new Date().toISOString());
      ok = true;
    }
  });
  return ok;
}

export async function equipItem(itemId:string,kind:string,kindIds:string[]) {
  const database = await db();
  await database.withTransactionAsync(async () => {
    if (kindIds.length) await database.runAsync(`UPDATE inventory SET equipped=0 WHERE item_id IN (${kindIds.map(()=>"?").join(",")})`,...kindIds);
    await database.runAsync("UPDATE inventory SET equipped=1 WHERE item_id=?",itemId);
  });
}

export async function getGearBonus() {
  const ids = await (await db()).getAllAsync<{item_id:string}>("SELECT item_id FROM inventory WHERE equipped=1");
  return ids.map(x=>x.item_id);
}

export async function saveSteps(day:string,steps:number) {
  await (await db()).runAsync("INSERT INTO step_days(day,steps,updated_at) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET steps=excluded.steps,updated_at=excluded.updated_at",day,steps,new Date().toISOString());
}
