import { db, migrate, closeDb } from "./db.js";
import { seed } from "./seed.js";
import { hashPassword, id, now } from "./security.js";
await migrate();
await seed();
if (process.env.BOOTSTRAP_EMAIL && process.env.BOOTSTRAP_PASSWORD) {
  if (process.env.BOOTSTRAP_PASSWORD.length < 12)
    throw Error("BOOTSTRAP_PASSWORD must be at least 12 characters");
  if (await db.get("SELECT users_id FROM users WHERE role='admin' LIMIT 1"))
    throw Error("An admin already exists; bootstrap disabled");
  await db.run("INSERT INTO users VALUES (?,?,?,?,?,?,?,1,?)", [
    id(),
    "ผู้ดูแลระบบ",
    process.env.BOOTSTRAP_EMAIL.toLowerCase(),
    hashPassword(process.env.BOOTSTRAP_PASSWORD),
    "สำนักงาน",
    "0000000000",
    "admin",
    now(),
  ]);
  console.log(
    "Admin created. Remove BOOTSTRAP_PASSWORD from your environment.",
  );
}
if (!(await db.get("SELECT categories_id FROM categories LIMIT 1")))
  for (const [i, name, type, desc] of [
    [1, "ไฟฟ้าและแสงสว่าง", "issue", "แจ้งไฟดับ"],
    [2, "ถนนและพื้นที่ส่วนกลาง", "issue", "พื้นที่ส่วนกลาง"],
    [3, "เสียงและความปลอดภัย", "issue", "ความปลอดภัย"],
    [4, "สัตว์เลี้ยงหาย", "lost", "สัตว์เลี้ยงหาย"],
    [5, "ของหาย / เก็บของได้", "lost", "ของหาย"],
    [6, "การยืมอุปกรณ์", "equipment", "ยืมอุปกรณ์"],
  ])
    await db.run("INSERT INTO categories VALUES (?,?,?,?)", [
      i,
      name,
      type,
      desc,
    ]);
console.log("Database initialized.");
await closeDb();
