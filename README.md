# Sceneskift: tavla

Interaktivt kart over arbeidsboka i MET3 Arbeidskrav 2 (Bjarte Laa, Petter Garli, Maxime Boudailliez). Viser hvordan ark, forutsetninger og resultater henger sammen. Trykk på en lapp for å se hva den bygger på og hva den påvirker.

Presentasjonen på nett: https://bjartelaa.github.io/sceneskift-kart/site/ og tavla: https://bjartelaa.github.io/sceneskift-kart/site/tavla.html. Konsertplan: https://bjartelaa.github.io/konsertplan/.

## Åpne

- `site/index.html`: presentasjonen. Piltaster eller klikker for å bla, N viser notater for den som snakker. `#4` går rett til side 4, `#2.3` til steg 3 i turen, `#slutt` til avslutningen.
- Fullskjerm: knappen øverst til høyre eller Shift+F. Esc avslutter.
- Sidenummeret står nede til høyre: «3» er side 3, «2.4» er trykk 4 på side 2 (turen og Blanding bygges opp trykk for trykk). Forsiden har ikke nummer. Trykket i adressen teller fra 0, så trykk 4 er `#2.3`.
- Forklaringstekst (små setninger som «Hver prikk er en handling», ingressene og bildekilden) er skjult som standard. Knappen øverst til høyre på forsiden eller F slår den av og på. Valget huskes i nettleseren.
- Lerretet er 1600 × 900 og skaleres til skjermen. På andre skjermformater strekkes bakgrunnene ut over kanten, så det blir ingen striper.
- `site/tavla.html`: tavla alene. Direkte lenke til en lapp: `tavla.html#konserter`, `#nv`, `#salg` osv. Panelet viser «Hva vi har gjort» med tabellene fra arbeidsboka for hver lapp.

Presentasjonen åpner tavla og Konsertplan i samme fane med `?fra=presentasjon`. «Til presentasjonen» på tavla går tilbake til samme side og steg. Konsertplan åpnes fra Blanding med `&tilbake=slutt`, så «Tilbake til presentasjonen» går rett til avslutningen. Konsertplan må ligge ved siden av dette repoet (`~/Documents/konsertplan`).

Siden trenger ikke nett: fonter, bilder og data ligger i mappa.

Tallene i presentasjonen (avtalekort, figurene, grensene og beslutningsreglene) hentes fra `site/data/graph.js`, altså fra arbeidsboka. Teksten står i `site/index.html`. Rådet etter caset (`#5`) er merket «Utkast» til gruppa har formulert rådet selv.

Anbefalingen nederst på Usikkerheten følger valget: høyest nåverdi blant avtalene som holder rammen og gir pluss, ellers avstå. På Resultatene viser prikkene tallene når man holder over eller trykker.

## Blanding (`#6`)

Tvisten etter caserådet: tolv billetter, alle i C. Neste trykk snur dem til salen som gir høyest nåverdi innenfor rammen, og tallene teller fra alt i C til blandingen. Merket «Utenfor caset». Tallene kommer fra Konsertplan-motoren:

```
node scripts/blanding.mjs
```

Skriptet bruker `besteBlanding` i `../konsertplan/src/forslag.js` og skriver `site/data/blanding.js`. Kjør det på nytt hvis Konsertplan eller casen endres.

## Turen og panelet

Side 2 er en tur gjennom tavla i ti steg (`site/tur.js`): hele kartet, veien fra data til råd, data, forutsetninger, modell og til slutt Resultater, som glir over i resultatsiden. Tavla ligger i en ramme (`tavla.html?tur`) og får beskjed om hvilke lapper som skal i fokus.

Tabellene og tallene per lapp ligger i `site/detaljer.js` og `site/detaljer.css`. Både turen og panelet på tavla bruker dem, så tallene er like begge steder. Stegene som ble kuttet fra turen 29.10 finnes i panelet på tavla, og i git (commit bcc16d0).

## Oppdatere etter endringer i arbeidsboka

Trådene tegnes ikke for hånd. De regnes ut fra formlene i arbeidsboka:

```
python3 scripts/extract_graph.py "<sti til Sceneskift_AK2_modell.xlsx>"
```

Skriptet åpner arbeidsboka bare for lesing og skriver `site/data/graph.js`. Noen få ordrerader kommer med som eksempler: de seks første, de avbrutte og de dobbeltførte. Dataene er fiktive og laget for MET3.

- `scripts/kart_config.py`: hvilke navngitte celler hver lapp samler, hvor lappen henger og teksten om den. Fire tråder er lagt inn for hånd (Power Query og notatet) og vises stiplet.
- Dempede tråder (til Kontroller, fra hjelpecellene og fra forutsetningene til Usikkerhet og Resultater) synes når en av lappene velges.

## Bilder

Konsertbilder til presentasjonen, komprimert, ligger i `site/img/`. De brukes ikke på tavla. Originalene ligger i `bilder-original/` og er holdt utenfor git.

`sal-a.jpg`, `sal-b.jpg` og `sal-c.jpg` er hentet fra utleiernes case-nettsider (alu042.github.io/met3-lune-sal, met3-soyleverket, met3-skarvkaien). Nettsidene er fiktive og laget for MET3, og bildene ser KI-genererte ut.
