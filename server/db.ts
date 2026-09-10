import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertSong, InsertUser, Song, songs, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listSongs(): Promise<Song[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(songs).orderBy(desc(songs.updatedAt));
}

export async function getSongById(id: number): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(songs).where(eq(songs.id, id)).limit(1);
  return result[0];
}

export async function createSong(input: InsertSong): Promise<Song> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(songs).values(input);
  const created = await getSongById(Number(result[0].insertId));
  if (!created) throw new Error("Song was created but could not be read");
  return created;
}

export async function updateSong(id: number, input: Partial<InsertSong>): Promise<Song> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(songs).set({ ...input, updatedAt: new Date() }).where(eq(songs.id, id));
  const updated = await getSongById(id);
  if (!updated) throw new Error("Song was not found");
  return updated;
}

export async function deleteSong(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(songs).where(eq(songs.id, id));
}

export async function seedSongs(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: songs.id }).from(songs).limit(1);
  if (existing.length > 0) return;
  await db.insert(songs).values([
    { title: "은혜", category: "CCM", tone: "G", slideCount: 4, color: "rose" },
    { title: "축복하노라", category: "CCM", tone: "D", slideCount: 3, color: "sage" },
    { title: "주의 약속하신 말씀 위에서", category: "찬송가", tone: "A", slideCount: 4, color: "blue" },
    { title: "거룩하신 하나님", category: "CCM", tone: "E", slideCount: 2, color: "violet" },
  ]);
}
