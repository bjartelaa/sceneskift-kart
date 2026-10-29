# Sceneskift: tavla

Interaktivt kart over arbeidsboka i MET3 Arbeidskrav 2 (Bjarte Laa, Petter Garli, Maxime Boudailliez). Viser hvordan ark, forutsetninger og resultater henger sammen. Trykk på en lapp for å se hva den bygger på og hva den påvirker.

Privat til etter innleveringsfristen 13.11.2026.

## Åpne

Dobbeltklikk `site/index.html`. Siden trenger ikke nett: fonter, bilder og data ligger i mappa.

Direkte lenke til en lapp: `site/index.html#konserter`, `#nv`, `#salg` osv.

## Oppdatere etter endringer i arbeidsboka

Trådene tegnes ikke for hånd. De regnes ut fra formlene i arbeidsboka:

```
python3 scripts/extract_graph.py "<sti til Sceneskift_AK2_modell.xlsx>"
```

Skriptet åpner arbeidsboka bare for lesing og skriver `site/data/graph.js`. Ingen rådata fra ordrene kommer med.

- `scripts/kart_config.py`: hvilke navngitte celler hver lapp samler, hvor lappen henger og teksten om den. Seks tråder er lagt inn for hånd (CSV-import, Power Query og notatet) og vises stiplet.
- Dempede tråder (til Kontroller, fra hjelpecellene og fra forutsetningene til Usikkerhet og Resultater) synes når en av lappene velges.

## Bilder

Konsertbilder fra Bjartes arkiv, komprimert til `site/img/`. Originalene ligger i `bilder-original/` og er holdt utenfor git.
