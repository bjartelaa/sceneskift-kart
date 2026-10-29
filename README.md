# Sceneskift: tavla

Interaktivt kart over arbeidsboka i MET3 Arbeidskrav 2 (Bjarte Laa, Petter Garli, Maxime Boudailliez). Viser hvordan ark, forutsetninger og resultater henger sammen. Trykk på en lapp for å se hva den bygger på og hva den påvirker.

Privat til etter innleveringsfristen 13.11.2026.

## Åpne

- `site/index.html`: presentasjonen. Piltaster eller klikker for å bla, N viser notater for den som snakker. `#4` går rett til steg 4.
- `site/tavla.html`: tavla alene. Direkte lenke til en lapp: `tavla.html#konserter`, `#nv`, `#salg` osv.

Siden trenger ikke nett: fonter, bilder og data ligger i mappa.

Tallene i presentasjonen (avtalekort, figurene, grensene og beslutningsreglene) hentes fra `site/data/graph.js`, altså fra arbeidsboka. Teksten står i `site/index.html`. Steg 6 er merket «Utkast» til gruppa har formulert rådet selv.

## Oppdatere etter endringer i arbeidsboka

Trådene tegnes ikke for hånd. De regnes ut fra formlene i arbeidsboka:

```
python3 scripts/extract_graph.py "<sti til Sceneskift_AK2_modell.xlsx>"
```

Skriptet åpner arbeidsboka bare for lesing og skriver `site/data/graph.js`. Ingen rådata fra ordrene kommer med.

- `scripts/kart_config.py`: hvilke navngitte celler hver lapp samler, hvor lappen henger og teksten om den. Fire tråder er lagt inn for hånd (Power Query og notatet) og vises stiplet.
- Dempede tråder (til Kontroller, fra hjelpecellene og fra forutsetningene til Usikkerhet og Resultater) synes når en av lappene velges.

## Bilder

Konsertbilder til presentasjonen, komprimert, ligger i `site/img/`. De brukes ikke på tavla. Originalene ligger i `bilder-original/` og er holdt utenfor git.
