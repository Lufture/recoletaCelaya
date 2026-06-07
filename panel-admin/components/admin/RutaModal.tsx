'use client';

import { useState, useEffect } from 'react';
import { X, Route, Plus, Trash2, MapPin, Navigation } from 'lucide-react';

interface RutaModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSave:   () => void;
  ruta?:    any;
}

interface PuntoRuta {
  coloniaId:   string;
  latitud:     string;
  longitud:    string;
  descripcion: string;
}

const EMPTY_PUNTO: PuntoRuta = { coloniaId: '', latitud: '', longitud: '', descripcion: '' };

const ESTADOS = [
  { value: 'activa',      label: 'Activa' },
  { value: 'programada',  label: 'Programada' },
  { value: 'pausada',     label: 'Pausada' },
  { value: 'finalizada',  label: 'Finalizada' },
  { value: 'cancelada',   label: 'Cancelada' },
];

export default function RutaModal({ isOpen, onClose, onSave, ruta }: RutaModalProps) {
  const isEdit = !!ruta;

  const [form, setForm] = useState({
    routeId:     '',
    nombre:      '',
    descripcion: '',
    colorMapa:   '#00897b',
    estado:      'activa',
    activo:      true,
  });

  // Puntos de la ruta
  const [puntoInicio,  setPuntoInicio]  = useState<PuntoRuta>({ ...EMPTY_PUNTO });
  const [intermedios,  setIntermedios]  = useState<PuntoRuta[]>([]);
  const [puntoFin,     setPuntoFin]     = useState<PuntoRuta>({ ...EMPTY_PUNTO });

  const [colonias,        setColonias]        = useState<any[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingPosiciones, setLoadingPosiciones] = useState(false);
  const [error,           setError]           = useState('');

  // ── Cargar Colonias Disponibles ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/admin/colonias?activa=true&limit=500', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(json => setColonias(json.data ?? []))
      .catch(console.error);
  }, [isOpen]);

  // ── Populate form when editing ──────────────────────────────────────────────
  useEffect(() => {
    if (ruta) {
      setForm({
        routeId:     ruta.route_id      ?? '',
        nombre:      ruta.nombre        ?? '',
        descripcion: ruta.descripcion   ?? '',
        colorMapa:   ruta.color_mapa    ?? '#00897b',
        estado:      ruta.estado        ?? 'activa',
        activo:      ruta.activo        ?? true,
      });
    } else {
      setForm({ routeId: '', nombre: '', descripcion: '', colorMapa: '#00897b', estado: 'activa', activo: true });
      setPuntoInicio({ ...EMPTY_PUNTO });
      setIntermedios([]);
      setPuntoFin({ ...EMPTY_PUNTO });
    }
    setError('');
  }, [ruta, isOpen]);

  // ── Fetch posiciones al editar ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !ruta) return;
    let mounted = true;
    setLoadingPosiciones(true);

    fetch(`/api/admin/rutas/${ruta.id}/posiciones`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        const positions = (json.data ?? []) as any[];
        if (positions.length === 0) {
          setPuntoInicio({ ...EMPTY_PUNTO });
          setIntermedios([]);
          setPuntoFin({ ...EMPTY_PUNTO });
          return;
        }

        const sorted = positions.sort((a: any, b: any) => a.position_id - b.position_id);
        const first = sorted[0];
        const last  = sorted[sorted.length - 1];
        const mids  = sorted.slice(1, -1);

        const mapPos = (p: any) => ({
          coloniaId:   p.colonia_id ?? '',
          latitud:     p.latitud ? String(p.latitud) : '',
          longitud:    p.longitud ? String(p.longitud) : '',
          descripcion: p.descripcion ?? '',
        });

        setPuntoInicio(mapPos(first));
        setPuntoFin(mapPos(last));
        setIntermedios(mids.map(mapPos));
      })
      .catch(() => {
        if (mounted) {
          setPuntoInicio({ ...EMPTY_PUNTO });
          setIntermedios([]);
          setPuntoFin({ ...EMPTY_PUNTO });
        }
      })
      .finally(() => { if (mounted) setLoadingPosiciones(false); });

    return () => { mounted = false; };
  }, [ruta?.id, isOpen]);

  if (!isOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handlePuntoChange = (
    setter: React.Dispatch<React.SetStateAction<PuntoRuta>>,
    coloniaId: string
  ) => {
    const selected = colonias.find(c => c.id === coloniaId);
    if (selected) {
      setter({
        coloniaId: selected.id,
        latitud: selected.latitud ? String(selected.latitud) : '',
        longitud: selected.longitud ? String(selected.longitud) : '',
        descripcion: selected.nombre,
      });
    } else {
      setter({ ...EMPTY_PUNTO });
    }
  };

  const handleIntermedioChange = (idx: number, coloniaId: string) => {
    const selected = colonias.find(c => c.id === coloniaId);
    if (selected) {
      setIntermedios((prev) => prev.map((p, i) => i === idx ? {
        coloniaId: selected.id,
        latitud: selected.latitud ? String(selected.latitud) : '',
        longitud: selected.longitud ? String(selected.longitud) : '',
        descripcion: selected.nombre,
      } : p));
    } else {
      setIntermedios((prev) => prev.map((p, i) => i === idx ? { ...EMPTY_PUNTO } : p));
    }
  };

  const addIntermedio = () => {
    setIntermedios((prev) => [...prev, { ...EMPTY_PUNTO }]);
  };

  const removeIntermedio = (idx: number) => {
    setIntermedios((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Build positions array ───────────────────────────────────────────────────
  const buildPositions = () => {
    const all: PuntoRuta[] = [puntoInicio, ...intermedios, puntoFin];
    return all.filter(p => p.coloniaId).map((p, idx) => ({
      positionId:  idx + 1,
      coloniaId:   p.coloniaId,
      latitud:     p.latitud ? parseFloat(p.latitud) : null,
      longitud:    p.longitud ? parseFloat(p.longitud) : null,
      esBaseSalida:  idx === 0,
      esRetornoBase: idx === all.length - 1,
      descripcion:   p.descripcion || null,
    }));
  };

  const hasValidPoints = () => {
    return puntoInicio.coloniaId && puntoFin.coloniaId;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidPoints()) {
      setError('Debes seleccionar al menos un punto de inicio y fin (colonias).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let rutaId: string;

      if (isEdit) {
        const res = await fetch(`/api/admin/rutas/${ruta.id}`, {
          method:      'PATCH',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            nombre:      form.nombre      || undefined,
            descripcion: form.descripcion || null,
            colorMapa:   form.colorMapa   || null,
            estado:      form.estado      || undefined,
            activo:      form.activo,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
        rutaId = ruta.id;

        await fetch(`/api/admin/rutas/${rutaId}/posiciones`, {
          method:      'DELETE',
          credentials: 'same-origin',
        });
      } else {
        const res = await fetch('/api/admin/rutas', {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            routeId:     form.routeId.trim(),
            nombre:      form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            colorMapa:   form.colorMapa || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
        rutaId = json.id;
      }

      const positions = buildPositions();
      if (positions.length > 0) {
        const posRes = await fetch(`/api/admin/rutas/${rutaId}/posiciones`, {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body:        JSON.stringify(positions),
        });
        const posJson = await posRes.json();
        if (!posRes.ok) throw new Error(posJson.error ?? 'Error al guardar posiciones');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render punto ────────────────────────────────────────────────────────────
  const renderPunto = (
    punto: PuntoRuta,
    onChange: (coloniaId: string) => void,
    label: string,
    color: string,
    ringColor: string,
    showLine: boolean,
    onRemove?: () => void,
  ) => (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center w-5 shrink-0">
        <div className={`w-3.5 h-3.5 rounded-full ${color} ring-4 ${ringColor} z-10 mt-3 shrink-0`} />
        {showLine && <div className="w-0.5 flex-1 bg-gray-200 min-h-[16px]" />}
      </div>
      <div className={`flex-1 bg-white border border-gray-200 rounded-xl p-3 ${showLine ? 'mb-2' : ''} transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[var(--rc-blue-800)] flex items-center gap-1.5">
            <MapPin size={12} /> {label}
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar punto"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <div className="mt-1">
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Seleccionar Colonia</label>
          <select
            value={punto.coloniaId}
            onChange={(e) => onChange(e.target.value)}
            className="input text-xs py-2 px-2 mt-0.5 bg-white"
          >
            <option value="">-- Selecciona una colonia --</option>
            {colonias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[var(--rc-blue-800)] flex items-center gap-2">
            <Route size={18} className="text-[var(--rc-blue-600)]" />
            {isEdit ? 'Editar ruta' : 'Nueva ruta'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form id="ruta-form" onSubmit={handleSubmit} className="space-y-5">
            {/* ── Información básica ────────────────────────────────────────── */}
            <div className="space-y-4">
              {!isEdit && (
                <div>
                  <label className="label">ID de ruta *</label>
                  <input
                    type="text"
                    name="routeId"
                    value={form.routeId}
                    onChange={handleChange}
                    className="input font-mono"
                    placeholder="Ej. RT-006"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Identificador único visible. No se puede cambiar después.
                  </p>
                </div>
              )}
              {isEdit && (
                <div>
                  <label className="label">ID de ruta</label>
                  <input
                    type="text"
                    value={form.routeId}
                    readOnly
                    className="input font-mono bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
              )}
              <div>
                <label className="label">Nombre / Zona *</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej. Centro Histórico"
                  required
                />
              </div>
              <div>
                <label className="label">Descripción (opcional)</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="input min-h-[72px] resize-y"
                  placeholder="Notas sobre el recorrido, restricciones, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Color en mapa</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="colorMapa"
                      value={form.colorMapa}
                      onChange={handleChange}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-gray-500">{form.colorMapa}</span>
                  </div>
                </div>
                {isEdit && (
                  <div>
                    <label className="label">Estado</label>
                    <select name="estado" value={form.estado} onChange={handleChange} className="input bg-white">
                      {ESTADOS.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {isEdit && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo-check"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--rc-blue-600)]"
                  />
                  <label htmlFor="activo-check" className="text-sm text-gray-700 font-medium cursor-pointer">
                    Ruta activa
                  </label>
                </div>
              )}
            </div>

            {/* ── Puntos de la ruta ─────────────────────────────────────────── */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-[var(--rc-blue-800)] flex items-center gap-2 mb-4">
                <Navigation size={16} className="text-[var(--rc-blue-600)]" />
                Puntos de la ruta (Colonias)
              </h3>

              {loadingPosiciones ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                  <div className="w-3 h-3 rounded-full border-[1.5px] border-[var(--rc-blue-500)] border-t-transparent animate-spin" />
                  Cargando puntos…
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  {/* Punto de inicio */}
                  {renderPunto(
                    puntoInicio,
                    (coloniaId) => handlePuntoChange(setPuntoInicio, coloniaId),
                    'Punto de inicio',
                    'bg-emerald-500',
                    'ring-emerald-100',
                    true,
                  )}

                  {/* Puntos intermedios */}
                  {intermedios.map((punto, idx) => (
                    <div key={idx}>
                      {renderPunto(
                        punto,
                        (coloniaId) => handleIntermedioChange(idx, coloniaId),
                        `Punto intermedio ${idx + 1}`,
                        'bg-blue-500',
                        'ring-blue-100',
                        true,
                        () => removeIntermedio(idx),
                      )}
                    </div>
                  ))}

                  {/* Botón agregar intermedio */}
                  <div className="flex gap-3 relative">
                    <div className="flex flex-col items-center w-5 shrink-0">
                      <div className="w-0.5 h-4 bg-gray-200" />
                    </div>
                    <button
                      type="button"
                      onClick={addIntermedio}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 mb-2 border-2 border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-500 hover:border-[var(--rc-blue-400)] hover:text-[var(--rc-blue-600)] hover:bg-blue-50/50 transition-all"
                    >
                      <Plus size={14} />
                      Agregar punto intermedio
                    </button>
                  </div>

                  {/* Punto de fin */}
                  {renderPunto(
                    puntoFin,
                    (coloniaId) => handlePuntoChange(setPuntoFin, coloniaId),
                    'Punto de fin',
                    'bg-red-500',
                    'ring-red-100',
                    false,
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="ruta-form" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear ruta'}
          </button>
        </div>
      </div>
    </div>
  );
}
