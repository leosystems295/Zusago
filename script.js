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

/* ---------- Berufe-Wechsel im Hero ---------- */
(() => {
  const box = $("#rotator"); if (!box) return;
  const line = $(".rot-line", box);
  const jobs = ["Informatiker/in", "Polymechaniker/in", "Kaufmann/-frau", "FaGe", "Detailhändler/in", "Logistiker/in", "Mediamatiker/in", "Automatiker/in"];
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
    if (reduce) { split(current, jobs[i]); fitLine(current); return; }
    const next = document.createElement("span");
    next.className = "rot-word"; split(next, jobs[i]); box.insertBefore(next, line);
    const old = current; current = next;
    old.classList.remove("in"); old.classList.add("out");
    requestAnimationFrame(() => requestAnimationFrame(() => { next.classList.add("in"); fitLine(next); }));
    setTimeout(() => old.remove(), 1200);
  }, 3000);
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

/* ---------- App-Ansicht kippt beim Scrollen flach ---------- */
(() => {
  const mock = $("#mock"); if (!mock || reduce) return;
  const upd = () => {
    const r = mock.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight * .75), 0), 1);
    mock.style.transform = `perspective(1600px) rotateX(${(1 - p) * 16}deg) scale(${.93 + p * .07}) translateY(${(1 - p) * 30}px)`;
  };
  upd(); addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true }); addEventListener("resize", upd);
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

/* ---------- Gestapelte Karten: hintere Karten leicht verkleinern ---------- */
(() => {
  const cards = $$(".stack-card"); if (reduce || !cards.length) return;
  function update() {
    cards.forEach((card, i) => {
      const next = cards[i + 1]; if (!next) return;
      const top = next.getBoundingClientRect().top, mine = card.getBoundingClientRect().top;
      const overlap = Math.min(Math.max((card.offsetHeight - (top - mine)) / card.offsetHeight, 0), 1);
      card.style.transform = `scale(${1 - overlap * .05})`;
      card.style.filter = `brightness(${1 - overlap * .06})`;
    });
  }
  addEventListener("scroll", () => requestAnimationFrame(update), { passive: true }); update();
})();

/* Tipp-Animation in Karte 1 */
(() => {
  const el = $(".typing"); if (!el) return;
  const text = el.dataset.text;
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return; obs.disconnect();
    if (reduce) { el.textContent = text; return; }
    let i = 0; const t = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(t); }, 38);
  }, { threshold: .5 });
  obs.observe(el);
})();

/* ---------- Vorlagen: Galerie mit Filter und Flip ---------- */
(() => {
  const grid = $("#tplGrid"); if (!grid) return;
  const T = [
    ["Werkstatt", "handwerk", "#14213D", false, true], ["Klar", "buero", "#4F46E5", false, true],
    ["Fürsorge", "gesundheit", "#22C59A", true, true], ["Code", "it", "#4F46E5", true, false],
    ["Funke", "handwerk", "#FF7A59", true, false], ["Bühne", "gestaltung", "#FF7A59", false, false],
    ["Laden", "buero", "#14213D", true, false], ["Terminal", "it", "#14213D", false, false],
    ["Pflege", "gesundheit", "#9C97F3", false, false], ["Skizze", "gestaltung", "#9C97F3", true, false],
    ["Präzision", "handwerk", "#4F46E5", false, false], ["Netzwerk", "it", "#22C59A", false, false]
  ];
  const label = { handwerk: "Handwerk und Technik", buero: "Büro und Verkauf", gesundheit: "Gesundheit", it: "IT", gestaltung: "Gestaltung" };
  const lines = n => Array.from({ length: n }, (_, k) => `<div class="doc-line ${["w90", "w70", "w80", "w60", "w75"][k % 5]}"></div>`).join("");
  grid.innerHTML = T.slice(0, +grid.dataset.limit || T.length).map(([name, f, col, side, free]) => `
    <div class="tpl ${side ? "side" : ""}" data-f="${f}" style="--c:${col}" tabindex="0" role="button" aria-label="Vorlage ${name}, ${label[f]}, Brief anzeigen">
      <div class="tpl-flip">
        <div class="tpl-face tpl-front"><div class="tpl-head"></div><div class="doc-line w50 strong"></div>${lines(3)}<div class="gap"></div>${lines(4)}<div class="gap"></div>${lines(3)}
          <span class="tpl-tag ${free ? "tag-free" : "tag-pass"}">${free ? "Gratis" : "Im Pass"}</span></div>
        <div class="tpl-face tpl-back"><div class="doc-line w40 strong" style="background:${col}"></div>${lines(1)}<div class="gap"></div><div class="doc-line w55 strong"></div>${lines(4)}<div class="gap"></div>${lines(4)}<div class="gap"></div><div class="doc-line w30"></div>
          <span class="tpl-tag ${free ? "tag-free" : "tag-pass"}">Brief</span></div>
      </div>
      <div class="tpl-meta"><div class="tpl-name">${name}</div><div class="tpl-field">${label[f]}</div></div>
    </div>`).join("");
  $$(".tpl", grid).forEach(t => {
    const flip = () => t.classList.toggle("flipped");
    t.addEventListener("click", () => { if (!finePointer) flip(); });
    t.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  });
  $$(".filter").forEach(btn => btn.addEventListener("click", () => {
    $$(".filter").forEach(b => b.classList.toggle("on", b === btn));
    const f = btn.dataset.f;
    $$(".tpl", grid).forEach((t, i) => {
      const show = f === "alle" || t.dataset.f === f;
      t.classList.toggle("hide", !show); t.classList.remove("enter");
      if (show) { void t.offsetWidth; t.style.animationDelay = `${(i % 6) * 40}ms`; t.classList.add("enter"); }
    });
  }));
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

/* ---------- Spotlight auf Karten ---------- */
$$(".spot").forEach(el => el.addEventListener("pointermove", e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`);
}));

/* ---------- Magnetische Buttons ---------- */
if (finePointer && !reduce) $$(".magnetic").forEach(b => {
  b.addEventListener("pointermove", e => {
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
  });
  b.addEventListener("pointerleave", () => { b.style.transform = ""; });
});

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
