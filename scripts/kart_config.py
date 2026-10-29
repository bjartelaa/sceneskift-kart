"""Lappene på tavla: hvilke navngitte celler hver lapp samler, hvor den henger og hva den betyr.

Trådene mellom lappene tegnes ikke her. De regnes ut av extract_graph.py fra formlene i arbeidsboka.
Bare trådene i MANUELLE_TRADER er lagt inn for hånd, fordi de ikke går gjennom formler
(CSV-import, Power Query og notatet).
"""

# kind styrer fargen på tapen: data, input, ark, resultat, usikkerhet, kontroll, rad
LAPPER = [
    # Data
    dict(id="csv_ordrer", label="Ordre-eksport 2026", kind="data", pos=(115, 300),
         desc="CSV-fila fra Flytbillett. Én rad per transaksjon: kjøp, refusjon eller avbrutt betaling. 1 791 rader."),
    dict(id="csv_oppgjor", label="Oppgjør 2026", kind="data", pos=(115, 470),
         desc="CSV-fila med oppgjøret fra Flytbillett. Én rad per konsert i 2026, med betalte billetter, gebyr og utbetalt beløp."),
    dict(id="raa_ordrer", label="Rå_ordrer", kind="data", sheet="Rå_ordrer", pos=(295, 300),
         desc="Ordrefila limt inn urørt som tabell. Power Query leser herfra, og Avstemming teller hva rensingen fjerner."),
    dict(id="raa_oppgjor", label="Rå_oppgjør", kind="data", sheet="Rå_oppgjør", pos=(295, 470),
         desc="Oppgjørsfila limt inn urørt som tabell. Power Query leser herfra."),
    dict(id="ordrer_renset", label="Ordrer_renset", kind="data", sheet="Ordrer_renset", pos=(475, 300),
         desc="Power Query fjerner 16 avbrutte rader og 5 dobbeltførte transaksjoner (alle på K08). Refusjonene blir med, med negativt antall og beløp. 1 770 rader igjen."),
    dict(id="oppgjor", label="Oppgjør", kind="data", sheet="Oppgjør", pos=(475, 470),
         desc="Oppgjøret etter Power Query, med riktige datatyper. Gir konsertmåned og gebyr per konsert."),
    dict(id="avstemming", label="Avstemming", kind="ark", sheet="Avstemming", pos=(475, 650),
         desc="Sammenligner ordrer og oppgjør konsert for konsert. Etter rensingen stemmer alt, unntatt K10: ordrene har 2 billetter (700 kr) færre enn oppgjøret."),

    # Forutsetninger
    dict(id="scenario", label="Scenariovelger", kind="input",
         names=["valgt_scenario", "aktivt_scenario", "scen_navn", "scen_faktor", "scen_pakke"], pos=(690, 190),
         desc="Det ene stedet scenario velges (Forutsetninger D5). Fire scenarioer: Basis, Lav etterspørsel (80 % av salget i 2026), Høyere pakkepris (66 000 kr) og begge samlet. Resten av boka følger valget."),
    dict(id="grunnlag", label="Grunnlag 2026", kind="input", names=["grunnlag_2026"], pos=(690, 280),
         desc="Velger om billettanslaget bygger på ordrene eller oppgjøret fra 2026. Det er bare K10 som blir ulik: 420 eller 422 billetter."),
    dict(id="salg", label="Salg og billett", kind="input",
         names=["ettersp_faktor", "billettpris", "billettgebyr", "publikumsutgift", "oppgjor_mnd_etter", "gebyr_2026"], pos=(690, 370),
         desc="Etterspørselsfaktoren (andel av salget i 2026) og beløpene per betalt billett: pris, gebyr og andre publikumsutgifter. Billettoppgjøret kommer måneden etter konserten."),
    dict(id="pakke", label="Pakke fra Rigg & Ro", kind="input",
         names=["pakkepris", "pakke_andel_for", "pakke_mnd_for"], pos=(690, 460),
         desc="Artist og produksjon kjøpes som en pakke per konsert. Halvparten betales måneden før konserten, resten i konsertmåneden."),
    dict(id="avtale_a", label="A: Lune Sal", kind="input", names=["leie_A", "plasser_A"], pos=(690, 550),
         desc="Fast leie per konsert, betalt i konsertmåneden. 250 salgbare plasser, så salget kappes der."),
    dict(id="avtale_b", label="B: Søyleverket", kind="input",
         names=["B_tilpasning", "B_sesongleie", "B_andel_t0", "B_mnd_rest", "plasser_B"], pos=(690, 630),
         desc="Engangstilpasning og halve sesongleien betales ved t0, resten i mars. Det er derfor B trenger mest penger tidlig. 450 salgbare plasser."),
    dict(id="avtale_c", label="C: Skarvkaien", kind="input",
         names=["C_andel", "C_min", "C_mnd_etter", "plasser_C"], pos=(690, 710),
         desc="Leien er en andel av billettoppgjøret etter gebyr, med en minsteleie per konsert, og betales måneden etter. Leien følger salget. 450 salgbare plasser."),
    dict(id="finans", label="Rente og ramme", kind="input", names=["realrente", "konvensjon", "ramme"], pos=(690, 800),
         desc="Realrenten diskonteres månedlig med (1 + r)^(t/12). Rammen for startfinansiering er Majas anslag og er ikke avklart."),

    # Modellen
    dict(id="konserter", label="Konserter", kind="ark", sheet="Konserter", names_eks=["k_oppgjor_A"], pos=(925, 450),
         desc="Én rad per konsert, K01 til K12. Tar salget i 2026, ganger med etterspørselsfaktoren, kapper ved salgbare plasser og regner beløp og betalingsmåned for hver avtale."),
    dict(id="kontantstrom", label="Kontantstrøm", kind="ark", sheet="Kontantstrøm", pos=(1105, 450),
         desc="Månedlig betalingsplan fra t0 (like før januar) til juli, med A, B og C side om side. Netto, akkumulert saldo og nåverdi for hver måned."),
    dict(id="nv", label="Nåverdi", kind="resultat",
         names=["nv_A", "nv_B", "nv_C", "nv_avsta", "netto_A", "netto_B", "netto_C", "netto_avsta"], pos=(1285, 360),
         desc="Samlet netto betaling og nåverdi ved t0 for hver handling. Avstå gir null, fordi planleggingskostnadene er sunk cost."),
    dict(id="behov", label="Finansieringsbehov", kind="resultat",
         names=["behov_A", "behov_B", "behov_C", "behov_avsta", "lavmnd_A", "lavmnd_B", "lavmnd_C"], pos=(1285, 540),
         desc="Det største beløpet Sceneskift ligger ute med i løpet av sesongen, altså den laveste akkumulerte saldoen. Det er dette som sammenlignes med rammen."),
    dict(id="resultater", label="Resultater", kind="resultat", sheet="Resultater", pos=(1465, 450),
         desc="Alt samlet på ett ark: hovedtall i aktivt scenario, alle scenarioer side om side, de fire beslutningsreglene og grensene."),
    dict(id="rad", label="Rådet til Maja", kind="rad", pos=(1640, 450),
         desc="Beslutningsnotatet. Rådet bygger på beslutningsregel 1 i Resultater, med vilkår og spørsmålene om kapasitet."),

    # Usikkerhet og kontroll
    dict(id="usikkerhet", label="Usikkerhet", kind="usikkerhet", sheet="Usikkerhet", pos=(1285, 720),
         desc="Datatabeller som regner hele modellen på nytt for hvert scenario og salgsnivå: konsekvenstabell, etterspørsel mot pakkepris, grenser og følsomhet 5 % ned og opp."),
    dict(id="dt_hjelp", label="Hjelpeceller", kind="usikkerhet",
         names=["dt_scenario", "dt_ettersp", "dt_pakke", "dt_fs_nr", "dt_fs_endring", "fs_avtale", "fs_idx"], pos=(1105, 790),
         quiet=True,
         desc="Tomme celler som datatabellene skriver inn i mens de regner. Forutsetningene leser dem, og derfor går trådene herfra bakover. Excel krever at de ligger på samme ark som datatabellene."),
    dict(id="grenser", label="Grenser", kind="usikkerhet",
         names=["grense_nv_A", "grense_nv_B", "grense_nv_C", "grense_behov_A", "grense_behov_B", "grense_behov_C"], pos=(1465, 640),
         desc="Salgsnivået (andel av salget i 2026) der nåverdien blir negativ, eller behovet går over rammen. Funnet med datatabell i steg på 1 % og lineær interpolasjon."),
    dict(id="kontroller", label="Kontroller", kind="kontroll", sheet="Kontroller", pos=(1285, 190),
         desc="Kontroller der forventningen er skrevet før regningen: uavhengig regning, grensetilfeller og inputtester. Resultater viser om alle er OK."),
    dict(id="figurer", label="Figurer", kind="usikkerhet", sheet="Figurer", pos=(1465, 800),
         desc="Figurene er koblet til modellen og endrer seg når scenario eller forutsetninger endres."),
    dict(id="kapasitet", label="Kapasitet", kind="ark", sheet="Kapasitet", pos=(1465, 250),
         desc="Kildeoppgaven: kapasitet er ikke det samme som salgbare plasser. Studio USF som virkelig eksempel, og spørsmålene Maja bør stille utleieren før hun signerer."),
]

# Ark der celler uten navn ikke er en egen lapp. Trådene går rett gjennom dem.
GJENNOMSIKTIGE_ARK = {"Forutsetninger"}

MANUELLE_TRADER = [
    ("csv_ordrer", "raa_ordrer", "Limt inn urørt fra CSV"),
    ("csv_oppgjor", "raa_oppgjor", "Limt inn urørt fra CSV"),
    ("raa_ordrer", "ordrer_renset", "Power Query: spørringen Ordrer_renset"),
    ("raa_oppgjor", "oppgjor", "Power Query: spørringen Oppgjor"),
    ("resultater", "rad", "Notatet viser til Resultater"),
    ("kapasitet", "rad", "Kapasitetsspørsmålene står i notatet"),
]

# Tråder som er dempet til en av lappene velges, så hovedkjeden synes.
# Kontrollene leser nesten alt, og rammen og scenarionavnene brukes overalt i Usikkerhet og Resultater.
STILLE_TIL = {"kontroller"}
STILLE_FRA_FORUTSETNING_TIL = {"usikkerhet", "resultater", "grenser", "figurer", "kapasitet"}

# Enkeltceller uten navn som er verdt å vise på en lapp
EKSTRA_VERDIER = {
    "resultater": [("Resultater", "J26", "Valg etter regel 1 (anbefalt)"),
                   ("Resultater", "C5", "Kontrollstatus")],
}

# Etiketter der arbeidsboka ikke har en tekst på samme rad som skiller cellene
ETIKETTER = {
    "nv_A": "Nåverdi A", "nv_B": "Nåverdi B", "nv_C": "Nåverdi C", "nv_avsta": "Nåverdi avstå",
    "netto_A": "Samlet netto A, udiskontert", "netto_B": "Samlet netto B, udiskontert",
    "netto_C": "Samlet netto C, udiskontert", "netto_avsta": "Samlet netto avstå",
    "behov_A": "Finansieringsbehov A", "behov_B": "Finansieringsbehov B",
    "behov_C": "Finansieringsbehov C", "behov_avsta": "Finansieringsbehov avstå",
    "lavmnd_A": "Måned med laveste saldo, A", "lavmnd_B": "Måned med laveste saldo, B",
    "lavmnd_C": "Måned med laveste saldo, C",
    "grense_nv_A": "A: nåverdien blir negativ under", "grense_nv_B": "B: nåverdien blir negativ under",
    "grense_nv_C": "C: nåverdien blir negativ under",
    "grense_behov_A": "A: behovet går over rammen under", "grense_behov_B": "B: behovet går over rammen under",
    "grense_behov_C": "C: behovet går over rammen under",
}
