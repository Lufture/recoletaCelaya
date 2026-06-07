// ============================================================
// Sidebar navigation items
// ============================================================

export interface NavItem {
  label: string;
  href: string;
  /** SVG icon name — maps to the icon rendered in Sidebar */
  icon: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { label: 'Usuarios', href: '/admin/usuarios', icon: 'usuarios' },
  { label: 'Colonias', href: '/admin/colonias', icon: 'rutas' },
  { label: 'Rutas', href: '/admin/rutas', icon: 'rutas' },
  { label: 'Camiones', href: '/admin/camiones', icon: 'camiones' },
  { label: 'GPS', href: '/admin/gps', icon: 'gps' },
  { label: 'Alertas', href: '/admin/alertas', icon: 'alertas' },
  { label: 'Reportes Chofer', href: '/admin/reportes-chofer', icon: 'reportes' },
  { label: 'Rep. Ciudadanos', href: '/admin/reportes-ciudadanos', icon: 'reportes' },
  { label: 'Notificaciones', href: '/admin/notificaciones', icon: 'notificaciones' },
  { label: 'Avisos', href: '/admin/avisos', icon: 'avisos' },
  { label: 'API Docs', href: '/admin/openapi', icon: 'gps' },
];

// ============================================================
// App metadata
// ============================================================

export const APP_NAME = 'Recolecta Celaya';
export const APP_DESCRIPTION =
  'Sistema de administración para el servicio de recolección de residuos de Celaya, Guanajuato.';
