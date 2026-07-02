import type { Server } from "socket.io";

let _io: Server | null = null;

export const setIo = (io: Server): void => {
  _io = io;
};

export const getIo = (): Server | null => _io;

export type SpaceStatus = "available" | "reserved" | "booked" | "closed";

export interface SpaceStatusEvent {
  spaceId: number;
  status: SpaceStatus;
  expiresAt?: string;
}

export interface ActivityEvent {
  id: number;
  by: string;
  tittel: string;
  action: "reserved" | "booked" | "released";
  ts: number;
}

// Live stats: ledigCount per city — starts at 0, grows with real listings
const _cityStats: Record<string, number> = {
  "Oslo": 0,
  "Bergen": 0,
  "Trondheim": 0,
  "Stavanger": 0,
  "Tromsø": 0,
  "Hele Norge": 0,
};

export function tickLiveStats(): void {
  _io?.emit("live_stats", { stats: _cityStats, ts: Date.now() });
}

export function adjustCityStat(by: string, delta: number): void {
  if (_cityStats[by] !== undefined) {
    _cityStats[by] = Math.max(0, _cityStats[by] + delta);
    _cityStats["Hele Norge"] = Math.max(0, (_cityStats["Hele Norge"] ?? 0) + delta);
  }
}

let _activityId = 0;
const ACTIVITY_NAMES: Record<string, string[]> = {
  "Oslo":       ["Garasjeplass Frogner", "Parkeringsplass Aker Brygge", "Bod Grünerløkka", "Elbilplass Majorstua"],
  "Bergen":     ["Parkeringsplass Sentrum", "Garasje Bergenhus", "Bod Sandviken"],
  "Trondheim":  ["Parkering Midtbyen", "Bod Nedre Elvehavn", "Garasje Lade"],
  "Stavanger":  ["Parkering Stavanger S", "Bod Lagårdsveien", "Garasje Paradis"],
  "Tromsø":     ["Parkering Sentrum", "Garasje Giæverbukta", "Bod Langnes"],
};

export function emitActivityFeed(spaceId: number, by: string, action: ActivityEvent["action"]): void {
  const names = ACTIVITY_NAMES[by] ?? ACTIVITY_NAMES["Oslo"];
  const tittel = names[Math.floor(Math.random() * names.length)];
  const event: ActivityEvent = {
    id: ++_activityId,
    by,
    tittel,
    action,
    ts: Date.now(),
  };
  _io?.emit("activity_event", event);
}

export function emitSpaceReserved(spaceId: number, expiresAt: string): void {
  _io?.emit("space_reserved", { spaceId, status: "reserved", expiresAt } satisfies SpaceStatusEvent);
}

export function emitSpaceBooked(spaceId: number): void {
  _io?.emit("space_booked", { spaceId, status: "booked" } satisfies SpaceStatusEvent);
}

export function emitSpaceReleased(spaceId: number): void {
  _io?.emit("space_released", { spaceId, status: "available" } satisfies SpaceStatusEvent);
}

export interface VarselEvent {
  id: number;
  tittel: string;
  melding: string;
  plassId?: number | null;
  opprettetDato: string;
}

export function emitVarselToUser(userId: number, varsel: VarselEvent): void {
  _io?.to(`user:${userId}`).emit("varsel", varsel);
}
