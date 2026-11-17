import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
  randomUUID,
} from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dataDir, db } from "./db.js";
import path from "node:path";
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
const production = process.env.NODE_ENV === "production";
if (
  production &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
)
  throw new Error("Production requires JWT_SECRET of at least 32 characters");
const secretFile = path.join(dataDir, ".jwt-secret");
if (!process.env.JWT_SECRET && !existsSync(secretFile))
  writeFileSync(secretFile, randomBytes(48).toString("hex"), { mode: 0o600 });
const secret = process.env.JWT_SECRET || readFileSync(secretFile, "utf8");
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, hash) {
  const [salt, digest] = hash.split(":");
  const computed = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return (
    expected.length === computed.length && timingSafeEqual(expected, computed)
  );
}
export function fail(status, message, code = "VALIDATION_ERROR") {
  throw Object.assign(new Error(message), { status, code });
}
export function text(value, field, min = 1, max = 1000) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(422, `${field}: ต้องมีความยาว ${min}–${max} ตัวอักษร`);
  return value.trim();
}
export function integer(value, field, min = 1, max = 10000) {
  if (!Number.isInteger(value) || value < min || value > max)
    fail(422, `${field}: ต้องเป็นจำนวนเต็ม ${min}–${max}`);
  return value;
}
export const safeUser = (u) => {
  const { password_hash, ...user } = u;
  return user;
};
const encode = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (s) => createHmac("sha256", secret).update(s).digest("base64url");
export async function issue(user) {
  const jti = id(),
    exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
  await db.run("INSERT INTO sessions (id,users_id,expires_at) VALUES (?,?,?)", [
    jti,
    user.users_id,
    exp,
  ]);
  const raw = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.users_id, jti, exp, iat: Math.floor(Date.now() / 1000) })}`;
  return `${raw}.${sign(raw)}`;
}
export async function authenticate(req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("village_session="))
    ?.slice(16);
  const token = req.headers.authorization?.replace(/^Bearer /, "") || cookie;
  if (!token) fail(401, "กรุณาเข้าสู่ระบบ", "UNAUTHORIZED");
  try {
    const [a, b, c, ...extra] = token.split(".");
    if (extra.length || !c) throw Error();
    const expected = Buffer.from(sign(`${a}.${b}`));
    const actual = Buffer.from(c);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw Error();
    const header = JSON.parse(Buffer.from(a, "base64url"));
    const payload = JSON.parse(Buffer.from(b, "base64url"));
    if (header.alg !== "HS256" || payload.exp <= Date.now() / 1000)
      throw Error();
    const session = await db.get(
      "SELECT * FROM sessions WHERE id=? AND users_id=? AND expires_at>?",
      [payload.jti, payload.sub, Math.floor(Date.now() / 1000)],
    );
    const user = await db.get(
      "SELECT * FROM users WHERE users_id=? AND active=1",
      [payload.sub],
    );
    if (!session || !user) throw Error();
    req.sessionId = payload.jti;
    return user;
  } catch {
    fail(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง", "UNAUTHORIZED");
  }
}
export const cookie = (token) =>
  `village_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 28800 : 0}${production ? "; Secure" : ""}`;
export function staff(u) {
  return ["admin", "juristic"].includes(u.role);
}
export function requireStaff(u) {
  if (!staff(u)) fail(403, "เฉพาะนิติบุคคลหรือผู้ดูแลระบบ", "FORBIDDEN");
}
export function owner(u, ownerId) {
  if (u.users_id !== ownerId && u.role !== "admin")
    fail(403, "คุณไม่มีสิทธิ์แก้ไขรายการนี้", "FORBIDDEN");
}
