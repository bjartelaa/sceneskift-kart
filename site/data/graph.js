window.GRAPH = {
 "kilde": "Sceneskift_AK2_modell.xlsx",
 "lest": "2026-10-29",
 "scenario": "Basis",
 "nodes": [
  {
   "id": "csv_ordrer",
   "label": "Ordre-eksport 2026",
   "kind": "data",
   "desc": "CSV-fila fra Flytbillett. Én rad per transaksjon: kjøp, refusjon eller avbrutt betaling. 1 791 rader.",
   "x": 115,
   "y": 300,
   "quiet": false
  },
  {
   "id": "csv_oppgjor",
   "label": "Oppgjør 2026",
   "kind": "data",
   "desc": "CSV-fila med oppgjøret fra Flytbillett. Én rad per konsert i 2026, med betalte billetter, gebyr og utbetalt beløp.",
   "x": 115,
   "y": 470,
   "quiet": false
  },
  {
   "id": "raa_ordrer",
   "label": "Rå_ordrer",
   "kind": "data",
   "desc": "Ordrefila limt inn urørt som tabell. Power Query leser herfra, og Avstemming teller hva rensingen fjerner.",
   "x": 295,
   "y": 300,
   "quiet": false,
   "ark": "Rå_ordrer",
   "formler": 0,
   "omfang": "1792 rader × 11 kolonner"
  },
  {
   "id": "raa_oppgjor",
   "label": "Rå_oppgjør",
   "kind": "data",
   "desc": "Oppgjørsfila limt inn urørt som tabell. Power Query leser herfra.",
   "x": 295,
   "y": 470,
   "quiet": false,
   "ark": "Rå_oppgjør",
   "formler": 0,
   "omfang": "13 rader × 11 kolonner"
  },
  {
   "id": "ordrer_renset",
   "label": "Ordrer_renset",
   "kind": "data",
   "desc": "Power Query fjerner 16 avbrutte rader og 5 dobbeltførte transaksjoner (alle på K08). Refusjonene blir med, med negativt antall og beløp. 1 770 rader igjen.",
   "x": 475,
   "y": 300,
   "quiet": false,
   "ark": "Ordrer_renset",
   "formler": 0,
   "omfang": "1771 rader × 11 kolonner"
  },
  {
   "id": "oppgjor",
   "label": "Oppgjør",
   "kind": "data",
   "desc": "Oppgjøret etter Power Query, med riktige datatyper. Gir konsertmåned og gebyr per konsert.",
   "x": 475,
   "y": 470,
   "quiet": false,
   "ark": "Oppgjør",
   "formler": 0,
   "omfang": "13 rader × 11 kolonner"
  },
  {
   "id": "avstemming",
   "label": "Avstemming",
   "kind": "ark",
   "desc": "Sammenligner ordrer og oppgjør konsert for konsert. Etter rensingen stemmer alt, unntatt K10: ordrene har 2 billetter (700 kr) færre enn oppgjøret.",
   "x": 475,
   "y": 650,
   "quiet": false,
   "ark": "Avstemming",
   "formler": 385,
   "omfang": "47 rader × 23 kolonner"
  },
  {
   "id": "scenario",
   "label": "Scenariovelger",
   "kind": "input",
   "desc": "Det ene stedet scenario velges (Forutsetninger D5). Fire scenarioer: Basis, Lav etterspørsel (80 % av salget i 2026), Høyere pakkepris (66 000 kr) og begge samlet. Resten av boka følger valget.",
   "x": 690,
   "y": 190,
   "quiet": false,
   "celler": [
    {
     "navn": "valgt_scenario",
     "adresse": "Forutsetninger!D5",
     "etikett": "Valgt scenario",
     "verdi": "Basis",
     "enhet": "Velg her. Beregninger, resultater og figurer oppdateres."
    },
    {
     "navn": "aktivt_scenario",
     "adresse": "Forutsetninger!D9",
     "etikett": "Aktivt scenario nr",
     "verdi": 1,
     "enhet": "Beregnet. Viser valget i D5, unntatt mens datatabellene i Usikkerhet regner.",
     "formel": "=IF(ISBLANK(dt_scenario),MATCH(valgt_scenario,scen_navn,0),dt_scenario)"
    },
    {
     "navn": "scen_navn",
     "adresse": "Forutsetninger!C13:C16"
    },
    {
     "navn": "scen_faktor",
     "adresse": "Forutsetninger!D13:D16"
    },
    {
     "navn": "scen_pakke",
     "adresse": "Forutsetninger!E13:E16"
    }
   ]
  },
  {
   "id": "grunnlag",
   "label": "Grunnlag 2026",
   "kind": "input",
   "desc": "Velger om billettanslaget bygger på ordrene eller oppgjøret fra 2026. Det er bare K10 som blir ulik: 420 eller 422 billetter.",
   "x": 690,
   "y": 280,
   "quiet": false,
   "celler": [
    {
     "navn": "grunnlag_2026",
     "adresse": "Forutsetninger!D6",
     "etikett": "Billettgrunnlag 2026",
     "verdi": "Ordrer",
     "enhet": "Ordrer: betalte billetter i ordreeksporten. Oppgjør: gebyr delt på 10. Gir bare forskjell for K10 (420 mot 422)."
    }
   ]
  },
  {
   "id": "salg",
   "label": "Salg og billett",
   "kind": "input",
   "desc": "Etterspørselsfaktoren (andel av salget i 2026) og beløpene per betalt billett: pris, gebyr og andre publikumsutgifter. Billettoppgjøret kommer måneden etter konserten.",
   "x": 690,
   "y": 370,
   "quiet": false,
   "celler": [
    {
     "navn": "ettersp_faktor",
     "adresse": "Forutsetninger!F21",
     "etikett": "Etterspørselsfaktor (andel av salget i 2026)",
     "verdi": 1,
     "enhet": "andel",
     "formel": "=IF(ISBLANK(dt_ettersp),D21,dt_ettersp)*(1+IF(dt_fs_nr=1,dt_fs_endring,0))"
    },
    {
     "navn": "billettpris",
     "adresse": "Forutsetninger!F22",
     "etikett": "Billettpris 2027",
     "verdi": 350,
     "enhet": "kr per betalt billett",
     "formel": "=D22*(1+IF(dt_fs_nr=2,dt_fs_endring,0))"
    },
    {
     "navn": "billettgebyr",
     "adresse": "Forutsetninger!F23",
     "etikett": "Billettgebyr",
     "verdi": 10,
     "enhet": "kr per betalt billett",
     "formel": "=D23*(1+IF(dt_fs_nr=3,dt_fs_endring,0))"
    },
    {
     "navn": "publikumsutgift",
     "adresse": "Forutsetninger!F24",
     "etikett": "Andre publikumsavhengige utgifter",
     "verdi": 10,
     "enhet": "kr per betalt billett",
     "formel": "=D24*(1+IF(dt_fs_nr=4,dt_fs_endring,0))"
    },
    {
     "navn": "oppgjor_mnd_etter",
     "adresse": "Forutsetninger!F25",
     "etikett": "Billettoppgjør: måneder etter konserten",
     "verdi": 1,
     "enhet": "måneder",
     "formel": "=D25"
    },
    {
     "navn": "gebyr_2026",
     "adresse": "Forutsetninger!F26",
     "etikett": "Gebyr per billett i 2026-oppgjøret",
     "verdi": 10,
     "enhet": "kr per billett",
     "formel": "=D26"
    }
   ]
  },
  {
   "id": "pakke",
   "label": "Pakke fra Rigg & Ro",
   "kind": "input",
   "desc": "Artist og produksjon kjøpes som en pakke per konsert. Halvparten betales måneden før konserten, resten i konsertmåneden.",
   "x": 690,
   "y": 460,
   "quiet": false,
   "celler": [
    {
     "navn": "pakkepris",
     "adresse": "Forutsetninger!F28",
     "etikett": "Pakkepris per konsert",
     "verdi": 60000,
     "enhet": "kr per konsert",
     "formel": "=IF(ISBLANK(dt_pakke),D28,dt_pakke)*(1+IF(dt_fs_nr=5,dt_fs_endring,0))"
    },
    {
     "navn": "pakke_andel_for",
     "adresse": "Forutsetninger!F29",
     "etikett": "Andel av pakken betalt måneden før",
     "verdi": 0.5,
     "enhet": "andel",
     "formel": "=D29"
    },
    {
     "navn": "pakke_mnd_for",
     "adresse": "Forutsetninger!F30",
     "etikett": "Pakke del 1: måneder før konserten",
     "verdi": 1,
     "enhet": "måneder",
     "formel": "=D30"
    }
   ]
  },
  {
   "id": "avtale_a",
   "label": "A: Lune Sal",
   "kind": "input",
   "desc": "Fast leie per konsert, betalt i konsertmåneden. 250 salgbare plasser, så salget kappes der.",
   "x": 690,
   "y": 550,
   "quiet": false,
   "celler": [
    {
     "navn": "leie_A",
     "adresse": "Forutsetninger!F33",
     "etikett": "Leie A per konsert",
     "verdi": 9000,
     "enhet": "kr, betalt i konsertmåneden",
     "formel": "=D33*(1+IF(dt_fs_nr=6,dt_fs_endring,0))"
    },
    {
     "navn": "plasser_A",
     "adresse": "Forutsetninger!F32",
     "etikett": "Salgbare plasser A",
     "verdi": 250,
     "enhet": "plasser per konsert",
     "formel": "=D32*(1+IF(dt_fs_nr=11,dt_fs_endring,0))"
    }
   ]
  },
  {
   "id": "avtale_b",
   "label": "B: Søyleverket",
   "kind": "input",
   "desc": "Engangstilpasning og halve sesongleien betales ved t0, resten i mars. Det er derfor B trenger mest penger tidlig. 450 salgbare plasser.",
   "x": 690,
   "y": 630,
   "quiet": false,
   "celler": [
    {
     "navn": "B_tilpasning",
     "adresse": "Forutsetninger!F36",
     "etikett": "Engangstilpasning B",
     "verdi": 35000,
     "enhet": "kr ved tidspunkt 0",
     "formel": "=D36*(1+IF(dt_fs_nr=7,dt_fs_endring,0))"
    },
    {
     "navn": "B_sesongleie",
     "adresse": "Forutsetninger!F37",
     "etikett": "Sesongleie B",
     "verdi": 140000,
     "enhet": "kr for sesongen",
     "formel": "=D37*(1+IF(dt_fs_nr=8,dt_fs_endring,0))"
    },
    {
     "navn": "B_andel_t0",
     "adresse": "Forutsetninger!F38",
     "etikett": "Andel av sesongleien ved tidspunkt 0",
     "verdi": 0.5,
     "enhet": "andel",
     "formel": "=D38"
    },
    {
     "navn": "B_mnd_rest",
     "adresse": "Forutsetninger!F39",
     "etikett": "Måned for resten av sesongleien",
     "verdi": 3,
     "enhet": "måned (3 = mars)",
     "formel": "=D39"
    },
    {
     "navn": "plasser_B",
     "adresse": "Forutsetninger!F35",
     "etikett": "Salgbare plasser B",
     "verdi": 450,
     "enhet": "plasser per konsert",
     "formel": "=D35*(1+IF(dt_fs_nr=11,dt_fs_endring,0))"
    }
   ]
  },
  {
   "id": "avtale_c",
   "label": "C: Skarvkaien",
   "kind": "input",
   "desc": "Leien er en andel av billettoppgjøret etter gebyr, med en minsteleie per konsert, og betales måneden etter. Leien følger salget. 450 salgbare plasser.",
   "x": 690,
   "y": 710,
   "quiet": false,
   "celler": [
    {
     "navn": "C_andel",
     "adresse": "Forutsetninger!F42",
     "etikett": "Leieandel C av billettoppgjøret",
     "verdi": 0.18,
     "enhet": "andel etter refusjoner og gebyr",
     "formel": "=D42*(1+IF(dt_fs_nr=9,dt_fs_endring,0))"
    },
    {
     "navn": "C_min",
     "adresse": "Forutsetninger!F43",
     "etikett": "Minimumsleie C per konsert",
     "verdi": 7500,
     "enhet": "kr per konsert",
     "formel": "=D43*(1+IF(dt_fs_nr=10,dt_fs_endring,0))"
    },
    {
     "navn": "C_mnd_etter",
     "adresse": "Forutsetninger!F44",
     "etikett": "Leie C: måneder etter konserten",
     "verdi": 1,
     "enhet": "måneder",
     "formel": "=D44"
    },
    {
     "navn": "plasser_C",
     "adresse": "Forutsetninger!F41",
     "etikett": "Salgbare plasser C",
     "verdi": 450,
     "enhet": "plasser per konsert",
     "formel": "=D41*(1+IF(dt_fs_nr=11,dt_fs_endring,0))"
    }
   ]
  },
  {
   "id": "finans",
   "label": "Rente og ramme",
   "kind": "input",
   "desc": "Realrenten diskonteres månedlig med (1 + r)^(t/12). Rammen for startfinansiering er Majas anslag og er ikke avklart.",
   "x": 690,
   "y": 800,
   "quiet": false,
   "celler": [
    {
     "navn": "realrente",
     "adresse": "Forutsetninger!F46",
     "etikett": "Realrente per år",
     "verdi": 0.04,
     "enhet": "andel",
     "formel": "=D46*(1+IF(dt_fs_nr=12,dt_fs_endring,0))"
    },
    {
     "navn": "konvensjon",
     "adresse": "Forutsetninger!D7",
     "etikett": "Diskonteringskonvensjon",
     "verdi": 1,
     "enhet": "1: (1+r)^(t/12), månedsrente som gir 4 % effektiv årsrente"
    },
    {
     "navn": "ramme",
     "adresse": "Forutsetninger!D8",
     "etikett": "Startfinansiering (ramme)",
     "verdi": 250000,
     "enhet": "kr. Majas anslag, ikke avklart."
    }
   ]
  },
  {
   "id": "konserter",
   "label": "Konserter",
   "kind": "ark",
   "desc": "Én rad per konsert, K01 til K12. Tar salget i 2026, ganger med etterspørselsfaktoren, kapper ved salgbare plasser og regner beløp og betalingsmåned for hver avtale.",
   "x": 925,
   "y": 450,
   "quiet": false,
   "ark": "Konserter",
   "formler": 334,
   "omfang": "25 rader × 26 kolonner"
  },
  {
   "id": "kontantstrom",
   "label": "Kontantstrøm",
   "kind": "ark",
   "desc": "Månedlig betalingsplan fra t0 (like før januar) til juli, med A, B og C side om side. Netto, akkumulert saldo og nåverdi for hver måned.",
   "x": 1105,
   "y": 450,
   "quiet": false,
   "ark": "Kontantstrøm",
   "formler": 223,
   "omfang": "31 rader × 25 kolonner"
  },
  {
   "id": "nv",
   "label": "Nåverdi",
   "kind": "resultat",
   "desc": "Samlet netto betaling og nåverdi ved t0 for hver handling. Avstå gir null, fordi planleggingskostnadene er sunk cost.",
   "x": 1285,
   "y": 360,
   "quiet": false,
   "celler": [
    {
     "navn": "nv_A",
     "adresse": "Kontantstrøm!H18",
     "etikett": "Nåverdi A",
     "verdi": 51324.4579,
     "enhet": null,
     "formel": "=J15"
    },
    {
     "navn": "nv_B",
     "adresse": "Kontantstrøm!O18",
     "etikett": "Nåverdi B",
     "verdi": 201393.6837,
     "enhet": null,
     "formel": "=Q15"
    },
    {
     "navn": "nv_C",
     "adresse": "Kontantstrøm!V18",
     "etikett": "Nåverdi C",
     "verdi": 173786.7427,
     "enhet": null,
     "formel": "=X15"
    },
    {
     "navn": "nv_avsta",
     "adresse": "Kontantstrøm!C26",
     "etikett": "Nåverdi avstå",
     "verdi": 0,
     "enhet": null
    },
    {
     "navn": "netto_A",
     "adresse": "Kontantstrøm!H17",
     "etikett": "Samlet netto A, udiskontert",
     "verdi": 56400,
     "enhet": null,
     "formel": "=H15"
    },
    {
     "navn": "netto_B",
     "adresse": "Kontantstrøm!O17",
     "etikett": "Samlet netto B, udiskontert",
     "verdi": 210500,
     "enhet": null,
     "formel": "=O15"
    },
    {
     "navn": "netto_C",
     "adresse": "Kontantstrøm!V17",
     "etikett": "Samlet netto C, udiskontert",
     "verdi": 180480,
     "enhet": null,
     "formel": "=V15"
    },
    {
     "navn": "netto_avsta",
     "adresse": "Kontantstrøm!C25",
     "etikett": "Samlet netto avstå",
     "verdi": 0,
     "enhet": null
    }
   ]
  },
  {
   "id": "behov",
   "label": "Finansieringsbehov",
   "kind": "resultat",
   "desc": "Det største beløpet Sceneskift ligger ute med i løpet av sesongen, altså den laveste akkumulerte saldoen. Det er dette som sammenlignes med rammen.",
   "x": 1285,
   "y": 540,
   "quiet": false,
   "celler": [
    {
     "navn": "behov_A",
     "adresse": "Kontantstrøm!H20",
     "etikett": "Finansieringsbehov A",
     "verdi": 231900,
     "enhet": null,
     "formel": "=MAX(0,-H19)"
    },
    {
     "navn": "behov_B",
     "adresse": "Kontantstrøm!O20",
     "etikett": "Finansieringsbehov B",
     "verdi": 316100,
     "enhet": null,
     "formel": "=MAX(0,-O19)"
    },
    {
     "navn": "behov_C",
     "adresse": "Kontantstrøm!V20",
     "etikett": "Finansieringsbehov C",
     "verdi": 216696,
     "enhet": null,
     "formel": "=MAX(0,-V19)"
    },
    {
     "navn": "behov_avsta",
     "adresse": "Kontantstrøm!C27",
     "etikett": "Finansieringsbehov avstå",
     "verdi": 0,
     "enhet": null
    },
    {
     "navn": "lavmnd_A",
     "adresse": "Kontantstrøm!H21",
     "etikett": "Måned med laveste saldo, A",
     "verdi": "Februar",
     "enhet": null,
     "formel": "=INDEX($B$7:$B$14,MATCH(H19,I7:I14,0))"
    },
    {
     "navn": "lavmnd_B",
     "adresse": "Kontantstrøm!O21",
     "etikett": "Måned med laveste saldo, B",
     "verdi": "Mars",
     "enhet": null,
     "formel": "=INDEX($B$7:$B$14,MATCH(O19,P7:P14,0))"
    },
    {
     "navn": "lavmnd_C",
     "adresse": "Kontantstrøm!V21",
     "etikett": "Måned med laveste saldo, C",
     "verdi": "Februar",
     "enhet": null,
     "formel": "=INDEX($B$7:$B$14,MATCH(V19,W7:W14,0))"
    }
   ]
  },
  {
   "id": "resultater",
   "label": "Resultater",
   "kind": "resultat",
   "desc": "Alt samlet på ett ark: hovedtall i aktivt scenario, alle scenarioer side om side, de fire beslutningsreglene og grensene.",
   "x": 1465,
   "y": 450,
   "quiet": false,
   "ark": "Resultater",
   "formler": 121,
   "omfang": "43 rader × 22 kolonner",
   "celler": [
    {
     "navn": null,
     "adresse": "Resultater!J26",
     "etikett": "Valg etter regel 1 (anbefalt)",
     "verdi": "C"
    },
    {
     "navn": null,
     "adresse": "Resultater!C5",
     "etikett": "Kontrollstatus",
     "verdi": "Alle kontroller OK"
    }
   ]
  },
  {
   "id": "rad",
   "label": "Rådet til Maja",
   "kind": "rad",
   "desc": "Beslutningsnotatet. Rådet bygger på beslutningsregel 1 i Resultater, med vilkår og spørsmålene om kapasitet.",
   "x": 1640,
   "y": 450,
   "quiet": false
  },
  {
   "id": "usikkerhet",
   "label": "Usikkerhet",
   "kind": "usikkerhet",
   "desc": "Datatabeller som regner hele modellen på nytt for hvert scenario og salgsnivå: konsekvenstabell, etterspørsel mot pakkepris, grenser og følsomhet 5 % ned og opp.",
   "x": 1285,
   "y": 720,
   "quiet": false,
   "ark": "Usikkerhet",
   "formler": 659,
   "omfang": "194 rader × 20 kolonner"
  },
  {
   "id": "dt_hjelp",
   "label": "Hjelpeceller",
   "kind": "usikkerhet",
   "desc": "Tomme celler som datatabellene skriver inn i mens de regner. Forutsetningene leser dem, og derfor går trådene herfra bakover. Excel krever at de ligger på samme ark som datatabellene.",
   "x": 1105,
   "y": 790,
   "quiet": true,
   "celler": [
    {
     "navn": "dt_scenario",
     "adresse": "Usikkerhet!C4",
     "etikett": "Scenario nr",
     "verdi": null,
     "enhet": null
    },
    {
     "navn": "dt_ettersp",
     "adresse": "Usikkerhet!C5",
     "etikett": "Etterspørselsfaktor",
     "verdi": null,
     "enhet": null
    },
    {
     "navn": "dt_pakke",
     "adresse": "Usikkerhet!C6",
     "etikett": "Pakkepris",
     "verdi": null,
     "enhet": null
    },
    {
     "navn": "dt_fs_nr",
     "adresse": "Usikkerhet!C7",
     "etikett": "Følsomhet: forutsetning nr",
     "verdi": null,
     "enhet": null
    },
    {
     "navn": "dt_fs_endring",
     "adresse": "Usikkerhet!C8",
     "etikett": "Følsomhet: endring",
     "verdi": null,
     "enhet": null
    },
    {
     "navn": "fs_avtale",
     "adresse": "Usikkerhet!C9",
     "etikett": "Avtale i følsomhetsfiguren",
     "verdi": "B",
     "enhet": null
    },
    {
     "navn": "fs_idx",
     "adresse": "Usikkerhet!D9",
     "etikett": "Avtale i følsomhetsfiguren",
     "verdi": 2,
     "enhet": null,
     "formel": "=MATCH(C9,{\"A\",\"B\",\"C\"},0)"
    }
   ]
  },
  {
   "id": "grenser",
   "label": "Grenser",
   "kind": "usikkerhet",
   "desc": "Salgsnivået (andel av salget i 2026) der nåverdien blir negativ, eller behovet går over rammen. Funnet med datatabell i steg på 1 % og lineær interpolasjon.",
   "x": 1465,
   "y": 640,
   "quiet": false,
   "celler": [
    {
     "navn": "grense_nv_A",
     "adresse": "Usikkerhet!S59",
     "etikett": "A: nåverdien blir negativ under",
     "verdi": 0.8666,
     "enhet": null,
     "formel": "=IF(COUNT(J60:J129)>0,MIN(J60:J129),IF(C60>=0,\"Positiv i hele området\",\"Negativ i hele området\"))"
    },
    {
     "navn": "grense_nv_B",
     "adresse": "Usikkerhet!S60",
     "etikett": "B: nåverdien blir negativ under",
     "verdi": 0.8078,
     "enhet": null,
     "formel": "=IF(COUNT(K60:K129)>0,MIN(K60:K129),IF(D60>=0,\"Positiv i hele området\",\"Negativ i hele området\"))"
    },
    {
     "navn": "grense_nv_C",
     "adresse": "Usikkerhet!S61",
     "etikett": "C: nåverdien blir negativ under",
     "verdi": 0.7976,
     "enhet": null,
     "formel": "=IF(COUNT(L60:L129)>0,MIN(L60:L129),IF(E60>=0,\"Positiv i hele området\",\"Negativ i hele området\"))"
    },
    {
     "navn": "grense_behov_A",
     "adresse": "Usikkerhet!T59",
     "etikett": "A: behovet går over rammen under",
     "verdi": 0.8302,
     "enhet": null,
     "formel": "=IF(COUNT(M60:M129)>0,MIN(M60:M129),IF(F130>ramme,\"Over rammen i hele området\",\"Innenfor i hele området\"))"
    },
    {
     "navn": "grense_behov_B",
     "adresse": "Usikkerhet!T60",
     "etikett": "B: behovet går over rammen under",
     "verdi": "Over rammen i hele området",
     "enhet": null,
     "formel": "=IF(COUNT(N60:N129)>0,MIN(N60:N129),IF(G130>ramme,\"Over rammen i hele området\",\"Innenfor i hele området\"))"
    },
    {
     "navn": "grense_behov_C",
     "adresse": "Usikkerhet!T61",
     "etikett": "C: behovet går over rammen under",
     "verdi": 0.7588,
     "enhet": null,
     "formel": "=IF(COUNT(O60:O129)>0,MIN(O60:O129),IF(H130>ramme,\"Over rammen i hele området\",\"Innenfor i hele området\"))"
    }
   ]
  },
  {
   "id": "kontroller",
   "label": "Kontroller",
   "kind": "kontroll",
   "desc": "Kontroller der forventningen er skrevet før regningen: uavhengig regning, grensetilfeller og inputtester. Resultater viser om alle er OK.",
   "x": 1285,
   "y": 190,
   "quiet": false,
   "ark": "Kontroller",
   "formler": 112,
   "omfang": "44 rader × 9 kolonner"
  },
  {
   "id": "figurer",
   "label": "Figurer",
   "kind": "usikkerhet",
   "desc": "Figurene er koblet til modellen og endrer seg når scenario eller forutsetninger endres.",
   "x": 1465,
   "y": 800,
   "quiet": false,
   "ark": "Figurer",
   "formler": 16,
   "omfang": "8 rader × 31 kolonner"
  },
  {
   "id": "kapasitet",
   "label": "Kapasitet",
   "kind": "ark",
   "desc": "Kildeoppgaven: kapasitet er ikke det samme som salgbare plasser. Studio USF som virkelig eksempel, og spørsmålene Maja bør stille utleieren før hun signerer.",
   "x": 1465,
   "y": 250,
   "quiet": false,
   "ark": "Kapasitet",
   "formler": 5,
   "omfang": "29 rader × 6 kolonner"
  }
 ],
 "edges": [
  {
   "fra": "avstemming",
   "til": "kontroller",
   "antall": 4,
   "eks": {
    "celle": "Kontroller!F11",
    "formel": "=avst_fri"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "avtale_a",
   "til": "kapasitet",
   "antall": 1,
   "eks": {
    "celle": "Kapasitet!E6",
    "formel": "=plasser_A"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "avtale_a",
   "til": "konserter",
   "antall": 24,
   "eks": {
    "celle": "Konserter!Y6",
    "formel": "=leie_A"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "avtale_a",
   "til": "kontroller",
   "antall": 2,
   "eks": {
    "celle": "Kontroller!E19",
    "formel": "=-n_konserter*pakkepris-n_konserter*leie_A"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "avtale_b",
   "til": "kapasitet",
   "antall": 1,
   "eks": {
    "celle": "Kapasitet!E7",
    "formel": "=plasser_B"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "avtale_b",
   "til": "konserter",
   "antall": 12,
   "eks": {
    "celle": "Konserter!I6",
    "formel": "=MIN(G6,plasser_B)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "avtale_b",
   "til": "kontantstrom",
   "antall": 8,
   "eks": {
    "celle": "Kontantstrøm!N7",
    "formel": "=-(IF($A7=0,B_tilpasning+B_sesongleie*B_andel_t0,0)+IF($A7=B_mnd_rest,B_sesongleie*(1-B_andel_t0),0))"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "avtale_b",
   "til": "kontroller",
   "antall": 3,
   "eks": {
    "celle": "Kontroller!E20",
    "formel": "=-n_konserter*pakkepris-B_tilpasning-B_sesongleie"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "avtale_c",
   "til": "kapasitet",
   "antall": 2,
   "eks": {
    "celle": "Kapasitet!C12",
    "formel": "=(billettpris-billettgebyr)*(1-C_andel)-publikumsutgift"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "avtale_c",
   "til": "konserter",
   "antall": 36,
   "eks": {
    "celle": "Konserter!Z6",
    "formel": "=MAX(C_min,C_andel*S6)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "avtale_c",
   "til": "kontroller",
   "antall": 2,
   "eks": {
    "celle": "Kontroller!E24",
    "formel": "=n_konserter*plasser_C*(billettpris-billettgebyr-publikumsutgift)-n_konserter*pakkepris-n_konserter*MAX(C_min,C_andel*plasser_C*(billettpris-billettgebyr))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "behov",
   "til": "kontantstrom",
   "antall": 3,
   "eks": {
    "celle": "Kontantstrøm!H22",
    "formel": "=IF(H20<=ramme,\"Ja\",\"Nei\")"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "behov",
   "til": "resultater",
   "antall": 7,
   "eks": {
    "celle": "Resultater!G9",
    "formel": "=behov_A"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "behov",
   "til": "usikkerhet",
   "antall": 37,
   "eks": {
    "celle": "Usikkerhet!C18",
    "formel": "=behov_A"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "dt_hjelp",
   "til": "avtale_a",
   "antall": 2,
   "eks": {
    "celle": "Forutsetninger!F33",
    "formel": "=D33*(1+IF(dt_fs_nr=6,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "avtale_b",
   "antall": 3,
   "eks": {
    "celle": "Forutsetninger!F36",
    "formel": "=D36*(1+IF(dt_fs_nr=7,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "avtale_c",
   "antall": 3,
   "eks": {
    "celle": "Forutsetninger!F42",
    "formel": "=D42*(1+IF(dt_fs_nr=9,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "finans",
   "antall": 1,
   "eks": {
    "celle": "Forutsetninger!F46",
    "formel": "=D46*(1+IF(dt_fs_nr=12,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "kontroller",
   "antall": 1,
   "eks": {
    "celle": "Kontroller!F30",
    "formel": "=COUNTA(Usikkerhet!C4:C8)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "pakke",
   "antall": 1,
   "eks": {
    "celle": "Forutsetninger!F28",
    "formel": "=IF(ISBLANK(dt_pakke),D28,dt_pakke)*(1+IF(dt_fs_nr=5,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "salg",
   "antall": 4,
   "eks": {
    "celle": "Forutsetninger!F21",
    "formel": "=IF(ISBLANK(dt_ettersp),D21,dt_ettersp)*(1+IF(dt_fs_nr=1,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "scenario",
   "antall": 1,
   "eks": {
    "celle": "Forutsetninger!D9",
    "formel": "=IF(ISBLANK(dt_scenario),MATCH(valgt_scenario,scen_navn,0),dt_scenario)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "dt_hjelp",
   "til": "usikkerhet",
   "antall": 48,
   "eks": {
    "celle": "Usikkerhet!C169",
    "formel": "=CHOOSE(fs_idx,D138,H138,L138)-CHOOSE(fs_idx,nv_A,nv_B,nv_C)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "finans",
   "til": "grenser",
   "antall": 3,
   "eks": {
    "celle": "Usikkerhet!T59",
    "formel": "=IF(COUNT(M60:M129)>0,MIN(M60:M129),IF(F130>ramme,\"Over rammen i hele området\",\"Innenfor i hele området\"))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "finans",
   "til": "kontantstrom",
   "antall": 19,
   "eks": {
    "celle": "Kontantstrøm!C7",
    "formel": "=IF(konvensjon=1,1/(1+realrente)^($A7/12),1/(1+realrente/12)^$A7)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "finans",
   "til": "kontroller",
   "antall": 7,
   "eks": {
    "celle": "Kontroller!C4",
    "formel": "=IF(konvensjon=1,(1+realrente)^(1/12)-1,realrente/12)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "finans",
   "til": "resultater",
   "antall": 21,
   "eks": {
    "celle": "Resultater!J4",
    "formel": "=ramme"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "finans",
   "til": "usikkerhet",
   "antall": 281,
   "eks": {
    "celle": "Usikkerhet!P60",
    "formel": "=ramme"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "grenser",
   "til": "resultater",
   "antall": 6,
   "eks": {
    "celle": "Resultater!C34",
    "formel": "=grense_nv_A"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "grunnlag",
   "til": "konserter",
   "antall": 12,
   "eks": {
    "celle": "Konserter!F6",
    "formel": "=IF(grunnlag_2026=\"Ordrer\",C6,D6)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "grunnlag",
   "til": "kontroller",
   "antall": 6,
   "eks": {
    "celle": "Kontroller!H32",
    "formel": "=IF(OR(grunnlag_2026<>\"Ordrer\",konvensjon<>1),\"Ikke aktuell\",IF(ABS(G32)<1,\"Ja\",\"Nei\"))"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "konserter",
   "til": "kontantstrom",
   "antall": 91,
   "eks": {
    "celle": "Kontantstrøm!D7",
    "formel": "=SUMIFS(k_oppgjor_A,k_mnd_oppgjor,$A7)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "konserter",
   "til": "kontroller",
   "antall": 12,
   "eks": {
    "celle": "Kontroller!E13",
    "formel": "=SUM(k_oppgjor_A)-SUM(k_publikum_A)-SUM(k_pakke1)-SUM(k_pakke2)-SUM(k_leie_A)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "konserter",
   "til": "resultater",
   "antall": 3,
   "eks": {
    "celle": "Resultater!D9",
    "formel": "=SUM(k_N_A)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "kontantstrom",
   "til": "behov",
   "antall": 6,
   "eks": {
    "celle": "Kontantstrøm!H20",
    "formel": "=MAX(0,-H19)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "kontantstrom",
   "til": "kontroller",
   "antall": 4,
   "eks": {
    "celle": "Kontroller!E16",
    "formel": "=Kontantstrøm!H7+NPV($C$4,Kontantstrøm!H8:H14)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "kontantstrom",
   "til": "nv",
   "antall": 6,
   "eks": {
    "celle": "Kontantstrøm!H17",
    "formel": "=H15"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "kontroller",
   "til": "resultater",
   "antall": 1,
   "eks": {
    "celle": "Resultater!C5",
    "formel": "=kontroll_status"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "nv",
   "til": "kontroller",
   "antall": 8,
   "eks": {
    "celle": "Kontroller!F16",
    "formel": "=nv_A"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "nv",
   "til": "resultater",
   "antall": 8,
   "eks": {
    "celle": "Resultater!F9",
    "formel": "=nv_A"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "nv",
   "til": "usikkerhet",
   "antall": 43,
   "eks": {
    "celle": "Usikkerhet!C14",
    "formel": "=nv_A"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "oppgjor",
   "til": "avstemming",
   "antall": 84,
   "eks": {
    "celle": "Avstemming!A6",
    "formel": "=INDEX(opg_arr,ROWS($A$6:A6)+1)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "oppgjor",
   "til": "konserter",
   "antall": 36,
   "eks": {
    "celle": "Konserter!A6",
    "formel": "=INDEX(opg_arr,ROWS($A$6:A6)+1)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "oppgjor",
   "til": "kontroller",
   "antall": 1,
   "eks": {
    "celle": "Kontroller!E11",
    "formel": "=SUM(opg_fri)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "ordrer_renset",
   "til": "avstemming",
   "antall": 108,
   "eks": {
    "celle": "Avstemming!E6",
    "formel": "=COUNTIFS(ord_konsert,A6)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "ordrer_renset",
   "til": "konserter",
   "antall": 12,
   "eks": {
    "celle": "Konserter!C6",
    "formel": "=SUMIFS(ord_antall,ord_konsert,A6,ord_billettype,\"<>Fribillett\")"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "ordrer_renset",
   "til": "kontroller",
   "antall": 1,
   "eks": {
    "celle": "Kontroller!F8",
    "formel": "=COUNTA(ord_konsert)-1"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "pakke",
   "til": "konserter",
   "antall": 36,
   "eks": {
    "celle": "Konserter!W6",
    "formel": "=pakkepris*pakke_andel_for"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "pakke",
   "til": "kontroller",
   "antall": 6,
   "eks": {
    "celle": "Kontroller!E21",
    "formel": "=-n_konserter*pakkepris-n_konserter*C_min"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "pakke",
   "til": "resultater",
   "antall": 1,
   "eks": {
    "celle": "Resultater!H4",
    "formel": "=pakkepris"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "raa_ordrer",
   "til": "avstemming",
   "antall": 48,
   "eks": {
    "celle": "Avstemming!B6",
    "formel": "=COUNTIFS(raa_konsert,A6)"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "raa_ordrer",
   "til": "kontroller",
   "antall": 1,
   "eks": {
    "celle": "Kontroller!F7",
    "formel": "=COUNTA(raa_konsert)-1"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "salg",
   "til": "avstemming",
   "antall": 12,
   "eks": {
    "celle": "Avstemming!J6",
    "formel": "=INDEX(opg_gebyr,MATCH(A6,opg_arr,0))/gebyr_2026"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "salg",
   "til": "kapasitet",
   "antall": 2,
   "eks": {
    "celle": "Kapasitet!C11",
    "formel": "=billettpris-billettgebyr-publikumsutgift"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "salg",
   "til": "konserter",
   "antall": 108,
   "eks": {
    "celle": "Konserter!G6",
    "formel": "=F6*ettersp_faktor"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "salg",
   "til": "kontroller",
   "antall": 3,
   "eks": {
    "celle": "Kontroller!E22",
    "formel": "=n_konserter*plasser_A*(billettpris-billettgebyr-publikumsutgift)-n_konserter*pakkepris-n_konserter*leie_A"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "salg",
   "til": "resultater",
   "antall": 1,
   "eks": {
    "celle": "Resultater!F4",
    "formel": "=ettersp_faktor"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "scenario",
   "til": "figurer",
   "antall": 4,
   "eks": {
    "celle": "Figurer!AB5",
    "formel": "=INDEX(scen_navn,1)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "scenario",
   "til": "kontroller",
   "antall": 2,
   "eks": {
    "celle": "Kontroller!F28",
    "formel": "=ABS(INDEX(Usikkerhet!D14:G14,aktivt_scenario)-nv_A)+ABS(INDEX(Usikkerhet!D15:G15,aktivt_scenario)-nv_B)+ABS(INDEX(Usikkerhet!D16:G16,aktivt_scenario)-nv_C)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "scenario",
   "til": "pakke",
   "antall": 1,
   "eks": {
    "celle": "Forutsetninger!F28",
    "formel": "=IF(ISBLANK(dt_pakke),D28,dt_pakke)*(1+IF(dt_fs_nr=5,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "scenario",
   "til": "resultater",
   "antall": 9,
   "eks": {
    "celle": "Resultater!C4",
    "formel": "=INDEX(scen_navn,aktivt_scenario)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "scenario",
   "til": "salg",
   "antall": 1,
   "eks": {
    "celle": "Forutsetninger!F21",
    "formel": "=IF(ISBLANK(dt_ettersp),D21,dt_ettersp)*(1+IF(dt_fs_nr=1,dt_fs_endring,0))"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "scenario",
   "til": "usikkerhet",
   "antall": 4,
   "eks": {
    "celle": "Usikkerhet!D12",
    "formel": "=INDEX(scen_navn,D13)"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "usikkerhet",
   "til": "figurer",
   "antall": 12,
   "eks": {
    "celle": "Figurer!AC5",
    "formel": "=Usikkerhet!D14"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "usikkerhet",
   "til": "grenser",
   "antall": 6,
   "eks": {
    "celle": "Usikkerhet!S59",
    "formel": "=IF(COUNT(J60:J129)>0,MIN(J60:J129),IF(C60>=0,\"Positiv i hele området\",\"Negativ i hele området\"))"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "usikkerhet",
   "til": "kontroller",
   "antall": 19,
   "eks": {
    "celle": "Kontroller!E29",
    "formel": "=Usikkerhet!D15"
   },
   "type": "formel",
   "quiet": true
  },
  {
   "fra": "usikkerhet",
   "til": "resultater",
   "antall": 32,
   "eks": {
    "celle": "Resultater!C19",
    "formel": "=Usikkerhet!D14"
   },
   "type": "formel",
   "quiet": false
  },
  {
   "fra": "csv_ordrer",
   "til": "raa_ordrer",
   "antall": null,
   "eks": null,
   "type": "manuell",
   "forklaring": "Limt inn urørt fra CSV",
   "quiet": false
  },
  {
   "fra": "csv_oppgjor",
   "til": "raa_oppgjor",
   "antall": null,
   "eks": null,
   "type": "manuell",
   "forklaring": "Limt inn urørt fra CSV",
   "quiet": false
  },
  {
   "fra": "raa_ordrer",
   "til": "ordrer_renset",
   "antall": null,
   "eks": null,
   "type": "manuell",
   "forklaring": "Power Query: spørringen Ordrer_renset",
   "quiet": false
  },
  {
   "fra": "raa_oppgjor",
   "til": "oppgjor",
   "antall": null,
   "eks": null,
   "type": "manuell",
   "forklaring": "Power Query: spørringen Oppgjor",
   "quiet": false
  },
  {
   "fra": "resultater",
   "til": "rad",
   "antall": null,
   "eks": null,
   "type": "manuell",
   "forklaring": "Notatet viser til Resultater",
   "quiet": false
  },
  {
   "fra": "kapasitet",
   "til": "rad",
   "antall": null,
   "eks": null,
   "type": "manuell",
   "forklaring": "Kapasitetsspørsmålene står i notatet",
   "quiet": false
  }
 ]
};
