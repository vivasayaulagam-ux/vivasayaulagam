'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, ChefHat, Truck, ShieldCheck, Shirt, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap: Record<string, any> = {
  leaf: Leaf,
  chefhat: ChefHat,
  shirt: Shirt,
  truck: Truck,
  shield: ShieldCheck,
  award: Award
};

function getIcon(name: string) {
  if (!name) return Leaf;
  const key = name.toLowerCase().trim();
  return iconMap[key] || Leaf;
}

const DEFAULT_CONTENT = {
  smallLabel: 'ABOUT VIVASAYA ULAGAM',
  mainHeading: 'Rooted in Tradition. Delivered with Trust.',
  paragraph1: 'At Vivasaya Ulagam, we bring traditional South Indian food products, natural essentials, herbal powders, sweets, snacks, pickles, and everyday grocery items directly to your home. Our mission is simple — to make authentic, natural, and trusted food products easily available for every family.',
  paragraph2: 'Rooted in the rich agricultural heritage of Tamil Nadu, we focus on products that carry the taste of tradition, homemade quality, and natural goodness. From Ellu Urundai, Rava Laddu, Sathu Maavu, Herbal Powders, Pickles, and Combo Packs, every product is selected with care to give customers better quality and better value.',
  quoteText: 'We believe food is not just a product — it is tradition, health, and trust packed together.',
  mainImage: '/about-us.png',
  ctaButtonText: 'Shop Now',
  ctaButtonLink: '/shop',
  trustCards: [
    {
      icon: 'leaf',
      title: '100% Natural Products',
      description: 'Carefully selected products made with natural ingredients.',
      isActive: true,
      sortOrder: 1
    },
    {
      icon: 'shirt',
      title: 'Traditional Taste',
      description: 'Authentic South Indian flavours inspired by homemade recipes.',
      isActive: true,
      sortOrder: 2
    },
    {
      icon: 'truck',
      title: 'All India Shipping',
      description: 'We deliver Vivasaya Ulagam products across India.',
      isActive: true,
      sortOrder: 3
    },
    {
      icon: 'shield',
      title: 'Secure Checkout',
      description: 'Safe and simple payment experience with trusted payment options.',
      isActive: true,
      sortOrder: 4
    }
  ]
};

export default function AboutSection() {
  const [data, setData] = useState<any>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/about-section');
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load about section settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const trustCards = data.trustCards || DEFAULT_CONTENT.trustCards;

  return (
    <section
      id="about-us"
      className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-br from-[#FAF9F5] via-[#FAF9F5] to-green-50/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 2-Column Grid for Desktop */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left Column: Image Card */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-4 border-white"
            >
              <Image
                src={data.mainImage || '/about-us.png'}
                alt="Vivasaya Ulagam South Indian Traditional Food"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
            </motion.div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-[#1f2933]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col gap-2"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#34a121]">
                {data.smallLabel}
              </span>
              <h2 className="font-heading text-3xl xl:text-4xl font-extrabold text-[#111111] leading-tight">
                {data.mainHeading}
              </h2>
              <div className="w-12 h-[3px] bg-[#34a121] mt-1"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col gap-4 text-sm leading-relaxed text-gray-600 font-body"
            >
              <p>{data.paragraph1}</p>
              {data.paragraph2 && <p>{data.paragraph2}</p>}
              {data.quoteText && (
                <blockquote className="border-l-4 border-[#34a121] pl-4 italic text-base font-medium text-[#111111] py-1 bg-green-50/50 rounded-r-xl pr-4">
                  &ldquo;{data.quoteText}&rdquo;
                </blockquote>
              )}
            </motion.div>

            {/* Trust Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              {trustCards.map((card: any, idx: number) => {
                const Icon = getIcon(card.icon);
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#e2e8f0]/60 p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex gap-3.5 items-start"
                  >
                    <div className="w-10 h-10 bg-green-50 text-[#34a121] rounded-xl flex items-center justify-center shrink-0 border border-green-100/50">
                      <Icon size={20} />
                    </div>
                    <div className="flex flex-col gap-0.5 animate-fadeIn">
                      <h4 className="font-heading font-bold text-xs text-gray-900">{card.title}</h4>
                      <p className="text-[11px] leading-relaxed text-gray-400 font-semibold">{card.description}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-2"
            >
              <Link
                href={data.ctaButtonLink || '/shop'}
                className="inline-flex items-center justify-center bg-[#34a121] hover:bg-[#2c8a1b] text-white px-8 py-3 rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all select-none cursor-pointer"
              >
                {data.ctaButtonText || 'Shop Now'}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Mobile Single-Column Responsive Layout */}
        <div className="lg:hidden flex flex-col gap-6 text-[#1f2933]">
          {/* 1. Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-2 border-white"
          >
            <Image
              src={data.mainImage || '/about-us.png'}
              alt="Vivasaya Ulagam South Indian Traditional Food"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </motion.div>

          {/* 2. Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-2"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#34a121]">
              {data.smallLabel}
            </span>
            <h2 className="font-heading text-2xl font-extrabold text-[#111111] leading-tight">
              {data.mainHeading}
            </h2>
            <div className="w-12 h-[2.5px] bg-[#34a121] mt-0.5"></div>
          </motion.div>

          {/* 3. Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4 text-xs leading-relaxed text-gray-600 font-body"
          >
            <p>{data.paragraph1}</p>
            {data.paragraph2 && <p>{data.paragraph2}</p>}
            {data.quoteText && (
              <blockquote className="border-l-4 border-[#34a121] pl-3.5 italic text-sm font-medium text-[#111111] py-1.5 bg-green-50/50 rounded-r-xl pr-3">
                &ldquo;{data.quoteText}&rdquo;
              </blockquote>
            )}
          </motion.div>

          {/* 4. Trust Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {trustCards.map((card: any, idx: number) => {
              const Icon = getIcon(card.icon);
              return (
                <div
                  key={idx}
                  className="bg-white border border-[#e2e8f0]/60 p-4 rounded-xl shadow-sm flex gap-3.5 items-start"
                >
                  <div className="w-9 h-9 bg-green-50 text-[#34a121] rounded-lg flex items-center justify-center shrink-0 border border-green-100/50">
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-heading font-bold text-xs text-gray-900">{card.title}</h4>
                    <p className="text-[10px] leading-relaxed text-gray-400 font-semibold">{card.description}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* 5. Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-1"
          >
            <Link
              href={data.ctaButtonLink || '/shop'}
              className="inline-flex items-center justify-center bg-[#34a121] hover:bg-[#2c8a1b] text-white px-7 py-3 rounded-full text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all select-none cursor-pointer w-full sm:w-auto text-center"
            >
              {data.ctaButtonText || 'Shop Now'}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
