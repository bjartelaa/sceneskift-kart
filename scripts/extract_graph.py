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
    navn = [ws.cell(r_hode, k).value for k in range(4, 8)]
    scenarioer = {}
    for tittel in ("Nåverdi", "Finansieringsbehov"):
        rader = []
        for handling in ("A", "B", "C", "avstå"):
            r = finn_rad(ws, 2, f"{tittel} {handling}")
            rader.append({"handling": handling, "verdier": [round(ws.cell(r, k).value) for k in range(4, 8)]})
        scenarioer[tittel] = {"scenarioer": navn, "rader": rader}
    return folsomhet, scenarioer


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
