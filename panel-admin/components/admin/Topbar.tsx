'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell, Search, Download, LogOut, Menu } from 'lucide-react';
import { useSidebar } from '@/lib/sidebar-context';
import { useEffect, useRef, useState } from 'react';

export default function Topbar() {
  const router = useRouter();
  const { toggle } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="admin-topbar h-[var(--topbar-height)] px-4 md:px-8 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={toggle}
          className="md:hidden p-2 -ml-1 hover:bg-gray-100 rounded-lg transition-colors text-[var(--rc-slate-600)]"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-lg md:text-xl font-bold text-[var(--rc-blue-800)] truncate">
          Panel de administración
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar rutas, camiones o personal"
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rc-blue-500)] focus:border-transparent w-[300px] transition-all"
          />
        </div>

        {/* Download Report Dropdown */}
        <div className="relative hidden md:block" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--rc-blue-800)] text-white text-sm font-medium rounded-lg hover:bg-[var(--rc-blue-700)] transition-colors"
          >
            <Download size={16} />
            Descargar reporte
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="py-1">
                {[
                  { label: 'Recorridos Activos', tipo: 'vista_recorridos_activos', file: 'recorridos_activos.csv' },
                  { label: 'Reporte Diario', tipo: 'vista_reporte_diario_recorridos', file: 'reporte_diario.csv' },
                  { label: 'Alertas Pendientes', tipo: 'vista_alertas_admin_pendientes', file: 'alertas.csv' },
                  { label: 'Estado GPS', tipo: 'vista_gps_estado_camiones', file: 'estado_gps.csv' }
                ].map(rep => (
                  <button
                    key={rep.tipo}
                    onClick={(e) => {
                      setIsDropdownOpen(false);
                      const btn = e.currentTarget;
                      const originalText = btn.innerText;
                      btn.innerText = 'Descargando...';
                      fetch(`/api/admin/reportes?tipo=${rep.tipo}&formato=csv`)
                        .then(res => res.blob())
                        .then(blob => {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = rep.file;
                          a.click();
                          URL.revokeObjectURL(url);
                        })
                        .finally(() => {
                          btn.innerText = originalText;
                        });
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--rc-blue-600)] transition-colors"
                  >
                    {rep.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1 md:mx-2 hidden sm:block"></div>

        {/* Notifications */}
        <button
          type="button"
          className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500 transition-colors"
          title="Notificaciones"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
