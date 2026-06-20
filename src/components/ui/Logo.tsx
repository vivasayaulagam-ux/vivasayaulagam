"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  textClassName?: string;
  subtextClassName?: string;
}

export default function Logo({ 
  className = "w-[120px] h-[70px] lg:w-[190px] lg:h-[120px] object-contain relative top-[4px] lg:top-[10px]", 
}: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const [logoPath, setLogoPath] = useState("/logo.png");

  useEffect(() => {
    async function loadLogo() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success && data.settings?.logo_path) {
          setLogoPath(data.settings.logo_path);
        }
      } catch (err) {
        console.error("Failed to load custom logo", err);
      }
    }
    loadLogo();
  }, []);

  return (
    <div className="flex items-center">
      {!imgError ? (
        <Image
          src={logoPath}
          alt="Vivasaya Ulagam Logo"
          width={190}
          height={120}
          sizes="(max-width: 1023px) 120px, 190px"
          quality={80}
          loading="eager"
          className={className}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex flex-col leading-tight">
          <span className="font-heading font-extrabold text-primary-dark tracking-normal uppercase text-lg md:text-xl">
            Vivasaya <span className="text-primary">Ulagam</span>
          </span>
        </div>
      )}
    </div>
  );
}
