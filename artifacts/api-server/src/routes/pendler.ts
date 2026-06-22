import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, spacesTable, pricesTable } from "@workspace/db";

const router = Router();

// Norwegian locations with coordinates
export const LOKASJONER: Record<string, { lat: number; lng: number; by: string; region: string }> = {
  // Oslo sentrum & indre
  "Oslo Sentrum":       { lat: 59.9139, lng: 10.7522, by: "Oslo", region: "oslo" },
  "Oslo Frogner":       { lat: 59.9218, lng: 10.7036, by: "Oslo", region: "oslo" },
  "Oslo Majorstuen":    { lat: 59.9300, lng: 10.7150, by: "Oslo", region: "oslo" },
  "Oslo Grünerløkka":   { lat: 59.9231, lng: 10.7583, by: "Oslo", region: "oslo" },
  "Oslo Sagene":        { lat: 59.9387, lng: 10.7467, by: "Oslo", region: "oslo" },
  "Oslo St. Hanshaugen":{ lat: 59.9280, lng: 10.7350, by: "Oslo", region: "oslo" },
  "Oslo Nydalen":       { lat: 59.9480, lng: 10.7644, by: "Oslo", region: "oslo" },
  "Oslo Hasle/Alna":    { lat: 59.9286, lng: 10.8002, by: "Oslo", region: "oslo" },
  "Oslo Helsfyr":       { lat: 59.9107, lng: 10.8000, by: "Oslo", region: "oslo" },
  "Oslo Sinsen":        { lat: 59.9388, lng: 10.7871, by: "Oslo", region: "oslo" },
  "Oslo Ullevål":       { lat: 59.9420, lng: 10.7333, by: "Oslo", region: "oslo" },
  "Oslo Holmlia":       { lat: 59.8450, lng: 10.8103, by: "Oslo", region: "oslo" },
  // Oslo vest / Asker
  "Fornebu":            { lat: 59.8975, lng: 10.6150, by: "Bærum", region: "oslo" },
  "Bærum":              { lat: 59.8961, lng: 10.5276, by: "Bærum", region: "oslo" },
  "Sandvika":           { lat: 59.8900, lng: 10.5230, by: "Bærum", region: "oslo" },
  "Asker":              { lat: 59.8330, lng: 10.4400, by: "Asker", region: "oslo" },
  // Oslo øst
  "Lørenskog":          { lat: 59.9186, lng: 10.9672, by: "Lørenskog", region: "oslo" },
  "Lillestrøm":         { lat: 59.9569, lng: 11.0494, by: "Lillestrøm", region: "oslo" },
  "Ski":                { lat: 59.7197, lng: 10.8353, by: "Ski", region: "oslo" },
  "Jessheim":           { lat: 60.1447, lng: 11.1697, by: "Jessheim", region: "oslo" },
  "Moss":               { lat: 59.4336, lng: 10.6586, by: "Moss", region: "oslo" },
  "Drammen":            { lat: 59.7441, lng: 10.2043, by: "Drammen", region: "vestfold" },
  // Bergen
  "Bergen Sentrum":     { lat: 59.9083, lng: 5.3325, by: "Bergen", region: "bergen" },
  "Bergen Laksevåg":    { lat: 60.3829, lng: 5.2803, by: "Bergen", region: "bergen" },
  "Bergen Fana":        { lat: 60.2995, lng: 5.3567, by: "Bergen", region: "bergen" },
  "Bergen Åsane":       { lat: 60.4641, lng: 5.3391, by: "Bergen", region: "bergen" },
  "Bergen Ytrebygda":   { lat: 60.2712, lng: 5.2290, by: "Bergen", region: "bergen" },
  // Trondheim
  "Trondheim Sentrum":  { lat: 63.4305, lng: 10.3951, by: "Trondheim", region: "trondheim" },
  "Trondheim Lade":     { lat: 63.4461, lng: 10.4475, by: "Trondheim", region: "trondheim" },
  "Trondheim Heimdal":  { lat: 63.3569, lng: 10.3618, by: "Trondheim", region: "trondheim" },
  "Trondheim Ranheim":  { lat: 63.4175, lng: 10.5353, by: "Trondheim", region: "trondheim" },
  // Stavanger
  "Stavanger Sentrum":  { lat: 58.9700, lng: 5.7331, by: "Stavanger", region: "stavanger" },
  "Stavanger Madla":    { lat: 58.9441, lng: 5.6686, by: "Stavanger", region: "stavanger" },
  "Sandnes":            { lat: 58.8522, lng: 5.7352, by: "Sandnes", region: "stavanger" },
  // Nord
  "Tromsø":             { lat: 69.6495, lng: 18.9553, by: "Tromsø", region: "nord" },
  "Bodø":               { lat: 67.2804, lng: 14.4049, by: "Bodø", region: "nord" },
};

export const LOKASJON_KEYS = Object.keys(LOKASJONER);

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Distance from point P to line segment AB
function pointToSegmentMeters(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): { distM: number; projection: number } {
  const ax = aLng, ay = aLat, bx = bLng, by = bLat, px = pLng, py = pLat;
  const abx = bx - ax, aby = by - ay;
  const abLen2 = abx * abx + aby * aby;
  const t = abLen2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / abLen2));
  const closestX = ax + t * abx;
  const closestY = ay + t * aby;
  const distM = haversineMeters(py, px, closestY, closestX);
  return { distM, projection: t };
}

// Avg sentrum price by region (kr/mnd)
const SENTRUM_PRIS: Record<string, number> = {
  oslo: 2200, bergen: 1900, trondheim: 1700, stavanger: 1800, vestfold: 1500, nord: 1400,
};

// GET /api/pendler/finn
router.get("/pendler/finn", async (req, res): Promise<void> => {
  const { hjem, jobb, arbeidstider } = req.query as Record<string, string>;

  if (!hjem || !jobb) {
    res.status(400).json({ error: "Hjem og jobb er påkrevd" });
    return;
  }

  const hjemLok = LOKASJONER[hjem];
  const jobbLok = LOKASJONER[jobb];

  if (!hjemLok || !jobbLok) {
    res.status(400).json({ error: "Ukjent lokasjon" });
    return;
  }

  const routeDistM = haversineMeters(hjemLok.lat, hjemLok.lng, jobbLok.lat, jobbLok.lng);

  // Get all approved active spaces
  const spaces = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.erGodkjent, true), eq(spacesTable.erAktiv, true)));

  const region = hjemLok.region;
  const sentrum = SENTRUM_PRIS[region] ?? 1800;

  const results = [];

  for (const space of spaces) {
    if (!space.breddegrad || !space.lengdegrad) continue;

    const { distM: routeDistM2, projection } = pointToSegmentMeters(
      space.breddegrad, space.lengdegrad,
      hjemLok.lat, hjemLok.lng,
      jobbLok.lat, jobbLok.lng
    );

    // Space must be roughly along the route (not past job or behind home)
    if (projection < 0.05 || projection > 0.98) continue;
    // Max 6km off the straight-line route
    if (routeDistM2 > 6000) continue;

    // Detour = extra km vs going direct
    const hjemToSpace = haversineMeters(hjemLok.lat, hjemLok.lng, space.breddegrad, space.lengdegrad);
    const spaceToJobb = haversineMeters(space.breddegrad, space.lengdegrad, jobbLok.lat, jobbLok.lng);
    const detourM = Math.max(0, (hjemToSpace + spaceToJobb) - routeDistM);

    // Detour vs going to sentrum (hypothetical)
    const jobbToSentrum = haversineMeters(jobbLok.lat, jobbLok.lng, hjemLok.lat, hjemLok.lng) * 0.3;
    const sentrumsDetourM = Math.max(0, jobbToSentrum);
    const tidsbesparelsePerTur = Math.max(0, (sentrumsDetourM - detourM) / 1000 / 30 * 60); // minutes
    const tidsbesparelsePerDag = Math.round(tidsbesparelsePerTur * 2 * 10) / 10; // round trip

    // Get prices
    const prices = await db.select().from(pricesTable).where(eq(pricesTable.plassId, space.id));
    const maanedPris = prices.find(p => p.periode === "maaned")?.belop
      ?? prices.find(p => p.periode === "dag")?.belop
        ? Math.round((prices.find(p => p.periode === "dag")?.belop ?? 150) * 22)
        : null;

    if (!maanedPris) continue;

    const kostbesparelsePerAar = Math.max(0, Math.round((sentrum - maanedPris) * 12 / 100) * 100);
    const walkMinutter = Math.round(hjemToSpace > spaceToJobb
      ? (spaceToJobb / 1000 / 5 * 60)
      : (hjemToSpace / 1000 / 5 * 60));
    const gangAvstand = Math.min(spaceToJobb, hjemToSpace);

    results.push({
      id: space.id,
      tittel: space.tittel,
      adresse: space.adresse,
      by: space.by,
      type: space.type,
      fasiliteter: space.fasiliteter,
      breddegrad: space.breddegrad,
      lengdegrad: space.lengdegrad,
      maanedPris,
      detourM: Math.round(detourM),
      routeAvstandM: Math.round(routeDistM2),
      projection: Math.round(projection * 100),
      tidsbesparelsePerDag,
      kostbesparelsePerAar,
      gangAvstandM: Math.round(gangAvstand),
      walkMinutter: Math.max(1, walkMinutter),
      score: kostbesparelsePerAar + tidsbesparelsePerDag * 500 - detourM * 0.1 - routeDistM2 * 0.05,
    });
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, 5);

  res.json({
    hjem: { navn: hjem, ...hjemLok },
    jobb: { navn: jobb, ...jobbLok },
    routeDistKm: Math.round(routeDistM / 100) / 10,
    sentrumsreferansePris: sentrum,
    arbeidstider: arbeidstider ?? "08:00–16:00",
    anbefalinger: top,
  });
});

// GET /api/pendler/lokasjoner
router.get("/pendler/lokasjoner", (_req, res): void => {
  res.json(LOKASJON_KEYS);
});

export default router;
