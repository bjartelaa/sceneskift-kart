// Turen gjennom modellkartet: hele kartet først, så én del om gangen.
// Tavla ligger i en ramme (tavla.html?tur) og får beskjed om hvilke lapper som skal i fokus.
// Til venstre står forklaringen og et konkret eksempel: konsert 6, Vesperhagen.
window.TUR = (() => {
  const G = window.GRAPH;
  const node = id => G.nodes.find(n => n.id === id);
  const celle = (id, navn) => (node(id).celler || []).find(c => c.navn === navn || c.adresse.endsWith("!" + navn));
  const verdi = (id, navn) => celle(id, navn).verdi;
  const nb = v => Math.round(v).toLocaleString("nb-NO").replace("−", "-");
  const kr = v => nb(v) + " kr";
  const fortegn = v => (v > 0 ? "+" : "") + nb(v);
  const SVG = "http://www.w3.org/2000/svg";

  const ramme = document.getElementById("tur-kart");
  if (!ramme) return null;
  const tittelEl = document.getElementById("tur-tittel");
  const tekstEl = document.getElementById("tur-tekst");
  const kortEl = document.getElementById("tur-kort");
  const notatEl = document.getElementById("tur-notat");
  const akter = [...document.querySelectorAll("#akter li")];

  const K = G.konserter;
  const k6 = K.find(k => k.konsert === "K06");
  const ramme_ = verdi("finans", "ramme");
  const sesongleie = verdi("avtale_b", "B_sesongleie") + verdi("avtale_b", "B_tilpasning");
  const navn = { A: "A: Lune Sal", B: "B: Søyleverket", C: "C: Skarvkaien" };
  const bidrag = (k, a) => k["oppgjor_" + a] - k.pakke1 - k.pakke2 - k["publikum_" + a] - (a === "A" ? k.leie_A : a === "C" ? k.leie_C : 0);

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
  // Rader med tall til venstre og forklaring til høyre
  function linjer(rader) {
    const d = html("div", "tk-linjer");
    for (const [tall, tekst, cls] of rader) {
      const r = html("div", "tk-linje " + (cls || ""));
      r.append(html("b", "", tall), html("span", "", tekst));
      d.appendChild(r);
    }
    return d;
  }
  // Liten tabell: første rad er hodet
  function tabell(rader) {
    const t = html("table", "tk-tabell");
    rader.forEach((rad, i) => {
      const tr = html("tr", i === 0 ? "hode" : rad.cls || "");
      (rad.celler || rad).forEach((c, j) => {
        const td = html(i === 0 || j === 0 ? "th" : "td");
        if (Array.isArray(c)) { td.textContent = c[0]; td.className = c[1]; } else td.textContent = c;
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    return t;
  }
  const kortTittel = t => html("p", "tk-tittel", t);

  function saldoFigur() {
    const S = G.saldo;
    const s = lag("svg", { class: "tk-saldo", viewBox: "0 0 440 230" });
    const P = { x1: 52, x2: 400, y1: 10, y2: 200 };
    const alle = [...S.A, ...S.B, ...S.C, -ramme_];
    const ymin = Math.floor(Math.min(...alle) / 100000) * 100000 - 50000, ymax = Math.ceil(Math.max(...alle) / 100000) * 100000;
    const sx = i => P.x1 + (i / (S.maaneder.length - 1)) * (P.x2 - P.x1);
    const sy = v => P.y2 - ((v - ymin) / (ymax - ymin)) * (P.y2 - P.y1);
    s.appendChild(lag("rect", { class: "ille", x: P.x1, y: sy(-ramme_), width: P.x2 - P.x1, height: P.y2 - sy(-ramme_) }));
    for (let v = Math.ceil(ymin / 100000) * 100000; v <= ymax; v += 100000) {
      s.appendChild(lag("line", { class: v === 0 ? "akse" : "rutenett", x1: P.x1, x2: P.x2, y1: sy(v), y2: sy(v) }));
      s.appendChild(lag("text", { class: "aks", x: P.x1 - 6, y: sy(v) + 4, "text-anchor": "end" }, nb(v / 1000) + " k"));
    }
    S.maaneder.forEach((m, i) => s.appendChild(lag("text", { class: "aks", x: sx(i), y: P.y2 + 22, "text-anchor": "middle" }, m.startsWith("Før") ? "t0" : m.slice(0, 3))));
    s.appendChild(lag("line", { class: "rammestrek", x1: P.x1, x2: P.x2, y1: sy(-ramme_), y2: sy(-ramme_) }));
    for (const a of ["A", "C", "B"]) s.appendChild(lag("path", { class: "linje-" + a.toLowerCase(), d: S[a].map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join(" ") }));
    const sist = S.A.length - 1;
    const ender = ["A", "B", "C"].map(a => ({ a, y: sy(S[a][sist]) + 5 })).sort((p, q) => p.y - q.y);
    for (let k = 1; k < ender.length; k++) ender[k].y = Math.max(ender[k].y, ender[k - 1].y + 16);
    for (const e of ender) s.appendChild(lag("text", { class: "merke", x: sx(sist) + 8, y: e.y }, e.a));
    const minB = Math.min(...S.B);
    s.appendChild(lag("circle", { class: "bunn", cx: sx(S.B.indexOf(minB)), cy: sy(minB), r: 5 }));
    return s;
  }

  // Veien fra rådata til rådet, samme regel som tavla bruker
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

  const bhTab = node("behov").scenarioer;
  const holder = a => bhTab.scenarioer.slice(0, 4).filter((_, i) => bhTab.rader.find(r => r.handling === a).verdier[i] <= ramme_).length;

  const STEG = [
    { akt: -1, tittel: "Slik henger modellen sammen", tekst: "Hver lapp er et ark eller en gruppe navngitte celler. Trådene er formler. Vi går gjennom kartet fra venstre mot høyre.",
      kart: null,
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Slik leser du kartet"));
        const ul = html("ul", "tk-farger");
        for (const [farge, t] of [["#2e6bd9", "Data"], ["#f2be22", "Forutsetninger"], ["#e2477e", "Resultater"], ["#ee7a2c", "Usikkerhet"], ["#2c9d57", "Kontroller"]]) {
          const li = html("li", "", t);
          li.style.setProperty("--c", farge);
          ul.appendChild(li);
        }
        d.appendChild(ul);
        d.appendChild(html("p", "tk-liten", "Svart lapp er et ark. Hvit lapp er navngitte celler. Tykk tråd betyr mange formler. Underveis følger vi konsert 6, Vesperhagen, fredag 26. mars."));
        return d;
      },
      notat: ["Start med oversikten: data til venstre, forutsetninger, modellen i midten, resultatene til høyre.", "Si at vi følger én konsert gjennom kartet for å gjøre det konkret."] },
    { akt: 0, tittel: "Data: billettene fra 2026", tekst: "Ordrene renses i Power Query og avstemmes mot oppgjøret, konsert for konsert.",
      kart: { fokus: ["raa_ordrer", "raa_oppgjor", "ordrer_renset", "oppgjor", "avstemming"], hoved: ["avstemming"] },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Rensingen"));
        d.appendChild(linjer([["1 791", "rader i ordreeksporten"], ["-16", "avbrutte betalinger", "minus"], ["-5", "dobbeltførte, alle på konsert 8", "minus"], ["1 770", "rader igjen, refusjonene med", "sum"]]));
        d.appendChild(kortTittel("Konsert 6"));
        d.appendChild(linjer([[nb(k6.grunnlag), k6.ordrer === k6.oppgjor ? "betalte billetter, stemmer med oppgjøret" : "betalte billetter"]]));
        return d;
      },
      notat: ["Rådataene ligger urørt. Power Query lager de rensede tabellene.", "Elleve konserter stemmer krone for krone. Konsert 10 avviker med 2 billetter, forklart av en refusjon etter oppgjøret."] },
    { akt: 1, tittel: "Forutsetninger: alt på ett ark", tekst: "Scenario, billettpris, pakke, de tre avtalene og rammen. Ingen tall er skrevet inn i formlene.",
      kart: { fokus: ["scenario", "grunnlag", "salg", "pakke", "avtale_a", "avtale_b", "avtale_c", "finans"], hoved: [] },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Konsert 6 i basis"));
        d.appendChild(linjer([
          [nb(k6.grunnlag) + " × 100 %", "= " + nb(k6.grunnlag) + " billetter etterspurt"],
          [kr(verdi("salg", "billettpris") - verdi("salg", "billettgebyr")), "inn per billett (350 minus 10 i gebyr), måneden etter"],
          [kr(verdi("pakke", "pakkepris")), "pakke fra Rigg & Ro, halvparten måneden før"],
        ]));
        d.appendChild(kortTittel("Tre avtaler"));
        d.appendChild(linjer([
          [`${verdi("avtale_a", "plasser_A")} plasser`, `A: ${kr(verdi("avtale_a", "leie_A"))} per konsert`],
          [`${verdi("avtale_b", "plasser_B")} plasser`, `B: ${kr(sesongleie)} for sesongen`],
          [`${verdi("avtale_c", "plasser_C")} plasser`, `C: 18 % av oppgjøret, minst ${kr(verdi("avtale_c", "C_min"))}`],
        ]));
        return d;
      },
      notat: ["Scenariovelgeren styrer etterspørselsfaktor og pakkepris. Alt annet følger.", "Grunnlag 2026 velger om modellen bruker ordrene eller oppgjøret."] },
    { akt: 2, tittel: "Konserter: én rad per konsert", tekst: "Billetter er det minste av etterspørselen og plassene i salen. Så regnes inn og ut for hver konsert.",
      kart: { fokus: ["ordrer_renset", "oppgjor", "grunnlag", "salg", "pakke", "avtale_a", "avtale_b", "avtale_c", "konserter"], hoved: ["konserter"] },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Konsert 6 i hver sal"));
        const ut = a => -(k6.pakke1 + k6.pakke2 + k6["publikum_" + a] + (a === "A" ? k6.leie_A : a === "C" ? k6.leie_C : 0));
        d.appendChild(tabell([
          ["", "A", "B", "C"],
          ["Billetter", ...["A", "B", "C"].map(a => [nb(k6["billetter_" + a]), k6["billetter_" + a] < k6.grunnlag - 100 ? "rod" : ""])],
          ["Inn", ...["A", "B", "C"].map(a => [fortegn(k6["oppgjor_" + a]), "gronn"])],
          ["Ut", ...["A", "B", "C"].map(a => [fortegn(ut(a)), "rod"])],
          { cls: "sum", celler: ["Bidrag", ...["A", "B", "C"].map(a => nb(bidrag(k6, a)))] },
        ]));
        d.appendChild(html("p", "tk-liten", `I Lune Sal får ${k6.grunnlag - k6.billetter_A} ikke plass. B betaler ${kr(sesongleie)} i sesongleie i tillegg, uansett salg.`));
        return d;
      },
      notat: ["Ut er pakken, publikumsutgiften og leien. For B ligger leien utenfor, i Kontantstrøm.", "Samme formler for alle tolv radene. Små konserter gir minus, de store bærer sesongen."] },
    { akt: 2, tittel: "Kontantstrøm: når pengene går", tekst: "Hver betaling legges i riktig måned. Pakken går ut før konserten, billettpengene kommer måneden etter.",
      kart: { fokus: ["konserter", "avtale_b", "finans", "kontantstrom"], hoved: ["kontantstrom"] },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Konsert 6 i C"));
        const mnd = ["t0", "januar", "februar", "mars", "april", "mai", "juni", "juli"];
        d.appendChild(linjer([
          [fortegn(-k6.pakke1), `${mnd[k6.mnd_pakke1]}: pakke del 1`, "minus"],
          [fortegn(-(k6.pakke2 + k6.publikum_C)), `${mnd[k6.mnd]}: pakke del 2 og publikumsutgift`, "minus"],
          [fortegn(k6.oppgjor_C - k6.leie_C), `${mnd[k6.mnd_oppgjor]}: oppgjøret minus leien`, "pluss"],
        ]));
        d.appendChild(kortTittel("Saldo ved månedsslutt, alle tolv"));
        d.appendChild(saldoFigur());
        return d;
      },
      notat: ["Alle betalinger regnes ved månedsslutt, før januar ligger på t0.", "B er lavest i mars, 66 100 kr under rammen. Månedsslutt skjuler forfall inne i måneden."] },
    { akt: 2, tittel: "Nåverdi og finansieringsbehov", tekst: "Nåverdien diskonterer hver måned med 4 % realrente. Behovet er den laveste saldoen.",
      kart: { fokus: ["kontantstrom", "nv", "behov"], hoved: ["nv", "behov"] },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("To tall per sal, basis"));
        d.appendChild(tabell([
          ["", "Nåverdi", "Behov"],
          ...["A", "B", "C"].map(a => {
            const bh = verdi("behov", "behov_" + a);
            return [navn[a], nb(verdi("nv", "nv_" + a)), [nb(bh), bh > ramme_ ? "rod" : ""]];
          }),
        ]));
        d.appendChild(html("p", "tk-liten", `Rammen er ${kr(ramme_)}. B er verdt mest, men trenger mer enn Maja har.`));
        return d;
      },
      notat: ["Nåverdi: sum av betalingene diskontert til t0 med (1,04)^(t/12).", "Finansieringsbehov: det største beløpet Maja ligger ute med i løpet av sesongen."] },
    { akt: 3, tittel: "Resultater og rådet", tekst: "Resultater samler tallene, sjekker kontrollene og bruker beslutningsregelen.",
      kart: { fokus: ["nv", "behov", "resultater", "kontroller", "kapasitet", "rad"], hoved: ["resultater", "rad"] },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Regelen"));
        d.appendChild(html("p", "tk-tekst", "Høyest nåverdi blant avtalene som holder rammen både i basis og ved lav etterspørsel."));
        const svar = html("p", "tk-svar");
        svar.append(html("span", "", "Rådet: "), html("b", "", verdi("resultater", "J26")));
        d.appendChild(svar);
        d.appendChild(html("p", "tk-liten", `Kontrollene: ${verdi("resultater", "C5")}.`));
        return d;
      },
      notat: ["Kontrollene er skrevet før regningen, og Resultater viser om alle er OK.", "Kapasitet er kildeoppgaven: salgbare plasser, ikke kapasiteten på nettsiden."] },
    { akt: 3, tittel: "Det samme for hvert scenario", tekst: "Datatabellene i Usikkerhet regner hele modellen på nytt for hvert scenario og for følsomheten.",
      kart: { fokus: ["scenario", "nv", "behov", "usikkerhet", "dt_hjelp", "grenser", "figurer"], hoved: ["usikkerhet"] },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Holder rammen, av fire scenarioer"));
        d.appendChild(linjer(["A", "B", "C"].map(a => [`${holder(a)} av 4`, navn[a], holder(a) >= 3 ? "pluss" : holder(a) === 0 ? "minus" : ""])));
        // Nivåene står i Forutsetninger, scenarioene 1 til 5
        d.appendChild(html("p", "tk-liten", "Basis, lav etterspørsel (80 %), høyere pakkepris (66 000 kr) og begge samtidig. Høy etterspørsel (120 %) er bare til informasjon."));
        return d;
      },
      notat: ["Neste sider viser scenarioene og usikkerheten i detalj."] },
    { akt: 4, tittel: "Hele veien fra data til råd", tekst: "Rådet kan følges tilbake tråd for tråd til billettene fra 2026.",
      kart: { vei: true },
      kort: () => {
        const d = html("div");
        d.appendChild(kortTittel("Veien"));
        const ol = html("ol", "tk-vei");
        for (const id of veiTilRad()) ol.appendChild(html("li", "", node(id).label));
        d.appendChild(ol);
        return d;
      },
      notat: ["Lenken nederst til venstre åpner kartet i eget vindu, der man kan trykke på hver lapp."] },
  ];

  let steg = 0;
  function send() {
    if (ramme.contentWindow) ramme.contentWindow.postMessage({ tur: STEG[steg].kart }, "*");
  }
  ramme.addEventListener("load", send);

  function vis(i) {
    steg = Math.max(0, Math.min(STEG.length - 1, i));
    const st = STEG[steg];
    if (!ramme.src) ramme.src = ramme.dataset.src;
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
