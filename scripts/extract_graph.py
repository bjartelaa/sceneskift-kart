"""Leser formlene i arbeidsboka og skriver site/data/graph.js.

Bruk:  python3 scripts/extract_graph.py <sti til Sceneskift_AK2_modell.xlsx>

Arbeidsboka åpnes bare for lesing og lagres aldri. Ingen rådata fra ordrene kommer med,
bare navn, celleadresser, formler og verdiene i de navngitte enkeltcellene.
"""
import json
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

import openpyxl
from openpyxl.formula import Tokenizer
from openpyxl.utils.cell import range_boundaries, get_column_letter

sys.path.insert(0, str(Path(__file__).parent))
from kart_config import (LAPPER, GJENNOMSIKTIGE_ARK, MANUELLE_TRADER, EKSTRA_VERDIER,
                         STILLE_TIL, STILLE_FRA_FORUTSETNING_TIL, ETIKETTER, FOLSOMHET)

MAXR = 1_048_576
MAXC = 16_384


def rect(ref):
    """'$A$1:$B$5' eller 'A:A' -> (c1, r1, c2, r2)"""
    c1, r1, c2, r2 = range_boundaries(ref.replace("$", ""))
    return (c1 or 1, r1 or 1, c2 or MAXC, r2 or MAXR)


def overlaps(a, b):
    return not (a[2] < b[0] or b[2] < a[0] or a[3] < b[1] or b[3] < a[1])


def split_sheet(ref, default_sheet):
    if "!" in ref:
        sh, addr = ref.rsplit("!", 1)
        return sh.strip("'"), addr
    return default_sheet, ref


def finn_rad(ws, kol, tekst, fra=1):
    for r in range(fra, ws.max_row + 1):
        if ws.cell(r, kol).value == tekst:
            return r
    raise ValueError(f"Fant ikke «{tekst}» i {ws.title}")


def les_usikkerhet(ws):
    """Følsomhet (5 % ned og opp) og konsekvenstabellen, fra de lagrede verdiene i datatabellene."""
    avtaler = {"A": 3, "B": 7, "C": 11}   # kolonne for basisverdien; ned og opp ligger i de to neste
    folsomhet = defaultdict(list)
    r_nv = finn_rad(ws, 3, "Nåverdi A", 130) + 1
    r_bh = finn_rad(ws, 3, "Finansieringsbehov A", r_nv) + 1
    for nr, lapper in FOLSOMHET.items():
        rad_nv, rad_bh = r_nv + nr, r_bh + nr
        rad = {"forutsetning": ws.cell(rad_nv, 2).value, "nv": {}, "behov": {}}
        for a, k in avtaler.items():
            for key, r0, r in (("nv", r_nv, rad_nv), ("behov", r_bh, rad_bh)):
                basis = ws.cell(r0, k).value
                rad[key][a] = [round(ws.cell(r, k + 1).value - basis), round(ws.cell(r, k + 2).value - basis)]
        for l in lapper:
            folsomhet[l].append(rad)

    r_hode = finn_rad(ws, 3, "Modell nå") - 1
    kolonner = range(4, 4 + next(i for i in range(20) if ws.cell(r_hode, 4 + i).value is None))
    navn = [ws.cell(r_hode, k).value for k in kolonner]
    scenarioer = {}
    for tittel in ("Nåverdi", "Finansieringsbehov"):
        rader = []
        for handling in ("A", "B", "C", "avstå"):
            r = finn_rad(ws, 2, f"{tittel} {handling}")
            rader.append({"handling": handling, "verdier": [round(ws.cell(r, k).value) for k in kolonner]})
        scenarioer[tittel] = {"scenarioer": navn, "rader": rader}
    return folsomhet, scenarioer


def les_rutenett(ws):
    """Datatabellene etterspørsel × pakkepris for nåverdi og finansieringsbehov, per avtale."""
    ut = {}
    for a in ("A", "B", "C"):
        r_nv = finn_rad(ws, 3, f"Nåverdi {a}") + 1          # rad med pakkeprisene
        r_bh = finn_rad(ws, 12, f"Finansieringsbehov {a}") + 1
        pakker = [ws.cell(r_nv, k).value for k in range(4, 11)]
        salg, nv, bh = [], [], []
        for i in range(1, 30):
            v = ws.cell(r_nv + i, 3).value
            if not isinstance(v, (int, float)):
                break
            salg.append(v)
            nv.append([round(ws.cell(r_nv + i, k).value) for k in range(4, 11)])
            bh.append([round(ws.cell(r_bh + i, k).value) for k in range(13, 20)])
        ut[a] = {"nv": nv, "behov": bh}
    return {"salg": salg, "pakker": pakker, "avtaler": ut}


def les_saldo(wv):
    """Akkumulert saldo per måned i aktivt scenario (Figur 1)."""
    ws = wv["Kontantstrøm"]
    r0 = finn_rad(ws, 1, 0)
    rader = range(r0, r0 + 8)
    return {"maaneder": [ws.cell(r, 2).value for r in rader],
            "A": [round(ws.cell(r, 9).value) for r in rader],
            "B": [round(ws.cell(r, 16).value) for r in rader],
            "C": [round(ws.cell(r, 23).value) for r in rader]}


def les_konserter(wv):
    """Én rad per konsert i aktivt scenario, slik arket Konserter regner den (brukes i turen gjennom modellen)."""
    ws = wv["Konserter"]
    r_hode = finn_rad(ws, 2, "Konsert-måned (t)")
    kol = {}
    for k in range(1, ws.max_column + 1):
        tekst = ws.cell(r_hode, k).value
        if tekst and tekst not in kol:      # Pakke del 1 og Leie C står to ganger: først måned, så beløp
            kol[tekst] = k
        elif tekst:
            kol[tekst + " kr"] = k
    felt = {"mnd": "Konsert-måned (t)", "ordrer": "Betalte 2026, ordrer", "oppgjor": "Betalte 2026, oppgjør",
            "grunnlag": "Grunnlag 2026 (valgt)", "billetter_A": "Billetter A", "billetter_B": "Billetter B",
            "billetter_C": "Billetter C", "mnd_oppgjor": "Billettoppgjør", "mnd_pakke1": "Pakke del 1",
            "mnd_leie_C": "Leie C", "oppgjor_A": "Oppgjør A", "oppgjor_B": "Oppgjør B", "oppgjor_C": "Oppgjør C",
            "publikum_A": "Publikum A", "publikum_B": "Publikum B", "publikum_C": "Publikum C",
            "pakke1": "Pakke del 1 kr", "pakke2": "Pakke del 2", "leie_A": "Leie A", "leie_C": "Leie C kr"}
    ut = []
    for r in range(r_hode + 1, r_hode + 13):
        rad = {"konsert": ws.cell(r, 1).value}
        for navn, tekst in felt.items():
            v = ws.cell(r, kol[tekst]).value
            rad[navn] = round(v) if isinstance(v, (int, float)) else v
        ut.append(rad)
    return ut


def les_tabell(ws, r_hode, kol_start, antall=None, stopp=("Sum", None)):
    """Leser en tabell under en overskriftsrad. Kolonnenavnene hentes fra overskriften."""
    navn = []
    k = kol_start
    while ws.cell(r_hode, k).value is not None:
        navn.append(str(ws.cell(r_hode, k).value).replace("-", "").replace("\n", " "))
        k += 1
    rader, r = [], r_hode + 1
    while ws.cell(r, kol_start).value not in stopp and (antall is None or len(rader) < antall):
        rad = []
        for j in range(len(navn)):
            v = ws.cell(r, kol_start + j).value
            if isinstance(v, float):
                v = round(v, 6)
            elif hasattr(v, "isoformat"):
                v = v.date().isoformat() if hasattr(v, "date") else v.isoformat()
            rad.append(v)
        rader.append(rad)
        r += 1
    sum_rad = None
    if ws.cell(r, kol_start).value == "Sum":
        sum_rad = [ws.cell(r, kol_start + j).value for j in range(len(navn))]
    return {"kolonner": navn, "rader": rader, "sum": sum_rad}


def billettvei(rader):
    """Fra rader i ordreeksporten til netto betalte billetter: [rader, billetter] for hvert ledd.
    Samme rensing som Power Query (avbrutte og dobbeltførte ut), refusjoner trekker fra, fribilletter skilles ut."""
    sett, ren, dup = set(), [], []
    for r in rader:
        (dup if r[0] in sett else ren).append(r)
        sett.add(r[0])
    led = lambda rs: [len(rs), sum(r[8] for r in rs)]
    fullfort = [r for r in ren if r[5] == "Fullført"]
    betalte = [r for r in fullfort if r[6] != "Fribillett"]
    return {
        "ordrer": led([r for r in rader if r[3] == "Ordre"]),
        "avbrutt": led([r for r in rader if r[5] == "Avbrutt"]),
        "duplikater": led(dup),
        "refusjoner": led([r for r in fullfort if r[3] == "Refusjon"]),
        "fri": led([r for r in fullfort if r[6] == "Fribillett"]),
        "betalte": led(betalte),
        "kanal": {k: sum(r[8] for r in fullfort if r[7] == k) for k in sorted({r[7] for r in fullfort})},
    }


def les_detaljer(wv):
    """Detaljer til turen: rådata, rensing, avstemming, scenarioer, kontantstrøm, regler og kontroller."""
    from collections import Counter
    raa = wv["Rå_ordrer"]
    rader = [[c for c in r] for r in raa.iter_rows(min_row=2, max_col=11, values_only=True) if r[0]]
    teller = Counter(r[0] for r in rader)
    duplikater = sorted(k for k, v in teller.items() if v > 1)
    tid = lambda v: v.strftime("%d.%m.%Y") if hasattr(v, "strftime") else str(v)[:10]
    ut = {
        "raa": {
            "rader": len(rader),
            "ordrer": sum(1 for r in rader if r[3] == "Ordre"),
            "refusjoner": sum(1 for r in rader if r[3] == "Refusjon"),
            "fullfort": sum(1 for r in rader if r[5] == "Fullført"),
            "avbrutt": sum(1 for r in rader if r[5] == "Avbrutt"),
            "kanal": dict(Counter(r[7] for r in rader)),
            "eksempel": [[r[0], str(r[1])[:16], r[2], r[3], r[5], r[6], r[8], r[10]] for r in rader[:6]],
        },
        "billettvei": billettvei(rader),
        "avbrutte": [[r[0], r[2], r[6], r[8], r[10], tid(r[1])] for r in rader if r[5] == "Avbrutt"],
        "duplikater": [[k, next(r[2] for r in rader if r[0] == k), next(r[8] for r in rader if r[0] == k)] for k in duplikater],
    }
    av = wv["Avstemming"]
    ut["avstemming"] = les_tabell(av, finn_rad(av, 1, "Konsert"), 1)
    ut["billettyper"] = les_tabell(av, finn_rad(av, 1, "Konsert", finn_rad(av, 1, "Konsert") + 1), 1)
    op = wv["Oppgjør"]
    ut["oppgjor"] = les_tabell(op, 1, 1)
    fo = wv["Forutsetninger"]
    ut["scenarioer"] = les_tabell(fo, finn_rad(fo, 2, "Nr"), 2, antall=5)
    ks = wv["Kontantstrøm"]
    r = finn_rad(ks, 1, "t")
    ut["kontantstrom"] = {"rader": [[ks.cell(rr, k).value for k in range(1, 26)] for rr in range(r + 1, r + 9)],
                          "kolonner": [ks.cell(r, k).value for k in range(1, 26)]}
    rs = wv["Resultater"]
    ut["hovedtall"] = les_tabell(rs, finn_rad(rs, 2, "Handling"), 2, antall=4)
    rr = finn_rad(rs, 2, "Regel")
    ut["regler"] = [[rs.cell(x, 2).value, rs.cell(x, 3).value, rs.cell(x, 10).value] for x in range(rr + 1, rr + 5)]
    kt = wv["Kontroller"]
    ut["kontroller"] = les_tabell(kt, finn_rad(kt, 2, "Nr"), 2)
    return ut


def main(path):
    wb = openpyxl.load_workbook(path, read_only=False)
    wv = openpyxl.load_workbook(path, read_only=False, data_only=True)

    names = {n: d.attr_text for n, d in wb.defined_names.items()}
    name_rect = {n: (*split_sheet(t, None),) for n, t in names.items()}
    name_rect = {n: (sh, rect(addr)) for n, (sh, addr) in name_rect.items()}

    # Hvilken lapp eier hvilket område
    owner_rects = defaultdict(list)          # ark -> [(rect, lapp-id)]
    sheet_owner = {}                         # ark -> lapp-id for celler uten navn
    for lapp in LAPPER:
        for n in lapp.get("names", []):
            sh, r = name_rect[n]
            owner_rects[sh].append((r, lapp["id"]))
        if "sheet" in lapp:
            sheet_owner[lapp["sheet"]] = lapp["id"]
    for n, (sh, r) in name_rect.items():
        if sh in sheet_owner and not any(n in l.get("names", []) for l in LAPPER):
            owner_rects[sh].append((r, sheet_owner[sh]))

    def owner_of(sh, col, row):
        for r, lid in owner_rects.get(sh, []):
            if r[0] <= col <= r[2] and r[1] <= row <= r[3]:
                return lid
        if sh in GJENNOMSIKTIGE_ARK:
            return None
        return sheet_owner.get(sh)

    def targets_of_range(sh, r):
        """Lapper og gjennomsiktige celler som et referert område treffer."""
        lapps, cells = set(), set()
        for rr, lid in owner_rects.get(sh, []):
            if overlaps(rr, r):
                lapps.add(lid)
        if sh in GJENNOMSIKTIGE_ARK:
            ws = wb[sh]
            for row in range(r[1], min(r[3], ws.max_row) + 1):
                for col in range(r[0], min(r[2], ws.max_column) + 1):
                    if owner_of(sh, col, row) is None and ws.cell(row, col).value is not None:
                        cells.add((sh, col, row))
        elif sh in sheet_owner:
            # celler i arket som ikke dekkes av navngitte områder
            covered = [rr for rr, _ in owner_rects.get(sh, [])]
            if not any(rr[0] <= r[0] and rr[1] <= r[1] and rr[2] >= r[2] and rr[3] >= r[3] for rr in covered):
                lapps.add(sheet_owner[sh])
        return lapps, cells

    # Celle-graf: node = lapp-id eller gjennomsiktig celle
    edges = defaultdict(lambda: {"n": 0, "eks": None, "rang": None})
    transparent_deps = {}   # (sh, col, row) -> (lapps, cells)

    def refs_in(formula, sh):
        lapps, cells = set(), set()
        try:
            tok = Tokenizer(formula)
        except Exception:
            return lapps, cells
        for t in tok.items:
            if t.type != "OPERAND" or t.subtype != "RANGE":
                continue
            v = t.value
            if v in names:
                s2, r = name_rect[v]
                l, c = targets_of_range(s2, r)
            else:
                s2, addr = split_sheet(v, sh)
                if s2 not in wb.sheetnames:
                    continue
                try:
                    r = rect(addr)
                except Exception:
                    continue
                l, c = targets_of_range(s2, r)
            lapps |= l
            cells |= c
        return lapps, cells

    formulas = []
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                v = c.value
                if isinstance(v, str) and v.startswith("="):
                    formulas.append((ws.title, c.column, c.row, v))
                elif hasattr(v, "text"):   # matriseformel
                    formulas.append((ws.title, c.column, c.row, "=" + str(v.text).lstrip("=")))

    for sh, col, row, f in formulas:
        deps = refs_in(f, sh)
        me = owner_of(sh, col, row)
        if me is None:
            transparent_deps[(sh, col, row)] = deps

    def resolve(lapps, cells, seen=None):
        """Følg gjennomsiktige celler til vi treffer lapper."""
        seen = seen or set()
        out = set(lapps)
        for cell in cells:
            if cell in seen:
                continue
            seen.add(cell)
            if cell in transparent_deps:
                l2, c2 = transparent_deps[cell]
                out |= resolve(l2, c2, seen)
        return out

    lapp_names = {l["id"]: l.get("names", []) + l.get("names_eks", []) for l in LAPPER}
    for sh, col, row, f in formulas:
        me = owner_of(sh, col, row)
        if me is None:
            continue
        lapps, cells = refs_in(f, sh)
        for src in resolve(lapps, cells):
            if src == me:
                continue
            e = edges[(src, me)]
            e["n"] += 1
            # Eksempel: formelen som bruker det første navnet i kildelappen, ellers den korteste
            rang = next((i for i, n in enumerate(lapp_names.get(src, [])) if n in f), 99)
            kand = (rang, len(f))
            if e["eks"] is None or kand < e["rang"]:
                e["rang"] = kand
                e["eks"] = {"celle": f"{sh}!{get_column_letter(col)}{row}", "formel": f[:160]}

    # Verdier og etiketter for navngitte enkeltceller
    def label_for(sh, col, row):
        ws = wv[sh]
        for cc in range(1, col):
            v = ws.cell(row, cc).value
            if isinstance(v, str) and len(v) > 2 and not v.startswith("="):
                return v
        return None

    def unit_for(sh, row):
        if sh == "Forutsetninger":
            v = wv[sh].cell(row, 5).value
            return v if isinstance(v, str) and not v.startswith("=") else None
        return None

    def clean(v):
        if isinstance(v, float):
            return round(v, 4)
        if isinstance(v, (int, str)) or v is None:
            return v
        return str(v)

    folsomhet, scenarioer = les_usikkerhet(wv["Usikkerhet"])

    nodes = []
    for lapp in LAPPER:
        node = {k: lapp[k] for k in ("id", "label", "kind", "desc")}
        node["x"], node["y"] = lapp["pos"]
        node["quiet"] = lapp.get("quiet", False)
        if "sheet" in lapp:
            ws = wb[lapp["sheet"]]
            node["ark"] = lapp["sheet"]
            node["formler"] = sum(1 for f in formulas if f[0] == lapp["sheet"])
            node["omfang"] = f"{ws.max_row} rader × {ws.max_column} kolonner"
        celler = []
        for n in lapp.get("names", []):
            sh, r = name_rect[n]
            single = r[0] == r[2] and r[1] == r[3]
            item = {"navn": n, "adresse": names[n].replace("$", "")}
            if single:
                item["etikett"] = ETIKETTER.get(n) or label_for(sh, r[0], r[1])
                item["verdi"] = clean(wv[sh].cell(r[1], r[0]).value)
                item["enhet"] = unit_for(sh, r[1])
                f = wb[sh].cell(r[1], r[0]).value
                if isinstance(f, str) and f.startswith("="):
                    item["formel"] = f[:160]
            celler.append(item)
        for sh, addr, lab in EKSTRA_VERDIER.get(lapp["id"], []):
            celler.append({"navn": None, "adresse": f"{sh}!{addr}", "etikett": lab,
                           "verdi": clean(wv[sh][addr].value)})
        if celler:
            node["celler"] = celler
        for k in ("slik", "sporsmal"):
            if k in lapp:
                node[k] = lapp[k]
        if lapp["id"] in folsomhet:
            node["folsomhet"] = folsomhet[lapp["id"]]
        if "scenariotabell" in lapp:
            node["scenarioer"] = scenarioer[lapp["scenariotabell"]]
        nodes.append(node)

    ids = {n["id"] for n in nodes}
    quiet = {n["id"] for n in nodes if n["quiet"]}
    kind = {n["id"]: n["kind"] for n in nodes}
    def stille(a, b):
        return (a in quiet or b in quiet or b in STILLE_TIL
                or (kind[a] == "input" and b in STILLE_FRA_FORUTSETNING_TIL))
    out_edges = []
    for (a, b), e in sorted(edges.items()):
        if a in ids and b in ids:
            out_edges.append({"fra": a, "til": b, "antall": e["n"], "eks": e["eks"],
                              "type": "formel", "quiet": stille(a, b)})
    for a, b, why in MANUELLE_TRADER:
        out_edges.append({"fra": a, "til": b, "antall": None, "eks": None, "type": "manuell",
                          "forklaring": why, "quiet": False})

    data = {
        "kilde": Path(path).name,
        "lest": date.today().isoformat(),
        "scenario": clean(wv["Forutsetninger"]["D5"].value),
        "rutenett": les_rutenett(wv["Usikkerhet"]),
        "saldo": les_saldo(wv),
        "konserter": les_konserter(wv),
        "detaljer": les_detaljer(wv),
        "nodes": nodes,
        "edges": out_edges,
    }
    out = Path(__file__).parent.parent / "site" / "data" / "graph.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("window.GRAPH = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{len(nodes)} lapper, {len(out_edges)} tråder -> {out}")
    for e in out_edges:
        print(f"  {e['fra']:>14} -> {e['til']:<14} {e['antall'] or e['type']}")


if __name__ == "__main__":
    main(sys.argv[1])
