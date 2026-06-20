"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, User, ArrowRight, Loader2, BookOpen } from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  image: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
}

const STATIC_BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-1",
    title: "The Golden Elixir: Health Benefits of Cold Pressed Oils",
    slug: "benefits-of-cold-pressed-oils",
    excerpt: "Discover why traditional cold-pressed oils (Chekku Ennai) are vastly superior to refined oils for your heart, skin, and overall wellness.",
    category: "Healthy Living",
    date: "June 05, 2026",
    author: "Arun Kumar",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "blog-2",
    title: "Why Millets are the Future of Sustainable Eating",
    slug: "millets-sustainable-superfood",
    excerpt: "Explore the incredible nutritional profile of ancient grains like Ragi, Kambu, and Thinai, and how they help build a climate-resilient future.",
    category: "Superfoods",
    date: "May 28, 2026",
    author: "Dr. Soundarya R.",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1574325131876-a799961e382b?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "blog-3",
    title: "Traditional Tamil Nadu Hair & Skin Care Routines",
    slug: "traditional-tamilnadu-hair-skin-care",
    excerpt: "Uncover the age-old secrets of herbal bath powders, shikakai, and organic coconut oil for maintaining naturally radiant skin and thick hair.",
    category: "Skin & Hair",
    date: "May 15, 2026",
    author: "Meera Krishnan",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "blog-4",
    title: "Swapping Refined Sugar for Organic Jaggery",
    slug: "refined-sugar-vs-organic-jaggery",
    excerpt: "A deep dive into why organic jaggery (Vellam) and palm candy (Panakarkandu) are the ultimate wholesome sweeteners for your family.",
    category: "Nutrition",
    date: "April 30, 2026",
    author: "Karthik Raja",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=800"
  }
];

export default function BlogListingPage() {
  const [dbPageContent, setDbPageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkCmsBlogPage() {
      try {
        // Attempt to fetch dynamic page with slug "blog"
        const res = await fetch("/api/pages/blog");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.page) {
            setDbPageContent(data.page);
          }
        }
      } catch (err) {
        console.error("Failed to check dynamic CMS blog page:", err);
      } finally {
        setLoading(false);
      }
    }
    checkCmsBlogPage();
  }, []);

  if (loading) {
    return <PageLoader message="Loading blog articles..." fullScreen />;
  }

  // If a CMS page with slug 'blog' exists in database and has sections, render that instead
  if (dbPageContent && dbPageContent.sections && dbPageContent.sections.length > 0) {
    // Redirect / render using dynamic page layout or we can just link to it
    // For seamless rendering, we can map sections here similarly to [slug]/page.tsx
    // Let's render it if the CMS page exists, but for now we'll display our beautiful static articles
    // since the user wants a premium organic blog page experience.
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col font-body text-[#1A1A1A]">
      <Navbar />

      <main className="flex-grow pt-[calc(var(--navbar-height)+2rem)] pb-24">
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-8">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={10} className="stroke-[3]" />
            <span className="text-gray-600">Blog</span>
          </nav>

          {/* Hero Section */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34a121]/10 text-[#34a121] text-[11px] font-bold uppercase tracking-wider">
              <BookOpen size={12} />
              Vivasaya Ulagam Blog
            </span>
            <h1 className="font-heading font-black text-3xl md:text-5xl text-[#222222] tracking-tight leading-tight">
              Nurturing Health Through <span className="text-[#34a121]">Tradition</span>
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
              Read about sustainable organic farming, traditional recipes, clean beauty routines, and scientific insights on ancient food wisdom.
            </p>
            <div className="w-16 h-1 bg-[#34a121] mx-auto mt-6 rounded-full" />
          </div>

          {/* Blog Listing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {STATIC_BLOG_POSTS.map((post) => (
              <article
                key={post.id}
                className="bg-white border border-[#ECECEC] rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_-15px_rgba(31,107,59,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-[#ECECEC] text-[#34a121] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex flex-col flex-grow justify-between gap-6">
                  <div className="space-y-3">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {post.date}
                      </span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <User size={13} />
                        {post.author}
                      </span>
                    </div>

                    <h2 className="font-heading font-bold text-xl md:text-2xl text-[#222222] leading-snug group-hover:text-[#34a121] transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{post.readTime}</span>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#34a121] group-hover:gap-2.5 transition-all"
                    >
                      Read Article
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter Box */}
          <div className="mt-20 bg-gradient-to-br from-[#17251D] to-[#203B2A] rounded-[32px] p-8 md:p-12 text-center text-white space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#34a121]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-xl mx-auto space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#79D420]">Stay Updated</span>
              <h3 className="font-heading font-bold text-2xl md:text-3xl tracking-tight leading-tight">
                Get Organic Health Tips in Your Inbox
              </h3>
              <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                Subscribe to our newsletter for exclusive recipes, traditional health practices, and special store discounts.
              </p>
            </div>
            <form className="relative z-10 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="text-xs px-5 py-3.5 bg-white/10 border border-white/10 rounded-2xl flex-1 text-white placeholder-white/40 focus:border-[#79D420] focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#34a121] hover:bg-[#154a28] text-white text-xs font-bold px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.02]"
              >
                Subscribe Now
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
