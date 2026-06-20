"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const categoryBanners = [
  {
    id: 1,
    name: "Honey",
    tagline: "Pure & Raw",
    emoji: "🍯",
    bg: "from-amber-400 to-orange-500",
    link: "/categories?category=health-dairy",
  },
  {
    id: 2,
    name: "Noodles",
    tagline: "Millet Goodness",
    emoji: "🍜",
    bg: "from-green-500 to-emerald-700",
    link: "/categories?category=rice-powders",
  },
  {
    id: 3,
    name: "Ghee",
    tagline: "A2 Desi Cow",
    emoji: "🥛",
    bg: "from-yellow-400 to-amber-600",
    link: "/categories?category=health-dairy",
  },
  {
    id: 4,
    name: "Spices",
    tagline: "Aromatic Blends",
    emoji: "🌶️",
    bg: "from-red-400 to-rose-700",
    link: "/categories?category=masala-spice-powders",
  },
  {
    id: 5,
    name: "Oils",
    tagline: "Cold Pressed",
    emoji: "🫙",
    bg: "from-teal-500 to-cyan-700",
    link: "/categories?category=hair-skin-care",
  },
];

export default function CategoryBanners({ settings }: { settings?: any }) {
  const bannersList = (settings?.category_banners && settings.category_banners.length > 0)
    ? settings.category_banners
    : categoryBanners;

  return (
    <section id="category-banners" className="py-14 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading font-bold text-2xl text-text-dark mb-6">
          Shop by Category
        </h2>
 
        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x-mandatory">
          {bannersList.map((banner: any, i: number) => {
            const destination = banner.link && banner.link !== "#" ? banner.link : "/shop";
            return (
              <Link
                key={banner.id}
                href={destination}
                className="relative flex-shrink-0 w-[220px] h-[300px] rounded-2xl overflow-hidden block cursor-pointer shadow-md hover:shadow-xl transition-shadow snap-start bg-cover bg-center"
                aria-label={`Shop ${banner.name}`}
              >
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ scale: 1.04 }}
                  style={banner.image ? { backgroundImage: `url(${banner.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  className={`w-full h-full relative bg-gradient-to-br ${banner.bg || "from-green-800 to-green-600"} bg-cover bg-center`}
                >
                  {/* Background image overlay */}
                  {banner.image && (
                    <div className="absolute inset-0 bg-black/35 pointer-events-none z-0" />
                  )}

                  {/* Large background emoji */}
                  {!banner.image && (
                    <span className="absolute bottom-0 right-0 text-[120px] opacity-20 select-none leading-none z-0">
                      {banner.emoji}
                    </span>
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5 z-10">
                    <div>
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                        {banner.tagline}
                      </p>
                      <h3 className="font-heading font-extrabold text-white text-2xl mt-1">
                        {banner.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 border border-white/40 text-white hover:bg-white/30 transition-colors">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
