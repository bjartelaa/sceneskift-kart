(() => {
  const G = window.GRAPH;
  const W = 1600, H = 900;
  const SVG = "http://www.w3.org/2000/svg";
  const node = id => G.nodes.find(n => n.id === id);
  const celle = (id, navn) => (node(id).celler || []).find(c => c.navn === navn || c.adresse.endsWith("!" + navn));
  const verdi = (id, navn) => celle(id, navn).verdi;

  const nb = v => Math.round(v).toLocaleString("nb-NO").replace("\u2212", "-");
  const kr = v => nb(v) + " kr";
  const pst = v => (v * 100).toLocaleString("nb-NO", { maximumFractionDigits: 0 }) + " %";
  const navn = { A: "A: Lune Sal", B: "B: Søyleverket", C: "C: Skarvkaien", "avstå": "Avstå" };

  const lerret = document.getElementById("lerret");
  const bilder = [...document.querySelectorAll(".lysbilde")];
  const ramme = verdi("finans", "ramme");

  function lag(tag, attrs = {}, tekst) {
    const e = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  }
  function html(tag, cls, tekst) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  }
  function knapperad(holder, etiketter, vedKlikk) {
    return etiketter.map((t, i) => {
      const b = html("button", "", t);
      b.type = "button";
      b.addEventListener("click", () => vedKlikk(i));
      holder.appendChild(b);
      return b;
    });
  }
  const trykk = (knapper, i) => knapper.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));

  // Tall som står i teksten
  const tall = { ramme: kr(ramme), grunnlag: verdi("grunnlag", "grunnlag_2026"), regel1: verdi("resultater", "J26") };
  for (const e of document.querySelectorAll("[data-tall]")) e.textContent = tall[e.dataset.tall];

  // Beslutningen: avtalekortene
  const kort = [
    { navn: navn.A, bilde: "img/sal-a.jpg", rot: -1.2, linjer: [[`${verdi("avtale_a", "plasser_A")}`, "salgbare plasser"], [kr(verdi("avtale_a", "leie_A")), "i leie per konsert"]] },
    { navn: navn.B, bilde: "img/sal-b.jpg", rot: .8, linjer: [[`${verdi("avtale_b", "plasser_B")}`, "salgbare plasser"], [kr(verdi("avtale_b", "B_sesongleie") + verdi("avtale_b", "B_tilpasning")), "fast for sesongen, mye før start"]] },
    { navn: navn.C, bilde: "img/sal-c.jpg", rot: -.6, linjer: [[`${verdi("avtale_c", "plasser_C")}`, "salgbare plasser"], [pst(verdi("avtale_c", "C_andel")), `av billettoppgjøret, minst ${kr(verdi("avtale_c", "C_min"))} per konsert`]] },
    { navn: navn["avstå"], avsta: true, rot: 1.1, linjer: [["0 kr", "ingen betalinger, ingen risiko"]] },
  ];
  const kortRad = document.getElementById("avtalekort");
  for (const k of kort) {
    const d = html("div", "kort" + (k.avsta ? " avsta" : ""));
    d.style.setProperty("--rot", k.rot + "deg");
    const ul = html("ul");
    for (const [stor, tekst] of k.linjer) {
      const li = html("li");
      li.append(html("span", "stor", stor), document.createTextNode(tekst));
      ul.appendChild(li);
    }
    if (k.bilde) {
      const img = html("img", "kort-bilde");
      img.src = k.bilde;
      img.alt = "Salen i " + k.navn.slice(3);
      d.appendChild(img);
    }
    d.append(html("h3", "", k.navn), ul);
    kortRad.appendChild(d);
  }

  // Resultatene: nåverdi mot finansieringsbehov
  const nvTab = node("nv").scenarioer, bhTab = node("behov").scenarioer;
  const scenarioer = nvTab.scenarioer;
  const handlinger = nvTab.rader.map((r, i) => ({ id: r.handling, nv: r.verdier, behov: bhTab.rader[i].verdier }));
  {
    const svg = document.getElementById("spredning");
    const P = { x1: 110, x2: 870, y1: 60, y2: 530 };
    const xmax = Math.ceil(Math.max(...handlinger.flatMap(h => h.behov), ramme) / 100000) * 100000 + 50000;
    const ymin = Math.floor(Math.min(...handlinger.flatMap(h => h.nv)) / 100000) * 100000;
    const ymax = Math.ceil(Math.max(...handlinger.flatMap(h => h.nv)) / 100000) * 100000;
    const sx = v => P.x1 + (v / xmax) * (P.x2 - P.x1);
    const sy = v => P.y2 - ((v - ymin) / (ymax - ymin)) * (P.y2 - P.y1);
    svg.appendChild(lag("rect", { class: "ille", x: sx(ramme), y: P.y1, width: P.x2 - sx(ramme), height: P.y2 - P.y1 }));
    for (let v = 0; v <= xmax; v += 100000) {
      svg.appendChild(lag("line", { class: "rutenett", x1: sx(v), x2: sx(v), y1: P.y1, y2: P.y2 }));
      svg.appendChild(lag("text", { class: "etikett", x: sx(v), y: P.y2 + 30, "text-anchor": "middle" }, nb(v)));
    }
    for (let v = ymin; v <= ymax; v += 100000) {
      svg.appendChild(lag("line", { class: v === 0 ? "akse" : "rutenett", x1: P.x1, x2: P.x2, y1: sy(v), y2: sy(v) }));
      svg.appendChild(lag("text", { class: "etikett", x: P.x1 - 14, y: sy(v) + 6, "text-anchor": "end" }, nb(v)));
    }
    svg.appendChild(lag("line", { class: "rammestrek", x1: sx(ramme), x2: sx(ramme), y1: P.y1, y2: P.y2 }));
    svg.appendChild(lag("text", { class: "etikett", x: sx(ramme) + 12, y: P.y1 + 24, style: "fill: var(--minus)" }, `Rammen, ${kr(ramme)}`));
    svg.appendChild(lag("text", { class: "tittel-akse", x: (P.x1 + P.x2) / 2, y: P.y2 + 68, "text-anchor": "middle" }, "Finansieringsbehov, kr"));
    svg.appendChild(lag("text", { class: "tittel-akse", x: P.x1, y: P.y1 - 30, "text-anchor": "middle" }, "Nåverdi, kr"));
    const punkter = handlinger.map(h => {
      const g = lag("g", { class: "punkt", tabindex: 0, role: "button", "aria-label": navn[h.id] });
      g.append(lag("circle", { class: "treff", r: 28 }), lag("circle", { r: 11, cx: 0, cy: 0 }), lag("text", { class: "merke", x: 18, y: -12 }, h.id === "avstå" ? "Avstå" : h.id));
      svg.appendChild(g);
      return { h, g };
    });
    // Tallene for en prikk: vises når man holder over, og blir stående når man trykker
    const tips = lag("g", { class: "tips" });
    const tipsBoks = lag("rect", { width: 290, height: 128 });
    const tipsLinjer = [lag("text", { class: "tips-navn", x: 18, y: 34 }), lag("text", { x: 18, y: 66 }), lag("text", { x: 18, y: 92 }), lag("text", { class: "tips-status", x: 18, y: 116 })];
    tips.append(tipsBoks, ...tipsLinjer);
    svg.appendChild(tips);
    let scenarioNr = 0, tipsFor = null, festet = null;
    function visTips(p) {
      tipsFor = p;
      if (!p) { tips.classList.remove("synlig"); return; }
      const i = scenarioNr, { h } = p;
      const x = sx(h.behov[i]), y = sy(h.nv[i]);
      const over = h.behov[i] - ramme;
      tipsLinjer[0].textContent = navn[h.id];
      tipsLinjer[1].textContent = `Nåverdi ${kr(h.nv[i])}`;
      tipsLinjer[2].textContent = `Behov ${kr(h.behov[i])}`;
      tipsLinjer[3].textContent = h.id === "avstå" ? "Ingen betalinger" : over > 0 ? `${kr(over)} over rammen` : "Holder rammen";
      tipsLinjer[3].classList.toggle("over", over > 0);
      const tx = x + 24 + 290 > P.x2 + 30 ? x - 24 - 290 : x + 24;
      // Over prikken så merket synes, under hvis det ikke er plass
      const ty = y - 150 >= P.y1 - 40 ? y - 150 : Math.min(P.y2 - 128, y + 30);
      tips.style.transform = `translate(${tx}px, ${ty}px)`;
      tips.classList.add("synlig");
    }
    for (const p of punkter) {
      p.g.addEventListener("mouseenter", () => visTips(p));
      p.g.addEventListener("mouseleave", () => visTips(festet));
      p.g.addEventListener("focus", () => visTips(p));
      p.g.addEventListener("blur", () => visTips(festet));
      p.g.addEventListener("click", e => { e.stopPropagation(); festet = festet === p ? null : p; visTips(festet || p); });
    }
    svg.addEventListener("click", () => { festet = null; visTips(null); });
    const oppsummering = document.getElementById("oppsummering");
    const knapper = knapperad(document.getElementById("scenariovelger"), scenarioer, vis);
    function vis(i) {
      trykk(knapper, i);
      scenarioNr = i;
      if (tipsFor) visTips(tipsFor);
      for (const { h, g } of punkter) {
        g.style.transform = `translate(${sx(h.behov[i])}px, ${sy(h.nv[i])}px)`;
        g.classList.toggle("over", h.behov[i] > ramme);
      }
      oppsummering.textContent = oppsummer(scenarioer[i], handlinger.filter(h => h.id !== "avstå").map(h => ({ id: h.id, nv: h.nv[i], behov: h.behov[i] })));
    }
    vis(0);
  }

  function oppsummer(tittel, avtaler) {
    const best = avtaler.reduce((a, b) => (b.nv > a.nv ? b : a));
    const innenfor = avtaler.filter(h => h.behov <= ramme && h.nv > 0);
    const bestInnenfor = innenfor.length ? innenfor.reduce((a, b) => (b.nv > a.nv ? b : a)) : null;
    let t = `${tittel}: ${best.id} har høyest nåverdi, ${kr(best.nv)}`;
    t += best.behov > ramme ? `, men trenger ${kr(best.behov)}. ` : ". ";
    t += bestInnenfor
      ? (bestInnenfor === best ? `${best.id} holder også rammen.` : `${bestInnenfor.id} er best av avtalene som holder rammen og gir pluss.`)
      : "Ingen avtale holder rammen og gir pluss. Da er avstå best.";
    if (tittel === "Høy etterspørsel") t += " Oppsiden er bare til informasjon og inngår ikke i rådet.";
    return t;
  }

  // Usikkerheten: rutenettet etterspørsel × pakkepris fra datatabellene
  {
    const R = G.rutenett;
    const svg = document.getElementById("usikker");
    const iSalg = v => R.salg.findIndex(s => Math.abs(s - v) < 1e-9);
    const iPakke = v => R.pakker.indexOf(v);
    const pakkeBasis = verdi("pakke", "pakkepris");
    const scen = [
      ["Basis", iSalg(1), iPakke(pakkeBasis)],
      ["Lav etterspørsel", iSalg(0.8), iPakke(pakkeBasis)],
      ["Høyere pakkepris", iSalg(1), iPakke(66000)],
      ["Samlet", iSalg(0.8), iPakke(66000)],
    ];
    const nvMaks = Math.max(...["A", "B", "C"].flatMap(a => R.avtaler[a].nv.flat().map(Math.abs)));
    const bhMaks = Math.max(ramme, ...["A", "B", "C"].flatMap(a => R.avtaler[a].behov.flat()));
    // To paneler: nåverdi (sentrert om 0) og behov (fra 0, med rammen)
    const NV = { x1: 40, x2: 440 }, BH = { x1: 520, x2: 920 };
    const nx = v => (NV.x1 + NV.x2) / 2 + (v / nvMaks) * (NV.x2 - NV.x1) / 2;
    const bx = v => BH.x1 + (v / bhMaks) * (BH.x2 - BH.x1);
    const radY = a => ({ A: 130, B: 280, C: 430 })[a];
    svg.appendChild(lag("text", { class: "panel-tittel", x: NV.x1, y: 40 }, "Nåverdi"));
    svg.appendChild(lag("text", { class: "panel-tittel", x: BH.x1, y: 40 }, "Finansieringsbehov"));
    svg.appendChild(lag("line", { class: "akse", x1: nx(0), x2: nx(0), y1: 70, y2: 500 }));
    svg.appendChild(lag("line", { class: "akse", x1: bx(0), x2: bx(0), y1: 70, y2: 500 }));
    svg.appendChild(lag("rect", { class: "ille", x: bx(ramme), y: 70, width: BH.x2 - bx(ramme), height: 430 }));
    svg.appendChild(lag("line", { class: "rammestrek", x1: bx(ramme), x2: bx(ramme), y1: 70, y2: 500 }));
    svg.appendChild(lag("text", { class: "etikett", x: bx(ramme), y: 528, "text-anchor": "middle", style: "fill: var(--minus)" }, `Rammen, ${kr(ramme)}`));
    const deler = {};
    for (const a of ["A", "B", "C"]) {
      const y = radY(a);
      svg.appendChild(lag("text", { class: "merke-liten", x: NV.x1, y: y - 34 }, navn[a]));
      const nvSoyle = lag("rect", { class: "soyle", y: y - 16, height: 32 });
      const bhSoyle = lag("rect", { class: "soyle", y: y - 16, height: 32, x: bx(0) });
      const nvTekst = lag("text", { class: "verdi", y: y + 7 });
      const bhTekst = lag("text", { class: "verdi", y: y + 7 });
      svg.append(nvSoyle, bhSoyle, nvTekst, bhTekst);
      deler[a] = { nvSoyle, bhSoyle, nvTekst, bhTekst };
    }
    let si = scen[0][1], pi = scen[0][2];
    const tekst = document.getElementById("usikker-tekst");
    const sKnapper = knapperad(document.getElementById("usikker-scenario"), scen.map(s => s[0]), i => { si = scen[i][1]; pi = scen[i][2]; vis(); });
    const salgKnapper = knapperad(document.getElementById("usikker-salg"), R.salg.map(pst), i => { si = i; vis(); });
    const pakkeKnapper = knapperad(document.getElementById("usikker-pakke"), R.pakker.map(p => nb(p / 1000) + " 000"), i => { pi = i; vis(); });
    function vis() {
      trykk(salgKnapper, si);
      trykk(pakkeKnapper, pi);
      trykk(sKnapper, scen.findIndex(s => s[1] === si && s[2] === pi));
      const rad = [];
      for (const a of ["A", "B", "C"]) {
        const nv = R.avtaler[a].nv[si][pi], bh = R.avtaler[a].behov[si][pi];
        const d = deler[a];
        d.nvSoyle.setAttribute("x", Math.min(nx(0), nx(nv)));
        d.nvSoyle.setAttribute("width", Math.abs(nx(nv) - nx(0)));
        d.nvSoyle.setAttribute("class", "soyle " + (nv >= 0 ? "pluss" : "minus"));
        d.nvTekst.textContent = nb(nv);
        d.nvTekst.setAttribute("x", nv >= 0 ? nx(0) - 10 : nx(0) + 10);
        d.nvTekst.setAttribute("text-anchor", nv >= 0 ? "end" : "start");
        d.bhSoyle.setAttribute("width", bx(bh) - bx(0));
        d.bhSoyle.setAttribute("class", "soyle " + (bh > ramme ? "over" : "under"));
        d.bhTekst.textContent = nb(bh);
        // Tallet står inne i søylen, så det ikke krysser rammestreken
        d.bhTekst.setAttribute("x", bx(bh) - 10);
        d.bhTekst.setAttribute("text-anchor", "end");
        d.bhTekst.setAttribute("class", "verdi inni");
        rad.push({ id: a, nv, behov: bh });
      }
      tekst.textContent = oppsummer(`${pst(R.salg[si])} salg, pakke ${kr(R.pakker[pi])}`, rad);
      // Anbefalingen: høyest nåverdi blant avtalene som holder rammen og gir pluss, ellers avstå
      const innenfor = rad.filter(h => h.behov <= ramme && h.nv > 0);
      const valg = innenfor.length ? innenfor.reduce((a, b) => (b.nv > a.nv ? b : a)).id : null;
      anbefaling.textContent = valg ? `Velg ${navn[valg]}` : "Avstå";
    }
    const anbefaling = document.getElementById("usikker-anbefaling");
    vis();
  }

  // Rådet: hver handling må gjennom tre krav (regel 1)
  {
    const sil = document.getElementById("sil");
    const iBasis = 0, iLav = scenarioer.indexOf("Lav etterspørsel");
    const krav = [
      { tekst: "Holder rammen i basis", test: h => h.behov[iBasis] <= ramme, vis: h => kr(h.behov[iBasis]) },
      { tekst: "Holder rammen ved lav etterspørsel", test: h => h.behov[iLav] <= ramme, vis: h => kr(h.behov[iLav]) },
    ];
    sil.appendChild(html("div"));
    for (const h of handlinger) sil.appendChild(html("div", "sil-hode", h.id === "avstå" ? "Avstå" : h.id));
    const igjen = new Set(handlinger.map(h => h.id));
    for (const k of krav) {
      sil.appendChild(html("div", "sil-krav", k.tekst));
      for (const h of handlinger) {
        const varIgjen = igjen.has(h.id), ok = k.test(h);
        const c = html("div", "sil-celle " + (!varIgjen ? "ute" : ok ? "ja" : "nei"));
        c.append(html("b", "", ok ? "Ja" : "Nei"), html("small", "", k.vis(h)));
        sil.appendChild(c);
        if (!ok) igjen.delete(h.id);
      }
    }
    const kandidater = handlinger.filter(h => igjen.has(h.id));
    const vinner = kandidater.reduce((a, b) => (b.nv[iBasis] > a.nv[iBasis] ? b : a));
    sil.appendChild(html("div", "sil-krav", "Høyest nåverdi av dem som er igjen"));
    for (const h of handlinger) {
      const c = html("div", "sil-celle " + (!igjen.has(h.id) ? "ute" : h === vinner ? "ja" : "nei"));
      c.append(html("b", "", igjen.has(h.id) ? (h === vinner ? "Høyest" : "Lavere") : "Ute"), html("small", "", kr(h.nv[iBasis])));
      sil.appendChild(c);
    }
    sil.appendChild(html("div"));
    for (const h of handlinger) {
      const c = html("div", "sil-resultat");
      c.appendChild(h === vinner ? html("span", "vinner", "Velg " + (h.id === "avstå" ? "avstå" : h.id)) : html("span", "stroket", ""));
      sil.appendChild(c);
    }
    // Bilde av salen som anbefales
    const fig = document.getElementById("rad-bilde");
    const salbilde = { A: "img/sal-a.jpg", B: "img/sal-b.jpg", C: "img/sal-c.jpg" }[vinner.id];
    if (salbilde) {
      fig.querySelector("img").src = salbilde;
      fig.querySelector("img").alt = "Salen i " + navn[vinner.id].slice(3);
      fig.querySelector("figcaption").textContent = navn[vinner.id];
    } else fig.hidden = true;
    if (vinner.id !== tall.regel1) console.warn("Silen og Resultater!J26 er uenige:", vinner.id, tall.regel1);
  }

  // Blandingen: tolv billetter, alle i C som i caset. Neste trykk snur dem til salen Konsertplan velger.
  const BL = window.BLANDING_DATA;
  const blanding = (() => {
    const holder = document.getElementById("billetter");
    if (!holder || !BL) return null;
    const tittel = document.getElementById("blanding-tittel");
    const nvEl = document.getElementById("bl-nv"), bhEl = document.getElementById("bl-behov");
    const nvEndring = document.getElementById("bl-nv-endring"), bhEndring = document.getElementById("bl-behov-endring");
    const rolig = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const billetter = BL.konserter.map((k, i) => {
      const b = html("div", "billett");
      b.style.setProperty("--rot", [-.8, .6, -.4, .9, -.6, .3][i % 6] + "deg");
      const info = html("div", "billett-info");
      info.append(html("p", "billett-dato", `${k.nr}. ${k.dato}`), html("p", "billett-artist", k.artist), html("p", "billett-salg", `${k.salg} solgt i 2026`));
      const stempel = html("div", "stempel", BL.caset.sal);
      b.append(info, stempel);
      holder.appendChild(b);
      return { k, stempel };
    });
    let steg = 0, tidtakere = [], anim = 0;
    function sett(el, v) { el.textContent = kr(v); }
    function tell(fra, til) {
      cancelAnimationFrame(anim);
      if (rolig()) { sett(nvEl, til.nv); sett(bhEl, til.behov); return; }
      const start = performance.now(), varighet = 1400;
      const tikk = t => {
        const x = Math.min(1, (t - start) / varighet), e = 1 - Math.pow(1 - x, 3);
        sett(nvEl, fra.nv + (til.nv - fra.nv) * e);
        sett(bhEl, fra.behov + (til.behov - fra.behov) * e);
        if (x < 1) anim = requestAnimationFrame(tikk);
      };
      anim = requestAnimationFrame(tikk);
    }
    function stemple(b, sal) {
      b.stempel.textContent = sal;
      b.stempel.classList.toggle("sal-a", sal === "A");
    }
    function vis(i, umiddelbart) {
      tidtakere.forEach(clearTimeout);
      tidtakere = [];
      const forrige = steg;
      steg = Math.max(0, Math.min(1, i));
      const blandet = steg === 1;
      const pluss = BL.blandet.nv - BL.caset.nv, mer = BL.blandet.behov - BL.caset.behov;
      tittel.textContent = blandet ? `Sal per konsert gir ${kr(pluss)} mer` : "Men må alle tolv gå i samme sal?";
      nvEndring.textContent = blandet ? `+${kr(pluss)} mot alt i C` : "Alt i C, som i caset";
      bhEndring.textContent = blandet ? `+${kr(mer)}, holder rammen på ${kr(BL.ramme)}` : `Rammen er ${kr(BL.ramme)}`;
      holder.classList.toggle("blandet", blandet);
      if (!blandet || umiddelbart || rolig() || forrige === steg) {
        billetter.forEach(b => { b.stempel.classList.remove("snur"); stemple(b, blandet ? b.k.sal : BL.caset.sal); });
        cancelAnimationFrame(anim);
        sett(nvEl, blandet ? BL.blandet.nv : BL.caset.nv);
        sett(bhEl, blandet ? BL.blandet.behov : BL.caset.behov);
        return;
      }
      // Snu billettene som bytter sal, én etter én
      billetter.filter(b => b.k.sal !== BL.caset.sal).forEach((b, n) => {
        tidtakere.push(setTimeout(() => b.stempel.classList.add("snur"), n * 140));
        tidtakere.push(setTimeout(() => { stemple(b, b.k.sal); b.stempel.classList.remove("snur"); }, n * 140 + 200));
      });
      tell(BL.caset, BL.blandet);
    }
    vis(0, true);
    return {
      antall: 2,
      get steg() { return steg; },
      vis,
      neste() { if (steg < 1) { vis(1); return true; } return false; },
      forrige() { if (steg > 0) { vis(0); return true; } return false; },
    };
  })();

  // Forklaringstekst: skjult som standard, knappen på forsiden eller F slår den på
  const forklarKnapp = document.getElementById("forklar-knapp");
  function visForklaring(paa) {
    document.body.classList.toggle("vis-forklaring", paa);
    forklarKnapp.setAttribute("aria-pressed", String(paa));
    forklarKnapp.textContent = paa ? "Forklaringstekst: på" : "Forklaringstekst: av";
    try { localStorage.setItem("sceneskift.forklaring", paa ? "1" : "0"); } catch (e) {}
  }
  let forklaringPaa = false;
  try { forklaringPaa = localStorage.getItem("sceneskift.forklaring") === "1"; } catch (e) {}
  visForklaring(forklaringPaa);
  forklarKnapp.addEventListener("click", () => visForklaring(!document.body.classList.contains("vis-forklaring")));

  // Navigasjon
  let aktiv = 0;
  const stegNav = document.getElementById("steg");
  const stegKnapper = bilder.map((b, i) => {
    if (!b.dataset.steg) return null;
    const k = html("button", "", b.dataset.steg);
    k.type = "button";
    k.addEventListener("click", () => gaaTil(i));
    stegNav.appendChild(k);
    return k;
  });
  const stegvis = el => (el.classList.contains("tur") ? window.TUR : el.classList.contains("blanding") ? blanding : null);
  function gaaTil(i, bakover, turSteg) {
    aktiv = Math.max(0, Math.min(bilder.length - 1, i));
    // Kommer vi baklengs inn i et stegvis lysbilde, starter vi på siste steg
    const sv = stegvis(bilder[aktiv]);
    if (sv) sv.vis(turSteg !== undefined ? turSteg : bakover ? sv.antall - 1 : 0, true);
    bilder.forEach((b, j) => b.classList.toggle("aktiv", j === aktiv));
    stegKnapper.forEach((k, j) => k && (j === aktiv ? k.setAttribute("aria-current", "step") : k.removeAttribute("aria-current")));
    document.body.classList.toggle("paa-helbilde", bilder[aktiv].classList.contains("helbilde"));
    document.body.classList.toggle("paa-forside", aktiv === 0);
    const r = bilder[aktiv].querySelector("iframe[data-src]");
    if (r && !r.src) r.src = r.dataset.src;
    lagreAdresse();
  }
  function lagreAdresse() {
    const sv = stegvis(bilder[aktiv]);
    const t = sv ? "." + sv.steg : "";
    history.replaceState(null, "", "#" + aktiv + t);
  }
  if (window.TUR) window.TUR.vedEndring = () => lagreAdresse();
  if (window.TUR) window.TUR.vedUtgang = () => {
    const neste = bilder[aktiv + 1];
    neste.classList.add("fra-tur");
    gaaTil(aktiv + 1);
    setTimeout(() => neste.classList.remove("fra-tur"), 1000);
  };
  const tur = () => stegvis(bilder[aktiv]);
  function tast(key) {
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(key)) { if (!(tur() && tur().neste())) gaaTil(aktiv + 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(key)) { if (!(tur() && tur().forrige())) gaaTil(aktiv - 1, true); }
    else if (key === "Home") gaaTil(0);
    else if (key === "End") gaaTil(bilder.length - 1);
    else if (key === "n" || key === "N") document.body.classList.toggle("vis-notater");
    else if (key === "f" || key === "F") visForklaring(!document.body.classList.contains("vis-forklaring"));
    else return false;
    return true;
  }
  addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("button") && (e.key === " " || e.key === "Enter")) return;
    if (tast(e.key)) e.preventDefault();
  });
  // Tavla i rammen sender piltastene videre hit
  addEventListener("message", e => { if (e.data && e.data.tast) tast(e.data.tast); });

  function tilpass() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    lerret.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
    // Lerretet er 16:9. Bakgrunnene går ut over kanten så andre skjermformater ikke får striper
    lerret.style.setProperty("--ut-x", Math.ceil((innerWidth / s - W) / 2 + 2) + "px");
    lerret.style.setProperty("--ut-y", Math.ceil((innerHeight / s - H) / 2 + 2) + "px");
  }
  addEventListener("resize", tilpass);
  tilpass();
  const [hSide, hSteg] = location.hash.slice(1).split(".");
  // #slutt går til avslutningen, brukes av «Tilbake til presentasjonen» i Konsertplan
  gaaTil(hSide === "slutt" ? bilder.length - 1 : Number(hSide) || 0, false, hSteg !== undefined ? Number(hSteg) : undefined);
})();
