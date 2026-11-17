import { writeFile, mkdir } from "node:fs/promises";
import { tables, tableSql, closeDb } from "../src/db.js";
import { routes, openapi } from "../src/api.js";
await mkdir("docs", { recursive: true });
await writeFile(
  "database/schema.mysql.sql",
  `-- MySQL 8.0+ / InnoDB / utf8mb4\n-- Run in a fresh village_portal database, or use npm run db:init.\nCREATE DATABASE IF NOT EXISTS village_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE village_portal;\n\n` +
    tables.map((t) => tableSql(t, "mysql") + ";").join("\n\n") +
    `\n\nCREATE INDEX idx_posts_created ON community_posts(created_at);\nCREATE INDEX idx_posts_filter ON community_posts(categories_id,status);\nCREATE INDEX idx_loans_owner ON loans(users_id,status);\nCREATE INDEX idx_notifications_owner ON notifications(users_id,is_read);\nCREATE INDEX idx_history_post ON post_history(post_id,created_at);\n`,
);
await writeFile("docs/openapi.json", JSON.stringify(openapi(), null, 2));
const lines = [
  "# API Reference",
  "",
  `${routes.length} endpoints, ไม่นับ GET /api/v1/openapi.json. เอกสารแบบทดลองเรียกได้อยู่ที่ /docs หลังเปิดเซิร์ฟเวอร์`,
  "",
  "Public = ทั่วไป; Resident = สมาชิกที่ล็อกอินทุกบทบาท; Owner = เจ้าของรายการหรือ Admin; Staff = นิติบุคคลหรือ Admin; Admin = ผู้ดูแลระบบ",
  "",
  "| # | Method | Path | สิทธิ์ | การทำงาน |",
  "|---|---|---|---|---|",
  ...routes.map(
    (r, i) =>
      `| ${i + 1} | ${r.method} | \`/api/v1${r.path}\` | ${r.access} | ${r.summary} |`,
  ),
  "",
  "## Response format",
  "",
  "```json",
  '{"data": {"example": "result"}}',
  '{"error": {"code": "FORBIDDEN", "message": "เฉพาะผู้ดูแลระบบ"}}',
  "```",
  "",
  "GET /posts, /loans, /users, /audit-logs คืน {items,total,limit,offset} ใน data; limit สูงสุด 100. /posts รองรับ q, type, category, status, mine.",
  "",
  "POST สร้างทรัพยากรคืน 201; login/logout คืน 200; PATCH/GET คืน 200; DELETE คืน 204 ไม่มี body. ข้อผิดพลาด 400/401/403/404/409/413/415/422/429.",
  "",
  "JWT รับจาก POST /auth/login ใช้ Authorization: Bearer <token> หรือ HttpOnly cookie. Token อายุ 8 ชั่วโมง; logout/เปลี่ยนรหัสผ่าน/เปลี่ยนบทบาท/ระงับบัญชีเพิกถอนได้จริง.",
  "",
  "ตัวอย่าง request body ดู openapi.json หรือ Postman collection; แทน :id ด้วยรหัสจริงจาก response ไม่ใช่เลขลำดับรายการ.",
];
await writeFile("docs/API.md", lines.join("\n"));
const items = routes.map((r) => ({
  name: r.method + " " + r.path + " — " + r.summary,
  request: {
    method: r.method,
    header: r.body ? [{ key: "Content-Type", value: "application/json" }] : [],
    auth:
      r.access === "public"
        ? { type: "noauth" }
        : {
            type: "bearer",
            bearer: [{ key: "token", value: "{{token}}", type: "string" }],
          },
    url: {
      raw: "{{baseUrl}}/api/v1" + r.path.replace(/:id/g, "{{id}}"),
      host: ["{{baseUrl}}"],
      path: [
        "api",
        "v1",
        ...r.path.slice(1).replace(/:id/g, "{{id}}").split("/"),
      ],
    },
    ...(r.body
      ? {
          body: {
            mode: "raw",
            raw: JSON.stringify(r.body, null, 2),
            options: { raw: { language: "json" } },
          },
        }
      : {}),
  },
  ...(r.path === "/auth/login"
    ? {
        event: [
          {
            listen: "test",
            script: {
              type: "text/javascript",
              exec: [
                "if (pm.response.code === 200) pm.collectionVariables.set('token', pm.response.json().data.token);",
              ],
            },
          },
        ],
      }
    : {}),
}));
await writeFile(
  "docs/Village.postman_collection.json",
  JSON.stringify(
    {
      info: {
        name: "Village Community Portal — 55 APIs",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [
        { key: "baseUrl", value: "http://127.0.0.1:3000" },
        { key: "token", value: "" },
        { key: "id", value: "post-1" },
      ],
      item: items,
    },
    null,
    2,
  ),
);
console.log("Generated SQL, OpenAPI, API reference and Postman collection.");
await closeDb();
