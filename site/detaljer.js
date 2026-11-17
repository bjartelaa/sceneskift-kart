// Tall og tabeller fra arbeidsboka for hver lapp: hva vi har gjort, vist med modellens egne data.
// Brukes av turen (tur.js) og av panelet i tavla (app.js), så tallene er like begge steder.
window.DETALJER = (() => {
  const G = window.GRAPH;
  const D = G.detaljer;
  const node = id => G.nodes.find(n => n.id === id);
  const celle = (id, navn) => (node(id).celler || []).find(c => c.navn === navn || c.adresse.endsWith("!" + navn));
  const verdi = (id, navn) => celle(id, navn).verdi;
  const nb = v => Math.round(v).toLocaleString("nb-NO").replace("−", "-");
  const kr = v => nb(v) + " kr";
  const pst = (v, d = 0) => (v * 100).toLocaleString("nb-NO", { maximumFractionDigits: d }) + " %";
  const fortegn = v => (v > 0 ? "+" : "") + nb(v);
  const dato = s => s.slice(8, 10) + "." + s.slice(5, 7);
  const SVG = "http://www.w3.org/2000/svg";

  const K = G.konserter;
  const k6 = K.find(k => k.konsert === "K06");
  const artister = ["June Varde", "Mellomlys", "Liv Eik", "Blåtimekvartetten", "Ravlinje", "Vesperhagen",
    "Iben Vår", "Sølvregn", "Dobbeltspor", "Nattfiol", "Ada Mørk", "Glassmorgen"];
  const rammeKr = verdi("finans", "ramme");
  const sesongleie = verdi("avtale_b", "B_sesongleie") + verdi("avtale_b", "B_tilpasning");
  const navn = { A: "A: Lune Sal", B: "B: Søyleverket", C: "C: Skarvkaien" };
  const bidrag = (k, a) => k["oppgjor_" + a] - k.pakke1 - k.pakke2 - k["publikum_" + a] - (a === "A" ? k.leie_A : a === "C" ? k.leie_C : 0);
  const kontrollerOk = D.kontroller.rader.filter(r => r[6] === "Ja").length;
  const BT = [["Ordinær", "#1d2433"], ["Tidlig", "#f2be22"], ["Student", "#2e6bd9"], ["Fribillett", "#b9bdc6"]];
  const KANAL = [["Nett", "#1d2433"], ["Skranke", "#ee7a2c"], ["Arrangør", "#b9bdc6"]];
  const AV = D.avstemming.rader;           // kolonne 6 betalte (ordrer), 9 betalte (gebyr / 10), 12 avvik billetter, 15 status
  const KS = D.kontantstrom.rader;         // kolonne 2 faktor; A 3 til 9, B 10 til 16, C 17 til 23
  const ksKol = { A: 3, B: 10, C: 17 };    // første kolonne for hver avtale: inn, pakke, publikum, leie, netto, saldo, nåverdi
  const mndKort = m => (m.startsWith("Før") ? "t0" : m.slice(0, 3));
  const nvTab = node("nv").scenarioer, bhTab = node("behov").scenarioer;

  // Byggeklosser
  function html(tag, cls, tekst) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  }
  function lag(tag, attrs = {}, tekst) {
    const e = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (tekst !== undefined) e.textContent = tekst;
    return e;
  }
  const kortTittel = t => html("p", "tk-tittel", t);
  const liten = t => html("p", "tk-liten", t);
  function linjer(rader) {
    const d = html("div", "tk-linjer");
    for (const [tall, tekst, cls] of rader) {
      const r = html("div", "tk-linje " + (cls || ""));
      r.append(html("b", "", tall), html("span", "", tekst));
      d.appendChild(r);
    }
    return d;
  }
  // rader: første rad er hodet. En celle kan være tekst, [tekst, klasse] eller et element.
  // En rad kan være { cls, celler } for å merke hele raden.
  function tabell(rader, cls = "") {
    const t = html("table", "tk-tabell " + cls);
    rader.forEach((rad, i) => {
      const tr = html("tr", i === 0 ? "hode" : rad.cls || "");
      (rad.celler || rad).forEach((c, j) => {
        const td = html(i === 0 || j === 0 ? "th" : "td");
        if (c instanceof Node) td.appendChild(c);
        else if (Array.isArray(c)) { td.textContent = c[0]; td.className = c[1]; }
        else td.textContent = c;
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    return t;
  }
  function side(...barn) {
    const d = html("div", "tk-side-om-side tk-billettvei");
    d.append(...barn);
    return d;
  }
  function kort(...barn) {
    const d = html("div");
    d.append(...barn.filter(Boolean));
    return d;
  }
  // Fargekodet stolpe for billettypene
  function billettStolpe(tall, bredde, farger = BT) {
    const d = html("div", "bt-stolpe");
    if (bredde) d.style.width = bredde;
    const sum = tall.reduce((a, b) => a + b, 0);
    tall.forEach((v, i) => {
      const s = html("span");
      s.style.flex = v / sum;
      s.style.background = farger[i][1];
      s.title = `${farger[i][0]}: ${v}`;
      d.appendChild(s);
    });
    return d;
  }
  // tall gir antall bak navnet, andel gir prosent av summen i stedet
  function billettForklaring(tall, farger = BT, andel = false) {
    const ul = html("ul", "bt-forklaring");
    const sum = tall ? tall.reduce((a, b) => a + b, 0) : 0;
    farger.forEach(([t, farge], i) => {
      const li = html("li", "", tall ? `${t} ${andel ? pst(tall[i] / sum, 1) : nb(tall[i])}` : t);
      li.style.setProperty("--c", farge);
      ul.appendChild(li);
    });
    return ul;
  }
  // bred: større og bredere figur når den står alene over tabellen (turen)
  function saldoFigur(bred = false) {
    const S = G.saldo;
    const s = lag("svg", { class: "tk-saldo" + (bred ? " bred" : ""), viewBox: bred ? "0 0 780 300" : "0 0 440 250" });
    const P = bred ? { x1: 70, x2: 730, y1: 12, y2: 262 } : { x1: 52, x2: 400, y1: 10, y2: 215 };
    const alle = [...S.A, ...S.B, ...S.C, -rammeKr];
    const ymin = Math.floor(Math.min(...alle) / 100000) * 100000 - 50000, ymax = Math.ceil(Math.max(...alle) / 100000) * 100000;
    const sx = i => P.x1 + (i / (S.maaneder.length - 1)) * (P.x2 - P.x1);
    const sy = v => P.y2 - ((v - ymin) / (ymax - ymin)) * (P.y2 - P.y1);
    s.appendChild(lag("rect", { class: "ille", x: P.x1, y: sy(-rammeKr), width: P.x2 - P.x1, height: P.y2 - sy(-rammeKr) }));
    for (let v = Math.ceil(ymin / 100000) * 100000; v <= ymax; v += 100000) {
      s.appendChild(lag("line", { class: v === 0 ? "akse" : "rutenett", x1: P.x1, x2: P.x2, y1: sy(v), y2: sy(v) }));
      s.appendChild(lag("text", { class: "aks", x: P.x1 - 6, y: sy(v) + 4, "text-anchor": "end" }, nb(v / 1000) + " k"));
    }
    S.maaneder.forEach((m, i) => s.appendChild(lag("text", { class: "aks", x: sx(i), y: P.y2 + (bred ? 28 : 22), "text-anchor": "middle" }, mndKort(m))));
    s.appendChild(lag("line", { class: "rammestrek", x1: P.x1, x2: P.x2, y1: sy(-rammeKr), y2: sy(-rammeKr) }));
    for (const a of ["A", "C", "B"]) s.appendChild(lag("path", { class: "linje-" + a.toLowerCase(), d: S[a].map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ") }));
    const sist = S.A.length - 1;
    const ender = ["A", "B", "C"].map(a => ({ a, y: sy(S[a][sist]) + 5 })).sort((p, q) => p.y - q.y);
    for (let k = 1; k < ender.length; k++) ender[k].y = Math.max(ender[k].y, ender[k - 1].y + (bred ? 22 : 16));
    for (const e of ender) s.appendChild(lag("text", { class: "merke", x: sx(sist) + 10, y: e.y }, e.a));
    const minB = Math.min(...S.B);
    s.appendChild(lag("circle", { class: "bunn", cx: sx(S.B.indexOf(minB)), cy: sy(minB), r: 5 }));
    return s;
  }

  // Ett kort per sal, brukt både alene (lappen for salen) og samlet
  const salRegler = {
    A: () => [`${verdi("avtale_a", "plasser_A")} plasser`, `${kr(verdi("avtale_a", "leie_A"))} per konsert`, "betales i konsertmåneden"],
    B: () => [`${verdi("avtale_b", "plasser_B")} plasser`, `${kr(verdi("avtale_b", "B_sesongleie"))} sesongleie + ${kr(verdi("avtale_b", "B_tilpasning"))} tilpasning`, "halvparten ved t0, resten i mars"],
    C: () => [`${verdi("avtale_c", "plasser_C")} plasser`, `${pst(verdi("avtale_c", "C_andel"))} av oppgjøret, minst ${kr(verdi("avtale_c", "C_min"))}`, "betales måneden etter"],
  };
  function salKort(a) {
    const k = html("div", "tk-sal");
    const img = html("img");
    img.src = `img/sal-${a.toLowerCase()}.jpg`;
    img.alt = "Salen i " + navn[a].slice(3);
    const ul = html("ul");
    salRegler[a]().forEach((t, j) => ul.appendChild(html("li", j === 0 ? "stor" : "", t)));
    k.append(img, html("h3", "", navn[a]), ul);
    return k;
  }
  function salLapp(a) {
    const sum = K.reduce((t, k) => t + k["billetter_" + a], 0);
    const fulle = K.filter(k => k["billetter_" + a] < k.grunnlag).length;
    return {
      gjort: [`Tilbudet fra utleieren lagt inn som forutsetninger: plasser, leie og når leien betales.`,
        `Med ${salRegler[a]()[0]} blir det ${nb(sum)} billetter over sesongen. ${fulle ? `${fulle} ${fulle === 1 ? "konsert" : "konserter"} blir fulle.` : "Ingen konserter blir fulle."}`],
      kort: () => kort(salKort(a), linjer([
        [kr(verdi("nv", "nv_" + a)), "nåverdi i basis"],
        [kr(verdi("behov", "behov_" + a)), verdi("behov", "behov_" + a) > rammeKr ? "finansieringsbehov, over rammen" : "finansieringsbehov, innenfor rammen", verdi("behov", "behov_" + a) > rammeKr ? "minus" : ""],
      ])),
    };
  }

  // Per lapp: gjort = hva vi har gjort og funnet, kort = tallene fra arbeidsboka
  const LAPP = {
    raa_ordrer: {
      gjort: ["Ordreeksporten fra Flytbillett lastet inn med Power Query, slik den kom.",
        "Én rad er én transaksjon, ikke én billett. Antall sier hvor mange billetter.",
        "Refusjoner har negativt antall og viser til ordren de gjelder."],
      kort: () => {
        const rader = [["Transaksjon", "Tidspunkt", "Konsert", "Type", "Status", "Billettype", "Antall", "Beløp"],
          ...D.raa.eksempel.map(r => ({ cls: r[4] === "Avbrutt" ? "avbrutt" : "", celler: [r[0], r[1], r[2], r[3], r[4], r[5], String(r[6]), nb(r[7])] }))];
        const bt = D.billettyper.sum.slice(1, 5);
        const V = D.billettvei, kanal = KANAL.map(([k]) => V.kanal[k] || 0);
        const ut = (led, tekst) => ["- " + nb(Math.abs(led[1])), `${tekst} (${led[0]} rader)`, "minus"];
        return kort(kortTittel("De første radene"), tabell(rader, "tett"),
          linjer([[nb(D.raa.rader), `rader, består av ${nb(D.raa.ordrer)} ordrer og ${D.raa.refusjoner} refusjoner`]]),
          side(kort(kortTittel("Fra rader til betalte billetter"),
            linjer([
              [nb(V.ordrer[1]), `billetter i de ${nb(V.ordrer[0])} ordrene`],
              ut(V.avbrutt, "avbrutte betalinger"),
              ut(V.duplikater, "ført to ganger"),
              ut(V.refusjoner, "refundert"),
              ut(V.fri, "fribilletter fra arrangøren"),
              ["= " + nb(V.betalte[1]), "betalte billetter, netto: de som ga inntekt", "sum"],
            ])),
          kort(kortTittel("Billetter i 2026 etter kanal"), billettStolpe(kanal, null, KANAL), billettForklaring(kanal, KANAL, true),
            kortTittel("Billetter i 2026 etter type"), billettStolpe(bt), billettForklaring(bt))),
          liten(`${pst(D.billettyper.sum[6])} av de betalte billettene hadde student- eller tidligrabatt. Rabattene forsvinner i 2027.`));
      },
    },
    raa_oppgjor: {
      gjort: ["Oppgjørsfila fra Flytbillett lastet inn med Power Query, urørt.",
        `${D.oppgjor.rader.length} rader, ett oppgjør per konsert. Tallene vises under Oppgjør.`],
    },
    ordrer_renset: {
      gjort: ["Power Query fjerner betalinger som ble avbrutt. De ga ingen penger, så de skal ikke telles.",
        "Rader som er ført to ganger fjernes. Med dem ville konsert 8 hatt 14 billetter for mye.",
        "Refusjonene blir med, så salget er netto."],
      kort: () => {
        const avb = html("div", "tk-chips");
        for (const [id, k, type, antall] of D.avbrutte) {
          const c = html("div", "chip");
          c.append(html("b", "", id.replace("FB-26-", "")), html("span", "", `${k.replace("K0", "K")}, ${type}, ${antall} bill.`));
          avb.appendChild(c);
        }
        const dup = html("div", "tk-chips");
        for (const [id, k, antall] of D.duplikater) {
          const c = html("div", "chip dup");
          c.append(html("b", "", id.replace("FB-26-", "")), html("span", "", `${k.replace("K0", "K")}, ${antall} bill., to ganger`));
          dup.appendChild(c);
        }
        const avbBill = D.avbrutte.reduce((a, r) => a + r[3], 0), avbKr = D.avbrutte.reduce((a, r) => a + r[4], 0);
        return kort(
          kortTittel(`${D.avbrutte.length} avbrutte betalinger (${avbBill} billetter, ${kr(avbKr)})`), avb,
          kortTittel(`${D.duplikater.length} dobbeltførte, alle på konsert 8`), dup,
          linjer([[`${nb(D.raa.rader)} - ${D.avbrutte.length} - ${D.duplikater.length}`, `= ${nb(D.avstemming.sum[4])} rader i modellen. Refusjonene blir med: ${D.avstemming.sum[5]} rader.`, "sum"]]));
      },
    },
    oppgjor: {
      gjort: ["Riktige datatyper satt i Power Query, ellers urørt.",
        "Betalte billetter i oppgjøret = gebyr / 10. Oppgjøret kommer måneden etter konserten, og det samme antar vi for 2027.",
        "K03 og K04 ble betalt etter den 20. i måneden etter, utenfor Flytbilletts egen regel."],
      kort: () => {
        const O = D.oppgjor;   // kolonner: Arrangement, Konsertdato, måned, Betalt dato, Lokale, Lokalenavn, Kapasitet, Fribilletter, Oppmøte, Gebyr, Utbetalt
        return kort(tabell([["Konsert", "Dato", "Lokale i 2026", "Kapasitet", "Betalte", "Utbetalt", "Betalt"],
          ...O.rader.map(r => [r[0], dato(r[1]), r[5], nb(r[6]), nb(r[9] / 10), nb(r[10]), dato(r[3])])], "tett"));
      },
    },
    avstemming: {
      gjort: ["Betalte billetter fra ordrene sammenlignet med oppgjøret, konsert for konsert.",
        `${AV.filter(r => r[15] === "Stemmer").length} av ${AV.length} stemmer. Avstemmingen viser at summene stemmer, ikke at hver enkelt ordre er riktig.`],
      kort: () => {
        const BTr = D.billettyper.rader;
        const maks = Math.max(...BTr.map(r => r[5]));
        return kort(tabell([["Konsert", "Ordrer", "Oppgjør", "Avvik", "Billettyper"],
          ...AV.map((r, i) => ({ cls: r[15] !== "Stemmer" ? "avvik" : "", celler: [
            r[0], nb(r[6]), nb(r[9]), [r[12] ? fortegn(r[12]) : "0", r[12] ? "rod" : ""],
            billettStolpe(BTr[i].slice(1, 5), (BTr[i][5] / maks) * 100 + "%")] }))], "tett"),
          billettForklaring(),
          liten("Konsert 10: ordrene har 2 billetter færre enn oppgjøret. En refusjon ble registrert etter at oppgjøret var betalt. Modellen bruker ordrene, og valget flytter nåverdien med under 1 000 kr."));
      },
    },
    scenario: {
      gjort: ["Fem scenarioer, ett aktivt om gangen. Scenarioet styrer etterspørselen og pakkeprisen.",
        "Nivåene er gruppas antakelser og står begrunnet i arket.",
        "Scenario 5 er en oppside og inngår ikke i beslutningsreglene."],
      kort: () => kort(tabell([["Nr", "Scenario", "Salg", "Pakke", "Begrunnelse"],
        ...D.scenarioer.rader.map(r => ({ cls: r[0] === 1 ? "merket" : r[0] === 5 ? "graa" : "", celler: [String(r[0]), r[1], pst(r[2]), nb(r[3]), [r[4], "begrunnelse"]] }))], "tett"),
        liten("Salg er andel av salget på tilsvarende konsert i 2026.")),
    },
    salg: {
      gjort: ["Billetter = betalte i 2026 × etterspørsel × lokaleeffekt, men aldri flere enn plassene i salen.",
        "Alle billetter koster det samme i 2027, fordi student- og tidligrabatten fjernes."],
      kort: () => {
        const pris = verdi("salg", "billettpris"), gebyr = verdi("salg", "billettgebyr");
        return kort(kortTittel("Per billett"), linjer([
          [kr(pris), "billettpris, lik for alle i 2027"],
          ["- " + kr(gebyr), "gebyr til Flytbillett", "minus"],
          ["= " + kr(pris - gebyr), "inn per billett, måneden etter konserten", "sum"],
          [kr(verdi("salg", "publikumsutgift")), "publikumsutgift per billett, i konsertmåneden"],
        ]), kortTittel("Antall billetter, konsert 6"), linjer([
          [pst(verdi("salg", "ettersp_faktor")), "etterspørsel, fra scenarioet"],
          [pst(verdi("salg", "lokal_A")), "lokaleeffekt, lik i alle saler"],
          [`${nb(k6.grunnlag)} × 100 %`, `= ${nb(k6.grunnlag)} billetter vil kjøpe til konsert 6`],
        ]));
      },
    },
    pakke: {
      gjort: ["Pakken fra Rigg & Ro dekker artister og produksjon. Den er den største kostnaden og er lik i alle salene."],
      kort: () => kort(linjer([
        [kr(verdi("pakke", "pakkepris")), "per konsert, fast pris"],
        [pst(verdi("pakke", "pakke_andel_for")), "betales måneden før, resten i konsertmåneden"],
        [kr(verdi("pakke", "pakkepris") * 12), "for tolv konserter, uansett salg"],
      ])),
    },
    finans: {
      gjort: ["Renten diskonterer betalingene til t0. Rammen er det Maja kan ligge ute med."],
      kort: () => kort(linjer([
        [pst(verdi("finans", "realrente")), `realrente per år, ${pst(Math.pow(1 + verdi("finans", "realrente"), 1 / 12) - 1, 3)} per måned`],
        [kr(rammeKr), "startfinansiering, ikke avklart"],
      ])),
    },
    avtale_a: salLapp("A"),
    avtale_b: salLapp("B"),
    avtale_c: salLapp("C"),
    konserter: {
      gjort: ["Én rad per konsert og samme formler nedover. Ingen tall skrevet inn.",
        "Billetter er det minste av etterspørselen og plassene i salen.",
        "Inn er billettoppgjøret. Ut er pakken, publikumsutgiften og leien. Det som er igjen er bidraget."],
      kort: () => {
        const sum = a => K.reduce((t, k) => t + k["billetter_" + a], 0);
        const total = K.reduce((t, k) => t + k.grunnlag, 0);
        return kort(kortTittel("Billetter per sal"), tabell([["Konsert", "Vil kjøpe", "A", "B", "C"],
          ...K.map((k, i) => ({ cls: k.konsert === "K06" ? "merket" : "", celler: [`${i + 1} ${artister[i]}`, nb(k.grunnlag),
            ...["A", "B", "C"].map(a => [nb(k["billetter_" + a]), k["billetter_" + a] < k.grunnlag ? "rod" : ""])] })),
          { cls: "sum", celler: ["Sum", nb(total), nb(sum("A")), nb(sum("B")), nb(sum("C"))] }], "tett"),
          liten(`Rødt: salen er full. A mister ${nb(total - sum("A"))} billetter over sesongen, B og C ${nb(total - sum("C"))}.`),
          kortTittel("Konsert 6 regnet ut"), tabell([
            ["Konsert 6, Vesperhagen", "A", "B", "C"],
            ["Billetter", ...["A", "B", "C"].map(a => [nb(k6["billetter_" + a]), k6["billetter_" + a] < k6.grunnlag ? "rod" : ""])],
            ["Billettoppgjør, april", ...["A", "B", "C"].map(a => [fortegn(k6["oppgjor_" + a]), "gronn"])],
            ["Pakke, februar og mars", ...["A", "B", "C"].map(() => [fortegn(-(k6.pakke1 + k6.pakke2)), "rod"])],
            ["Publikumsutgift, mars", ...["A", "B", "C"].map(a => [fortegn(-k6["publikum_" + a]), "rod"])],
            ["Leie", [fortegn(-k6.leie_A), "rod"], ["sesongleie", "svak"], [fortegn(-k6.leie_C), "rod"]],
            { cls: "sum", celler: ["Bidrag", ...["A", "B", "C"].map(a => nb(bidrag(k6, a)))] },
          ], "tett"),
          liten(`Leien i C er ${pst(verdi("avtale_c", "C_andel"))} av ${kr(k6.oppgjor_C)}. B betaler ${kr(sesongleie)} for hele sesongen i tillegg, uansett salg.`));
      },
    },
    kontantstrom: {
      gjort: ["Betalingene fra alle tolv konsertene lagt i riktig måned, fra t0 til juli. Saldoen er summen så langt.",
        "Billettpengene kommer måneden etter, pakken går ut før. Derfor går saldoen ned først.",
        "Månedsslutt skjuler forfall inne i måneden."],
      // stablet: figuren over tabellen, begge i full bredde (turen). Ellers side om side (panelet på tavla)
      kort: (stablet = false) => {
        const min = a => Math.min(...KS.map(r => r[ksKol[a] + 5]));
        const tab = tabell([["Måned", "Saldo A", "Saldo B", "Saldo C"],
          ...KS.map(r => [mndKort(r[1]), ...["A", "B", "C"].map(a => {
            const v = r[ksKol[a] + 5];
            return [nb(v), v === min(a) ? (v < -rammeKr ? "rod bunn" : "bunn") : ""];
          })])], "tett");
        const rad = html("div", stablet ? "tk-stablet" : "tk-side-om-side");
        if (stablet) rad.append(saldoFigur(true), tab);
        else rad.append(tab, saldoFigur());
        return kort(rad, liten(`B betaler ${kr(-KS[0][ksKol.B + 4])} ved t0 og er lavest i mars. Uthevet: laveste saldo for hver sal.`));
      },
    },
    nv: {
      gjort: ["Hver måneds netto diskontert til t0 med faktoren 1 / 1,04^(t/12).",
        "Nåverdien er litt lavere enn summen fordi pengene kommer senere."],
      kort: () => {
        const c = ksKol.C;
        return kort(kortTittel("Eksempel: C, Skarvkaien"), tabell([["Måned", "Faktor", "Netto", "Nåverdi"],
          ...KS.map(r => [mndKort(r[1]), r[2].toLocaleString("nb-NO", { minimumFractionDigits: 4, maximumFractionDigits: 4 }), nb(r[c + 4]), nb(r[c + 6])]),
          { cls: "sum", celler: ["Sum", "", nb(KS.reduce((t, r) => t + r[c + 4], 0)), nb(KS.reduce((t, r) => t + r[c + 6], 0))] }], "tett"),
          kortTittel("Alle salene"), tabell([["", "Nåverdi"], ...["A", "B", "C"].map(a => [navn[a], nb(verdi("nv", "nv_" + a))])], "tett"));
      },
    },
    behov: {
      gjort: ["Behovet er den laveste saldoen i løpet av sesongen: det største beløpet Maja ligger ute med.",
        `Sammenlignet med rammen på ${kr(rammeKr)}.`],
      kort: () => kort(tabell([["", "Behov", "Mot rammen"],
        ...["A", "B", "C"].map(a => {
          const bh = verdi("behov", "behov_" + a);
          return [navn[a], [nb(bh), bh > rammeKr ? "rod" : ""], [bh > rammeKr ? `${nb(bh - rammeKr)} over` : `${nb(rammeKr - bh)} under`, bh > rammeKr ? "rod" : "gronn"]];
        })], "tett")),
    },
    resultater: {
      gjort: ["Nåverdi og behov for fire handlinger samlet på ett ark: A, B, C eller avstå.",
        "Resultater er det eneste arket Maja trenger å se."],
      kort: () => {
        const H = D.hovedtall.rader;   // Handling, Lokale, Billetter, Netto, Nåverdi, Behov, Holder rammen?, Mangler, Laveste saldo i
        return kort(tabell([["Handling", "Billetter", "Netto", "Nåverdi", "Behov", "Holder?", "Mangler"],
          ...H.map(r => [r[0] === "Avstå" ? "Avstå" : `${r[0]}: ${r[1]}`, nb(r[2]), nb(r[3]), nb(r[4]), [nb(r[5]), r[6] === "Nei" ? "rod" : ""], [r[6], r[6] === "Nei" ? "rod" : "gronn"], r[7] ? nb(r[7]) : ""])], "tett"),
          liten("Basis-scenarioet. Netto er summen av alle betalinger, nåverdien er diskontert."));
      },
    },
    kontroller: {
      gjort: ["Forventningen ble skrevet før regningen, så kontrollene kan slå feil.",
        "Typer: telling mot CSV-fila, uavhengig regning per konsert, grensetilfeller og fasit regnet i Python.",
        `${kontrollerOk} av ${D.kontroller.rader.length} er OK.`],
      kort: () => {
        const ul = html("ol", "tk-kontroller");
        for (const r of D.kontroller.rader) {
          const li = html("li", r[6] === "Ja" ? "ok" : "feil");
          li.append(html("span", "nr", String(r[0])), html("span", "", r[1]));
          ul.appendChild(li);
        }
        return kort(ul);
      },
    },
    usikkerhet: {
      gjort: ["Datatabellene regner hele modellen på nytt for hvert scenario.",
        "C holder rammen i tre av fire stresscenarioer. Ingen holder når salget faller og pakken blir dyrere samtidig."],
      kort: () => {
        const S = nvTab.scenarioer;
        const hode = ["", ...S.map(s => s.replace(" etterspørsel", " ettersp.").replace("Høyere pakkepris", "Dyrere pakke"))];
        const nvT = tabell([hode, ...nvTab.rader.filter(r => r.handling !== "avstå").map(r => [r.handling, ...r.verdier.map((v, i) => [nb(v), (v < 0 ? "rod" : "") + (i === 4 ? " graa" : "")])])], "tett");
        const bhT = tabell([hode, ...bhTab.rader.filter(r => r.handling !== "avstå").map(r => [r.handling, ...r.verdier.map((v, i) => [nb(v), (v > rammeKr ? "rod" : "gronn") + (i === 4 ? " graa" : "")])])], "tett");
        return kort(kortTittel("Nåverdi"), nvT, kortTittel("Finansieringsbehov"), bhT,
          liten("Rødt: negativ nåverdi eller over rammen. Siste kolonne er bare til informasjon."));
      },
    },
    rad: {
      gjort: ["Rådet avhenger av hvor mye risiko Maja vil ta. Fire regler, og vi anbefaler den første.",
        "Pakkeprisen er kjent før signering, så den er et vilkår, ikke en risiko."],
      kort: () => {
        const d = html("div", "tk-regler");
        D.regler.forEach(([regel, tekst, valg], i) => {
          const r = html("div", "tk-regel" + (i === 0 ? " anbefalt" : ""));
          r.append(html("b", "valg", valg), html("p", "navn", regel), html("p", "", tekst));
          d.appendChild(r);
        });
        return kort(d);
      },
    },
  };

  return { G, D, node, verdi, nb, kr, pst, fortegn, rammeKr, html, lag, kortTittel, liten, linjer, tabell, kort,
    billettStolpe, billettForklaring, saldoFigur, LAPP };
})();
