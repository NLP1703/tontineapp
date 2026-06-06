import { useEffect, useRef } from 'react'
import { useRealtimeStore } from '../stores/realtimeStore'

// Rejoue `onRefresh` à chaque événement temps réel (notification Socket.io reçue,
// signalée via le store realtime) et au retour de focus sur l'onglet. Permet aux
// pages de rester à jour sans rechargement manuel.
// Le chargement initial reste à la charge de la page (eventTick démarre à 0).
export function useRealtimeRefresh(onRefresh: () => void) {
  const eventTick = useRealtimeStore((s) => s.eventTick)
  // Réf pour toujours appeler la dernière version du callback sans relancer les effets.
  const cb = useRef(onRefresh)
  cb.current = onRefresh

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') cb.current()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    // eventTick > 0 => au moins un événement reçu ; on évite un double-fetch au montage.
    if (eventTick > 0) cb.current()
  }, [eventTick])
}
