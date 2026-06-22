import { Router } from "express";

const router = Router();

const REGIONPRISER: Record<string, { garasje: number; parkering: number; bod: number; by: string }> = {
  "0": { garasje: 2800, parkering: 2100, bod: 1400, by: "Oslo sentrum" },
  "1": { garasje: 2400, parkering: 1800, bod: 1100, by: "Oslo indre øst/vest" },
  "2": { garasje: 2200, parkering: 1700, bod: 1000, by: "Oslo øst/Akershus" },
  "3": { garasje: 1900, parkering: 1400, bod: 850,  by: "Viken sør/Grenland" },
  "4": { garasje: 2000, parkering: 1500, bod: 900,  by: "Stavanger-regionen" },
  "5": { garasje: 2200, parkering: 1700, bod: 1050, by: "Bergensregionen" },
  "6": { garasje: 1600, parkering: 1200, bod: 700,  by: "Vestlandet/Møre" },
  "7": { garasje: 1800, parkering: 1350, bod: 800,  by: "Trondheims-regionen" },
  "8": { garasje: 1400, parkering: 1050, bod: 650,  by: "Nordland/Nord-Norge" },
  "9": { garasje: 1500, parkering: 1100, bod: 700,  by: "Troms/Finnmark" },
};

// Known large-city postal codes — boost
const STORBYBONUS: Record<string, number> = {
  "0": 1.0, "4006": 1.05, "4007": 1.05, "4008": 1.05,
  "5003": 1.05, "5004": 1.05, "5005": 1.05,
  "7010": 1.03, "7011": 1.03, "7012": 1.03,
};

type SpaceType = "garasje" | "parkering" | "bod" | "campingvogn" | "henger";

const TYPE_LABELS: Record<SpaceType, string> = {
  garasje: "Garasje",
  parkering: "Parkeringsplass",
  bod: "Kjeller-/loftsbod",
  campingvogn: "Campingvognplass",
  henger: "Hengerplass",
};

const TYPE_FACTOR: Record<SpaceType, number> = {
  garasje: 1.0,
  parkering: 0.72,
  bod: 0.48,
  campingvogn: 0.85,
  henger: 0.65,
};

// GET /megler/estimat?postnummer=0150&type=garasje
router.get("/megler/estimat", (req, res): void => {
  const postnummer = String(req.query.postnummer ?? "").trim();
  const type = (String(req.query.type ?? "garasje").trim()) as SpaceType;

  if (!postnummer || postnummer.length < 4) {
    res.status(400).json({ error: "Ugyldig postnummer" });
    return;
  }

  const regionKey = postnummer[0];
  const region = REGIONPRISER[regionKey] ?? REGIONPRISER["3"];
  const faktor = TYPE_FACTOR[type] ?? 1.0;
  const storbyFaktor = STORBYBONUS[postnummer.slice(0, 4)] ?? (STORBYBONUS[postnummer[0]] ?? 1.0);

  const basePrisPerMaaned = Math.round(
    region[type in region ? (type as "garasje" | "parkering" | "bod") : "garasje"] * faktor * storbyFaktor / 50
  ) * 50;

  const prisPerMaaned = basePrisPerMaaned;
  const prisPerAar = prisPerMaaned * 12;
  const nettoPerAar = Math.round(prisPerAar * 0.92 / 100) * 100;
  const nettoPerMaaned = Math.round(nettoPerAar / 12 / 10) * 10;

  res.json({
    postnummer,
    type,
    typeLabel: TYPE_LABELS[type] ?? type,
    by: region.by,
    prisPerMaaned,
    prisPerAar,
    nettoPerAar,
    nettoPerMaaned,
    lediFee: 8,
    populaertOmraade: ["0", "5"].includes(regionKey),
    eksempelSetning: `Denne ${TYPE_LABELS[type]?.toLowerCase() ?? type} kan gi ${prisPerAar.toLocaleString("nb-NO")} kr/år i leieinntekt via Ledi`,
  });
});

// POST /megler/kontakt — agent sign-up
router.post("/megler/kontakt", (req, res): void => {
  const { navn, epost, firma, postnummer, antallKunder } = req.body as Record<string, string>;
  if (!navn || !epost || !firma) {
    res.status(400).json({ error: "Navn, e-post og firma er påkrevd" });
    return;
  }
  // In production: send to CRM / email
  res.status(201).json({
    ok: true,
    melding: `Takk, ${navn}! Vi tar kontakt innen 24 timer med din personlige Ledi-partner-pakke.`,
    ref: `LM-${Date.now().toString(36).toUpperCase()}`,
  });
});

export default router;
