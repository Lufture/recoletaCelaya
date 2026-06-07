import Link from 'next/link';
import { Smartphone, MapPin, Bell, BookOpen, Accessibility, ArrowRight, DownloadCloud, Apple, Play } from 'lucide-react';

export default function Hero() {
  return (
    <div className="bg-white min-h-screen pt-28 pb-0 overflow-hidden flex flex-col">
      {/* Top Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 pt-10 pb-20">

        {/* Left Content */}
        <div className="flex-1 text-left relative z-10 max-w-2xl">
          <h1 className="text-5xl lg:text-[4rem] leading-[1.1] font-bold text-[var(--rc-blue-800)] tracking-tight mb-6">
            <span className="text-[var(--rc-wine-600)]">Por un Celaya más limpio </span>Conoce la recolección en tiempo real
          </h1>
          <p className="text-lg text-[var(--rc-slate-500)] mb-10 max-w-lg leading-relaxed font-medium">
            Ubica el camión recolector en tiempo real, recibe avisos importantes y consulta cómo separar tus residuos correctamente.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-10">
            {/* App Store Badge Placeholder */}
            <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
              <Apple size={24} />
              <div className="text-left flex flex-col">
                <span className="text-[9px] uppercase tracking-wider leading-none opacity-80">Descargar en</span>
                <span className="text-sm font-semibold leading-none mt-0.5">App Store</span>
              </div>
            </button>
            {/* Play Store Badge Placeholder */}
            <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
              <Play size={24} className="text-white" fill="white" />
              <div className="text-left flex flex-col">
                <span className="text-[9px] uppercase tracking-wider leading-none opacity-80">Disponible en</span>
                <span className="text-sm font-semibold leading-none mt-0.5">Google Play</span>
              </div>
            </button>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-[var(--rc-blue-600)] hover:bg-[var(--rc-blue-700)] text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-blue-900/20 transition-all hover:translate-x-1"
          >
            Explorar la app <ArrowRight size={18} />
          </Link>
        </div>

        {/* Right Content - Phone Mockup */}
        <div className="flex-1 relative flex justify-center lg:justify-end">
          {/* Decorative background shape */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[var(--rc-green-50)] rounded-full blur-3xl -z-10 opacity-70"></div>

          <div className="relative flex gap-6 rotate-[-5deg] hover:rotate-0 transition-transform duration-700 ease-out">
            {/* Phone 1 */}
            <div className="w-[280px] h-[580px] bg-white rounded-[40px] shadow-2xl border-[8px] border-black overflow-hidden relative z-20">
              <div className="absolute top-0 inset-x-0 h-7 bg-black rounded-b-2xl mx-auto w-40 z-30"></div>
              {/* Fake App Content */}
              <div className="bg-gray-50 h-full p-4 pt-10">
                <div className="h-48 bg-gray-200 rounded-2xl mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-50/50"></div>
                  {/* Fake map line */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 50 L100 120 L200 90" stroke="var(--rc-blue-500)" strokeWidth="4" fill="none" strokeDasharray="6 6" />
                  </svg>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--rc-green-100)] flex items-center justify-center">
                      <MapPin size={16} className="text-[var(--rc-green-600)]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Camión cercano</div>
                      <div className="text-xs text-gray-500">A 3 calles de ti</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2 */}
            <div className="hidden sm:block w-[260px] h-[540px] bg-white rounded-[36px] shadow-xl border-[8px] border-gray-800 overflow-hidden relative mt-12 z-10 opacity-90 scale-95">
              <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-xl mx-auto w-32 z-30"></div>
              <div className="bg-white h-full p-4 pt-10">
                <div className="text-lg font-bold mb-4">Guía de residuos</div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 items-center border border-gray-100 p-3 rounded-xl">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                        <div className="h-2 w-full bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 border-t border-gray-50 relative z-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[var(--rc-blue-800)] mb-12">
            ¿Qué es Recolec<span className="text-[var(--rc-green-600)]">TA</span> Celaya?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[var(--rc-green-50)] text-[var(--rc-green-600)] flex items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--rc-blue-800)] mb-3">Seguimiento en tiempo real</h3>
              <p className="text-sm text-[var(--rc-slate-500)] leading-relaxed">
                Consulta la ubicación del camión recolector y conoce su ruta actualizada al momento.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Bell size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--rc-blue-800)] mb-3">Avisos y notificaciones</h3>
              <p className="text-sm text-[var(--rc-slate-500)] leading-relaxed">
                Recibe avisos importantes sobre cambios de horarios, rutas y servicios en tu zona.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--rc-blue-800)] mb-3">Guía de residuos</h3>
              <p className="text-sm text-[var(--rc-slate-500)] leading-relaxed">
                Aprende a separar tus residuos correctamente y contribuye a una ciudad más limpia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility Banner */}
      <section className="bg-[var(--rc-slate-50)] py-12 border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-[var(--rc-green-50)] p-8 rounded-3xl">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <Accessibility size={32} className="text-[var(--rc-green-600)]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--rc-blue-800)] mb-2">Accesible para todos</h3>
              <p className="text-sm text-[var(--rc-slate-600)] leading-relaxed">
                Diseñada pensando en adultos mayores y personas con discapacidad visual. Cuenta con guía de audio, ajuste de texto y navegación simplificada.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
