import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
let processHandle,
  base,
  temp,
  logs = "",
  tokens = {};
before(async () => {
  const testClient = process.env.TEST_DB_CLIENT || "sqlite";
  if (testClient === "mysql" && !process.env.MYSQL_DATABASE?.endsWith("_test"))
    throw Error(
      "MySQL integration tests require an empty disposable MYSQL_DATABASE ending in _test",
    );
  temp = await mkdtemp(path.join(tmpdir(), "village-api-test-"));
  processHandle = spawn(process.execPath, ["src/server.js"], {
    cwd: path.resolve(import.meta.dirname, ".."),
    env: {
      ...process.env,
      PORT: "0",
      HOST: "127.0.0.1",
      DB_CLIENT: testClient,
      DATA_DIR: temp,
      NODE_ENV: "test",
      SEED_DEMO: "true",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("Server startup timeout: " + logs)),
      15000,
    );
    processHandle.stdout.on("data", (data) => {
      logs += data;
      const match = logs.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    processHandle.stderr.on("data", (data) => (logs += data));
    processHandle.on("exit", (code) => {
      if (!base) {
        clearTimeout(timer);
        reject(Error("Server exited: " + code + " " + logs));
      }
    });
  });
  for (const role of ["resident", "juristic", "admin"]) {
    const r = await call("/auth/login", "POST", {
      email: role + "@village.demo",
      password: "Village@123",
    });
    assert.equal(r.status, 200);
    tokens[role] = r.data.token;
  }
});
after(async () => {
  if (processHandle?.exitCode === null) {
    const exited = new Promise((resolve) =>
      processHandle.once("exit", resolve),
    );
    processHandle.kill();
    await exited;
  }
  if (temp) await rm(temp, { recursive: true, force: true });
});
async function call(url, method = "GET", body, role) {
  const r = await fetch(base + "/api/v1" + url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(role ? { Authorization: "Bearer " + (tokens[role] || role) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await r.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {}
  return {
    status: r.status,
    data: json?.data,
    error: json?.error,
    raw,
    headers: r.headers,
  };
}
const future = (days) =>
  new Date(Date.now() + days * 86400000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });
test("public health, OpenAPI and static app are available", async () => {
  assert.equal((await call("/health")).data.status, "ok");
  const spec = await (await fetch(base + "/api/v1/openapi.json")).json();
  assert.equal(spec.openapi, "3.0.3");
  assert.equal(
    Object.values(spec.paths).reduce((a, b) => a + Object.keys(b).length, 0),
    55,
  );
  for (const file of [
    "/",
    "/app.js",
    "/styles.css",
    "/village.svg",
    "/docs",
    "/docs.js",
  ])
    assert.equal((await fetch(base + file)).status, 200, file);
});
test("private APIs reject anonymous access and tampered JWT", async () => {
  assert.equal((await call("/posts")).status, 401);
  assert.equal(
    (await call("/auth/me", "GET", null, "tampered.token.value")).status,
    401,
  );
  const t = tokens.resident;
  assert.equal(
    (await call("/auth/me", "GET", null, t.slice(0, -3) + "abc")).status,
    401,
  );
});
test("login cookie has HttpOnly and SameSite; passwords are not exposed", async () => {
  const r = await call("/auth/login", "POST", {
    email: "resident@village.demo",
    password: "Village@123",
  });
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  assert.match(r.headers.get("set-cookie"), /SameSite=Strict/);
  assert.equal(r.data.user.password_hash, undefined);
  assert.equal(
    (
      await call("/auth/login", "POST", {
        email: "resident@village.demo",
        password: "incorrect",
      })
    ).status,
    401,
  );
});
test("resident cannot access staff/admin operations or escalate at registration", async () => {
  for (const p of [
    "/reports/summary",
    "/reports/export",
    "/users",
    "/audit-logs",
  ])
    assert.equal((await call(p, "GET", null, "resident")).status, 403);
  assert.equal((await call("/users", "GET", null, "juristic")).status, 403);
  const registered = await call("/auth/register", "POST", {
    email: "new@example.test",
    password: "StrongPass@123",
    full_name: "สมาชิกทดสอบ",
    house_number: "88/99",
    phone: "0811111111",
    role: "admin",
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.data.user.role, "resident");
  assert.equal(
    (await call("/auth/register", "POST", { email: "bad", password: "short" }))
      .status,
    422,
  );
});
test("post lifecycle: create, owner edit, staff status, history, comments, delete cascade", async () => {
  const created = await call(
    "/posts",
    "POST",
    {
      title: "ทดสอบไฟทางชำรุด",
      description: "รายละเอียดทดสอบไฟทางชำรุด",
      location_note: "ซอยทดสอบ",
      categories_id: 1,
    },
    "resident",
  );
  assert.equal(created.status, 201);
  const pid = created.data.community_posts_id;
  assert.equal(created.data.status, "pending");
  assert.equal(
    (
      await call(
        "/posts/" + pid + "/status",
        "PATCH",
        { status: "resolved", note: "ทดสอบ" },
        "resident",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        "/posts/" + pid,
        "PATCH",
        {
          title: "หัวข้อใหม่",
          description: "รายละเอียดใหม่",
          location_note: "สวน",
        },
        "juristic",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        "/posts/" + pid,
        "PATCH",
        {
          title: "หัวข้อใหม่",
          description: "รายละเอียดใหม่",
          location_note: "สวน",
        },
        "resident",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/posts/" + pid + "/status",
        "PATCH",
        { status: "in_progress", note: "รับเรื่องเพื่อแก้ไข" },
        "juristic",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/posts/" + pid + "/status",
        "PATCH",
        { status: "unknown", note: "สถานะผิด" },
        "juristic",
      )
    ).status,
    422,
  );
  assert.equal(
    (await call("/posts/" + pid + "/history", "GET", null, "resident")).data
      .length,
    2,
  );
  const c = await call(
    "/posts/" + pid + "/comments",
    "POST",
    { body: "ข้อมูลเพิ่มเติม" },
    "resident",
  );
  assert.equal(c.status, 201);
  assert.equal(
    (await call("/comments/" + c.data.id, "DELETE", null, "juristic")).status,
    403,
  );
  assert.equal(
    (await call("/posts/" + pid + "/comments", "GET", null, "resident")).data
      .length,
    1,
  );
  assert.equal(
    (await call("/posts/" + pid, "DELETE", null, "juristic")).status,
    403,
  );
  assert.equal(
    (await call("/posts/" + pid, "DELETE", null, "resident")).status,
    204,
  );
  assert.equal(
    (await call("/posts/" + pid, "GET", null, "resident")).status,
    404,
  );
});
test("post filtering, pagination, SQL injection input and validation", async () => {
  const d = await call(
    "/posts?type=lost&limit=1&offset=0",
    "GET",
    null,
    "resident",
  );
  assert.equal(d.data.items.length, 1);
  assert.equal(d.data.items[0].category_type, "lost");
  assert.equal(
    (
      await call(
        "/posts?q=" + encodeURIComponent("' OR 1=1 --"),
        "GET",
        null,
        "resident",
      )
    ).data.total,
    0,
  );
  assert.equal(
    (await call("/posts?limit=2.5&offset=0.5", "GET", null, "resident")).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/posts",
        "POST",
        {
          title: "xx",
          description: "short",
          location_note: "x",
          categories_id: 1,
        },
        "resident",
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await call(
        "/posts",
        "POST",
        {
          title: "หัวข้อใหม่",
          description: "รายละเอียด",
          location_note: "สวน",
          categories_id: 9999,
        },
        "resident",
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        "/posts",
        "POST",
        {
          title: "หัวข้อใหม่",
          description: "รายละเอียด",
          location_note: "สวน",
          categories_id: 6,
        },
        "resident",
      )
    ).status,
    422,
  );
});
test("loan stock atomicity: concurrent borrow, ownership, return, duplicate return", async () => {
  const e = await call(
    "/equipment",
    "POST",
    { name: "อุปกรณ์ทดสอบ", description: "ทดสอบสต็อก", total: 1 },
    "juristic",
  );
  assert.equal(e.status, 201);
  const eid = e.data.id,
    body = {
      equipment_id: eid,
      quantity: 1,
      due_date: future(2),
      purpose: "ทดสอบยืมพร้อมกัน",
    };
  const results = await Promise.all([
    call("/loans", "POST", body, "resident"),
    call("/loans", "POST", body, "resident"),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const lid = results.find((r) => r.status === 201).data.id;
  assert.equal(
    (await call("/equipment/" + eid, "GET", null, "resident")).data.available,
    0,
  );
  assert.equal(
    (await call("/equipment/" + eid, "DELETE", null, "juristic")).status,
    409,
  );
  assert.equal(
    (await call("/loans/" + lid + "/return", "PATCH", {}, "resident")).status,
    403,
  );
  assert.equal(
    (await call("/loans/" + lid + "/return", "PATCH", {}, "juristic")).status,
    200,
  );
  assert.equal(
    (await call("/loans/" + lid + "/return", "PATCH", {}, "juristic")).status,
    409,
  );
  assert.equal(
    (await call("/equipment/" + eid, "GET", null, "resident")).data.available,
    1,
  );
  assert.equal(
    (await call("/equipment/" + eid, "DELETE", null, "juristic")).status,
    204,
  );
  assert.equal(
    (await call("/equipment/" + eid, "GET", null, "resident")).status,
    404,
  );
});
test("invalid due dates and quantities leave stock unchanged", async () => {
  const before = (await call("/equipment/eq-2", "GET", null, "resident")).data
    .available;
  for (const patch of [
    { quantity: 0 },
    { quantity: -1 },
    { quantity: 1.5 },
    { due_date: "2026-02-30" },
    { due_date: "2000-01-01" },
    { due_date: future(40) },
  ]) {
    assert.equal(
      (
        await call(
          "/loans",
          "POST",
          {
            equipment_id: "eq-2",
            quantity: 1,
            due_date: future(2),
            purpose: "ทดสอบวันที่",
            ...patch,
          },
          "resident",
        )
      ).status,
      422,
    );
  }
  assert.equal(
    (await call("/equipment/eq-2", "GET", null, "resident")).data.available,
    before,
  );
});
test("event capacity under concurrent requests and duplicate join prevention", async () => {
  const e = await call(
    "/events",
    "POST",
    {
      title: "กิจกรรมทดสอบ",
      description: "ทดสอบจำนวนรับสมัคร",
      location: "สวนชุมชน",
      capacity: 1,
      starts_at: new Date(Date.now() + 86400000).toISOString(),
    },
    "juristic",
  );
  assert.equal(e.status, 201);
  const eid = e.data.id;
  const result = await Promise.all([
    call("/events/" + eid + "/join", "POST", {}, "resident"),
    call("/events/" + eid + "/join", "POST", {}, "admin"),
  ]);
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (await call("/events/" + eid + "/attendees", "GET", null, "resident"))
      .status,
    403,
  );
  assert.equal(
    (await call("/events/" + eid + "/attendees", "GET", null, "juristic")).data
      .length,
    1,
  );
  assert.equal(
    (await call("/events/" + eid, "DELETE", null, "juristic")).status,
    204,
  );
  assert.equal(
    (await call("/events/" + eid, "GET", null, "resident")).status,
    404,
  );
});
test("announcements: resident denied, staff CRUD and pin", async () => {
  const body = { title: "ข่าวทดสอบ", body: "เนื้อหาประกาศทดสอบ", pinned: true };
  assert.equal(
    (await call("/announcements", "POST", body, "resident")).status,
    403,
  );
  const r = await call("/announcements", "POST", body, "juristic");
  assert.equal(r.status, 201);
  assert.equal(
    (
      await call(
        "/announcements/" + r.data.id,
        "PATCH",
        { pinned: false },
        "juristic",
      )
    ).data.pinned,
    0,
  );
  assert.equal(
    (await call("/announcements/" + r.data.id, "DELETE", null, "juristic"))
      .status,
    204,
  );
});
test("notifications are private and read-all only affects owner", async () => {
  const list = (await call("/notifications", "GET", null, "resident")).data;
  assert.ok(list.length);
  assert.equal(
    (
      await call(
        "/notifications/" + list[0].id + "/read",
        "PATCH",
        {},
        "juristic",
      )
    ).status,
    404,
  );
  assert.equal(
    (await call("/notifications/read-all", "PATCH", {}, "resident")).status,
    200,
  );
  assert.ok(
    (await call("/notifications", "GET", null, "resident")).data.every(
      (n) => n.is_read,
    ),
  );
});
test("CSV export prevents spreadsheet formula injection", async () => {
  const p = await call(
    "/posts",
    "POST",
    {
      title: "=SUM(1+1)",
      description: "ทดสอบส่งออกรายงาน",
      location_note: "+danger",
      categories_id: 1,
    },
    "resident",
  );
  const r = await call("/reports/export", "GET", null, "juristic");
  assert.match(r.headers.get("content-type"), /text\/csv/);
  assert.ok(r.raw.includes("'=SUM(1+1)"));
  assert.ok(r.raw.includes("'+danger"));
  await call("/posts/" + p.data.community_posts_id, "DELETE", null, "resident");
});
test("admin changes role/active, revokes sessions, and cannot disable self", async () => {
  const r = await call("/auth/register", "POST", {
    email: "revoke@example.test",
    password: "StrongPass@123",
    full_name: "ทดสอบสิทธิ์",
    house_number: "88/98",
    phone: "0811111112",
  });
  const uid = r.data.user.users_id,
    old = r.data.token;
  assert.equal(
    (
      await call(
        "/users/" + uid + "/role",
        "PATCH",
        { role: "juristic" },
        "admin",
      )
    ).status,
    200,
  );
  assert.equal((await call("/auth/me", "GET", null, old)).status, 401);
  assert.equal(
    (
      await call(
        "/users/" + uid + "/active",
        "PATCH",
        { active: false },
        "admin",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call("/auth/login", "POST", {
        email: "revoke@example.test",
        password: "StrongPass@123",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call(
        "/users/admin-demo/active",
        "PATCH",
        { active: false },
        "admin",
      )
    ).status,
    409,
  );
  assert.ok((await call("/audit-logs", "GET", null, "admin")).data.total > 0);
});
test("password change checks current password and revokes existing token", async () => {
  const r = await call("/auth/register", "POST", {
    email: "password@example.test",
    password: "StrongPass@123",
    full_name: "เปลี่ยนรหัสผ่าน",
    house_number: "88/97",
    phone: "0811111113",
  });
  const token = r.data.token;
  assert.equal(
    (
      await call(
        "/auth/password",
        "PATCH",
        { current_password: "wrong", password: "NewPassword@123" },
        token,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        "/auth/password",
        "PATCH",
        { current_password: "StrongPass@123", password: "NewPassword@123" },
        token,
      )
    ).status,
    200,
  );
  assert.equal((await call("/auth/me", "GET", null, token)).status, 401);
  assert.equal(
    (
      await call("/auth/login", "POST", {
        email: "password@example.test",
        password: "NewPassword@123",
      })
    ).status,
    200,
  );
});
test("logout revokes bearer token as well as cookie", async () => {
  const r = await call("/auth/login", "POST", {
    email: "resident@village.demo",
    password: "Village@123",
  });
  assert.equal(
    (await call("/auth/logout", "POST", {}, r.data.token)).status,
    200,
  );
  assert.equal((await call("/auth/me", "GET", null, r.data.token)).status, 401);
});
test("cross-origin writes, malformed JSON, wrong content type and oversized body rejected", async () => {
  const r = await fetch(base + "/api/v1/posts", {
    method: "POST",
    headers: {
      Origin: "https://other.example",
      "Content-Type": "application/json",
      Authorization: "Bearer " + tokens.resident,
    },
    body: "{}",
  });
  assert.equal(r.status, 403);
  const malformed = await fetch(base + "/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  const type = await fetch(base + "/api/v1/auth/login", {
    method: "POST",
    body: "hello",
  });
  assert.equal(type.status, 415);
  const big = await fetch(base + "/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ a: "x".repeat(70000) }),
  });
  assert.equal(big.status, 413);
});
test("category CRUD uses generated IDs and refuses deleting a referenced category", async () => {
  const c = await call(
    "/categories",
    "POST",
    { name: "ทดสอบหมวด", description: "หมวดทดสอบ", type: "issue" },
    "admin",
  );
  assert.equal(c.status, 201);
  const cid = c.data.categories_id;
  assert.equal(
    (
      await call(
        "/categories/" + cid,
        "PATCH",
        { name: "แก้ไขหมวด", description: "รายละเอียดใหม่" },
        "admin",
      )
    ).status,
    200,
  );
  assert.equal(
    (await call("/categories/" + cid, "DELETE", null, "admin")).status,
    204,
  );
  assert.equal(
    (await call("/categories/1", "DELETE", null, "admin")).status,
    409,
  );
});
test("equipment edits preserve borrowed counts and reject reducing total below loans", async () => {
  const e = await call(
    "/equipment/eq-1",
    "PATCH",
    { name: "เก้าอี้พับ", description: "ทดสอบปรับจำนวน", total: 1 },
    "juristic",
  );
  assert.equal(e.status, 409);
  const result = await call(
    "/equipment/eq-1",
    "PATCH",
    { name: "เก้าอี้พับ", description: "ปรับจำนวนรวม", total: 35 },
    "juristic",
  );
  assert.equal(result.status, 200);
  assert.equal(result.data.available, 33);
});
test("event editing, join and unjoin preserve membership and capacity", async () => {
  const original = (await call("/events/event-2", "GET", null, "resident"))
    .data;
  const edited = await call(
    "/events/event-2",
    "PATCH",
    { ...original, title: "ประชุมลูกบ้านทดสอบ", capacity: 1 },
    "juristic",
  );
  assert.equal(edited.status, 200);
  assert.equal(
    (await call("/events/event-2/join", "POST", {}, "resident")).status,
    201,
  );
  assert.equal(
    (await call("/events/event-2/join", "POST", {}, "resident")).status,
    409,
  );
  assert.equal(
    (await call("/events/event-2/join", "DELETE", null, "resident")).status,
    204,
  );
  assert.equal(
    (await call("/events/event-2", "GET", null, "resident")).data
      .attendee_count,
    0,
  );
});
test("profile update, loan ownership, report aggregate and user detail privacy", async () => {
  assert.equal(
    (
      await call(
        "/auth/me",
        "PATCH",
        { full_name: "สมาชิกแก้ไขข้อมูล", phone: "0811111111" },
        "resident",
      )
    ).data.full_name,
    "สมาชิกแก้ไขข้อมูล",
  );
  assert.equal(
    (await call("/loans/loan-demo", "GET", null, "resident")).status,
    200,
  );
  const n = await call("/auth/login", "POST", {
    email: "neighbor@village.demo",
    password: "Village@123",
  });
  assert.equal(
    (await call("/loans/loan-demo", "GET", null, n.data.token)).status,
    403,
  );
  const report = await call("/reports/summary", "GET", null, "juristic");
  assert.equal(report.status, 200);
  assert.ok(report.data.by_category.length >= 6);
  assert.equal(
    (await call("/users/resident-demo", "GET", null, "admin")).data
      .password_hash,
    undefined,
  );
});
