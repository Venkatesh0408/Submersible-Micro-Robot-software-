import fsLib from "fs";
import path from "path";
import pkg from "pg";

const { Pool } = pkg;

// Inspection history store. Uses Neon Postgres when DATABASE_URL is set,
// otherwise falls back to a local JSON file so the app still runs offline.
// The public API (getHistory / saveHistoryItem / deleteHistoryItem) is unchanged.

const DB_PATH = path.join(process.cwd(), "database.json");
const CONNECTION = process.env.DATABASE_URL;

let pool: InstanceType<typeof Pool> | null = null;
let ready: Promise<void> | null = null;

if (CONNECTION) {
    pool = new Pool({
        connectionString: CONNECTION,
        // Neon serves publicly-trusted (Let's Encrypt) certs — verify them.
        ssl: { rejectUnauthorized: true },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
    ready = pool
        .query(`
            CREATE TABLE IF NOT EXISTS analysis_history (
                id TEXT PRIMARY KEY,
                data JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        `)
        .then(() => {
            console.log("[db] Connected to Neon Postgres (analysis_history ready)");
        })
        .catch((e: unknown) => {
            console.error("[db] Postgres init failed, falling back to file store:", (e as Error).message);
            pool = null;
        });
}

// ---- local file fallback ----
function initFile() {
    if (!fsLib.existsSync(DB_PATH)) fsLib.writeFileSync(DB_PATH, "[]");
}
function fileGet(): any[] {
    initFile();
    try {
        return JSON.parse(fsLib.readFileSync(DB_PATH, "utf8"));
    } catch {
        return [];
    }
}
function fileWrite(h: any[]) {
    fsLib.writeFileSync(DB_PATH, JSON.stringify(h, null, 2));
}

export async function getHistory() {
    if (ready) await ready;
    if (pool) {
        try {
            const res = await pool.query("SELECT data FROM analysis_history ORDER BY created_at DESC");
            return res.rows.map((r: any) => r.data);
        } catch (e) {
            console.error("[db] getHistory error:", (e as Error).message);
            return [];
        }
    }
    return fileGet();
}

export async function saveHistoryItem(item: any) {
    if (ready) await ready;
    if (pool) {
        try {
            const id = item?.id != null ? String(item.id) : String(Date.now());
            await pool.query(
                "INSERT INTO analysis_history (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data",
                [id, item]
            );
            return true;
        } catch (e) {
            console.error("[db] saveHistoryItem error:", (e as Error).message);
            return false;
        }
    }
    try {
        const history = fileGet();
        history.unshift(item);
        fileWrite(history);
        return true;
    } catch (e) {
        console.error("Failed to save history item", e);
        return false;
    }
}

export async function deleteHistoryItem(id: string) {
    if (ready) await ready;
    if (pool) {
        try {
            const res = await pool.query("DELETE FROM analysis_history WHERE id = $1", [String(id)]);
            return (res.rowCount ?? 0) > 0;
        } catch (e) {
            console.error("[db] deleteHistoryItem error:", (e as Error).message);
            return false;
        }
    }
    let history = fileGet();
    const initialLength = history.length;
    history = history.filter((item: any) => item.id !== id);
    if (history.length !== initialLength) {
        fileWrite(history);
        return true;
    }
    return false;
}
