import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
      <Footer />
    </main>
  );
}
