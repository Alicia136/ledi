import { Router } from "express";

const router = Router();

const SMART_PRIS_DATA = [
  { navn: "Oslo Frogner",  garasjeMin: 2800, garasjeMax: 4000, parkeringMin: 1800, parkeringMax: 2800 },
  { navn: "Oslo Sentrum",  garasjeMin: 2200, garasjeMax: 3500, parkeringMin: 1400, parkeringMax: 2200 },
  { navn: "Oslo Sagene",   garasjeMin: 1600, garasjeMax: 2500, parkeringMin: 1000, parkeringMax: 1800 },
  { navn: "Bergen",        garasjeMin: 1800, garasjeMax: 3000, parkeringMin: 1000, parkeringMax: 1800 },
  { navn: "Trondheim",     garasjeMin: 1600, garasjeMax: 2800, parkeringMin:  900, parkeringMax: 1600 },
  { navn: "Stavanger",     garasjeMin: 1800, garasjeMax: 3200, parkeringMin: 1000, parkeringMax: 1800 },
  { navn: "Tromsø",        garasjeMin: 1400, garasjeMax: 2400, parkeringMin:  800, parkeringMax: 1400 },
  { navn: "Distrikter",    garasjeMin:  600, garasjeMax: 1200, parkeringMin:  300, parkeringMax:  700 },
];

const BYDEL_COORDS: Record<string, { lat: number; lon: number }> = {
  "Oslo Frogner":  { lat: 59.9225, lon: 10.7038 },
  "Oslo Sentrum":  { lat: 59.9139, lon: 10.7522 },
  "Oslo Sagene":   { lat: 59.9348, lon: 10.7481 },
  "Bergen":        { lat: 60.3929, lon:  5.3241 },
  "Trondheim":     { lat: 63.4305, lon: 10.3951 },
  "Stavanger":     { lat: 58.9700, lon:  5.7331 },
  "Tromsø":        { lat: 69.6489, lon: 18.9551 },
  "Distrikter":    { lat: 61.5000, lon: 10.0000 },
};

const DEMAND_BY_DISTRICT: Record<string, { level: string; days: number }> = {
  "Oslo Frogner":  { level: "Svært høy", days:  7 },
  "Oslo Sentrum":  { level: "Høy",       days: 10 },
  "Oslo Sagene":   { level: "Middels",   days: 18 },
  "Bergen":        { level: "Høy",       days: 12 },
  "Trondheim":     { level: "Middels",   days: 16 },
  "Stavanger":     { level: "Høy",       days: 11 },
  "Tromsø":        { level: "Middels",   days: 20 },
  "Distrikter":    { level: "Lav",       days: 35 },
};

const EVENTS_BY_BYDEL: Record<string, Array<{ navn: string; dato: string }>> = {
  "Oslo Frogner":  [{ navn: "Konsert – Spektrum",   dato: "7. juni" }],
  "Oslo Sentrum":  [{ navn: "Oslo Maraton",          dato: "14. september" }],
  "Bergen":        [{ navn: "Bergenfest",            dato: "12. juni" }],
  "Trondheim":     [{ navn: "Pstereo-festivalen",    dato: "21. august" }],
  "Stavanger":     [{ navn: "Nuart-festivalen",      dato: "2. september" }],
};

interface PrisFaktor {
  ikon: string;
  tittel: string;
  effekt: string;
  type: "positiv" | "negativ" | "nøytral";
  beskrivelse: string;
}

router.get("/smartpris", (_req, res): void => {
  res.json(SMART_PRIS_DATA);
});

router.get("/smartpris/suggest", (req, res): void => {
  const { district, type } = req.query as { district?: string; type?: string };
  if (!district || !type) {
    res.status(400).json({ error: "Mangler district eller type" });
    return;
  }

  const d = SMART_PRIS_DATA.find(x => x.navn.toLowerCase() === district.toLowerCase())
    ?? SMART_PRIS_DATA.find(x => x.navn === "Distrikter")!;

  const isGarasje = type === "garasje";
  const minPris = isGarasje ? d.garasjeMin : d.parkeringMin;
  const maxPris = isGarasje ? d.garasjeMax : d.parkeringMax;
  const anbefalPris = Math.round((minPris + maxPris) / 2);
  const forventetMaanedsinntekt = Math.round(anbefalPris * 0.92);

  res.json({ district: d.navn, type, anbefalPris, minPris, maxPris, forventetMaanedsinntekt });
});

router.get("/smartpris/dynamic", async (req, res): Promise<void> => {
  const { bydel, type } = req.query as { bydel?: string; type?: string };

  if (!bydel) {
    res.status(400).json({ error: "Mangler bydel" });
    return;
  }

  const d = SMART_PRIS_DATA.find(x => x.navn.toLowerCase() === bydel.toLowerCase())
    ?? SMART_PRIS_DATA.find(x => x.navn === "Distrikter")!;

  const isCamping = type === "camping";
  const isBaat = type === "baatplass";
  const isHenger = type === "henger";

  let basePris: number;
  if (isCamping) {
    basePris = 5000;
  } else if (isBaat) {
    basePris = Math.round((d.parkeringMin * 1.4 + d.parkeringMax * 1.4) / 2);
  } else if (isHenger) {
    basePris = Math.round((d.parkeringMin * 1.1 + d.parkeringMax * 1.1) / 2);
  } else {
    basePris = Math.round((d.garasjeMin + d.garasjeMax) / 2);
  }

  const coords = BYDEL_COORDS[d.navn] ?? BYDEL_COORDS["Oslo Sentrum"]!;
  const faktorer: PrisFaktor[] = [];
  let multiplier = 1.0;

  try {
    const yrRes = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${coords.lat}&lon=${coords.lon}`,
      { headers: { "User-Agent": "Ledi/1.0 hei@ledi.no" } }
    );
    if (yrRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const yrData: any = await yrRes.json();
      const timeseries = (yrData?.properties?.timeseries ?? []) as unknown[];
      const next24h = timeseries.slice(0, 24);

      const hasRain = next24h.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => (t?.data?.next_1_hours?.details?.precipitation_amount ?? 0) > 0.5
      );
      const maxWind = Math.max(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...next24h.map((t: any) => t?.data?.instant?.details?.wind_speed ?? 0)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const airTemp = (next24h[0] as any)?.data?.instant?.details?.air_temperature ?? 15;

      if (hasRain) {
        faktorer.push({
          ikon: "🌧️",
          tittel: "Dårlig vær",
          effekt: "+8%",
          type: "positiv",
          beskrivelse: "Regn de neste 24 timene øker etterspørselen etter overdekkede plasser",
        });
        multiplier *= 1.08;
      }

      if (maxWind > 10) {
        faktorer.push({
          ikon: "💨",
          tittel: "Sterk vind",
          effekt: "+5%",
          type: "positiv",
          beskrivelse: `Vindkast opptil ${Math.round(maxWind)} m/s – folk foretrekker innendørs parkering`,
        });
        multiplier *= 1.05;
      }

      if (airTemp > 22 && isCamping) {
        faktorer.push({
          ikon: "☀️",
          tittel: "Fint campingvær",
          effekt: "+12%",
          type: "positiv",
          beskrivelse: `${Math.round(airTemp)}°C og sol – høysesong for camping`,
        });
        multiplier *= 1.12;
      }
    }
  } catch {
    // yr.no utilgjengelig – fortsetter uten værstatus
  }

  const event = EVENTS_BY_BYDEL[d.navn]?.[0];
  if (event) {
    faktorer.push({
      ikon: "🎵",
      tittel: "Arrangement nær deg",
      effekt: "+20%",
      type: "positiv",
      beskrivelse: `${event.navn} – ${event.dato}. Økt behov for parkering i nærområdet`,
    });
    multiplier *= 1.20;
  }

  const demand = DEMAND_BY_DISTRICT[d.navn];
  if (demand) {
    if (demand.level === "Svært høy" || demand.level === "Høy") {
      faktorer.push({
        ikon: "📈",
        tittel: "Høy etterspørsel",
        effekt: "+10%",
        type: "positiv",
        beskrivelse: `${demand.level} etterspørsel i ${d.navn} – typisk booking innen ${demand.days} dager`,
      });
      multiplier *= 1.10;
    } else if (demand.level === "Lav") {
      faktorer.push({
        ikon: "📉",
        tittel: "Lav etterspørsel",
        effekt: "−10%",
        type: "negativ",
        beskrivelse: "Lavere aktivitet i distrikter – justerer ned for raskere booking",
      });
      multiplier *= 0.90;
    } else {
      faktorer.push({
        ikon: "📊",
        tittel: "Normal etterspørsel",
        effekt: "0%",
        type: "nøytral",
        beskrivelse: `Stabil etterspørsel i ${d.navn} – booking typisk innen ${demand.days} dager`,
      });
    }
  }

  if (faktorer.length === 0) {
    faktorer.push({
      ikon: "✅",
      tittel: "Stabil markedspris",
      effekt: "0%",
      type: "nøytral",
      beskrivelse: "Ingen spesielle faktorer påvirker prisen akkurat nå",
    });
  }

  const adjustedPris = Math.round(basePris * multiplier);
  const pct = Math.round((multiplier - 1) * 100);
  const justering = pct > 0 ? `+${pct}%` : pct < 0 ? `${pct}%` : "0%";

  res.json({ basePris, adjustedPris, justering, faktorer });
});

export default router;
