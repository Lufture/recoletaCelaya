'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  routeId: string;
}

const ROUTES_DATA: Record<string, { name: string, lat: number, lng: number, color: string }[]> = {
  'RT-001': [
    { name: 'Rancho Seco', lat: 20.4960, lng: -100.8200, color: '#10b981' }, // emerald
    { name: 'Las Arboledas', lat: 20.5360, lng: -100.8120, color: '#3b82f6' }, // blue
    { name: 'Los Olivos', lat: 20.5510, lng: -100.7950, color: '#ef4444' }, // red
  ],
  'RT-002': [
    { name: 'Fovissste', lat: 20.5370, lng: -100.8220, color: '#10b981' }, 
    { name: 'San Juanico', lat: 20.5420, lng: -100.8250, color: '#3b82f6' }, 
    { name: 'Trojes', lat: 20.5500, lng: -100.8350, color: '#ef4444' }, 
  ]
};

export default function MiniMapaDemoRutaLeaflet({ routeId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const points = ROUTES_DATA[routeId] || [];

    // Inicializar mapa
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const boundsPoints: [number, number][] = [];

    if (points.length > 0) {
      // Trazar línea conectando los puntos
      const latLngs: [number, number][] = points.map((p) => [p.lat, p.lng]);
      L.polyline(latLngs, {
        color: '#0ea5e9',
        weight: 4,
        opacity: 0.8,
        dashArray: '8 6',
      }).addTo(map);

      // Colocar marcadores
      points.forEach((p, index) => {
        boundsPoints.push([p.lat, p.lng]);

        const isFirst = index === 0;
        const isLast = index === points.length - 1;
        
        const icon = L.divIcon({
          html: `<div style="width:16px;height:16px;background:${p.color};border:3px solid white;border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,.3)"></div>`,
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const label = isFirst ? 'Inicio' : isLast ? 'Fin' : 'Intermedio';

        L.marker([p.lat, p.lng], { icon })
          .bindPopup(
            `<div style="font-size:12px;font-family:system-ui;text-align:center;">
              <b style="color:${p.color}">${label}</b><br/>
              ${p.name}
            </div>`
          )
          .addTo(map);
      });

      // Ajustar el mapa a los puntos
      if (boundsPoints.length > 0) {
        map.fitBounds(boundsPoints as L.LatLngBoundsExpression, { padding: [30, 30] });
      }
    } else {
      // Centro genérico si no hay data
      map.setView([20.5223, -100.8122], 13);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [routeId]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl z-0" />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 text-[10px] font-semibold text-[var(--rc-blue-800)] z-[400] flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Demo de Ruta {routeId}
      </div>
    </div>
  );
}
