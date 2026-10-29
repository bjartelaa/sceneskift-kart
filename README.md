# Sceneskift: tavla

Interaktivt kart over arbeidsboka i MET3 Arbeidskrav 2 (Bjarte Laa, Petter Garli, Maxime Boudailliez). Viser hvordan ark, forutsetninger og resultater henger sammen. Trykk på en lapp for å se hva den bygger på og hva den påvirker.

Privat til etter innleveringsfristen 13.11.2026.

## Åpne

- `site/index.html`: presentasjonen. Piltaster eller klikker for å bla, N viser notater for den som snakker. `#4` går rett til side 4, `#2.3` til steg 3 i turen.
- `site/tavla.html`: tavla alene. Direkte lenke til en lapp: `tavla.html#konserter`, `#nv`, `#salg` osv. Panelet viser «Hva vi har gjort» med tabellene fra arbeidsboka for hver lapp.

Presentasjonen åpner tavla og Konsertplan i samme fane med `?fra=presentasjon`. «Til presentasjonen» (tavla) og «Tilbake til presentasjonen» (Konsertplan) går da tilbake til samme side og steg. Konsertplan må ligge ved siden av dette repoet (`~/Documents/konsertplan`).

Siden trenger ikke nett: fonter, bilder og data ligger i mappa.

Tallene i presentasjonen (avtalekort, figurene, grensene og beslutningsreglene) hentes fra `site/data/graph.js`, altså fra arbeidsboka. Teksten står i `site/index.html`. Rådet (`#5`) er merket «Utkast» til gruppa har formulert rådet selv.

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
