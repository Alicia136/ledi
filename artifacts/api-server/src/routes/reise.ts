import { Router } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, spacesTable, pricesTable } from "@workspace/db";

const router = Router();

const RUTER: Record<string, { fra: string; til: string; stopp: string[] }> = {
  "Oslo → Lofoten":   { fra: "Oslo",      til: "Lofoten",   stopp: ["Oslo", "Hamar", "Lillehammer", "Trondheim", "Bodø", "Lofoten"] },
  "Oslo → Bergen":    { fra: "Oslo",      til: "Bergen",    stopp: ["Oslo", "Drammen", "Kongsberg", "Voss", "Bergen"] },
  "Oslo → Nordkapp":  { fra: "Oslo",      til: "Nordkapp",  stopp: ["Oslo", "Hamar", "Trondheim", "Bodø", "Alta", "Nordkapp"] },
  "Oslo → Tromsø":    { fra: "Oslo",      til: "Tromsø",    stopp: ["Oslo", "Trondheim", "Bodø", "Tromsø"] },
  "Bergen → Lofoten": { fra: "Bergen",    til: "Lofoten",   stopp: ["Bergen", "Ålesund", "Trondheim", "Bodø", "Lofoten"] },
  "Oslo → Stavanger": { fra: "Oslo",      til: "Stavanger", stopp: ["Oslo", "Drammen", "Kristiansand", "Stavanger"] },
  "Stavanger → Bergen":{ fra: "Stavanger",til: "Bergen",    stopp: ["Stavanger", "Haugesund", "Bergen"] },
  "Oslo → Ålesund":   { fra: "Oslo",      til: "Ålesund",   stopp: ["Oslo", "Lillehammer", "Ålesund"] },
};

const BY_PRIS: Record<string, { min: number; max: number; emoji: string }> = {
  "Oslo":         { min: 250, max: 350, emoji: "🏙️" },
  "Hamar":        { min: 250, max: 300, emoji: "🌊" },
  "Lillehammer":  { min: 290, max: 360, emoji: "⛷️" },
  "Drammen":      { min: 200, max: 280, emoji: "🌲" },
  "Kongsberg":    { min: 240, max: 310, emoji: "⛏️" },
  "Trondheim":    { min: 270, max: 340, emoji: "🏛️" },
  "Bodø":         { min: 360, max: 440, emoji: "🦅" },
  "Lofoten":      { min: 420, max: 520, emoji: "🏔️" },
  "Alta":         { min: 360, max: 440, emoji: "🌌" },
  "Nordkapp":     { min: 450, max: 560, emoji: "🌅" },
  "Tromsø":       { min: 380, max: 460, emoji: "🐋" },
  "Bergen":       { min: 340, max: 420, emoji: "🌧️" },
  "Voss":         { min: 310, max: 390, emoji: "🏄" },
  "Ålesund":      { min: 320, max: 400, emoji: "🦅" },
  "Kristiansand": { min: 260, max: 340, emoji: "☀️" },
  "Stavanger":    { min: 280, max: 360, emoji: "🛢️" },
  "Haugesund":    { min: 260, max: 330, emoji: "⛵" },
};

const CAMPING_TYPES = ["camping", "bobil", "bobil_strom", "bobil_full", "gaard", "baatplass", "parking", "storage"];

async function findSpaceForCity(by: string, datoFra: Date, dag: number): Promise<{
  tittel: string; plassId: number | null; pris: number; type: string; erEkt: boolean;
}> {
  const byVariants = [by, by.toLowerCase()];

  const spaces = await db.select({
    id: spacesTable.id,
    tittel: spacesTable.tittel,
    type: spacesTable.type,
  }).from(spacesTable)
    .where(and(
      eq(spacesTable.erGodkjent, true),
      eq(spacesTable.erAktiv, true),
      inArray(spacesTable.by, byVariants),
    ))
    .limit(5);

  if (spaces.length > 0) {
    // Pick a deterministic space based on dag number to add variety
    const space = spaces[dag % spaces.length];
    const prices = await db.select().from(pricesTable).where(eq(pricesTable.plassId, space.id));
    const nattPris = prices.find(p => p.periode === "natt")?.belop
      ?? prices.find(p => p.periode === "dag")?.belop;

    if (nattPris) {
      return { tittel: space.tittel, plassId: space.id, pris: Math.round(nattPris), type: space.type, erEkt: true };
    }
  }

  // Fall back to simulated pricing
  const bInfo = BY_PRIS[by] ?? { min: 300, max: 420, emoji: "🏕️" };
  const seed = dag * 37 + by.charCodeAt(0);
  const pris = Math.round(bInfo.min + ((seed * 1234567) % (bInfo.max - bInfo.min)));

  const campingTypes = ["camping", "bobil", "gaard"];
  const type = campingTypes[dag % campingTypes.length];

  const names: Record<string, string[]> = {
    "Hamar": ["Hamar Camping Strand", "Mjøsa Camping"],
    "Lillehammer": ["Lillehammer Camping", "Hunderfossen Camping"],
    "Trondheim": ["Trondheim Camping", "Nidelva Camping"],
    "Bodø": ["Bodø Camping", "Salten Camping"],
    "Lofoten": ["Lofoten Camping", "Svolvær Camping"],
    "Bergen": ["Bergen Camping Park", "Bergenshus Camping"],
    "Voss": ["Voss Camping", "Vossestrand Camping"],
    "Alta": ["Alta Camping", "Nordlys Camping"],
    "Nordkapp": ["Nordkapp Camping", "Magerøya Camping"],
    "Tromsø": ["Tromsø Camping", "Polarmåken Camping"],
    "Ålesund": ["Ålesund Camping", "Giske Camping"],
    "Kristiansand": ["Kristiansand Camping", "Sørlandsparken Camping"],
    "Stavanger": ["Stavanger Camping", "Mosvannet Camping"],
  };

  const byNames = names[by] ?? [`${by} Camping`, `${by} Naturcamp`];
  const tittel = byNames[dag % byNames.length];

  return { tittel, plassId: null, pris, type, erEkt: false };
}

router.get("/reise/ruter", async (_req, res): Promise<void> => {
  const ruter = Object.keys(RUTER).map(navn => ({
    navn,
    fra: RUTER[navn].fra,
    til: RUTER[navn].til,
    antallStopp: RUTER[navn].stopp.length - 1,
  }));
  res.json({ ruter });
});

router.post("/reise/plan", async (req, res): Promise<void> => {
  const { fra, til, datoFra, antallNetter } = req.body;

  if (!fra || !til || !datoFra || !antallNetter) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  const netter = Math.max(1, Math.min(14, Number(antallNetter)));
  const startDato = new Date(datoFra);

  // Find matching route
  const ruteKey = Object.keys(RUTER).find(k =>
    RUTER[k].fra.toLowerCase() === fra.toLowerCase() &&
    RUTER[k].til.toLowerCase() === til.toLowerCase()
  );

  let stopp: string[];
  if (ruteKey) {
    const fulleStopp = RUTER[ruteKey].stopp;
    // Distribute stops evenly across number of nights
    if (netter >= fulleStopp.length - 1) {
      stopp = fulleStopp.slice(1); // skip departure city, all stops
    } else {
      // Pick evenly distributed stops
      const step = (fulleStopp.length - 1) / netter;
      stopp = Array.from({ length: netter }, (_, i) =>
        fulleStopp[Math.min(Math.round((i + 1) * step), fulleStopp.length - 1)]
      );
    }
  } else {
    // Generic: just use fra as start and til as end with intermediate mocks
    stopp = netter === 1 ? [til] : [fra, til].slice(0, netter);
  }

  const planStopp = await Promise.all(
    stopp.map(async (by, idx) => {
      const dato = new Date(startDato);
      dato.setDate(dato.getDate() + idx);
      const space = await findSpaceForCity(by, dato, idx);
      const bInfo = BY_PRIS[by] ?? { emoji: "🏕️" };
      return {
        dag: idx + 1,
        by,
        emoji: bInfo.emoji ?? "🏕️",
        dato: dato.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" }),
        datoISO: dato.toISOString().split("T")[0],
        tittel: space.tittel,
        plassId: space.plassId,
        pris: space.pris,
        type: space.type,
        erEkt: space.erEkt,
      };
    })
  );

  const totalPris = planStopp.reduce((s, p) => s + p.pris, 0);

  res.json({
    fra,
    til,
    datoFra: startDato.toISOString().split("T")[0],
    antallNetter: netter,
    stopp: planStopp,
    totalPris,
    antallStopp: planStopp.length,
  });
});

export default router;
