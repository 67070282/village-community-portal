import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..");
export const client = process.env.DB_CLIENT || "mysql";
export const dataDir = process.env.DATA_DIR || path.join(root, "data");
mkdirSync(dataDir, { recursive: true });
let pool, sqlite;
if (client === "mysql") {
  const mysql = await import("mysql2/promise");
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || "village_portal",
    connectionLimit: 10,
    timezone: "Z",
    dateStrings: true,
    multipleStatements: false,
    ...(process.env.MYSQL_SSL === "true"
      ? { ssl: { rejectUnauthorized: true } }
      : {}),
  });
} else if (client === "sqlite") {
  sqlite = new DatabaseSync(path.join(dataDir, "village.sqlite"));
  sqlite.exec(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
  );
} else throw new Error("DB_CLIENT must be sqlite or mysql");

function adapter(connection) {
  const paramsForMysql = (params) =>
    params.map((v) =>
      typeof v === "string" &&
      /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)
        ? v.replace("T", " ").replace("Z", "")
        : v,
    );
  const normalize = (row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k,
        ["created_at", "updated_at", "returned_at", "starts_at"].includes(k) &&
        typeof v === "string" &&
        /^\d{4}-\d\d-\d\d /.test(v)
          ? v.replace(" ", "T") + "Z"
          : v,
      ]),
    );
  return {
    async all(sql, params = []) {
      return client === "mysql"
        ? (await connection.execute(sql, paramsForMysql(params)))[0].map(
            normalize,
          )
        : connection.prepare(sql).all(...params);
    },
    async get(sql, params = []) {
      return (await this.all(sql, params))[0];
    },
    async run(sql, params = []) {
      if (client === "mysql") {
        const [r] = await connection.execute(sql, paramsForMysql(params));
        return { changes: r.affectedRows };
      }
      return connection.prepare(sql).run(...params);
    },
  };
}
export const db = adapter(pool || sqlite);
// Serialize SQLite operations across asynchronous transaction boundaries. MySQL uses row locks.
let queue = Promise.resolve();
export async function exclusive(fn) {
  if (client === "mysql") return fn();
  const previous = queue;
  let release;
  queue = new Promise((r) => (release = r));
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}
export async function transaction(fn) {
  if (client === "mysql") {
    const c = await pool.getConnection();
    try {
      await c.beginTransaction();
      const result = await fn(adapter(c));
      await c.commit();
      return result;
    } catch (e) {
      await c.rollback();
      throw e;
    } finally {
      c.release();
    }
  }
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    const result = await fn(db);
    sqlite.exec("COMMIT");
    return result;
  } catch (e) {
    sqlite.exec("ROLLBACK");
    throw e;
  }
}
export const lock = client === "mysql" ? " FOR UPDATE" : "";
export async function closeDb() {
  if (pool) await pool.end();
  else sqlite.close();
}

export const tables = [
  `users (users_id VARCHAR(36) PRIMARY KEY, full_name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, house_number VARCHAR(20) NOT NULL, phone VARCHAR(15) NOT NULL, role VARCHAR(16) NOT NULL DEFAULT 'resident', active INTEGER NOT NULL DEFAULT 1, created_at VARCHAR(30) NOT NULL)`,
  `categories (categories_id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL, type VARCHAR(20) NOT NULL, description TEXT NOT NULL)`,
  `community_posts (community_posts_id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, categories_id INTEGER NOT NULL, title VARCHAR(150) NOT NULL, description TEXT NOT NULL, location_note VARCHAR(255) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', priority VARCHAR(10) NOT NULL DEFAULT 'normal', metadata JSON, created_at VARCHAR(30) NOT NULL, updated_at VARCHAR(30) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id), FOREIGN KEY(categories_id) REFERENCES categories(categories_id))`,
  `comments (id VARCHAR(36) PRIMARY KEY, post_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, body TEXT NOT NULL, created_at VARCHAR(30) NOT NULL, FOREIGN KEY(post_id) REFERENCES community_posts(community_posts_id) ON DELETE CASCADE, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `post_history (id VARCHAR(36) PRIMARY KEY, post_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, status VARCHAR(20) NOT NULL, note TEXT NOT NULL, created_at VARCHAR(30) NOT NULL, FOREIGN KEY(post_id) REFERENCES community_posts(community_posts_id) ON DELETE CASCADE, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `equipment (id VARCHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT NOT NULL, total INTEGER NOT NULL, available INTEGER NOT NULL, icon VARCHAR(30) NOT NULL, active INTEGER NOT NULL DEFAULT 1)`,
  `loans (id VARCHAR(36) PRIMARY KEY, equipment_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, quantity INTEGER NOT NULL, due_date VARCHAR(10) NOT NULL, purpose VARCHAR(255) NOT NULL, status VARCHAR(16) NOT NULL, returned_at VARCHAR(30), created_at VARCHAR(30) NOT NULL, FOREIGN KEY(equipment_id) REFERENCES equipment(id), FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `announcements (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, title VARCHAR(150) NOT NULL, body TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0, created_at VARCHAR(30) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `events (id VARCHAR(36) PRIMARY KEY, title VARCHAR(150) NOT NULL, description TEXT NOT NULL, location VARCHAR(150) NOT NULL, starts_at VARCHAR(30) NOT NULL, capacity INTEGER NOT NULL, users_id VARCHAR(36) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `event_attendees (event_id VARCHAR(36) NOT NULL, users_id VARCHAR(36) NOT NULL, created_at VARCHAR(30) NOT NULL, PRIMARY KEY(event_id,users_id), FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `notifications (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, title VARCHAR(150) NOT NULL, body TEXT NOT NULL, link VARCHAR(100) NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at VARCHAR(30) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `sessions (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36) NOT NULL, expires_at BIGINT NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
  `audit_logs (id VARCHAR(36) PRIMARY KEY, users_id VARCHAR(36), action VARCHAR(100) NOT NULL, resource_id VARCHAR(36), created_at VARCHAR(30) NOT NULL, FOREIGN KEY(users_id) REFERENCES users(users_id))`,
];
export function tableSql(table, dialect = client) {
  let definition = table;
  if (dialect === "mysql") {
    if (definition.startsWith("categories "))
      definition = definition.replace(
        "categories_id INTEGER PRIMARY KEY",
        "categories_id INTEGER PRIMARY KEY AUTO_INCREMENT",
      );
    definition = definition
      .replace(
        /(created_at|updated_at|returned_at|starts_at) VARCHAR\(30\)/g,
        "$1 DATETIME(3)",
      )
      .replace("due_date VARCHAR(10)", "due_date DATE")
      .replace("role VARCHAR(16)", "role ENUM('resident','juristic','admin')");
    if (definition.startsWith("categories "))
      definition = definition.replace(
        "type VARCHAR(20)",
        "type ENUM('issue','lost','equipment')",
      );
    if (
      definition.startsWith("community_posts ") ||
      definition.startsWith("post_history ")
    )
      definition = definition.replace(
        "status VARCHAR(20)",
        "status ENUM('pending','in_progress','resolved')",
      );
    if (definition.startsWith("loans "))
      definition = definition.replace(
        "status VARCHAR(16)",
        "status ENUM('borrowed','returned')",
      );
  }
  return `CREATE TABLE IF NOT EXISTS ${definition}${dialect === "mysql" ? " ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci" : ""}`;
}
export async function migrate() {
  for (const table of tables) await db.run(tableSql(table));
  // Portable index creation, including MySQL which has no CREATE INDEX IF NOT EXISTS.
  for (const [name, table, columns] of [
    ["idx_posts_created", "community_posts", "created_at"],
    ["idx_posts_filter", "community_posts", "categories_id,status"],
    ["idx_loans_owner", "loans", "users_id,status"],
    ["idx_notifications_owner", "notifications", "users_id,is_read"],
    ["idx_history_post", "post_history", "post_id,created_at"],
  ]) {
    if (client === "mysql") {
      const found = await db.get(
        "SELECT INDEX_NAME FROM information_schema.statistics WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?",
        [table, name],
      );
      if (found) continue;
    }
    await db.run(
      `CREATE INDEX ${client === "sqlite" ? "IF NOT EXISTS " : ""}${name} ON ${table}(${columns})`,
    );
  }
}
