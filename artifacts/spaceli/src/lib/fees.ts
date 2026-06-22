export const PLATFORM_FEE_RATE = 0.08;

export function beregnLeietakerPris(listepris: number) {
  const serviceavgift = Math.round(listepris * PLATFORM_FEE_RATE);
  const totalBetaler = listepris + serviceavgift;
  return { listepris, serviceavgift, totalBetaler };
}

export function beregnUtleierUtbetaling(listepris: number) {
  const lediAndel = Math.round(listepris * PLATFORM_FEE_RATE);
  const utbetaling = listepris - lediAndel;
  return { listepris, lediAndel, utbetaling, arlig: utbetaling * 12 };
}

export function beregnLediInntekt(listepris: number) {
  const fraUtleier = Math.round(listepris * PLATFORM_FEE_RATE);
  const fraLeietaker = Math.round(listepris * PLATFORM_FEE_RATE);
  return { fraUtleier, fraLeietaker, totalt: fraUtleier + fraLeietaker };
}
