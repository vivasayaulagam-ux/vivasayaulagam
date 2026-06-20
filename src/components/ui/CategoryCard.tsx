"use client";

import Link from "next/link";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

export interface CategoryCardData {
  id?: number | string;
  _id?: string;
  name: string;
  emoji: string;
  slug: string;
  bgColor: string;
  image?: string;
}

interface CategoryCardProps {
  category: CategoryCardData;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const fallbackImages: Record<string, string> = {
    "hair-skin-care": "/uploads/products/hair_skin_care_thumb.png",
    "rice-powders": "/uploads/products/rice_powders_thumb.png",
    "thokku-pickles": "/uploads/products/thokku_pickles_thumb.png",
    "masala-spice-powders": "/uploads/products/masala_spice_powders_thumb.png",
    "sweets-snacks": "/uploads/products/sweets_snacks_thumb.png",
    "health-dairy": "/uploads/products/health_dairy_thumb.png",
  };
  const image = category.image || fallbackImages[category.slug];

  return (
    <Link
      href={`/categories?category=${category.slug}`}
      className="group flex w-full min-w-0 flex-col items-center cursor-pointer snap-start"
      aria-label={`Shop ${category.name}`}
    >
      <div
        className="w-[84px] h-[84px] min-[375px]:w-[96px] min-[375px]:h-[96px] sm:w-[136px] sm:h-[136px] lg:w-[170px] lg:h-[170px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-2xl min-[375px]:text-3xl sm:text-4xl lg:text-5xl shadow-none relative overflow-hidden transition-transform duration-300 ease-out group-hover:-translate-y-1"
      >
        {image ? (
          <Image
            src={image}
            alt={category.name}
            fill
            loading="lazy"
            sizes="(max-width: 374px) 84px, (max-width: 639px) 96px, (max-width: 1023px) 136px, 170px"
            quality={75}
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <span className="relative z-10 transition-transform duration-500 ease-out group-hover:scale-[1.08]">
            {category.emoji}
          </span>
        )}
      </div>

      <span className="font-heading mt-[12px] max-w-[6.5rem] text-center text-xs font-semibold leading-[1.35] text-[#222222] transition-colors duration-300 group-hover:text-primary min-[375px]:text-[13px] sm:mt-[18px] sm:max-w-[12rem] sm:text-[15px] lg:text-[16px]">
        {category.name}
      </span>
    </Link>
  );
}
