(() => {
  const G = window.GRAPH;
  const W = 1600, H = 900;
  const SVG = "http://www.w3.org/2000/svg";
  const node = id => G.nodes.find(n => n.id === id);
  const celle = (id, navn) => (node(id).celler || []).find(c => c.navn === navn || c.adresse.endsWith("!" + navn));
  const verdi = (id, navn) => celle(id, navn).verdi;

  const nb = v => Math.round(v).toLocaleString("nb-NO");
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
      const g = lag("g", { class: "punkt" });
      g.append(lag("circle", { r: 11, cx: 0, cy: 0 }), lag("text", { class: "merke", x: 18, y: -12 }, h.id === "avstå" ? "Avstå" : h.id));
      svg.appendChild(g);
      return { h, g };
    });
    const oppsummering = document.getElementById("oppsummering");
    const knapper = knapperad(document.getElementById("scenariovelger"), scenarioer, vis);
    function vis(i) {
      trykk(knapper, i);
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

  // Saldoen: Figur 1 fra arbeidsboka
  {
    const S = G.saldo;
    const svg = document.getElementById("saldo");
    const P = { x1: 120, x2: 860, y1: 40, y2: 520 };
    const alle = [...S.A, ...S.B, ...S.C, -ramme];
    const ymin = Math.floor(Math.min(...alle) / 100000) * 100000 - 50000;
    const ymax = Math.ceil(Math.max(...alle) / 100000) * 100000;
    const sx = i => P.x1 + (i / (S.maaneder.length - 1)) * (P.x2 - P.x1);
    const sy = v => P.y2 - ((v - ymin) / (ymax - ymin)) * (P.y2 - P.y1);
    svg.appendChild(lag("rect", { class: "ille", x: P.x1, y: sy(-ramme), width: P.x2 - P.x1, height: P.y2 - sy(-ramme) }));
    for (let v = Math.ceil(ymin / 100000) * 100000; v <= ymax; v += 100000) {
      svg.appendChild(lag("line", { class: v === 0 ? "akse" : "rutenett", x1: P.x1, x2: P.x2, y1: sy(v), y2: sy(v) }));
      svg.appendChild(lag("text", { class: "etikett", x: P.x1 - 14, y: sy(v) + 6, "text-anchor": "end" }, nb(v)));
    }
    S.maaneder.forEach((m, i) => {
      svg.appendChild(lag("text", { class: "etikett", x: sx(i), y: P.y2 + 30, "text-anchor": "middle" }, m.replace("Før jan (t0)", "t0").slice(0, 3)));
    });
    svg.appendChild(lag("line", { class: "rammestrek", x1: P.x1, x2: P.x2, y1: sy(-ramme), y2: sy(-ramme) }));
    svg.appendChild(lag("text", { class: "etikett", x: P.x2 - 6, y: sy(-ramme) + 28, "text-anchor": "end", style: "fill: var(--minus)" }, `Rammen, minus ${kr(ramme)}`));
    // Sluttmerkene skyves fra hverandre når linjene ender tett
    const sist = S.A.length - 1;
    const ender = ["A", "B", "C"].map(a => ({ a, y: sy(S[a][sist]) + 8 })).sort((p, q) => p.y - q.y);
    for (let k = 1; k < ender.length; k++) ender[k].y = Math.max(ender[k].y, ender[k - 1].y + 30);
    for (const a of ["A", "C", "B"]) {
      const d = S[a].map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ");
      svg.appendChild(lag("path", { class: "linje-" + a.toLowerCase(), d }));
    }
    for (const e of ender) svg.appendChild(lag("text", { class: "merke-liten", x: sx(sist) + 14, y: e.y }, e.a));
    const minB = Math.min(...S.B), iB = S.B.indexOf(minB);
    svg.appendChild(lag("circle", { class: "bunn", cx: sx(iB), cy: sy(minB), r: 8 }));
    svg.appendChild(lag("text", { class: "etikett", x: sx(iB) + 14, y: sy(minB) + 28, style: "fill: var(--minus); font-weight: 600" }, `B: minus ${kr(-minB)} i ${S.maaneder[iB].toLowerCase()}`));
    const t0B = -S.B[0];
    document.getElementById("saldo-tekst").textContent =
      `B betaler ${kr(t0B)} før første konsert. Saldoen er lavest i ${S.maaneder[iB].toLowerCase()}, ${kr(-minB - ramme)} under rammen. A og C holder seg over streken hele sesongen.`;
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
    }
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
    if (vinner.id !== tall.regel1) console.warn("Silen og Resultater!J26 er uenige:", vinner.id, tall.regel1);
  }

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
  function gaaTil(i) {
    aktiv = Math.max(0, Math.min(bilder.length - 1, i));
    bilder.forEach((b, j) => b.classList.toggle("aktiv", j === aktiv));
    stegKnapper.forEach((k, j) => k && (j === aktiv ? k.setAttribute("aria-current", "step") : k.removeAttribute("aria-current")));
    document.body.classList.toggle("paa-helbilde", bilder[aktiv].classList.contains("helbilde"));
    const r = bilder[aktiv].querySelector("iframe[data-src]");
    if (r && !r.src) r.src = r.dataset.src;
    history.replaceState(null, "", "#" + aktiv);
  }
  function tast(key) {
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(key)) gaaTil(aktiv + 1);
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(key)) gaaTil(aktiv - 1);
    else if (key === "Home") gaaTil(0);
    else if (key === "End") gaaTil(bilder.length - 1);
    else if (key === "n" || key === "N") document.body.classList.toggle("vis-notater");
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
  }
  addEventListener("resize", tilpass);
  tilpass();
  gaaTil(Number(location.hash.slice(1)) || 0);
})();
