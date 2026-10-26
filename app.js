/* =========================================================
   Zusago – App (Lebenslauf und Bewerbung erstellen)
   Alle Angaben bleiben im Browser (localStorage).
   Die Vorschau ist gratis (max. 3 pro Gerät und Tag, mit Wasserzeichen).
   Bezahlt wird erst beim Herunterladen (Stripe Checkout: TWINT, Karte, Apple Pay, Google Pay).
   ========================================================= */

// Adresse des KI-Servers (Render Web Service). Falls dein Service anders heisst, hier anpassen.
const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "http://127.0.0.1:8787" : "https://zusago-api.onrender.com";

const STORE = "zusago:v1";
const STRENGTHS = ["zuverlässig", "pünktlich", "genau", "geduldig", "hilfsbereit", "kreativ", "teamfähig", "selbstständig", "kommunikativ", "handwerklich geschickt", "logisch denkend", "motiviert", "belastbar", "offen", "ordentlich", "freundlich"];

/* ---------- Lebensphasen: steuern Fragen, Aufbau, Vorlagen und Tonalität ---------- */
const PH = {
  lehre: {
    arts: [["lehre", "Lehrstelle"], ["schnupper", "Schnupperlehre"]],
    steps: ["Inserat", "Über dich", "Schule", "Erfahrungen", "Stärken", "Referenzen", "Vorlage", "Fertig"],
    beruf: "Beruf *", berufPh: "z.B. Informatiker/in EFZ", beginn: "Lehrbeginn", beginnPh: "z.B. August 2027",
    t2: "Deine Schulzeit", p2: "Die aktuelle Schule zuerst, danach die Primarschule.", klasse: true, extras2: false,
    schule: "zeit:Zeitraum:2023 – heute|name:Schule:Sekundarschule Solothurn|details:Niveau / Details:Niveau A", addSchule: "+ Weitere Schule",
    t3: "Schnupperlehren und Erfahrungen", p3: "Schnupperlehren, Ferienjobs, Ämtli oder Mithilfe im Familienbetrieb – alles zählt. Noch nichts? Dann einfach weiter.",
    erf: "zeit:Wann:März 2026|titel:Was:Schnupperlehre Informatikerin EFZ|ort:Wo:Muster AG, Solothurn|details:Was hast du gemacht? (freiwillig):Laptops eingerichtet", extras3: false,
    st: STRENGTHS, lblSt: "Deine Stärken", p4: "Tipp deine Stärken an. Die KI wählt die passendsten für den Beruf aus.",
    hob: "Hobbys und Vereine", mot: "Warum interessiert dich dieser Beruf? (freiwillig, hilft der KI sehr)",
    p5: "Personen, die der Firma über dich Auskunft geben können, z.B. deine Klassenlehrperson. Frag sie vorher, ob das in Ordnung ist. Freiwillig.",
    letter: "Bewerbungsbrief", fam: "start", tpl: "luzern", pack: 3
  },
  studium: {
    arts: [["stelle", "Stelle oder Nebenjob"], ["praktikum", "Praktikum"], ["initiativ", "Initiativbewerbung"]],
    steps: ["Inserat", "Über dich", "Ausbildung", "Erfahrungen", "Kenntnisse", "Referenzen", "Vorlage", "Fertig"],
    beruf: "Stelle *", berufPh: "z.B. Werkstudent/in Data Analytics", beginn: "Beginn", beginnPh: "z.B. Februar 2027",
    t2: "Deine Ausbildung", p2: "Das aktuelle Studium zuerst, danach Matura oder Lehre.", klasse: false, extras2: true,
    schule: "zeit:Zeitraum:2024 – heute|name:Studium / Schule:BSc Wirtschaftsinformatik, FHNW|details:Schwerpunkt / Details:Schwerpunkt Data Science", addSchule: "+ Weitere Ausbildung",
    t3: "Projekte und Nebenjobs", p3: "Nebenjobs, Projekte im Studium, Vereinsarbeit, Praktika – alles, was zeigt, wie du arbeitest.",
    erf: "zeit:Wann:2025 – heute|titel:Was:Nebenjob Verkauf|ort:Wo:Muster AG, Basel|details:Was hast du gemacht? (freiwillig):Kasse, Beratung, Monatsabschluss", extras3: false,
    st: ["analytisch", "selbstständig", "strukturiert", "lernfreudig", "teamfähig", "kommunikativ", "zuverlässig", "belastbar", "kreativ", "lösungsorientiert", "genau", "flexibel"], lblSt: "Deine Stärken", p4: "Tipp deine Stärken an. Die KI wählt die passendsten für die Stelle aus.",
    hob: "Engagement und Interessen", mot: "Was reizt dich an dieser Stelle? (freiwillig, hilft der KI sehr)",
    p5: "Personen, die über dich Auskunft geben können, z.B. eine Dozentin oder deine Chefin im Nebenjob. Frag sie vorher. Freiwillig.",
    letter: "Bewerbungsschreiben", fam: "campus", tpl: "basel", pack: 3
  },
  praktikum: {
    arts: [["praktikum", "Praktikum"], ["initiativ", "Initiativbewerbung"]],
    steps: ["Inserat", "Über dich", "Ausbildung", "Erfahrungen", "Kenntnisse", "Referenzen", "Vorlage", "Fertig"],
    beruf: "Praktikum *", berufPh: "z.B. Praktikum Marketing", beginn: "Beginn", beginnPh: "z.B. August 2027",
    t2: "Deine Ausbildung", p2: "Die aktuelle Schule oder das Studium zuerst.", klasse: false, extras2: true,
    schule: "zeit:Zeitraum:2022 – 2026|name:Schule / Studium:Gymnasium Solothurn|details:Schwerpunkt / Details:Schwerpunktfach Wirtschaft und Recht", addSchule: "+ Weitere Ausbildung",
    t3: "Erfahrungen", p3: "Nebenjobs, Ferienjobs, Projekte oder Vereinsarbeit – alles zählt.",
    erf: "zeit:Wann:Sommer 2025|titel:Was:Ferienjob Rezeption|ort:Wo:Hotel Muster, Interlaken|details:Was hast du gemacht? (freiwillig):Gäste empfangen, Buchungen", extras3: false,
    st: ["lernfreudig", "selbstständig", "kommunikativ", "kreativ", "teamfähig", "zuverlässig", "offen", "organisiert", "genau", "motiviert", "flexibel", "neugierig"], lblSt: "Deine Stärken", p4: "Tipp deine Stärken an. Die KI wählt die passendsten fürs Praktikum aus.",
    hob: "Interessen", mot: "Was möchtest du in diesem Praktikum lernen? (freiwillig, hilft der KI sehr)",
    p5: "Personen, die über dich Auskunft geben können, z.B. eine Lehrperson oder dein Chef im Ferienjob. Frag sie vorher. Freiwillig.",
    letter: "Motivationsschreiben", fam: "campus", tpl: "genf", pack: 3
  },
  beruf: {
    arts: [["stelle", "Stelle"], ["initiativ", "Initiativbewerbung"]],
    steps: ["Inserat", "Über dich", "Ausbildung", "Berufserfahrung", "Kompetenzen", "Referenzen", "Vorlage", "Fertig"],
    beruf: "Stelle *", berufPh: "z.B. Teamleiter/in Produktion", beginn: "Eintritt", beginnPh: "z.B. per 1. März 2027 oder nach Vereinbarung",
    t2: "Aus- und Weiterbildung", p2: "Die neueste Aus- oder Weiterbildung zuerst. Die Schulzeit brauchst du nicht mehr.", klasse: false, extras2: false,
    schule: "zeit:Zeitraum:2019 – 2021|name:Abschluss:Techniker/in HF Maschinenbau|details:Schule / Details:HF Bern", addSchule: "+ Weitere Aus- oder Weiterbildung",
    t3: "Deine Berufserfahrung", p3: "Die aktuelle Stelle zuerst. Schreib kurz dazu, was du gemacht und erreicht hast – das macht den Lebenslauf stark.",
    erf: "zeit:Wann:2021 – heute|titel:Funktion:Schichtleiter Produktion|ort:Firma:Muster AG, Solothurn|details:Aufgaben und Erfolge (freiwillig):Team von 9 Personen, Ausschuss um 18 % gesenkt", extras3: true,
    st: ["Führung", "lösungsorientiert", "zuverlässig", "strukturiert", "kommunikativ", "belastbar", "selbstständig", "teamfähig", "kundenorientiert", "genau", "analytisch", "flexibel"], lblSt: "Deine Kompetenzen", p4: "Tipp an, was dich ausmacht. Die KI wählt das Passendste für die Stelle aus.",
    hob: "Interessen (freiwillig)", mot: "Warum diese Stelle, warum jetzt? (freiwillig, hilft der KI sehr)",
    p5: "Frühere Vorgesetzte, die über dich Auskunft geben können. Frag sie vorher. Lässt du das leer, steht «Referenzen auf Anfrage» im Lebenslauf.",
    letter: "Bewerbungsschreiben", fam: "beruf", tpl: "zuerich", pack: 10
  }
};
const ph = () => PH[S.phase] || PH.lehre;
let STEPS = PH.lehre.steps;
const LEVELS = ["Muttersprache", "sehr gut", "gut", "Grundkenntnisse"];
const TEMPLATES = window.ZV.TEMPLATES; // alle Vorlagen kommen aus vorlagen.js

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Zustand ---------- */
const fresh = () => ({
  step: 0, src: "link", template: "luzern", tone: "normal", doc: "cv",
  job: { art: "lehre", beruf: "", firma: "", strasse: "", plz_ort: "", kontakt_anrede: "", kontakt_name: "", lehrbeginn: "", anforderungen: [], aufgaben: [] },
  profile: {
    vorname: "", nachname: "", strasse: "", plz_ort: "", telefon: "", email: "", geburtsdatum: "", nationalitaet: "", foto: "",
    klasse: "", schule: [{ zeit: "", name: "", details: "" }], erfahrungen: [{ zeit: "", titel: "", ort: "" }],
    staerken: [], hobbys: [], sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "gut" }, { sprache: "Französisch", niveau: "Grundkenntnisse" }],
    computer: "", motivation: "", referenzen: [{ name: "", funktion: "", telefon: "" }],
    verfuegbar: "", pensum: "", fuehrung: "", kuendigung: "", lohn: ""
  },
  phase: "",
  ai: null,
  apps: [], curApp: null   // Bewerbungs-Tracker
});
let S = load();
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE));
    if (d && d.profile) { const f = fresh(), o = Object.assign(f, d); o.profile = Object.assign(fresh().profile, d.profile); if (d.ai && !d.phase) o.phase = "lehre"; return o; }
  } catch {}
  return fresh();
}
let saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { syncApp(); try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} }, 250); }
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
const PRICES = { 1: 7.90, 3: 17.90, 10: 39.90 };
let P = loadPay();
function loadPay() {
  try { const d = JSON.parse(localStorage.getItem(PAYSTORE)); if (d && Array.isArray(d.codes)) return d; } catch {}
  return { codes: [], pending: null, free: false };
}
if (!P.dev) { P.dev = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)); try { localStorage.setItem(PAYSTORE, JSON.stringify(P)); } catch {} }
function savePay() { try { localStorage.setItem(PAYSTORE, JSON.stringify(P)); } catch {} renderCredits(); }
const totalLeft = () => P.codes.reduce((a, c) => a + (c.remaining || 0), 0);
const activeCode = () => (P.codes.find(c => c.remaining > 0) || P.codes[P.codes.length - 1] || {}).code || "";
const jobSig = () => [S.job.beruf, S.job.firma, S.job.art].map(x => String(x || "").trim().toLowerCase()).join("|");
const hasTicket = () => !!S.ticket && S.ticketJob === jobSig();
const unlocked = () => P.free || hasTicket();
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
  $("#creditText").innerHTML = P.free ? "Test-Modus" : `${left}<span class="cp-long"> ${left === 1 ? "Bewerbung" : "Bewerbungen"}</span> übrig`;
  pill.classList.toggle("empty", !P.free && left < 1);
  $("#creditLine").innerHTML = P.free ? "Test-Modus: alles gratis." : `<b>${nB(left)}</b> übrig`;
  $("#myCode").textContent = activeCode() || "–";
  $("#copyCode").hidden = !activeCode();
  $("#creditBlock").hidden = !P.free && !P.codes.length;
  renderGenCost();
}
function renderGenCost() {
  const el = $("#genCost"); if (!el) return;
  el.textContent = P.free ? "" : hasTicket() ? "Diese Bewerbung ist schon freigeschaltet – neu schreiben kostet nichts."
    : "Die Vorschau ist gratis. Bezahlt wird erst beim Herunterladen.";
}

/* Kasse anzeigen */
let pickN = 10, pollT = null;
function showGate(mode = "download", msg = "") {
  $$(".panel").forEach(p => p.hidden = true);
  $("#wizNav").hidden = true; document.body.classList.remove("ws-mode"); document.body.classList.add("pay-mode");
  const g = $("#payGate"); g.hidden = false; g.dataset.mode = mode;
  const T = {
    download: ["Herunterladen", "Gefällt dir die Vorschau?", "Mit einer Bewerbung schaltest du Lebenslauf und Brief für diese Stelle frei: ohne Wasserzeichen, als PDF, im Text änderbar und beliebig oft neu schreiben. Einmal bezahlen, kein Abo, kein Konto. Guthaben gilt 12 Monate."],
    limit: ["Gratis-Vorschauen aufgebraucht", "Mit einem Paket geht es weiter", "Pro Tag gibt es 3 Gratis-Vorschauen. Mit einem Paket schreibst du sofort weiter – deine Angaben bleiben gespeichert."],
    leer: ["Guthaben aufgebraucht", "Kauf weitere Bewerbungen", "Deine bisherigen Bewerbungen bleiben freigeschaltet. Für eine neue Stelle brauchst du eine weitere Bewerbung."],
    mehr: ["Guthaben", "Weitere Bewerbungen kaufen", "Je mehr Bewerbungen du auf einmal kaufst, desto günstiger wird eine einzelne. Dein bisheriges Guthaben bleibt."],
    bezahlt: ["Zahlung erhalten", "Danke, das hat geklappt", ""]
  }[mode];
  $("#payEyebrow").textContent = T[0];
  $("#payTitle").innerHTML = `${T[1]}<span class="dot">${mode === "bezahlt" ? "!" : "."}</span>`;
  $("#payLead").textContent = T[2];
  $$("#payPkgs,.pay-box,.pay-code").forEach(el => el.hidden = mode === "bezahlt");
  if (mode === "bezahlt") $("#parentBox").hidden = true;
  $("#paidBox").hidden = mode !== "bezahlt";
  $("#payClose").hidden = mode === "bezahlt";
  $("#payClose").textContent = S.ai ? "← Zurück zur Vorschau" : "← Zurück";
  $("#payErr").textContent = msg;
  if (mode !== "bezahlt" && P.pending) resumeParentWait();
  window.scrollTo({ top: 0 });
  $("#payTitle").setAttribute("tabindex", "-1"); $("#payTitle").focus({ preventScroll: true });
}
function hideGate() {
  stopPoll(); $("#payGate").hidden = true; document.body.classList.remove("pay-mode");
  show(S.step === 7 && !S.ai ? 6 : S.step || 0);
}
const afterPay = () => { if (S.ai && !unlocked()) { show(7); unlock(); } else hideGate(); };
function pickPkg(n) {
  pickN = PRICES[n] ? n : 10;
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
  const text = `Hallo! Ich schreibe meine Bewerbung${S.job.beruf ? " für «" + S.job.beruf + "»" : ""} mit Zusago. Kannst du ${nB(n)} für mich bezahlen (${price}, einmalig, kein Abo)? Das geht mit TWINT oder Karte: ${url}`;
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
  $("#payLead").textContent = fromParent ? (!S.phase || S.phase === "lehre" ? "Deine Eltern haben bezahlt. Jetzt kannst du loslegen." : "Die Zahlung über den Link ist eingegangen. Jetzt kannst du loslegen.") : `Du hast ${nB(info.credits)} gekauft. Die Quittung kommt per E-Mail.`;
  $("#paidGoText").textContent = S.ai && !unlocked() ? "Bewerbung freischalten und herunterladen" : S.ai ? "Zurück zur Bewerbung" : "Jetzt Bewerbung erstellen";
  $("#paidCode").textContent = code;
  $("#paidLeft").textContent = nB(info.remaining);
}
$("#paidGo").addEventListener("click", afterPay);
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
    if (d.status === "bezahlt" && d.remaining > 0) { adopt(code, d); toast(`Eingelöst: ${nB(d.remaining)} übrig.`); $("#codeInput").value = ""; afterPay(); }
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

/* ---------- Lebensphase anwenden ---------- */
const setT = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
function renderArt() {
  const arts = ph().arts;
  if (!arts.some(([k]) => k === S.job.art)) S.job.art = arts[0][0];
  $("#artRow").innerHTML = arts.map(([k, l]) => `<label class="radio"><input type="radio" name="art" value="${k}"${S.job.art === k ? " checked" : ""}> ${l}</label>`).join("");
}
$("#artRow").addEventListener("change", e => { if (e.target.name === "art") { S.job.art = e.target.value; save(); updateJobTitle(); } });
function applyPhase() {
  const c = ph(), on = !!S.phase;
  STEPS = c.steps;
  $$("#phasePick .ph-opt").forEach(b => { const a = b.dataset.phase === S.phase; b.classList.toggle("on", a); b.setAttribute("aria-checked", a); });
  $("#phasePick").classList.toggle("picked", on);
  document.body.dataset.phase = S.phase || "";
  renderArt();
  setT("#lblBeruf", c.beruf); $("#f-beruf").placeholder = c.berufPh;
  setT("#lblBeginn", c.beginn); $("#f-lb").placeholder = c.beginnPh;
  $("#t2").innerHTML = `${esc(c.t2)}<span class="dot">.</span>`; setT("#p2", c.p2);
  $("#klasseField").hidden = !c.klasse; $("#extras2").hidden = !c.extras2;
  $("#t3").innerHTML = `${esc(c.t3)}<span class="dot">.</span>`; setT("#p3", c.p3);
  $("#extras3").hidden = !c.extras3;
  const sb = $('.rows[data-rows="profile.schule"]'), eb = $('.rows[data-rows="profile.erfahrungen"]');
  if (sb.dataset.fields !== c.schule) { sb.dataset.fields = c.schule; renderRows(sb); }
  if (eb.dataset.fields !== c.erf) { eb.dataset.fields = c.erf; renderRows(eb); }
  setT("#addSchule", c.addSchule);
  setT("#lblSt", c.lblSt); setT("#p4", c.p4); setT("#lblHob", c.hob); setT("#lblMot", c.mot); setT("#p5", c.p5);
  setT("#tabLetter", c.letter);
  setT("#payParent", !S.phase || S.phase === "lehre" ? "Eltern bezahlen lassen" : "Bezahl-Link teilen");
  renderStrengths(); renderProgress();
}
$("#phasePick").addEventListener("click", e => {
  const b = e.target.closest("[data-phase]"); if (!b) return;
  setPhase(b.dataset.phase, true);
});
function setPhase(phase, byUser) {
  if (!PH[phase]) return;
  const changed = S.phase !== phase;
  S.phase = phase;
  if (changed && !S.tplChosen) S.template = PH[phase].tpl;
  if (changed) pickPkg(PH[phase].pack);
  save(); applyPhase(); renderTplPick();
  $("#phasePick").classList.remove("invalid");
  if (byUser) { $("#phaseHint").textContent = "Gut. Die Fragen sind jetzt auf deine Situation abgestimmt – du kannst das jederzeit ändern."; }
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
  const all = [...new Set([...ph().st, ...S.profile.staerken])];
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
    const d = await api("/api/inserat", Object.assign({ phase: S.phase || undefined }, payload));
    Object.assign(S.job, {
      beruf: d.beruf || S.job.beruf, firma: d.firma || "", strasse: d.strasse || "", plz_ort: d.plz_ort || "",
      kontakt_anrede: d.kontakt_anrede || "", kontakt_name: d.kontakt_name || "", lehrbeginn: d.lehrbeginn || "",
      anforderungen: (d.anforderungen || []).slice(0, 8), aufgaben: (d.aufgaben || []).slice(0, 6)
    });
    const zg = PH[d.zielgruppe] ? d.zielgruppe : "";
    if (!S.phase && zg) { setPhase(zg); $("#phaseHint").textContent = "Vorgeschlagen aus dem Inserat. Stimmt das nicht? Tipp einfach eine andere Lebensphase an."; }
    const artMap = { lehrstelle: "lehre", schnupperlehre: "schnupper", praktikum: "praktikum", stelle: "stelle" };
    const art = d.ist_schnupperlehre ? "schnupper" : artMap[d.stellenart];
    if (art && ph().arts.some(([k]) => k === art)) S.job.art = art;
    renderArt();
    S.jobRead = true; save(); refreshBound(); $$(".tag-input").forEach(renderTags); updateJobTitle();
    $("#jobCard").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
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
  if (step === 0 && !S.phase) need.push("#phasePick");
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
    if (first && first.focus) { if (first.id === "phasePick") first.scrollIntoView({ behavior: "smooth", block: "center" }); else first.focus(); } toast(step === 0 ? (!S.phase ? "Wähl zuerst aus, wo du gerade stehst." : `Gib mindestens die Stelle an.`) : step === 2 ? (S.phase === "beruf" ? "Gib mindestens eine Aus- oder Weiterbildung an." : "Gib mindestens deine aktuelle Schule oder Ausbildung an.") : "Bitte füll die markierten Felder aus.");
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
  if (S.profile.vorname.trim()) return S;
  const smp = window.ZV.sampleFor ? window.ZV.sampleFor(t) : window.ZV.sample(t.field);
  return Object.assign({}, smp, { phase: S.phase || smp.phase, job: Object.assign({}, smp.job, S.job.beruf ? { beruf: S.job.beruf } : {}) });
}
function tplThumb(t) {
  return `<div class="thumb">${window.ZV.mini(window.ZV.cv(thumbState(t), t))}</div>`;
}
function tplOrder() {
  const fam = ph().fam;
  return [...TEMPLATES.filter(t => t.fam === fam), ...TEMPLATES.filter(t => t.fam !== fam)];
}
function renderTplPick() {
  const list = S.phase ? tplOrder() : TEMPLATES;
  $("#tplPick").innerHTML = list.map(t => `<button type="button" role="radio" aria-checked="${S.template === t.id}" class="tpl-opt ${S.template === t.id ? "on" : ""}" data-tpl="${t.id}">${tplThumb(t)}<span>${t.name}</span></button>`).join("");
  $("#tplMini").innerHTML = list.map(t => `<button type="button" class="tpl-m ${S.template === t.id ? "on" : ""}" data-tpl="${t.id}" aria-label="Vorlage ${t.name}" aria-pressed="${S.template === t.id}">${tplThumb(t)}<span>${t.name}</span></button>`).join("");
  window.ZV.fit($("#tplPick")); window.ZV.fit($("#tplMini"));
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-tpl]"); if (!b) return;
  S.template = b.dataset.tpl; S.tplChosen = true; save(); renderTplPick(); if (S.step === 7) renderSheet();
});
function renderTone() { $$("[data-tone]").forEach(b => { b.classList.toggle("on", b.dataset.tone === S.tone); b.setAttribute("aria-checked", b.dataset.tone === S.tone); }); }
$("#toneSeg").addEventListener("click", e => { const b = e.target.closest("[data-tone]"); if (b) { S.tone = b.dataset.tone; save(); renderTone(); } });

/* ---------- KI: Bewerbung schreiben ---------- */
function apiProfile() {
  const p = S.profile, nonEmpty = a => a.filter(o => Object.values(o).some(v => String(v).trim()));
  return { vorname: p.vorname, geburtsdatum: p.geburtsdatum, klasse: p.klasse, schule: nonEmpty(p.schule), erfahrungen: nonEmpty(p.erfahrungen),
    staerken: p.staerken, hobbys: p.hobbys, sprachen: nonEmpty(p.sprachen), computer: p.computer, motivation: p.motivation,
    verfuegbar: p.verfuegbar, pensum: p.pensum, ...(S.phase === "beruf" ? { fuehrung: p.fuehrung, kuendigung: p.kuendigung, lohn: p.lohn } : {}) };
}
async function generate() {
  const ov = $("#genOverlay"); ov.hidden = false; $("#genErr").textContent = "";
  const subs = ["Das dauert etwa 20 Sekunden.", "Zusago schaut, was die Firma sucht …", "… und verbindet es mit deinen Stärken.", "Gleich fertig."];
  let k = 0; const iv = setInterval(() => { k = Math.min(k + 1, subs.length - 1); $("#genSub").textContent = subs[k]; }, 5000);
  try {
    const d = await api("/api/generate", withPay({ job: S.job, profile: apiProfile(), tone: S.tone, phase: S.phase, dev: P.dev }));
    if (d.ticket) { S.ticket = d.ticket; S.ticketJob = jobSig(); }
    S.ai = normalizeAi(d); trackUpsert(); save(); renderTrack(); show(7);
  } catch (e) {
    if (e.pay) { showGate("limit", e.message); return; }
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
const currentTpl = () => window.ZV.byId(S.template);
// In der Vorschau: kein Bearbeiten, Wasserzeichen darüber
const WM = '<div class="wm" aria-hidden="true">' + "<span>VORSCHAU · zusago.ch</span>".repeat(7) + "</div>";
function cvHTML(forPrint) { return forPrint ? window.ZV.cv(S, currentTpl()) : window.ZV.cv(S, currentTpl(), unlocked() ? ed : undefined); }
function letterHTML(forPrint) { return forPrint ? window.ZV.letter(S, currentTpl()) : window.ZV.letter(S, currentTpl(), unlocked() ? ed : undefined); }

/* ---------- Arbeitsbereich ---------- */
function renderLock() {
  const open = unlocked();
  document.body.classList.toggle("is-preview", !open);
  $("#unlockBlock").hidden = open; $("#dlBlock").hidden = !open;
  $(".edit-hint").textContent = open ? "Klick in den Text, um ihn direkt zu ändern." : "Vorschau – nach dem Freischalten kannst du den Text direkt ändern.";
  $("#unlockErr").textContent = "";
  $("#doneT").textContent = open ? "Stark!" : "Deine Vorschau ist bereit.";
  $("#doneS").textContent = open ? "Deine Bewerbung ist freigeschaltet. Lies sie in Ruhe durch und änder, was du willst." : "Lies sie durch, wechsle Vorlage oder Ton. Zum Herunterladen schaltest du sie frei.";
  const left = totalLeft();
  $("#unlockCost").textContent = left > 0 ? `Braucht 1 Bewerbung von deinem Guthaben (noch ${left}).` : "Ab CHF 3.99 pro Bewerbung. TWINT, Karte, Apple Pay oder Google Pay.";
}
async function unlock() {
  if (unlocked()) { renderLock(); return; }
  if (totalLeft() < 1) { showGate("download"); return; }
  const load = $("#unlockLoading"), err = $("#unlockErr"), btn = $("#unlockBtn");
  load.hidden = false; err.textContent = ""; btn.disabled = true;
  try {
    const code = activeCode();
    const d = await api("/api/unlock", { code, job: S.job, ticket: S.ticket || undefined });
    S.ticket = d.ticket; S.ticketJob = jobSig(); setLeft(code, d.guthaben); trackUpsert(); save();
    renderWorkspace(); toast("Freigeschaltet. Jetzt kannst du herunterladen.");
    $("#dlBlock").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (e) {
    if (e.pay) { await refreshCredits(); showGate(totalLeft() ? "download" : P.codes.length ? "leer" : "download", P.codes.length ? e.message : ""); return; }
    err.textContent = e.message;
  } finally { load.hidden = true; btn.disabled = false; }
}
$("#unlockBtn").addEventListener("click", unlock);
function renderWorkspace() {
  renderLock(); renderTplPick(); renderTone();
  $$(".doc-tabs [data-doc]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.doc === S.doc)));
  renderSheet(); requestAnimationFrame(moveDocInd);
}
function renderSheet() {
  $("#sheet").innerHTML = (S.doc === "cv" ? cvHTML() : letterHTML()) + (unlocked() ? "" : WM);
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
  const el = e.target.closest("[data-edit]"); if (!el || !unlocked()) return;
  setPath(el.dataset.edit, el.innerText.replace(/\n{3,}/g, "\n\n").trim());
  fitSheet();
});
["copy", "cut", "contextmenu", "dragstart"].forEach(ev => $("#sheet").addEventListener(ev, e => { if (!unlocked()) { e.preventDefault(); if (ev === "copy") toast("In der Vorschau kann man nicht kopieren. Schalte die Bewerbung frei."); } }));
$("#sheet").addEventListener("paste", e => { if (!e.target.closest("[data-edit]")) return; e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); });

// Brief überarbeiten
async function rewrite(mode) {
  if (!S.ai?.brief_absaetze?.length) return;
  const load = $("#rwLoading"), err = $("#rwErr"); load.hidden = false; err.textContent = "";
  $$("[data-rw],#toneSeg2 button").forEach(b => b.disabled = true);
  try {
    const d = await api("/api/rewrite", withPay({ absaetze: S.ai.brief_absaetze, mode, beruf: S.job.beruf, firma: S.job.firma, phase: S.phase }));
    if (Array.isArray(d.absaetze) && d.absaetze.length) { S.ai.brief_absaetze = d.absaetze.map(s => String(s).trim()).filter(Boolean); save(); }
    if (S.doc !== "letter") $('.doc-tabs [data-doc="letter"]').click(); else renderSheet();
  } catch (e) { err.textContent = e.message; }
  finally { load.hidden = true; $$("[data-rw],#toneSeg2 button").forEach(b => b.disabled = false); }
}
$$("[data-rw]").forEach(b => b.addEventListener("click", () => rewrite(b.dataset.rw)));
$("#toneSeg2").addEventListener("click", e => { const b = e.target.closest("[data-tone]"); if (!b || b.dataset.tone === S.tone) return; S.tone = b.dataset.tone; save(); renderTone(); rewrite(S.tone); });

// PDF (über das Druckfenster des Browsers)
$$("[data-print]").forEach(b => b.addEventListener("click", async () => {
  if (!unlocked()) { unlock(); return; }
  const mode = b.dataset.print, which = mode === "current" ? [S.doc] : ["cv", "letter"];
  const extra = mode === "dossier" ? ATT.flatMap(a => a.pages.map(src => `<div class="page att-page"><img src="${src}" alt="${esc(a.name)}"></div>`)).join("") : "";
  $("#printRoot").innerHTML = which.map(d => d === "cv" ? cvHTML(true) : letterHTML(true)).join("") + extra;
  $$("#printRoot [contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
  await Promise.all($$("#printRoot img").map(i => i.decode ? i.decode().catch(() => {}) : null));
  const old = document.title, name = `${S.profile.vorname} ${S.profile.nachname}`.trim();
  document.title = `${name} – ${mode === "dossier" ? "Bewerbungsdossier" : which.length === 2 ? "Bewerbung" : which[0] === "cv" ? "Lebenslauf" : "Bewerbungsbrief"}${S.job.firma ? " " + S.job.firma : ""}`;
  setTimeout(() => { window.print(); document.title = old; }, 50);
}));

addEventListener("afterprint", () => { $("#printRoot").innerHTML = ""; }); // ohne Freischalten bleibt der Ausdruck leer

/* ---------- Dossier: Zeugnisse anhängen (bleiben im Browser, IndexedDB) ---------- */
const IDB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open("zusago", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const run = (mode, fn) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction("files", mode), req = fn(t.objectStore("files"));
    t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
  }));
  return { get: k => run("readonly", st => st.get(k)), set: (k, v) => run("readwrite", st => st.put(v, k)), del: k => run("readwrite", st => st.delete(k)) };
})();
let ATT = [];
const MAX_PAGES = 30;
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
function loadScript(src) {
  return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("PDF-Leser konnte nicht geladen werden. Prüf deine Internetverbindung.")); document.head.append(s); });
}
function canvasJpeg(source, w, h) {
  const max = 1800, k = Math.min(1, max / Math.max(w, h)), c = document.createElement("canvas");
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}
function imageToJpeg(file) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { try { res(canvasJpeg(img, img.naturalWidth, img.naturalHeight)); } catch (e) { rej(e); } URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error(`«${file.name}» konnte nicht geöffnet werden. Versuch es als JPG oder PDF.`)); };
    img.src = url;
  });
}
async function pdfToJpegs(file, room) {
  await loadScript(PDFJS + "pdf.min.js");
  const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise.catch(() => { throw new Error(`«${file.name}» konnte nicht gelesen werden.`); });
  if (pdf.numPages > room) throw new Error(`«${file.name}» hat ${pdf.numPages} Seiten – im Dossier ist noch Platz für ${room}.`);
  const out = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    $("#attLoadingText").textContent = `Seite ${n} von ${pdf.numPages} wird vorbereitet …`;
    const page = await pdf.getPage(n), v1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 1600 / v1.width });
    const c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp, background: "#ffffff" }).promise;
    out.push(canvasJpeg(c, c.width, c.height));
  }
  return out;
}
const attPages = () => ATT.reduce((n, a) => n + a.pages.length, 0);
function renderAtt() {
  $("#attList").innerHTML = ATT.map(a => `<li><span class="att-thumb"><img src="${a.pages[0]}" alt=""></span><span class="att-name">${esc(a.name)}<small>${a.pages.length === 1 ? "1 Seite" : a.pages.length + " Seiten"}</small></span><button type="button" class="btn-link danger" data-att-del="${a.id}" aria-label="${esc(a.name)} entfernen">Entfernen</button></li>`).join("");
  const n = attPages();
  $("#dossierBtn").textContent = n ? `Ganzes Dossier als PDF (+${n} ${n === 1 ? "Seite" : "Seiten"})` : "Ganzes Dossier als PDF";
}
async function storeAtt() {
  try { await IDB.set("anhaenge", ATT); }
  catch { $("#attErr").textContent = "Die Zeugnisse konnten auf diesem Gerät nicht dauerhaft gespeichert werden. Sie bleiben, bis du die Seite schliesst."; }
}
$("#attInput").addEventListener("change", async e => {
  const files = [...e.target.files]; e.target.value = ""; if (!files.length) return;
  const load = $("#attLoading"), err = $("#attErr"); err.textContent = ""; load.hidden = false; $("#attLoadingText").textContent = "Wird vorbereitet …";
  try {
    for (const f of files) {
      const room = MAX_PAGES - attPages();
      if (room < 1) throw new Error(`Im Dossier haben höchstens ${MAX_PAGES} Seiten Platz.`);
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      if (!isPdf && !/^image\//.test(f.type)) throw new Error(`«${f.name}» ist weder ein Foto noch ein PDF.`);
      const pages = isPdf ? await pdfToJpegs(f, room) : [await imageToJpeg(f)];
      ATT.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: f.name.replace(/\.[^.]+$/, "") || "Zeugnis", pages });
      renderAtt();
    }
  } catch (x) { err.textContent = x.message || "Das hat nicht geklappt. Versuch es nochmals."; }
  finally { load.hidden = true; renderAtt(); await storeAtt(); }
});
$("#attList").addEventListener("click", async e => {
  const b = e.target.closest("[data-att-del]"); if (!b) return;
  ATT = ATT.filter(a => a.id !== b.dataset.attDel); renderAtt(); await storeAtt();
});

/* ---------- Bewerbungs-Tracker ---------- */
const STATUS = [["entwurf", "Entwurf"], ["versendet", "Versendet"], ["schnuppern", "Schnupperlehre"], ["gespraech", "Vorstellungsgespräch"], ["zusage", "Zusage"], ["absage", "Absage"]];
const snapApp = () => JSON.parse(JSON.stringify({ job: S.job, ai: S.ai, phase: S.phase, template: S.template, tone: S.tone, ticket: S.ticket || null, ticketJob: S.ticketJob || null, jobRead: !!S.jobRead }));
function syncApp() { if (!S.curApp || !S.ai) return; const a = (S.apps || []).find(x => x.id === S.curApp); if (a) Object.assign(a, { beruf: S.job.beruf, firma: S.job.firma, art: S.job.art, snap: snapApp() }); }
function trackUpsert() {
  S.apps = S.apps || [];
  const sig = jobSig(); let a = S.apps.find(x => x.id === S.curApp && x.sig === sig) || S.apps.find(x => x.sig === sig);
  if (!a) { a = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), sig, created: Date.now(), status: "entwurf", sent: null }; S.apps.push(a); }
  Object.assign(a, { sig, beruf: S.job.beruf, firma: S.job.firma, art: S.job.art, snap: snapApp() }); S.curApp = a.id;
}
const fmtDate = t => new Date(t).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
function renderTrack() {
  const apps = S.apps || [], n = apps.length;
  $("#trackBtn").hidden = !n; $("#trackCount").textContent = n; $("#trackEmpty").hidden = !!n; $("#trackOpen2").hidden = !n;
  $("#trackList").innerHTML = apps.slice().sort((a, b) => b.created - a.created).map(a => {
    const due = a.status === "versendet" && a.sent && Date.now() - a.sent > 14 * 864e5;
    return `<article class="td-item${a.id === S.curApp ? " cur" : ""}">
      <div class="td-main"><b>${esc(a.firma || "Firma ohne Namen")}</b><span>${esc(a.beruf || "")}${({ schnupper: " · Schnupperlehre", praktikum: " · Praktikum", initiativ: " · Initiativbewerbung" })[a.art] || ""}</span>
        <small>Erstellt ${fmtDate(a.created)}${a.sent ? " · versendet " + fmtDate(a.sent) : ""}</small>
        ${due ? `<span class="td-due">Seit zwei Wochen keine Antwort? Ruf an oder schreib eine kurze, freundliche Nachfrage.</span>` : ""}</div>
      <div class="td-act">
        <label class="sr-only" for="st-${a.id}">Status für ${esc(a.firma || a.beruf)}</label>
        <select id="st-${a.id}" class="td-status st-${a.status}" data-status="${a.id}">${STATUS.map(([k, l]) => `<option value="${k}"${k === a.status ? " selected" : ""}>${l}</option>`).join("")}</select>
        <button type="button" class="btn btn-ghost btn-sm" data-open="${a.id}">Öffnen</button>
        <button type="button" class="btn-link danger" data-del="${a.id}" aria-label="Bewerbung ${esc(a.firma || a.beruf)} löschen">Löschen</button>
      </div></article>`;
  }).join("");
}
function openApp(id) {
  const a = (S.apps || []).find(x => x.id === id); if (!a || !a.snap) return;
  syncApp(); Object.assign(S, JSON.parse(JSON.stringify(a.snap))); S.curApp = id; S.maxStep = 7; save();
  refreshBound(); applyPhase(); $$(".tag-input").forEach(renderTags); updateJobTitle(); renderTplPick(); renderTone(); renderTrack();
  $("#trackDlg").close(); show(7);
}
$("#trackList").addEventListener("change", e => {
  const sel = e.target.closest("[data-status]"); if (!sel) return;
  const a = S.apps.find(x => x.id === sel.dataset.status); if (!a) return;
  a.status = sel.value; if (sel.value === "versendet" && !a.sent) a.sent = Date.now(); save(); renderTrack();
});
$("#trackList").addEventListener("click", e => {
  const o = e.target.closest("[data-open]"), d = e.target.closest("[data-del]");
  if (o) return openApp(o.dataset.open);
  if (d) {
    const a = S.apps.find(x => x.id === d.dataset.del);
    if (!a || !confirm(`Bewerbung «${a.firma || a.beruf}» aus der Übersicht löschen?`)) return;
    S.apps = S.apps.filter(x => x !== a); if (S.curApp === a.id) S.curApp = null; save(); renderTrack();
  }
});
const openTrack = () => { renderTrack(); $("#trackDlg").showModal(); };
$("#trackBtn").addEventListener("click", openTrack);
$("#trackOpen2").addEventListener("click", openTrack);
$("#trackClose").addEventListener("click", () => $("#trackDlg").close());
$("#trackDlg").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

$("#newJob").addEventListener("click", () => {
  syncApp(); S.job = fresh().job; S.ai = null; S.jobRead = false; S.maxStep = 0; S.ticket = null; S.ticketJob = null; S.step = 0; S.curApp = null; save();
  S.job.art = ph().arts[0][0];
  refreshBound(); renderArt(); $$(".tag-input").forEach(renderTags); $("#jobUrl").value = ""; $("#jobText").value = ""; updateJobTitle();
  show(0);
});
$("#wipe").addEventListener("click", () => {
  const left = totalLeft();
  if (!confirm("Willst du wirklich alle deine Angaben auf diesem Gerät löschen? Auch Zeugnisse und die Übersicht deiner Bewerbungen werden gelöscht." + (left ? `\n\nAuch dein Guthaben-Code wird gelöscht (noch ${nB(left)}). Kopier ihn vorher, wenn du ihn noch brauchst:\n${activeCode()}` : ""))) return;
  try { localStorage.removeItem(STORE); localStorage.removeItem(PAYSTORE); } catch {}
  Promise.race([IDB.del("anhaenge").catch(() => {}), new Promise(r => setTimeout(r, 800))]).then(() => { location.href = "app.html"; });
});

/* ---------- Start ---------- */
S.apps = S.apps || [];
S.template = window.ZV.byId(S.template).id; // frühere Vorlagen auf die neuen umstellen
if (S.ai && !S.apps.length && S.job.beruf) trackUpsert(); // ältere Bewerbung in den Tracker übernehmen
bindFields(); bindTags(); bindRows(); applyPhase(); renderStrengths(); renderPhoto(); renderTplPick(); renderTone(); setSrc(S.src || "link"); updateJobTitle(); renderCredits(); renderTrack(); renderAtt();
IDB.get("anhaenge").then(v => { if (Array.isArray(v)) { ATT = v; renderAtt(); } }).catch(() => {});
const params = new URLSearchParams(location.search);
if (PH[params.get("phase")]) { setPhase(params.get("phase")); $("#phaseHint").textContent = "Passt das? Du kannst die Lebensphase jederzeit ändern."; }
if (PRICES[params.get("pack")]) pickPkg(+params.get("pack")); else pickPkg(S.phase ? ph().pack : 10);
if (params.get("tpl") && TEMPLATES.some(t => t.id === params.get("tpl"))) { S.template = params.get("tpl"); S.tplChosen = true; save(); renderTplPick(); }
if (params.get("link")) { S.step = 0; setSrc("link"); $("#jobUrl").value = params.get("link"); }
else if (params.get("src") === "manual") { S.step = 0; setSrc("manual"); }
const paidCode = params.get("bezahlt"), cancelled = params.get("abgebrochen");
history.replaceState(null, "", "app.html");

(async function boot() {
  if (paidCode && /^cs_(test|live)_/.test(paidCode)) {
    showGate("download"); $("#payLoading").hidden = false; $("#payLoadingText").textContent = "Zahlung wird bestätigt …";
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
  start();
  if (cancelled) toast("Die Zahlung wurde abgebrochen. Du kannst es jederzeit nochmals versuchen.");
  await refreshCredits();
  if (S.step === 7) renderLock();
})();
function start() {
  if (params.get("link")) { show(0); $("#readUrl").click(); }
  else show(S.step === 7 && !S.ai ? 6 : S.step || 0);
}
