"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export interface CategoryCardData {
  id?: number | string;
  _id?: string;
  name: string;
  emoji: string;
  slug: string;
  bgColor: string;
  image?: string;
  updatedAt?: string | Date;
  imageVersion?: string;
  modifiedAt?: string | Date;
}

interface CategoryCardProps {
  category: CategoryCardData;
}

export function getImageUrlWithVersion(imageUrl?: string, version?: string | Date) {
  if (!imageUrl || imageUrl.trim() === "") {
    return "/placeholder.svg";
  }

  let resolved = imageUrl.trim();

  // If path is uploads/file.jpg, convert to /uploads/file.jpg
  if (resolved.startsWith("uploads/")) {
    resolved = "/" + resolved;
  }

  // Determine version string
  let vStr = "";
  if (version) {
    vStr = typeof version === "string" ? version : version.toISOString();
  }

  if (vStr) {
    const separator = resolved.includes("?") ? "&" : "?";
    return `${resolved}${separator}v=${encodeURIComponent(vStr)}`;
  }

  return resolved;
}

export function CategoryCardSkeleton() {
  return (
    <div className="flex w-full min-w-0 flex-col items-center animate-pulse">
      <div className="w-[84px] h-[84px] min-[375px]:w-[96px] min-[375px]:h-[96px] sm:w-[136px] sm:h-[136px] lg:w-[170px] lg:h-[170px] rounded-full bg-neutral-200" />
      <div className="mt-[12px] sm:mt-[18px] h-[16px] w-[70px] sm:w-[100px] bg-neutral-200 rounded" />
    </div>
  );
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const version = category.updatedAt || category.imageVersion || (category as any).modifiedAt;
  const initialImg = category.image ? getImageUrlWithVersion(category.image, version) : "/placeholder.svg";
  
  const [imgSrc, setImgSrc] = useState(initialImg);

  useEffect(() => {
    const v = category.updatedAt || category.imageVersion || (category as any).modifiedAt;
    setImgSrc(category.image ? getImageUrlWithVersion(category.image, v) : "/placeholder.svg");
  }, [category.image, category.updatedAt, category.imageVersion, (category as any).modifiedAt]);

  return (
    <Link
      href={`/categories?category=${category.slug}`}
      className="group flex w-full min-w-0 flex-col items-center cursor-pointer snap-start"
      aria-label={`Shop ${category.name}`}
    >
      <div
        className="w-[84px] h-[84px] min-[375px]:w-[96px] min-[375px]:h-[96px] sm:w-[136px] sm:h-[136px] lg:w-[170px] lg:h-[170px] rounded-full bg-[#f5f5f5] flex items-center justify-center text-2xl min-[375px]:text-3xl sm:text-4xl lg:text-5xl shadow-none relative overflow-hidden transition-transform duration-300 ease-out group-hover:-translate-y-1"
      >
        <Image
          src={imgSrc}
          alt={category.name}
          fill
          loading="lazy"
          unoptimized={true}
          sizes="(max-width: 374px) 84px, (max-width: 639px) 96px, (max-width: 1023px) 136px, 170px"
          quality={75}
          onError={() => setImgSrc("/placeholder.svg")}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      </div>

      <span className="font-heading mt-[12px] max-w-[6.5rem] text-center text-xs font-semibold leading-[1.35] text-[#222222] transition-colors duration-300 group-hover:text-primary min-[375px]:text-[13px] sm:mt-[18px] sm:max-w-[12rem] sm:text-[15px] lg:text-[16px]">
        {category.name}
      </span>
    </Link>
  );
}
