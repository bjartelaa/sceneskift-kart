// Turen gjennom modellen: én stor flate der kameraet flytter seg fra ramme til ramme.
// Vi følger konsert 6 fra rådata til resultat, og viser til slutt at det samme gjøres for alle tolv.
window.TUR = (() => {
  const G = window.GRAPH;
  const SVG = "http://www.w3.org/2000/svg";
  const node = id => G.nodes.find(n => n.id === id);
  const verdi = (id, navn) => (node(id).celler || []).find(c => c.navn === navn).verdi;
  const nb = v => Math.round(v).toLocaleString("nb-NO").replace("−", "-");
  const kr = v => nb(v) + " kr";
  const fortegn = v => (v > 0 ? "+" : "") + nb(v);
  const roligst = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const verden = document.getElementById("tur-verden");
  if (!verden) return null;
  const vindu = verden.parentElement;
  const tittelEl = document.getElementById("tur-tittel");
  const tekstEl = document.getElementById("tur-tekst");
  const notatEl = document.getElementById("tur-notat");
  const akter = [...document.querySelectorAll("#akter li")];

  const K = G.konserter;
  const data = {};
  const k6Bidrag = [];
  const k6 = K.find(k => k.konsert === "K06");
  const artister = ["June Varde", "Mellomlys", "Liv Eik", "Blåtimekvartetten", "Ravlinje", "Vesperhagen",
    "Iben Vår", "Sølvregn", "Dobbeltspor", "Nattfiol", "Ada Mørk", "Glassmorgen"];
  const maaneder = G.saldo.maaneder.map(m => (m.startsWith("Før") ? "t0" : m.slice(0, 3)));
  const sal = {
    A: { navn: "A: Lune Sal", plasser: verdi("avtale_a", "plasser_A"), bilde: "img/sal-a.jpg" },
    B: { navn: "B: Søyleverket", plasser: verdi("avtale_b", "plasser_B"), bilde: "img/sal-b.jpg" },
    C: { navn: "C: Skarvkaien", plasser: verdi("avtale_c", "plasser_C"), bilde: "img/sal-c.jpg" },
  };
  const sesongleie = verdi("avtale_b", "B_sesongleie") + verdi("avtale_b", "B_tilpasning");
  const ramme = verdi("finans", "ramme");
  const pris = verdi("salg", "billettpris"), gebyr = verdi("salg", "billettgebyr"), publikum = verdi("salg", "publikumsutgift");
  const pakke = verdi("pakke", "pakkepris");

  // Bidrag per konsert før sesongleien til B
  const bidrag = (k, a) => k["oppgjor_" + a] - k.pakke1 - k.pakke2 - k["publikum_" + a] - (a === "A" ? k.leie_A : a === "C" ? k.leie_C : 0);

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
  // Et element blir synlig fra steg «fra» (og eventuelt skjult etter steg «til»)
  function trinn(el, fra, til, forsinkelse = 0) {
    el.classList.add("trinn");
    el.dataset.fra = fra;
    if (til !== undefined) el.dataset.til = til;
    if (forsinkelse) el.style.transitionDelay = forsinkelse + "ms";
    return el;
  }

  // Rammene ligger i en slange: tre bortover, så ned, så tre tilbake
  const RAMMER = {
    data: [0, 0], fors: [1800, 0], k6: [3600, 0],
    tid: [3600, 1100], tolv: [1800, 1100], res: [0, 1100],
  };
  const etiketter = { data: "Data", fors: "Forutsetninger", k6: "Konsert 6", tid: "Når pengene går", tolv: "Tolv konserter", res: "Resultat" };
  const ramme_ = {};
  for (const [id, [x, y]] of Object.entries(RAMMER)) {
    const r = html("div", "tur-ramme");
    r.style.left = x + "px";
    r.style.top = y + "px";
    r.appendChild(html("p", "ramme-etikett", etiketter[id]));
    verden.appendChild(r);
    ramme_[id] = r;
  }
  function svgI(id) {
    const s = lag("svg", { class: "tur-svg", viewBox: "0 0 1600 900" });
    ramme_[id].appendChild(s);
    return s;
  }

  // Tråden mellom rammene
  const traad = lag("svg", { class: "tur-traad", viewBox: "0 0 5200 2000", width: 5200, height: 2000 });
  verden.prepend(traad);
  const biter = [
    ["fors", "M1600,450 C1680,470 1720,430 1800,450"],
    ["k6", "M3400,450 C3480,470 3520,430 3600,450"],
    ["tid", "M4400,900 C4420,980 4380,1020 4400,1100"],
    ["tolv", "M3600,1550 C3520,1570 3480,1530 3400,1550"],
    ["res", "M1800,1550 C1720,1570 1680,1530 1600,1550"],
  ].map(([til, d]) => {
    const p = lag("path", { d, class: "traad-bit" });
    traad.appendChild(p);
    return { til, p };
  });

  // DATA: 1 791 rader som prikker, rensing, og så betalte billetter per konsert
  {
    const s = svgI("data");
    const rader = 1791, fjernet = new Set();
    for (let i = 0; i < 21; i++) fjernet.add((i * 83 + 17) % rader);
    const prikker = lag("g", { class: "prikker" });
    for (let i = 0; i < rader; i++) {
      const c = lag("circle", { cx: 250 + (i % 60) * 18, cy: 250 + Math.floor(i / 60) * 17.5, r: 5.2 });
      if (fjernet.has(i)) c.setAttribute("class", "fjernes");
      prikker.appendChild(c);
    }
    trinn(prikker, 0, 1);
    s.appendChild(prikker);
    const teller = lag("text", { class: "teller", x: 1350, y: 420 }, "1 791");
    const tellerTekst = lag("text", { class: "teller-tekst", x: 1352, y: 458 }, "rader i ordreeksporten");
    const g = trinn(lag("g"), 0, 1);
    g.append(teller, tellerTekst);
    s.appendChild(g);
    const rens = trinn(lag("g"), 1, 1);
    rens.append(lag("text", { class: "teller-tekst minus", x: 1352, y: 500 }, "16 avbrutte ut"),
      lag("text", { class: "teller-tekst minus", x: 1352, y: 530 }, "5 dobbeltførte ut"));
    s.appendChild(rens);
    data.teller = teller;

    // Søylene: betalte billetter 2026 per konsert
    const base = 735, skala = 410 / Math.max(...K.map(k => k.grunnlag)), slot = 1062 / 12;
    const soyler = trinn(lag("g", { class: "soyler" }), 2);
    K.forEach((k, i) => {
      const x = 250 + i * slot + (slot - 56) / 2, h = k.grunnlag * skala;
      const er6 = k.konsert === "K06";
      soyler.appendChild(trinn(lag("rect", { x, y: base - h, width: 56, height: h, class: er6 ? "soyle-k6" : "soyle-k" }), 2, undefined, i * 40));
      soyler.appendChild(lag("text", { class: er6 ? "soyle-tall stor" : "soyle-tall", x: x + 28, y: base - h - 12, "text-anchor": "middle" }, nb(k.grunnlag)));
      soyler.appendChild(lag("text", { class: "soyle-navn", x: x + 28, y: base + 30, "text-anchor": "middle" }, String(i + 1)));
      const stemmer = k.ordrer === k.oppgjor;
      soyler.appendChild(stemmer
        ? lag("path", { class: "hake", d: `M${x + 18},${base + 50} l7,7 l13,-14` })
        : lag("text", { class: "avvik", x: x + 28, y: base + 62, "text-anchor": "middle" }, `${k.ordrer - k.oppgjor}`));
    });
    soyler.appendChild(lag("text", { class: "akse-tekst", x: 250, y: base + 88 }, "Konsert. Hake: ordrene stemmer med oppgjøret"));
    s.appendChild(soyler);
    const sum = trinn(lag("g"), 2);
    sum.append(lag("text", { class: "teller", x: 1350, y: 420 }, nb(K.reduce((a, k) => a + k.grunnlag, 0))),
      lag("text", { class: "teller-tekst", x: 1352, y: 458 }, "betalte billetter i 2026"));
    s.appendChild(sum);
  }

  // FORUTSETNINGER: konsert 6 inn i forutsetningene, og de tre salene
  {
    const r = ramme_.fors;
    const kort = trinn(html("div", "tur-kort k6-kort"), 3);
    kort.appendChild(html("p", "lapp-tittel", "Konsert 6, Vesperhagen, fredag 26. mars"));
    const linjer = [
      [[nb(k6.grunnlag), "betalte i 2026"], ["× 100 %", "basis"], ["= " + nb(k6.grunnlag), "billetter etterspurt"]],
      [[kr(pris), "billettpris"], ["- " + kr(gebyr), "gebyr"], ["= " + kr(pris - gebyr), "inn per billett, måneden etter"]],
      [[kr(publikum), "per billett i publikumsutgift, i konsertmåneden"]],
      [[kr(pakke), "pakke fra Rigg & Ro, halvparten måneden før"]],
    ];
    linjer.forEach((ledd, i) => {
      const rad = trinn(html("div", "likning"), 3, undefined, 250 + i * 350);
      for (const [stor, liten] of ledd) {
        const l = html("span", "ledd");
        l.append(html("b", "", stor), html("small", "", liten));
        rad.appendChild(l);
      }
      kort.appendChild(rad);
    });
    r.appendChild(kort);
    const regler = {
      A: [`${sal.A.plasser} plasser`, `${kr(verdi("avtale_a", "leie_A"))} per konsert`, "betales i konsertmåneden"],
      B: [`${sal.B.plasser} plasser`, `${kr(sesongleie)} for hele sesongen`, "betales ved t0 og i mars, uansett salg"],
      C: [`${sal.C.plasser} plasser`, `18 % av oppgjøret, minst ${kr(verdi("avtale_c", "C_min"))}`, "betales måneden etter"],
    };
    const salRad = html("div", "sal-rad");
    ["A", "B", "C"].forEach((a, i) => {
      const k = trinn(html("div", "tur-kort sal-kort"), 4, undefined, i * 180);
      const img = html("img");
      img.src = sal[a].bilde;
      img.alt = "Salen i " + sal[a].navn.slice(3);
      k.append(img, html("h3", "", sal[a].navn));
      const ul = html("ul");
      regler[a].forEach((t, j) => ul.appendChild(html("li", j === 0 ? "stor" : "", t)));
      k.appendChild(ul);
      salRad.appendChild(k);
    });
    r.appendChild(salRad);
  }

  // KONSERT 6: billetter og bidrag i hver sal
  {
    const r = ramme_.k6;
    const tab = html("div", "k6-tabell");
    const celle = (t, cls = "") => html("div", "k6-celle " + cls, t);
    const rader = [
      ["", ...["A", "B", "C"].map(a => [sal[a].navn, "k6-hode"])],
      ["Billetter (480 vil kjøpe)", ...["A", "B", "C"].map(a => {
        const tapt = k6.grunnlag - k6["billetter_" + a];
        return [nb(k6["billetter_" + a]) + (tapt ? ` ${tapt} får ikke plass` : ""), tapt ? "tak" : ""];
      })],
      ["Billettoppgjør, april", ...["A", "B", "C"].map(a => [fortegn(k6["oppgjor_" + a]), "pluss"])],
      ["Pakke, februar og mars", ...["A", "B", "C"].map(() => [fortegn(-(k6.pakke1 + k6.pakke2)), "minus"])],
      ["Publikumsutgift, mars", ...["A", "B", "C"].map(a => [fortegn(-k6["publikum_" + a]), "minus"])],
      ["Leie", [fortegn(-k6.leie_A) + " i mars", "minus"], ["i sesongleien", "svak"], [fortegn(-k6.leie_C) + " i april", "minus"]],
    ];
    rader.forEach((rad, i) => {
      const [etikett, ...celler] = rad;
      tab.appendChild(trinn(celle(etikett, "k6-etikett"), 5, undefined, i * 260));
      for (const [t, cls] of celler) {
        const c = celle("", cls);
        if (cls === "tak") {
          const [tall, rest] = t.split(" ");
          c.append(document.createTextNode(tall + " "), html("span", "tak-tekst", rest));
        } else c.textContent = t;
        tab.appendChild(trinn(c, 5, undefined, i * 260));
      }
    });
    tab.appendChild(trinn(celle("Bidrag fra konsert 6", "k6-etikett sum"), 5, undefined, 1700));
    const bidragEl = {};
    for (const a of ["A", "B", "C"]) {
      const c = trinn(celle("0", "sum tall-sum"), 5, undefined, 1700);
      c.dataset.verdi = bidrag(k6, a);
      bidragEl[a] = c;
      tab.appendChild(c);
    }
    r.appendChild(tab);
    r.appendChild(trinn(html("p", "fotnote", `B betaler ${kr(sesongleie)} i sesongleie uansett hvor mye som selges. Den kommer i tillegg, og trekkes fra når sesongen summeres.`), 5, undefined, 2000));
    k6Bidrag.push(...Object.values(bidragEl));
  }

  // NÅR PENGENE GÅR: konsert 6 måned for måned
  {
    const s = svgI("tid");
    const x0 = 360, dx = 165, rader = { A: 400, B: 565, C: 730 }, skala = 62 / 153000;
    s.appendChild(trinn(lag("rect", { class: "maaned-band", x: x0 + 3 * dx - 70, y: 250, width: 140, height: 560 }), 6));
    s.appendChild(trinn(lag("text", { class: "akse-tekst", x: x0 + 3 * dx, y: 840, "text-anchor": "middle" }, "konsert 6"), 6));
    maaneder.forEach((m, i) => s.appendChild(trinn(lag("text", { class: "maaned", x: x0 + i * dx, y: 280, "text-anchor": "middle" }, m), 6)));
    const strom = a => {
      const ut = new Array(8).fill(0);
      ut[k6.mnd_pakke1] -= k6.pakke1;
      ut[k6.mnd] -= k6.pakke2 + k6["publikum_" + a] + (a === "A" ? k6.leie_A : 0);
      ut[k6.mnd_oppgjor] += k6["oppgjor_" + a];
      if (a === "C") ut[k6.mnd_leie_C] -= k6.leie_C;
      return ut;
    };
    ["A", "B", "C"].forEach((a, ri) => {
      const y = rader[a];
      s.appendChild(trinn(lag("text", { class: "rad-navn", x: 70, y: y + 8 }, sal[a].navn), 6, undefined, ri * 150));
      s.appendChild(trinn(lag("line", { class: "akse", x1: x0 - 80, x2: x0 + 7 * dx + 60, y1: y, y2: y }), 6, undefined, ri * 150));
      strom(a).forEach((v, i) => {
        if (!v) return;
        const h = Math.abs(v) * skala;
        const x = x0 + i * dx;
        const forsink = 400 + ri * 150 + i * 120;
        s.appendChild(trinn(lag("rect", { class: v > 0 ? "strom-pluss" : "strom-minus", x: x - 28, y: v > 0 ? y - h : y, width: 56, height: h }), 6, undefined, forsink));
        s.appendChild(trinn(lag("text", { class: "strom-tall", x: x + 36, y: v > 0 ? y - h + 18 : y + h - 2 }, fortegn(v)), 6, undefined, forsink));
      });
    });
  }

  // TOLV KONSERTER: bidrag per konsert, og saldoen måned for måned
  {
    const s = svgI("tolv");
    const kol = { A: 650, B: 800, C: 950 }, y0 = 285, dy = 37;
    const hode = trinn(lag("g"), 7);
    hode.append(lag("text", { class: "tab-hode", x: 60, y: 250 }, "Konsert"),
      lag("text", { class: "tab-hode", x: 330, y: 250 }, "Solgt 2026"),
      ...["A", "B", "C"].map(a => lag("text", { class: "tab-hode", x: kol[a], y: 250, "text-anchor": "end" }, a)));
    s.appendChild(hode);
    const maks = Math.max(...K.map(k => k.grunnlag));
    K.forEach((k, i) => {
      const y = y0 + i * dy;
      const g = trinn(lag("g", { class: k.konsert === "K06" ? "tab-rad k6" : "tab-rad" }), 7, undefined, i * 70);
      if (k.konsert === "K06") g.appendChild(lag("rect", { class: "rad-merke", x: 48, y: y - 25, width: 920, height: dy - 2 }));
      g.append(lag("text", { class: "tab-tekst", x: 60, y }, `${i + 1}  ${artister[i]}`),
        lag("rect", { class: "mini-soyle", x: 330, y: y - 15, width: (k.grunnlag / maks) * 120, height: 14 }),
        lag("text", { class: "tab-tall liten", x: 458, y: y - 2 }, nb(k.grunnlag)));
      for (const a of ["A", "B", "C"]) {
        const b = bidrag(k, a);
        g.appendChild(lag("text", { class: "tab-tall" + (b < 0 ? " neg" : ""), x: kol[a], y, "text-anchor": "end" }, nb(b)));
      }
      s.appendChild(g);
    });
    const ySum = y0 + 12 * dy + 10;
    const sumG = trinn(lag("g"), 7, undefined, 950);
    sumG.appendChild(lag("line", { class: "akse", x1: 60, x2: 960, y1: ySum - 26, y2: ySum - 26 }));
    sumG.appendChild(lag("text", { class: "tab-tekst sterk", x: 60, y: ySum }, "Sum"));
    const sumer = {};
    for (const a of ["A", "B", "C"]) {
      sumer[a] = K.reduce((t, k) => t + bidrag(k, a), 0);
      sumG.appendChild(lag("text", { class: "tab-tall sterk", x: kol[a], y: ySum, "text-anchor": "end" }, nb(sumer[a])));
    }
    sumG.appendChild(lag("text", { class: "tab-tekst liten", x: 60, y: ySum + 32 }, `B: ${nb(sumer.B)} minus sesongleien ${nb(sesongleie)} = ${nb(sumer.B - sesongleie)}`));
    s.appendChild(sumG);

    // Saldoen (Figur 1)
    const S = G.saldo;
    const P = { x1: 1110, x2: 1500, y1: 260, y2: 760 };
    const alle = [...S.A, ...S.B, ...S.C, -ramme];
    const ymin = Math.floor(Math.min(...alle) / 100000) * 100000 - 50000, ymax = Math.ceil(Math.max(...alle) / 100000) * 100000;
    const sx = i => P.x1 + (i / (S.maaneder.length - 1)) * (P.x2 - P.x1);
    const sy = v => P.y2 - ((v - ymin) / (ymax - ymin)) * (P.y2 - P.y1);
    const fig = trinn(lag("g"), 8);
    fig.appendChild(lag("text", { class: "tab-hode", x: P.x1 - 70, y: 230 }, "Saldo ved månedsslutt"));
    fig.appendChild(lag("rect", { class: "ille", x: P.x1, y: sy(-ramme), width: P.x2 - P.x1, height: P.y2 - sy(-ramme) }));
    for (let v = Math.ceil(ymin / 100000) * 100000; v <= ymax; v += 100000) {
      fig.appendChild(lag("line", { class: v === 0 ? "akse" : "rutenett", x1: P.x1, x2: P.x2, y1: sy(v), y2: sy(v) }));
      fig.appendChild(lag("text", { class: "akse-tekst", x: P.x1 - 10, y: sy(v) + 5, "text-anchor": "end" }, nb(v / 1000) + " k"));
    }
    maaneder.forEach((m, i) => { if (i % 2 === 1 || i === 0) fig.appendChild(lag("text", { class: "akse-tekst", x: sx(i), y: P.y2 + 26, "text-anchor": "middle" }, m)); });
    fig.appendChild(lag("line", { class: "rammestrek", x1: P.x1, x2: P.x2, y1: sy(-ramme), y2: sy(-ramme) }));
    fig.appendChild(lag("text", { class: "akse-tekst rod", x: P.x2, y: sy(-ramme) + 22, "text-anchor": "end" }, "rammen"));
    const sist = S.A.length - 1;
    const ender = ["A", "B", "C"].map(a => ({ a, y: sy(S[a][sist]) + 6 })).sort((p, q) => p.y - q.y);
    for (let k = 1; k < ender.length; k++) ender[k].y = Math.max(ender[k].y, ender[k - 1].y + 24);
    for (const a of ["A", "C", "B"]) {
      fig.appendChild(lag("path", { class: "linje-" + a.toLowerCase(), d: S[a].map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ") }));
    }
    for (const e of ender) fig.appendChild(lag("text", { class: "merke-liten", x: sx(sist) + 12, y: e.y }, e.a));
    for (const a of ["A", "B", "C"]) {
      const min = Math.min(...S[a]), i = S[a].indexOf(min);
      fig.appendChild(lag("circle", { class: a === "B" ? "bunn" : "bunn-liten", cx: sx(i), cy: sy(min), r: a === "B" ? 7 : 5 }));
    }
    s.appendChild(fig);
  }

  // RESULTAT: to tall per sal
  {
    const r = ramme_.res;
    const rad = html("div", "res-rad");
    const behovMaks = Math.max(...["A", "B", "C"].map(a => verdi("behov", "behov_" + a)), ramme) * 1.08;
    ["A", "B", "C"].forEach((a, i) => {
      const nv = verdi("nv", "nv_" + a), netto = verdi("nv", "netto_" + a), bh = verdi("behov", "behov_" + a);
      const k = trinn(html("div", "tur-kort res-kort"), 9, undefined, i * 300);
      k.appendChild(html("h3", "", sal[a].navn));
      const linje = (etikett, tall, cls = "") => {
        const l = html("div", "res-linje " + cls);
        l.append(html("small", "", etikett), html("b", "", tall));
        return l;
      };
      k.append(linje("Sum alle betalinger", kr(netto), "svak"), linje("Nåverdi, 4 % realrente", kr(nv), "stor"), linje("Finansieringsbehov, laveste saldo", kr(bh), "stor" + (bh > ramme ? " over" : "")));
      const maal = html("div", "behov-maal");
      const fyll = html("div", "behov-fyll" + (bh > ramme ? " over" : ""));
      fyll.style.width = (bh / behovMaks) * 100 + "%";
      const strek = html("div", "behov-ramme");
      strek.style.left = (ramme / behovMaks) * 100 + "%";
      maal.append(fyll, strek);
      k.appendChild(maal);
      if (bh > ramme) k.appendChild(html("p", "stempel", "Over rammen"));
      rad.appendChild(k);
    });
    r.appendChild(rad);
    r.appendChild(trinn(html("p", "fotnote res-note", `Den røde streken er rammen på ${kr(ramme)}.`), 9, undefined, 1000));
  }

  // Stegene
  const STEG = [
    { ramme: "data", akt: 0, tittel: "1 791 rader fra billettsystemet", tekst: "Hver prikk er én transaksjon i ordreeksporten fra Flytbillett for 2026.",
      notat: ["Rådataene ligger urørt. Alt annet bygger på dem.", "Vi bruker ordrene fordi de har én rad per kjøp og viser refusjoner."] },
    { ramme: "data", akt: 0, tittel: "Rensingen tar ut 21 rader", tekst: "16 avbrutte betalinger og 5 dobbeltførte transaksjoner på konsert 8 fjernes. Refusjonene blir med. Power Query gjør jobben.",
      notat: ["Refusjoner har negativt antall og må være med, ellers telles billetter som ble betalt tilbake.", "Duplikatene var alle på konsert 8. Uten dem stemmer konsert 8 mot oppgjøret."], vedInngang: () => tellNed(data.teller, 1791, 1770) },
    { ramme: "data", akt: 0, tittel: "Betalte billetter per konsert", tekst: "Radene summeres per konsert og avstemmes mot oppgjøret. Elleve stemmer krone for krone. Konsert 6 solgte flest.",
      notat: ["Konsert 10 i 2026 har 2 billetter færre i ordrene enn i oppgjøret. En refusjon etter utbetalingen forklarer det.", "Modellen bruker ordrene. Valget flytter nåverdien med under 1 000 kr."] },
    { ramme: "fors", akt: 1, tittel: "Konsert 6 møter forutsetningene", tekst: "Majas premiss er like mange billetter som i 2026. Vi følger konsert 6, Vesperhagen, resten av veien.",
      notat: ["Etterspørselsfaktoren er 100 % i basis. Scenarioene endrer den og pakkeprisen.", "Alle forutsetninger står på ett ark, og ingen tall er skrevet inn i formlene."] },
    { ramme: "fors", akt: 1, tittel: "Tre måter å betale for salen", tekst: "Salene skiller seg på hvor mange som får plass, og på når og hvordan leien betales.",
      notat: ["A er liten og billig per kveld. B har fast leie, mye betalt før start. C tar en andel av billettinntekten, etterskuddsvis."] },
    { ramme: "k6", akt: 2, tittel: "Konsert 6 i hver sal", tekst: "Salen setter tak på salget. Det som er igjen etter pakke, publikumsutgift og leie, er bidraget fra konserten.",
      notat: ["I Lune Sal får 230 ikke plass. Det er hovedgrunnen til at A taper.", "Billetter = det minste av etterspørselen og plassene i salen."], vedInngang: () => tellOppBidrag() },
    { ramme: "tid", akt: 2, tittel: "Pengene går ut før de kommer inn", tekst: "Pakken betales måneden før og i konsertmåneden. Billettpengene kommer først måneden etter.",
      notat: ["Alle betalinger regnes ved månedsslutt. Betalinger før januar ligger på t0.", "Det er denne forsinkelsen som gjør at Maja må ligge ute med penger."] },
    { ramme: "tolv", akt: 2, tittel: "Tolv konserter, samme regning", tekst: "Arket Konserter gjør det samme for alle tolv. Små konserter gir minus, de store bærer sesongen.",
      notat: ["En rad per konsert, samme formler nedover.", "Summen før diskontering er netto for sesongen. For B trekkes sesongleien fra."] },
    { ramme: "tolv", akt: 2, tittel: "Lagt sammen måned for måned", tekst: "Kontantstrøm summerer betalingene per måned. Den laveste saldoen er finansieringsbehovet.",
      notat: ["B er lavest i mars, 66 100 kr under rammen.", "Månedsslutt skjuler forfall inne i måneden, så det reelle behovet kan være litt større."] },
    { ramme: "res", akt: 3, tittel: "To tall per sal", tekst: "Nåverdien sier hva sesongen er verdt. Behovet sier om Maja har råd. B er verdt mest, men trenger mer enn rammen.",
      notat: ["Nåverdi: hver månedlig betaling diskontert med 4 % realrente per år.", "Finansieringsbehov: den laveste akkumulerte saldoen."] },
    { ramme: null, akt: 4, tittel: "Hele kjeden", tekst: "Data, forutsetninger, modell og resultat. Det samme regnes for hvert scenario, og det er der vi går videre.",
      notat: ["Lenken nederst åpner hele modellkartet med alle arkene og trådene."] },
  ];

  let steg = 0;
  function kamera(id) {
    if (id) {
      const [x, y] = RAMMER[id];
      verden.style.transform = `translate(${-x}px, ${-y}px) scale(1)`;
      verden.classList.remove("oversikt");
    } else {
      const s = Math.min(1560 / 5200, 600 / 2000);
      verden.style.transform = `translate(${(1600 - 5200 * s) / 2}px, ${230}px) scale(${s})`;
      verden.classList.add("oversikt");
    }
  }
  function vis(i, umiddelbart) {
    steg = Math.max(0, Math.min(STEG.length - 1, i));
    const st = STEG[steg];
    vindu.classList.toggle("umiddelbart", !!umiddelbart);
    kamera(st.ramme);
    for (const el of verden.querySelectorAll(".trinn")) {
      const fra = +el.dataset.fra, til = el.dataset.til !== undefined ? +el.dataset.til : Infinity;
      el.classList.toggle("synlig", steg >= fra && steg <= til);
    }
    const rekkefolge = ["fors", "k6", "tid", "tolv", "res"];
    const naadd = st.ramme ? rekkefolge.indexOf(st.ramme) : rekkefolge.length;
    biter.forEach(b => b.p.classList.toggle("tegnet", rekkefolge.indexOf(b.til) <= naadd));
    akter.forEach((li, j) => {
      li.classList.toggle("aktiv", j === st.akt);
      li.classList.toggle("ferdig", j < st.akt || st.akt === 4);
    });
    tittelEl.textContent = st.tittel;
    tekstEl.textContent = st.tekst;
    notatEl.innerHTML = "";
    notatEl.appendChild(html("p", "", `Modellen, steg ${steg + 1} av ${STEG.length}. Hvem: ikke bestemt`));
    const ul = html("ul");
    st.notat.forEach(t => ul.appendChild(html("li", "", t)));
    notatEl.appendChild(ul);
    // Tall som telles fram: vises ferdig utenfor sitt eget steg
    if (steg !== 1) data.teller.textContent = steg < 1 ? "1 791" : "1 770";
    if (steg !== 5) k6Bidrag.forEach(c => (c.textContent = nb(+c.dataset.verdi)));
    if (st.vedInngang && !umiddelbart) st.vedInngang();
    if (umiddelbart && steg === 1) data.teller.textContent = "1 770";
    if (umiddelbart && steg === 5) k6Bidrag.forEach(c => (c.textContent = nb(+c.dataset.verdi)));
    verden.dataset.steg = steg;
    if (umiddelbart) requestAnimationFrame(() => vindu.classList.remove("umiddelbart"));
    if (window.TUR && window.TUR.vedEndring) window.TUR.vedEndring(steg);
  }

  function tell(el, fra, til, ms, format) {
    if (roligst) { el.textContent = format(til); return; }
    const t0 = performance.now();
    const steg_ = t => {
      const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      el.textContent = format(fra + (til - fra) * e);
      if (p < 1) requestAnimationFrame(steg_);
    };
    requestAnimationFrame(steg_);
  }
  function tellNed(el, fra, til) { setTimeout(() => tell(el, fra, til, 900, nb), 500); }
  function tellOppBidrag() {
    k6Bidrag.forEach(c => (c.textContent = "0"));
    setTimeout(() => k6Bidrag.forEach(c => tell(c, 0, +c.dataset.verdi, 1100, nb)), roligst ? 0 : 1800);
  }

  return {
    antall: STEG.length,
    get steg() { return steg; },
    vis,
    neste() { if (steg < STEG.length - 1) { vis(steg + 1); return true; } return false; },
    forrige() { if (steg > 0) { vis(steg - 1); return true; } return false; },
    vedEndring: null,
  };
})();
