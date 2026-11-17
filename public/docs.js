const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const spec = await (await fetch("/api/v1/openapi.json")).json();
const rows = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, op]) => ({
    path,
    method: method.toUpperCase(),
    ...op,
  })),
);
function render() {
  const term = document.querySelector("#filter").value.toLowerCase();
  const selected = rows.filter((r) =>
    (r.path + r.method + r.summary).toLowerCase().includes(term),
  );
  document.querySelector("#count").textContent =
    `${selected.length} จาก ${rows.length} endpoints (ไม่นับ OpenAPI JSON)`;
  document.querySelector("#endpoints").innerHTML = selected
    .map(
      (r) =>
        `<article class="endpoint"><div class="endpoint-head"><span class="method ${r.method}">${r.method}</span><code>${esc(r.path)}</code><span class="badge">${esc(r.description)}</span></div><p>${esc(r.summary)}</p>${r.requestBody ? `<details><summary>ตัวอย่าง request body</summary><pre>${esc(JSON.stringify(r.requestBody.content["application/json"].example, null, 2))}</pre></details>` : ""}<p class="small muted">Success: ${Object.keys(r.responses)[0]} · Errors: 400 / 401 / 403 / 404 / 409 / 422 / 429</p><button class="btn sm" data-path="${esc(r.path)}" data-method="${r.method}">เลือกเพื่อทดลอง</button></article>`,
    )
    .join("");
}
document.querySelector("#filter").oninput = render;
render();
document.addEventListener("click", (e) => {
  if (!e.target.dataset.path) return;
  const b = e.target;
  document.querySelector("#path").value = b.dataset.path;
  document.querySelector("#method").value = b.dataset.method;
  const row = rows.find(
    (r) => r.path === b.dataset.path && r.method === b.dataset.method,
  );
  document.querySelector("#body").value = row.requestBody
    ? JSON.stringify(
        row.requestBody.content["application/json"].example,
        null,
        2,
      )
    : "";
  document.querySelector("#try-form").scrollIntoView({ behavior: "smooth" });
});
document.querySelector("#try-form").onsubmit = async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget)),
    out = document.querySelector("#result");
  try {
    if (
      !data.path.startsWith("/api/v1/") ||
      data.path.includes("..") ||
      /[\\\r\n]/.test(data.path)
    )
      throw Error("ใช้ path ภายใต้ /api/v1/ เท่านั้น");
    if (/[{}]/.test(data.path))
      throw Error("กรุณาแทนที่ {id} ด้วยรหัสรายการจริง");
    const headers = {};
    if (data.token) headers.Authorization = "Bearer " + data.token;
    let body;
    if (!["GET", "HEAD"].includes(data.method) && data.body.trim()) {
      body = JSON.stringify(JSON.parse(data.body));
      headers["Content-Type"] = "application/json";
    }
    const start = performance.now(),
      res = await fetch(data.path, { method: data.method, headers, body }),
      raw = await res.text();
    let result = raw;
    try {
      result = JSON.stringify(JSON.parse(raw), null, 2);
    } catch {}
    out.textContent = `HTTP ${res.status} · ${Math.round(performance.now() - start)} ms\n${result || "(ไม่มี response body)"}`;
  } catch (err) {
    out.textContent = err.message;
  }
};
