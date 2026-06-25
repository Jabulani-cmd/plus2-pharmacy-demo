// Realtime cross-device store sync via Supabase Realtime broadcast.
// Mirrors a Zustand store's state across all connected devices in <1s.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { StoreApi, UseBoundStore } from "zustand";

type AnyStore = UseBoundStore<StoreApi<any>>;

const installed = new Set<string>();
let status: "live" | "reconnecting" = "reconnecting";
const listeners = new Set<() => void>();

function setStatus(next: "live" | "reconnecting") {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
}

export function useRealtimeStatus(): "live" | "reconnecting" {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return status;
}

/**
 * Mirror a Zustand store across devices via a Realtime broadcast channel.
 * Last-write-wins; fine for a demo where conflicts are rare.
 */
export function installBroadcastSync<T extends object>(
  store: AnyStore,
  channelName: string,
  pick: (state: T) => Partial<T>,
) {
  if (typeof window === "undefined") return;
  if (installed.has(channelName)) return;
  installed.add(channelName);

  let applying = false;
  let lastSerialized = JSON.stringify(pick(store.getState() as T));

  const channel = supabase.channel(`sync:${channelName}`, {
    config: { broadcast: { self: false, ack: false } },
  });

  channel.on("broadcast", { event: "state" }, (msg) => {
    const incoming = (msg.payload as { state?: Partial<T> } | undefined)?.state;
    if (!incoming) return;
    applying = true;
    try {
      store.setState(incoming as Partial<T>, false);
      lastSerialized = JSON.stringify(pick(store.getState() as T));
    } finally {
      applying = false;
    }
  });

  channel.subscribe((s) => {
    if (s === "SUBSCRIBED") setStatus("live");
    else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
      setStatus("reconnecting");
    }
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  store.subscribe((state: T) => {
    if (applying) return;
    const slice = pick(state);
    const ser = JSON.stringify(slice);
    if (ser === lastSerialized) return;
    lastSerialized = ser;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      channel.send({
        type: "broadcast",
        event: "state",
        payload: { state: slice },
      });
    }, 80);
  });
}

/** Wipe legacy localStorage state once after the realtime migration. */
export function runMigrationWipe() {
  if (typeof window === "undefined") return;
  const KEY = "kings-migration-v2";
  try {
    if (localStorage.getItem(KEY)) return;
    [
      "kings-shared-orders",
      "kings-shared-prescriptions",
      "kings-notifications",
      "kings-order-extras",
    ].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(KEY, "1");
  } catch {
    // ignore
  }
}