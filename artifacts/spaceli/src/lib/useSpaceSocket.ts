import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface ActivityEvent {
  id: number;
  by: string;
  tittel: string;
  action: "reserved" | "booked" | "released";
  ts: number;
}

export type SpaceStatus = "available" | "reserved" | "booked" | "closed";

export interface SpaceStatusMap {
  [spaceId: number]: SpaceStatus;
}

interface SpaceStatusEvent {
  spaceId: number;
  status: SpaceStatus;
  expiresAt?: string;
}

export interface VarselEvent {
  id: number;
  tittel: string;
  melding: string;
  plassId?: number | null;
  opprettetDato: string;
}

let sharedSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return sharedSocket;
}

export function authenticateSocket(token: string): void {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit("authenticate", token);
  } else {
    socket.once("connect", () => socket.emit("authenticate", token));
  }
}

/**
 * Subscribe to real-time space status updates from Socket.io.
 * Returns statusMap, per-city live counts, and a recent activity feed.
 */
export function useSpaceSocket(onVarsel?: (v: VarselEvent) => void): {
  statusMap: SpaceStatusMap;
  connected: boolean;
  cityStats: Record<string, number>;
  recentActivity: ActivityEvent[];
  updateStatus: (spaceId: number, status: SpaceStatus) => void;
} {
  const [statusMap, setStatusMap] = useState<SpaceStatusMap>({});
  const [connected, setConnected] = useState(false);
  const [cityStats, setCityStats] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const onVarselRef = useRef(onVarsel);
  onVarselRef.current = onVarsel;

  const updateStatus = useCallback((spaceId: number, status: SpaceStatus) => {
    setStatusMap(prev => ({ ...prev, [spaceId]: status }));
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    refCount++;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleReserved = (event: SpaceStatusEvent) => {
      setStatusMap(prev => ({ ...prev, [event.spaceId]: "reserved" }));
    };
    const handleBooked = (event: SpaceStatusEvent) => {
      setStatusMap(prev => ({ ...prev, [event.spaceId]: "booked" }));
    };
    const handleReleased = (event: SpaceStatusEvent) => {
      setStatusMap(prev => ({ ...prev, [event.spaceId]: "available" }));
    };
    const handleLiveStats = (data: { stats: Record<string, number> }) => {
      setCityStats(data.stats);
    };
    const handleActivity = (event: ActivityEvent) => {
      setRecentActivity(prev => [event, ...prev].slice(0, 5));
    };
    const handleVarsel = (v: VarselEvent) => {
      onVarselRef.current?.(v);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("space_reserved", handleReserved);
    socket.on("space_booked", handleBooked);
    socket.on("space_released", handleReleased);
    socket.on("live_stats", handleLiveStats);
    socket.on("activity_event", handleActivity);
    socket.on("varsel", handleVarsel);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("space_reserved", handleReserved);
      socket.off("space_booked", handleBooked);
      socket.off("space_released", handleReleased);
      socket.off("live_stats", handleLiveStats);
      socket.off("activity_event", handleActivity);
      socket.off("varsel", handleVarsel);

      refCount--;
      if (refCount === 0) {
        sharedSocket?.disconnect();
        sharedSocket = null;
      }
    };
  }, []);

  return { statusMap, connected, cityStats, recentActivity, updateStatus };
}
