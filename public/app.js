const $ = (s, r = document) => r.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
  grid: "M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  file: "M6 3h9l4 4v14H5V3Zm8 0v5h5M8 12h8M8 16h6",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  check: "m5 12 4 4L19 6",
  circlecheck: "M22 11v1a10 10 0 1 1-6-9M8 11l4 4L22 5",
  alert: "m12 3 10 18H2ZM12 9v5m0 3v.1",
  box: "m3 7 9-4 9 4v10l-9 4-9-4ZM3 7l9 5 9-5m-9 5v9m-5-16 9 5",
  speaker:
    "M4 3h16v18H4Zm11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm1 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  chair: "M6 3v10h12V3M5 8h14M4 13v4h16v-4M6 17v4m12-4v4",
  table: "M2 7h20v4H2Zm3 4v10m14-10v10M7 3h10",
  tent: "m12 3 10 17H2Zm0 0v17m0-10 6 10",
  plant:
    "M12 21V9m0 5C4 14 2 9 3 4c7-1 10 3 9 10Zm0-2c0-7 5-9 10-8 0 6-4 9-10 8",
  paw: "M8 14c-5 5-3 9 1 7l3-1 3 1c4 2 6-2 1-7-2-3-6-3-8 0ZM5 9c2 0 2-5 0-5s-2 5 0 5Zm5-2c2 0 2-6 0-6s-2 6 0 6Zm5 0c2 0 2-6 0-6s-2 6 0 6Zm5 2c2 0 2-5 0-5s-2 5 0 5",
  calendar: "M4 5h16v16H4Zm4-3v6m8-6v6M4 10h16M8 14h2m4 0h2m-8 3h2",
  chart: "M3 3v18h18M7 17v-5m5 5V7m5 10V3",
  users:
    "M16 21v-2c0-5-12-5-12 0v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm5-4c4 1 4 7 0 8m1 4c3 0 4 3 3 6",
  user: "M20 21v-2c0-5-16-5-16 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  logout: "M9 3H3v18h6m-1-9h14m-5-5 5 5-5 5",
  code: "m8 5-6 7 6 7m8-14 6 7-6 7m-3-17-2 20",
  chat: "M21 3H3v14h5v5l6-5h7Z",
  menu: "M3 5h18M3 12h18M3 19h18",
  x: "m6 6 12 12M6 18 18 6",
  edit: "m16 3 5 5-12 12-6 1 1-6ZM13 6l5 5",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  light: "m13 2-9 12h7l-1 8 10-13h-8Z",
  megaphone: "m3 10 15-6v16L3 14Zm3 5 2 6h4l-2-5m11-7v6",
  heart: "M20 4c-4-3-8 2-8 2S8 1 4 4c-7 5 8 17 8 17S27 9 20 4Z",
  shield: "m12 2 9 4v7c0 6-9 10-9 10S3 19 3 13V6Zm-5 10 3 3 7-7",
};
const icon = (n, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n] || paths.file}"/></svg>`;
const statusNames = {
  pending: "รอรับเรื่อง",
  in_progress: "กำลังดำเนินการ",
  resolved: "เสร็จสิ้น",
  borrowed: "กำลังยืม",
  returned: "คืนแล้ว",
};
const roles = {
  resident: "ลูกบ้าน",
  juristic: "นิติบุคคล",
  admin: "ผู้ดูแลระบบ",
};
const badge = (s) =>
  `<span class="badge ${esc(s)}">${icon(["resolved", "returned"].includes(s) ? "check" : s === "pending" ? "clock" : "file")}<span>${esc(statusNames[s] || s)}</span></span>`;
const date = (v, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  new Date(v).toLocaleDateString("th-TH", opts);
const dateTime = (v) =>
  new Date(v).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const shortDate = (v) => date(v, { day: "numeric", month: "short" });
const todayISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
let state = {
  user: null,
  page: "dashboard",
  demo: false,
  categories: [],
  filter: {},
  offset: 0,
};
let renderVersion = 0;
const isStaff = () => ["juristic", "admin"].includes(state.user?.role);
const isAdmin = () => state.user?.role === "admin";
async function api(path, method = "GET", body) {
  const res = await fetch("/api/v1" + path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const j = await res.json();
  if (!res.ok) {
    if (res.status === 401 && state.user) {
      state.user = null;
      closeModal();
      renderAuth();
    }
    throw Error(j.error?.message || "ไม่สามารถเชื่อมต่อระบบได้");
  }
  return j.data;
}
let toastTimer;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4000);
}
function brand() {
  return `<div class="brand"><span class="brand-mark">${icon("home")}</span><div><strong>บ้านเดียวกัน</strong><small>ศูนย์ชุมชนหมู่บ้านจัดสรร</small></div></div>`;
}
function errorHtml(e) {
  return `<div class="error" role="alert">${esc(e.message)}</div>`;
}
function field(name, label, type = "text", value = "", extra = "") {
  return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra} required></div>`;
}
function textarea(name, label, value = "", extra = "") {
  return `<div class="field"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" ${extra} required>${esc(value)}</textarea></div>`;
}
function select(name, label, options, value) {
  return `<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
}
function formData(form) {
  return Object.fromEntries(new FormData(form));
}
function renderAuth(register = false) {
  document.body.classList.remove("nav-open");
  delete document.body.dataset.page;
  $("#app").innerHTML =
    `<div class="auth"><section class="auth-story">${brand()}<div><h1>ชุมชนที่น่าอยู่<br>เริ่มที่เราทุกคน</h1><p>พื้นที่เดียวสำหรับทุกเรื่องในหมู่บ้าน<br>แจ้งปัญหา แบ่งปัน และดูแลกันได้ง่ายขึ้น</p></div><img src="/community-day.svg" alt="ภาพประกอบหมู่บ้านและพื้นที่สีเขียว"><div class="auth-foot"><span>เชื่อมต่อเพื่อนบ้าน ให้ใกล้กันกว่าเดิม</span><span>สำหรับลูกบ้านและนิติบุคคล</span></div></section><main class="auth-form" id="main" tabindex="-1"><div><span class="eyebrow muted">ศูนย์ชุมชนออนไลน์</span><h2>${register ? "สมัครเป็นสมาชิก" : "ยินดีต้อนรับกลับบ้าน"}</h2><p class="muted">${register ? "สร้างบัญชีลูกบ้านเพื่อเริ่มใช้งานศูนย์ชุมชน" : "เข้าสู่ระบบเพื่อดูแลเรื่องราวในชุมชนของคุณ"}</p><form id="auth-form">${register ? field("full_name", "ชื่อ–นามสกุล", "text", "", 'minlength="2" maxlength="100" autocomplete="name"') + `<div class="form-row">${field("house_number", "บ้านเลขที่", "text", "", 'maxlength="20"')}${field("phone", "เบอร์โทรศัพท์", "tel", "", 'pattern="[0-9+\-]{9,15}" maxlength="15" autocomplete="tel"')}</div>` : ""}${field("email", "อีเมล", "email", "", 'autocomplete="email" maxlength="150" placeholder="name@example.com"')}${field("password", "รหัสผ่าน", "password", "", 'autocomplete="' + (register ? "new-password" : "current-password") + '" ' + (register ? 'minlength="10"' : "") + ' maxlength="128" placeholder="' + (register ? "อย่างน้อย 10 ตัวอักษร" : "กรอกรหัสผ่าน") + '"')}<div class="error" id="auth-error" role="alert"></div><button class="btn primary full" type="submit">${register ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}${icon("arrow")}</button></form><p class="auth-toggle small">${register ? "มีบัญชีแล้ว?" : "ยังไม่มีบัญชี?"} <button class="btn subtle sm" id="auth-toggle">${register ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</button></p>${state.demo && !register ? `<div class="demo-box"><strong class="small">ทดลองใช้งานด้วยข้อมูลสาธิต</strong><p class="small muted">เลือกบทบาทเพื่อสำรวจการทำงานของระบบ</p><div class="demo-buttons">${["resident", "juristic", "admin"].map((r) => `<button class="btn sm" data-demo="${r}">${roles[r]}</button>`).join("")}</div><p class="small muted">รหัสผ่านทุกบัญชี: <span class="code">Village@123</span></p></div>` : ""}<p class="small muted" style="margin-top:22px">${icon("shield")} บัญชีลูกบ้านเข้าถึงเฉพาะข้อมูลที่มีสิทธิ์ใช้งาน</p></div></main></div>`;
  $("#auth-toggle").onclick = () => renderAuth(!register);
  $("#auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      button = $("button[type=submit]", form);
    button.disabled = true;
    try {
      const data = await api(
        register ? "/auth/register" : "/auth/login",
        "POST",
        formData(form),
      );
      state.user = data.user;
      state.page = "dashboard";
      state.categories = await api("/categories");
      location.hash = "dashboard";
      await renderShell();
    } catch (err) {
      $("#auth-error").textContent = err.message;
      button.disabled = false;
    }
  };
  document.querySelectorAll("[data-demo]").forEach(
    (button) =>
      (button.onclick = () => {
        $("#f-email").value = button.dataset.demo + "@village.demo";
        $("#f-password").value = "Village@123";
        $("#auth-form").requestSubmit();
      }),
  );
}
const navItems = [
  ["dashboard", "grid", "ภาพรวมชุมชน"],
  ["posts", "file", "แจ้งปัญหา / ติดตามเรื่อง"],
  ["lost", "paw", "สัตว์เลี้ยงและของหาย"],
  ["equipment", "box", "ยืม–คืนอุปกรณ์"],
  ["loans", "clock", "รายการยืมของฉัน"],
  ["announcements", "megaphone", "ข่าวสารและประกาศ"],
  ["events", "calendar", "กิจกรรมชุมชน"],
];
const titleFor = () =>
  [
    ...navItems,
    ["reports", "", "สถิติและรายงาน"],
    ["users", "", "จัดการสมาชิก"],
    ["audit", "", "ประวัติการดำเนินงาน"],
    ["notifications", "", "การแจ้งเตือน"],
    ["profile", "", "ข้อมูลส่วนตัว"],
  ].find((n) => n[0] === state.page)?.[2] || "ภาพรวมชุมชน";
function nav(page, i, label) {
  return `<a href="#${page}" class="nav-link ${state.page === page ? "active" : ""}" ${state.page === page ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span></a>`;
}
function updateUnread(count) {
  state.unread = count;
  const dot = $("#notification-dot");
  if (dot) {
    dot.className = count ? "notification-dot" : "";
    dot.textContent = count ? String(Math.min(count, 99)) : "";
  }
}
async function refreshUnread() {
  const userId = state.user?.users_id;
  try {
    const items = await api("/notifications");
    if (state.user?.users_id === userId)
      updateUnread(items.filter((n) => !n.is_read).length);
  } catch {
    /* The current page already reports connection or session errors. */
  }
}
function setMenu(open, moveFocus = true) {
  const side = $(".sidebar");
  if (!side) return;
  const mobile = matchMedia("(max-width: 1000px)").matches;
  open = mobile && open;
  side.classList.toggle("open", open);
  side.inert = mobile && !open;
  const workspace = $(".workspace");
  if (workspace) workspace.inert = open;
  const scrim = $(".nav-scrim");
  if (scrim) scrim.hidden = !open;
  document.body.classList.toggle("nav-open", open);
  const trigger = $(".mobile-menu");
  trigger?.setAttribute("aria-expanded", String(open));
  if (moveFocus) (open ? $(".nav-link", side) : trigger)?.focus();
}
matchMedia("(max-width: 1000px)").addEventListener("change", () =>
  setMenu(false, false),
);
async function renderShell() {
  if (!state.user) return renderAuth();
  document.body.classList.remove("nav-open");
  document.body.dataset.page = state.page;
  $("#app").innerHTML = `
    <div class="shell">
      <button class="nav-scrim" hidden data-action="close-menu" aria-label="ปิดเมนู"></button>
      <aside class="sidebar" id="primary-navigation" aria-label="เมนูหลัก">
        <div class="side-brand">${brand()}<button class="icon-btn nav-close" data-action="close-menu" aria-label="ปิดเมนู">${icon("x")}</button></div>
        <nav aria-label="ภาพรวม">${nav("dashboard", "grid", "ภาพรวมชุมชน")}</nav>
        <div class="nav-group">แจ้งเรื่องและช่วยเหลือ</div>
        <nav aria-label="แจ้งเรื่องและช่วยเหลือ">${nav("posts", "chat", "แจ้งปัญหา / ติดตามเรื่อง")}${nav("lost", "paw", "สัตว์เลี้ยงและของหาย")}</nav>
        <div class="nav-group">ทรัพยากรส่วนกลาง</div>
        <nav aria-label="ทรัพยากรส่วนกลาง">${nav("equipment", "box", "ยืม–คืนอุปกรณ์")}${nav("loans", "clock", isStaff() ? "รายการยืม–คืนทั้งหมด" : "รายการยืมของฉัน")}</nav>
        <div class="nav-group">ข่าวสารและกิจกรรม</div>
        <nav aria-label="ข่าวสารและกิจกรรม">${nav("announcements", "megaphone", "ข่าวสารและประกาศ")}${nav("events", "calendar", "กิจกรรมชุมชน")}</nav>
        ${isStaff() ? `<div class="nav-group">สำหรับ${roles[state.user.role]}</div><nav>${nav("reports", "chart", "สถิติและรายงาน")}${isAdmin() ? nav("users", "users", "จัดการสมาชิก") + nav("audit", "shield", "ประวัติการดำเนินงาน") : ""}</nav>` : ""}
        <div class="side-bottom">
          <div class="help-box"><strong>ติดต่อฝ่ายนิติบุคคล</strong><p>ส่งเรื่องและติดตามการตอบกลับ<br>ผ่านศูนย์ชุมชนได้โดยตรง</p><button class="btn sm full" data-action="new-post">${icon("chat")}ส่งเรื่องถึงนิติบุคคล ${icon("arrow")}</button></div>
          ${state.demo || isAdmin() ? `<a class="nav-link" href="/docs" target="_blank" rel="noopener">${icon("code")}เอกสาร API</a>` : ""}
          <button class="nav-link full" data-action="logout" style="background:none;border:0;text-align:left">${icon("logout")}ออกจากระบบ</button>
          <div class="sidebar-foot">บ้านเดียวกัน · ชุมชนของเรา</div>
        </div>
      </aside>
      <div class="workspace">
        <header class="topbar"><div class="breadcrumb"><button class="icon-btn mobile-menu" data-action="menu" aria-label="เปิดเมนู" aria-controls="primary-navigation" aria-expanded="false">${icon("menu")}</button><span>ศูนย์ชุมชน</span>${icon("chevron")}<b>${titleFor()}</b></div>
          <div class="top-actions"><button class="icon-btn notification-button" data-go="notifications" aria-label="การแจ้งเตือน">${icon("bell")}<span id="notification-dot" aria-hidden="true"></span></button><span class="top-divider"></span><button class="user-button" data-go="profile" aria-label="ข้อมูลส่วนตัวของ ${esc(state.user.full_name)}"><span class="avatar">${esc(state.user.full_name.slice(0, 1))}</span><span class="user-text"><strong>${esc(state.user.full_name)}</strong><small>${roles[state.user.role]} · ${esc(state.user.house_number)}</small></span>${icon("down")}</button></div>
        </header>
        <main id="main" tabindex="-1"><div id="page-content" aria-busy="true"><div class="loading">กำลังโหลดข้อมูล…</div></div><footer class="page-footer"><span>บ้านเดียวกัน — ศูนย์ชุมชนหมู่บ้านจัดสรร</span><span>${roles[state.user.role]} · บ้านเลขที่ ${esc(state.user.house_number)}</span></footer></main>
      </div>
    </div>`;
  setMenu(false, false);
  updateUnread(state.unread || 0);
  await renderPage();
  if (state.page !== "dashboard") void refreshUnread();
}
function heading(title, desc, action = "") {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;
}
function createButton(action, label) {
  return `<button class="btn primary" data-action="${action}">${icon("plus")}${label}</button>`;
}
function postIcon(p) {
  return p.category_type === "lost"
    ? "paw"
    : Number(p.categories_id) === 1
      ? "light"
      : Number(p.categories_id) === 3
        ? "shield"
        : "file";
}
function postRow(p) {
  return `<div class="post-row" role="button" tabindex="0" data-post="${esc(p.community_posts_id)}"><div class="post-category-icon">${icon(postIcon(p))}</div><div><div class="post-title">${esc(p.title)}</div><div class="post-meta">${icon("pin")}${esc(p.location_note)}<span>·</span>${shortDate(p.created_at)}</div></div>${badge(p.status)}</div>`;
}
const dateBlock = (v) =>
  `<div class="date-block"><strong>${new Date(v).getDate()}</strong><small>${date(v, { month: "short" })}</small></div>`;
async function dashboard() {
  const [d, anns, events] = await Promise.all([
    api("/dashboard"),
    api("/announcements"),
    api("/events"),
  ]);
  updateUnread(d.unread);
  const total = Object.values(d.counts).reduce((a, b) => a + b, 0);
  const rate = total ? Math.round((d.counts.resolved / total) * 100) : 0;
  const stats = [
    ["รอรับเรื่อง", d.counts.pending, "รายการ", "รอเจ้าหน้าที่ตรวจสอบ", "file"],
    [
      "กำลังดำเนินการ",
      d.counts.in_progress,
      "รายการ",
      "เจ้าหน้าที่กำลังดูแล",
      "clock",
    ],
    [
      "ดำเนินการแล้ว",
      d.counts.resolved,
      "รายการ",
      `${rate}% ของเรื่องทั้งหมด`,
      "circlecheck",
    ],
    [
      "อุปกรณ์พร้อมยืม",
      d.equipment.available,
      "ชิ้น",
      `เลือกได้ ${d.equipment.types} ประเภท`,
      "box",
    ],
  ];
  const upcoming = events
    .filter((e) => Date.parse(e.starts_at) > Date.now())
    .slice(0, 2);
  return `
    ${heading("ภาพรวมชุมชน", `สวัสดี คุณ${esc(state.user.full_name.split(" ")[0])} วันนี้ให้เราช่วยดูแลเรื่องอะไรดี?`, `<div class="today">${icon("calendar")}${date(new Date(), { day: "numeric", month: "long", year: "numeric" })}</div>`)}
    <div class="dashboard-intro"><section class="hero" aria-label="บริการศูนย์ชุมชน">
      <div class="hero-content"><div class="eyebrow">ศูนย์ชุมชนหมู่บ้านจัดสรร</div><h2>พื้นที่ของเรา<br><span>ดูแลด้วยกัน</span></h2><p>แจ้งปัญหา แบ่งปันอุปกรณ์ และติดตามข่าวสาร<br>ให้ทุกเรื่องในหมู่บ้านเป็นเรื่องง่าย</p><div class="hero-buttons"><button class="btn primary" data-action="new-post">${icon("plus")}แจ้งเรื่องใหม่</button><a href="#posts?mine=true">ติดตามเรื่องของฉัน ${icon("arrow")}</a></div></div>
      <img src="/community-day.svg" alt="ภาพลายเส้นบ้านและพื้นที่ส่วนกลางในชุมชน">
    </section>
    <section class="service-grid" aria-label="บริการหลัก">
      <button class="service-card" data-action="new-post"><span class="service-symbol">${icon("chat")}</span><div><strong>แจ้งปัญหา</strong><small>ส่งเรื่องให้นิติบุคคลช่วยดูแล</small></div>${icon("arrow")}</button>
      <button class="service-card" data-action="new-lost"><span class="service-symbol">${icon("paw")}</span><div><strong>ประกาศของหาย</strong><small>ตามหาสิ่งของและสัตว์เลี้ยง</small></div>${icon("arrow")}</button>
      <button class="service-card" data-go="equipment"><span class="service-symbol">${icon("box")}</span><div><strong>ยืมอุปกรณ์</strong><small>ใช้ทรัพยากรส่วนกลางร่วมกัน</small></div>${icon("arrow")}</button>
    </section></div>
    <section class="stats" aria-label="สถิติชุมชน">${stats.map(([label, value, unit, note, i]) => `<div class="stat"><div class="stat-icon">${icon(i)}</div><div class="stat-label">${label}</div><div class="stat-value">${value}<span>${unit}</span></div><div class="stat-note">${note}</div></div>`).join("")}</section>
    <div class="content-grid">
      <div>
        <section class="panel"><div class="panel-head"><div><h2>เรื่องล่าสุดในชุมชน</h2><p>ติดตามสิ่งที่เกิดขึ้นและความคืบหน้าล่าสุด</p></div><a href="#posts">ดูทั้งหมด ${icon("arrow")}</a></div>${d.recent_posts.length ? d.recent_posts.map(postRow).join("") : '<div class="empty">ยังไม่มีเรื่องในชุมชน</div>'}</section>
        <section class="panel section-gap"><div class="panel-head"><h2>รายการของคุณ</h2>${icon("user")}</div><div class="personal-links"><a class="personal-link" href="#posts?mine=true"><div><strong>${d.my_posts}</strong><span>เรื่องที่คุณแจ้ง</span></div>${icon("arrow")}</a><a class="personal-link" href="#loans"><div><strong>${d.my_loans}</strong><span>รายการที่กำลังยืม</span></div>${icon("arrow")}</a></div></section>
      </div>
      <div class="right-column">
        <section class="panel news-panel"><div class="panel-head"><h2>ประกาศจากนิติบุคคล</h2><a href="#announcements">ทั้งหมด ${icon("arrow")}</a></div><div class="panel-body">${
          anns
            .slice(0, 2)
            .map(
              (a) =>
                `<article class="announcement-preview" role="button" tabindex="0" data-ann="${esc(a.id)}">${a.pinned ? `<span class="badge in_progress">${icon("pin")}ประกาศปักหมุด</span>` : ""}<h3>${esc(a.title)}</h3><p>${esc(a.body)}</p><div class="announcement-date">${shortDate(a.created_at)}</div></article>`,
            )
            .join("") || '<p class="muted">ยังไม่มีประกาศ</p>'
        }</div></section>
        <section class="panel section-gap events-panel"><div class="panel-head"><h2>กิจกรรมเร็ว ๆ นี้</h2><a href="#events">ทั้งหมด ${icon("arrow")}</a></div><div class="panel-body">${upcoming.map((e) => `<div class="event-mini">${dateBlock(e.starts_at)}<div><h3>${esc(e.title)}</h3><p>${esc(e.location)}</p><a href="#events">ดูรายละเอียด ${icon("arrow")}</a></div></div>`).join("") || '<p class="muted">ยังไม่มีกิจกรรมที่กำลังจะมาถึง</p>'}</div></section>
      </div>
    </div>
    ${state.demo ? `<div class="demo-strip"><span>${icon("shield")}ข้อมูลสาธิตสำหรับทดลองใช้งานระบบ</span><a href="/docs" target="_blank" rel="noopener">เอกสาร API ${icon("arrow")}</a></div>` : ""}`;
}
function postFilters(lost) {
  return `<form id="post-filter" class="filter"><div class="search">${icon("search")}<input name="q" aria-label="ค้นหาเรื่อง" placeholder="ค้นหาหัวข้อ รายละเอียด หรือสถานที่…" value="${esc(state.filter.q || "")}"></div><select name="category" aria-label="หมวดหมู่"><option value="">ทุกหมวดหมู่</option>${state.categories
    .filter((c) => c.type === (lost ? "lost" : "issue"))
    .map(
      (c) =>
        `<option value="${c.categories_id}" ${String(c.categories_id) === state.filter.category ? "selected" : ""}>${esc(c.name)}</option>`,
    )
    .join(
      "",
    )}</select><select name="status" aria-label="สถานะ"><option value="">ทุกสถานะ</option>${Object.entries(
    statusNames,
  )
    .slice(0, 3)
    .map(
      ([v, l]) =>
        `<option value="${v}" ${state.filter.status === v ? "selected" : ""}>${l}</option>`,
    )
    .join("")}</select><button class="btn" type="submit">ค้นหา</button></form>`;
}
function pager(total) {
  return `<div class="pager"><span>แสดง ${total ? state.offset + 1 : 0}–${Math.min(state.offset + 12, total)} จาก ${total} รายการ</span><div><button class="btn sm" data-action="prev" ${state.offset === 0 ? "disabled" : ""}>ก่อนหน้า</button> <button class="btn sm" data-action="next" ${state.offset + 12 >= total ? "disabled" : ""}>ถัดไป</button></div></div>`;
}
async function posts(lost = false) {
  const params = new URLSearchParams({
    ...state.filter,
    type: lost ? "lost" : "issue",
    limit: 12,
    offset: state.offset,
  });
  const d = await api("/posts?" + params);
  return (
    heading(
      lost ? "เพื่อนบ้านช่วยตามหา" : "แจ้งปัญหาและติดตามเรื่อง",
      lost
        ? "ประกาศสัตว์เลี้ยงหาย ของหาย หรือส่งคืนสิ่งของให้เจ้าของ"
        : "ส่งเรื่องให้นิติบุคคล พร้อมติดตามประวัติการดำเนินงาน",
      createButton(
        lost ? "new-lost" : "new-post",
        lost ? "สร้างประกาศ" : "แจ้งเรื่องใหม่",
      ),
    ) +
    `<div class="tabs"><button class="tab ${!state.filter.mine ? "active" : ""}" data-mine="false">เรื่องทั้งหมด</button><button class="tab ${state.filter.mine ? "active" : ""}" data-mine="true">เรื่องของฉัน</button></div>` +
    postFilters(lost) +
    `<div class="results-summary"><span>พบ ${d.total} รายการ</span>${Object.values(state.filter).some(Boolean) ? '<button class="btn subtle sm" data-action="reset-filters">ล้างตัวกรอง</button>' : ""}</div>` +
    d.items
      .map(
        (p) =>
          `<article class="list-card" role="button" tabindex="0" data-post="${esc(p.community_posts_id)}"><div class="list-card-top"><span class="small muted">${icon(postIcon(p))} ${esc(p.category_name)}</span><div>${p.priority === "high" ? '<span class="badge high">เร่งด่วน</span> ' : ""}${badge(p.status)}</div></div><h3>${esc(p.title)}</h3><p>${esc(p.description.length > 180 ? p.description.slice(0, 180) + "…" : p.description)}</p><div class="list-card-bottom"><span>${icon("pin")} ${esc(p.location_note)} · ${esc(p.author_name)}</span><span>${icon("chat")} ${p.comment_count} · ${shortDate(p.created_at)}</span></div></article>`,
      )
      .join("") +
    (d.items.length
      ? ""
      : `<div class="panel empty">${icon("search")}<h3>ไม่พบรายการ</h3><p>ลองเปลี่ยนคำค้นหา หรือสร้างเรื่องใหม่ได้เลย</p></div>`) +
    pager(d.total)
  );
}
async function equipment() {
  const data = await api("/equipment");
  return (
    heading(
      "อุปกรณ์ส่วนกลาง",
      "ใช้ร่วมกันอย่างคุ้มค่า ตรวจสอบจำนวนพร้อมยืมและกำหนดคืนได้ทันที",
      isStaff() ? createButton("new-equipment", "เพิ่มอุปกรณ์") : "",
    ) +
    `<div class="notice">${icon("box")} ยืมได้ครั้งละไม่เกิน 100 ชิ้น และกำหนดคืนภายใน 30 วัน กรุณาส่งคืนที่สำนักงานเพื่อให้เจ้าหน้าที่ตรวจรับ</div><div class="cards">${data
      .filter((e) => e.active)
      .map(
        (e) =>
          `<article class="resource-card"><div class="equipment-art">${icon(e.icon)}<span class="badge ${e.available ? "resolved" : "pending"}">${e.available ? "พร้อมยืม" : "ถูกยืมทั้งหมด"}</span></div><div class="resource-content"><h3>${esc(e.name)}</h3><p>${esc(e.description)}</p><div class="stock-line"><span>พร้อมยืม</span><strong>${e.available} / ${e.total} ชิ้น</strong></div><div class="progress"><i style="--progress:${e.total ? (e.available / e.total) * 100 : 0}%"></i></div><button class="btn primary" data-borrow="${esc(e.id)}" ${e.available ? "" : "disabled"}>${icon("plus")}ยืมอุปกรณ์</button>${isStaff() ? `<div class="card-actions"><button class="btn sm" data-edit-equipment="${esc(e.id)}">แก้ไข</button><button class="btn sm" data-archive-equipment="${esc(e.id)}">ปิดใช้งาน</button></div>` : ""}</div></article>`,
      )
      .join(
        "",
      )}</div>${data.length ? "" : '<div class="empty">ยังไม่มีอุปกรณ์ส่วนกลาง</div>'}`
  );
}
async function loans() {
  const d = await api("/loans?limit=12&offset=" + state.offset);
  return (
    heading(
      isStaff() ? "รายการยืม–คืนอุปกรณ์" : "รายการยืมของฉัน",
      isStaff()
        ? "ตรวจสอบกำหนดคืน และรับคืนอุปกรณ์เมื่อได้รับของจริงแล้ว"
        : "ตรวจสอบรายการที่ยืมและกำหนดส่งคืน",
      `<a class="btn primary" href="#equipment">${icon("box")}ยืมอุปกรณ์</a>`,
    ) +
    `<div class="panel table-wrap"><table><thead><tr><th>อุปกรณ์ / ผู้ยืม</th><th>จำนวน</th><th>กำหนดคืน</th><th>สถานะ</th><th>การดำเนินการ</th></tr></thead><tbody>${d.items.map((l) => `<tr><td><strong>${esc(l.equipment_name)}</strong><small>${esc(l.borrower_name)} · ${esc(l.house_number)}</small><small>${esc(l.purpose)}</small></td><td>${l.quantity}</td><td>${date(l.due_date)}${l.status === "borrowed" && l.due_date < todayISO() ? '<small class="error">เกินกำหนดคืน</small>' : ""}</td><td>${badge(l.status)}</td><td>${l.status === "borrowed" && isStaff() ? `<button class="btn sm" data-return="${esc(l.id)}">${icon("check")}รับคืน</button>` : l.returned_at ? `<span class="muted small">${date(l.returned_at)}</span>` : '<span class="muted small">คืนที่สำนักงาน</span>'}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">ยังไม่มีรายการยืม</td></tr>'}</tbody></table></div>` +
    pager(d.total)
  );
}
async function announcements() {
  const d = await api("/announcements");
  return (
    heading(
      "ข่าวสารและประกาศ",
      "ข้อมูลสำคัญจากนิติบุคคล เพื่อให้ทุกบ้านไม่พลาดข่าวในชุมชน",
      isStaff() ? createButton("new-ann", "เขียนประกาศ") : "",
    ) +
    d
      .map(
        (a) =>
          `<article class="list-card" role="button" tabindex="0" data-ann="${esc(a.id)}"><div class="list-card-top"><span class="small muted">${shortDate(a.created_at)} · ${esc(a.full_name)}</span>${a.pinned ? '<span class="badge in_progress">ปักหมุด</span>' : ""}</div><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p><div class="list-card-bottom"><span>ประกาศจากนิติบุคคล</span><span>อ่านรายละเอียด ${icon("arrow")}</span></div></article>`,
      )
      .join("") +
    (d.length ? "" : '<div class="empty">ยังไม่มีประกาศ</div>')
  );
}
async function events() {
  const data = await api("/events");
  return (
    heading(
      "พบกันในชุมชน",
      "เลือกกิจกรรมที่สนใจ แล้วมาร่วมสร้างความทรงจำกับเพื่อนบ้าน",
      isStaff() ? createButton("new-event", "สร้างกิจกรรม") : "",
    ) +
    `<div class="cards">${data.map((e) => `<article class="resource-card"><div class="resource-content"><div class="list-card-top">${dateBlock(e.starts_at)}${e.joined ? '<span class="badge resolved">ลงทะเบียนแล้ว</span>' : ""}</div><h3 style="margin-top:18px">${esc(e.title)}</h3><p>${esc(e.description)}</p><div class="small muted">${icon("pin")} ${esc(e.location)}<br>${icon("clock")} ${dateTime(e.starts_at)}</div><div class="stock-line" style="margin-top:18px"><span>ผู้เข้าร่วม</span><strong>${e.attendee_count} / ${e.capacity} คน</strong></div><div class="progress"><i style="--progress:${Math.min(100, (e.attendee_count / e.capacity) * 100)}%"></i></div><button class="btn ${e.joined ? "" : "primary"}" data-join="${esc(e.id)}" data-joined="${e.joined ? "true" : "false"}" ${Date.parse(e.starts_at) < Date.now() || (!e.joined && e.attendee_count >= e.capacity) ? "disabled" : ""}>${e.joined ? "ยกเลิกการเข้าร่วม" : Date.parse(e.starts_at) < Date.now() ? "กิจกรรมสิ้นสุดแล้ว" : e.attendee_count >= e.capacity ? "กิจกรรมเต็มแล้ว" : "เข้าร่วมกิจกรรม"}</button>${isStaff() ? `<div class="card-actions"><button class="btn sm" data-edit-event="${esc(e.id)}">แก้ไข</button><button class="btn sm" data-attendees="${esc(e.id)}">รายชื่อ</button><button class="btn sm danger" data-delete-event="${esc(e.id)}">ลบ</button></div>` : ""}</div></article>`).join("")}</div>` +
    (data.length ? "" : '<div class="empty">ยังไม่มีกิจกรรม</div>')
  );
}
async function notifications() {
  const data = await api("/notifications");
  updateUnread(data.filter((n) => !n.is_read).length);
  return (
    heading(
      "การแจ้งเตือน",
      "ติดตามความเคลื่อนไหวของเรื่องและบริการที่คุณใช้งาน",
      `<button class="btn" data-action="read-all">${icon("check")}อ่านทั้งหมด</button>`,
    ) +
    `<div class="panel">${data.map((n) => `<article class="notification-row ${n.is_read ? "" : "unread"}"><div class="post-category-icon">${icon("bell")}</div><div class="grow"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p><small class="muted">${dateTime(n.created_at)}</small><div><button class="btn subtle sm" data-notification="${esc(n.id)}" data-link="${esc(n.link)}">${n.is_read ? "ดูรายการ" : "อ่านและดูรายการ"} ${icon("arrow")}</button></div></div><button class="icon-btn" data-delete-notification="${esc(n.id)}" aria-label="ลบการแจ้งเตือน">${icon("x")}</button></article>`).join("") || '<div class="empty">ไม่มีการแจ้งเตือนใหม่</div>'}</div>`
  );
}
async function profile() {
  return (
    heading("ข้อมูลส่วนตัว", "จัดการข้อมูลติดต่อและรหัสผ่านของคุณ") +
    `<div class="profile-grid"><section class="panel"><div class="panel-head"><h2>ข้อมูลสมาชิก</h2><span class="badge in_progress">${roles[state.user.role]}</span></div><div class="panel-body"><form id="profile-form">${field("full_name", "ชื่อ–นามสกุล", "text", state.user.full_name, 'minlength="2" maxlength="100"')}${field("phone", "เบอร์โทร", "tel", state.user.phone, 'maxlength="15"')}<div class="field"><label>อีเมล</label><input value="${esc(state.user.email)}" readonly></div><div class="field"><label>บ้านเลขที่</label><input value="${esc(state.user.house_number)}" readonly><small>ติดต่อผู้ดูแลหากต้องการแก้ไขข้อมูลบ้าน</small></div><div class="error" role="alert"></div><button class="btn primary">บันทึกข้อมูล</button></form></div></section><section class="panel"><div class="panel-head"><h2>เปลี่ยนรหัสผ่าน</h2></div><div class="panel-body"><form id="password-form">${field("current_password", "รหัสผ่านปัจจุบัน", "password", "", 'autocomplete="current-password"')}${field("password", "รหัสผ่านใหม่", "password", "", 'minlength="10" maxlength="128" autocomplete="new-password"')}${field("confirm", "ยืนยันรหัสผ่านใหม่", "password", "", 'minlength="10" maxlength="128" autocomplete="new-password"')}<p class="small muted">เมื่อเปลี่ยนรหัสผ่าน ระบบจะออกจากระบบทุกอุปกรณ์</p><div class="error" role="alert"></div><button class="btn primary" style="margin-top:15px">เปลี่ยนรหัสผ่าน</button></form></div></section></div>`
  );
}
async function reports() {
  const [d, s] = await Promise.all([
    api("/reports/summary"),
    api("/dashboard"),
  ]);
  const max = Math.max(1, ...d.by_category.map((c) => Number(c.total)));
  const total = Object.values(s.counts).reduce((a, b) => a + b, 0);
  return (
    heading(
      "สถิติและรายงาน",
      "มองเห็นปัญหาที่เกิดซ้ำ เพื่อวางแผนดูแลชุมชนได้ตรงจุด",
      `<a class="btn primary" href="/api/v1/reports/export">${icon("download")}ส่งออก CSV</a>`,
    ) +
    `<div class="stats"><div class="stat"><div class="stat-label">เรื่องทั้งหมด</div><div class="stat-value">${total}<span>รายการ</span></div></div><div class="stat"><div class="stat-label">อัตราดำเนินการสำเร็จ</div><div class="stat-value">${total ? Math.round((s.counts.resolved / total) * 100) : 0}<span>%</span></div></div><div class="stat"><div class="stat-label">รายการยืมเกินกำหนด</div><div class="stat-value">${d.overdue}<span>รายการ</span></div></div><div class="stat"><div class="stat-label">สมาชิกที่เป็นลูกบ้าน</div><div class="stat-value">${s.residents}<span>บัญชี</span></div></div></div><div class="content-grid"><section class="panel"><div class="panel-head"><h2>จำนวนเรื่องในแต่ละหมวดหมู่</h2></div><div class="panel-body">${d.by_category.map((c) => `<div class="chart-bar"><span>${esc(c.name)}</span><div class="progress"><i style="--progress:${(Number(c.total) / max) * 100}%"></i></div><b>${c.total}</b></div>`).join("")}</div></section><section class="panel"><div class="panel-head"><h2>สถานะการดำเนินงาน</h2></div><div class="panel-body">${Object.entries(
      s.counts,
    )
      .map(
        ([key, n]) =>
          `<div class="chart-bar" style="grid-template-columns:110px 1fr 25px"><span>${statusNames[key]}</span><div class="progress"><i style="--progress:${total ? (n / total) * 100 : 0}%"></i></div><b>${n}</b></div>`,
      )
      .join(
        "",
      )}<p class="small muted">สถิติคำนวณจากข้อมูลทั้งหมดในระบบ รวมทั้งการแจ้งปัญหาและประกาศของหาย</p></div></section></div><section class="panel section-gap"><div class="panel-head"><h2>จำนวนเรื่องแยกตามวันที่ (ล่าสุดไม่เกิน 30 วันที่มีรายการ)</h2></div><div class="table-wrap"><table><thead><tr><th>วันที่</th><th>จำนวนเรื่อง</th></tr></thead><tbody>${d.by_day.map((day) => `<tr><td>${date(day.day)}</td><td>${day.total}</td></tr>`).join("") || '<tr><td colspan="2">ยังไม่มีข้อมูล</td></tr>'}</tbody></table></div></section>`
  );
}
async function users() {
  const d = await api("/users?limit=12&offset=" + state.offset);
  return (
    heading(
      "จัดการสมาชิก",
      "กำหนดบทบาทและสิทธิ์เข้าใช้ระบบ การเปลี่ยนสิทธิ์จะออกจากระบบอุปกรณ์เดิม",
    ) +
    `<div class="panel table-wrap"><table><thead><tr><th>สมาชิก</th><th>บ้านเลขที่ / โทร</th><th>บทบาท</th><th>บัญชี</th><th>จัดการ</th></tr></thead><tbody>${d.items.map((u) => `<tr><td><strong>${esc(u.full_name)}</strong><small>${esc(u.email)}</small></td><td>${esc(u.house_number)}<small>${esc(u.phone)}</small></td><td>${roles[u.role]}</td><td><span class="badge ${u.active ? "resolved" : "pending"}">${u.active ? "ใช้งานอยู่" : "ระงับบัญชี"}</span></td><td>${u.users_id !== state.user.users_id ? `<button class="btn sm" data-user="${esc(u.users_id)}">แก้ไขสิทธิ์</button>` : '<span class="small muted">บัญชีของคุณ</span>'}</td></tr>`).join("")}</tbody></table></div>` +
    pager(d.total)
  );
}
async function audit() {
  const d = await api("/audit-logs?limit=12&offset=" + state.offset);
  return (
    heading(
      "ประวัติการดำเนินงาน",
      "บันทึกกิจกรรมสำคัญในระบบ เพื่อให้ตรวจสอบย้อนหลังได้",
    ) +
    `<div class="panel table-wrap"><table><thead><tr><th>เวลา</th><th>ผู้ดำเนินการ</th><th>การดำเนินการ</th><th>รหัสรายการ</th></tr></thead><tbody>${d.items.map((a) => `<tr><td>${dateTime(a.created_at)}</td><td>${esc(a.full_name || "ระบบ")}</td><td><span class="code">${esc(a.action)}</span></td><td class="small muted">${esc(a.resource_id)}</td></tr>`).join("") || '<tr><td colspan="4" class="empty">ยังไม่มีประวัติ</td></tr>'}</tbody></table></div>` +
    pager(d.total)
  );
}
async function renderPage() {
  const version = ++renderVersion;
  $("#page-content")?.setAttribute("aria-busy", "true");
  const current = state.page;
  try {
    const fn =
      {
        dashboard,
        posts: () => posts(false),
        lost: () => posts(true),
        equipment,
        loans,
        announcements,
        events,
        notifications,
        profile,
        reports,
        users,
        audit,
      }[current] || dashboard;
    const content = await fn();
    if (version !== renderVersion) return;
    $("#page-content").innerHTML = content;
    bindPage();
    $("#page-content").setAttribute("aria-busy", "false");
  } catch (e) {
    if (version === renderVersion && $("#page-content")) {
      $("#page-content").setAttribute("aria-busy", "false");
      $("#page-content").innerHTML =
        errorHtml(e) +
        `<button class="btn" data-action="retry">ลองใหม่</button>`;
    }
  }
}
function bindPage() {
  if ($("#post-filter"))
    $("#post-filter").onsubmit = (e) => {
      e.preventDefault();
      state.filter = { ...state.filter, ...formData(e.currentTarget) };
      state.offset = 0;
      renderPage();
    };
  if ($("#profile-form"))
    $("#profile-form").onsubmit = (e) =>
      saveInline(e, async (b) => {
        state.user = await api("/auth/me", "PATCH", b);
        await renderShell();
        toast("บันทึกข้อมูลแล้ว");
      });
  if ($("#password-form"))
    $("#password-form").onsubmit = (e) =>
      saveInline(e, async (b) => {
        if (b.password !== b.confirm) throw Error("รหัสผ่านใหม่ไม่ตรงกัน");
        await api("/auth/password", "PATCH", b);
        state.user = null;
        renderAuth();
        toast("เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่");
      });
}
async function saveInline(e, save) {
  e.preventDefault();
  const form = e.currentTarget,
    btn = $("button[type=submit],button:not([type])", form);
  if (btn) btn.disabled = true;
  try {
    await save(formData(form));
  } catch (err) {
    $(".error", form).textContent = err.message;
  } finally {
    if (btn) btn.disabled = false;
  }
}
let modalFocus, modalEscape;
function modal(title, body, wide = false) {
  const fromMenu = Boolean($(".sidebar.open"));
  if (fromMenu) setMenu(false);
  closeModal();
  modalFocus = fromMenu ? $(".mobile-menu") : document.activeElement;
  $("#modal-root").innerHTML =
    `<div class="modal-backdrop"><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><header class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="ปิด">${icon("x")}</button></header><div class="modal-body">${body}</div></section></div>`;
  document.body.style.overflow = "hidden";
  $(".modal").focus();
  modalEscape = (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") {
      const items = [
        ...$(".modal").querySelectorAll("button,input,select,textarea,a[href]"),
      ].filter((e) => !e.disabled);
      if (!items.length) return;
      const first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === $(".modal"))
      ) {
        first.focus();
        e.preventDefault();
      }
    }
  };
  document.addEventListener("keydown", modalEscape);
  $(".modal-backdrop").onclick = (e) => {
    if (e.target === $(".modal-backdrop")) closeModal();
  };
}
function closeModal() {
  if (modalEscape) document.removeEventListener("keydown", modalEscape);
  $("#modal-root").innerHTML = "";
  document.body.style.overflow = "";
  if (modalFocus?.isConnected) modalFocus.focus();
}
function modalForm(title, fields, save, label = "บันทึก") {
  modal(
    title,
    `<form id="modal-form">${fields}<div class="error" role="alert"></div><div class="modal-actions"><button class="btn" type="button" data-action="close-modal">ยกเลิก</button><button class="btn primary" type="submit">${label}</button></div></form>`,
  );
  $("#modal-form").onsubmit = (e) =>
    saveInline(e, async (b) => {
      await save(b);
      closeModal();
      await renderPage();
      toast("บันทึกสำเร็จ");
    });
}
function confirmAction(title, message, save, label = "ยืนยัน") {
  modalForm(title, `<p>${esc(message)}</p>`, save, label);
}
async function postForm(lost = false, existing = null) {
  const cats = state.categories.filter(
    (c) => c.type === (lost ? "lost" : "issue"),
  );
  modalForm(
    existing ? "แก้ไขเรื่อง" : lost ? "สร้างประกาศตามหา" : "แจ้งเรื่องใหม่",
    `${
      existing
        ? ""
        : select(
            "categories_id",
            "หมวดหมู่",
            cats.map((c) => [c.categories_id, c.name]),
            cats[0]?.categories_id,
          )
    }${field("title", "หัวข้อ", "text", existing?.title || "", 'minlength="3" maxlength="150" placeholder="สรุปเรื่องที่ต้องการแจ้ง"')}${textarea("description", "รายละเอียด", existing?.description || "", 'minlength="5" maxlength="5000" placeholder="เล่าเหตุการณ์และรายละเอียดที่ช่วยให้ดำเนินการได้"')}${field("location_note", "สถานที่ / จุดที่พบ", "text", existing?.location_note || "", 'maxlength="255" placeholder="เช่น สวนส่วนกลาง โซน A"')}${
      existing
        ? ""
        : select(
            "priority",
            "ความเร่งด่วน",
            [
              ["normal", "ปกติ"],
              ["high", "เร่งด่วน"],
            ],
            "normal",
          )
    }`,
    (b) =>
      api(
        existing ? "/posts/" + existing.community_posts_id : "/posts",
        existing ? "PATCH" : "POST",
        existing ? b : { ...b, categories_id: Number(b.categories_id) },
      ),
    existing ? "บันทึกการแก้ไข" : lost ? "เผยแพร่ประกาศ" : "ส่งเรื่อง",
  );
}
async function showPost(pid) {
  const [p, history, comments] = await Promise.all([
    api("/posts/" + pid),
    api("/posts/" + pid + "/history"),
    api("/posts/" + pid + "/comments"),
  ]);
  const canEdit = p.users_id === state.user.users_id || isAdmin();
  modal(
    p.title,
    `<div class="list-card-top"><span class="small muted">${esc(p.category_name)}</span>${badge(p.status)}</div><p class="detail-copy">${esc(p.description)}</p><div class="detail-info"><span>${icon("pin")} ${esc(p.location_note)}</span><span>${icon("user")} ${esc(p.author_name)}</span><span>${icon("calendar")} ${dateTime(p.created_at)}</span></div>${canEdit ? `<div class="card-actions"><button class="btn sm" id="edit-post">${icon("edit")}แก้ไขเรื่อง</button><button class="btn danger sm" id="delete-post">${icon("trash")}ลบเรื่อง</button></div>` : ""}<section class="detail-section"><h3>ประวัติการดำเนินงาน</h3><div class="timeline">${history.map((h) => `<div class="timeline-item"><strong>${statusNames[h.status]}</strong><p>${esc(h.note)}</p><small>${esc(h.full_name)} · ${dateTime(h.created_at)}</small></div>`).join("")}</div>${isStaff() ? `<form id="status-form">${select("status", "อัปเดตสถานะ", Object.entries(statusNames).slice(0, 3), p.status)}${textarea("note", "บันทึกการดำเนินงาน", "", 'minlength="3" maxlength="1000"')}<div class="error" role="alert"></div><button class="btn primary sm">บันทึกสถานะ</button></form>` : ""}</section><section class="detail-section"><h3>พูดคุยและให้ข้อมูลเพิ่มเติม (${comments.length})</h3>${comments.map((c) => `<div class="comment"><div class="list-card-top"><strong>${esc(c.full_name)} ${c.role && c.role !== "resident" ? '<span class="badge in_progress">เจ้าหน้าที่</span>' : ""}</strong>${c.users_id === state.user.users_id || isAdmin() ? `<button class="btn subtle sm" data-delete-comment="${esc(c.id)}" data-parent="${esc(pid)}" aria-label="ลบความคิดเห็น">${icon("trash")}</button>` : ""}</div><p>${esc(c.body)}</p><small>${dateTime(c.created_at)}</small></div>`).join("") || '<p class="small muted">ยังไม่มีความคิดเห็น</p>'}<form id="comment-form" class="comment-form"><input name="body" aria-label="ความคิดเห็น" placeholder="เขียนความคิดเห็น…" minlength="1" maxlength="2000" required><button class="btn primary sm">ส่ง</button></form><div id="comment-error" class="error" role="alert"></div></section>`,
    true,
  );
  if ($("#edit-post"))
    $("#edit-post").onclick = () => postForm(p.category_type === "lost", p);
  if ($("#delete-post"))
    $("#delete-post").onclick = () =>
      confirmAction(
        "ลบเรื่องนี้?",
        "โพสต์ ประวัติ และความคิดเห็นของเรื่องนี้จะถูกลบ",
        () => api("/posts/" + pid, "DELETE"),
        "ลบเรื่อง",
      );
  if ($("#status-form"))
    $("#status-form").onsubmit = (e) =>
      saveInline(e, async (b) => {
        await api("/posts/" + pid + "/status", "PATCH", b);
        await showPost(pid);
        await renderPage();
        toast("อัปเดตสถานะและแจ้งเจ้าของเรื่องแล้ว");
      });
  $("#comment-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      btn = $("button", form);
    btn.disabled = true;
    try {
      await api("/posts/" + pid + "/comments", "POST", formData(form));
      await showPost(pid);
      await renderPage();
    } catch (err) {
      $("#comment-error").textContent = err.message;
      btn.disabled = false;
    }
  };
}
async function borrow(eid) {
  const e = await api("/equipment/" + eid);
  modalForm(
    "ยืม" + e.name,
    `<p class="notice">พร้อมยืม ${e.available} จากทั้งหมด ${e.total} ชิ้น เจ้าหน้าที่จะตรวจรับเมื่อคุณนำอุปกรณ์มาคืน</p><div class="form-row">${field("quantity", "จำนวน (ชิ้น)", "number", 1, `min="1" max="${Math.min(100, e.available)}"`)}${field("due_date", "กำหนดคืน", "date", new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }), `min="${todayISO()}" max="${new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" })}"`)}</div>${textarea("purpose", "วัตถุประสงค์ในการยืม", "", 'minlength="3" maxlength="255"')}`,
    (b) =>
      api("/loans", "POST", {
        ...b,
        equipment_id: eid,
        quantity: Number(b.quantity),
      }),
    "ยืนยันการยืม",
  );
}
async function equipmentForm(eid) {
  const e = eid ? await api("/equipment/" + eid) : null;
  modalForm(
    e ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์ส่วนกลาง",
    field(
      "name",
      "ชื่ออุปกรณ์",
      "text",
      e?.name || "",
      'minlength="2" maxlength="100"',
    ) +
      textarea(
        "description",
        "รายละเอียด",
        e?.description || "",
        'maxlength="2000"',
      ) +
      field(
        "total",
        "จำนวนรวมทั้งหมด (รวมที่กำลังถูกยืม)",
        "number",
        e?.total || 1,
        'min="1" max="10000"',
      ),
    (b) =>
      api(e ? "/equipment/" + eid : "/equipment", e ? "PATCH" : "POST", {
        ...b,
        total: Number(b.total),
      }),
  );
}
async function showAnn(aid) {
  const a = await api("/announcements/" + aid);
  modal(
    a.title,
    `${a.pinned ? '<span class="badge in_progress">ประกาศปักหมุด</span>' : ""}<p class="detail-copy">${esc(a.body)}</p><p class="small muted">${date(a.created_at)}</p>${isStaff() ? `<div class="modal-actions"><button class="btn" id="edit-ann">${icon("edit")}แก้ไขประกาศ</button><button class="btn danger" id="delete-ann">${icon("trash")}ลบ</button></div>` : ""}`,
  );
  if ($("#edit-ann")) $("#edit-ann").onclick = () => annForm(a);
  if ($("#delete-ann"))
    $("#delete-ann").onclick = () =>
      confirmAction(
        "ลบประกาศนี้?",
        "ประกาศจะถูกนำออกจากหน้าข่าวสาร",
        () => api("/announcements/" + aid, "DELETE"),
        "ลบประกาศ",
      );
}
function annForm(a) {
  modalForm(
    a ? "แก้ไขประกาศ" : "ประกาศข่าวสาร",
    field(
      "title",
      "หัวข้อประกาศ",
      "text",
      a?.title || "",
      'minlength="3" maxlength="150"',
    ) +
      textarea(
        "body",
        "เนื้อหาประกาศ",
        a?.body || "",
        'minlength="5" maxlength="5000"',
      ) +
      select(
        "pinned",
        "การแสดงผล",
        [
          ["false", "ประกาศทั่วไป"],
          ["true", "ปักหมุดไว้ด้านบน"],
        ],
        a?.pinned ? "true" : "false",
      ),
    (b) =>
      api(
        a ? "/announcements/" + a.id : "/announcements",
        a ? "PATCH" : "POST",
        { ...b, pinned: b.pinned === "true" },
      ),
  );
}
async function eventForm(eid) {
  const e = eid ? await api("/events/" + eid) : null;
  let local = "";
  if (e) {
    const d = new Date(e.starts_at);
    local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }
  modalForm(
    e ? "แก้ไขกิจกรรม" : "สร้างกิจกรรมชุมชน",
    field(
      "title",
      "ชื่อกิจกรรม",
      "text",
      e?.title || "",
      'minlength="3" maxlength="150"',
    ) +
      textarea(
        "description",
        "รายละเอียด",
        e?.description || "",
        'minlength="5" maxlength="3000"',
      ) +
      field(
        "location",
        "สถานที่",
        "text",
        e?.location || "",
        'minlength="2" maxlength="150"',
      ) +
      `<div class="form-row">${field("starts_at", "วัน–เวลาเริ่ม", "datetime-local", local)}${field("capacity", "รับจำนวน (คน)", "number", e?.capacity || 30, 'min="1" max="1000"')}</div>`,
    (b) =>
      api(e ? "/events/" + eid : "/events", e ? "PATCH" : "POST", {
        ...b,
        starts_at: new Date(b.starts_at).toISOString(),
        capacity: Number(b.capacity),
      }),
  );
}
async function userForm(uid) {
  const u = await api("/users/" + uid);
  modalForm(
    "สิทธิ์ของ " + u.full_name,
    select("role", "บทบาท", Object.entries(roles), u.role) +
      select(
        "active",
        "สถานะบัญชี",
        [
          ["true", "เปิดใช้งาน"],
          ["false", "ระงับการใช้งาน"],
        ],
        u.active ? "true" : "false",
      ) +
      '<p class="small muted">การเปลี่ยนสิทธิ์จะเพิกถอนเซสชันเดิมของสมาชิก การบันทึกบทบาทและสถานะเป็นคนละคำขอ</p>',
    async (b) => {
      if (b.role !== u.role)
        await api("/users/" + uid + "/role", "PATCH", { role: b.role });
      if ((b.active === "true") !== Boolean(u.active))
        await api("/users/" + uid + "/active", "PATCH", {
          active: b.active === "true",
        });
    },
  );
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button,a,[data-post],[data-ann]");
  if (!t) return;
  if (t.matches('a[href="#main"]')) {
    e.preventDefault();
    $("#main")?.focus();
    return;
  }
  try {
    if (t.dataset.go) {
      location.hash = t.dataset.go;
      return;
    }
    if (t.dataset.post) {
      await showPost(t.dataset.post);
      return;
    }
    if (t.dataset.ann) {
      await showAnn(t.dataset.ann);
      return;
    }
    if (t.dataset.mine) {
      state.filter.mine = t.dataset.mine === "true" ? "true" : "";
      state.offset = 0;
      await renderPage();
      return;
    }
    if (t.dataset.borrow) {
      await borrow(t.dataset.borrow);
      return;
    }
    if (t.dataset.editEquipment) {
      await equipmentForm(t.dataset.editEquipment);
      return;
    }
    if (t.dataset.archiveEquipment) {
      confirmAction(
        "ปิดใช้งานอุปกรณ์?",
        "อุปกรณ์จะไม่แสดงให้ลูกบ้านยืมอีก ต้องไม่มีรายการค้างคืน",
        () => api("/equipment/" + t.dataset.archiveEquipment, "DELETE"),
        "ปิดใช้งาน",
      );
      return;
    }
    if (t.dataset.return) {
      confirmAction(
        "ยืนยันรับคืนอุปกรณ์?",
        "กรุณาตรวจรับจำนวนและสภาพอุปกรณ์ให้ครบก่อนยืนยัน ระบบจะเพิ่มจำนวนพร้อมยืมกลับเข้าคลัง",
        () => api("/loans/" + t.dataset.return + "/return", "PATCH"),
        "รับคืนเรียบร้อย",
      );
      return;
    }
    if (t.dataset.join) {
      t.disabled = true;
      await api(
        "/events/" + t.dataset.join + "/join",
        t.dataset.joined === "true" ? "DELETE" : "POST",
      );
      await renderPage();
      toast(
        t.dataset.joined === "true"
          ? "ยกเลิกการเข้าร่วมแล้ว"
          : "ลงทะเบียนเข้าร่วมแล้ว",
      );
      return;
    }
    if (t.dataset.editEvent) {
      await eventForm(t.dataset.editEvent);
      return;
    }
    if (t.dataset.deleteEvent) {
      confirmAction(
        "ยกเลิกกิจกรรม?",
        "ระบบจะลบกิจกรรมและแจ้งสมาชิกที่ลงทะเบียนไว้",
        () => api("/events/" + t.dataset.deleteEvent, "DELETE"),
        "ยกเลิกกิจกรรม",
      );
      return;
    }
    if (t.dataset.attendees) {
      const attendees = await api(
        "/events/" + t.dataset.attendees + "/attendees",
      );
      modal(
        "รายชื่อผู้เข้าร่วม",
        `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>บ้านเลขที่</th><th>วันที่ลงทะเบียน</th></tr></thead><tbody>${attendees.map((a) => `<tr><td>${esc(a.full_name)}</td><td>${esc(a.house_number)}</td><td>${date(a.created_at)}</td></tr>`).join("") || '<tr><td colspan="3">ยังไม่มีผู้สมัคร</td></tr>'}</tbody></table></div>`,
      );
      return;
    }
    if (t.dataset.user) {
      await userForm(t.dataset.user);
      return;
    }
    if (t.dataset.notification) {
      await api("/notifications/" + t.dataset.notification + "/read", "PATCH");
      const link = t.dataset.link;
      if (link.startsWith("posts/")) {
        await showPost(link.slice(6));
        await renderPage();
      } else {
        location.hash = link;
        if (state.page === link) await renderPage();
      }
      return;
    }
    if (t.dataset.deleteNotification) {
      await api("/notifications/" + t.dataset.deleteNotification, "DELETE");
      await renderPage();
      return;
    }
    if (t.dataset.deleteComment) {
      const pid = t.dataset.parent,
        cid = t.dataset.deleteComment;
      await api("/comments/" + cid, "DELETE");
      await showPost(pid);
      return;
    }
    switch (t.dataset.action) {
      case "new-post":
        await postForm();
        break;
      case "new-lost":
        await postForm(true);
        break;
      case "new-equipment":
        await equipmentForm();
        break;
      case "new-ann":
        annForm();
        break;
      case "new-event":
        await eventForm();
        break;
      case "close-modal":
        closeModal();
        break;
      case "menu":
        setMenu(!$(".sidebar").classList.contains("open"));
        break;
      case "close-menu":
        setMenu(false);
        break;
      case "reset-filters":
        state.filter = {};
        state.offset = 0;
        await renderPage();
        break;
      case "logout":
        await api("/auth/logout", "POST");
        state.user = null;
        state.filter = {};
        closeModal();
        renderAuth();
        break;
      case "read-all":
        await api("/notifications/read-all", "PATCH");
        await renderPage();
        updateUnread(0);
        toast("อ่านการแจ้งเตือนทั้งหมดแล้ว");
        break;
      case "prev":
        state.offset = Math.max(0, state.offset - 12);
        await renderPage();
        break;
      case "next":
        state.offset += 12;
        await renderPage();
        break;
      case "retry":
        await renderPage();
        break;
    }
  } catch (err) {
    if (t.isConnected) t.disabled = false;
    toast(err.message);
  }
});
document.addEventListener("keydown", (e) => {
  if ($(".sidebar.open")) {
    if (e.key === "Escape") {
      setMenu(false);
      return;
    }
    if (e.key === "Tab") {
      const links = [
        ...$(".sidebar").querySelectorAll("a[href],button"),
      ].filter((n) => n.getClientRects().length);
      if (e.shiftKey && document.activeElement === links[0]) {
        e.preventDefault();
        links.at(-1)?.focus();
      } else if (!e.shiftKey && document.activeElement === links.at(-1)) {
        e.preventDefault();
        links[0]?.focus();
      }
    }
  }
  const t = e.target.closest('[role="button"][tabindex]');
  if (t && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    t.click();
  }
});
window.addEventListener("hashchange", async () => {
  if (!state.user) return;
  closeModal();
  const [page, query] = location.hash.slice(1).split("?");
  state.page = page || "dashboard";
  state.offset = 0;
  state.filter = query ? Object.fromEntries(new URLSearchParams(query)) : {};
  await renderShell();
  window.scrollTo(0, 0);
});
async function init() {
  try {
    const health = await api("/health");
    state.demo = health.demo;
    try {
      state.user = await api("/auth/me");
    } catch {}
    if (state.user) {
      state.categories = await api("/categories");
      const [p, q] = location.hash.slice(1).split("?");
      state.page = p || "dashboard";
      state.filter = q ? Object.fromEntries(new URLSearchParams(q)) : {};
      await renderShell();
    } else renderAuth();
  } catch (err) {
    $("#app").innerHTML =
      `<main class="docs-container">${brand()}<h1 class="docs-title">เชื่อมต่อระบบไม่ได้</h1>${errorHtml(err)}<p>ตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่ แล้วรีเฟรชหน้าอีกครั้ง</p></main>`;
  }
}
init();
