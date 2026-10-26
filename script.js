/* =========================================================
   Zusago – Startseite: Animationen und Interaktionen
   ========================================================= */

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Navigation ---------- */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 10);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const burger = $("#burger"), menu = $("#mobileMenu");
burger.addEventListener("click", () => {
  const open = burger.getAttribute("aria-expanded") === "true";
  burger.setAttribute("aria-expanded", String(!open));
  burger.setAttribute("aria-label", open ? "Menü öffnen" : "Menü schliessen");
  menu.classList.toggle("open", !open);
  if (!open) nav.classList.add("scrolled"); else onScroll();
});
$$("#mobileMenu a").forEach(a => a.addEventListener("click", () => {
  burger.setAttribute("aria-expanded", "false"); menu.classList.remove("open");
}));

/* ---------- Ausklappmenüs in der Navigation ---------- */
(() => {
  const groups = $$(".nd"); if (!groups.length) return;
  const close = (except) => groups.forEach(g => { if (g !== except) { g.classList.remove("open"); $(".nd-btn", g).setAttribute("aria-expanded", "false"); } });
  groups.forEach(g => {
    const btn = $(".nd-btn", g);
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const open = !g.classList.contains("open");
      close(g); g.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open));
    });
    g.addEventListener("keydown", e => { if (e.key === "Escape") { close(); btn.focus(); } });
    g.addEventListener("focusout", e => { if (!g.contains(e.relatedTarget)) close(); });
  });
  document.addEventListener("click", e => { if (!e.target.closest(".nd")) close(); });
})();

/* ---------- Scroll-Reveal ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
$$(".reveal, .stack-card, .footer-mega, .klass-card").forEach(el => io.observe(el));

/* ---------- Cursor-Glow ---------- */
if (finePointer && !reduce) {
  const glow = $(".cursor-glow");
  let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty;
  addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    x += (tx - x) * 0.12; y += (ty - y) * 0.12;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

/* ---------- Situations-Wechsel im Hero ---------- */
(() => {
  const box = $("#rotator"); if (!box) return;
  const line = $(".rot-line", box);
  // gleiche Reihenfolge wie die Beispiel-Szenen im Hero (heroDocs)
  const jobs = ["für die Lehrstelle", "fürs Praktikum", "für den Nebenjob", "für den nächsten Job"];
  let i = 0, current = $(".rot-word", box);
  const split = (el, text) => {
    el.setAttribute("aria-label", text);
    el.innerHTML = [...text].map((ch, k) => `<span class="ch" aria-hidden="true" style="--d:${k}">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
  };
  split(current, jobs[0]);
  const fitLine = el => { line.style.width = `calc(${el.offsetWidth}px + .12em)`; };
  requestAnimationFrame(() => fitLine(current));
  addEventListener("resize", () => fitLine(current));
  if (document.fonts) document.fonts.ready.then(() => fitLine(current));
  setInterval(() => {
    i = (i + 1) % jobs.length;
    document.dispatchEvent(new CustomEvent("zusago:job", { detail: i }));
    if (reduce) { split(current, jobs[i]); fitLine(current); return; }
    const next = document.createElement("span");
    next.className = "rot-word"; split(next, jobs[i]); box.insertBefore(next, line);
    const old = current; current = next;
    old.classList.remove("in"); old.classList.add("out");
    requestAnimationFrame(() => requestAnimationFrame(() => { next.classList.add("in"); fitLine(next); }));
    setTimeout(() => old.remove(), 1200);
  }, 3400);
})();

/* ---------- Hero: Inserat → echte Dokumente (wechselt mit dem Beruf) ---------- */
(() => {
  const box = $("#heroDocs"); if (!box || !window.ZV) return;
  const { sample, byId, cv, letter, mini, fit, esc } = window.ZV;
  const SCENES = [
    { field: "handwerk", tpl: "winterthur", kicker: "Lehrstelle · Inserat", url: "yousty.ch/lehrstellen/polymechaniker-efz", title: "Polymechaniker/in EFZ", firm: "Muster Präzision AG · Grenchen", req: ["handwerkliches Geschick", "räumliches Denken", "Genauigkeit"], meta: ["Lehrbeginn August 2027", "4 Jahre"] },
    { field: "praktikum", tpl: "genf", kicker: "Praktikum · Inserat", url: "jobs.ch/de/stellenangebote/praktikum-marketing", title: "Praktikum Marketing und Kommunikation", firm: "Muster Tourismus AG · Luzern", req: ["Freude an Social Media", "Sprachkenntnisse", "Matura"], meta: ["ab Januar 2027", "6 Monate · 100 %"] },
    { field: "studium", tpl: "basel", kicker: "Nebenjob · Inserat", url: "jobs.ch/de/stellenangebote/werkstudent-data", title: "Werkstudent/in Data Analytics", firm: "Muster Retail AG · Zürich", req: ["Studium Wirtschaft oder Informatik", "SQL oder Python", "40 %"], meta: ["ab Februar 2027", "neben dem Studium"] },
    { field: "beruf_technik", tpl: "zuerich", kicker: "Stelle · Inserat", url: "jobs.ch/de/stellenangebote/teamleiter-produktion", title: "Teamleiter/in Produktion", firm: "Muster Industrie AG · Solothurn", req: ["Führungserfahrung", "technische Grundbildung", "Prozessdenken"], meta: ["nach Vereinbarung", "100 %"] }
  ];
  const linkIco = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.2 1.2M14 10a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.2-1.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const arrow = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 24h30M28 14l10 10-10 10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  box.innerHTML = `<div class="hd-scenes">${SCENES.map((sc, k) => {
    const st = sample(sc.field), t = byId(sc.tpl);
    return `<div class="hd-scene ${k === 0 ? "on" : ""}" ${k === 0 ? "" : 'aria-hidden="true"'}>
      <div class="ad-card">
        <div class="ad-url">${linkIco}${esc(sc.url)}</div>
        <span class="ad-kicker">${esc(sc.kicker)}</span>
        <div class="ad-title">${esc(sc.title)}</div>
        <div class="ad-firm">${esc(sc.firm)}</div>
        <div class="ad-req">${sc.req.map(r => `<span>${esc(r)}</span>`).join("")}</div>
        <div class="ad-meta">${sc.meta.map(m => `<span>${esc(m)}</span>`).join("")}</div>
      </div>
      <div class="hd-arrow">${arrow}</div>
      <div class="doc-pair" role="img" aria-label="Beispiel: Lebenslauf und Bewerbungsschreiben für ${esc(sc.title)} in der Vorlage ${esc(t.name)}">
        <div class="dp-page dp-letter">${mini(letter(st, t))}</div>
        <div class="dp-page dp-cv">${mini(cv(st, t))}</div>
        <span class="dp-badge"><span class="spark" aria-hidden="true"></span>Passend zum Inserat</span>
      </div>
    </div>`;
  }).join("")}</div>`;
  fit(box);
  const scenes = $$(".hd-scene", box);
  document.addEventListener("zusago:job", e => {
    const k = e.detail % scenes.length;
    scenes.forEach((sc, j) => { sc.classList.toggle("on", j === k); if (j === k) sc.removeAttribute("aria-hidden"); else sc.setAttribute("aria-hidden", "true"); });
  });
})();

/* ---------- Echte Dokumente als Paar: <div data-docs="feld:vorlage"> ---------- */
(() => {
  if (!window.ZV) return;
  const { sample, byId, cv, letter, mini, fit, esc } = window.ZV;
  $$("[data-docs]").forEach(el => {
    const [field, tpl] = el.dataset.docs.split(":"), st = sample(field), t = byId(tpl);
    el.classList.add("doc-pair");
    if (!el.hasAttribute("role")) { el.setAttribute("role", "img"); el.setAttribute("aria-label", `Beispiel: Lebenslauf und Bewerbungsbrief in der Vorlage ${t.name}`); }
    el.innerHTML = `<div class="dp-page dp-letter">${mini(letter(st, t))}</div><div class="dp-page dp-cv">${mini(cv(st, t))}</div>${el.dataset.badge ? `<span class="dp-badge"><span class="spark" aria-hidden="true"></span>${esc(el.dataset.badge)}</span>` : ""}`;
    fit(el);
  });
})();

/* ---------- Hero-Hintergrund: weiche Farbflächen + Partikel ---------- */
(() => {
  const c = $("#heroCanvas"); if (!c) return;
  const ctx = c.getContext("2d");
  let w, h, dpr, parts = [], visible = true, mouse = { x: -999, y: -999 };
  const blobs = [
    { x: .78, y: .28, r: .42, col: [79, 70, 229], a: .20, sp: .00021, ph: 0 },
    { x: .9, y: .82, r: .34, col: [255, 122, 89], a: .16, sp: .00027, ph: 2 },
    { x: .15, y: .9, r: .30, col: [34, 197, 154], a: .11, sp: .00018, ph: 4 },
    { x: .35, y: .1, r: .26, col: [156, 151, 243], a: .16, sp: .00024, ph: 1 }
  ];
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(70, (w * h) / 18000));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: 1 + Math.random() * 1.8, coral: Math.random() < .18
    }));
  }
  size(); addEventListener("resize", size);
  c.parentElement.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  c.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(c);

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const b of blobs) {
      const bx = (b.x + Math.sin(t * b.sp + b.ph) * .06) * w;
      const by = (b.y + Math.cos(t * b.sp * 1.3 + b.ph) * .07) * h;
      const br = b.r * Math.max(w, h);
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `rgba(${b.col},${b.a})`); g.addColorStop(1, `rgba(${b.col},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    for (const p of parts) {
      if (!reduce) { p.x += p.vx; p.y += p.vy; }
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 110 && d > 0) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 120) { ctx.strokeStyle = `rgba(79,70,229,${(1 - d / 120) * .14})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (const p of parts) {
      ctx.fillStyle = p.coral ? "rgba(255,122,89,.75)" : "rgba(79,70,229,.45)";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (reduce) { draw(0); return; }
  (function loop(t) { if (visible) draw(t); requestAnimationFrame(loop); })(0);
})();

/* ---------- Hero-Titel: Wort für Wort einblenden ---------- */
(() => {
  const hero = $(".hero"); if (!hero) return; let wi = 0;
  $$(".h-line", hero).forEach(line => {
    [...line.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement("span"); w.className = "w"; w.style.setProperty("--wi", wi++); w.textContent = part; frag.append(w);
        });
        node.replaceWith(frag);
      } else {
        const w = document.createElement("span"); w.className = "w"; w.style.setProperty("--wi", wi++);
        node.replaceWith(w); w.append(node);
      }
    });
  });
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("ready")));
})();

/* ---------- App-Ansicht: Tabs ---------- */
(() => {
  const tabs = $$(".mock-tabs [role=tab]"), ind = $(".tab-ind"); if (!tabs.length) return;
  const move = t => { ind.style.width = t.offsetWidth + "px"; ind.style.transform = `translateX(${t.offsetLeft - 4}px)`; };
  const select = t => {
    tabs.forEach(b => b.setAttribute("aria-selected", String(b === t)));
    $$(".pane").forEach(p => p.classList.toggle("on", p.dataset.pane === t.dataset.tab));
    move(t);
  };
  tabs.forEach(t => t.addEventListener("click", () => { auto = false; select(t); }));
  const sync = () => move(tabs.find(t => t.getAttribute("aria-selected") === "true"));
  requestAnimationFrame(sync); addEventListener("resize", sync); if (document.fonts) document.fonts.ready.then(sync);
  // wechselt von selbst, bis jemand selber klickt
  let auto = !reduce, k = 0;
  setInterval(() => { if (!auto) return; const r = $("#mock").getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; k = (k + 1) % tabs.length; select(tabs[k]); }, 4200);
})();

/* ---------- Ton-Regler (App-Ansicht + Bento) ---------- */
(() => {
  const T = [
    "Seit ich meinen ersten PC selbst zusammengebaut habe, weiss ich: Informatik ist genau mein Ding.",
    "In meiner Schnupperlehre bei der Muster AG habe ich gemerkt, dass mir Informatik grossen Spass macht und ich gerne knifflige Probleme löse.",
    "Während meiner Schnupperlehre bei der Muster AG konnte ich erste Einblicke in die Informatik gewinnen. Besonders das strukturierte Lösen von Problemen hat mich überzeugt."
  ];
  const SHORT = ["Informatik ist genau mein Ding.", "Informatik macht mir grossen Spass.", "Die Informatik hat mich überzeugt."];
  const STRONG = " Ich arbeite genau und bleibe dran, bis es funktioniert.";
  const out = $("#toneText"), range = $("#tone");
  if (out) {
  let extra = "", short = false;
  const render = () => {
    const v = +range.value;
    out.textContent = (short ? SHORT[v] : T[v]) + extra;
    out.classList.remove("flash"); void out.offsetWidth; out.classList.add("flash");
    setTimeout(() => out.classList.remove("flash"), 600);
  };
  range.addEventListener("input", render);
  $$(".sugg").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.s === "short") short = !short; else extra = extra ? "" : STRONG;
    b.classList.toggle("on"); render();
    // Bewerbung-Tab zeigen, damit man die Änderung sieht
    const t = $('.mock-tabs [data-tab="letter"]'); if (t.getAttribute("aria-selected") !== "true") t.click();
  }));
  range.addEventListener("input", () => { const t = $('.mock-tabs [data-tab="letter"]'); if (t.getAttribute("aria-selected") !== "true") t.click(); });
  out.textContent = T[1];
  }

  const mini = $("#toneMini"), mr = $("#toneMiniRange");
  const M = ["Informatik ist genau mein Ding.", "Informatik macht mir grossen Spass.", "Die Informatik interessiert mich sehr."];
  if (mini) mr.addEventListener("input", () => { mini.style.opacity = 0; setTimeout(() => { mini.textContent = M[+mr.value]; mini.style.opacity = 1; }, 180); });
})();

/* ---------- Bento: Tracker und Dossier ---------- */
(() => {
  const st = $("#bxTrack .st-wait");
  if (st) new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    setTimeout(() => { st.textContent = "Zusage"; st.classList.replace("st-wait", "st-yes"); }, reduce ? 0 : 1600);
  }, { threshold: .6 }).observe(st);
  if (!finePointer) $$(".bx .dossier").forEach(d => new IntersectionObserver(([e]) => d.closest(".bx").classList.toggle("merge", e.isIntersecting), { threshold: .8 }).observe(d));
})();

/* Beispiel-Link in Karte 1 (ohne Tipp-Animation) */
(() => { const el = $(".typing"); if (el) el.textContent = el.dataset.text; })();

/* ---------- Vorlagen: Galerie mit echter Vorschau ----------
   Braucht vorlagen.js und dokumente.css.
   Vorderseite = Lebenslauf, Rückseite = Brief (Hover).
   Klick oder Enter öffnet die grosse Vorschau als Set.          */
(() => {
  const grid = $("#tplGrid"); if (!grid || !window.ZV) return;
  const { TEMPLATES, FAMS, cv, letter, sampleFor, mini, fit, esc } = window.ZV;
  const only = grid.dataset.fam, limit = +grid.dataset.limit || 0;
  const order = ["start", "campus", "beruf", "klassisch"];
  // Lebensphasen-Seite: zuerst die Empfehlungen, dann aufgefüllt bis 4; sonst alle in gemischter Reihenfolge
  const all = only ? [...TEMPLATES.filter(t => t.fam === only), ...TEMPLATES.filter(t => t.fam !== only)].slice(0, 4)
    : order.flatMap((f, k) => TEMPLATES.filter(t => t.fam === f).map((t, i) => ({ t, r: i * 4 + k }))).sort((a, b) => a.r - b.r).map(x => x.t);
  const tag = () => "";
  grid.innerHTML = all.map((t, i) => {
    const st = sampleFor(t);
    return `<div class="tpl${limit && i >= limit ? " over" : ""}" data-f="${t.fam}" data-id="${t.id}" tabindex="0" role="button" aria-label="Vorlage ${esc(t.name)}, gross ansehen">
      <div class="tpl-flip">
        <div class="tpl-face tpl-front">${mini(cv(st, t))}${tag(t)}</div>
        <div class="tpl-face tpl-back">${mini(letter(st, t))}<span class="tpl-tag tag-pass">Brief</span></div>
      </div>
      <div class="tpl-meta"><div class="tpl-name">${esc(t.name)}</div><div class="tpl-field">${esc(t.wirkung)}</div></div>
    </div>`;
  }).join("");
  fit(grid);

  /* Grosse Vorschau */
  const dlg = document.createElement("dialog");
  dlg.className = "tpl-dialog";
  dlg.setAttribute("aria-labelledby", "tplDlgTitle");
  document.body.appendChild(dlg);
  const open = id => {
    const t = TEMPLATES.find(x => x.id === id); if (!t) return;
    const st = sampleFor(t);
    dlg.innerHTML = `<div class="tpl-dlg-head">
        <div><h2 id="tplDlgTitle">${esc(t.name)}<span class="dot">.</span></h2><p>${esc(t.wirkung)} · empfohlen für ${FAMS[t.fam].fuer} · in jeder Bewerbung enthalten</p></div>
        <button type="button" class="tpl-dlg-x" aria-label="Schliessen"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="tpl-dlg-pages">
        <figure>${mini(cv(st, t))}<figcaption>Lebenslauf</figcaption></figure>
        <figure>${mini(letter(st, t))}<figcaption>Bewerbungsschreiben</figcaption></figure>
      </div>
      <div class="tpl-dlg-foot">
        <p>Beispiel mit erfundener Person. Mit deinen Angaben passt die KI alles an deine Stelle an.</p>
        <a href="app.html?tpl=${t.id}" class="btn btn-primary">Mit dieser Vorlage starten <span class="arrow" aria-hidden="true">→</span></a>
      </div>`;
    $(".tpl-dlg-x", dlg).addEventListener("click", () => dlg.close());
    dlg.showModal(); fit(dlg);
  };
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  $$(".tpl", grid).forEach(t => {
    t.addEventListener("click", () => open(t.dataset.id));
    t.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(t.dataset.id); } });
  });

  $$(".filter").forEach(btn => btn.addEventListener("click", () => {
    $$(".filter").forEach(b => b.classList.toggle("on", b === btn));
    const f = btn.dataset.f; grid.classList.toggle("filtered", f !== "alle");
    $$(".tpl", grid).forEach((t, i) => {
      const show = f === "alle" || t.dataset.f === f;
      t.classList.toggle("hide", !show); t.classList.remove("enter");
      if (show) { void t.offsetWidth; t.style.animationDelay = `${(i % 6) * 40}ms`; t.classList.add("enter"); }
    });
  }));
})();

/* ---------- Preise: Paket wählen ---------- */
(() => {
  const box = $("#pkgs"); if (!box) return;
  const ONE = +($(".pkg[data-n=\"1\"]", box)?.dataset.total || 7.90), chf = v => v.toFixed(2);
  const pick = b => {
    $$(".pkg", box).forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", String(x === b)); });
    const n = +b.dataset.n, tot = +b.dataset.total, save = n * ONE - tot;
    $("#pkgSumTitle").textContent = `${n} ${n === 1 ? "Bewerbung" : "Bewerbungen"} für CHF ${chf(tot)}`;
    $("#pkgSumSave").textContent = save > 0.004 ? `Du sparst CHF ${chf(save)} gegenüber dem Einzelkauf.` : "Ideal, wenn du dich nur bei einem Betrieb bewirbst.";
    const go = $("#pkgGo"); if (go) go.href = `app.html?pack=${n}`;
  };
  $$(".pkg", box).forEach(b => {
    b.addEventListener("click", () => pick(b));
    b.addEventListener("keydown", e => {
      const list = $$(".pkg", box), i = list.indexOf(b);
      if (["ArrowRight", "ArrowDown"].includes(e.key)) { e.preventDefault(); const n = list[(i + 1) % list.length]; n.focus(); pick(n); }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); const n = list[(i - 1 + list.length) % list.length]; n.focus(); pick(n); }
    });
  });
})();

/* ---------- Erfahrung -> Lebenslauf-Satz ---------- */
(() => {
  const out = $("#expText"), card = $(".exp-card"); if (!out) return; let timer, typing;
  out.classList.add("muted");
  $$("#expChips .chip").forEach(chip => chip.addEventListener("click", () => {
    $$("#expChips .chip").forEach(c => c.classList.toggle("on", c === chip));
    clearTimeout(timer); clearInterval(typing);
    const text = chip.dataset.t;
    out.classList.remove("muted"); out.textContent = ""; card.classList.add("busy");
    if (reduce) { card.classList.remove("busy"); out.textContent = text; return; }
    timer = setTimeout(() => {
      let i = 0;
      typing = setInterval(() => {
        out.textContent = text.slice(0, ++i);
        if (i >= text.length) { clearInterval(typing); card.classList.remove("busy"); }
      }, 22);
    }, 650);
  }));
})();

/* ---------- Vorher / Nachher ---------- */
(() => {
  const ba = $("#ba"), range = $("#baRange"); if (!ba) return;
  const set = v => ba.style.setProperty("--p", v + "%");
  range.addEventListener("input", () => set(range.value));
  // kleine Einladungs-Animation, sobald sichtbar
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || reduce) return; obs.disconnect();
    let t0; const dur = 1600;
    (function anim(t) { t0 ??= t; const p = Math.min((t - t0) / dur, 1);
      const v = 50 + Math.sin(p * Math.PI * 2) * 18; set(v); range.value = v;
      if (p < 1) requestAnimationFrame(anim); else { set(50); range.value = 50; } })(performance.now());
  }, { threshold: .5 });
  obs.observe(ba);
})();

/* ---------- Lichtstrahlen im Schluss-CTA ---------- */
(() => {
  const c = $("#raysCanvas"); if (!c) return;
  const ctx = c.getContext("2d"); let w, h, dpr, visible = false;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener("resize", size);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(c);
  const dots = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), s: .2 + Math.random() * .6, r: .6 + Math.random() * 1.6 }));
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = -h * .15, n = 14;
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + (i - n / 2) * .11 + Math.sin(t * .0003 + i) * .04;
      const len = h * 1.6, spread = .035;
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      g.addColorStop(0, `rgba(255,255,255,${.10 + .06 * Math.sin(t * .001 + i * 1.7)})`); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - spread) * len, cy + Math.sin(a - spread) * len);
      ctx.lineTo(cx + Math.cos(a + spread) * len, cy + Math.sin(a + spread) * len); ctx.fill();
    }
    for (const d of dots) {
      const y = ((d.y - t * .00002 * d.s * 10) % 1 + 1) % 1;
      ctx.fillStyle = d.r > 1.6 ? "rgba(255,122,89,.8)" : "rgba(255,255,255,.55)";
      ctx.beginPath(); ctx.arc(d.x * w, y * h, d.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (reduce) { draw(0); return; }
  (function loop(t) { if (visible) draw(t); requestAnimationFrame(loop); })(0);
})();

/* ---------- Link-Formular: weiter in die App ---------- */
(() => {
  const form = $("#linkForm"), input = $("#jobLink"), err = $("#formError"); if (!form) return;
  input.addEventListener("input", () => { err.textContent = ""; });
  form.addEventListener("submit", e => {
    e.preventDefault();
    let v = input.value.trim();
    if (!v) { err.textContent = "Füg zuerst den Link zum Inserat ein."; shake(); input.focus(); return; }
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try { const u = new URL(v); if (!u.hostname.includes(".")) throw 0; }
    catch { err.textContent = "Das sieht nicht nach einem Link aus. Kopier ihn direkt aus der Adresszeile."; shake(); return; }
    location.href = "app.html?link=" + encodeURIComponent(v);
  });
  function shake() { form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake"); }
})();

$("#year").textContent = new Date().getFullYear();


/* ---------- Beispiele: Tabs pro Lebensphase ---------- */
(() => {
  $$("[data-ex-tabs]").forEach(box => {
    const tabs = $$("[data-ex]", box), panels = $$("[data-ex-panel]", box.parentElement);
    const pick = b => {
      tabs.forEach(x => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; });
      panels.forEach(p => p.hidden = p.dataset.exPanel !== b.dataset.ex);
      if (window.ZV) window.ZV.fit(box.parentElement);
    };
    tabs.forEach((b, i) => {
      b.addEventListener("click", () => pick(b));
      b.addEventListener("keydown", e => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
        e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); pick(n);
      });
    });
  });
})();
