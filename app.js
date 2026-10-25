/* =========================================================
   Zusago – App (Lebenslauf und Bewerbung erstellen)
   Alle Angaben bleiben im Browser (localStorage).
   Bezahlt wird vor dem Start (Stripe Checkout: TWINT, Karte, Apple Pay, Google Pay).
   ========================================================= */

// Adresse des KI-Servers (Render Web Service). Falls dein Service anders heisst, hier anpassen.
const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://127.0.0.1:8787" : "https://zusago-api.onrender.com";

const STORE = "zusago:v1";
const STEPS = ["Inserat", "Über dich", "Schule", "Erfahrungen", "Stärken", "Referenzen", "Vorlage", "Fertig"];
const STRENGTHS = ["zuverlässig", "pünktlich", "genau", "geduldig", "hilfsbereit", "kreativ", "teamfähig", "selbstständig", "kommunikativ", "handwerklich geschickt", "logisch denkend", "motiviert", "belastbar", "offen", "ordentlich", "freundlich"];
const LEVELS = ["Muttersprache", "sehr gut", "gut", "Grundkenntnisse"];
const TEMPLATES = window.ZV.TEMPLATES; // alle Vorlagen kommen aus vorlagen.js

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Zustand ---------- */
const fresh = () => ({
  step: 0, src: "link", template: "klar", tone: "normal", doc: "cv",
  job: { art: "lehre", beruf: "", firma: "", strasse: "", plz_ort: "", kontakt_anrede: "", kontakt_name: "", lehrbeginn: "", anforderungen: [], aufgaben: [] },
  profile: {
    vorname: "", nachname: "", strasse: "", plz_ort: "", telefon: "", email: "", geburtsdatum: "", nationalitaet: "", foto: "",
    klasse: "", schule: [{ zeit: "", name: "", details: "" }], erfahrungen: [{ zeit: "", titel: "", ort: "" }],
    staerken: [], hobbys: [], sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "gut" }, { sprache: "Französisch", niveau: "Grundkenntnisse" }],
    computer: "", motivation: "", referenzen: [{ name: "", funktion: "", telefon: "" }]
  },
  ai: null
});
let S = load();
function load() {
  try { const d = JSON.parse(localStorage.getItem(STORE)); if (d && d.profile) return Object.assign(fresh(), d); } catch {}
  return fresh();
}
let saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} }, 250); }
const getPath = p => p.split(".").reduce((o, k) => o?.[k], S);
const setPath = (p, v) => { const ks = p.split("."); const last = ks.pop(); const o = ks.reduce((o, k) => o[k], S); o[last] = v; save(); };

/* ---------- API ---------- */
async function api(path, body) {
  let r;
  try {
    r = await fetch(API_BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(90_000) });
  } catch { throw new Error("Die KI ist gerade nicht erreichbar. Prüf deine Internetverbindung und versuch es nochmals."); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || "Da ist etwas schiefgelaufen. Versuch es nochmals."); e.status = r.status; e.pay = !!data.bezahlen; throw e; }
  return data;
}

/* ---------- Bezahlung und Guthaben ---------- */
// Guthaben-Codes (ID der Stripe-Zahlung) bleiben auf diesem Gerät. Das Guthaben selbst steht bei Stripe.
const PAYSTORE = "zusago:pay";
const PRICES = { 1: 6.90, 3: 14.90, 5: 19.90, 10: 29.90 };
let P = loadPay();
function loadPay() {
  try { const d = JSON.parse(localStorage.getItem(PAYSTORE)); if (d && Array.isArray(d.codes)) return d; } catch {}
  return { codes: [], pending: null, free: false };
}
function savePay() { try { localStorage.setItem(PAYSTORE, JSON.stringify(P)); } catch {} renderCredits(); }
const totalLeft = () => P.codes.reduce((a, c) => a + (c.remaining || 0), 0);
const activeCode = () => (P.codes.find(c => c.remaining > 0) || P.codes[P.codes.length - 1] || {}).code || "";
const jobSig = () => [S.job.beruf, S.job.firma, S.job.art].map(x => String(x || "").trim().toLowerCase()).join("|");
const hasTicket = () => !!S.ticket && S.ticketJob === jobSig();
const canWork = () => P.free || totalLeft() > 0 || !!S.ticket;
const withPay = body => Object.assign({ code: activeCode(), ticket: S.ticket || undefined }, body);
const nB = n => `${n} ${n === 1 ? "Bewerbung" : "Bewerbungen"}`;

function adopt(code, info) {
  const e = P.codes.find(c => c.code === code);
  const v = { code, credits: info.credits, used: info.used, remaining: info.remaining };
  if (e) Object.assign(e, v); else P.codes.push(v);
  if (P.pending === code) P.pending = null;
  savePay();
}
function setLeft(code, remaining) { const e = P.codes.find(c => c.code === code); if (e && typeof remaining === "number") { e.remaining = remaining; e.used = e.credits - remaining; savePay(); } }
async function refreshCredits() {
  try {
    if (!P.codes.length) { const d = await api("/api/guthaben", { code: "" }).catch(e => e.pay ? {} : Promise.reject(e)); P.free = d.status === "gratis"; savePay(); return; }
    for (const c of P.codes.slice(-6)) {
      const d = await api("/api/guthaben", { code: c.code }).catch(e => e.pay ? { status: "ungültig", remaining: 0, credits: c.credits, used: c.used } : Promise.reject(e));
      P.free = d.status === "gratis";
      if (!P.free) Object.assign(c, { remaining: d.remaining || 0, credits: d.credits ?? c.credits, used: d.used ?? c.used });
    }
    savePay();
  } catch {} // offline: zuletzt bekannter Stand bleibt
}
function renderCredits() {
  const pill = $("#creditPill"), left = totalLeft();
  pill.hidden = !P.free && !P.codes.length;
  $("#creditText").textContent = P.free ? "Test-Modus" : `${nB(left)} übrig`;
  pill.classList.toggle("empty", !P.free && left < 1);
  $("#creditLine").innerHTML = P.free ? "Test-Modus: alles gratis." : `<b>${nB(left)}</b> übrig`;
  $("#myCode").textContent = activeCode() || "–";
  $("#copyCode").hidden = !activeCode();
  renderGenCost();
}
function renderGenCost() {
  const el = $("#genCost"); if (!el) return;
  el.textContent = P.free ? "" : hasTicket() ? "Diese Bewerbung ist schon bezahlt – neu schreiben kostet nichts."
    : totalLeft() > 0 ? `Das braucht 1 Bewerbung von deinem Guthaben (noch ${totalLeft()}).` : "";
}

/* Kasse anzeigen */
let pickN = 5, pollT = null;
function showGate(mode = "start", msg = "") {
  $$(".panel").forEach(p => p.hidden = true);
  $("#wizNav").hidden = true; document.body.classList.remove("ws-mode"); document.body.classList.add("pay-mode");
  const g = $("#payGate"); g.hidden = false; g.dataset.mode = mode;
  const T = {
    start: ["Bevor es losgeht", "Wähl dein Paket", "Eine Bewerbung heisst: Lebenslauf und Brief für eine Stelle, beliebig oft anpassen, als PDF. Einmal bezahlen, kein Abo, kein Konto."],
    leer: ["Guthaben aufgebraucht", "Kauf weitere Bewerbungen", "Deine bisherigen Bewerbungen bleiben gespeichert. Für eine neue Stelle brauchst du eine weitere Bewerbung."],
    mehr: ["Guthaben", "Weitere Bewerbungen kaufen", "Je mehr Bewerbungen du auf einmal kaufst, desto günstiger wird eine einzelne. Dein bisheriges Guthaben bleibt."],
    bezahlt: ["Zahlung erhalten", "Danke, das hat geklappt", ""]
  }[mode];
  $("#payEyebrow").textContent = T[0];
  $("#payTitle").innerHTML = `${T[1]}<span class="dot">${mode === "bezahlt" ? "!" : "."}</span>`;
  $("#payLead").textContent = T[2];
  $$("#payPkgs,.pay-box,.pay-code").forEach(el => el.hidden = mode === "bezahlt");
  if (mode === "bezahlt") $("#parentBox").hidden = true;
  $("#paidBox").hidden = mode !== "bezahlt";
  $("#payClose").hidden = !(canWork() && mode !== "bezahlt");
  $("#payErr").textContent = msg;
  if (mode !== "bezahlt" && P.pending) resumeParentWait();
  window.scrollTo({ top: 0 });
  $("#payTitle").setAttribute("tabindex", "-1"); $("#payTitle").focus({ preventScroll: true });
}
function hideGate() {
  stopPoll(); $("#payGate").hidden = true; document.body.classList.remove("pay-mode");
  show(S.step === 7 && !S.ai ? 6 : S.step || 0);
}
function pickPkg(n) {
  pickN = PRICES[n] ? n : 5;
  $$("#payPkgs .pkg").forEach(b => { const on = +b.dataset.n === pickN; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
  $("#payAmount").textContent = `CHF ${PRICES[pickN].toFixed(2)}`;
}
$("#payPkgs").addEventListener("click", e => { const b = e.target.closest(".pkg"); if (b) pickPkg(+b.dataset.n); });

async function checkout() {
  const err = $("#payErr"), load = $("#payLoading");
  err.textContent = ""; load.hidden = false; $$("#payNow,#payParent").forEach(b => b.disabled = true);
  try { const d = await api("/api/checkout", { pack: pickN }); P.pending = d.code; savePay(); return d; }
  catch (e) { err.textContent = e.message; return null; }
  finally { load.hidden = true; $$("#payNow,#payParent").forEach(b => b.disabled = false); }
}
$("#payNow").addEventListener("click", async () => {
  $("#payLoadingText").textContent = "Die Kasse wird geöffnet …";
  const d = await checkout(); if (d) location.href = d.url;
});
$("#payParent").addEventListener("click", async () => {
  $("#payLoadingText").textContent = "Der Link wird erstellt …";
  const d = await checkout(); if (!d) return;
  P.parentUrl = d.url; P.parentN = pickN; savePay(); openParentBox();
});
function openParentBox() {
  const url = P.parentUrl, n = P.parentN || pickN, price = `CHF ${PRICES[n].toFixed(2)}`;
  const text = `Hallo! Ich schreibe meine Bewerbung für die Lehrstelle mit Zusago. Kannst du ${nB(n)} für mich bezahlen (${price}, einmalig, kein Abo)? Das geht mit TWINT oder Karte: ${url}`;
  $("#parentUrl").value = url;
  $("#parentWa").href = "https://wa.me/?text=" + encodeURIComponent(text);
  $("#parentMail").href = `mailto:?subject=${encodeURIComponent("Kannst du meine Bewerbung bezahlen?")}&body=${encodeURIComponent(text)}`;
  $("#parentBox").hidden = false; $("#parentBox").scrollIntoView({ behavior: "smooth", block: "center" });
  startPoll();
}
function resumeParentWait() { if (P.parentUrl && P.pending) openParentBox(); else startPoll(); }
$("#parentCopy").addEventListener("click", () => copy($("#parentUrl").value, "Link kopiert."));
function startPoll() {
  stopPoll(); if (!P.pending) return;
  const tick = async () => {
    try {
      const d = await api("/api/guthaben", { code: P.pending });
      if (d.status === "bezahlt") { const c = P.pending; P.parentUrl = null; adopt(c, d); stopPoll(); showPaid(c, d, true); return; }
      if (d.status === "abgelaufen") { P.pending = null; P.parentUrl = null; savePay(); stopPoll(); $("#parentBox").hidden = true; $("#payErr").textContent = "Der Bezahl-Link ist abgelaufen. Erstell einfach einen neuen."; return; }
    } catch (e) { if (e.pay) { P.pending = null; savePay(); stopPoll(); return; } }
    pollT = setTimeout(tick, 5000);
  };
  pollT = setTimeout(tick, 4000);
}
function stopPoll() { clearTimeout(pollT); pollT = null; }
document.addEventListener("visibilitychange", () => { if (!document.hidden && pollT) { stopPoll(); startPoll(); } });

function showPaid(code, info, fromParent) {
  showGate("bezahlt");
  $("#payLead").textContent = fromParent ? "Deine Eltern haben bezahlt. Jetzt kannst du loslegen." : `Du hast ${nB(info.credits)} gekauft. Die Quittung kommt per E-Mail.`;
  $("#paidCode").textContent = code;
  $("#paidLeft").textContent = nB(info.remaining);
}
$("#paidGo").addEventListener("click", hideGate);
$("#paidCopy").addEventListener("click", () => copy($("#paidCode").textContent, "Code kopiert."));
$("#copyCode").addEventListener("click", () => copy(activeCode(), "Code kopiert."));
$("#buyMore").addEventListener("click", () => showGate("mehr"));
$("#creditPill").addEventListener("click", () => { if (!P.free) showGate(totalLeft() ? "mehr" : "leer"); });
$("#payClose").addEventListener("click", hideGate);
$("#codeUse").addEventListener("click", async () => {
  const code = $("#codeInput").value.trim(), err = $("#payErr"); err.textContent = "";
  if (!/^cs_(test|live)_/.test(code)) { err.textContent = "Ein Guthaben-Code beginnt mit «cs_live_» (oder «cs_test_»)."; return; }
  $("#codeUse").disabled = true;
  try {
    const d = await api("/api/guthaben", { code });
    if (d.status === "bezahlt" && d.remaining > 0) { adopt(code, d); toast(`Eingelöst: ${nB(d.remaining)} übrig.`); $("#codeInput").value = ""; hideGate(); }
    else if (d.status === "bezahlt") err.textContent = "Dieses Guthaben ist schon aufgebraucht.";
    else if (d.status === "abgelaufen") err.textContent = "Dieser Code ist abgelaufen.";
    else if (d.status === "erstattet") err.textContent = "Diese Zahlung wurde zurückerstattet.";
    else err.textContent = "Diese Zahlung ist noch nicht abgeschlossen.";
  } catch (e) { err.textContent = e.message; }
  finally { $("#codeUse").disabled = false; }
});
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); toast(msg); }
}

/* ---------- Fortschritt ---------- */
function renderProgress() {
  $("#progress").innerHTML = STEPS.map((n, i) =>
    `<li class="${i < S.step ? "done" : i === S.step ? "act" : ""}"><button type="button" data-goto="${i}" ${i > maxReachable() ? "disabled" : ""}>${i < S.step ? "✓" : i + 1}<span>${n}</span></button></li>`).join("");
  $("#progressText").textContent = S.step === 7 ? "Fertig" : `Schritt ${S.step + 1} von 7`;
  $("#progressBar").style.width = `${Math.min(S.step, 7) / 7 * 100}%`;
}
const maxReachable = () => S.ai ? 7 : Math.max(S.step, S.maxStep || 0);

function show(step) {
  S.step = step; S.maxStep = Math.max(S.maxStep || 0, step); save();
  $("#payGate").hidden = true; document.body.classList.remove("pay-mode"); stopPoll();
  if (step === 6) renderGenCost();
  $$(".panel").forEach(p => p.hidden = +p.dataset.step !== step);
  const nav = $("#wizNav");
  nav.hidden = step === 7;
  $("#back").style.visibility = step === 0 ? "hidden" : "visible";
  $("#next").innerHTML = step === 6 ? 'Bewerbung schreiben <span class="arrow" aria-hidden="true">→</span>' : 'Weiter <span class="arrow" aria-hidden="true">→</span>';
  document.body.classList.toggle("ws-mode", step === 7);
  renderProgress();
  if (step === 7) renderWorkspace();
  window.scrollTo({ top: 0, behavior: "smooth" });
  const h = $(`.panel[data-step="${step}"] h1`); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
}

/* ---------- Felder binden ---------- */
function bindFields() {
  $$("[data-bind]").forEach(el => {
    const p = el.dataset.bind;
    if (el.type === "radio") { el.checked = getPath(p) === el.value; el.addEventListener("change", () => { setPath(p, el.value); updateJobTitle(); }); }
    else { el.value = getPath(p) ?? ""; el.addEventListener("input", () => { setPath(p, el.value); el.classList.remove("invalid"); }); }
  });
}
function refreshBound() { $$("[data-bind]").forEach(el => { const v = getPath(el.dataset.bind); if (el.type === "radio") el.checked = v === el.value; else el.value = v ?? ""; }); }

/* Stichwort-Felder (Anforderungen, Hobbys) */
function renderTags(box) {
  const p = box.dataset.list, list = getPath(p) || [];
  $$(".tag", box).forEach(t => t.remove());
  const input = $("input", box);
  list.forEach((t, i) => input.insertAdjacentHTML("beforebegin", `<span class="tag">${esc(t)}<button type="button" aria-label="${esc(t)} entfernen" data-i="${i}">×</button></span>`));
}
function bindTags() {
  $$(".tag-input").forEach(box => {
    const p = box.dataset.list, input = $("input", box);
    const add = () => { const v = input.value.trim().replace(/,$/, ""); if (!v) return; const l = getPath(p) || []; if (!l.includes(v) && l.length < 12) setPath(p, [...l, v]); input.value = ""; renderTags(box); };
    input.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } if (e.key === "Backspace" && !input.value) { const l = getPath(p) || []; setPath(p, l.slice(0, -1)); renderTags(box); } });
    input.addEventListener("blur", add);
    box.addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (b) { const l = [...getPath(p)]; l.splice(+b.dataset.i, 1); setPath(p, l); renderTags(box); } else input.focus(); });
    renderTags(box);
  });
}

/* Wiederholbare Zeilen (Schule, Erfahrungen, Sprachen, Referenzen) */
function renderRows(box) {
  const p = box.dataset.rows, list = getPath(p);
  const fields = box.dataset.fields.split("|").map(f => { const [k, label, ph] = f.split(":"); return { k, label, ph }; });
  box.innerHTML = list.map((row, i) => `<div class="row-item">
      ${fields.map(f => `<div class="field"><label class="lbl sm" for="${p}-${i}-${f.k}">${f.label}</label>${f.ph === "select"
        ? `<select id="${p}-${i}-${f.k}" data-row="${i}" data-k="${f.k}">${LEVELS.map(l => `<option ${row[f.k] === l ? "selected" : ""}>${l}</option>`).join("")}</select>`
        : `<input id="${p}-${i}-${f.k}" data-row="${i}" data-k="${f.k}" value="${esc(row[f.k])}" placeholder="${esc(f.ph)}">`}</div>`).join("")}
      <button type="button" class="row-del" data-del="${i}" aria-label="Zeile entfernen">×</button></div>`).join("");
}
function bindRows() {
  $$(".rows").forEach(box => {
    const p = box.dataset.rows;
    box.addEventListener("input", e => { const el = e.target; if (el.dataset.row === undefined) return; getPath(p)[+el.dataset.row][el.dataset.k] = el.value; save(); });
    box.addEventListener("change", e => { const el = e.target; if (el.tagName === "SELECT") { getPath(p)[+el.dataset.row][el.dataset.k] = el.value; save(); } });
    box.addEventListener("click", e => { const b = e.target.closest("[data-del]"); if (!b) return; const l = getPath(p); l.splice(+b.dataset.del, 1); save(); renderRows(box); });
    renderRows(box);
  });
  $$("[data-add]").forEach(b => b.addEventListener("click", () => {
    const p = b.dataset.add, box = $(`.rows[data-rows="${p}"]`);
    const empty = Object.fromEntries(box.dataset.fields.split("|").map(f => { const [k, , ph] = f.split(":"); return [k, ph === "select" ? "gut" : ""]; }));
    if (getPath(p).length >= 8) return;
    getPath(p).push(empty); save(); renderRows(box); const inp = $$(".row-item", box).pop()?.querySelector("input,select"); inp?.focus();
  }));
}

/* Stärken */
function renderStrengths() {
  const all = [...new Set([...STRENGTHS, ...S.profile.staerken])];
  $("#strengths").innerHTML = all.map(s => `<button type="button" class="chip ${S.profile.staerken.includes(s) ? "on" : ""}" aria-pressed="${S.profile.staerken.includes(s)}">${S.profile.staerken.includes(s) ? "✓ " : ""}${esc(s)}</button>`).join("");
}
$("#strengths").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  const s = b.textContent.replace(/^✓ /, ""), l = S.profile.staerken;
  if (l.includes(s)) l.splice(l.indexOf(s), 1); else if (l.length < 6) l.push(s);
  save(); renderStrengths();
});

/* Foto (wird auf dem Gerät zugeschnitten, nie hochgeladen) */
function renderPhoto() {
  const box = $("#photoBox");
  box.innerHTML = S.profile.foto ? `<img src="${S.profile.foto}" alt="Dein Bewerbungsfoto">` : "<span>Foto</span>";
  $("#photoRemove").hidden = !S.profile.foto;
}
$("#photoInput").addEventListener("change", e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image();
  img.onload = () => {
    const W = 360, H = 480, r = Math.max(W / img.width, H / img.height);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const w = img.width * r, h = img.height * r;
    c.getContext("2d").drawImage(img, (W - w) / 2, (H - h) / 2.6, w, h);
    S.profile.foto = c.toDataURL("image/jpeg", .85); save(); renderPhoto(); URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(f); e.target.value = "";
});
$("#photoRemove").addEventListener("click", () => { S.profile.foto = ""; save(); renderPhoto(); });

/* ---------- Schritt 1: Inserat ---------- */
function setSrc(src, keepErr) {
  S.src = src; save();
  $$(".seg [data-src]").forEach(b => b.classList.toggle("on", b.dataset.src === src));
  $$("[data-src-panel]").forEach(p => p.hidden = p.dataset.srcPanel !== src);
  if (!keepErr) $("#jobErr").textContent = "";
}
$$(".seg [data-src]").forEach(b => b.addEventListener("click", () => setSrc(b.dataset.src)));
function updateJobTitle() {
  const has = S.job.beruf || S.job.firma;
  $("#jobCardTitle").textContent = S.jobRead ? "Das haben wir erkannt – stimmt alles?" : "Angaben zur Stelle";
  $("#jobCard").classList.toggle("filled", !!has);
}
async function readJob(payload) {
  const err = $("#jobErr"), load = $("#jobLoading");
  err.textContent = ""; load.hidden = false;
  $$("#readUrl,#readText").forEach(b => b.disabled = true);
  try {
    const d = await api("/api/inserat", withPay(payload));
    Object.assign(S.job, {
      beruf: d.beruf || S.job.beruf, firma: d.firma || "", strasse: d.strasse || "", plz_ort: d.plz_ort || "",
      kontakt_anrede: d.kontakt_anrede || "", kontakt_name: d.kontakt_name || "", lehrbeginn: d.lehrbeginn || "",
      anforderungen: (d.anforderungen || []).slice(0, 8), aufgaben: (d.aufgaben || []).slice(0, 6), art: d.ist_schnupperlehre ? "schnupper" : "lehre"
    });
    S.jobRead = true; save(); refreshBound(); $$(".tag-input").forEach(renderTags); updateJobTitle();
    $("#jobCard").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    if (e.pay) { showGate(P.codes.length ? "leer" : "start", e.message); return; }
    const msg = payload.url && !/Text/.test(e.message) ? e.message + " Kopier sonst den Text vom Inserat hier rein." : e.message;
    err.textContent = msg;
    if (payload.url && !/gültig|http/.test(e.message)) setTimeout(() => { setSrc("text", true); $("#jobErr").textContent = msg; $("#jobText").focus(); }, 1400);
  } finally { load.hidden = true; $$("#readUrl,#readText").forEach(b => b.disabled = false); }
}
$("#readUrl").addEventListener("click", () => {
  let v = $("#jobUrl").value.trim();
  if (!v) { $("#jobErr").textContent = "Füg zuerst den Link zum Inserat ein."; return; }
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try { new URL(v); } catch { $("#jobErr").textContent = "Das sieht nicht nach einem Link aus."; return; }
  readJob({ url: v });
});
$("#jobUrl").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("#readUrl").click(); } });
$("#readText").addEventListener("click", () => {
  const t = $("#jobText").value.trim();
  if (t.length < 120) { $("#jobErr").textContent = "Füg den ganzen Text vom Inserat ein (mindestens ein paar Sätze)."; return; }
  readJob({ text: t });
});

/* ---------- Prüfen vor «Weiter» ---------- */
function validate(step) {
  const need = [];
  if (step === 0 && !S.job.beruf.trim()) need.push("#f-beruf");
  if (step === 1) {
    if (!S.profile.vorname.trim()) need.push("#f-vn");
    if (!S.profile.nachname.trim()) need.push("#f-nn");
    if (!S.profile.plz_ort.trim()) need.push("#f-ort");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.profile.email.trim())) need.push("#f-mail");
  }
  if (step === 2 && !S.profile.schule.some(s => s.name.trim())) { const i = $('.rows[data-rows="profile.schule"] input[data-k="name"]'); if (i) need.push(i); }
  $$(".invalid").forEach(e => e.classList.remove("invalid"));
  need.forEach(n => (typeof n === "string" ? $(n) : n)?.classList.add("invalid"));
  if (need.length) {
    const first = typeof need[0] === "string" ? $(need[0]) : need[0];
    first?.focus(); toast(step === 0 ? "Gib mindestens den Beruf an." : step === 2 ? "Gib mindestens deine aktuelle Schule an." : "Bitte füll die markierten Felder aus.");
    return false;
  }
  return true;
}
function toast(msg) {
  let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = msg; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2800);
}

$("#next").addEventListener("click", () => {
  if (!validate(S.step)) return;
  if (S.step === 0 && S.src === "manual") S.jobRead = false;
  if (S.step === 6) return generate();
  show(S.step + 1);
});
$("#back").addEventListener("click", () => show(Math.max(0, S.step - 1)));
document.addEventListener("click", e => { const g = e.target.closest("[data-goto]"); if (g && !g.disabled) show(+g.dataset.goto); });

/* ---------- Vorlagen ---------- */
// Vorschau mit den eigenen Angaben; solange noch kein Name da ist, mit Beispielperson
function thumbState(t) {
  return S.profile.vorname.trim() ? S : Object.assign(window.ZV.sample(t.field), { job: Object.assign({}, window.ZV.sample(t.field).job, S.job.beruf ? { beruf: S.job.beruf } : {}) });
}
function tplThumb(t) {
  return `<div class="thumb">${window.ZV.mini(window.ZV.cv(thumbState(t), t))}</div>`;
}
function renderTplPick() {
  $("#tplPick").innerHTML = TEMPLATES.map(t => `<button type="button" role="radio" aria-checked="${S.template === t.id}" class="tpl-opt ${S.template === t.id ? "on" : ""}" data-tpl="${t.id}">${tplThumb(t)}<span>${t.name}</span></button>`).join("");
  $("#tplMini").innerHTML = TEMPLATES.map(t => `<button type="button" class="tpl-m ${S.template === t.id ? "on" : ""}" data-tpl="${t.id}" aria-label="Vorlage ${t.name}" aria-pressed="${S.template === t.id}">${tplThumb(t)}<span>${t.name}</span></button>`).join("");
  window.ZV.fit($("#tplPick")); window.ZV.fit($("#tplMini"));
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-tpl]"); if (!b) return;
  S.template = b.dataset.tpl; save(); renderTplPick(); if (S.step === 7) renderSheet();
});
function renderTone() { $$("[data-tone]").forEach(b => { b.classList.toggle("on", b.dataset.tone === S.tone); b.setAttribute("aria-checked", b.dataset.tone === S.tone); }); }
$("#toneSeg").addEventListener("click", e => { const b = e.target.closest("[data-tone]"); if (b) { S.tone = b.dataset.tone; save(); renderTone(); } });

/* ---------- KI: Bewerbung schreiben ---------- */
function apiProfile() {
  const p = S.profile, nonEmpty = a => a.filter(o => Object.values(o).some(v => String(v).trim()));
  return { vorname: p.vorname, geburtsdatum: p.geburtsdatum, klasse: p.klasse, schule: nonEmpty(p.schule), erfahrungen: nonEmpty(p.erfahrungen),
    staerken: p.staerken, hobbys: p.hobbys, sprachen: nonEmpty(p.sprachen), computer: p.computer, motivation: p.motivation };
}
async function generate() {
  if (!P.free && !hasTicket() && totalLeft() < 1) { showGate(P.codes.length ? "leer" : "start"); return; }
  const ov = $("#genOverlay"); ov.hidden = false; $("#genErr").textContent = "";
  const subs = ["Das dauert etwa 20 Sekunden.", "Zusago schaut, was der Betrieb sucht …", "… und verbindet es mit deinen Stärken.", "Gleich fertig."];
  let k = 0; const iv = setInterval(() => { k = Math.min(k + 1, subs.length - 1); $("#genSub").textContent = subs[k]; }, 5000);
  try {
    const code = activeCode();
    const d = await api("/api/generate", withPay({ job: S.job, profile: apiProfile(), tone: S.tone }));
    if (d.ticket) { S.ticket = d.ticket; S.ticketJob = jobSig(); }
    setLeft(code, d.guthaben);
    S.ai = normalizeAi(d); save(); show(7);
  } catch (e) {
    if (e.pay) { refreshCredits(); showGate(P.codes.length ? "leer" : "start", e.message); return; }
    $("#genErr").textContent = e.message;
  } finally { clearInterval(iv); ov.hidden = true; $("#genSub").textContent = subs[0]; }
}
function normalizeAi(d) {
  const str = v => typeof v === "string" ? v.trim() : "";
  return {
    kurzprofil: str(d.kurzprofil), staerken: (d.staerken || []).map(str).filter(Boolean).slice(0, 6),
    erfahrungen: (d.erfahrungen || []).map(e => ({ nr: +e.nr || 0, beschreibung: str(e.beschreibung) }))
      .filter(e => e.beschreibung && !/keine (konkreten )?(angaben|tätigkeiten|informationen)|nicht angegeben|nichts angegeben/i.test(e.beschreibung)),
    hobbys: str(d.hobbys), brief_betreff: str(d.brief_betreff), brief_absaetze: (d.brief_absaetze || []).map(str).filter(Boolean).slice(0, 5)
  };
}
/* ---------- Dokumente ---------- */
// Lebenslauf und Brief werden in vorlagen.js gebaut (gleich wie in der Vorschau auf der Website)
const ed = (path, text, tag = "span", cls = "") => `<${tag} class="ed ${cls}" contenteditable="true" spellcheck="true" data-edit="${path}">${esc(text)}</${tag}>`;
const currentTpl = () => TEMPLATES.find(x => x.id === S.template) || TEMPLATES[0];
function cvHTML() { return window.ZV.cv(S, currentTpl(), ed); }
function letterHTML() { return window.ZV.letter(S, currentTpl(), ed); }

/* ---------- Arbeitsbereich ---------- */
function renderWorkspace() {
  renderTplPick(); renderTone();
  $$(".doc-tabs [data-doc]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.doc === S.doc)));
  renderSheet(); requestAnimationFrame(moveDocInd);
}
function renderSheet() {
  $("#sheet").innerHTML = S.doc === "cv" ? cvHTML() : letterHTML();
  fitSheet();
}
function fitSheet() {
  const wrap = $("#sheetWrap"), page = $("#sheet .page"); if (!page) return;
  const sc = Math.min(1, (wrap.clientWidth) / page.offsetWidth);
  $("#sheet").style.transform = `scale(${sc})`;
  wrap.style.height = page.offsetHeight * sc + "px";
}
addEventListener("resize", () => { if (S.step === 7) { fitSheet(); moveDocInd(); } });
function moveDocInd() {
  const t = $(".doc-tabs [aria-selected=true]"), ind = $(".doc-tabs .tab-ind"); if (!t) return;
  ind.style.width = t.offsetWidth + "px"; ind.style.transform = `translateX(${t.offsetLeft - 4}px)`;
}
$(".doc-tabs").addEventListener("click", e => {
  const b = e.target.closest("[data-doc]"); if (!b) return;
  S.doc = b.dataset.doc; save();
  $$(".doc-tabs [data-doc]").forEach(x => x.setAttribute("aria-selected", String(x === b)));
  moveDocInd(); renderSheet();
});
// direkt im Dokument bearbeiten
$("#sheet").addEventListener("input", e => {
  const el = e.target.closest("[data-edit]"); if (!el) return;
  setPath(el.dataset.edit, el.innerText.replace(/\n{3,}/g, "\n\n").trim());
  fitSheet();
});
$("#sheet").addEventListener("paste", e => { if (!e.target.closest("[data-edit]")) return; e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); });

// Brief überarbeiten
async function rewrite(mode) {
  if (!S.ai?.brief_absaetze?.length) return;
  const load = $("#rwLoading"), err = $("#rwErr"); load.hidden = false; err.textContent = "";
  $$("[data-rw],#toneSeg2 button").forEach(b => b.disabled = true);
  try {
    const d = await api("/api/rewrite", withPay({ absaetze: S.ai.brief_absaetze, mode, beruf: S.job.beruf, firma: S.job.firma }));
    if (Array.isArray(d.absaetze) && d.absaetze.length) { S.ai.brief_absaetze = d.absaetze.map(s => String(s).trim()).filter(Boolean); save(); }
    if (S.doc !== "letter") $('.doc-tabs [data-doc="letter"]').click(); else renderSheet();
  } catch (e) { err.textContent = e.message; }
  finally { load.hidden = true; $$("[data-rw],#toneSeg2 button").forEach(b => b.disabled = false); }
}
$$("[data-rw]").forEach(b => b.addEventListener("click", () => rewrite(b.dataset.rw)));
$("#toneSeg2").addEventListener("click", e => { const b = e.target.closest("[data-tone]"); if (!b || b.dataset.tone === S.tone) return; S.tone = b.dataset.tone; save(); renderTone(); rewrite(S.tone); });

// PDF (über das Druckfenster des Browsers)
$$("[data-print]").forEach(b => b.addEventListener("click", () => {
  const which = b.dataset.print === "both" ? ["cv", "letter"] : [S.doc];
  $("#printRoot").innerHTML = which.map(d => d === "cv" ? cvHTML() : letterHTML()).join("");
  $$("#printRoot [contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
  const old = document.title;
  document.title = `${S.profile.vorname} ${S.profile.nachname} – ${which.length === 2 ? "Bewerbung" : which[0] === "cv" ? "Lebenslauf" : "Bewerbungsbrief"}`.trim();
  setTimeout(() => { window.print(); document.title = old; }, 50);
}));

$("#newJob").addEventListener("click", () => {
  S.job = fresh().job; S.ai = null; S.jobRead = false; S.maxStep = 0; S.ticket = null; S.ticketJob = null; S.step = 0; save();
  refreshBound(); $$(".tag-input").forEach(renderTags); $("#jobUrl").value = ""; $("#jobText").value = ""; updateJobTitle();
  if (!canWork()) showGate("leer"); else show(0);
});
$("#wipe").addEventListener("click", () => {
  const left = totalLeft();
  if (!confirm("Willst du wirklich alle deine Angaben auf diesem Gerät löschen?" + (left ? `\n\nAuch dein Guthaben-Code wird gelöscht (noch ${nB(left)}). Kopier ihn vorher, wenn du ihn noch brauchst:\n${activeCode()}` : ""))) return;
  try { localStorage.removeItem(STORE); localStorage.removeItem(PAYSTORE); } catch {}
  location.href = "app.html";
});

/* ---------- Start ---------- */
bindFields(); bindTags(); bindRows(); renderStrengths(); renderPhoto(); renderTplPick(); renderTone(); setSrc(S.src || "link"); updateJobTitle(); renderCredits();
const params = new URLSearchParams(location.search);
if (PRICES[params.get("pack")]) pickPkg(+params.get("pack")); else pickPkg(5);
if (params.get("tpl") && TEMPLATES.some(t => t.id === params.get("tpl"))) { S.template = params.get("tpl"); save(); renderTplPick(); }
if (params.get("link")) { S.step = 0; setSrc("link"); $("#jobUrl").value = params.get("link"); }
else if (params.get("src") === "manual") { S.step = 0; setSrc("manual"); }
const paidCode = params.get("bezahlt"), cancelled = params.get("abgebrochen");
history.replaceState(null, "", "app.html");

(async function boot() {
  if (paidCode && /^cs_(test|live)_/.test(paidCode)) {
    showGate("start"); $("#payLoading").hidden = false; $("#payLoadingText").textContent = "Zahlung wird bestätigt …";
    for (let i = 0; i < 6; i++) {
      try {
        const d = await api("/api/guthaben", { code: paidCode });
        if (d.status === "bezahlt") { $("#payLoading").hidden = true; adopt(paidCode, d); P.parentUrl = null; savePay(); showPaid(paidCode, d, false); return; }
      } catch (e) { if (e.pay) break; }
      await new Promise(r => setTimeout(r, 2500));
    }
    $("#payLoading").hidden = true; $("#payErr").textContent = "Wir konnten die Zahlung noch nicht bestätigen. Lad die Seite in einer Minute neu oder schreib uns.";
    return;
  }
  if (cancelled) { P.pending = null; P.parentUrl = null; savePay(); }
  if (!canWork()) showGate(P.codes.length ? "leer" : "start", cancelled ? "Die Zahlung wurde abgebrochen. Du kannst es jederzeit nochmals versuchen." : "");
  else start();
  await refreshCredits();
  // Test-Modus erkannt oder Guthaben inzwischen da → Kasse schliessen
  if (!$("#payGate").hidden && $("#payGate").dataset.mode !== "bezahlt" && canWork() && !cancelled && (P.free || $("#payGate").dataset.mode === "start")) start();
})();
function start() {
  if (params.get("link")) { show(0); $("#readUrl").click(); }
  else show(S.step === 7 && !S.ai ? 6 : S.step || 0);
}
