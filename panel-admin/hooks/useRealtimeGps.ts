'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UbicacionActual } from '@/lib/types/database';

export type GpsConnectionStatus = 'connecting' | 'connected' | 'error';

export function useRealtimeGps() {
  const [ubicaciones, setUbicaciones] = useState<UbicacionActual[]>([]);
  const [status, setStatus] = useState<GpsConnectionStatus>('connecting');
  // Stable client ref — never recreated across renders
  const clientRef = useRef(createClient());

  useEffect(() => {
    const supabase = clientRef.current;
    let mounted = true;

    // ── 1. Load current snapshot ───────────────────────────────────────────
    supabase
      .from('ubicaciones_actuales')
      .select('*')
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('[GPS] Error cargando ubicaciones iniciales:', error.message);
          setStatus('error');
          return;
        }
        setUbicaciones((data as UbicacionActual[]) ?? []);
      });

    // ── 2. Realtime subscription ───────────────────────────────────────────
    const channel = supabase
      .channel('gps-ubicaciones-actuales', {
        config: { broadcast: { ack: false } },
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ubicaciones_actuales' },
        (payload) => {
          if (!mounted) return;
          const updated = payload.new as UbicacionActual;
          setUbicaciones((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ubicaciones_actuales' },
        (payload) => {
          if (!mounted) return;
          const inserted = payload.new as UbicacionActual;
          setUbicaciones((prev) => {
            // Avoid duplicates if initial fetch already included it
            if (prev.some((u) => u.id === inserted.id)) return prev;
            return [...prev, inserted];
          });
        }
      )
      .subscribe((st, err) => {
        if (!mounted) return;
        if (st === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') {
          console.error('[GPS] Realtime error:', err);
          setStatus('error');
        }
      });

    // ── 3. Cleanup ─────────────────────────────────────────────────────────
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []); // Run once on mount

  return { ubicaciones, status };
}
