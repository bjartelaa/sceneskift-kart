(() => {
  const G = window.GRAPH;
  const W = 1800, H = 940;
  const SVG = "http://www.w3.org/2000/svg";

  const TYPER = {
    data:       { farge: "var(--blaa)",    traad: "#2e6bd9", ord: "Data" },
    input:      { farge: "var(--gul)",     traad: "#d29c00", ord: "Forutsetninger" },
    ark:        { farge: "var(--gaffa)",   traad: "#3a4152", ord: "Ark i arbeidsboka", ingenFlik: true },
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

  // Liten, fast skjevhet per lapp, så tavla ser opphengt ut uten å endre seg for hver lasting
  const skjevhet = id => {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return ((Math.abs(h) % 29) - 14) / 10;
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
    if (!t.ingenFlik) b.style.setProperty("--c", t.farge);
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
    const under = document.createElementNS(SVG, "g");
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
      const bredde = e.antall ? 1.5 + Math.log10(e.antall + 1) * 1.7 : 2;

      const glod = document.createElementNS(SVG, "path");
      glod.setAttribute("d", d);
      glod.setAttribute("stroke-width", (bredde + 9).toFixed(1));
      glod.classList.add("traad-vei");
      under.appendChild(glod);

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
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 3.4);
        c.setAttribute("fill", farge);
        c.classList.add("nal");
        nalG.appendChild(c);
        return c;
      });
      traadEls.push({ e, p, glod, naler });
    }
    svg.append(under, g, nalG);
  }

  function leggKabler() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const { e, p } of traadEls) {
      p.style.setProperty("--len", Math.ceil(p.getTotalLength()));
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
    tips.textContent = e.type === "manuell"
      ? `${a} til ${b}. ${e.forklaring}.`
      : `${a} til ${b}: ${e.antall} ${e.antall === 1 ? "formel" : "formler"}.`;
    if (e.eks) tips.appendChild(lagEl("code", "", `${e.eks.celle}: ${e.eks.formel}`));
    tips.hidden = false;
    tips.style.left = Math.min(ev.clientX + 14, innerWidth - 350) + "px";
    tips.style.top = ev.clientY + 14 + "px";
  }
  function skjulTips() { tips.hidden = true; }

  // Veien til rådet: korteste vei langs trådene, helst uten de dempede
  const ut = {};
  for (const e of G.edges) (ut[e.fra] ||= []).push(e);
  function kortesteVei(fra, til) {
    for (const medStille of [false, true]) {
      const forrige = { [fra]: null };
      const ko = [fra];
      while (ko.length) {
        const n = ko.shift();
        if (n === til) {
          const vei = [];
          for (let x = til; x !== null; x = forrige[x]) vei.unshift(x);
          return vei;
        }
        for (const e of ut[n] || []) {
          if ((e.quiet && !medStille) || e.til in forrige) continue;
          forrige[e.til] = n;
          ko.push(e.til);
        }
      }
    }
    return null;
  }
  // Rådet bygger på nåverdi og behov, så veien går via Nåverdi når den kan, ikke snarveier med få formler
  function veiFor(id) {
    const fra = id === "rad" ? "raa_ordrer" : id;
    const tilNv = fra !== "nv" && kortesteVei(fra, "nv");
    const videre = kortesteVei("nv", "rad");
    if (tilNv && videre) return [...tilNv, ...videre.slice(1)];
    return kortesteVei(fra, "rad");
  }

  // Skaler tavla. Uten valg vises hele tavla; med valg zoomer den inn på lappen og naboene.
  const sizer = document.createElement("div");
  sizer.className = "sizer";
  scene.prepend(sizer);
  function boks(ids) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const id of ids) {
      const n = nodeById[id], w = el[id].offsetWidth / 2 + 20, h = el[id].offsetHeight / 2 + 20;
      x1 = Math.min(x1, n.x - w); x2 = Math.max(x2, n.x + w);
      y1 = Math.min(y1, n.y - h); y2 = Math.max(y2, n.y + h);
    }
    return [x1, y1, x2, y2];
  }
  function tilpass(fokusIds) {
    const smal = innerWidth <= 760;
    const w = scene.clientWidth, h = scene.clientHeight;
    const hele = Math.min(w / W, h / H);
    let s, ox, oy;
    if (smal) {
      s = Math.max(h / H, 0.42); ox = 0; oy = 0;
    } else if (fokusIds && fokusIds.length) {
      const [x1, y1, x2, y2] = boks(fokusIds);
      const pad = 50;
      s = Math.max(hele, Math.min((w - pad * 2) / (x2 - x1), (h - pad * 2) / (y2 - y1), 1.2));
      ox = w / 2 - ((x1 + x2) / 2) * s;
      oy = h / 2 - ((y1 + y2) / 2) * s;
      ox = Math.min(0 + pad, Math.max(w - W * s - pad, ox));
      oy = Math.min(0 + pad, Math.max(h - H * s - pad, oy));
      if (W * s < w) ox = (w - W * s) / 2;
      if (H * s < h) oy = (h - H * s) / 2;
    } else {
      s = hele; ox = (w - W * s) / 2; oy = (h - H * s) / 2;
    }
    tavle.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
    sizer.style.width = W * s + "px";
    sizer.style.height = H * s + "px";
  }
  let fokusIds = null;

  // Velg en lapp
  function velg(id, fraHash = false) {
    if (!nodeById[id]) return;
    valgt = id;
    tavle.classList.add("fokus");
    const naboer = new Set();
    const vei = veiFor(id) || [];
    const veiPar = new Set(vei.slice(1).map((v, i) => vei[i] + ">" + v));
    for (const { e, p, glod, naler } of traadEls) {
      const inn = e.til === id, ut = e.fra === id, paaVei = veiPar.has(e.fra + ">" + e.til);
      p.classList.toggle("inn", inn);
      p.classList.toggle("ut", ut);
      p.classList.toggle("vei", paaVei);
      glod.classList.toggle("vei", paaVei);
      naler.forEach(c => c.classList.toggle("aktiv", inn || ut || paaVei));
      if (inn) naboer.add(e.fra);
      if (ut) naboer.add(e.til);
    }
    for (const [nid, b] of Object.entries(el)) {
      b.classList.toggle("valgt", nid === id);
      b.classList.toggle("nabo", naboer.has(nid));
      b.classList.toggle("paa-vei", vei.includes(nid));
    }
    visPanel(nodeById[id], vei);
    fokusIds = [id, ...naboer];
    tilpass(fokusIds);
    if (!fraHash) history.replaceState(null, "", "#" + id);
  }

  function nullstill() {
    valgt = null;
    fokusIds = null;
    tavle.classList.remove("fokus");
    for (const b of Object.values(el)) b.classList.remove("valgt", "nabo", "paa-vei");
    for (const { p, glod, naler } of traadEls) {
      p.classList.remove("inn", "ut", "vei");
      glod.classList.remove("vei");
      naler.forEach(c => c.classList.remove("aktiv"));
    }
    panel.hidden = true;
    history.replaceState(null, "", location.pathname);
    tilpass();
  }

  // Tallformat
  const nb = (v, d = 0) => v.toLocaleString("nb-NO", { maximumFractionDigits: d }).replace("\u2212", "-");
  const kr = v => nb(v) + " kr";
  const endring = v => (v > 0 ? "+" : v < 0 ? "−" : "") + nb(Math.abs(v));
  function format(c) {
    const v = c.verdi, navn = c.navn || "", enhet = c.enhet || "";
    if (v === null || v === undefined) return c.adresse.includes(":") ? "område" : "tom";
    if (typeof v !== "number") return String(v);
    if (/^grense_/.test(navn) || enhet.startsWith("andel") || navn === "realrente") return nb(v * 100, 1) + " %";
    if (/kr/.test(enhet) || /^(nv|netto|behov|ramme|leie|pakkepris|B_tilpasning|B_sesongleie|C_min)/.test(navn)) return kr(v);
    return nb(v, 2);
  }
  const ramme = (() => {
    const c = nodeById.finans && nodeById.finans.celler.find(c => c.navn === "ramme");
    return c ? c.verdi : null;
  })();

  function lagEl(tag, cls, tekst) {
    const x = document.createElement(tag);
    if (cls) x.className = cls;
    // Hardt mellomrom i tall som «66 000», så de ikke deles over to linjer
    if (tekst !== undefined) x.textContent = String(tekst).replace(/(\d) (?=\d{3}\b)/g, "$1\u00a0");
    return x;
  }
  function flik(kind) {
    const i = document.createElement("i");
    i.style.setProperty("--c", TYPER[kind].farge);
    return i;
  }
  function seksjon(tittel, hjelp) {
    const s = lagEl("section", "seksjon");
    s.appendChild(lagEl("h3", "p-h", tittel));
    if (hjelp) s.appendChild(lagEl("p", "p-hjelp", hjelp));
    return s;
  }

  function veiSeksjon(n, vei) {
    if (!vei || vei.length < 2) return null;
    const s = seksjon(n.id === "rad" ? "Veien fra dataene til rådet" : "Veien til rådet",
      "Korteste vei langs trådene. Følg et tall herfra og helt fram.");
    const ol = lagEl("ol", "vei");
    vei.forEach((id, i) => {
      const m = nodeById[id];
      const li = document.createElement("li");
      const b = lagEl("button", "steg" + (id === n.id ? " her" : ""));
      b.type = "button";
      b.append(lagEl("b", "", String(i + 1)), lagEl("span", "", m.label), lagEl("small", "", TYPER[m.kind].ord));
      if (id !== n.id) b.addEventListener("click", () => velg(id));
      li.appendChild(b);
      ol.appendChild(li);
    });
    s.appendChild(ol);
    return s;
  }

  function folsomhetSeksjon(n) {
    if (!n.folsomhet) return null;
    const s = seksjon("Hvis du endrer en forutsetning 5 %",
      `Endring fra ${G.scenario.toLowerCase()}scenariet, hentet fra følsomhetstabellen i Usikkerhet.`);
    for (const [key, tittel, godtOpp] of [["nv", "Nåverdi", true], ["behov", "Finansieringsbehov", false]]) {
      const tab = lagEl("table", "tabell");
      const hode = document.createElement("tr");
      hode.append(lagEl("th", "", tittel), lagEl("th", "", "A"), lagEl("th", "", "B"), lagEl("th", "", "C"));
      tab.appendChild(hode);
      for (const f of n.folsomhet) {
        const tr = lagEl("tr", "rad-tittel");
        const td = lagEl("td", "", f.forutsetning);
        td.colSpan = 4;
        tr.appendChild(td);
        tab.appendChild(tr);
        [["5 % ned", 0], ["5 % opp", 1]].forEach(([lab, i]) => {
          const r = document.createElement("tr");
          r.appendChild(lagEl("td", "", lab));
          for (const a of ["A", "B", "C"]) {
            const v = f[key][a][i];
            const bra = godtOpp ? v > 0 : v < 0;
            r.appendChild(lagEl("td", v === 0 ? "" : bra ? "pluss" : "minus", endring(v)));
          }
          tab.appendChild(r);
        });
      }
      s.appendChild(tab);
    }
    s.appendChild(lagEl("p", "p-hjelp", "Grønt er bedre for Sceneskift, rødt er verre. Høyere behov er verre."));
    return s;
  }

  function scenarioSeksjon(n) {
    if (!n.scenarioer) return null;
    const erBehov = n.id === "behov";
    const s = seksjon("Alle scenarioer", erBehov && ramme
      ? `Rødt betyr over rammen på ${kr(ramme)}. Fra konsekvenstabellen i Usikkerhet.`
      : "Rødt betyr negativ nåverdi. Fra konsekvenstabellen i Usikkerhet.");
    const tab = lagEl("table", "tabell");
    const hode = document.createElement("tr");
    hode.appendChild(lagEl("th", "", ""));
    for (const navn of n.scenarioer.scenarioer) hode.appendChild(lagEl("th", "", navn));
    tab.appendChild(hode);
    for (const r of n.scenarioer.rader) {
      const tr = document.createElement("tr");
      tr.appendChild(lagEl("td", "", r.handling === "avstå" ? "Avstå" : r.handling));
      for (const v of r.verdier) {
        const ille = erBehov ? (ramme && v > ramme) : v < 0;
        tr.appendChild(lagEl("td", ille ? "minus" : "", nb(v)));
      }
      tab.appendChild(tr);
    }
    s.appendChild(tab);
    return s;
  }

  function koblingsSeksjon(tittel, liste, retning) {
    const s = seksjon(tittel);
    if (!liste.length) {
      s.appendChild(lagEl("p", "tom", retning === "inn" ? "Ingenting. Dette er et startpunkt." : "Ingenting i arbeidsboka bygger videre på denne."));
      return s;
    }
    liste.sort((a, b) => (b.antall || 0) - (a.antall || 0));
    const ul = lagEl("ul", "koblinger");
    for (const e of liste) {
      const annen = nodeById[retning === "inn" ? e.fra : e.til];
      const li = document.createElement("li");
      const b = lagEl("button", "kobling");
      b.type = "button";
      b.append(flik(annen.kind), lagEl("span", "", annen.label),
        lagEl("small", "", e.antall ? `${e.antall} ${e.antall === 1 ? "formel" : "formler"}` : "Power Query / notat"));
      b.addEventListener("click", () => velg(annen.id));
      li.appendChild(b);
      ul.appendChild(li);
    }
    s.appendChild(ul);
    const eks = liste.filter(e => e.eks || e.forklaring);
    if (eks.length) {
      const d = document.createElement("details");
      d.appendChild(lagEl("summary", "celle-sum", "")).appendChild(lagEl("span", "", "Se eksempelformler"));
      for (const e of eks) {
        const annen = nodeById[retning === "inn" ? e.fra : e.til];
        const p = lagEl("p", "eks", annen.label + ": ");
        p.appendChild(lagEl("code", "", e.eks ? `${e.eks.celle}  ${e.eks.formel}` : e.forklaring));
        d.appendChild(p);
      }
      s.appendChild(d);
    }
    return s;
  }

  function cellerSeksjon(n) {
    if (!n.celler) return null;
    const s = seksjon("Cellene", `Verdier i ${G.scenario.toLowerCase()}scenariet, slik boka er lagret. Trykk for navn og formel.`);
    for (const c of n.celler) {
      const d = document.createElement("details");
      const sum = lagEl("summary", "celle-sum");
      sum.append(lagEl("span", "", c.etikett || c.navn || c.adresse), lagEl("strong", "", format(c)));
      d.appendChild(sum);
      const p = lagEl("p", "celle-detalj", [c.navn, c.adresse].filter(Boolean).join(", "));
      if (c.formel) {
        p.appendChild(document.createElement("br"));
        p.appendChild(lagEl("code", "", c.formel));
      }
      d.appendChild(p);
      s.appendChild(d);
    }
    return s;
  }

  function sporsmalSeksjon(n) {
    if (!n.sporsmal) return null;
    const s = seksjon("Øv til muntlig");
    const boks = lagEl("div", "ovelse");
    boks.appendChild(lagEl("p", "", n.sporsmal[0]));
    const d = document.createElement("details");
    d.appendChild(lagEl("summary", "", "Vis forslag til svar"));
    d.appendChild(lagEl("p", "", n.sporsmal[1]));
    boks.appendChild(d);
    s.appendChild(boks);
    return s;
  }

  function visPanel(n, vei) {
    const t = TYPER[n.kind];
    innhold.innerHTML = "";
    const typ = lagEl("p", "p-type");
    typ.append(flik(n.kind), document.createTextNode(t.ord));
    innhold.append(typ, lagEl("h2", "p-tittel", n.label), lagEl("p", "p-desc", n.desc));
    if (n.ark) innhold.appendChild(lagEl("p", "p-meta", `Arket ${n.ark}, ${n.formler} formler`));

    if (n.slik) {
      const s = seksjon("Slik regnes det");
      const ol = lagEl("ol", "slik");
      for (const steg of n.slik) ol.appendChild(lagEl("li", "", steg));
      s.appendChild(ol);
      innhold.appendChild(s);
    }
    for (const s of [
      veiSeksjon(n, vei),
      folsomhetSeksjon(n),
      scenarioSeksjon(n),
      koblingsSeksjon("Bygger på", G.edges.filter(e => e.til === n.id), "inn"),
      koblingsSeksjon("Påvirker", G.edges.filter(e => e.fra === n.id), "ut"),
      cellerSeksjon(n),
      sporsmalSeksjon(n),
    ]) if (s) innhold.appendChild(s);
    innhold.appendChild(lagEl("p", "p-fot", `Hentet fra ${G.kilde}, lest ${G.lest.split("-").reverse().join(".")}.`));

    panel.hidden = false;
    panel.scrollTop = 0;
  }

  document.getElementById("lukk").addEventListener("click", nullstill);
  scene.addEventListener("click", e => { if (valgt && !e.target.closest(".lapp")) nullstill(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && valgt) nullstill(); });
  addEventListener("resize", () => tilpass(fokusIds));
  // Inne i presentasjonen: send blatastene videre så piltastene virker selv om tavla har fokus
  if (window.parent !== window) {
    addEventListener("keydown", e => {
      if (["ArrowRight", "ArrowLeft", "PageDown", "PageUp"].includes(e.key)) window.parent.postMessage({ tast: e.key }, "*");
    });
  }

  // Turmodus: presentasjonen styrer hvilke lapper som er i fokus (tavla.html?tur)
  const turModus = new URLSearchParams(location.search).has("tur");
  if (turModus) document.body.classList.add("tur-modus");
  let klar = false, ventende;
  function turFokus(st) {
    if (!klar) { ventende = st; return; }
    valgt = null;
    panel.hidden = true;
    for (const b of Object.values(el)) b.classList.remove("valgt", "nabo", "paa-vei", "tur-fokus");
    for (const { p, glod, naler } of traadEls) {
      p.classList.remove("inn", "ut", "vei");
      glod.classList.remove("vei");
      naler.forEach(c => c.classList.remove("aktiv"));
    }
    if (!st) { tavle.classList.remove("fokus"); fokusIds = null; tilpass(); return; }
    tavle.classList.add("fokus");
    let fokus = st.fokus || [];
    const hoved = new Set(st.hoved || []);
    let veiPar = new Set();
    if (st.vei) {
      const v = veiFor("rad");
      fokus = v;
      veiPar = new Set(v.slice(1).map((x, i) => v[i] + ">" + x));
    }
    const f = new Set(fokus);
    for (const { e, p, glod, naler } of traadEls) {
      const sterk = veiPar.has(e.fra + ">" + e.til) || (hoved.has(e.til) && f.has(e.fra));
      const svak = !sterk && f.has(e.fra) && f.has(e.til);
      p.classList.toggle("vei", sterk);
      glod.classList.toggle("vei", sterk);
      p.classList.toggle("inn", svak);
      naler.forEach(c => c.classList.toggle("aktiv", sterk || svak));
    }
    for (const [id, b] of Object.entries(el)) {
      b.classList.toggle("tur-fokus", f.has(id));
      b.classList.toggle("valgt", hoved.has(id));
    }
    fokusIds = st.vei ? null : fokus;
    tilpass(fokusIds);
  }
  addEventListener("message", e => { if (e.data && "tur" in e.data) turFokus(e.data.tur); });

  const start = () => {
    tegnTrader();
    tilpass();
    klar = true;
    if (turModus) { turFokus(ventende || null); if (!ventende) leggKabler(); return; }
    const id = decodeURIComponent(location.hash.slice(1));
    if (nodeById[id]) velg(id, true); else leggKabler();
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
})();
