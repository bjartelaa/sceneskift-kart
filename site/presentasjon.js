(() => {
  const G = window.GRAPH;
  const W = 1600, H = 900;
  const SVG = "http://www.w3.org/2000/svg";
  const node = id => G.nodes.find(n => n.id === id);
  const celle = (id, navn) => (node(id).celler || []).find(c => c.navn === navn || c.adresse.endsWith("!" + navn));
  const verdi = (id, navn) => celle(id, navn).verdi;

  const nb = v => v.toLocaleString("nb-NO", { maximumFractionDigits: 0 });
  const kr = v => nb(v) + " kr";
  const pst = v => (v * 100).toLocaleString("nb-NO", { maximumFractionDigits: 0 }) + " %";

  const lerret = document.getElementById("lerret");
  const bilder = [...document.querySelectorAll(".lysbilde")];
  const stegNav = document.getElementById("steg");
  const ramme = verdi("finans", "ramme");

  // Tall som står i teksten
  const tall = {
    ramme: kr(ramme),
    grunnlag: verdi("grunnlag", "grunnlag_2026"),
    regel1: verdi("resultater", "J26"),
  };
  for (const e of document.querySelectorAll("[data-tall]")) e.textContent = tall[e.dataset.tall];

  // 1: avtalekortene
  const kort = [
    { navn: "A: Lune Sal", c: "var(--gul)", rot: -1.2, linjer: [
      [`${verdi("avtale_a", "plasser_A")}`, "salgbare plasser"],
      [kr(verdi("avtale_a", "leie_A")), "i leie per konsert"],
    ]},
    { navn: "B: Søyleverket", c: "var(--gul)", rot: .8, linjer: [
      [`${verdi("avtale_b", "plasser_B")}`, "salgbare plasser"],
      [kr(verdi("avtale_b", "B_sesongleie") + verdi("avtale_b", "B_tilpasning")), "fast for sesongen, mye før start"],
    ]},
    { navn: "C: Skarvkaien", c: "var(--gul)", rot: -.6, linjer: [
      [`${verdi("avtale_c", "plasser_C")}`, "salgbare plasser"],
      [pst(verdi("avtale_c", "C_andel")), `av billettoppgjøret, minst ${kr(verdi("avtale_c", "C_min"))} per konsert`],
    ]},
    { navn: "Avstå", avsta: true, rot: 1.1, linjer: [["0 kr", "ingen betalinger, ingen risiko"]] },
  ];
  const kortRad = document.getElementById("avtalekort");
  for (const k of kort) {
    const d = document.createElement("div");
    d.className = "kort" + (k.avsta ? " avsta" : "");
    d.style.setProperty("--rot", k.rot + "deg");
    if (k.c) d.style.setProperty("--c", k.c);
    const h = document.createElement("h3");
    h.textContent = k.navn;
    const ul = document.createElement("ul");
    for (const [stor, tekst] of k.linjer) {
      const li = document.createElement("li");
      const s = document.createElement("span");
      s.className = "stor";
      s.textContent = stor;
      li.append(s, document.createTextNode(tekst));
      ul.appendChild(li);
    }
    d.append(h, ul);
    kortRad.appendChild(d);
  }

  function lag(tag, attrs = {}, tekst) {
    const e = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  }

  // 4: nåverdi mot finansieringsbehov, ett scenario om gangen
  const nvTab = node("nv").scenarioer, bhTab = node("behov").scenarioer;
  const scenarioer = nvTab.scenarioer;
  const handlinger = nvTab.rader.map((r, i) => ({ navn: r.handling, nv: r.verdier, behov: bhTab.rader[i].verdier }));
  const svg = document.getElementById("spredning");
  const P = { x1: 110, x2: 870, y1: 60, y2: 530 };
  const alleNv = handlinger.flatMap(h => h.nv), alleBh = handlinger.flatMap(h => h.behov);
  const xmax = Math.ceil(Math.max(...alleBh, ramme) / 100000) * 100000 + 50000;
  const ymin = Math.floor(Math.min(...alleNv) / 100000) * 100000;
  const ymax = Math.ceil(Math.max(...alleNv) / 100000) * 100000;
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
  svg.appendChild(lag("text", { class: "etikett", x: sx(ramme) + 12, y: P.y1 + 24, fill: "var(--minus)", style: "fill: var(--minus)" }, `Rammen, ${kr(ramme)}`));
  svg.appendChild(lag("text", { class: "tittel-akse", x: (P.x1 + P.x2) / 2, y: P.y2 + 68, "text-anchor": "middle" }, "Finansieringsbehov, kr"));
  svg.appendChild(lag("text", { class: "tittel-akse", x: P.x1, y: P.y1 - 30, "text-anchor": "middle" }, "Nåverdi, kr"));

  const punkter = handlinger.map(h => {
    const g = lag("g", { class: "punkt" });
    g.appendChild(lag("circle", { r: 11, cx: 0, cy: 0 }));
    g.appendChild(lag("text", { class: "merke", x: 18, y: -12 }, h.navn === "avstå" ? "Avstå" : h.navn));
    svg.appendChild(g);
    return { h, g };
  });

  const velger = document.getElementById("scenariovelger");
  const oppsummering = document.getElementById("oppsummering");
  const knapper = scenarioer.map((navn, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = navn;
    b.addEventListener("click", () => visScenario(i));
    velger.appendChild(b);
    return b;
  });
  function visScenario(i) {
    knapper.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    for (const { h, g } of punkter) {
      g.style.transform = `translate(${sx(h.behov[i])}px, ${sy(h.nv[i])}px)`;
      g.classList.toggle("over", h.behov[i] > ramme);
    }
    const avtaler = handlinger.filter(h => h.navn !== "avstå");
    const best = avtaler.reduce((a, b) => (b.nv[i] > a.nv[i] ? b : a));
    const innenfor = avtaler.filter(h => h.behov[i] <= ramme && h.nv[i] > 0);
    const bestInnenfor = innenfor.length ? innenfor.reduce((a, b) => (b.nv[i] > a.nv[i] ? b : a)) : null;
    let t = `${scenarioer[i]}: ${best.navn} har høyest nåverdi, ${kr(best.nv[i])}`;
    t += best.behov[i] > ramme ? `, men trenger ${kr(best.behov[i])}. ` : ". ";
    t += bestInnenfor
      ? (bestInnenfor === best ? `${best.navn} holder også rammen.` : `${bestInnenfor.navn} er best av avtalene som holder rammen og gir pluss.`)
      : "Ingen avtale holder rammen og gir pluss. Da er avstå best.";
    oppsummering.textContent = t;
  }
  visScenario(0);

  // 5: grensene for salg
  const gsvg = document.getElementById("grensediagram");
  const Q = { x1: 230, x2: 1370 };
  const gmin = 0.5, gmaks = 1.2;
  const gx = v => Q.x1 + ((v - gmin) / (gmaks - gmin)) * (Q.x2 - Q.x1);
  for (let v = 0.5; v <= 1.2001; v += 0.1) {
    gsvg.appendChild(lag("text", { class: "etikett", x: gx(v), y: 410, "text-anchor": "middle" }, pst(v)));
  }
  for (const [v, tekst] of [[1, "Majas premiss"], [0.8, "Lav etterspørsel"]]) {
    gsvg.appendChild(lag("line", { class: "ref", x1: gx(v), x2: gx(v), y1: 30, y2: 380 }));
    gsvg.appendChild(lag("text", { class: "etikett", x: gx(v), y: 20, "text-anchor": "middle" }, tekst));
  }
  const rader = ["A", "B", "C"].map((a, i) => {
    const nv = verdi("grenser", "grense_nv_" + a), bh = verdi("grenser", "grense_behov_" + a);
    return { a, nv, bh, y: 90 + i * 110 };
  });
  for (const r of rader) {
    const bhTall = typeof r.bh === "number" ? r.bh : gmaks;
    const verst = Math.max(r.nv, bhTall);
    gsvg.appendChild(lag("rect", { class: "ille", x: gx(gmin), y: r.y - 26, width: gx(verst) - gx(gmin), height: 52 }));
    gsvg.appendChild(lag("line", { class: "linje", x1: Q.x1, x2: Q.x2, y1: r.y, y2: r.y }));
    gsvg.appendChild(lag("text", { class: "rad-navn", x: 20, y: r.y + 11 }, { A: "A: Lune Sal", B: "B: Søyleverket", C: "C: Skarvkaien" }[r.a]));
    gsvg.appendChild(lag("circle", { class: "nv", cx: gx(r.nv), cy: r.y, r: 10 }));
    gsvg.appendChild(lag("text", { class: "etikett", x: gx(r.nv), y: r.y - 18, "text-anchor": "middle" }, `Nåverdi under 0: ${pst(r.nv)}`));
    if (typeof r.bh === "number") {
      gsvg.appendChild(lag("rect", { class: "bh", x: gx(r.bh) - 9, y: r.y - 9, width: 18, height: 18 }));
      gsvg.appendChild(lag("text", { class: "etikett", x: gx(r.bh), y: r.y + 38, "text-anchor": "middle" }, `Over rammen: ${pst(r.bh)}`));
    } else {
      gsvg.appendChild(lag("text", { class: "etikett", x: gx(1.1), y: r.y + 38, "text-anchor": "middle", style: "fill: var(--minus)" }, "Over rammen på alle salgsnivåer"));
    }
  }
  const c = rader.find(r => r.a === "C");
  document.getElementById("grense-tekst").textContent =
    `I det rosa feltet går det galt. C har positiv nåverdi ned til ${pst(c.nv)} av salget i 2026, og holder rammen ned til ${pst(c.bh)}. B går over rammen uansett salg.`;

  // 6: beslutningsreglene
  const regler = document.getElementById("regler");
  const regelTekst = [
    ["Holder rammen i basis og ved lav etterspørsel", "J26"],
    ["Holder rammen i alle fire scenarioer", "J27"],
    ["Holder rammen bare i basis", "J28"],
    ["Høyest nåverdi, uten hensyn til rammen", "J29"],
  ];
  regelTekst.forEach(([tekst, adr], i) => {
    const tr = document.createElement("tr");
    if (i === 0) tr.className = "var";
    const t1 = document.createElement("td"), t2 = document.createElement("td");
    t1.textContent = `${i + 1}. ${tekst}`;
    t2.textContent = verdi("resultater", adr);
    tr.append(t1, t2);
    regler.appendChild(tr);
  });

  // Navigasjon
  let aktiv = 0;
  const stegKnapper = bilder.slice(1).map((b, i) => {
    const k = document.createElement("button");
    k.type = "button";
    k.textContent = b.dataset.navn;
    k.addEventListener("click", () => gaaTil(i + 1));
    stegNav.appendChild(k);
    return k;
  });
  function gaaTil(i) {
    aktiv = Math.max(0, Math.min(bilder.length - 1, i));
    bilder.forEach((b, j) => b.classList.toggle("aktiv", j === aktiv));
    stegKnapper.forEach((k, j) => j + 1 === aktiv ? k.setAttribute("aria-current", "step") : k.removeAttribute("aria-current"));
    document.body.classList.toggle("paa-forside", aktiv === 0);
    const ramme = bilder[aktiv].querySelector("iframe[data-src]");
    if (ramme && !ramme.src) ramme.src = ramme.dataset.src;
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
