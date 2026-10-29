(() => {
  const G = window.GRAPH;
  const W = 1760, H = 900;
  const SVG = "http://www.w3.org/2000/svg";

  const TYPER = {
    data:       { farge: "var(--blaa)",    traad: "#2e6bd9", ord: "Data" },
    input:      { farge: "var(--gul)",     traad: "#d29c00", ord: "Forutsetninger" },
    ark:        { farge: "transparent",    traad: "#3a4152", ord: "Ark i arbeidsboka" },
    resultat:   { farge: "var(--rosa)",    traad: "#e2477e", ord: "Resultat" },
    usikkerhet: { farge: "var(--oransje)", traad: "#ee7a2c", ord: "Usikkerhet" },
    kontroll:   { farge: "var(--gronn)",   traad: "#2c9d57", ord: "Kontroll" },
    rad:        { farge: "var(--rosa)",    traad: "#e2477e", ord: "Beslutningsnotatet" },
  };

  const scene = document.getElementById("scene");
  const tavle = document.getElementById("tavle");
  const svg = document.getElementById("trader");
  const panel = document.getElementById("panel");
  const innhold = document.getElementById("panel-innhold");
  const nodeById = Object.fromEntries(G.nodes.map(n => [n.id, n]));
  const el = {};
  let valgt = null;

  // Liten, fast skjevhet per lapp, så tavla ser opphengt ut uten å bli tilfeldig for hver lasting
  const skjevhet = id => {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return ((Math.abs(h) % 33) - 16) / 10;
  };

  // Lappene
  for (const n of G.nodes) {
    const t = TYPER[n.kind];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lapp " + (n.ark || n.kind === "rad" ? "gaffa" : "hvit") + (n.kind === "rad" ? " stor" : "");
    b.style.left = n.x + "px";
    b.style.top = n.y + "px";
    b.style.setProperty("--rot", skjevhet(n.id) + "deg");
    b.style.setProperty("--c", t.farge);
    b.dataset.id = n.id;
    b.innerHTML = `<span class="lapp-wrap"><span class="lapp-tekst"></span><span class="lapp-flik"></span></span>`;
    b.querySelector(".lapp-tekst").textContent = n.label;
    b.setAttribute("aria-label", `${n.label}, ${t.ord}`);
    b.addEventListener("click", e => { e.stopPropagation(); velg(n.id); });
    tavle.appendChild(b);
    el[n.id] = b;
  }

  // Tråder
  const traadEls = [];
  function ankre(a, b) {
    const A = nodeById[a], B = nodeById[b];
    const wa = el[a].offsetWidth / 2, ha = el[a].offsetHeight / 2;
    const wb = el[b].offsetWidth / 2, hb = el[b].offsetHeight / 2;
    const dx = B.x - A.x, dy = B.y - A.y;
    if (Math.abs(dx) < (wa + wb) * 0.7) {
      const ned = dy > 0 ? 1 : -1;
      return [A.x, A.y + ned * ha, B.x, B.y - ned * hb, "loddrett"];
    }
    const hoyre = dx > 0 ? 1 : -1;
    return [A.x + hoyre * wa, A.y, B.x - hoyre * wb, B.y, "vannrett"];
  }

  function tegnTrader() {
    svg.innerHTML = "";
    traadEls.length = 0;
    const g = document.createElementNS(SVG, "g");
    const nalG = document.createElementNS(SVG, "g");
    for (const e of G.edges) {
      const [x1, y1, x2, y2, retning] = ankre(e.fra, e.til);
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const heng = Math.min(70, 14 + dist * 0.12);
      let d;
      if (retning === "vannrett") {
        const k = (x2 - x1) * 0.38;
        d = `M${x1},${y1} C${x1 + k},${y1 + heng} ${x2 - k},${y2 + heng} ${x2},${y2}`;
      } else {
        const side = 30 + dist * 0.15;
        d = `M${x1},${y1} C${x1 + side},${y1 + (y2 - y1) * 0.3} ${x2 + side},${y2 - (y2 - y1) * 0.3} ${x2},${y2}`;
      }
      const farge = TYPER[nodeById[e.fra].kind].traad;
      const bredde = e.antall ? 1.4 + Math.log10(e.antall + 1) * 1.6 : 1.8;

      const p = document.createElementNS(SVG, "path");
      p.setAttribute("d", d);
      p.setAttribute("stroke", farge);
      p.setAttribute("stroke-width", bredde.toFixed(2));
      p.classList.add("traad");
      if (e.type === "manuell") p.classList.add("manuell");
      if (e.quiet) p.classList.add("stille");
      g.appendChild(p);

      const hit = document.createElementNS(SVG, "path");
      hit.setAttribute("d", d);
      hit.classList.add("traad-treff");
      hit.addEventListener("mousemove", ev => visTips(ev, e));
      hit.addEventListener("mouseleave", skjulTips);
      g.appendChild(hit);

      const naler = [[x1, y1], [x2, y2]].map(([x, y]) => {
        const c = document.createElementNS(SVG, "circle");
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 3.2);
        c.setAttribute("fill", farge);
        c.classList.add("nal");
        nalG.appendChild(c);
        return c;
      });
      traadEls.push({ e, p, naler });
    }
    svg.appendChild(g);
    svg.appendChild(nalG);
  }

  function leggKabler() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const { e, p } of traadEls) {
      const len = Math.ceil(p.getTotalLength());
      p.style.setProperty("--len", len);
      p.style.setProperty("--delay", (Math.min(nodeById[e.fra].x, nodeById[e.til].x) / W * 1.3).toFixed(2) + "s");
    }
    svg.classList.add("tegn");
    setTimeout(() => svg.classList.remove("tegn"), 2800);
  }

  // Tips når musa er over en tråd
  const tips = document.createElement("div");
  tips.className = "tips";
  tips.hidden = true;
  document.body.appendChild(tips);
  function visTips(ev, e) {
    const a = nodeById[e.fra].label, b = nodeById[e.til].label;
    tips.innerHTML = "";
    const linje = document.createElement("div");
    linje.textContent = e.type === "manuell"
      ? `${a} til ${b}. ${e.forklaring}.`
      : `${a} til ${b}. ${e.antall} ${e.antall === 1 ? "formel" : "formler"}.`;
    tips.appendChild(linje);
    if (e.eks) {
      const c = document.createElement("code");
      c.textContent = `${e.eks.celle}: ${e.eks.formel}`;
      tips.appendChild(c);
    }
    tips.hidden = false;
    tips.style.left = Math.min(ev.clientX + 14, innerWidth - 330) + "px";
    tips.style.top = ev.clientY + 14 + "px";
  }
  function skjulTips() { tips.hidden = true; }

  // Skaler tavla til plassen som er ledig
  const sizer = document.createElement("div");
  sizer.style.position = "absolute";
  sizer.style.left = "0";
  sizer.style.top = "0";
  scene.appendChild(sizer);
  function tilpass() {
    const smal = innerWidth <= 760;
    const w = scene.clientWidth, h = scene.clientHeight;
    let s = Math.min(w / W, h / H);
    if (smal) s = Math.max(h / H, 0.42);
    const ox = smal ? 0 : Math.max(0, (w - W * s) / 2);
    const oy = smal ? 0 : Math.max(0, (h - H * s) / 2);
    tavle.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
    sizer.style.width = W * s + "px";
    sizer.style.height = H * s + "px";
  }

  // Velg en lapp
  function velg(id, fraHash = false) {
    if (!nodeById[id]) return;
    valgt = id;
    tavle.classList.add("fokus");
    const naboer = new Set();
    for (const { e, p, naler } of traadEls) {
      const inn = e.til === id, ut = e.fra === id;
      p.classList.toggle("inn", inn);
      p.classList.toggle("ut", ut);
      naler.forEach(c => c.classList.toggle("aktiv", inn || ut));
      if (inn) naboer.add(e.fra);
      if (ut) naboer.add(e.til);
    }
    for (const [nid, b] of Object.entries(el)) {
      b.classList.toggle("valgt", nid === id);
      b.classList.toggle("nabo", naboer.has(nid));
    }
    visPanel(nodeById[id]);
    if (!fraHash) history.replaceState(null, "", "#" + id);
  }

  function nullstill() {
    valgt = null;
    tavle.classList.remove("fokus");
    for (const b of Object.values(el)) b.classList.remove("valgt", "nabo");
    for (const { p, naler } of traadEls) {
      p.classList.remove("inn", "ut");
      naler.forEach(c => c.classList.remove("aktiv"));
    }
    panel.hidden = true;
    history.replaceState(null, "", location.pathname);
    tilpass();
  }

  // Tallformat
  const nb = (v, d = 0) => v.toLocaleString("nb-NO", { maximumFractionDigits: d });
  function format(c) {
    const v = c.verdi, navn = c.navn || "", enhet = c.enhet || "";
    if (v === null || v === undefined) return c.adresse.includes(":") ? "område" : "tom";
    if (typeof v !== "number") return String(v);
    if (/^grense_/.test(navn) || enhet.startsWith("andel") || navn === "realrente") return nb(v * 100, 1) + " %";
    if (/kr/.test(enhet) || /^(nv|netto|behov|ramme|leie|pakkepris|B_tilpasning|B_sesongleie|C_min)/.test(navn)) return nb(v) + " kr";
    return nb(v, 2);
  }

  function lagEl(tag, cls, tekst) {
    const x = document.createElement(tag);
    if (cls) x.className = cls;
    if (tekst !== undefined) x.textContent = tekst;
    return x;
  }

  function koblingsliste(liste, retning) {
    if (!liste.length) return lagEl("p", "tom", retning === "inn" ? "Ingenting. Dette er et startpunkt." : "Ingenting i arbeidsboka bygger videre på denne.");
    const ul = lagEl("ul", "koblinger");
    liste.sort((a, b) => (b.antall || 0) - (a.antall || 0));
    for (const e of liste) {
      const annen = nodeById[retning === "inn" ? e.fra : e.til];
      const li = document.createElement("li");
      const b = lagEl("button", "kobling");
      b.type = "button";
      const i = document.createElement("i");
      i.style.setProperty("--c", TYPER[annen.kind].farge === "transparent" ? "var(--gaffa)" : TYPER[annen.kind].farge);
      b.append(i, lagEl("span", "", annen.label), lagEl("small", "", e.antall ? `${e.antall} ${e.antall === 1 ? "formel" : "formler"}` : "for hånd"));
      b.addEventListener("click", () => velg(annen.id));
      li.appendChild(b);
      const eks = e.eks ? `${e.eks.celle}: ${e.eks.formel}` : e.forklaring;
      if (eks) li.appendChild(lagEl("p", "eks", eks));
      ul.appendChild(li);
    }
    return ul;
  }

  function visPanel(n) {
    const t = TYPER[n.kind];
    innhold.innerHTML = "";

    const typ = lagEl("p", "p-type");
    const flik = document.createElement("i");
    flik.style.setProperty("--c", t.farge === "transparent" ? "var(--gaffa)" : t.farge);
    typ.append(flik, document.createTextNode(t.ord));
    innhold.append(typ, lagEl("h2", "p-tittel", n.label), lagEl("p", "p-desc", n.desc));

    if (n.ark) {
      const m = lagEl("p", "p-meta");
      m.innerHTML = `Arket <b></b>, ${n.omfang}, ${n.formler} formler`;
      m.querySelector("b").textContent = n.ark;
      innhold.appendChild(m);
    }

    const inn = G.edges.filter(e => e.til === n.id);
    const ut = G.edges.filter(e => e.fra === n.id);
    innhold.append(lagEl("h3", "p-h", "Bygger på"), koblingsliste(inn, "inn"));
    innhold.append(lagEl("h3", "p-h", "Påvirker"), koblingsliste(ut, "ut"));
    if (n.celler) {
      const h = lagEl("h3", "p-h", "Cellene ");
      h.appendChild(lagEl("small", "", `(${G.scenario}, slik boka er lagret)`));
      const tab = lagEl("table", "celler");
      for (const c of n.celler) {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.append(document.createTextNode(c.etikett || c.navn || c.adresse));
        td1.appendChild(lagEl("span", "navn", [c.navn, c.adresse].filter(Boolean).join(", ")));
        if (c.formel) td1.appendChild(lagEl("span", "formel", c.formel));
        tr.append(td1, lagEl("td", "", format(c)));
        tab.appendChild(tr);
      }
      innhold.append(h, tab);
    }

    innhold.appendChild(lagEl("p", "p-fot", `Hentet fra ${G.kilde}, lest ${G.lest.split("-").reverse().join(".")}.`));

    const varSkjult = panel.hidden;
    panel.hidden = false;
    panel.scrollTop = 0;
    if (varSkjult) tilpass();
  }

  document.getElementById("lukk").addEventListener("click", nullstill);
  scene.addEventListener("click", e => { if (valgt && !e.target.closest(".lapp")) nullstill(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && valgt) nullstill(); });
  addEventListener("resize", tilpass);

  const start = () => {
    tegnTrader();
    tilpass();
    const id = decodeURIComponent(location.hash.slice(1));
    if (nodeById[id]) velg(id, true); else leggKabler();
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
})();
