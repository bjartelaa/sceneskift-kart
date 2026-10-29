// Regner ut beste blanding av saler per konsert med Konsertplan-motoren og skriver site/data/blanding.js.
// Brukes av tvist-siden i presentasjonen. Konsertplan må ligge ved siden av dette repoet.
// Kjør: node scripts/blanding.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rot = join(dirname(fileURLToPath(import.meta.url)), "..");
const kp = join(rot, "..", "konsertplan", "src");
const { beregnAltI } = await import(join(kp, "motor.js"));
const { besteBlanding } = await import(join(kp, "forslag.js"));
const { standardSesong } = await import(join(kp, "standard-2027.js"));

const d = standardSesong();
const C = beregnAltI(d.sesong, d.saler, d.program, d.saler.find(s => s.id === "C"));
const b = besteBlanding(d.sesong, d.saler, d.program);
const ut = {
  ramme: d.sesong.ramme,
  caset: { sal: "C", nv: Math.round(C.nv), behov: Math.round(C.behov) },
  blandet: { nv: Math.round(b.nv), behov: Math.round(b.behov) },
  konserter: d.program.map((k, i) => ({ nr: k.nr, dato: k.dato, artist: k.artist, salg: k.forventetSalg, sal: b.valg[i].salId, oppsett: b.valg[i].oppsett })),
};
writeFileSync(join(rot, "site", "data", "blanding.js"),
  "// Generert av scripts/blanding.mjs fra Konsertplan. Ikke rediger.\nwindow.BLANDING_DATA = " + JSON.stringify(ut, null, 1) + ";\n");
console.log(`Caset C: ${ut.caset.nv} / ${ut.caset.behov}. Blandet: ${ut.blandet.nv} / ${ut.blandet.behov}. ${ut.konserter.map(k => k.sal).join("")}`);
