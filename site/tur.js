// Turen gjennom modellkartet: hele kartet først, så hver del (data, forutsetninger, modell, resultat).
// Hver del starter med en oversikt over lappene sine, og zoomer så inn på én lapp om gangen.
// Tavla ligger i en ramme (tavla.html?tur) og får beskjed om hvilke lapper som skal i fokus.
// På de dype stegene blir kortet til venstre bredt og kartet smalt, så tabellene får plass.
window.TUR = (() => {
  const G = window.GRAPH;
  const D = G.detaljer;
  const node = id => G.nodes.find(n => n.id === id);
  const celle = (id, navn) => (node(id).celler || []).find(c => c.navn === navn || c.adresse.endsWith("!" + navn));
  const verdi = (id, navn) => celle(id, navn).verdi;
  const nb = v => Math.round(v).toLocaleString("nb-NO").replace("−", "-");
  const kr = v => nb(v) + " kr";
  const pst = (v, d = 0) => (v * 100).toLocaleString("nb-NO", { maximumFractionDigits: d }) + " %";
  const fortegn = v => (v > 0 ? "+" : "") + nb(v);
  const dato = s => s.slice(8, 10) + "." + s.slice(5, 7);
  const SVG = "http://www.w3.org/2000/svg";

  const ramme = document.getElementById("tur-kart");
  if (!ramme) return null;
  const lysbilde = ramme.closest(".lysbilde");
  const tittelEl = document.getElementById("tur-tittel");
  const tekstEl = document.getElementById("tur-tekst");
  const kortEl = document.getElementById("tur-kort");
  const notatEl = document.getElementById("tur-notat");
  const akter = [...document.querySelectorAll("#akter li")];

  const K = G.konserter;
  const k6 = K.find(k => k.konsert === "K06");
  const artister = ["June Varde", "Mellomlys", "Liv Eik", "Blåtimekvartetten", "Ravlinje", "Vesperhagen",
    "Iben Vår", "Sølvregn", "Dobbeltspor", "Nattfiol", "Ada Mørk", "Glassmorgen"];
  const rammeKr = verdi("finans", "ramme");
  const sesongleie = verdi("avtale_b", "B_sesongleie") + verdi("avtale_b", "B_tilpasning");
  const navn = { A: "A: Lune Sal", B: "B: Søyleverket", C: "C: Skarvkaien", "avstå": "Avstå" };
  const bidrag = (k, a) => k["oppgjor_" + a] - k.pakke1 - k.pakke2 - k["publikum_" + a] - (a === "A" ? k.leie_A : a === "C" ? k.leie_C : 0);
  const kontrollerOk = D.kontroller.rader.filter(r => r[6] === "Ja").length;
  const BT = [["Ordinær", "#1d2433"], ["Tidlig", "#f2be22"], ["Student", "#2e6bd9"], ["Fribillett", "#b9bdc6"]];

  // Byggeklosser for kortene
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
  function kort(...barn) {
    const d = html("div");
    d.append(...barn.filter(Boolean));
    return d;
  }
  // Fargekodet stolpe for billettypene
  function billettStolpe(tall, bredde) {
    const d = html("div", "bt-stolpe");
    if (bredde) d.style.width = bredde;
    const sum = tall.reduce((a, b) => a + b, 0);
    tall.forEach((v, i) => {
      const s = html("span");
      s.style.flex = v / sum;
      s.style.background = BT[i][1];
      s.title = `${BT[i][0]}: ${v}`;
      d.appendChild(s);
    });
    return d;
  }
  function billettForklaring(tall) {
    const ul = html("ul", "bt-forklaring");
    BT.forEach(([t, farge], i) => {
      const li = html("li", "", tall ? `${t} ${nb(tall[i])}` : t);
      li.style.setProperty("--c", farge);
      ul.appendChild(li);
    });
    return ul;
  }
  function saldoFigur() {
    const S = G.saldo;
    const s = lag("svg", { class: "tk-saldo", viewBox: "0 0 440 250" });
    const P = { x1: 52, x2: 400, y1: 10, y2: 215 };
    const alle = [...S.A, ...S.B, ...S.C, -rammeKr];
    const ymin = Math.floor(Math.min(...alle) / 100000) * 100000 - 50000, ymax = Math.ceil(Math.max(...alle) / 100000) * 100000;
    const sx = i => P.x1 + (i / (S.maaneder.length - 1)) * (P.x2 - P.x1);
    const sy = v => P.y2 - ((v - ymin) / (ymax - ymin)) * (P.y2 - P.y1);
    s.appendChild(lag("rect", { class: "ille", x: P.x1, y: sy(-rammeKr), width: P.x2 - P.x1, height: P.y2 - sy(-rammeKr) }));
    for (let v = Math.ceil(ymin / 100000) * 100000; v <= ymax; v += 100000) {
      s.appendChild(lag("line", { class: v === 0 ? "akse" : "rutenett", x1: P.x1, x2: P.x2, y1: sy(v), y2: sy(v) }));
      s.appendChild(lag("text", { class: "aks", x: P.x1 - 6, y: sy(v) + 4, "text-anchor": "end" }, nb(v / 1000) + " k"));
    }
    S.maaneder.forEach((m, i) => s.appendChild(lag("text", { class: "aks", x: sx(i), y: P.y2 + 22, "text-anchor": "middle" }, m.startsWith("Før") ? "t0" : m.slice(0, 3))));
    s.appendChild(lag("line", { class: "rammestrek", x1: P.x1, x2: P.x2, y1: sy(-rammeKr), y2: sy(-rammeKr) }));
    for (const a of ["A", "C", "B"]) s.appendChild(lag("path", { class: "linje-" + a.toLowerCase(), d: S[a].map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ") }));
    const sist = S.A.length - 1;
    const ender = ["A", "B", "C"].map(a => ({ a, y: sy(S[a][sist]) + 5 })).sort((p, q) => p.y - q.y);
    for (let k = 1; k < ender.length; k++) ender[k].y = Math.max(ender[k].y, ender[k - 1].y + 16);
    for (const e of ender) s.appendChild(lag("text", { class: "merke", x: sx(sist) + 8, y: e.y }, e.a));
    const minB = Math.min(...S.B);
    s.appendChild(lag("circle", { class: "bunn", cx: sx(S.B.indexOf(minB)), cy: sy(minB), r: 5 }));
    return s;
  }
  function veiTilRad() {
    const ut = {};
    for (const e of G.edges) (ut[e.fra] ||= []).push(e);
    const kortest = (fra, til) => {
      for (const medStille of [false, true]) {
        const forrige = { [fra]: null }, ko = [fra];
        while (ko.length) {
          const n = ko.shift();
          if (n === til) { const v = []; for (let x = til; x !== null; x = forrige[x]) v.unshift(x); return v; }
          for (const e of ut[n] || []) { if ((e.quiet && !medStille) || e.til in forrige) continue; forrige[e.til] = n; ko.push(e.til); }
        }
      }
      return null;
    };
    const a = kortest("raa_ordrer", "nv"), b = kortest("nv", "rad");
    return a && b ? [...a, ...b.slice(1)] : kortest("raa_ordrer", "rad");
  }

  const nvTab = node("nv").scenarioer, bhTab = node("behov").scenarioer;
  const AV = D.avstemming.rader;           // kolonne 6 betalte (ordrer), 9 betalte (gebyr / 10), 12 avvik billetter, 15 status
  const KS = D.kontantstrom.rader;         // kolonne 2 faktor; A 3 til 9, B 10 til 16, C 17 til 23
  const ksKol = { A: 3, B: 10, C: 17 };    // første kolonne for hver avtale: inn, pakke, publikum, leie, netto, saldo, nåverdi
  const mndKort = m => (m.startsWith("Før") ? "t0" : m.slice(0, 3));

  const DATA = ["raa_ordrer", "raa_oppgjor", "ordrer_renset", "oppgjor", "avstemming"];
  const FORUTSETNINGER = ["scenario", "grunnlag", "salg", "pakke", "avtale_a", "avtale_b", "avtale_c", "finans"];

  const STEG = [
    // Oversikt
    { akt: -1, tittel: "Slik henger modellen sammen", tekst: "Hver lapp er et ark eller en gruppe navngitte celler. Trådene er formler. Vi tar én del om gangen, først oversikten og så hver lapp.",
      kart: null,
      kort: () => {
        const ul = html("ul", "tk-farger");
        for (const [farge, t] of [["#2e6bd9", "Data"], ["#f2be22", "Forutsetninger"], ["#e2477e", "Resultater"], ["#ee7a2c", "Usikkerhet"], ["#2c9d57", "Kontroller"]]) {
          const li = html("li", "", t);
          li.style.setProperty("--c", farge);
          ul.appendChild(li);
        }
        return kort(kortTittel("Slik leser du kartet"), ul, liten("Svart lapp er et ark. Hvit lapp er navngitte celler. Tykk tråd betyr mange formler. Underveis følger vi konsert 6, Vesperhagen, fredag 26. mars."));
      },
      notat: ["Data til venstre, forutsetninger, modellen i midten, resultatene til høyre.", "Hver del: først oversikten, så lappene én for én."] },

    // DATA
    { akt: 0, tittel: "Data: fem lapper", tekst: "Billettsystemet gir to filer. Power Query renser dem, og Avstemming sjekker at de stemmer med hverandre.",
      kart: { fokus: DATA, hoved: [] },
      kort: () => kort(kortTittel("Lappene"), linjer([
        [nb(D.raa.rader) + " rader", "Rå_ordrer: ordreeksporten, urørt"],
        [D.oppgjor.rader.length + " rader", "Rå_oppgjør: ett oppgjør per konsert"],
        [nb(D.avstemming.sum[4]) + " rader", "Ordrer_renset: uten avbrutte og doble"],
        [D.oppgjor.rader.length + " rader", "Oppgjør: med riktige datatyper"],
        [`${AV.filter(r => r[15] === "Stemmer").length} av ${AV.length}`, "Avstemming: konserter som stemmer"],
      ])),
      notat: ["Rådataene ligger urørt. Alt annet bygger på dem.", "Vi går gjennom lappene én for én."] },
    { akt: 0, dyp: true, tittel: "Rå_ordrer: én rad per transaksjon", tekst: "Ordreeksporten fra Flytbillett, slik den kom. Både kjøp og refusjoner, og noen betalinger som aldri ble fullført.",
      kart: { fokus: ["raa_ordrer"], hoved: ["raa_ordrer"] },
      kort: () => {
        const rader = [["Transaksjon", "Tidspunkt", "Konsert", "Type", "Status", "Billettype", "Antall", "Beløp"],
          ...D.raa.eksempel.map(r => ({ cls: r[4] === "Avbrutt" ? "avbrutt" : "", celler: [r[0], r[1], r[2], r[3], r[4], r[5], String(r[6]), nb(r[7])] }))];
        const bt = D.billettyper.sum.slice(1, 5);
        return kort(kortTittel("De første radene"), tabell(rader, "tett"),
          linjer([
            [nb(D.raa.rader), `rader: ${nb(D.raa.ordrer)} ordrer og ${D.raa.refusjoner} refusjoner`],
            [nb(D.raa.fullfort), `fullført, ${D.raa.avbrutt} avbrutt`],
            [nb(D.raa.kanal.Nett || 0), `på nett, ${D.raa.kanal.Skranke || 0} i skranken og ${D.raa.kanal["Arrangør"] || 0} fra arrangøren`],
          ]),
          kortTittel("Billetter i 2026 etter type"), billettStolpe(bt), billettForklaring(bt),
          liten(`${pst(D.billettyper.sum[6])} av de betalte billettene hadde student- eller tidligrabatt. Rabattene forsvinner i 2027.`));
      },
      notat: ["Én rad er én transaksjon, ikke én billett. Antall sier hvor mange billetter.", "Refusjoner har negativt antall og viser til ordren de gjelder."] },
    { akt: 0, dyp: true, tittel: "Rensingen: 21 rader tas ut", tekst: "Power Query fjerner betalinger som ble avbrutt og rader som er ført to ganger. Refusjonene blir med.",
      kart: { fokus: ["raa_ordrer", "ordrer_renset"], hoved: ["ordrer_renset"] },
      kort: () => {
        const avb = html("div", "tk-chips");
        for (const [id, k, type, antall, belop] of D.avbrutte) {
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
      notat: ["Avbrutte betalinger ga ingen penger, så de skal ikke telles.", "Duplikatene er identiske rader med samme transaksjonsnummer. Med dem ville konsert 8 hatt 14 billetter for mye."] },
    { akt: 0, dyp: true, tittel: "Oppgjøret: ett per konsert", tekst: "Flytbillett betaler ut billettinntekten etter hver konsert, minus gebyret. Gebyret er 10 kr per betalt billett.",
      kart: { fokus: ["raa_oppgjor", "oppgjor"], hoved: ["oppgjor"] },
      kort: () => {
        const O = D.oppgjor;   // kolonner: Arrangement, Konsertdato, måned, Betalt dato, Lokale, Lokalenavn, Kapasitet, Fribilletter, Oppmøte, Gebyr, Utbetalt
        return kort(tabell([["Konsert", "Dato", "Lokale i 2026", "Kapasitet", "Betalte", "Utbetalt", "Betalt"],
          ...O.rader.map(r => ({ cls: r[0] === "K06" ? "merket" : "", celler: [r[0], dato(r[1]), r[5], nb(r[6]), nb(r[9] / 10), nb(r[10]), dato(r[3])] }))], "tett"),
          liten("Betalte billetter i oppgjøret = gebyr / 10. Oppgjøret kommer måneden etter konserten, og det samme antar vi for 2027."));
      },
      notat: ["Konsert 6 i Maskinhallen: 480 betalte billetter, 153 950 kr utbetalt 9. april.", "K03 og K04 ble betalt etter den 20. i måneden etter, utenfor Flytbilletts egen regel."] },
    { akt: 0, dyp: true, tittel: "Avstemming: ordrer mot oppgjør", tekst: "Betalte billetter fra ordrene sammenlignes med oppgjøret, konsert for konsert.",
      kart: { fokus: ["ordrer_renset", "oppgjor", "avstemming"], hoved: ["avstemming"] },
      kort: () => {
        const BTr = D.billettyper.rader;
        const maks = Math.max(...BTr.map(r => r[5]));
        return kort(tabell([["Konsert", "Ordrer", "Oppgjør", "Avvik", "Billettyper"],
          ...AV.map((r, i) => ({ cls: r[15] !== "Stemmer" ? "avvik" : r[0] === "K06" ? "merket" : "", celler: [
            r[0], nb(r[6]), nb(r[9]), [r[12] ? fortegn(r[12]) : "0", r[12] ? "rod" : ""],
            billettStolpe(BTr[i].slice(1, 5), (BTr[i][5] / maks) * 220 + "px")] }))], "tett"),
          billettForklaring(),
          liten("Konsert 10: ordrene har 2 billetter færre enn oppgjøret. En refusjon ble registrert etter at oppgjøret var betalt. Modellen bruker ordrene, og valget flytter nåverdien med under 1 000 kr."));
      },
      notat: ["Elleve av tolv stemmer krone for krone.", "Avstemmingen viser at summene stemmer, ikke at hver enkelt ordre er riktig."] },

    // FORUTSETNINGER
    { akt: 1, tittel: "Forutsetninger: åtte lapper", tekst: "Alt modellen antar står på ett ark. Ingen tall er skrevet inn i formlene.",
      kart: { fokus: FORUTSETNINGER, hoved: [] },
      kort: () => kort(kortTittel("Lappene"), linjer([
        [`${D.scenarioer.rader.length} scenarioer`, "Scenariovelger: basis er valgt"],
        ["Ordrer", "Grunnlag 2026: hvilke tall 2027 bygger på"],
        [kr(verdi("salg", "billettpris")), "Salg og billett: pris, gebyr og utgift per billett"],
        [kr(verdi("pakke", "pakkepris")), "Pakke fra Rigg & Ro per konsert"],
        ["A, B og C", "De tre tilbudene om sal"],
        [`${pst(verdi("finans", "realrente"))} og ${nb(rammeKr / 1000)} k`, "Rente og ramme"],
      ])),
      notat: ["Ett sted å endre en forutsetning. Alt annet følger."] },
    { akt: 1, dyp: true, tittel: "Scenariovelgeren", tekst: "Fem scenarioer, og ett er aktivt om gangen. Scenarioet styrer etterspørselen og pakkeprisen.",
      kart: { fokus: ["scenario"], hoved: ["scenario"] },
      kort: () => kort(tabell([["Nr", "Scenario", "Salg", "Pakke", "Begrunnelse"],
        ...D.scenarioer.rader.map(r => ({ cls: r[0] === 1 ? "merket" : r[0] === 5 ? "graa" : "", celler: [String(r[0]), r[1], pst(r[2]), nb(r[3]), [r[4], "begrunnelse"]] }))], "tett"),
        liten("Salg er andel av salget på tilsvarende konsert i 2026. Scenario 5 er en oppside og inngår ikke i beslutningsreglene.")),
      notat: ["Lav etterspørsel: 1 203 av 3 380 betalte billetter i 2026 var rabatterte og blir dyrere.", "Nivåene er gruppas antakelser og står begrunnet i arket."] },
    { akt: 1, dyp: true, tittel: "Salg og billett", tekst: "Hvor mange billetter som selges, og hva hver billett gir inn og koster ut.",
      kart: { fokus: ["grunnlag", "salg"], hoved: ["salg"] },
      kort: () => {
        const pris = verdi("salg", "billettpris"), gebyr = verdi("salg", "billettgebyr");
        return kort(kortTittel("Per billett"), linjer([
          [kr(pris), "billettpris, lik for alle i 2027"],
          ["- " + kr(gebyr), "gebyr til Flytbillett", "minus"],
          ["= " + kr(pris - gebyr), "inn per billett, måneden etter konserten", "sum"],
          [kr(verdi("salg", "publikumsutgift")), "publikumsutgift per billett, i konsertmåneden"],
        ]), kortTittel("Antall billetter"), linjer([
          [pst(verdi("salg", "ettersp_faktor")), "etterspørsel, fra scenarioet"],
          [pst(verdi("salg", "lokal_A")), "lokaleeffekt, lik i alle saler"],
          [`${nb(k6.grunnlag)} × 100 %`, "= 480 billetter vil kjøpe til konsert 6"],
        ]));
      },
      notat: ["Billetter = betalte i 2026 × etterspørsel × lokaleeffekt, men aldri flere enn plassene i salen.", "Grunnlag 2026 velger om vi bruker ordrene eller oppgjøret."] },
    { akt: 1, dyp: true, tittel: "Pakke, rente og ramme", tekst: "Pakken fra Rigg & Ro dekker artister og produksjon. Renten diskonterer, rammen er det Maja kan ligge ute med.",
      kart: { fokus: ["pakke", "finans"], hoved: ["pakke", "finans"] },
      kort: () => kort(kortTittel("Pakken"), linjer([
        [kr(verdi("pakke", "pakkepris")), "per konsert, fast pris"],
        [pst(verdi("pakke", "pakke_andel_for")), "betales måneden før, resten i konsertmåneden"],
        [kr(verdi("pakke", "pakkepris") * 12), "for tolv konserter, uansett salg"],
      ]), kortTittel("Rente og ramme"), linjer([
        [pst(verdi("finans", "realrente")), `realrente per år, ${pst(Math.pow(1 + verdi("finans", "realrente"), 1 / 12) - 1, 3)} per måned`],
        [kr(rammeKr), "startfinansiering, ikke avklart"],
      ])),
      notat: ["Pakken er den største kostnaden og er lik i alle salene.", "Månedsfaktoren er (1,04)^(t/12)."] },
    { akt: 1, dyp: true, tittel: "Tre tilbud om sal", tekst: "Salene skiller seg på hvor mange som får plass, og på når og hvordan leien betales.",
      kart: { fokus: ["avtale_a", "avtale_b", "avtale_c"], hoved: ["avtale_a", "avtale_b", "avtale_c"] },
      kort: () => {
        const rad = html("div", "tk-saler");
        const regler = {
          A: [`${verdi("avtale_a", "plasser_A")} plasser`, `${kr(verdi("avtale_a", "leie_A"))} per konsert`, "betales i konsertmåneden"],
          B: [`${verdi("avtale_b", "plasser_B")} plasser`, `${kr(verdi("avtale_b", "B_sesongleie"))} sesongleie + ${kr(verdi("avtale_b", "B_tilpasning"))} tilpasning`, "halvparten ved t0, resten i mars"],
          C: [`${verdi("avtale_c", "plasser_C")} plasser`, `${pst(verdi("avtale_c", "C_andel"))} av oppgjøret, minst ${kr(verdi("avtale_c", "C_min"))}`, "betales måneden etter"],
        };
        for (const a of ["A", "B", "C"]) {
          const k = html("div", "tk-sal");
          const img = html("img");
          img.src = `img/sal-${a.toLowerCase()}.jpg`;
          img.alt = "Salen i " + navn[a].slice(3);
          const ul = html("ul");
          regler[a].forEach((t, j) => ul.appendChild(html("li", j === 0 ? "stor" : "", t)));
          k.append(img, html("h3", "", navn[a]), ul);
          rad.appendChild(k);
        }
        return kort(rad, liten("A har fast leie per kveld. B har fast leie for sesongen, mye betalt før start. C tar en andel av billettinntekten, etterskuddsvis."));
      },
      notat: ["Forskjellen er ikke bare hvor mye, men når pengene går ut.", "Kapasiteten er salgbare plasser fra tilbudene, ikke tallene på nettsidene."] },

    // MODELL
    { akt: 2, tittel: "Modellen: fire lapper", tekst: "Konserter regner hver konsert. Kontantstrøm legger betalingene i riktig måned. Til slutt nåverdi og behov.",
      kart: { fokus: ["konserter", "kontantstrom", "nv", "behov"], hoved: [] },
      kort: () => kort(kortTittel("Lappene"), linjer([
        ["12 rader", "Konserter: billetter, inn og ut per konsert og sal"],
        ["8 måneder", "Kontantstrøm: fra t0 til juli, per sal"],
        ["4 %", "Nåverdi: hver måned diskontert"],
        ["laveste saldo", "Finansieringsbehov"],
      ])),
      notat: ["Samme formler nedover hver tabell, ingen tall skrevet inn."] },
    { akt: 2, dyp: true, tittel: "Konserter: billetter per sal", tekst: "Billetter er det minste av etterspørselen og plassene i salen. Lune Sal har bare 250 plasser.",
      kart: { fokus: ["grunnlag", "salg", "avtale_a", "avtale_b", "avtale_c", "konserter"], hoved: ["konserter"] },
      kort: () => {
        const sum = a => K.reduce((t, k) => t + k["billetter_" + a], 0);
        const total = K.reduce((t, k) => t + k.grunnlag, 0);
        return kort(tabell([["Konsert", "Vil kjøpe", "A", "B", "C"],
          ...K.map((k, i) => ({ cls: k.konsert === "K06" ? "merket" : "", celler: [`${i + 1} ${artister[i]}`, nb(k.grunnlag),
            ...["A", "B", "C"].map(a => [nb(k["billetter_" + a]), k["billetter_" + a] < k.grunnlag ? "rod" : ""])] })),
          { cls: "sum", celler: ["Sum", nb(total), nb(sum("A")), nb(sum("B")), nb(sum("C"))] }], "tett"),
          liten(`Rødt: salen er full. A mister ${nb(total - sum("A"))} billetter over sesongen, B og C ${nb(total - sum("C"))}.`));
      },
      notat: ["Seks konserter sprenger Lune Sal. Bare konsert 6 sprenger B og C.", "Ingen konsert i 2026 var helt full, så salget er reell etterspørsel."] },
    { akt: 2, dyp: true, tittel: "Konsert 6 regnet ut", tekst: "Inn er billettoppgjøret. Ut er pakken, publikumsutgiften og leien. Det som er igjen er bidraget.",
      kart: { fokus: ["konserter"], hoved: ["konserter"] },
      kort: () => kort(tabell([
        ["Konsert 6, Vesperhagen", "A", "B", "C"],
        ["Billetter", ...["A", "B", "C"].map(a => [nb(k6["billetter_" + a]), k6["billetter_" + a] < k6.grunnlag ? "rod" : ""])],
        ["Billettoppgjør, april", ...["A", "B", "C"].map(a => [fortegn(k6["oppgjor_" + a]), "gronn"])],
        ["Pakke, februar og mars", ...["A", "B", "C"].map(() => [fortegn(-(k6.pakke1 + k6.pakke2)), "rod"])],
        ["Publikumsutgift, mars", ...["A", "B", "C"].map(a => [fortegn(-k6["publikum_" + a]), "rod"])],
        ["Leie", [fortegn(-k6.leie_A), "rod"], ["sesongleie", "svak"], [fortegn(-k6.leie_C), "rod"]],
        { cls: "sum", celler: ["Bidrag", ...["A", "B", "C"].map(a => nb(bidrag(k6, a)))] },
      ]), liten(`Leien i C er 18 % av ${kr(k6.oppgjor_C)}. B betaler ${kr(sesongleie)} for hele sesongen i tillegg, uansett salg.`)),
      notat: ["Dette er én rad i arket Konserter. De andre elleve regnes likt.", "I Lune Sal får 230 ikke plass, og bidraget blir lite."] },
    { akt: 2, dyp: true, tittel: "Kontantstrøm: måned for måned", tekst: "Betalingene fra alle tolv konsertene legges i riktig måned. Saldoen er summen så langt.",
      kart: { fokus: ["konserter", "avtale_b", "finans", "kontantstrom"], hoved: ["kontantstrom"] },
      kort: () => {
        const min = a => Math.min(...KS.map(r => r[ksKol[a] + 5]));
        const tab = tabell([["Måned", "Saldo A", "Saldo B", "Saldo C"],
          ...KS.map(r => [mndKort(r[1]), ...["A", "B", "C"].map(a => {
            const v = r[ksKol[a] + 5];
            return [nb(v), v === min(a) ? (v < -rammeKr ? "rod bunn" : "bunn") : ""];
          })])], "tett");
        const rad = html("div", "tk-side-om-side");
        rad.append(tab, saldoFigur());
        return kort(rad, liten(`B betaler ${kr(-KS[0][ksKol.B + 4])} ved t0 og er lavest i mars. Uthevet: laveste saldo for hver sal.`));
      },
      notat: ["Billettpengene kommer måneden etter, pakken går ut før. Derfor går saldoen ned først.", "Månedsslutt skjuler forfall inne i måneden."] },
    { akt: 2, dyp: true, tittel: "Nåverdi og finansieringsbehov", tekst: "Hver måneds netto diskonteres til t0. Behovet er den laveste saldoen i løpet av sesongen.",
      kart: { fokus: ["kontantstrom", "nv", "behov"], hoved: ["nv", "behov"] },
      kort: () => {
        const c = ksKol.C;
        const tab = tabell([["C: Skarvkaien", "Faktor", "Netto", "Nåverdi"],
          ...KS.map(r => [mndKort(r[1]), r[2].toLocaleString("nb-NO", { minimumFractionDigits: 4, maximumFractionDigits: 4 }), nb(r[c + 4]), nb(r[c + 6])]),
          { cls: "sum", celler: ["Sum", "", nb(KS.reduce((t, r) => t + r[c + 4], 0)), nb(KS.reduce((t, r) => t + r[c + 6], 0))] }], "tett");
        const sam = tabell([["", "Nåverdi", "Behov"],
          ...["A", "B", "C"].map(a => { const bh = verdi("behov", "behov_" + a); return [navn[a], nb(verdi("nv", "nv_" + a)), [nb(bh), bh > rammeKr ? "rod" : ""]]; })], "tett");
        const rad = html("div", "tk-side-om-side");
        rad.append(tab, sam);
        return kort(rad, liten(`Faktoren er 1 / 1,04^(t/12). Rammen er ${kr(rammeKr)}, så B trenger mer enn Maja har.`));
      },
      notat: ["Nåverdien er litt lavere enn summen fordi pengene kommer senere.", "Behovet: det største beløpet Maja ligger ute med."] },

    // RESULTAT
    { akt: 3, tittel: "Resultat: seks lapper", tekst: "Resultater samler tallene. Kontrollene sjekker modellen. Usikkerhet regner alt på nytt for hvert scenario.",
      kart: { fokus: ["resultater", "kontroller", "usikkerhet", "grenser", "kapasitet", "rad"], hoved: [] },
      kort: () => kort(kortTittel("Lappene"), linjer([
        ["4 handlinger", "Resultater: hovedtall og beslutningsregler"],
        [`${kontrollerOk} av ${D.kontroller.rader.length}`, "Kontroller som er OK"],
        [`${nvTab.scenarioer.length} scenarioer`, "Usikkerhet: datatabeller og følsomhet"],
        ["salgsnivå", "Grenser: der resultatet snur"],
        ["kildeoppgaven", "Kapasitet: hva utleierne oppgir"],
        [verdi("resultater", "J26"), "Rådet til Maja"],
      ])),
      notat: ["Resultater er det eneste arket Maja trenger å se."] },
    { akt: 3, dyp: true, tittel: "Resultater: hovedtallene", tekst: "Fire handlinger, to mål. Nåverdien sier hva sesongen er verdt, behovet om Maja har råd.",
      kart: { fokus: ["nv", "behov", "resultater"], hoved: ["resultater"] },
      kort: () => {
        const H = D.hovedtall.rader;   // Handling, Lokale, Billetter, Netto, Nåverdi, Behov, Holder rammen?, Mangler, Laveste saldo i
        return kort(tabell([["Handling", "Billetter", "Netto", "Nåverdi", "Behov", "Holder?", "Mangler"],
          ...H.map(r => [r[0] === "Avstå" ? "Avstå" : `${r[0]}: ${r[1]}`, nb(r[2]), nb(r[3]), nb(r[4]), [nb(r[5]), r[6] === "Nei" ? "rod" : ""], [r[6], r[6] === "Nei" ? "rod" : "gronn"], r[7] ? nb(r[7]) : ""])]),
          liten("Basis-scenarioet. Netto er summen av alle betalinger, nåverdien er diskontert."));
      },
      notat: ["B har høyest nåverdi, men mangler 66 100 kr.", "C er best av dem som holder rammen."] },
    { akt: 3, dyp: true, tittel: `Kontroller: ${kontrollerOk} av ${D.kontroller.rader.length} OK`, tekst: "Forventningen ble skrevet før regningen. Resultater viser om alle er OK.",
      kart: { fokus: ["kontroller"], hoved: ["kontroller"] },
      kort: () => {
        const ul = html("ol", "tk-kontroller");
        for (const r of D.kontroller.rader) {
          const li = html("li", r[6] === "Ja" ? "ok" : "feil");
          li.append(html("span", "nr", String(r[0])), html("span", "", r[1]));
          ul.appendChild(li);
        }
        return kort(ul, liten("Typer: telling mot CSV-fila, uavhengig regning per konsert, grensetilfeller og fasit regnet i Python."));
      },
      notat: ["Velg én kontroll å forklare, for eksempel uavhengig netto: summert per konsert mot Kontantstrøm."] },
    { akt: 3, dyp: true, tittel: "Usikkerhet: fem scenarioer", tekst: "Datatabellene regner hele modellen på nytt for hvert scenario. Rødt er over rammen.",
      kart: { fokus: ["scenario", "nv", "behov", "usikkerhet", "dt_hjelp"], hoved: ["usikkerhet"] },
      kort: () => {
        const S = nvTab.scenarioer;
        const hode = ["", ...S.map(s => s.replace(" etterspørsel", " ettersp.").replace("Høyere pakkepris", "Dyrere pakke"))];
        const avtaler = nvTab.rader.filter(r => r.handling !== "avstå");
        const nvT = tabell([hode, ...avtaler.map(r => [r.handling, ...r.verdier.map((v, i) => [nb(v), (v < 0 ? "rod" : "") + (i === 4 ? " graa" : "")])])], "tett");
        const bhT = tabell([hode, ...bhTab.rader.filter(r => r.handling !== "avstå").map(r => [r.handling, ...r.verdier.map((v, i) => [nb(v), (v > rammeKr ? "rod" : "gronn") + (i === 4 ? " graa" : "")])])], "tett");
        return kort(kortTittel("Nåverdi"), nvT, kortTittel("Finansieringsbehov"), bhT,
          liten("C holder rammen i tre av fire stresscenarioer. Ingen holder når salget faller og pakken blir dyrere samtidig. Siste kolonne er bare til informasjon."));
      },
      notat: ["Neste sider viser dette interaktivt."] },
    { akt: 3, dyp: true, tittel: "Beslutningsreglene", tekst: "Rådet avhenger av hvor mye risiko Maja vil ta. Fire regler, og vi anbefaler den første.",
      kart: { fokus: ["resultater", "rad"], hoved: ["rad"] },
      kort: () => {
        const d = html("div", "tk-regler");
        D.regler.forEach(([regel, tekst, valg], i) => {
          const r = html("div", "tk-regel" + (i === 0 ? " anbefalt" : ""));
          r.append(html("b", "valg", valg), html("p", "navn", regel), html("p", "", tekst));
          d.appendChild(r);
        });
        return kort(d);
      },
      notat: ["Regel 1: pakkeprisen er kjent før signering, så den er et vilkår, ikke en risiko.", "Regel 2 gir avstå fordi ingen holder i det samlede scenarioet."] },

    // Slutt
    { akt: 4, tittel: "Hele veien fra data til råd", tekst: "Rådet kan følges tilbake tråd for tråd til billettene fra 2026.",
      kart: { vei: true },
      kort: () => {
        const ol = html("ol", "tk-vei");
        for (const id of veiTilRad()) ol.appendChild(html("li", "", node(id).label));
        return kort(kortTittel("Veien"), ol);
      },
      notat: ["Lenken nederst til venstre åpner kartet i eget vindu, der man kan trykke på hver lapp."] },
  ];

  let steg = 0;
  function send() {
    if (ramme.contentWindow) ramme.contentWindow.postMessage({ tur: STEG[steg].kart }, "*");
  }
  ramme.addEventListener("load", send);
  // Når kartet endrer størrelse (dypt steg), må tavla tilpasse seg på nytt etter overgangen
  ramme.parentElement.addEventListener("transitionend", e => { if (e.propertyName === "width") send(); });

  function vis(i) {
    steg = Math.max(0, Math.min(STEG.length - 1, i));
    const st = STEG[steg];
    if (!ramme.src) ramme.src = ramme.dataset.src;
    lysbilde.classList.toggle("dyp", !!st.dyp);
    send();
    akter.forEach((li, j) => {
      li.classList.toggle("aktiv", j === st.akt || st.akt === 4);
      li.classList.toggle("ferdig", j < st.akt);
    });
    tittelEl.textContent = st.tittel;
    tekstEl.textContent = st.tekst;
    kortEl.classList.remove("synlig");
    kortEl.innerHTML = "";
    kortEl.appendChild(st.kort());
    requestAnimationFrame(() => kortEl.classList.add("synlig"));
    notatEl.innerHTML = "";
    notatEl.appendChild(html("p", "", `Modellen, steg ${steg + 1} av ${STEG.length}. Hvem: ikke bestemt`));
    const ul = html("ul");
    st.notat.forEach(t => ul.appendChild(html("li", "", t)));
    notatEl.appendChild(ul);
    if (window.TUR && window.TUR.vedEndring) window.TUR.vedEndring(steg);
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
