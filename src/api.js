import { db, transaction, lock, client } from "./db.js";
import {
  id,
  now,
  text,
  integer,
  fail,
  safeUser,
  hashPassword,
  verifyPassword,
  issue,
  cookie,
  authenticate,
  staff,
  requireStaff,
  owner,
} from "./security.js";

export const routes = [];
const route = (method, path, summary, access, fn, body = null) =>
  routes.push({
    method,
    path,
    summary,
    access,
    fn,
    body,
    regex: new RegExp(
      "^" + path.replace(/:([a-z_]+)/g, "(?<$1>[^/]+)") + "/?$",
    ),
  });
const get = (path, s, a, f) => route("GET", path, s, a, f);
const post = (path, s, a, f, b) => route("POST", path, s, a, f, b);
const patch = (path, s, a, f, b) => route("PATCH", path, s, a, f, b);
const del = (path, s, a, f) => route("DELETE", path, s, a, f);
const must = async (sql, args = []) => {
  const r = await db.get(sql, args);
  if (!r) fail(404, "ไม่พบรายการ", "NOT_FOUND");
  return r;
};
const audit = async (u, action, resource) =>
  db.run("INSERT INTO audit_logs VALUES (?,?,?,?,?)", [
    id(),
    u?.users_id || null,
    action,
    resource || null,
    now(),
  ]);
const notify = async (uid, title, body, link) =>
  db.run("INSERT INTO notifications VALUES (?,?,?,?,?,0,?)", [
    id(),
    uid,
    title,
    body,
    link,
    now(),
  ]);
const page = (q) => ({
  limit: Math.min(100, Math.max(1, Math.floor(Number(q.get("limit"))) || 12)),
  offset: Math.min(
    1000000,
    Math.max(0, Math.floor(Number(q.get("offset"))) || 0),
  ),
});
const validStatus = (s) => {
  if (!["pending", "in_progress", "resolved"].includes(s))
    fail(422, "สถานะไม่ถูกต้อง");
  return s;
};
const joinedPost = `SELECT p.*,c.name AS category_name,c.type AS category_type,u.full_name AS author_name,u.house_number,(SELECT COUNT(*) FROM comments WHERE post_id=p.community_posts_id) AS comment_count FROM community_posts p JOIN categories c ON c.categories_id=p.categories_id JOIN users u ON u.users_id=p.users_id`;
const loanSql = `SELECT l.*,e.name AS equipment_name,u.full_name AS borrower_name,u.house_number FROM loans l JOIN equipment e ON e.id=l.equipment_id JOIN users u ON u.users_id=l.users_id`;
const credentials = (b) => {
  const email = text(b.email, "อีเมล", 5, 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail(422, "รูปแบบอีเมลไม่ถูกต้อง");
  return email;
};
function password(b) {
  return text(b.password, "รหัสผ่าน", 10, 128);
}
const phone = (b) => {
  const p = text(b.phone, "เบอร์โทร", 9, 15);
  if (!/^\+?[0-9-]{9,15}$/.test(p)) fail(422, "รูปแบบเบอร์โทรไม่ถูกต้อง");
  return p;
};
const dateOnly = (v) => {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    Number.isNaN(Date.parse(v)) ||
    new Date(v).toISOString().slice(0, 10) !== v
  )
    fail(422, "วันที่ไม่ถูกต้อง");
  return v;
};

get("/health", "ตรวจสอบสถานะระบบ", "public", async () => ({
  status: "ok",
  database: client,
  version: "1.0.0",
  demo:
    process.env.SEED_DEMO !== "false" && process.env.NODE_ENV !== "production",
}));
post(
  "/auth/register",
  "สมัครสมาชิก (บทบาทลูกบ้านเท่านั้น)",
  "public",
  async ({ b, res }) => {
    const email = credentials(b),
      name = text(b.full_name, "ชื่อ", 2, 100),
      house = text(b.house_number, "บ้านเลขที่", 1, 20),
      p = phone(b),
      hash = hashPassword(password(b));
    if (await db.get("SELECT users_id FROM users WHERE email=?", [email]))
      fail(409, "อีเมลนี้ถูกใช้งานแล้ว", "CONFLICT");
    const uid = id();
    await db.run("INSERT INTO users VALUES (?,?,?,?,?,?,?,1,?)", [
      uid,
      name,
      email,
      hash,
      house,
      p,
      "resident",
      now(),
    ]);
    const user = await must("SELECT * FROM users WHERE users_id=?", [uid]);
    const token = await issue(user);
    res.setHeader("Set-Cookie", cookie(token));
    await audit(user, "auth.register", uid);
    res.statusCode = 201;
    return { user: safeUser(user), token };
  },
  {
    email: "user@example.com",
    password: "MyPassword@123",
    full_name: "ชื่อ นามสกุล",
    house_number: "88/99",
    phone: "0812345678",
  },
);
const attempts = new Map();
post(
  "/auth/login",
  "เข้าสู่ระบบ รับ JWT และ HttpOnly cookie",
  "public",
  async ({ b, req, res }) => {
    const key = req.socket.remoteAddress,
      current = attempts.get(key);
    if (current && current.until > Date.now() && current.count >= 15)
      fail(429, "ลองเข้าสู่ระบบหลายครั้ง กรุณารอ 15 นาที", "RATE_LIMITED");
    const email = credentials(b);
    text(b.password, "รหัสผ่าน", 1, 128);
    const u = await db.get("SELECT * FROM users WHERE email=? AND active=1", [
      email,
    ]);
    if (!u || !verifyPassword(b.password, u.password_hash)) {
      if (!current || current.until < Date.now())
        attempts.set(key, { count: 1, until: Date.now() + 900000 });
      else current.count++;
      fail(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง", "UNAUTHORIZED");
    }
    attempts.delete(key);
    const token = await issue(u);
    res.setHeader("Set-Cookie", cookie(token));
    await audit(u, "auth.login", u.users_id);
    return { user: safeUser(u), token };
  },
  { email: "resident@village.demo", password: "Village@123" },
);
post(
  "/auth/logout",
  "ออกจากระบบและเพิกถอน JWT",
  "resident",
  async ({ req, res }) => {
    await db.run("DELETE FROM sessions WHERE id=?", [req.sessionId]);
    res.setHeader("Set-Cookie", cookie(""));
    return { message: "ออกจากระบบแล้ว" };
  },
);
get("/auth/me", "ข้อมูลผู้ใช้ปัจจุบัน", "resident", async ({ u }) =>
  safeUser(u),
);
patch(
  "/auth/me",
  "แก้ไขข้อมูลส่วนตัว",
  "resident",
  async ({ u, b }) => {
    const name = text(b.full_name, "ชื่อ", 2, 100),
      p = phone(b);
    await db.run("UPDATE users SET full_name=?,phone=? WHERE users_id=?", [
      name,
      p,
      u.users_id,
    ]);
    return safeUser(
      await must("SELECT * FROM users WHERE users_id=?", [u.users_id]),
    );
  },
  { full_name: "ชื่อ นามสกุล", phone: "0812345678" },
);
patch(
  "/auth/password",
  "เปลี่ยนรหัสผ่านและเพิกถอนเซสชันทั้งหมด",
  "resident",
  async ({ u, b, res }) => {
    text(b.current_password, "รหัสผ่านเดิม", 1, 128);
    if (!verifyPassword(b.current_password, u.password_hash))
      fail(403, "รหัสผ่านเดิมไม่ถูกต้อง");
    const hash = hashPassword(password(b));
    await transaction(async (tx) => {
      await tx.run("UPDATE users SET password_hash=? WHERE users_id=?", [
        hash,
        u.users_id,
      ]);
      await tx.run("DELETE FROM sessions WHERE users_id=?", [u.users_id]);
    });
    res.setHeader("Set-Cookie", cookie(""));
    await audit(u, "auth.password", u.users_id);
    return { message: "เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่" };
  },
  { current_password: "Village@123", password: "NewPassword@123" },
);

get("/categories", "รายการหมวดหมู่", "resident", async () =>
  db.all("SELECT * FROM categories ORDER BY categories_id"),
);
post(
  "/categories",
  "เพิ่มหมวดหมู่",
  "admin",
  async ({ u, b, res }) => {
    const name = text(b.name, "ชื่อ", 1, 50),
      description = text(b.description, "รายละเอียด", 1, 1000);
    if (!["issue", "lost", "equipment"].includes(b.type))
      fail(422, "ประเภทหมวดหมู่ไม่ถูกต้อง");
    const cid = await transaction(async (tx) => {
      await tx.run(
        "INSERT INTO categories (name,type,description) VALUES (?,?,?)",
        [name, b.type, description],
      );
      const row = await tx.get(
        client === "mysql"
          ? "SELECT LAST_INSERT_ID() AS n"
          : "SELECT last_insert_rowid() AS n",
      );
      return Number(row.n);
    });
    res.statusCode = 201;
    await audit(u, "category.create", String(cid));
    return must("SELECT * FROM categories WHERE categories_id=?", [cid]);
  },
  { name: "อื่น ๆ", description: "เรื่องทั่วไปในชุมชน", type: "issue" },
);
patch(
  "/categories/:id",
  "แก้ไขหมวดหมู่",
  "admin",
  async ({ p, b }) => {
    await must("SELECT * FROM categories WHERE categories_id=?", [p.id]);
    await db.run(
      "UPDATE categories SET name=?,description=? WHERE categories_id=?",
      [
        text(b.name, "ชื่อ", 1, 50),
        text(b.description, "รายละเอียด", 1, 1000),
        p.id,
      ],
    );
    return must("SELECT * FROM categories WHERE categories_id=?", [p.id]);
  },
  { name: "ชื่อหมวดหมู่", description: "รายละเอียด" },
);
del("/categories/:id", "ลบหมวดหมู่ที่ยังไม่ถูกใช้", "admin", async ({ p }) => {
  await must("SELECT * FROM categories WHERE categories_id=?", [p.id]);
  if (
    await db.get(
      "SELECT community_posts_id FROM community_posts WHERE categories_id=? LIMIT 1",
      [p.id],
    )
  )
    fail(409, "หมวดหมู่นี้มีรายการใช้งานอยู่");
  await db.run("DELETE FROM categories WHERE categories_id=?", [p.id]);
});

get(
  "/posts",
  "รายการโพสต์ ค้นหา/กรอง/แบ่งหน้า",
  "resident",
  async ({ q, u }) => {
    const filters = [],
      args = [];
    for (const [key, col] of [
      ["status", "p.status"],
      ["category", "p.categories_id"],
      ["type", "c.type"],
    ])
      if (q.get(key)) {
        filters.push(`${col}=?`);
        args.push(q.get(key));
      }
    if (q.get("mine") === "true") {
      filters.push("p.users_id=?");
      args.push(u.users_id);
    }
    if (q.get("q")) {
      filters.push(
        "(p.title LIKE ? OR p.description LIKE ? OR p.location_note LIKE ?)",
      );
      for (let i = 0; i < 3; i++)
        args.push("%" + q.get("q").slice(0, 150) + "%");
    }
    const where = filters.length ? " WHERE " + filters.join(" AND ") : "",
      { limit, offset } = page(q);
    const count = await db.get(
      "SELECT COUNT(*) AS total FROM community_posts p JOIN categories c ON c.categories_id=p.categories_id" +
        where,
      args,
    );
    return {
      items: await db.all(
        joinedPost +
          where +
          ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        args,
      ),
      total: Number(count.total),
      limit,
      offset,
    };
  },
);
get("/posts/:id", "รายละเอียดโพสต์", "resident", async ({ p }) =>
  must(joinedPost + " WHERE p.community_posts_id=?", [p.id]),
);
post(
  "/posts",
  "แจ้งปัญหาหรือประกาศของหาย",
  "resident",
  async ({ u, b, res }) => {
    const title = text(b.title, "หัวข้อ", 3, 150),
      desc = text(b.description, "รายละเอียด", 5, 5000),
      location = text(b.location_note, "สถานที่", 1, 255),
      cat = integer(b.categories_id, "หมวดหมู่");
    const category = await must(
      "SELECT * FROM categories WHERE categories_id=?",
      [cat],
    );
    if (category.type === "equipment")
      fail(422, "กรุณายืมอุปกรณ์ผ่านเมนูยืม–คืน");
    const priority = b.priority || "normal";
    if (!["normal", "high"].includes(priority))
      fail(422, "ความเร่งด่วนไม่ถูกต้อง");
    const pid = id();
    await transaction(async (tx) => {
      await tx.run(
        "INSERT INTO community_posts VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          pid,
          u.users_id,
          cat,
          title,
          desc,
          location,
          "pending",
          priority,
          JSON.stringify({}),
          now(),
          now(),
        ],
      );
      await tx.run("INSERT INTO post_history VALUES (?,?,?,?,?,?)", [
        id(),
        pid,
        u.users_id,
        "pending",
        "ส่งเรื่องเข้าสู่ระบบ",
        now(),
      ]);
    });
    await audit(u, "post.create", pid);
    res.statusCode = 201;
    return must(joinedPost + " WHERE p.community_posts_id=?", [pid]);
  },
  {
    title: "ไฟทางชำรุด",
    description: "ไฟทางไม่ติดบริเวณทางเข้าสวน",
    location_note: "สวนส่วนกลาง",
    categories_id: 1,
    priority: "normal",
  },
);
patch(
  "/posts/:id",
  "แก้ไขโพสต์ของตัวเองหรือโดย Admin",
  "owner",
  async ({ u, p, b }) => {
    const item = await must(
      "SELECT * FROM community_posts WHERE community_posts_id=?",
      [p.id],
    );
    owner(u, item.users_id);
    await db.run(
      "UPDATE community_posts SET title=?,description=?,location_note=?,updated_at=? WHERE community_posts_id=?",
      [
        text(b.title, "หัวข้อ", 3, 150),
        text(b.description, "รายละเอียด", 5, 5000),
        text(b.location_note, "สถานที่", 1, 255),
        now(),
        p.id,
      ],
    );
    await audit(u, "post.update", p.id);
    return must(joinedPost + " WHERE p.community_posts_id=?", [p.id]);
  },
  {
    title: "หัวข้อที่แก้ไข",
    description: "รายละเอียดเพิ่มเติม",
    location_note: "สถานที่",
  },
);
patch(
  "/posts/:id/status",
  "เปลี่ยนสถานะและบันทึกประวัติ",
  "staff",
  async ({ u, p, b }) => {
    const status = validStatus(b.status),
      note = text(b.note, "บันทึกการดำเนินงาน", 3, 1000);
    await transaction(async (tx) => {
      const item = await tx.get(
        "SELECT * FROM community_posts WHERE community_posts_id=?" + lock,
        [p.id],
      );
      if (!item) fail(404, "ไม่พบรายการ");
      if (item.status === status) fail(409, "รายการอยู่ในสถานะนี้แล้ว");
      await tx.run(
        "UPDATE community_posts SET status=?,updated_at=? WHERE community_posts_id=?",
        [status, now(), p.id],
      );
      await tx.run("INSERT INTO post_history VALUES (?,?,?,?,?,?)", [
        id(),
        p.id,
        u.users_id,
        status,
        note,
        now(),
      ]);
      await tx.run("INSERT INTO notifications VALUES (?,?,?,?,?,0,?)", [
        id(),
        item.users_id,
        "อัปเดตเรื่อง: " + item.title,
        note,
        "posts/" + p.id,
        now(),
      ]);
    });
    await audit(u, "post.status." + status, p.id);
    return must(joinedPost + " WHERE p.community_posts_id=?", [p.id]);
  },
  { status: "in_progress", note: "รับเรื่องแล้ว กำลังตรวจสอบ" },
);
del(
  "/posts/:id",
  "ลบโพสต์ของตัวเองหรือโดย Admin",
  "owner",
  async ({ u, p }) => {
    const item = await must(
      "SELECT * FROM community_posts WHERE community_posts_id=?",
      [p.id],
    );
    owner(u, item.users_id);
    await db.run("DELETE FROM community_posts WHERE community_posts_id=?", [
      p.id,
    ]);
    await audit(u, "post.delete", p.id);
  },
);
get("/posts/:id/history", "ประวัติสถานะเรื่อง", "resident", async ({ p }) => {
  await must(
    "SELECT community_posts_id FROM community_posts WHERE community_posts_id=?",
    [p.id],
  );
  return db.all(
    "SELECT h.*,u.full_name FROM post_history h JOIN users u ON u.users_id=h.users_id WHERE h.post_id=? ORDER BY h.created_at",
    [p.id],
  );
});
get("/posts/:id/comments", "ความคิดเห็นของโพสต์", "resident", async ({ p }) => {
  await must(
    "SELECT community_posts_id FROM community_posts WHERE community_posts_id=?",
    [p.id],
  );
  return db.all(
    "SELECT c.*,u.full_name,u.role FROM comments c JOIN users u ON u.users_id=c.users_id WHERE post_id=? ORDER BY created_at",
    [p.id],
  );
});
post(
  "/posts/:id/comments",
  "เพิ่มความคิดเห็น",
  "resident",
  async ({ u, p, b, res }) => {
    const body = text(b.body, "ความคิดเห็น", 1, 2000),
      item = await must(
        "SELECT * FROM community_posts WHERE community_posts_id=?",
        [p.id],
      ),
      cid = id();
    await db.run("INSERT INTO comments VALUES (?,?,?,?,?)", [
      cid,
      p.id,
      u.users_id,
      body,
      now(),
    ]);
    if (item.users_id !== u.users_id)
      await notify(
        item.users_id,
        "ความคิดเห็นใหม่",
        body.slice(0, 200),
        "posts/" + p.id,
      );
    res.statusCode = 201;
    return must(
      "SELECT c.*,u.full_name FROM comments c JOIN users u ON u.users_id=c.users_id WHERE c.id=?",
      [cid],
    );
  },
  { body: "ขอทราบความคืบหน้าค่ะ" },
);
del(
  "/comments/:id",
  "ลบความคิดเห็นของตัวเองหรือโดย Admin",
  "owner",
  async ({ u, p }) => {
    const c = await must("SELECT * FROM comments WHERE id=?", [p.id]);
    owner(u, c.users_id);
    await db.run("DELETE FROM comments WHERE id=?", [p.id]);
  },
);

get("/equipment", "รายการและจำนวนอุปกรณ์พร้อมยืม", "resident", async ({ u }) =>
  db.all(
    "SELECT * FROM equipment" +
      (staff(u) ? "" : " WHERE active=1") +
      " ORDER BY name",
  ),
);
get("/equipment/:id", "รายละเอียดอุปกรณ์", "resident", async ({ p, u }) =>
  must(
    "SELECT * FROM equipment WHERE id=?" + (staff(u) ? "" : " AND active=1"),
    [p.id],
  ),
);
post(
  "/equipment",
  "เพิ่มอุปกรณ์ส่วนกลาง",
  "staff",
  async ({ b, res, u }) => {
    const eid = id(),
      total = integer(b.total, "จำนวน", 1, 10000);
    await db.run("INSERT INTO equipment VALUES (?,?,?,?,?,?,1)", [
      eid,
      text(b.name, "ชื่อ", 2, 100),
      text(b.description, "รายละเอียด", 1, 2000),
      total,
      total,
      "box",
    ]);
    res.statusCode = 201;
    await audit(u, "equipment.create", eid);
    return must("SELECT * FROM equipment WHERE id=?", [eid]);
  },
  { name: "เก้าอี้พับ", description: "เก้าอี้สำหรับจัดกิจกรรม", total: 10 },
);
patch(
  "/equipment/:id",
  "แก้ไขอุปกรณ์และสต็อกอย่างปลอดภัย",
  "staff",
  async ({ p, b, u }) => {
    const name = text(b.name, "ชื่อ", 2, 100),
      description = text(b.description, "รายละเอียด", 1, 2000),
      total = integer(b.total, "จำนวน", 1, 10000);
    await transaction(async (tx) => {
      const e = await tx.get("SELECT * FROM equipment WHERE id=?" + lock, [
        p.id,
      ]);
      if (!e) fail(404, "ไม่พบอุปกรณ์");
      const borrowed = e.total - e.available;
      if (total < borrowed) fail(409, "จำนวนรวมต้องไม่น้อยกว่าจำนวนที่ถูกยืม");
      await tx.run(
        "UPDATE equipment SET name=?,description=?,total=?,available=? WHERE id=?",
        [name, description, total, total - borrowed, p.id],
      );
    });
    await audit(u, "equipment.update", p.id);
    return must("SELECT * FROM equipment WHERE id=?", [p.id]);
  },
  { name: "เก้าอี้พับ", description: "รายละเอียด", total: 30 },
);
del(
  "/equipment/:id",
  "ปิดใช้งานอุปกรณ์ที่ไม่มีรายการค้างคืน",
  "staff",
  async ({ p, u }) => {
    await transaction(async (tx) => {
      const e = await tx.get("SELECT * FROM equipment WHERE id=?" + lock, [
        p.id,
      ]);
      if (!e) fail(404, "ไม่พบอุปกรณ์");
      if (e.available !== e.total) fail(409, "ยังมีอุปกรณ์ที่ไม่คืน");
      await tx.run("UPDATE equipment SET active=0 WHERE id=?", [p.id]);
    });
    await audit(u, "equipment.archive", p.id);
  },
);
get(
  "/loans",
  "รายการยืมของฉัน / ทั้งหมดสำหรับเจ้าหน้าที่",
  "resident",
  async ({ q, u }) => {
    const { limit, offset } = page(q),
      where = staff(u) && q.get("mine") !== "true" ? "" : " WHERE l.users_id=?",
      args = where ? [u.users_id] : [];
    return {
      items: await db.all(
        loanSql +
          where +
          ` ORDER BY l.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        args,
      ),
      total: Number(
        (await db.get("SELECT COUNT(*) AS n FROM loans l" + where, args)).n,
      ),
      limit,
      offset,
    };
  },
);
get("/loans/:id", "รายละเอียดการยืมตามสิทธิ์", "resident", async ({ u, p }) => {
  const l = await must(loanSql + " WHERE l.id=?", [p.id]);
  if (!staff(u)) owner(u, l.users_id);
  return l;
});
post(
  "/loans",
  "ยืมอุปกรณ์พร้อมตัดสต็อกใน Transaction",
  "resident",
  async ({ b, u, res }) => {
    const eid = text(b.equipment_id, "อุปกรณ์", 1, 36),
      qty = integer(b.quantity, "จำนวน", 1, 100),
      due = dateOnly(b.due_date),
      purpose = text(b.purpose, "วัตถุประสงค์", 3, 255);
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Bangkok",
    });
    if (due < today || Date.parse(due) > Date.now() + 30 * 86400000)
      fail(422, "กำหนดคืนต้องเป็นวันนี้ถึงอีก 30 วัน");
    const lid = id();
    await transaction(async (tx) => {
      const e = await tx.get(
        "SELECT * FROM equipment WHERE id=? AND active=1" + lock,
        [eid],
      );
      if (!e) fail(404, "ไม่พบอุปกรณ์");
      if (e.available < qty) fail(409, "อุปกรณ์ไม่เพียงพอ", "OUT_OF_STOCK");
      const result = await tx.run(
        "UPDATE equipment SET available=available-? WHERE id=? AND available>=?",
        [qty, eid, qty],
      );
      if (!result.changes) fail(409, "อุปกรณ์ถูกยืมแล้ว กรุณาลองใหม่");
      await tx.run("INSERT INTO loans VALUES (?,?,?,?,?,?,?,?,?)", [
        lid,
        eid,
        u.users_id,
        qty,
        due,
        purpose,
        "borrowed",
        null,
        now(),
      ]);
    });
    await audit(u, "loan.borrow", lid);
    res.statusCode = 201;
    return must(loanSql + " WHERE l.id=?", [lid]);
  },
  {
    equipment_id: "eq-1",
    quantity: 2,
    due_date: "2026-12-01",
    purpose: "จัดกิจกรรมครอบครัว",
  },
);
patch(
  "/loans/:id/return",
  "เจ้าหน้าที่รับคืนและเพิ่มสต็อกใน Transaction",
  "staff",
  async ({ p, u }) => {
    await transaction(async (tx) => {
      const l = await tx.get("SELECT * FROM loans WHERE id=?" + lock, [p.id]);
      if (!l) fail(404, "ไม่พบรายการยืม");
      if (l.status !== "borrowed") fail(409, "รายการนี้คืนแล้ว");
      await tx.run("UPDATE loans SET status=?,returned_at=? WHERE id=?", [
        "returned",
        now(),
        p.id,
      ]);
      await tx.run("UPDATE equipment SET available=available+? WHERE id=?", [
        l.quantity,
        l.equipment_id,
      ]);
      await tx.run("INSERT INTO notifications VALUES (?,?,?,?,?,0,?)", [
        id(),
        l.users_id,
        "รับคืนอุปกรณ์เรียบร้อย",
        "เจ้าหน้าที่ตรวจรับอุปกรณ์แล้ว ขอบคุณที่แบ่งปันทรัพยากรส่วนกลาง",
        "loans",
        now(),
      ]);
    });
    await audit(u, "loan.return", p.id);
    return must(loanSql + " WHERE l.id=?", [p.id]);
  },
);

get("/announcements", "ข่าวประกาศ (ปักหมุดก่อน)", "resident", async () =>
  db.all(
    "SELECT a.*,u.full_name FROM announcements a JOIN users u ON u.users_id=a.users_id ORDER BY a.pinned DESC,a.created_at DESC",
  ),
);
get("/announcements/:id", "รายละเอียดประกาศ", "resident", async ({ p }) =>
  must("SELECT * FROM announcements WHERE id=?", [p.id]),
);
post(
  "/announcements",
  "สร้างประกาศชุมชน",
  "staff",
  async ({ u, b, res }) => {
    const aid = id();
    await db.run("INSERT INTO announcements VALUES (?,?,?,?,?,?)", [
      aid,
      u.users_id,
      text(b.title, "หัวข้อ", 3, 150),
      text(b.body, "เนื้อหา", 5, 5000),
      b.pinned === true ? 1 : 0,
      now(),
    ]);
    await audit(u, "announcement.create", aid);
    res.statusCode = 201;
    return must("SELECT * FROM announcements WHERE id=?", [aid]);
  },
  { title: "ประกาศใหม่", body: "รายละเอียดประกาศสำหรับลูกบ้าน", pinned: false },
);
patch(
  "/announcements/:id",
  "แก้ไขหรือปักหมุดประกาศ",
  "staff",
  async ({ u, p, b }) => {
    const a = await must("SELECT * FROM announcements WHERE id=?", [p.id]);
    await db.run(
      "UPDATE announcements SET title=?,body=?,pinned=? WHERE id=?",
      [
        b.title === undefined ? a.title : text(b.title, "หัวข้อ", 3, 150),
        b.body === undefined ? a.body : text(b.body, "เนื้อหา", 5, 5000),
        b.pinned === undefined ? a.pinned : b.pinned === true ? 1 : 0,
        p.id,
      ],
    );
    await audit(u, "announcement.update", p.id);
    return must("SELECT * FROM announcements WHERE id=?", [p.id]);
  },
  { pinned: true },
);
del("/announcements/:id", "ลบประกาศ", "staff", async ({ p, u }) => {
  await must("SELECT * FROM announcements WHERE id=?", [p.id]);
  await db.run("DELETE FROM announcements WHERE id=?", [p.id]);
  await audit(u, "announcement.delete", p.id);
});

const eventSql = `SELECT e.*,(SELECT COUNT(*) FROM event_attendees a WHERE a.event_id=e.id) AS attendee_count,(SELECT COUNT(*) FROM event_attendees a WHERE a.event_id=e.id AND a.users_id=?) AS joined FROM events e`;
get("/events", "รายการกิจกรรมและจำนวนผู้เข้าร่วม", "resident", async ({ u }) =>
  db.all(eventSql + " ORDER BY starts_at", [u.users_id]),
);
get("/events/:id", "รายละเอียดกิจกรรม", "resident", async ({ u, p }) =>
  must(eventSql + " WHERE e.id=?", [u.users_id, p.id]),
);
function eventBody(b) {
  const title = text(b.title, "ชื่อกิจกรรม", 3, 150),
    desc = text(b.description, "รายละเอียด", 5, 3000),
    location = text(b.location, "สถานที่", 2, 150),
    capacity = integer(b.capacity, "จำนวนรับ", 1, 1000);
  if (
    typeof b.starts_at !== "string" ||
    Number.isNaN(Date.parse(b.starts_at)) ||
    Date.parse(b.starts_at) < Date.now()
  )
    fail(422, "วันจัดกิจกรรมต้องเป็นวันในอนาคต");
  return [title, desc, location, new Date(b.starts_at).toISOString(), capacity];
}
post(
  "/events",
  "สร้างกิจกรรมชุมชน",
  "staff",
  async ({ u, b, res }) => {
    const values = eventBody(b),
      eid = id();
    await db.run("INSERT INTO events VALUES (?,?,?,?,?,?,?)", [
      eid,
      ...values,
      u.users_id,
    ]);
    await audit(u, "event.create", eid);
    res.statusCode = 201;
    return must("SELECT * FROM events WHERE id=?", [eid]);
  },
  {
    title: "ประชุมลูกบ้าน",
    description: "ประชุมรับฟังความคิดเห็น",
    location: "คลับเฮาส์",
    starts_at: "2026-12-10T03:00:00Z",
    capacity: 50,
  },
);
patch(
  "/events/:id",
  "แก้ไขกิจกรรมโดยไม่ลดที่นั่งต่ำกว่าผู้สมัคร",
  "staff",
  async ({ p, b, u }) => {
    const values = eventBody(b);
    await transaction(async (tx) => {
      const e = await tx.get("SELECT * FROM events WHERE id=?" + lock, [p.id]);
      if (!e) fail(404, "ไม่พบกิจกรรม");
      const count = await tx.get(
        "SELECT COUNT(*) AS n FROM event_attendees WHERE event_id=?",
        [p.id],
      );
      if (values[4] < Number(count.n)) fail(409, "ความจุต่ำกว่าจำนวนผู้สมัคร");
      await tx.run(
        "UPDATE events SET title=?,description=?,location=?,starts_at=?,capacity=? WHERE id=?",
        [...values, p.id],
      );
    });
    await audit(u, "event.update", p.id);
    return must("SELECT * FROM events WHERE id=?", [p.id]);
  },
  {
    title: "ประชุมลูกบ้าน",
    description: "รายละเอียดกิจกรรม",
    location: "คลับเฮาส์",
    starts_at: "2026-12-10T03:00:00Z",
    capacity: 50,
  },
);
del(
  "/events/:id",
  "ยกเลิกกิจกรรมและแจ้งผู้เข้าร่วม",
  "staff",
  async ({ p, u }) => {
    await transaction(async (tx) => {
      const e = await tx.get("SELECT * FROM events WHERE id=?" + lock, [p.id]);
      if (!e) fail(404, "ไม่พบกิจกรรม");
      const people = await tx.all(
        "SELECT users_id FROM event_attendees WHERE event_id=?",
        [p.id],
      );
      for (const person of people)
        await tx.run("INSERT INTO notifications VALUES (?,?,?,?,?,0,?)", [
          id(),
          person.users_id,
          "ยกเลิกกิจกรรม: " + e.title,
          "กรุณาติดต่อสำนักงานหากต้องการข้อมูลเพิ่มเติม",
          "events",
          now(),
        ]);
      await tx.run("DELETE FROM events WHERE id=?", [p.id]);
    });
    await audit(u, "event.delete", p.id);
  },
);
post(
  "/events/:id/join",
  "เข้าร่วมกิจกรรมพร้อมตรวจที่ว่าง",
  "resident",
  async ({ u, p, res }) => {
    await transaction(async (tx) => {
      const e = await tx.get("SELECT * FROM events WHERE id=?" + lock, [p.id]);
      if (!e) fail(404, "ไม่พบกิจกรรม");
      if (Date.parse(e.starts_at) < Date.now())
        fail(409, "กิจกรรมนี้สิ้นสุดแล้ว");
      if (
        await tx.get(
          "SELECT * FROM event_attendees WHERE event_id=? AND users_id=?",
          [p.id, u.users_id],
        )
      )
        fail(409, "คุณเข้าร่วมกิจกรรมนี้แล้ว");
      const n = await tx.get(
        "SELECT COUNT(*) AS n FROM event_attendees WHERE event_id=?",
        [p.id],
      );
      if (Number(n.n) >= e.capacity) fail(409, "กิจกรรมเต็มแล้ว");
      await tx.run("INSERT INTO event_attendees VALUES (?,?,?)", [
        p.id,
        u.users_id,
        now(),
      ]);
    });
    res.statusCode = 201;
    return { message: "ลงทะเบียนเข้าร่วมแล้ว" };
  },
);
del(
  "/events/:id/join",
  "ยกเลิกการเข้าร่วมกิจกรรม",
  "resident",
  async ({ u, p }) => {
    const changed = await db.run(
      "DELETE FROM event_attendees WHERE event_id=? AND users_id=?",
      [p.id, u.users_id],
    );
    if (!changed.changes) fail(404, "ไม่พบการเข้าร่วม");
  },
);
get(
  "/events/:id/attendees",
  "รายชื่อผู้เข้าร่วม (เจ้าหน้าที่)",
  "staff",
  async ({ p }) => {
    await must("SELECT id FROM events WHERE id=?", [p.id]);
    return db.all(
      "SELECT u.users_id,u.full_name,u.house_number,a.created_at FROM event_attendees a JOIN users u ON u.users_id=a.users_id WHERE a.event_id=?",
      [p.id],
    );
  },
);

get("/notifications", "การแจ้งเตือนส่วนตัว", "resident", async ({ u }) =>
  db.all(
    "SELECT * FROM notifications WHERE users_id=? ORDER BY created_at DESC LIMIT 100",
    [u.users_id],
  ),
);
patch(
  "/notifications/read-all",
  "อ่านการแจ้งเตือนทั้งหมด",
  "resident",
  async ({ u }) => {
    await db.run("UPDATE notifications SET is_read=1 WHERE users_id=?", [
      u.users_id,
    ]);
    return { message: "อ่านทั้งหมดแล้ว" };
  },
);
patch(
  "/notifications/:id/read",
  "อ่านการแจ้งเตือนส่วนตัว",
  "resident",
  async ({ u, p }) => {
    const n = await db.run(
      "UPDATE notifications SET is_read=1 WHERE id=? AND users_id=?",
      [p.id, u.users_id],
    );
    if (!n.changes) fail(404, "ไม่พบการแจ้งเตือน");
    return { message: "อ่านแล้ว" };
  },
);
del(
  "/notifications/:id",
  "ลบการแจ้งเตือนส่วนตัว",
  "resident",
  async ({ u, p }) => {
    const n = await db.run(
      "DELETE FROM notifications WHERE id=? AND users_id=?",
      [p.id, u.users_id],
    );
    if (!n.changes) fail(404, "ไม่พบการแจ้งเตือน");
  },
);
get("/dashboard", "ภาพรวมชุมชนและรายการของฉัน", "resident", async ({ u }) => {
  const statuses = await db.all(
    "SELECT status,COUNT(*) AS count FROM community_posts GROUP BY status",
  );
  const counts = { pending: 0, in_progress: 0, resolved: 0 };
  for (const r of statuses) counts[r.status] = Number(r.count);
  const eq = await db.get(
    "SELECT COALESCE(SUM(available),0) AS available,COUNT(*) AS types FROM equipment WHERE active=1",
  );
  return {
    counts,
    equipment: eq,
    residents: Number(
      (
        await db.get(
          "SELECT COUNT(*) AS n FROM users WHERE active=1 AND role='resident'",
        )
      ).n,
    ),
    my_posts: Number(
      (
        await db.get(
          "SELECT COUNT(*) AS n FROM community_posts WHERE users_id=?",
          [u.users_id],
        )
      ).n,
    ),
    my_loans: Number(
      (
        await db.get(
          "SELECT COUNT(*) AS n FROM loans WHERE users_id=? AND status='borrowed'",
          [u.users_id],
        )
      ).n,
    ),
    unread: Number(
      (
        await db.get(
          "SELECT COUNT(*) AS n FROM notifications WHERE users_id=? AND is_read=0",
          [u.users_id],
        )
      ).n,
    ),
    recent_posts: await db.all(
      joinedPost + " ORDER BY p.created_at DESC LIMIT 4",
    ),
  };
});
get(
  "/reports/summary",
  "สถิติแยกหมวดหมู่และสัดส่วนแก้ไข",
  "staff",
  async () => {
    const by_category = await db.all(
      "SELECT c.name,c.type,COUNT(p.community_posts_id) AS total,SUM(CASE WHEN p.status='resolved' THEN 1 ELSE 0 END) AS resolved FROM categories c LEFT JOIN community_posts p ON p.categories_id=c.categories_id GROUP BY c.categories_id,c.name,c.type",
    );
    const by_day = await db.all(
      "SELECT SUBSTR(created_at,1,10) AS day,COUNT(*) AS total FROM community_posts GROUP BY SUBSTR(created_at,1,10) ORDER BY day DESC LIMIT 30",
    );
    return {
      by_category,
      by_day,
      overdue: Number(
        (
          await db.get(
            "SELECT COUNT(*) AS n FROM loans WHERE status='borrowed' AND due_date<?",
            [
              new Date().toLocaleDateString("en-CA", {
                timeZone: "Asia/Bangkok",
              }),
            ],
          )
        ).n,
      ),
    };
  },
);
get(
  "/reports/export",
  "ส่งออกรายงานเป็น CSV (ป้องกันสูตรอันตราย)",
  "staff",
  async ({ res }) => {
    const rows = await db.all(joinedPost + " ORDER BY p.created_at DESC");
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="community-report.csv"',
    );
    return (
      "\uFEFF" +
      [
        ["รหัส", "หัวข้อ", "หมวดหมู่", "สถานที่", "สถานะ", "วันที่"],
        ...rows.map((r) => [
          r.community_posts_id,
          r.title,
          r.category_name,
          r.location_note,
          r.status,
          r.created_at,
        ]),
      ]
        .map((r) => r.map(cell).join(","))
        .join("\r\n")
    );
  },
);
get("/users", "รายชื่อผู้ใช้ (เฉพาะ Admin)", "admin", async ({ q }) => {
  const { limit, offset } = page(q);
  return {
    items: (
      await db.all(
        `SELECT * FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      )
    ).map(safeUser),
    total: Number((await db.get("SELECT COUNT(*) AS n FROM users")).n),
    limit,
    offset,
  };
});
get("/users/:id", "ข้อมูลผู้ใช้ (เฉพาะ Admin)", "admin", async ({ p }) =>
  safeUser(await must("SELECT * FROM users WHERE users_id=?", [p.id])),
);
patch(
  "/users/:id/role",
  "เปลี่ยนบทบาทและเพิกถอนเซสชันเดิม",
  "admin",
  async ({ u, p, b }) => {
    if (p.id === u.users_id) fail(409, "ไม่สามารถเปลี่ยนบทบาทตนเอง");
    if (!["resident", "juristic", "admin"].includes(b.role))
      fail(422, "บทบาทไม่ถูกต้อง");
    await must("SELECT users_id FROM users WHERE users_id=?", [p.id]);
    await transaction(async (tx) => {
      await tx.run("UPDATE users SET role=? WHERE users_id=?", [b.role, p.id]);
      await tx.run("DELETE FROM sessions WHERE users_id=?", [p.id]);
    });
    await audit(u, "user.role." + b.role, p.id);
    return safeUser(await must("SELECT * FROM users WHERE users_id=?", [p.id]));
  },
  { role: "juristic" },
);
patch(
  "/users/:id/active",
  "เปิด/ปิดบัญชีและเพิกถอนเซสชัน",
  "admin",
  async ({ u, p, b }) => {
    if (p.id === u.users_id) fail(409, "ไม่สามารถปิดบัญชีตนเอง");
    if (typeof b.active !== "boolean") fail(422, "active ต้องเป็น boolean");
    await must("SELECT users_id FROM users WHERE users_id=?", [p.id]);
    await transaction(async (tx) => {
      await tx.run("UPDATE users SET active=? WHERE users_id=?", [
        b.active ? 1 : 0,
        p.id,
      ]);
      await tx.run("DELETE FROM sessions WHERE users_id=?", [p.id]);
    });
    await audit(u, "user.active." + b.active, p.id);
    return safeUser(await must("SELECT * FROM users WHERE users_id=?", [p.id]));
  },
  { active: false },
);
get(
  "/audit-logs",
  "บันทึกการดำเนินงานเพื่อความโปร่งใส",
  "admin",
  async ({ q }) => {
    const { limit, offset } = page(q);
    return {
      items: await db.all(
        `SELECT a.*,u.full_name FROM audit_logs a LEFT JOIN users u ON u.users_id=a.users_id ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      ),
      total: Number((await db.get("SELECT COUNT(*) AS n FROM audit_logs")).n),
      limit,
      offset,
    };
  },
);

export async function dispatch(req, res, url, b) {
  const path = url.pathname.slice("/api/v1".length) || "/";
  const r = routes.find((r) => r.method === req.method && r.regex.test(path));
  if (!r) fail(404, "ไม่พบ API", "NOT_FOUND");
  const p = Object.fromEntries(
    Object.entries(path.match(r.regex).groups || {}).map(([k, v]) => [
      k,
      decodeURIComponent(v),
    ]),
  );
  const u = r.access === "public" ? null : await authenticate(req);
  if (r.access === "admin" && u.role !== "admin")
    fail(403, "เฉพาะผู้ดูแลระบบ", "FORBIDDEN");
  if (r.access === "staff") requireStaff(u);
  const result = await r.fn({ u, p, b, q: url.searchParams, req, res });
  if (result === undefined) {
    res.writeHead(204);
    res.end();
    return;
  }
  if (typeof result === "string") {
    res.end(result);
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ data: result }));
}

export function openapi() {
  const paths = {};
  for (const r of routes) {
    const path = "/api/v1" + r.path.replace(/:([a-z_]+)/g, "{$1}");
    paths[path] ||= {};
    const parameters = [...r.path.matchAll(/:([a-z_]+)/g)].map((m) => ({
      name: m[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    }));
    if (
      r.method === "GET" &&
      ["/posts", "/loans", "/users", "/audit-logs"].includes(r.path)
    ) {
      for (const name of [
        "limit",
        "offset",
        ...(r.path === "/posts"
          ? ["q", "status", "category", "type", "mine"]
          : []),
      ])
        parameters.push({ name, in: "query", schema: { type: "string" } });
    }
    const code =
      r.method === "DELETE"
        ? "204"
        : r.method === "POST" &&
            !r.path.startsWith("/auth/login") &&
            !r.path.startsWith("/auth/logout")
          ? "201"
          : "200";
    const operation = {
      summary: r.summary,
      tags: [r.path.split("/")[1]],
      description: "Access: " + r.access,
      security: r.access === "public" ? [] : [{ bearerAuth: [] }],
      parameters,
      responses: {
        [code]: { description: "Success" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Not found" },
        409: { description: "Conflict" },
        422: { description: "Validation error" },
      },
    };
    if (r.body)
      operation.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: Object.fromEntries(
                Object.entries(r.body).map(([k, v]) => [
                  k,
                  { type: typeof v === "number" ? "integer" : typeof v },
                ]),
              ),
            },
            example: r.body,
          },
        },
      };
    paths[path][r.method.toLowerCase()] = operation;
  }
  return {
    openapi: "3.0.3",
    info: {
      title: "Village Community Portal API",
      version: "1.0.0",
      description:
        "ระบบศูนย์ชุมชนหมู่บ้านจัดสรร: JWT / RBAC / pagination / transactions. resident = authenticated; owner = resource owner or admin; staff = juristic or admin.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    paths,
  };
}
