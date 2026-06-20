import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Page from '@/models/Page';
import Product from '@/models/Product';
import { Mail, Check, Star, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

// Make dynamic rendering server-side or ISR
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomPage({ params }: PageProps) {
  await dbConnect();
  const { slug } = await params;
  const page = await Page.findOne({ slug, status: 'published' }).lean();

  if (!page) {
    notFound();
  }

  // Pre-fetch products if a product grid section exists
  const sections = (page.sections as any[]) || [];
  const needsProducts = sections.some(s => s.type === 'product_grid');
  let products: any[] = [];
  if (needsProducts) {
    products = await Product.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10).lean();
  }

  return (
    <div className="min-h-screen bg-[#FDFCF7] flex flex-col font-sans">
      <Navbar />

      {/* Main visual sections */}
      <main className="flex-1 space-y-16 pt-[calc(var(--navbar-height)+1rem)] pb-12 px-6 max-w-7xl mx-auto w-full">
        {sections.map((sec, idx) => {
          const s = sec.settings;
          const id = sec.id;

          return (
            <div key={id} className="w-full">
              {sec.type === 'hero_banner' && (
                <div className={`p-12 md:p-20 text-white bg-gradient-to-r ${s.bgGradient || 'from-green-700 to-emerald-800'} rounded-3xl text-center space-y-6 shadow-xl relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                  <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{s.title}</h1>
                    <p className="text-sm md:text-base text-white/90 max-w-md mx-auto leading-relaxed">{s.subtitle}</p>
                    <div className="pt-2">
                      <Link
                        href={s.ctaLink || '/shop'}
                        className="inline-flex items-center gap-2 bg-white text-gray-900 text-xs md:text-sm font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-gray-100 hover:scale-[1.02] transition-all"
                      >
                        {s.ctaText || 'Explore Store'}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {sec.type === 'heading' && (
                <div className="text-center py-6">
                  <h2 className={`font-extrabold text-2xl md:text-4xl leading-tight`} style={{ color: s.color || '#34a121' }}>
                    {s.text}
                  </h2>
                  <div className="w-16 h-1 bg-[#34a121] mx-auto mt-3 rounded-full" />
                </div>
              )}

              {sec.type === 'text_block' && (
                <div className="max-w-3xl mx-auto p-4">
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed" style={{ textAlign: s.alignment || 'left', color: s.color }}>
                    {s.text}
                  </p>
                </div>
              )}

              {sec.type === 'product_grid' && (
                <div className="space-y-6">
                  {s.title && (
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <h3 className="font-extrabold text-lg md:text-xl text-gray-800">{s.title}</h3>
                      {s.category && (
                        <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                          {s.category}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products
                      .filter(p => !s.category || 
                        p.category?.toLowerCase() === s.category.toLowerCase() ||
                        p.categories?.some((c: string) => c.toLowerCase() === s.category.toLowerCase())
                      )
                      .slice(0, Number(s.limit || 4))
                      .map((p: any) => (
                        <div key={p._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                          <div>
                            <div className="w-full aspect-square bg-[#FAF9F5] rounded-xl flex items-center justify-center text-4xl group-hover:scale-105 transition-all">
                              {p.emoji || '🌾'}
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 mt-3">{p.title}</h4>
                            <div className="flex items-center gap-1 mt-1 text-amber-500">
                              <Star size={12} fill="currentColor" />
                              <span className="text-[10px] font-bold text-gray-500">{p.rating || 4.7}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="font-extrabold text-gray-900 text-sm">₹{p.price}</span>
                            <Link
                              href={`/product/${p._id}`}
                              className="text-[10px] bg-[#34a121] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#154a28]"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {sec.type === 'faq' && (
                <div className="max-w-2xl mx-auto border border-gray-150 rounded-2xl p-5 bg-white shadow-sm space-y-3">
                  <h4 className="text-sm md:text-base font-bold text-gray-800 flex items-start gap-2">
                    <span className="text-[#34a121]">❓</span>
                    {s.question}
                  </h4>
                  <p className="text-xs md:text-sm text-gray-500 pl-6 leading-relaxed">{s.answer}</p>
                </div>
              )}

              {sec.type === 'testimonials' && (
                <div className="max-w-xl mx-auto p-6 md:p-8 bg-gradient-to-br from-green-50/50 to-lime-50/50 border border-green-100 rounded-3xl text-center space-y-4 shadow-sm relative">
                  <span className="absolute top-4 left-6 text-6xl text-green-200 select-none">“</span>
                  <p className="text-gray-600 italic text-sm md:text-base relative z-10 leading-relaxed">
                    &ldquo;{s.text}&rdquo;
                  </p>
                  <div>
                    <h5 className="font-bold text-gray-800 text-xs md:text-sm">{s.author}</h5>
                    <span className="text-[10px] text-gray-400 font-medium">{s.role}</span>
                  </div>
                </div>
              )}

              {sec.type === 'newsletter' && (
                <div className="max-w-xl mx-auto bg-gray-950 text-white rounded-3xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-green-900/30 blur-2xl" />
                  <div className="space-y-2 relative z-10">
                    <h3 className="font-extrabold text-lg md:text-xl">{s.title || 'Subscribe for Fresh Updates'}</h3>
                    <p className="text-[11px] text-gray-400">Receive special offers, organic articles, and launch deals.</p>
                  </div>
                  <form action="/api/newsletter" method="POST" className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto relative z-10">
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Enter your email address"
                      className="text-xs px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl flex-1 focus:border-[#34a121] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-[#34a121] hover:bg-[#154a28] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
                    >
                      {s.buttonText || 'Join Now'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </main>

      <Footer />
    </div>
  );
}
