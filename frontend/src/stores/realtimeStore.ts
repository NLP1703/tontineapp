import { create } from 'zustand'

interface RealtimeEvent {
  title: string
  body: string
}

interface RealtimeState {
  // Incrémenté à chaque événement temps réel reçu (notification Socket.io).
  // Les pages s'abonnent à `eventTick` pour rafraîchir leurs données sans rechargement.
  eventTick: number
  lastEvent: RealtimeEvent | null
  bump: (event?: RealtimeEvent) => void
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  eventTick: 0,
  lastEvent: null,
  bump: (event) =>
    set((s) => ({ eventTick: s.eventTick + 1, lastEvent: event ?? s.lastEvent })),
}))
