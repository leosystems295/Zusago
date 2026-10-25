/* =========================================================
   Zusago – KI-Server
   Läuft als Render "Web Service" (Node 20+), ohne zusätzliche Pakete.

   Umgebungsvariablen (in Render unter "Environment" eintragen):
     OPENAI_API_KEY      dein Schlüssel von platform.openai.com     (Pflicht für ChatGPT)
                         – oder statt dessen ANTHROPIC_API_KEY für Claude.
                         Ist OPENAI_API_KEY gesetzt, wird ChatGPT verwendet.
     ALLOWED_ORIGINS     erlaubte Websites, mit Komma getrennt
                         z.B. https://zusago.onrender.com,https://zusago.ch,https://www.zusago.ch
     MODEL               Modell zum Schreiben   (Standard ChatGPT: gpt-6-sol,  Claude: claude-sonnet-5-5)
     MODEL_FAST          Modell zum Auslesen    (Standard ChatGPT: gpt-6-luna, Claude: claude-haiku-5-5)
     MOCK=1              Test-Modus ohne KI (liefert Beispieltexte)

   Bezahlung (Stripe Checkout, TWINT und Karte):
     STRIPE_SECRET_KEY   geheimer Schlüssel von dashboard.stripe.com (sk_test_… zum Testen, sk_live_… live)
     TOKEN_SECRET        langer, zufälliger Text zum Signieren der Bewerbungs-Tickets
     SITE_URL            Adresse der Website, z.B. https://zusago.onrender.com
     FREE_MODE=1         nur zum Testen: alles gratis, keine Zahlung nötig
   Guthaben: Der Code ist die ID der Stripe-Zahlung (cs_…). Wie viele Bewerbungen
   gekauft und schon gebraucht sind, steht direkt bei der Zahlung in Stripe
   (PaymentIntent → Metadaten «credits» und «used»). Es braucht keine Datenbank.
   ========================================================= */
const http = require("node:http");
const dns = require("node:dns").promises;
const net = require("node:net");
const crypto = require("node:crypto");

const PORT = process.env.PORT || 8787;
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const PROVIDER = OPENAI_KEY ? "openai" : "anthropic";
const KEY = OPENAI_KEY || ANTHROPIC_KEY;
const MODEL = process.env.MODEL || (PROVIDER === "openai" ? "gpt-6-sol" : "claude-sonnet-5-5");
const MODEL_FAST = process.env.MODEL_FAST || (PROVIDER === "openai" ? "gpt-6-luna" : "claude-haiku-5-5");
const MOCK = process.env.MOCK === "1";
const ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "https://zusago.onrender.com,https://zusago.ch,https://www.zusago.ch,http://localhost:8080,http://127.0.0.1:8080")
  .split(",").map(s => s.trim()).filter(Boolean);

/* ---------- Schutz vor zu vielen Anfragen (pro IP und Stunde) ---------- */
const LIMITS = { inserat: 20, generate: 12, rewrite: 40, checkout: 20, guthaben: 240 };
const hits = new Map();
function limited(ip, kind) {
  const now = Date.now(), key = ip + "|" + kind;
  const list = (hits.get(key) || []).filter(t => now - t < 3600_000);
  if (list.length >= LIMITS[kind]) { hits.set(key, list); return true; }
  list.push(now); hits.set(key, list); return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some(t => now - t < 3600_000)) hits.delete(k); }, 600_000).unref();

/* ---------- Hilfsfunktionen ---------- */
function send(res, status, data, origin) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (origin && (ORIGINS.includes(origin) || ORIGINS.includes("*"))) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}
function readBody(req, max = 60_000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > max) { reject(new Error("too_large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch { reject(new Error("bad_json")); } });
    req.on("error", reject);
  });
}
const clip = (s, n) => String(s ?? "").slice(0, n);
class UserError extends Error {}
class PayError extends Error {}   // 402: zuerst bezahlen

/* ---------- Bezahlung: Stripe ---------- */
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const TOKEN_SECRET = process.env.TOKEN_SECRET || (STRIPE_KEY ? crypto.createHash("sha256").update("zusago|" + STRIPE_KEY).digest("hex") : "");
const SITE_URL = (process.env.SITE_URL || "https://zusago.onrender.com").replace(/\/+$/, "");
const FREE = process.env.FREE_MODE === "1";
const PACKS = { 1: 690, 3: 1490, 5: 1990, 10: 2990 };          // Rappen
const VALID_DAYS = 365;                                          // Guthaben 12 Monate gültig
const STRIPE_API = process.env.STRIPE_API_BASE || "https://api.stripe.com/v1";

function formPairs(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && typeof v === "object") formPairs(v, key, out);
    else if (v !== undefined && v !== null) out.push([key, String(v)]);
  }
  return out;
}
async function stripe(method, path, params) {
  if (!STRIPE_KEY) throw new Error("no_stripe");
  const qs = params ? new URLSearchParams(formPairs(params)).toString() : "";
  const r = await fetch(STRIPE_API + path + (method === "GET" && qs ? "?" + qs : ""), {
    method, signal: AbortSignal.timeout(20_000),
    headers: { "Authorization": "Bearer " + STRIPE_KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : qs
  }).catch(() => { throw new Error("stripe_failed"); });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("Stripe", r.status, JSON.stringify(data.error || {}).slice(0, 400));
    const e = new Error(r.status === 404 ? "stripe_404" : "stripe_failed"); throw e;
  }
  return data;
}
const isCode = c => typeof c === "string" && /^cs_(test|live)_[A-Za-z0-9]{10,240}$/.test(c);
async function lookup(code) {
  if (!code) throw new PayError(NEED_PAY);
  if (!isCode(code)) throw new PayError("Dieser Guthaben-Code ist ungültig.");
  let s;
  try { s = await stripe("GET", `/checkout/sessions/${code}`, { expand: ["payment_intent", "payment_intent.latest_charge"] }); }
  catch (e) { if (e.message === "stripe_404") throw new PayError("Diesen Guthaben-Code kennen wir nicht."); throw e; }
  const credits = +(s.payment_intent?.metadata?.credits ?? s.metadata?.credits ?? 0);
  if (s.payment_status !== "paid") return { status: s.status === "expired" ? "abgelaufen" : "offen", credits, used: 0, remaining: 0, url: s.status === "open" ? s.url : null };
  const pi = s.payment_intent || {};
  const used = +(pi.metadata?.used ?? 0);
  const tooOld = (Date.now() / 1000 - s.created) > VALID_DAYS * 86400;
  const refunded = pi.latest_charge && typeof pi.latest_charge === "object" ? pi.latest_charge.refunded : false;
  return { status: tooOld ? "abgelaufen" : (refunded ? "erstattet" : "bezahlt"), credits, used, remaining: (tooOld || refunded) ? 0 : Math.max(0, credits - used), pi: pi.id };
}
async function consume(info) {
  await stripe("POST", `/payment_intents/${info.pi}`, { metadata: { used: info.used + 1 } });
  return Math.max(0, info.remaining - 1);
}
/* Ticket: erlaubt für eine bezahlte Bewerbung beliebig viele Änderungen (90 Tage) */
const hash16 = s => crypto.createHash("sha256").update(String(s)).digest("base64url").slice(0, 16);
const jobKey = j => hash16([j.beruf, j.firma, j.art].map(x => String(x || "").trim().toLowerCase()).join("|"));
function signTicket(code, jk) {
  const p = Buffer.from(JSON.stringify({ c: hash16(code), j: jk, e: Date.now() + 90 * 86400_000 })).toString("base64url");
  return p + "." + crypto.createHmac("sha256", TOKEN_SECRET).update(p).digest("base64url");
}
function readTicket(t) {
  if (typeof t !== "string" || !TOKEN_SECRET) return null;
  const [p, h] = t.split(".");
  if (!p || !h) return null;
  const want = crypto.createHmac("sha256", TOKEN_SECRET).update(p).digest("base64url");
  if (h.length !== want.length || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(want))) return null;
  try { const d = JSON.parse(Buffer.from(p, "base64url").toString("utf8")); return d.e > Date.now() ? d : null; } catch { return null; }
}
const NEED_PAY = "Kauf zuerst eine Bewerbung – einzeln oder im Paket.";

/* ---------- Inserat von einer Website laden (mit Schutz vor internen Adressen) ---------- */
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") ||
    (v.startsWith("::ffff:") && isPrivateIp(v.slice(7)));
}
async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new UserError("Das ist kein gültiger Link."); }
  if (!/^https?:$/.test(u.protocol)) throw new UserError("Der Link muss mit http oder https beginnen.");
  if (u.port && !["80", "443"].includes(u.port)) throw new UserError("Dieser Link kann nicht gelesen werden.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new UserError("Dieser Link kann nicht gelesen werden.");
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new UserError("Diese Website wurde nicht gefunden.");
  if (addrs.some(a => isPrivateIp(a.address))) throw new UserError("Dieser Link kann nicht gelesen werden.");
  return u;
}
async function fetchPage(raw) {
  let url = raw;
  for (let i = 0; i < 4; i++) {
    const u = await assertPublicUrl(url);
    const r = await fetch(u, {
      redirect: "manual", signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZusagoBot/1.0; +https://zusago.ch)", "Accept": "text/html,application/xhtml+xml", "Accept-Language": "de-CH,de;q=0.9" }
    }).catch(() => { throw new UserError("Die Website antwortet nicht. Kopier den Text vom Inserat hier rein."); });
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { url = new URL(r.headers.get("location"), u).href; continue; }
    if (!r.ok) throw new UserError("Die Website lässt sich nicht lesen. Kopier den Text vom Inserat hier rein.");
    const reader = r.body.getReader(); const parts = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 2_000_000) break; parts.push(value); }
    return Buffer.concat(parts).toString("utf8");
  }
  throw new UserError("Zu viele Weiterleitungen.");
}
function htmlToText(html) {
  // strukturierte Stellen-Daten (JobPosting) zuerst, viele Jobportale liefern sie mit
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).filter(s => /JobPosting/i.test(s)).join("\n").slice(0, 6000);
  const text = html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö").replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä").replace(/&Ouml;/g, "Ö").replace(/&Uuml;/g, "Ü").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&(ndash|mdash);/g, "–").replace(/&hellip;/g, "…").replace(/&(laquo|raquo);/g, m => m === "&laquo;" ? "«" : "»").replace(/&szlig;/g, "ss").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
  return (ld ? "STRUKTURIERTE DATEN:\n" + ld + "\n\nSEITENTEXT:\n" : "") + text.slice(0, 12_000);
}

/* ---------- KI aufrufen (ChatGPT oder Claude) ---------- */
async function claude(opts) {
  if (!KEY) throw new Error("no_key");
  return PROVIDER === "openai" ? callOpenAI(opts) : callAnthropic(opts);
}

/* ChatGPT über die OpenAI Responses API, mit erzwungenem Funktionsaufruf */
async function callOpenAI({ model, system, user, tool, maxTokens = 2000 }) {
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", signal: AbortSignal.timeout(80_000),
    headers: { "Authorization": "Bearer " + OPENAI_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      model, instructions: system, input: user,
      // Platz für internes Nachdenken der neueren Modelle plus die eigentliche Antwort
      max_output_tokens: Math.max(4000, maxTokens * 3),
      tools: [{ type: "function", name: tool.name, description: tool.description, parameters: tool.input_schema }],
      tool_choice: { type: "function", name: tool.name },
      store: false
    })
  });
  if (!r.ok) { console.error("OpenAI API", r.status, (await r.text()).slice(0, 500)); throw new Error("ai_failed"); }
  const data = await r.json();
  const call = (data.output || []).find(o => o.type === "function_call" && o.name === tool.name);
  if (!call) { console.error("OpenAI: kein Funktionsaufruf", data.status, JSON.stringify(data.incomplete_details || {})); throw new Error("ai_failed"); }
  try { return JSON.parse(call.arguments || "{}"); }
  catch { console.error("OpenAI: Antwort ist kein gültiges JSON"); throw new Error("ai_failed"); }
}

/* Claude über die Anthropic Messages API */
async function callAnthropic({ model, system, user, tool, maxTokens = 2000 }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", signal: AbortSignal.timeout(60_000),
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model, max_tokens: maxTokens, system,
      tools: [tool], tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: user }]
    })
  });
  if (!r.ok) { console.error("Claude API", r.status, (await r.text()).slice(0, 500)); throw new Error("ai_failed"); }
  const data = await r.json();
  const block = (data.content || []).find(b => b.type === "tool_use");
  if (!block) throw new Error("ai_failed");
  return block.input;
}

const STYLE = `Du schreibst für Zusago, ein Bewerbungs-Tool für Jugendliche in der Schweiz (8. bis 10. Klasse, 13 bis 16 Jahre), die eine Lehrstelle (EFZ/EBA) oder eine Schnupperlehre suchen.
Regeln:
- Schweizer Hochdeutsch: immer «ss» statt «ß».
- Bewerbungsbriefe sprechen den Betrieb mit «Sie» an.
- Schreib so, wie eine motivierte Jugendliche oder ein motivierter Jugendlicher wirklich schreibt: einfach, ehrlich, konkret. Keine Floskeln, kein übertriebenes Erwachsenen-Deutsch, keine Superlative.
- Erfinde NIE Fakten. Verwende nur Angaben aus dem Profil und dem Inserat. Fehlt etwas, lass es weg.
- Verknüpfe die Erfahrungen, Stärken und Hobbys der Person mit dem, was im Inserat gesucht wird.`;

const TONE = {
  locker: "Ton: locker und persönlich, aber immer noch höflich und korrekt.",
  normal: "Ton: freundlich, natürlich und klar – so wie die meisten guten Schülerbewerbungen.",
  formell: "Ton: eher formell und sachlich, aber nicht steif."
};

const TOOL_INSERAT = {
  name: "inserat", description: "Strukturierte Angaben aus einem Lehrstellen-Inserat",
  input_schema: { type: "object", properties: {
    beruf: { type: "string", description: "Lehrberuf inkl. EFZ/EBA, z.B. 'Informatiker/in EFZ'" },
    firma: { type: "string" }, strasse: { type: "string" }, plz_ort: { type: "string" },
    kontakt_anrede: { type: "string", enum: ["Frau", "Herr", ""] }, kontakt_name: { type: "string", description: "Nachname (evtl. mit Vorname) der Kontaktperson" },
    lehrbeginn: { type: "string", description: "z.B. 'August 2027'" },
    anforderungen: { type: "array", items: { type: "string" }, description: "max. 6 kurze Stichworte, was gesucht wird" },
    aufgaben: { type: "array", items: { type: "string" }, description: "max. 5 kurze Stichworte zu den Aufgaben" },
    ist_schnupperlehre: { type: "boolean" }
  }, required: ["beruf", "firma", "anforderungen"] }
};
const TOOL_BEWERBUNG = {
  name: "bewerbung", description: "Texte für Lebenslauf und Bewerbungsbrief",
  input_schema: { type: "object", properties: {
    kurzprofil: { type: "string", description: "1 Satz (max. 22 Wörter) für oben im Lebenslauf, in der Ich-Form" },
    staerken: { type: "array", items: { type: "string" }, description: "3 bis 5 Stärken aus dem Profil, die besten für diesen Beruf zuerst" },
    erfahrungen: { type: "array", items: { type: "object", properties: { nr: { type: "integer" }, beschreibung: { type: "string", description: "max. 14 Wörter, was gemacht/gelernt" } }, required: ["nr", "beschreibung"] } },
    hobbys: { type: "string", description: "Hobbys als kurze Zeile, z.B. 'Volleyball im Verein, PC zusammenbauen'" },
    brief_betreff: { type: "string", description: "z.B. 'Bewerbung als Informatikerin EFZ'" },
    brief_absaetze: { type: "array", items: { type: "string" }, description: "3 oder 4 Absätze ohne Anrede und ohne Grussformel, insgesamt 120 bis 200 Wörter" }
  }, required: ["kurzprofil", "staerken", "brief_betreff", "brief_absaetze"] }
};
const TOOL_TEXT = {
  name: "text", description: "Überarbeitete Absätze",
  input_schema: { type: "object", properties: { absaetze: { type: "array", items: { type: "string" } } }, required: ["absaetze"] }
};

/* ---------- Beispieltexte für den Test-Modus ---------- */
const MOCKS = {
  inserat: () => ({ beruf: "Informatiker/in EFZ", firma: "Muster AG", strasse: "Bahnhofstrasse 1", plz_ort: "4500 Solothurn", kontakt_anrede: "Frau", kontakt_name: "Beispiel", lehrbeginn: "August 2027", anforderungen: ["Freude an Technik", "logisches Denken", "Teamfähigkeit", "Sek A oder B"], aufgaben: ["Computer einrichten", "Programmieren"], ist_schnupperlehre: false }),
  generate: (p) => ({
    kurzprofil: `Ich bin eine motivierte Schülerin und möchte meine Lehre als ${p.job?.beruf || "Informatikerin EFZ"} beginnen.`,
    staerken: (p.profile?.staerken || ["zuverlässig", "logisch", "teamfähig"]).slice(0, 4),
    erfahrungen: (p.profile?.erfahrungen || []).map((e, i) => ({ nr: i + 1, beschreibung: "Einblick in den Berufsalltag erhalten und erste Aufgaben selbst gelöst." })),
    hobbys: (p.profile?.hobbys || []).join(", "),
    brief_betreff: `Bewerbung als ${p.job?.beruf || "Informatikerin EFZ"}`,
    brief_absaetze: [
      `Auf Ihrer Website habe ich gesehen, dass Sie ab ${p.job?.lehrbeginn || "nächstem Sommer"} eine Lernende oder einen Lernenden suchen. Ich bewerbe mich sehr gerne für diese Lehrstelle.`,
      "In meiner Schnupperlehre habe ich gemerkt, dass mir die Arbeit grossen Spass macht und ich gerne knifflige Probleme löse.",
      "Ich bin zuverlässig, arbeite genau und bleibe dran, bis etwas funktioniert. In meiner Freizeit baue ich gerne Computer zusammen.",
      "Gerne zeige ich Ihnen in einem persönlichen Gespräch, dass ich gut zu Ihrem Team passe. Ich freue mich auf Ihre Antwort."
    ] }),
  rewrite: (p) => ({ absaetze: (p.absaetze || []).map(a => p.mode === "kuerzer" ? a.split(". ")[0].replace(/\.?$/, ".") : a) })
};

/* ---------- Endpunkte ---------- */
async function routeInserat(body) {
  if (!FREE && !readTicket(body.ticket)) {
    const info = await lookup(body.code);
    if (info.remaining < 1) throw new PayError(NEED_PAY);
  }
  let text = clip(body.text, 15_000).trim();
  if (!text && body.url) text = htmlToText(await fetchPage(clip(body.url, 2000)));
  if (text.length < 120) throw new UserError("Im Inserat steht zu wenig Text. Kopier den ganzen Text vom Inserat hier rein.");
  if (MOCK) return MOCKS.inserat();
  return claude({
    model: MODEL_FAST, maxTokens: 800, tool: TOOL_INSERAT,
    system: "Du liest Lehrstellen- und Schnupperlehr-Inserate aus der Schweiz und gibst die Angaben strukturiert zurück. Erfinde nichts; leere Felder bleiben leer.",
    user: "Inserat:\n\n" + text
  });
}
function cleanProfile(p = {}) {
  const arr = (a, n) => (Array.isArray(a) ? a : []).slice(0, n);
  return {
    vorname: clip(p.vorname, 60), geburtsdatum: clip(p.geburtsdatum, 30), klasse: clip(p.klasse, 80),
    schule: arr(p.schule, 6).map(s => ({ zeit: clip(s.zeit, 40), name: clip(s.name, 120), details: clip(s.details, 120) })),
    erfahrungen: arr(p.erfahrungen, 8).map(e => ({ zeit: clip(e.zeit, 40), titel: clip(e.titel, 120), ort: clip(e.ort, 120) })),
    staerken: arr(p.staerken, 10).map(s => clip(s, 40)), hobbys: arr(p.hobbys, 10).map(s => clip(s, 60)),
    sprachen: arr(p.sprachen, 6).map(s => ({ sprache: clip(s.sprache, 30), niveau: clip(s.niveau, 30) })),
    computer: clip(p.computer, 200), motivation: clip(p.motivation, 400)
  };
}
function cleanJob(j = {}) {
  return { beruf: clip(j.beruf, 120), firma: clip(j.firma, 120), lehrbeginn: clip(j.lehrbeginn, 60),
    anforderungen: (Array.isArray(j.anforderungen) ? j.anforderungen : []).slice(0, 8).map(s => clip(s, 80)),
    aufgaben: (Array.isArray(j.aufgaben) ? j.aufgaben : []).slice(0, 6).map(s => clip(s, 80)), art: j.art === "schnupper" ? "schnupper" : "lehre" };
}
async function routeGenerate(body) {
  const profile = cleanProfile(body.profile), job = cleanJob(body.job), tone = TONE[body.tone] ? body.tone : "normal";
  if (!job.beruf) throw new UserError("Es fehlt der Beruf.");
  let info = null, jk = jobKey(job);
  const paidTicket = !FREE && readTicket(body.ticket);
  const sameJob = paidTicket && paidTicket.j === jk;
  if (!FREE && !sameJob) {
    info = await lookup(body.code);
    if (info.remaining < 1) throw new PayError(info.credits ? "Dein Guthaben ist aufgebraucht. Kauf weitere Bewerbungen." : NEED_PAY);
  }
  const result = await writeApplication(profile, job, tone);
  if (FREE) return result;
  if (sameJob) return Object.assign(result, { ticket: body.ticket });
  const remaining = await consume(info);
  return Object.assign(result, { ticket: signTicket(body.code, jk), guthaben: remaining });
}
async function writeApplication(profile, job, tone) {
  if (MOCK) return MOCKS.generate({ profile, job });
  const art = job.art === "schnupper"
    ? "Schreib eine kurze Anfrage für eine Schnupperlehre (2 bis 3 Absätze, 80 bis 130 Wörter)."
    : "Schreib einen Bewerbungsbrief für die Lehrstelle (3 bis 4 Absätze, 120 bis 200 Wörter): Einstieg mit Bezug zur Stelle, warum dieser Beruf, was die Person mitbringt (konkret mit Erfahrungen), Schluss mit Bitte um Gespräch oder Schnupperlehre.";
  return claude({
    model: MODEL, maxTokens: 1800, tool: TOOL_BEWERBUNG,
    system: STYLE + "\n" + TONE[tone],
    user: `${art}\nDie Erfahrungen sind nummeriert (nr ab 1); gib pro Erfahrung eine kurze Beschreibung zurück.\n\nSTELLE:\n${JSON.stringify(job, null, 1)}\n\nPROFIL:\n${JSON.stringify(profile, null, 1)}`
  });
}
async function routeRewrite(body) {
  const absaetze = (Array.isArray(body.absaetze) ? body.absaetze : []).slice(0, 6).map(a => clip(a, 1500));
  const mode = ["kuerzer", "locker", "normal", "formell", "neu"].includes(body.mode) ? body.mode : "neu";
  if (!absaetze.length) throw new UserError("Es gibt keinen Text zum Überarbeiten.");
  if (!FREE && !readTicket(body.ticket)) throw new PayError("Diese Bewerbung ist nicht bezahlt.");
  if (MOCK) return MOCKS.rewrite({ absaetze, mode });
  const task = { kuerzer: "Mach den Text etwa ein Drittel kürzer. Behalte die wichtigsten Aussagen.",
    neu: "Schreib den Text neu mit anderen Formulierungen. Inhalt und Länge bleiben ähnlich.",
    locker: TONE.locker + " Schreib den Text in diesem Ton neu.", normal: TONE.normal + " Schreib den Text in diesem Ton neu.",
    formell: TONE.formell + " Schreib den Text in diesem Ton neu." }[mode];
  return claude({
    model: MODEL, maxTokens: 1500, tool: TOOL_TEXT, system: STYLE,
    user: `${task}\nGleiche Anzahl Absätze, keine Anrede, keine Grussformel. Erfinde keine neuen Fakten.\n\nSTELLE: ${clip(body.beruf, 120)} bei ${clip(body.firma, 120)}\n\nTEXT:\n${absaetze.map((a, i) => `[${i + 1}] ${a}`).join("\n\n")}`
  });
}

async function routeCheckout(body) {
  const n = Number(body.pack);
  if (!PACKS[n]) throw new UserError("Dieses Paket gibt es nicht.");
  if (FREE) throw new UserError("Der Test-Modus ist aktiv – es braucht keine Zahlung.");
  const s = await stripe("POST", "/checkout/sessions", {
    mode: "payment", locale: "de",
    line_items: [{ quantity: 1, price_data: { currency: "chf", unit_amount: PACKS[n],
      product_data: { name: n === 1 ? "Zusago – 1 Bewerbung" : `Zusago – ${n} Bewerbungen`,
        description: "Lebenslauf und Bewerbungsbrief, passend zur Lehrstelle. Einmalig, kein Abo. 12 Monate gültig." } } }],
    metadata: { credits: n },
    payment_intent_data: { metadata: { credits: n, used: 0 }, description: `Zusago: ${n} Bewerbung${n === 1 ? "" : "en"}` },
    success_url: `${SITE_URL}/app.html?bezahlt={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/app.html?abgebrochen=1`
  });
  return { url: s.url, code: s.id };
}
async function routeGuthaben(body) {
  if (FREE) return { status: "gratis", credits: 999, used: 0, remaining: 999 };
  if (!body.code) return { status: "keins", credits: 0, used: 0, remaining: 0 };
  const info = await lookup(body.code);
  delete info.pi;
  return info;
}

/* ---------- Server ---------- */
const ROUTES = { "/api/inserat": ["inserat", routeInserat], "/api/generate": ["generate", routeGenerate], "/api/rewrite": ["rewrite", routeRewrite],
  "/api/checkout": ["checkout", routeCheckout], "/api/guthaben": ["guthaben", routeGuthaben] };
http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  const path = (req.url || "").split("?")[0];
  if (req.method === "OPTIONS") {
    const ok = ORIGINS.includes(origin) || ORIGINS.includes("*");
    res.writeHead(ok ? 204 : 403, ok ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" } : {});
    return res.end();
  }
  if (req.method === "GET" && (path === "/" || path === "/health")) return send(res, 200, { ok: true, ki: MOCK ? "test" : (KEY ? "bereit" : "kein Schlüssel"), anbieter: PROVIDER === "openai" ? "ChatGPT" : "Claude", modell: MODEL, bezahlung: FREE ? "test (gratis)" : (STRIPE_KEY ? (STRIPE_KEY.startsWith("sk_live") ? "live" : "test") : "nicht eingerichtet") }, origin);
  const route = ROUTES[path];
  if (!route || req.method !== "POST") return send(res, 404, { error: "Nicht gefunden." }, origin);
  if (origin && !ORIGINS.includes(origin) && !ORIGINS.includes("*")) return send(res, 403, { error: "Nicht erlaubt." }, origin);
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (limited(ip, route[0])) return send(res, 429, { error: "Du hast in kurzer Zeit sehr viele Anfragen geschickt. Versuch es in einer Stunde nochmals." }, origin);
  try {
    const body = await readBody(req);
    const result = await route[1](body);
    send(res, 200, result, origin);
  } catch (e) {
    if (e instanceof UserError) return send(res, 400, { error: e.message }, origin);
    if (e instanceof PayError) return send(res, 402, { error: e.message, bezahlen: true }, origin);
    if (e.message === "no_stripe") { console.error("STRIPE_SECRET_KEY fehlt"); return send(res, 503, { error: "Die Bezahlung ist noch nicht eingerichtet." }, origin); }
    if (e.message === "stripe_failed" || e.message === "stripe_404") return send(res, 502, { error: "Die Bezahlung ist gerade nicht erreichbar. Versuch es gleich nochmals." }, origin);
    if (e.message === "too_large") return send(res, 413, { error: "Die Anfrage ist zu gross." }, origin);
    if (e.message === "no_key") { console.error("OPENAI_API_KEY (oder ANTHROPIC_API_KEY) fehlt"); return send(res, 503, { error: "Die KI ist noch nicht eingerichtet." }, origin); }
    console.error(e);
    send(res, 502, { error: "Die KI hat gerade nicht geantwortet. Versuch es gleich nochmals." }, origin);
  }
}).listen(PORT, () => console.log(`Zusago-KI läuft auf Port ${PORT}${MOCK ? " (Test-Modus)" : ` mit ${PROVIDER === "openai" ? "ChatGPT" : "Claude"} (${MODEL})${KEY ? "" : " – ACHTUNG: kein API-Schlüssel gesetzt"}`}`));
