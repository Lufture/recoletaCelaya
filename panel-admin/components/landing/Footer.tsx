import { RecolectaLogo, GobiernoLogo } from '@/components/Logos';
import { Apple, Play, DownloadCloud } from 'lucide-react';

// Inline SVGs for social brands (Lucide does not include brand icons)
const Facebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Twitter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Youtube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

export default function Footer() {
  return (
    <>
      {/* Download Banner */}
      <section className="bg-[var(--rc-wine-600)] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 text-left">
            <div className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center shrink-0">
              <DownloadCloud size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Descarga la app y sé parte del cambio</h2>
              <p className="text-sm text-white/80">RecolecTA Celaya en tus manos, la ciudad más limpia en nuestro futuro.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
              <Apple size={24} />
              <div className="text-left flex flex-col">
                <span className="text-[9px] uppercase tracking-wider leading-none opacity-80">Descargar en</span>
                <span className="text-sm font-semibold leading-none mt-0.5">App Store</span>
              </div>
            </button>
            <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
              <Play size={24} className="text-white" fill="white" />
              <div className="text-left flex flex-col">
                <span className="text-[9px] uppercase tracking-wider leading-none opacity-80">Disponible en</span>
                <span className="text-sm font-semibold leading-none mt-0.5">Google Play</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="bg-white pt-16 pb-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 border-b border-gray-100 pb-10 mb-8">
            <div className="flex-1 flex justify-center md:justify-start">
              <RecolectaLogo />
            </div>

            <div className="flex-1 flex flex-col items-center text-center">
              <h4 className="text-sm font-bold text-[var(--rc-blue-800)] mb-4 uppercase tracking-wider">Contacto</h4>
              <ul className="text-sm text-[var(--rc-slate-500)] space-y-3 flex flex-col items-center">
                <li className="flex items-center gap-2"><span className="text-[var(--rc-green-600)]">✆</span> 461 123 4567</li>
                <li className="flex items-center gap-2"><span className="text-[var(--rc-green-600)]">✉</span> contacto@recolecta.celaya.gob.mx</li>
                <li className="flex items-center gap-2"><span className="text-[var(--rc-green-600)]">📍</span> Celaya, Guanajuato, México</li>
              </ul>
            </div>

            <div className="flex-1 flex flex-col items-center text-center">
              <h4 className="text-sm font-bold text-[var(--rc-blue-800)] mb-4 uppercase tracking-wider">Síguenos</h4>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[var(--rc-blue-800)] hover:bg-[var(--rc-blue-50)] hover:border-[var(--rc-blue-200)] transition-colors"><Facebook /></a>
                <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[var(--rc-blue-800)] hover:bg-[var(--rc-blue-50)] hover:border-[var(--rc-blue-200)] transition-colors"><Instagram /></a>
                <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[var(--rc-blue-800)] hover:bg-[var(--rc-blue-50)] hover:border-[var(--rc-blue-200)] transition-colors"><Twitter /></a>
                <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[var(--rc-blue-800)] hover:bg-[var(--rc-blue-50)] hover:border-[var(--rc-blue-200)] transition-colors"><Youtube /></a>
              </div>
            </div>

            <div className="flex-1 flex justify-center md:justify-end">
              <div className="flex gap-4">
                <GobiernoLogo className="scale-75 origin-right" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-400">
            <p>© 2026 Gobierno de Celaya. Todos los derechos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-gray-600 transition-colors">Aviso de privacidad</a>
              <span>|</span>
              <a href="#" className="hover:text-gray-600 transition-colors">Términos y condiciones</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
