import Link from 'next/link';
import Image from 'next/image';
import header1 from '@/images/header1.png';
import header2 from '@/images/header2.jpeg';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-6">
          <Image src={header1} alt="Logo Gobierno" className="h-12 w-auto object-contain" priority />
          <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
          <Image src={header2} alt="Logo RecolecTA" className="h-12 w-auto object-contain" priority />
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm font-semibold text-[var(--rc-blue-600)] border-b-2 border-[var(--rc-blue-600)] pb-1">
          Inicio
        </Link>
        <Link href="#como-funciona" className="text-sm font-medium text-[var(--rc-blue-800)] hover:text-[var(--rc-blue-600)] transition-colors pb-1 border-b-2 border-transparent hover:border-[var(--rc-blue-100)]">
          Cómo funciona
        </Link>
        <Link href="#beneficios" className="text-sm font-medium text-[var(--rc-blue-800)] hover:text-[var(--rc-blue-600)] transition-colors pb-1 border-b-2 border-transparent hover:border-[var(--rc-blue-100)]">
          Beneficios
        </Link>
        <Link href="#descargar" className="text-sm font-medium text-[var(--rc-blue-800)] hover:text-[var(--rc-blue-600)] transition-colors pb-1 border-b-2 border-transparent hover:border-[var(--rc-blue-100)]">
          Descargar
        </Link>
        <Link href="#contacto" className="text-sm font-medium text-[var(--rc-blue-800)] hover:text-[var(--rc-blue-600)] transition-colors pb-1 border-b-2 border-transparent hover:border-[var(--rc-blue-100)]">
          Contacto
        </Link>
      </div>

      <div className="flex items-center gap-4">

      </div>
    </nav>
  );
}
