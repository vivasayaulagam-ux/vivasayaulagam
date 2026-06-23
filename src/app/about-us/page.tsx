import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AboutSection from '@/components/home/AboutSection';

export const metadata: Metadata = {
  title: 'About Us | Vivasaya Ulagam',
  description: "Learn more about Vivasaya Ulagam's traditional agricultural products, heritage, values, and our farmers cooperative.",
  alternates: {
    canonical: 'https://vivasayaulagam.com/about-us'
  }
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-height))]">
        <AboutSection />
      </main>

      <Footer />
    </div>
  );
}
