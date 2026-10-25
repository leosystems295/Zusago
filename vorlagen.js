/* =========================================================
   Zusago – Vorlagen (gemeinsam für Website und App)
   - Liste aller Vorlagen
   - Lebenslauf und Brief als echte A4-Seite (HTML)
   - Beispielpersonen für die Vorschau auf der Website
   - Mini-Vorschau: echte Seite, passend verkleinert
   ========================================================= */
(function (w) {
  "use strict";

  /* ---------- Vorlagen ----------
     layout: "top" (Band oben) oder "side" (Spalte links)
     acc: Hauptfarbe, acc2: zweite Farbe (optional)
     mods: Varianten aus dokumente.css
     free: in der Gratis-Version enthalten                       */
  const TEMPLATES = [
    { id: "werkstatt",  name: "Werkstatt",  field: "handwerk",   layout: "side", acc: "#14213D", acc2: "#E8603C", mods: "m-bar m-dot",             free: true },
    { id: "klar",       name: "Klar",       field: "buero",      layout: "top",  acc: "#4F46E5",                  mods: "",                        free: true },
    { id: "fuersorge",  name: "Fürsorge",   field: "gesundheit", layout: "side", acc: "#0B7A5C",                  mods: "m-light m-round",         free: true },
    { id: "code",       name: "Code",       field: "it",         layout: "side", acc: "#4F46E5", acc2: "#A5B4FC", mods: "m-dark m-mono",           free: false },
    { id: "funke",      name: "Funke",      field: "handwerk",   layout: "top",  acc: "#E8603C",                  mods: "m-line m-dot",            free: false },
    { id: "buehne",     name: "Bühne",      field: "gestaltung", layout: "top",  acc: "#E8603C", acc2: "#14213D", mods: "m-caps m-dot",            free: false },
    { id: "laden",      name: "Laden",      field: "buero",      layout: "side", acc: "#9D174D",                  mods: "m-serif",                 free: false },
    { id: "terminal",   name: "Terminal",   field: "it",         layout: "top",  acc: "#0B7A5C", acc2: "#22C59A", mods: "m-dark m-mono",           free: false },
    { id: "pflege",     name: "Pflege",     field: "gesundheit", layout: "top",  acc: "#0E7490",                  mods: "m-line m-round",          free: false },
    { id: "skizze",     name: "Skizze",     field: "gestaltung", layout: "side", acc: "#6D5DD3",                  mods: "m-light m-round m-dot",   free: false },
    { id: "praezision", name: "Präzision",  field: "handwerk",   layout: "top",  acc: "#334155", acc2: "#FBBF24", mods: "m-stripe m-bar m-caps",   free: false },
    { id: "netzwerk",   name: "Netzwerk",   field: "it",         layout: "top",  acc: "#0369A1",                  mods: "m-light m-dot",           free: false }
  ];
  const FIELDS = { handwerk: "Handwerk und Technik", buero: "Büro und Verkauf", gesundheit: "Gesundheit", it: "IT", gestaltung: "Gestaltung" };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plain = (path, text, tag = "span", cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""}>${esc(text)}</${tag}>`;
  const byId = id => TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
  const pageAttr = t => `style="--acc:${t.acc}${t.acc2 ? `;--acc2:${t.acc2}` : ""}"`;
  const today = () => new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });
  const city = s => String(s || "").replace(/^\s*\d{4}\s*/, "").trim();
  function anrede(j) {
    const n = String(j.kontakt_name || "").trim();
    if (j.kontakt_anrede === "Frau" && n) return `Sehr geehrte Frau ${n}`;
    if (j.kontakt_anrede === "Herr" && n) return `Sehr geehrter Herr ${n}`;
    return "Sehr geehrte Damen und Herren";
  }

  /* ---------- Lebenslauf ---------- */
  function cv(st, t, ed = plain) {
    t = typeof t === "string" ? byId(t) : (t || TEMPLATES[0]);
    const p = st.profile, a = st.ai || {}, j = st.job || {};
    const nonEmpty = l => (l || []).filter(o => Object.values(o).some(v => String(v).trim()));
    const schule = nonEmpty(p.schule), erf = nonEmpty(p.erfahrungen), spr = nonEmpty(p.sprachen), ref = nonEmpty(p.referenzen);
    const staerken = (a.staerken && a.staerken.length ? a.staerken : p.staerken || []);
    const hobbys = a.hobbys || (p.hobbys || []).join(", ");
    const desc = i => (a.erfahrungen || []).find(e => e.nr === i + 1);
    const name = `${esc(p.vorname)} ${esc(p.nachname)}`;
    const photo = p.foto ? `<img class="cv-foto" src="${p.foto}" alt="">` : "";
    const sec = (title, inner) => inner ? `<section class="cv-s"><h3>${title}</h3>${inner}</section>` : "";
    const tl = rows => rows.map(r => `<div class="tl"><span class="tl-z">${esc(r.z)}</span><div><b>${esc(r.t)}</b>${r.d ? `<span>${r.d}</span>` : ""}</div></div>`).join("");
    const personal = [
      ["Adresse", [p.strasse, p.plz_ort].filter(Boolean).join(", ")], ["Telefon", p.telefon], ["E-Mail", p.email],
      ["Geburtsdatum", p.geburtsdatum], ["Nationalität", p.nationalitaet]
    ].filter(x => x[1]).map(([k, v]) => `<div class="kv"><span>${k}</span><b>${esc(v)}</b></div>`).join("");
    const schuleHTML = tl(schule.map(s => ({ z: s.zeit, t: s.name, d: esc(s.details) })));
    const erfHTML = tl(erf.map((e, i) => ({ z: e.zeit, t: [e.titel, e.ort].filter(Boolean).join(", "), d: desc(i) ? ed(`ai.erfahrungen.${(a.erfahrungen || []).indexOf(desc(i))}.beschreibung`, desc(i).beschreibung) : "" })));
    const sprHTML = spr.map(s => `<div class="kv"><span>${esc(s.sprache)}</span><b>${esc(s.niveau)}</b></div>`).join("");
    const stHTML = staerken.length ? `<ul class="cv-tags">${staerken.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : "";
    const refHTML = ref.map(r => `<div class="ref"><b>${esc(r.name)}</b><span>${esc([r.funktion, r.telefon].filter(Boolean).join(" · "))}</span></div>`).join("");
    const kp = a.kurzprofil ? ed("ai.kurzprofil", a.kurzprofil, "p", "cv-kp") : "";
    const role = j.beruf ? `Bewerbung als ${esc(j.beruf)}` : "Lebenslauf";
    const erfTitel = j.art === "schnupper" ? "Erfahrungen" : "Schnupperlehren und Erfahrungen";
    const comp = p.computer ? sec("Computer", `<p>${esc(p.computer)}</p>`) : "";
    const hob = hobbys ? sec("Hobbys", `<p>${esc(hobbys)}</p>`) : "";

    if (t.layout === "side") {
      return `<article class="page cv side tpl-${t.id} ${t.mods}" ${pageAttr(t)}>
        <aside class="cv-side">${photo}${sec("Kontakt", personal)}${sec("Sprachen", sprHTML)}${sec("Stärken", stHTML)}${hob}</aside>
        <div class="cv-main">
          <header class="cv-h"><h1>${name}</h1><p class="cv-role">${role}</p>${kp}</header>
          ${sec("Schulbildung", schuleHTML)}${sec(erfTitel, erfHTML)}${comp}${sec("Referenzen", refHTML)}
        </div></article>`;
    }
    return `<article class="page cv top tpl-${t.id} ${t.mods}" ${pageAttr(t)}>
      <header class="cv-band"><div><h1>${name}</h1><p class="cv-role">${role}</p></div>${photo}</header>
      <div class="cv-body">${kp}
        <div class="cv-cols2">
          <div>${sec("Personalien", personal)}${sec("Sprachen", sprHTML)}${sec("Stärken", stHTML)}${hob}</div>
          <div>${sec("Schulbildung", schuleHTML)}${sec(erfTitel, erfHTML)}${comp}${sec("Referenzen", refHTML)}</div>
        </div>
      </div></article>`;
  }

  /* ---------- Bewerbungsbrief ---------- */
  function letter(st, t, ed = plain) {
    t = typeof t === "string" ? byId(t) : (t || TEMPLATES[0]);
    const p = st.profile, j = st.job || {}, a = st.ai || {};
    const sender = [p.strasse, p.plz_ort, p.telefon, p.email].filter(Boolean).map(esc).join("<br>");
    const recip = [j.firma, j.kontakt_name ? `${j.kontakt_anrede || ""} ${j.kontakt_name}`.trim() : "", j.strasse, j.plz_ort].filter(Boolean).map(esc).join("<br>");
    const beilagen = j.art === "schnupper" ? ["Lebenslauf"] : ["Lebenslauf", "Zeugniskopien"];
    return `<article class="page letter ${t.layout} tpl-${t.id} ${t.mods}" ${pageAttr(t)}>
      <header class="lt-sender"><b>${esc(p.vorname)} ${esc(p.nachname)}</b><span>${sender}</span></header>
      <div class="lt-recip">${recip || "&nbsp;"}</div>
      <p class="lt-date">${esc(city(p.plz_ort) || "Ort")}, ${st.datum || today()}</p>
      ${ed("ai.brief_betreff", a.brief_betreff || (j.beruf ? "Bewerbung als " + j.beruf : "Bewerbung"), "h2", "lt-subj")}
      <p class="lt-anrede">${esc(anrede(j))}</p>
      ${(a.brief_absaetze || []).map((x, i) => ed(`ai.brief_absaetze.${i}`, x, "p", "lt-p")).join("")}
      <p class="lt-gruss">Freundliche Grüsse</p>
      <p class="lt-name">${esc(p.vorname)} ${esc(p.nachname)}</p>
      <p class="lt-beil"><b>Beilagen</b><br>${beilagen.join("<br>")}</p>
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
    }
  };
  const sample = field => Object.assign({ datum: "24. Oktober 2026" }, SAMPLES[field] || SAMPLES.it);

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

  w.ZV = { TEMPLATES, FIELDS, byId, cv, letter, sample, mini, fit, esc };
})(window);
