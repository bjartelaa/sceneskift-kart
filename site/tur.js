// Turen gjennom modellkartet: hele kartet først, så hver del (data, forutsetninger, modell, resultat).
// Hver del starter med en oversikt over lappene sine, og zoomer så inn på én lapp om gangen.
// Tavla ligger i en ramme (tavla.html?tur) og får beskjed om hvilke lapper som skal i fokus.
// På de dype stegene blir kortet til venstre bredt og kartet smalt, så tabellene får plass.
window.TUR = (() => {
  const { G, D, node, verdi, nb, kr, pst, rammeKr, html, kortTittel, liten, linjer, kort, LAPP } = window.DETALJER;
  const ramme = document.getElementById("tur-kart");
  if (!ramme) return null;
  const lysbilde = ramme.closest(".lysbilde");
  const tittelEl = document.getElementById("tur-tittel");
  const tekstEl = document.getElementById("tur-tekst");
  const kortEl = document.getElementById("tur-kort");
  const notatEl = document.getElementById("tur-notat");
  const akter = [...document.querySelectorAll("#akter li")];

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

  const DATA = ["raa_ordrer", "raa_oppgjor", "ordrer_renset", "oppgjor", "avstemming"];
  const FORUTSETNINGER = ["scenario", "grunnlag", "salg", "pakke", "avtale_a", "avtale_b", "avtale_c", "finans"];

  // Modellen i fire lapper, vist som en kjede med C som eksempel
  function modellflyt() {
    const { lag } = window.DETALJER;
    const saldo = G.saldo.C, mnd = G.saldo.maaneder;
    const nvC = node("nv").scenarioer.rader.find(r => r.handling === "C").verdier[0];
    const laveste = Math.min(...saldo), iLav = saldo.indexOf(laveste);
    const steg = (lapp, hva, tall, cls = "") => {
      const d = html("div", "mf-steg " + cls);
      d.append(html("p", "mf-lapp", lapp), html("p", "mf-hva", hva));
      if (tall) d.append(tall instanceof Node ? tall : html("p", "mf-tall", tall));
      return d;
    };
    // Saldo per måned som små søyler, laveste uthevet
    const W = 400, H = 96, topp = 6, hoy = Math.max(0, ...saldo), lav = Math.min(0, ...saldo);
    const svg = lag("svg", { class: "mf-saldo", viewBox: `0 0 ${W} ${H + 22}` });
    const bredde = W / saldo.length;
    const sy = v => topp + (hoy - v) / (hoy - lav) * (H - topp);
    const y0 = sy(0);
    saldo.forEach((v, i) => {
      svg.appendChild(lag("rect", { class: i === iLav ? "lav" : v < 0 ? "neg" : "pos", x: i * bredde + 6, width: bredde - 12, y: Math.min(sy(v), y0), height: Math.abs(sy(v) - y0) }));
      svg.appendChild(lag("text", { x: i * bredde + bredde / 2, y: H + 18, "text-anchor": "middle" }, mnd[i].startsWith("Før") ? "t0" : mnd[i].slice(0, 3)));
    });
    svg.appendChild(lag("line", { class: "null", x1: 0, x2: W, y1: y0, y2: y0 }));
    const to = html("div", "mf-to");
    to.append(
      steg("Nåverdi", "hver måned diskontert", kr(nvC), "slutt"),
      steg("Finansieringsbehov", `laveste saldo, ${mnd[iLav].toLowerCase()}`, kr(-laveste), "slutt"));
    const d = html("div", "mf");
    d.append(
      html("p", "mf-eksempel", "Eksempel: C, Skarvkaien"),
      steg("Konserter", "billetter inn, pakke og leie ut, per konsert", `${nb(saldo[saldo.length - 1])} kr netto for sesongen`),
      steg("Kontantstrøm", "betalingene i riktig måned, saldo måned for måned", svg),
      to);
    return d;
  }

  const STEG = [
    // Oversikt
    { akt: -1, tittel: "Slik henger modellen sammen", tekst: "Hver lapp er et ark eller en gruppe navngitte celler. Trådene er formler. Vi tar én del om gangen.",
      kart: null,
      kort: () => {
        const ul = html("ul", "tk-farger");
        for (const [farge, t] of [["#2e6bd9", "Data"], ["#f2be22", "Forutsetninger"], ["#e2477e", "Resultater"], ["#ee7a2c", "Usikkerhet"], ["#2c9d57", "Kontroller"]]) {
          const li = html("li", "", t);
          li.style.setProperty("--c", farge);
          ul.appendChild(li);
        }
        return kort(kortTittel("Slik leser du kartet"), ul, liten("Svart lapp er et ark. Hvit lapp er navngitte celler. Tykk tråd betyr mange formler."));
      },
      notat: ["Data til venstre, forutsetninger, modellen i midten, resultatene til høyre.", "Hver del: først oversikten, så lappene én for én."] },

    // DATA
    { akt: -1, alle: true, tittel: "Veien fra data til råd", tekst: "Rådet til Maja bygger på billettene fra 2026. Vi følger tråden del for del.",
      kart: { vei: true },
      kort: () => {
        const ol = html("ol", "tk-vei");
        for (const id of veiTilRad()) ol.appendChild(html("li", "", node(id).label));
        return kort(kortTittel("Veien"), ol);
      },
      notat: ["Veikartet for resten av turen.", "Lenken nederst til venstre åpner kartet i eget vindu, der man kan trykke på hver lapp."] },
    { akt: 0, tittel: "Data: fem lapper", tekst: "Billettsystemet gir to filer. Power Query renser dem, og Avstemming sjekker at de stemmer med hverandre.",
      kart: { fokus: DATA, hoved: [] },
      kort: () => kort(kortTittel("Lappene"), linjer([
        [nb(D.raa.rader) + " rader", "Rå_ordrer: ordreeksporten, urørt"],
        [D.oppgjor.rader.length + " rader", "Rå_oppgjør: ett oppgjør per konsert"],
        [nb(D.avstemming.sum[4]) + " rader", "Ordrer_renset: uten avbrutte og doble"],
        [D.oppgjor.rader.length + " rader", "Oppgjør: med riktige datatyper"],
        [`${D.avstemming.rader.filter(r => r[15] === "Stemmer").length} av ${D.avstemming.rader.length}`, "Avstemming: konserter som stemmer"],
      ])),
      notat: ["Rådataene ligger urørt. Alt annet bygger på dem.", "Vi går gjennom lappene én for én."] },
    { akt: 0, dyp: true, tittel: "Rå_ordrer: én rad per transaksjon", tekst: "Ordreeksporten fra Flytbillett, slik den kom. Både kjøp og refusjoner, og noen betalinger som aldri ble fullført.",
      kart: { fokus: ["raa_ordrer"], hoved: ["raa_ordrer"] },
      kort: LAPP.raa_ordrer.kort,
      notat: ["Én rad er én transaksjon, ikke én billett. Antall sier hvor mange billetter.", "Refusjoner har negativt antall og viser til ordren de gjelder."] },
    { akt: 0, dyp: true, tittel: "Rensingen: 21 rader tas ut", tekst: "Power Query fjerner betalinger som ble avbrutt og rader som er ført to ganger. Refusjonene blir med.",
      kart: { fokus: ["raa_ordrer", "ordrer_renset"], hoved: ["ordrer_renset"] },
      kort: LAPP.ordrer_renset.kort,
      notat: ["Avbrutte betalinger ga ingen penger, så de skal ikke telles.", "Duplikatene er identiske rader med samme transaksjonsnummer. Med dem ville konsert 8 hatt 14 billetter for mye."] },
    { akt: 0, dyp: true, tittel: "Avstemming: ordrer mot oppgjør", tekst: "Betalte billetter fra ordrene sammenlignes med oppgjøret, konsert for konsert.",
      kart: { fokus: ["ordrer_renset", "oppgjor", "avstemming"], hoved: ["avstemming"] },
      kort: LAPP.avstemming.kort,
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
    { akt: 2, tittel: "Modellen: fra tolv konserter til to tall", tekst: "Konserter regner hver konsert. Kontantstrøm legger betalingene i riktig måned. Til slutt blir det to tall per sal: nåverdi og behov.",
      kart: { fokus: ["konserter", "kontantstrom", "nv", "behov"], hoved: [] },
      kort: modellflyt,
      notat: ["Vis kjeden med C som eksempel: konsertene, så måned for måned, så de to tallene.", "Nåverdi sier hvor mye Maja tjener. Behov sier hvor mye hun ligger ute med på det verste.", "Samme formler for A og B."] },
    { akt: 2, dyp: true, tittel: "Kontantstrøm: måned for måned", tekst: "Betalingene fra alle tolv konsertene legges i riktig måned. Saldoen er summen så langt.",
      kart: { fokus: ["konserter", "avtale_b", "finans", "kontantstrom"], hoved: ["kontantstrom"] },
      kort: LAPP.kontantstrom.kort,
      notat: ["Billettpengene kommer måneden etter, pakken går ut før. Derfor går saldoen ned først.", "Månedsslutt skjuler forfall inne i måneden."] },
    { akt: 3, tittel: "Resultat: alt samles på ett ark", tekst: "Nåverdien og behovet for hver sal hentes inn i Resultater. Der står det Maja trenger for å velge.",
      kart: { fokus: ["nv", "behov", "resultater"], hoved: ["resultater"] },
      ut: "resultater",
      kort: () => kort(kortTittel("Inn i Resultater"), linjer([
        ["Nåverdi", "per sal, diskontert til t0"],
        ["Behov", "laveste saldo per sal"],
        [kr(rammeKr), "rammen Maja har"],
        ["4 handlinger", "A, B, C eller avstå"],
      ])),
      notat: ["Trykk videre: kartet går inn i Resultater og over i resultatsiden."] },
  ];

  let steg = 0;
  let utgang = null;
  function send() {
    if (ramme.contentWindow) ramme.contentWindow.postMessage({ tur: STEG[steg].kart }, "*");
  }
  ramme.addEventListener("load", send);
  // Når kartet endrer størrelse (dypt steg), må tavla tilpasse seg på nytt etter overgangen
  ramme.parentElement.addEventListener("transitionend", e => { if (e.propertyName === "width") send(); });

  function vis(i) {
    steg = Math.max(0, Math.min(STEG.length - 1, i));
    const st = STEG[steg];
    clearTimeout(utgang);
    utgang = null;
    lysbilde.classList.remove("ut");
    if (!ramme.src) ramme.src = ramme.dataset.src;
    lysbilde.classList.toggle("dyp", !!st.dyp);
    send();
    akter.forEach((li, j) => {
      li.classList.toggle("aktiv", j === st.akt || !!st.alle);
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
    neste() {
      if (steg < STEG.length - 1) { vis(steg + 1); return true; }
      if (utgang) return true;
      if (!STEG[steg].ut || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      // Siste steg: kartet zoomer inn i lappen og går over i neste lysbilde
      lysbilde.classList.add("ut");
      ramme.contentWindow.postMessage({ turUt: STEG[steg].ut }, "*");
      utgang = setTimeout(() => { utgang = null; if (window.TUR.vedUtgang) window.TUR.vedUtgang(); }, 900);
      return true;
    },
    forrige() { if (steg > 0) { vis(steg - 1); return true; } return false; },
    vedEndring: null,
    vedUtgang: null,
  };
})();
