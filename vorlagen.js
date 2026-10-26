/* =========================================================
   Zusago – Vorlagen (gemeinsam für Website und App)
   10 seriöse, moderne Vorlagen für Lebenslauf und Brief.
   - Liste aller Vorlagen
   - Lebenslauf und Brief als echte A4-Seite (HTML)
   - Beispielpersonen für die Vorschau auf der Website
   - Mini-Vorschau: echte Seite, passend verkleinert
   ========================================================= */
(function (w) {
  "use strict";

  /* ---------- Vorlagen ----------
     layout: swiss | sidebar | band | margin | classic | timeline
     font:   inter | plex | serif | mix (Titel Serif, Text Inter)
     acc:    Hauptfarbe (zurückhaltend), mods: Varianten aus dokumente.css
     fam:    Empfehlung (start = Lehrstelle, campus = Studium/Praktikum, beruf, klassisch) */
  const TEMPLATES = [
    { id: "zuerich",    name: "Zürich",     layout: "swiss",    font: "inter", acc: "#1F3A5F",                  mods: "",                 fam: "beruf",     field: "buero",      sample: "beruf_technik", wirkung: "klar und modern" },
    { id: "basel",      name: "Basel",      layout: "sidebar",  font: "inter", acc: "#0F5257",                  mods: "m-tint",           fam: "campus",    field: "it",         sample: "studium",       wirkung: "ruhig, mit heller Seitenspalte" },
    { id: "bern",       name: "Bern",       layout: "classic",  font: "serif", acc: "#1F2937",                  mods: "",                 fam: "klassisch", field: "buero",      sample: "beruf_buero",   wirkung: "klassisch, für Bank und Verwaltung" },
    { id: "luzern",     name: "Luzern",     layout: "band",     font: "plex",  acc: "#1E293B", acc2: "#64748B", mods: "",                 fam: "start",     field: "buero",      sample: "buero",         wirkung: "starker Kopf, klarer Aufbau" },
    { id: "genf",       name: "Genf",       layout: "sidebar",  font: "mix",   acc: "#6B1E2E",                  mods: "m-tint m-right",   fam: "campus", field: "gestaltung", sample: "praktikum",     wirkung: "elegant, Spalte rechts" },
    { id: "lugano",     name: "Lugano",     layout: "margin",   font: "inter", acc: "#2D5A47",                  mods: "",                 fam: "beruf",     field: "gesundheit", sample: "beruf_pflege",  wirkung: "luftig, Titel am Rand" },
    { id: "stgallen",   name: "St. Gallen", layout: "timeline", font: "plex",  acc: "#2E3A87",                  mods: "",                 fam: "start",     field: "it",         sample: "it",            wirkung: "mit Zeitstrahl" },
    { id: "winterthur", name: "Winterthur", layout: "swiss",    font: "plex",  acc: "#33475B",                  mods: "m-bar m-levels",   fam: "start",     field: "handwerk",   sample: "handwerk",      wirkung: "technisch, mit Sprach-Balken" },
    { id: "chur",       name: "Chur",       layout: "sidebar",  font: "mix",   acc: "#14213D", acc2: "#B9A47A", mods: "m-dark m-levels", fam: "beruf",     field: "gesundheit", sample: "gesundheit",    wirkung: "dunkle Spalte, edel" },
    { id: "aarau",      name: "Aarau",      layout: "margin",   font: "inter", acc: "#111111",                  mods: "m-mono",           fam: "klassisch", field: "gestaltung", sample: "gestaltung",    wirkung: "schwarz-weiss, für Bewerbungsportale" }
  ];
  const FIELDS = { handwerk: "Handwerk und Technik", buero: "Büro und Verkauf", gesundheit: "Gesundheit", it: "IT", gestaltung: "Gestaltung" };
  const FAMS = {
    start:     { name: "Lehrstelle", wirkung: "klar und übersichtlich",           fuer: "Lehrstelle und Schnupperlehre" },
    campus:    { name: "Studium",    wirkung: "modern, Fokus auf Projekte",       fuer: "Studium und Praktikum" },
    beruf:     { name: "Beruf",      wirkung: "seriös, viel Platz für Erfahrung", fuer: "Berufsleute" },
    klassisch: { name: "Klassisch",  wirkung: "zurückhaltend, zeitlos",           fuer: "Banken, Verwaltung, Recht" }
  };
  /* Lebensphasen: steuern Aufbau, Überschriften und Beilagen */
  const PHASES = {
    lehre:     { name: "Lehrstelle", schule: "Schulbildung", erf: "Schnupperlehren und Erfahrungen", comp: "Computer", hob: "Hobbys", st: "Stärken", beil: ["Lebenslauf", "Zeugniskopien"] },
    studium:   { name: "Studium", schule: "Ausbildung", erf: "Projekte und Nebenjobs", comp: "Kenntnisse", hob: "Engagement", st: "Stärken", beil: ["Lebenslauf", "Notenauszug"] },
    praktikum: { name: "Praktikum", schule: "Ausbildung", erf: "Erfahrungen", comp: "Kenntnisse", hob: "Interessen", st: "Stärken", beil: ["Lebenslauf", "Maturazeugnis"] },
    beruf:     { name: "Beruf", schule: "Aus- und Weiterbildung", erf: "Berufserfahrung", comp: "Kenntnisse", hob: "Interessen", st: "Kompetenzen", beil: ["Lebenslauf", "Arbeitszeugnisse", "Diplome"], erfFirst: true, refAuf: true }
  };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plain = (path, text, tag = "span", cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""}>${esc(text)}</${tag}>`;
  // frühere Vorlagen (bis Oktober 2026) auf die neuen umleiten
  const OLD = { werkstatt: "winterthur", klar: "luzern", fuersorge: "chur", code: "stgallen", funke: "winterthur", buehne: "bern", laden: "genf", terminal: "stgallen",
    pflege: "lugano", skizze: "genf", praezision: "zuerich", netzwerk: "basel", hobel: "winterthur", kontor: "zuerich", kanzlei: "bern", puls: "aarau", sanft: "lugano",
    pixel: "basel", palette: "genf", kontrast: "aarau" };
  const byId = id => TEMPLATES.find(t => t.id === id) || TEMPLATES.find(t => t.id === OLD[id]) || TEMPLATES[0];
  const pageAttr = t => `style="--acc:${t.acc}${t.acc2 ? `;--acc2:${t.acc2}` : ""}"`;
  const cls = (t, kind) => `page ${kind} L-${t.layout} f-${t.font} tpl-${t.id} ${t.mods}`;
  const today = () => new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });
  const city = s => String(s || "").replace(/^\s*\d{4}\s*/, "").trim();
  const LV = { muttersprache: 5, c2: 5, "sehr gut": 4, c1: 4, gut: 3, b2: 3, b1: 2, grundkenntnisse: 2, a2: 2, a1: 1 };
  const level = n => LV[String(n || "").trim().toLowerCase()] || 3;
  function anrede(j) {
    const n = String(j.kontakt_name || "").trim();
    if (j.kontakt_anrede === "Frau" && n) return `Sehr geehrte Frau ${n}`;
    if (j.kontakt_anrede === "Herr" && n) return `Sehr geehrter Herr ${n}`;
    return "Sehr geehrte Damen und Herren";
  }

  /* ---------- Bausteine für den Lebenslauf ---------- */
  function parts(st, t, ed) {
    const p = st.profile, a = st.ai || {}, j = st.job || {};
    const nonEmpty = l => (l || []).filter(o => Object.values(o).some(v => String(v).trim()));
    const schule = nonEmpty(p.schule), erf = nonEmpty(p.erfahrungen), spr = nonEmpty(p.sprachen), ref = nonEmpty(p.referenzen);
    const staerken = (a.staerken && a.staerken.length ? a.staerken : p.staerken || []);
    const hobbys = a.hobbys || (p.hobbys || []).join(", ");
    const desc = i => (a.erfahrungen || []).find(e => e.nr === i + 1);
    const ph = PHASES[st.phase] || PHASES.lehre;
    const sec = (title, inner, c = "") => inner ? `<section class="s ${c}"><h3>${title}</h3><div class="s-in">${inner}</div></section>` : "";
    const entry = (z, title, org, d) => `<div class="e"><span class="e-z">${esc(z)}</span><div class="e-b"><b class="e-t">${esc(title)}</b>${org ? `<span class="e-o">${esc(org)}</span>` : ""}${d ? `<span class="e-d">${d}</span>` : ""}</div></div>`;
    const schuleHTML = schule.map(s => entry(s.zeit, s.name, s.details, "")).join("");
    const erfHTML = erf.map((e, i) => entry(e.zeit, e.titel, e.ort, desc(i) ? ed(`ai.erfahrungen.${(a.erfahrungen || []).indexOf(desc(i))}.beschreibung`, desc(i).beschreibung) : esc(e.details || ""))).join("");
    const erfTitel = !st.phase && j.art === "schnupper" ? "Erfahrungen" : ph.erf;
    const contact = [["Adresse", [p.strasse, p.plz_ort].filter(Boolean).join(", ")], ["Telefon", p.telefon], ["E-Mail", p.email]].filter(x => x[1]);
    const personal = [["Geburtsdatum", p.geburtsdatum], ["Nationalität", p.nationalitaet]].filter(x => x[1]);
    const kv = list => list.map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>`).join("");
    const bars = n => `<i class="lv" aria-hidden="true">${[1, 2, 3, 4, 5].map(k => `<u class="${k <= n ? "on" : ""}"></u>`).join("")}</i>`;
    const sprHTML = spr.map(s => `<div class="lg"><span>${esc(s.sprache)}</span><b>${esc(s.niveau)}</b>${bars(level(s.niveau))}</div>`).join("");
    const stHTML = staerken.length ? `<ul class="li">${staerken.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : "";
    const refHTML = ref.map(r => `<div class="rf"><b>${esc(r.name)}</b><span>${esc([r.funktion, r.telefon].filter(Boolean).join(" · "))}</span></div>`).join("");
    return {
      p, j, ph, sec,
      name: `${esc(p.vorname)} ${esc(p.nachname)}`,
      role: j.beruf ? `Bewerbung als ${esc(j.beruf)}` : "Lebenslauf",
      kp: a.kurzprofil ? ed("ai.kurzprofil", a.kurzprofil, "p", "kp") : "",
      photo: p.foto ? `<img class="ph" src="${p.foto}" alt="">` : "",
      contactKV: kv(contact), personalKV: kv(personal), allKV: kv(contact.concat(personal)),
      contactLine: contact.map(([, v]) => `<span>${esc(v)}</span>`).join(""),
      personalLine: personal.map(([k, v]) => `<span>${k} ${esc(v)}</span>`).join(""),
      main: (ph.erfFirst ? [sec(erfTitel, erfHTML, "s-erf"), sec(ph.schule, schuleHTML, "s-sch")] : [sec(ph.schule, schuleHTML, "s-sch"), sec(erfTitel, erfHTML, "s-erf")]).join(""),
      spr: sec("Sprachen", sprHTML, "s-spr"), st: sec(ph.st, stHTML, "s-st"),
      comp: p.computer ? sec(ph.comp, `<p>${esc(p.computer)}</p>`, "s-comp") : "",
      hob: hobbys ? sec(ph.hob, `<p>${esc(hobbys)}</p>`, "s-hob") : "",
      ref: refHTML ? sec("Referenzen", refHTML, "s-ref") : (ph.refAuf ? sec("Referenzen", "<p>Auf Anfrage</p>", "s-ref") : "")
    };
  }

  /* ---------- Lebenslauf ---------- */
  function cv(st, t, ed = plain) {
    t = typeof t === "string" ? byId(t) : (t || TEMPLATES[0]);
    const x = parts(st, t, ed), open = `<article class="${cls(t, "cv")}" ${pageAttr(t)}>`;
    const head = `<div class="hd-t"><h1 class="n">${x.name}</h1><p class="r">${x.role}</p></div>`;
    switch (t.layout) {
      case "sidebar":
        return `${open}<aside class="sb">${x.photo}${x.sec("Kontakt", x.contactKV)}${x.sec("Persönlich", x.personalKV)}${x.spr}${x.st}${x.comp}${x.hob}</aside>
          <div class="mn"><header class="hd">${head}</header>${x.kp}${x.main}${x.ref}</div></article>`;
      case "band":
        return `${open}<header class="hd">${head}${x.photo}</header><div class="strip">${x.contactLine}</div>
          <div class="cols"><aside class="sb">${x.sec("Persönlich", x.personalKV)}${x.spr}${x.st}${x.comp}${x.hob}</aside><div class="mn">${x.kp}${x.main}${x.ref}</div></div></article>`;
      case "margin":
        return `${open}<header class="hd">${head}<p class="ct">${x.contactLine}</p>${x.photo}</header>
          ${x.kp ? x.sec("Profil", x.kp) : ""}${x.main}${x.sec("Persönlich", x.personalKV)}${x.spr}${x.st}${x.comp}${x.hob}${x.ref}</article>`;
      case "classic":
        return `${open}<header class="hd">${x.photo}${head}<p class="ct">${x.contactLine}</p><p class="ct ct2">${x.personalLine}</p></header>
          ${x.kp}${x.main}<div class="cols3">${x.spr}${x.st}${x.comp || x.hob}</div>${x.comp && x.hob ? x.hob : ""}${x.ref}</article>`;
      case "timeline":
        return `${open}<header class="hd">${head}${x.photo}</header>
          <div class="cols"><aside class="sb">${x.sec("Kontakt", x.contactKV)}${x.sec("Persönlich", x.personalKV)}${x.spr}${x.st}${x.comp}${x.hob}</aside><div class="mn">${x.kp}${x.main}${x.ref}</div></div></article>`;
      default: // swiss
        return `${open}<header class="hd">${head.replace("</div>", `<p class="ct">${x.contactLine}</p></div>`)}${x.photo}</header>
          <div class="cols"><div class="mn">${x.kp}${x.main}</div><aside class="sb">${x.sec("Persönlich", x.personalKV)}${x.spr}${x.st}${x.comp}${x.hob}${x.ref}</aside></div></article>`;
    }
  }

  /* ---------- Bewerbungsbrief ---------- */
  function letter(st, t, ed = plain) {
    t = typeof t === "string" ? byId(t) : (t || TEMPLATES[0]);
    const p = st.profile, j = st.job || {}, a = st.ai || {};
    const contact = [[p.strasse, p.plz_ort].filter(Boolean).join(", "), p.telefon, p.email].filter(Boolean).map(v => `<span>${esc(v)}</span>`).join("");
    const recip = [j.firma, j.kontakt_name ? `${j.kontakt_anrede || ""} ${j.kontakt_name}`.trim() : "", j.strasse, j.plz_ort].filter(Boolean).map(esc).join("<br>");
    const beilagen = j.art === "schnupper" ? ["Lebenslauf"] : (PHASES[st.phase] || PHASES.lehre).beil;
    return `<article class="${cls(t, "letter")}" ${pageAttr(t)}>
      <header class="lh"><b class="ln">${esc(p.vorname)} ${esc(p.nachname)}</b><p class="lc">${contact}</p></header>
      <div class="lb">
        <div class="lt-recip">${recip || "&nbsp;"}</div>
        <p class="lt-date">${esc(city(p.plz_ort) || "Ort")}, ${st.datum || today()}</p>
        ${ed("ai.brief_betreff", a.brief_betreff || (j.beruf ? "Bewerbung als " + j.beruf : "Bewerbung"), "h2", "lt-subj")}
        <p class="lt-anrede">${esc(anrede(j))}</p>
        ${(a.brief_absaetze || []).map((x, i) => ed(`ai.brief_absaetze.${i}`, x, "p", "lt-p")).join("")}
        <p class="lt-gruss">Freundliche Grüsse</p>
        <p class="lt-name">${esc(p.vorname)} ${esc(p.nachname)}</p>
        <p class="lt-beil"><b>Beilagen</b><br>${beilagen.join("<br>")}</p>
      </div>
    </article>`;
  }

  /* ---------- Platzhalter-Foto (Silhouette) ---------- */
  function photo(bg, fg) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 158"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><rect width="120" height="158" fill="url(#g)"/><circle cx="60" cy="60" r="25" fill="${fg}"/><path d="M14 158c3-36 22-54 46-54s43 18 46 54z" fill="${fg}"/></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- Beispielpersonen pro Berufsfeld ---------- */
  const SAMPLES = {
    handwerk: {
      job: { art: "lehre", beruf: "Polymechaniker EFZ", firma: "Muster Präzision AG", strasse: "Industriestrasse 12", plz_ort: "2540 Grenchen", kontakt_anrede: "Frau", kontakt_name: "Lang" },
      profile: {
        vorname: "Noah", nachname: "Gerber", strasse: "Bielstrasse 22", plz_ort: "2540 Grenchen", telefon: "079 000 00 11", email: "noah.gerber@email.ch", geburtsdatum: "12.03.2011", nationalitaet: "Schweiz", foto: photo("#D9DEE8", "#A9B3C7"),
        schule: [{ zeit: "2024 – 2027", name: "Sekundarschule Grenchen, Sek B", details: "Lieblingsfächer: Mathematik, Werken" }, { zeit: "2018 – 2024", name: "Primarschule Grenchen", details: "" }],
        erfahrungen: [{ zeit: "02/2026", titel: "Schnupperlehre Polymechaniker EFZ", ort: "Muster Präzision AG" }, { zeit: "10/2025", titel: "Schnupperlehre Automatiker EFZ", ort: "Muster Automation AG" }, { zeit: "seit 2024", titel: "Mithilfe Velowerkstatt", ort: "Quartierverein" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Französisch", niveau: "gut" }, { sprache: "Englisch", niveau: "Grundkenntnisse" }],
        computer: "Word, PowerPoint, erste Schritte mit CAD", referenzen: [{ name: "Thomas Kunz", funktion: "Klassenlehrer", telefon: "032 000 00 10" }, { name: "Petra Lang", funktion: "Berufsbildnerin", telefon: "032 000 00 12" }]
      },
      ai: {
        kurzprofil: "Ich arbeite gerne genau mit den Händen und will verstehen, wie Maschinen funktionieren.",
        staerken: ["handwerklich geschickt", "genau", "ausdauernd", "pünktlich"],
        erfahrungen: [{ nr: 1, beschreibung: "An der Drehmaschine ein Werkstück nach Zeichnung gefertigt." }, { nr: 2, beschreibung: "Eine einfache Steuerung verdrahtet und getestet." }, { nr: 3, beschreibung: "Bremsen, Reifen und Schaltungen repariert." }],
        hobbys: "Velos reparieren, Unihockey, Modellbau",
        brief_betreff: "Bewerbung um eine Lehrstelle als Polymechaniker EFZ",
        brief_absaetze: [
          "In meiner Schnupperwoche bei Ihnen durfte ich mein erstes Werkstück an der Drehmaschine herstellen. Seitdem weiss ich, dass Polymechaniker genau mein Beruf ist. Darum bewerbe ich mich für die Lehrstelle mit Beginn im August 2027.",
          "Ich besuche die 9. Klasse der Sek B in Grenchen. Am liebsten habe ich Mathematik und Werken. Technische Zeichnungen lesen fällt mir leicht, und ich mag es, wenn ein Teil am Schluss genau passt.",
          "Jeden Samstag helfe ich in einer Velowerkstatt im Quartier. Dort habe ich gelernt, sorgfältig und sauber zu arbeiten und dranzubleiben, bis etwas funktioniert.",
          "Gerne zeige ich Ihnen in einem Gespräch, dass ich gut in Ihr Team passe. Ich freue mich auf Ihre Antwort."
        ]
      }
    },
    buero: {
      job: { art: "lehre", beruf: "Kauffrau EFZ", firma: "Muster Versicherungen AG", strasse: "Bahnhofstrasse 30", plz_ort: "4600 Olten", kontakt_anrede: "Herr", kontakt_name: "Roth" },
      profile: {
        vorname: "Lea", nachname: "Schneider", strasse: "Aarauerstrasse 8", plz_ort: "4600 Olten", telefon: "079 000 00 22", email: "lea.schneider@email.ch", geburtsdatum: "04.07.2011", nationalitaet: "Schweiz", foto: photo("#E6DEEA", "#BBA9C7"),
        schule: [{ zeit: "2024 – 2027", name: "Sekundarschule Olten, Sek A", details: "Lieblingsfächer: Deutsch, Englisch, Mathematik" }, { zeit: "2018 – 2024", name: "Primarschule Olten", details: "" }],
        erfahrungen: [{ zeit: "03/2026", titel: "Schnupperlehre Kauffrau EFZ", ort: "Muster Versicherungen AG" }, { zeit: "11/2025", titel: "Schnupperlehre Detailhandel EFZ", ort: "Muster Mode AG" }, { zeit: "seit 2025", titel: "Kassierin im Schülerrat", ort: "Sekundarschule Olten" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "gut" }, { sprache: "Französisch", niveau: "gut" }],
        computer: "Word, Excel, PowerPoint, Outlook, Zehnfingersystem", referenzen: [{ name: "Monika Frey", funktion: "Klassenlehrerin", telefon: "062 000 00 20" }, { name: "Daniel Roth", funktion: "Berufsbildner", telefon: "062 000 00 21" }]
      },
      ai: {
        kurzprofil: "Ich bin organisiert, arbeite gerne am Computer und mag den Kontakt mit Menschen.",
        staerken: ["organisiert", "freundlich", "zuverlässig", "genau"],
        erfahrungen: [{ nr: 1, beschreibung: "Kundendaten erfasst und am Empfang Telefonate entgegengenommen." }, { nr: 2, beschreibung: "Kundinnen beraten und Ware präsentiert." }, { nr: 3, beschreibung: "Einnahmen vom Pausenkiosk abgerechnet." }],
        hobbys: "Volleyball, Lesen, freiwillig im Tierheim",
        brief_betreff: "Bewerbung um eine Lehrstelle als Kauffrau EFZ",
        brief_absaetze: [
          "Mit grossem Interesse habe ich Ihr Inserat für die Lehrstelle als Kauffrau EFZ gelesen. Mich interessiert, wie ein Unternehmen im Hintergrund funktioniert. Darum bewerbe ich mich für den Lehrbeginn im August 2027.",
          "Zurzeit besuche ich die 9. Klasse der Sek A in Olten. In meiner Schnupperlehre bei Ihnen durfte ich Kundendaten erfassen und am Empfang mithelfen – diese Abwechslung hat mir sehr gefallen.",
          "Im Schülerrat bin ich für die Kasse zuständig. Dabei arbeite ich genau und behalte auch bei vielen Aufgaben den Überblick.",
          "Gerne stelle ich mich Ihnen in einem persönlichen Gespräch vor. Ich freue mich auf Ihre Antwort."
        ]
      }
    },
    gesundheit: {
      job: { art: "lehre", beruf: "Fachfrau Gesundheit EFZ", firma: "Alterszentrum Muster", strasse: "Seestrasse 5", plz_ort: "2502 Biel/Bienne", kontakt_anrede: "Frau", kontakt_name: "Hug" },
      profile: {
        vorname: "Sara", nachname: "Morina", strasse: "Seevorstadt 14", plz_ort: "2502 Biel/Bienne", telefon: "079 000 00 33", email: "sara.morina@email.ch", geburtsdatum: "21.09.2011", nationalitaet: "Schweiz", foto: photo("#D6EAE6", "#9CC7BD"),
        schule: [{ zeit: "2024 – 2027", name: "Sekundarschule Biel, Sek B", details: "Lieblingsfächer: Natur und Technik, Deutsch" }, { zeit: "2018 – 2024", name: "Primarschule Biel", details: "" }],
        erfahrungen: [{ zeit: "04/2026", titel: "Schnupperlehre Fachfrau Gesundheit EFZ", ort: "Alterszentrum Muster" }, { zeit: "01/2026", titel: "Schnupperlehre Fachfrau Betreuung EFZ", ort: "Kita Muster" }, { zeit: "seit 2023", titel: "Betreuung der Grossmutter", ort: "Familie" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Albanisch", niveau: "Muttersprache" }, { sprache: "Französisch", niveau: "gut" }],
        computer: "Word, PowerPoint", referenzen: [{ name: "Claudia Weber", funktion: "Klassenlehrerin", telefon: "032 000 00 30" }, { name: "Anna Hug", funktion: "Pflegefachfrau HF", telefon: "032 000 00 31" }]
      },
      ai: {
        kurzprofil: "Ich bin einfühlsam, höre gerne zu und möchte Menschen im Alltag unterstützen.",
        staerken: ["einfühlsam", "geduldig", "hilfsbereit", "belastbar"],
        erfahrungen: [{ nr: 1, beschreibung: "Bewohnerinnen und Bewohner beim Essen und auf Spaziergängen begleitet." }, { nr: 2, beschreibung: "Mit Kindern gespielt und beim Zvieri geholfen." }, { nr: 3, beschreibung: "Einkäufe erledigt und zu Terminen begleitet." }],
        hobbys: "Tanzen, Kochen, Zeit mit der Familie",
        brief_betreff: "Bewerbung um eine Lehrstelle als Fachfrau Gesundheit EFZ",
        brief_absaetze: [
          "Während meiner Schnupperlehre in Ihrem Alterszentrum habe ich gespürt, wie viel ein Lächeln und etwas Zeit bewirken können. Darum bewerbe ich mich für die Lehrstelle als Fachfrau Gesundheit EFZ mit Beginn im August 2027.",
          "Ich besuche die 9. Klasse der Sek B in Biel. Am meisten interessiert mich alles rund um den menschlichen Körper. In der Schnupperlehre durfte ich Bewohnerinnen und Bewohner begleiten und beim Essen helfen.",
          "Zu Hause helfe ich regelmässig bei der Betreuung meiner Grossmutter. Dabei habe ich gelernt, geduldig zuzuhören und ruhig zu bleiben.",
          "Gerne zeige ich Ihnen in einem Gespräch, dass ich gut in Ihr Team passe. Ich freue mich auf Ihre Antwort."
        ]
      }
    },
    it: {
      job: { art: "lehre", beruf: "Informatiker EFZ", firma: "Muster Informatik AG", strasse: "Industriestrasse 4", plz_ort: "4500 Solothurn", kontakt_anrede: "Frau", kontakt_name: "Keller" },
      profile: {
        vorname: "Elias", nachname: "Brunner", strasse: "Rosenweg 5", plz_ort: "4500 Solothurn", telefon: "079 000 00 44", email: "elias.brunner@email.ch", geburtsdatum: "14.05.2011", nationalitaet: "Schweiz", foto: photo("#DCE2F2", "#A7B2D6"),
        schule: [{ zeit: "2024 – 2027", name: "Sekundarschule Solothurn, Sek A", details: "Lieblingsfächer: Mathematik, Medien und Informatik" }, { zeit: "2018 – 2024", name: "Primarschule Solothurn", details: "" }],
        erfahrungen: [{ zeit: "03/2026", titel: "Schnupperlehre Informatiker EFZ", ort: "Muster Informatik AG" }, { zeit: "11/2025", titel: "Schnupperlehre Mediamatiker EFZ", ort: "Muster Media GmbH" }, { zeit: "seit 2025", titel: "Ämtli: IT in der Klasse", ort: "Sekundarschule Solothurn" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "sehr gut" }, { sprache: "Französisch", niveau: "Grundkenntnisse" }],
        computer: "Python, HTML und CSS, Scratch, PC selbst zusammengebaut", referenzen: [{ name: "Sabine Graf", funktion: "Klassenlehrerin", telefon: "032 000 00 40" }, { name: "Peter Muster", funktion: "Berufsbildner", telefon: "032 000 00 42" }]
      },
      ai: {
        kurzprofil: "Ich tüftle gerne an Computern und bleibe dran, bis ein Problem gelöst ist.",
        staerken: ["logisch denkend", "geduldig", "zuverlässig", "neugierig"],
        erfahrungen: [{ nr: 1, beschreibung: "Laptops eingerichtet und ein kleines Python-Programm geschrieben." }, { nr: 2, beschreibung: "Einen kurzen Videobeitrag geschnitten." }, { nr: 3, beschreibung: "Laptops und Beamer im Schulzimmer betreut." }],
        hobbys: "Programmieren, Gamen, Fussball",
        brief_betreff: "Bewerbung um eine Lehrstelle als Informatiker EFZ",
        brief_absaetze: [
          "Seit meiner Schnupperlehre bei Ihnen weiss ich: Informatiker ist mein Wunschberuf. Darum bewerbe ich mich für die Lehrstelle als Informatiker EFZ mit Lehrbeginn im August 2027.",
          "Ich besuche die 9. Klasse der Sek A in Solothurn. Am liebsten habe ich Mathematik sowie Medien und Informatik. In der Schnupperlehre durfte ich Laptops einrichten und erste Zeilen in Python schreiben.",
          "In meiner Klasse bin ich für die Laptops und den Beamer zuständig. So habe ich gelernt, ruhig zu bleiben, wenn etwas nicht funktioniert, und anderen zu helfen.",
          "Gerne zeige ich Ihnen in einem Gespräch, dass ich gut in Ihr Team passe. Ich freue mich auf Ihre Antwort."
        ]
      }
    },
    gestaltung: {
      job: { art: "lehre", beruf: "Grafikerin EFZ", firma: "Studio Muster GmbH", strasse: "Kreativweg 3", plz_ort: "3011 Bern", kontakt_anrede: "Herr", kontakt_name: "Baumann" },
      profile: {
        vorname: "Mia", nachname: "Keller", strasse: "Lindenweg 9", plz_ort: "3012 Bern", telefon: "079 000 00 55", email: "mia.keller@email.ch", geburtsdatum: "02.02.2011", nationalitaet: "Schweiz", foto: photo("#F1E1DA", "#D3AE9E"),
        schule: [{ zeit: "2024 – 2027", name: "Sekundarschule Bern, Sek A", details: "Lieblingsfächer: Bildnerisches Gestalten, Deutsch" }, { zeit: "2018 – 2024", name: "Primarschule Bern", details: "" }],
        erfahrungen: [{ zeit: "02/2026", titel: "Schnupperlehre Grafikerin EFZ", ort: "Studio Muster GmbH" }, { zeit: "10/2025", titel: "Schnupperlehre Polygrafin EFZ", ort: "Muster Druck AG" }, { zeit: "seit 2025", titel: "Plakate für Schulanlässe", ort: "Sekundarschule Bern" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "gut" }, { sprache: "Französisch", niveau: "gut" }],
        computer: "Canva, Affinity Designer, Procreate", referenzen: [{ name: "Ursula Meier", funktion: "Klassenlehrerin", telefon: "031 000 00 50" }, { name: "Marc Baumann", funktion: "Berufsbildner", telefon: "031 000 00 51" }]
      },
      ai: {
        kurzprofil: "Ich zeichne, seit ich denken kann, und mag es, Ideen sichtbar zu machen.",
        staerken: ["kreativ", "genau", "offen", "selbstständig"],
        erfahrungen: [{ nr: 1, beschreibung: "Ein Logo skizziert und am Computer umgesetzt." }, { nr: 2, beschreibung: "Den Weg vom Entwurf bis zum fertigen Druck kennengelernt." }, { nr: 3, beschreibung: "Plakate für das Schulfest und den Sporttag gestaltet." }],
        hobbys: "Zeichnen, Fotografieren, Museen besuchen",
        brief_betreff: "Bewerbung um eine Lehrstelle als Grafikerin EFZ",
        brief_absaetze: [
          "In meiner Schnupperlehre bei Ihnen durfte ich ein eigenes Logo entwerfen. Seitdem ist für mich klar, dass ich Grafikerin werden will. Darum bewerbe ich mich für die Lehrstelle mit Beginn im August 2027.",
          "Ich besuche die 9. Klasse der Sek A in Bern. Am liebsten habe ich Bildnerisches Gestalten. In meiner Freizeit zeichne und fotografiere ich viel und probiere neue Programme aus.",
          "An unserer Schule gestalte ich die Plakate für Anlässe. Dabei habe ich gelernt, auf Rückmeldungen einzugehen und pünktlich fertig zu werden.",
          "Gerne zeige ich Ihnen meine Mappe in einem persönlichen Gespräch. Ich freue mich auf Ihre Antwort."
        ]
      }
    },
    /* ---------- Weitere Lebensphasen (erfundene Personen) ---------- */
    studium: {
      phase: "studium",
      job: { art: "stelle", beruf: "Werkstudent Data Analytics (40 %)", firma: "Muster Retail AG", strasse: "Hardturmstrasse 101", plz_ort: "8005 Zürich", kontakt_anrede: "Frau", kontakt_name: "Steiner" },
      profile: {
        vorname: "Jonas", nachname: "Weber", strasse: "Langstrasse 120", plz_ort: "8004 Zürich", telefon: "079 000 00 66", email: "jonas.weber@email.ch", geburtsdatum: "18.06.2003", nationalitaet: "Schweiz", foto: photo("#DCE6F2", "#9FB3CF"),
        schule: [{ zeit: "seit 2024", name: "BSc Betriebsökonomie, ZHAW Winterthur", details: "5. Semester · Schwerpunkt Business Analytics" }, { zeit: "2019 – 2023", name: "Kantonsschule Zürich Nord", details: "Matura, Schwerpunkt Wirtschaft und Recht" }],
        erfahrungen: [{ zeit: "2025 – heute", titel: "Semesterprojekt Kundenanalyse", ort: "ZHAW mit Muster Bank AG" }, { zeit: "2024 – heute", titel: "Nebenjob Verkauf (20 %)", ort: "Muster Sport AG, Zürich" }, { zeit: "2023 – 2024", titel: "Zivildienst", ort: "Stiftung Muster, Winterthur" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "C1" }, { sprache: "Französisch", niveau: "B1" }],
        computer: "Python (pandas), SQL, Power BI, Excel, Git", referenzen: [{ name: "Dr. Eva Brunner", funktion: "Dozentin Business Analytics, ZHAW", telefon: "058 000 00 60" }]
      },
      ai: {
        kurzprofil: "Wirtschaftsstudent mit Schwerpunkt Business Analytics. Ich mache aus Daten klare Antworten für Teams im Verkauf.",
        staerken: ["analytisch", "strukturiert", "kommunikativ", "lernt schnell"],
        erfahrungen: [{ nr: 1, beschreibung: "Kaufdaten von 12 000 Kundinnen ausgewertet und in Power BI dargestellt." }, { nr: 2, beschreibung: "Kundschaft beraten und Verkaufszahlen der Filiale wöchentlich ausgewertet." }, { nr: 3, beschreibung: "Ein Ferienlager für 40 Kinder mitorganisiert." }],
        hobbys: "Fachschaft Wirtschaft (Kassier), Unihockey, Kochen",
        brief_betreff: "Bewerbung als Werkstudent Data Analytics (40 %)",
        brief_absaetze: [
          "Ihr Inserat für eine Werkstudentenstelle in Data Analytics passt genau zu meinem Studium: Ich studiere Betriebsökonomie an der ZHAW mit Schwerpunkt Business Analytics und bin ab Februar 2027 für ein Pensum von 40 % verfügbar.",
          "Im Semesterprojekt mit der Muster Bank habe ich Kaufdaten von über 12 000 Kundinnen und Kunden mit Python ausgewertet und die Ergebnisse in Power BI so aufbereitet, dass das Verkaufsteam direkt damit arbeiten konnte.",
          "Aus meinem Nebenjob im Verkauf weiss ich, welche Fragen im Alltag wichtig sind. Genau diese Verbindung von Zahlen und Praxis möchte ich in Ihr Team einbringen.",
          "Gerne erzähle ich Ihnen in einem Gespräch mehr über meine Projekte. Ich freue mich auf Ihre Rückmeldung."
        ]
      }
    },
    praktikum: {
      phase: "praktikum",
      job: { art: "praktikum", beruf: "Praktikantin Marketing und Kommunikation", firma: "Muster Tourismus AG", strasse: "Bahnhofplatz 2", plz_ort: "6003 Luzern", kontakt_anrede: "Herr", kontakt_name: "Zimmermann" },
      profile: {
        vorname: "Alina", nachname: "Rossi", strasse: "Bruchstrasse 18", plz_ort: "6003 Luzern", telefon: "079 000 00 77", email: "alina.rossi@email.ch", geburtsdatum: "09.11.2006", nationalitaet: "Schweiz / Italien", foto: photo("#F2E4DC", "#CFA792"),
        schule: [{ zeit: "2022 – 2026", name: "Kantonsschule Alpenquai Luzern", details: "Matura 2026, Schwerpunkt Spanisch · Maturaarbeit über Social Media im Tourismus" }, { zeit: "ab Herbst 2027", name: "Studium Kommunikation (geplant)", details: "ZHAW Winterthur" }],
        erfahrungen: [{ zeit: "2025 – heute", titel: "Instagram-Account der Schule", ort: "Kantonsschule Alpenquai" }, { zeit: "Sommer 2025", titel: "Ferienjob Hotelrezeption", ort: "Hotel Muster, Weggis" }, { zeit: "2024", titel: "Sprachaufenthalt", ort: "Valencia, Spanien" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Italienisch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "C1" }, { sprache: "Spanisch", niveau: "B2" }],
        computer: "Canva, Adobe Express, CapCut, Word, Excel", referenzen: [{ name: "Marco Bühler", funktion: "Betreuer Maturaarbeit", telefon: "041 000 00 70" }]
      },
      ai: {
        kurzprofil: "Frisch maturiert, viersprachig und neugierig. Im Zwischenjahr möchte ich lernen, wie gute Kommunikation im Tourismus entsteht.",
        staerken: ["kreativ", "sprachgewandt", "selbstständig", "offen"],
        erfahrungen: [{ nr: 1, beschreibung: "Beiträge geplant, fotografiert und getextet; die Followerzahl in einem Jahr verdoppelt." }, { nr: 2, beschreibung: "Gäste aus aller Welt auf Deutsch, Englisch und Italienisch empfangen." }, { nr: 3, beschreibung: "Vier Wochen Sprachschule und Gastfamilie, Abschluss B2." }],
        hobbys: "Fotografie, Reisen, Volleyball",
        brief_betreff: "Bewerbung für das Praktikum Marketing und Kommunikation",
        brief_absaetze: [
          "Nach meiner Matura im Sommer 2026 möchte ich mein Zwischenjahr nutzen, um Marketing und Kommunikation in der Praxis kennenzulernen. Ihr Praktikum ab Januar 2027 interessiert mich deshalb sehr.",
          "In meiner Maturaarbeit habe ich untersucht, wie Tourismusregionen Social Media nutzen. Seit einem Jahr betreue ich zudem den Instagram-Account unserer Schule – vom Fotografieren bis zum fertigen Beitrag.",
          "Von Ihnen möchte ich lernen, wie eine Kampagne von der Idee bis zur Umsetzung entsteht. Ich bringe Sprachkenntnisse in vier Sprachen, ein Auge für Bilder und viel Motivation mit.",
          "Über eine Einladung zu einem Gespräch freue ich mich sehr."
        ]
      }
    },
    beruf_technik: {
      phase: "beruf",
      job: { art: "stelle", beruf: "Teamleiter Produktion (100 %)", firma: "Muster Industrie AG", strasse: "Werkstrasse 40", plz_ort: "4500 Solothurn", kontakt_anrede: "Frau", kontakt_name: "Fischer" },
      profile: {
        vorname: "Daniel", nachname: "Meier", strasse: "Bergstrasse 7", plz_ort: "4552 Derendingen", telefon: "079 000 00 88", email: "daniel.meier@email.ch", geburtsdatum: "03.04.1990", nationalitaet: "Schweiz", foto: photo("#DDE3EA", "#9AA8B8"),
        schule: [{ zeit: "2025 – 2027", name: "Teamleiter mit eidg. Fachausweis", details: "SVF, Abschluss Frühling 2027" }, { zeit: "2006 – 2010", name: "Polymechaniker EFZ", details: "Muster Maschinenbau AG, Grenchen" }],
        erfahrungen: [{ zeit: "2018 – heute", titel: "Stv. Teamleiter CNC-Fertigung", ort: "Muster Präzision AG, Grenchen" }, { zeit: "2012 – 2018", titel: "Polymechaniker CNC", ort: "Muster Maschinenbau AG, Grenchen" }, { zeit: "2010 – 2012", titel: "Polymechaniker Montage", ort: "Muster Maschinenbau AG, Grenchen" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Französisch", niveau: "B1" }, { sprache: "Englisch", niveau: "B1" }],
        computer: "SAP PP, Heidenhain- und Fanuc-Steuerungen, MS Office", referenzen: []
      },
      ai: {
        kurzprofil: "Polymechaniker mit 15 Jahren Erfahrung, davon 6 Jahre in Führungsverantwortung. Ich sorge dafür, dass Teams sicher, pünktlich und in guter Qualität produzieren.",
        staerken: ["Führung", "Prozessverbesserung", "Qualitätssicherung", "Schichtplanung"],
        erfahrungen: [{ nr: 1, beschreibung: "Team von 9 Personen geführt; Ausschussquote in zwei Jahren um 30 % gesenkt." }, { nr: 2, beschreibung: "CNC-Programme erstellt und neue Maschinen in Betrieb genommen." }, { nr: 3, beschreibung: "Baugruppen montiert und Lernende im 1. Lehrjahr betreut." }],
        hobbys: "Bergwandern, Feuerwehr Derendingen",
        brief_betreff: "Bewerbung als Teamleiter Produktion",
        brief_absaetze: [
          "Seit sechs Jahren vertrete ich den Teamleiter unserer CNC-Fertigung und führe im Alltag ein Team von neun Personen. Den nächsten Schritt möchte ich nun in einer Gesamtverantwortung gehen – Ihre Stelle als Teamleiter Produktion passt dafür genau.",
          "Unter meiner Leitung haben wir die Ausschussquote in zwei Jahren um 30 Prozent gesenkt, indem wir Prüfschritte vereinfacht und Schichtübergaben klar geregelt haben. Die Weiterbildung zum Teamleiter mit eidg. Fachausweis schliesse ich im Frühling 2027 ab.",
          "Mir ist wichtig, dass Mitarbeitende wissen, was zählt, und sich auf ihre Führung verlassen können. Diese Haltung würde ich gerne in Ihrer Produktion einbringen.",
          "Über eine Einladung zu einem persönlichen Gespräch freue ich mich. Meine Kündigungsfrist beträgt drei Monate."
        ]
      }
    },
    beruf_buero: {
      phase: "beruf",
      job: { art: "stelle", beruf: "Sachbearbeiterin Personal (80 %)", firma: "Muster Bank AG", strasse: "Paradeplatz 8", plz_ort: "8001 Zürich", kontakt_anrede: "Herr", kontakt_name: "Wyss" },
      profile: {
        vorname: "Sandra", nachname: "Kovač", strasse: "Zürcherstrasse 55", plz_ort: "8952 Schlieren", telefon: "079 000 00 99", email: "sandra.kovac@email.ch", geburtsdatum: "21.08.1984", nationalitaet: "Schweiz", foto: photo("#E8E2EC", "#B6A6C2"),
        schule: [{ zeit: "2023 – 2024", name: "HR-Fachfrau mit eidg. Fachausweis", details: "KV Zürich" }, { zeit: "2000 – 2003", name: "Kauffrau EFZ", details: "Muster Versicherungen AG" }],
        erfahrungen: [{ zeit: "2019 – heute", titel: "HR-Assistentin (60 %)", ort: "Muster Logistik AG, Dietikon" }, { zeit: "2012 – 2019", titel: "Familienzeit und Mitarbeit im Elternrat", ort: "Schlieren" }, { zeit: "2003 – 2012", titel: "Sachbearbeiterin Kundendienst", ort: "Muster Versicherungen AG, Zürich" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Kroatisch", niveau: "Muttersprache" }, { sprache: "Englisch", niveau: "B2" }],
        computer: "SAP SuccessFactors, Abacus Lohn, MS Office (sehr gut)", referenzen: []
      },
      ai: {
        kurzprofil: "HR-Fachfrau mit eidg. Fachausweis und über 15 Jahren Erfahrung in Administration und Kundendienst. Genau, diskret und gerne die erste Ansprechperson.",
        staerken: ["Lohnadministration", "Arbeitsrecht", "Diskretion", "Organisation"],
        erfahrungen: [{ nr: 1, beschreibung: "Ein- und Austritte, Arbeitsverträge und Lohnmutationen für 180 Mitarbeitende betreut." }, { nr: 2, beschreibung: "Bewusste Familienzeit; Kasse und Anlässe des Elternrats organisiert." }, { nr: 3, beschreibung: "Kundenanfragen bearbeitet und neue Kolleginnen eingearbeitet." }],
        hobbys: "Lesen, Yoga, Garten",
        brief_betreff: "Bewerbung als Sachbearbeiterin Personal (80 %)",
        brief_absaetze: [
          "Mit grossem Interesse habe ich Ihre Stelle als Sachbearbeiterin Personal gelesen. Nach mehreren Jahren als HR-Assistentin und dem Abschluss als HR-Fachfrau mit eidg. Fachausweis möchte ich mein Pensum erhöhen und mehr Verantwortung übernehmen.",
          "Bei der Muster Logistik AG betreue ich die gesamte Personaladministration für rund 180 Mitarbeitende, von Arbeitsverträgen bis zu Lohnmutationen in Abacus. Dabei arbeite ich genau und behandle vertrauliche Informationen mit der nötigen Diskretion.",
          "Aus meiner Zeit im Kundendienst einer Versicherung weiss ich, wie wichtig eine freundliche und klare Auskunft ist. Diese Erfahrung möchte ich gerne in Ihrem HR-Team einbringen.",
          "Gerne stelle ich mich Ihnen persönlich vor. Ich freue mich auf Ihre Antwort."
        ]
      }
    },
    beruf_pflege: {
      phase: "beruf",
      job: { art: "stelle", beruf: "Pflegefachfrau HF (70–90 %)", firma: "Spital Muster", strasse: "Spitalweg 1", plz_ort: "3001 Bern", kontakt_anrede: "Frau", kontakt_name: "Blaser" },
      profile: {
        vorname: "Fatima", nachname: "Rexhepi", strasse: "Murtenstrasse 24", plz_ort: "3008 Bern", telefon: "079 000 00 13", email: "fatima.rexhepi@email.ch", geburtsdatum: "11.01.1992", nationalitaet: "Schweiz", foto: photo("#DDEDE8", "#9DC6B8"),
        schule: [{ zeit: "2014 – 2017", name: "Pflegefachfrau HF", details: "Berner Bildungszentrum Pflege" }, { zeit: "2008 – 2011", name: "Fachfrau Gesundheit EFZ", details: "Alterszentrum Muster, Bern" }],
        erfahrungen: [{ zeit: "2021 – 2026", titel: "Familienzeit; Kurse Wiedereinstieg Pflege", ort: "Bern" }, { zeit: "2017 – 2021", titel: "Pflegefachfrau HF Chirurgie", ort: "Spital Muster, Bern" }, { zeit: "2011 – 2014", titel: "Fachfrau Gesundheit", ort: "Alterszentrum Muster, Bern" }],
        sprachen: [{ sprache: "Deutsch", niveau: "Muttersprache" }, { sprache: "Albanisch", niveau: "Muttersprache" }, { sprache: "Französisch", niveau: "B1" }],
        computer: "Klinikinformationssystem KISIM, MS Office", referenzen: []
      },
      ai: {
        kurzprofil: "Pflegefachfrau HF mit vier Jahren Erfahrung in der Chirurgie. Nach der Familienzeit bin ich bereit für den Wiedereinstieg – fachlich aufgefrischt und mit viel Freude am Beruf.",
        staerken: ["Patientenbetreuung", "Wundversorgung", "Ruhe in hektischen Situationen", "Teamarbeit"],
        erfahrungen: [{ nr: 1, beschreibung: "Wiedereinstiegskurs Pflege des SBK und Refresher Wundmanagement absolviert." }, { nr: 2, beschreibung: "Patientinnen vor und nach Operationen betreut; Bezugspflege für bis zu sechs Personen." }, { nr: 3, beschreibung: "Bewohnerinnen im Alltag gepflegt und Lernende begleitet." }],
        hobbys: "Schwimmen, Kochen mit der Familie",
        brief_betreff: "Bewerbung als Pflegefachfrau HF (70–90 %)",
        brief_absaetze: [
          "Nach einigen Jahren Familienzeit möchte ich wieder in die Pflege einsteigen – am liebsten in der Chirurgie, wo ich bereits vier Jahre gearbeitet habe. Ihre Stelle als Pflegefachfrau HF mit einem Pensum von 70 bis 90 Prozent passt genau zu meiner Situation.",
          "Für den Wiedereinstieg habe ich den Kurs des SBK und einen Refresher in Wundmanagement abgeschlossen. So bin ich fachlich auf dem aktuellen Stand und kann rasch Verantwortung übernehmen.",
          "In der Chirurgie habe ich gelernt, auch in hektischen Momenten ruhig zu bleiben und Patientinnen und Angehörige gut zu begleiten. Darauf freue ich mich wieder.",
          "Gerne erzähle ich Ihnen in einem persönlichen Gespräch mehr über mich."
        ]
      }
    }
  };
  const sample = field => Object.assign({ datum: "24. Oktober 2026" }, SAMPLES[field] || SAMPLES.it);
  /* Beispielperson passend zur Vorlage */
  const sampleFor = t => sample((typeof t === "string" ? byId(t) : t).sample || (typeof t === "string" ? byId(t) : t).field);

  /* ---------- Mini-Vorschau ---------- */
  const A4_PX = 793.7; // 210 mm in CSS-Pixeln
  const mini = html => `<div class="mini">${html}</div>`;
  let ro;
  function fit(root = document) {
    if (!ro) ro = new ResizeObserver(es => es.forEach(e => {
      const wdt = e.contentRect.width; if (wdt) e.target.style.setProperty("--s", (wdt / A4_PX).toFixed(4));
    }));
    root.querySelectorAll(".mini").forEach(m => {
      if (m.dataset.fit) return; m.dataset.fit = "1"; ro.observe(m);
      const wdt = m.clientWidth; if (wdt) m.style.setProperty("--s", (wdt / A4_PX).toFixed(4));
    });
  }

  w.ZV = { TEMPLATES, FIELDS, FAMS, PHASES, byId, cv, letter, sample, sampleFor, mini, fit, esc };
})(window);
