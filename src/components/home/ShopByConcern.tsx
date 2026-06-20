"use client";

import { motion } from "framer-motion";
import { concerns } from "@/data/concerns";
import SectionTitle from "@/components/ui/SectionTitle";
import Link from "next/link";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

export default function ShopByConcern() {
  const getConcernImage = (id: number) => {
    switch (id) {
      case 1:
        return "/uploads/pregnancy_care.png";
      case 2:
        return "/uploads/kids_wellness.png";
      case 3:
        return "/uploads/diabetes_friendly.png";
      case 4:
        return "/uploads/high_protein.png";
      default:
        return "/uploads/organic-placeholder.png";
    }
  };

  const getGradientOverlay = (id: number) => {
    switch (id) {
      case 1:
        // Warm peach/rose tint
        return "linear-gradient(to top, rgba(38, 12, 16, 0.95) 0%, rgba(200, 80, 100, 0.4) 50%, rgba(255, 230, 235, 0.05) 100%)";
      case 2:
        // Dreamy soft blue/navy tint
        return "linear-gradient(to top, rgba(12, 28, 48, 0.95) 0%, rgba(60, 120, 190, 0.4) 50%, rgba(230, 245, 255, 0.05) 100%)";
      case 3:
        // Fresh pine/teal tint
        return "linear-gradient(to top, rgba(6, 42, 28, 0.95) 0%, rgba(16, 150, 105, 0.4) 50%, rgba(220, 250, 235, 0.05) 100%)";
      case 4:
        // Warm amber/rose/plum tint
        return "linear-gradient(to top, rgba(45, 12, 24, 0.95) 0%, rgba(210, 80, 100, 0.4) 50%, rgba(250, 220, 235, 0.05) 100%)";
      default:
        return "linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%)";
    }
  };

  return (
    <section id="shop-by-concern" className="bg-white py-[52px]">
      <div className="vivasaya-container">
        <SectionTitle
          title="SHOP BY CONCERN"
          subtitle="Choose products tailored to your health and wellness needs."
          leafDecorator
        />

        <div className="grid grid-cols-2 gap-[24px] md:grid-cols-4 mt-2">
          {concerns.map((concern, i) => (
            <Link
              key={concern.id}
              href={`/shop`}
              className="group relative block overflow-hidden rounded-[24px] cursor-pointer shadow-[0_10px_30px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.18)] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-2 h-[360px] sm:h-[410px]"
              aria-label={`Shop ${concern.name}`}
            >
              {/* Main Visual Focus: Photography image background */}
              <Image
                src={getConcernImage(concern.id)}
                alt={concern.name}
                fill
                loading="lazy"
                sizes="(max-width: 767px) 50vw, 25vw"
                quality={75}
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Tinted Gradient Overlay for Text Readability */}
              <div 
                className="absolute inset-0 transition-opacity duration-500 ease-out group-hover:opacity-95"
                style={{
                  background: getGradientOverlay(concern.id)
                }}
              />

              {/* Shimmer light reflect sweep effect across the image card */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />

              {/* Text & Button content layer */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end items-center text-center z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                  className="w-full flex flex-col items-center"
                >
                  <h3 className="font-heading mb-2 text-[19px] font-bold text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                    {concern.name}
                  </h3>
                  <p className="font-body text-[13px] leading-[1.6] text-white/90 px-1 mb-4 max-w-[240px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                    {concern.description}
                  </p>

                  {/* Explore Pill Button with Backdrop Blur & Arrow Hover Shift */}
                  <div className="inline-flex items-center gap-1.5 border border-white/30 bg-white/15 backdrop-blur-[6px] px-6 py-2.5 text-xs font-semibold text-white transition-all duration-300 rounded-full group-hover:bg-white group-hover:text-[#222222] group-hover:border-white shadow-sm">
                    Explore <span className="transition-transform duration-300 group-hover:translate-x-1.5 inline-block">→</span>
                  </div>
                </motion.div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
