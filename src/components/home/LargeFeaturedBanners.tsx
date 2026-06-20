"use client";

import Link from "next/link";

type FeaturedBannerSettings = {
  promo_left_link?: string;
  promo_right_link?: string;
  promo_left_image?: string;
  promo_right_image?: string;
  promo_left_title?: string;
  promo_right_title?: string;
};

export default function LargeFeaturedBanners({ settings }: { settings?: FeaturedBannerSettings }) {
  const leftLink =
    settings?.promo_left_link && settings.promo_left_link !== "#"
      ? settings.promo_left_link
      : "/shop";
  const rightLink =
    settings?.promo_right_link && settings.promo_right_link !== "#"
      ? settings.promo_right_link
      : "/shop";
  const leftImage = settings?.promo_left_image || "/millet-noodles-banner.png";
  const rightImage = settings?.promo_right_image || "/tea-infusion-banner.png";

  return (
    <section className="w-full bg-white pb-[44px]" style={{ display: "none" }}>
      <div className="mx-auto grid w-full max-w-[1170px] grid-cols-1 gap-4 px-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:px-[15px]">
        {/* Left Banner */}
        <Link
          href={leftLink}
          className="group block w-full overflow-hidden rounded-sm shadow-sm transition-shadow duration-300 hover:shadow-md"
          aria-label={settings?.promo_left_title || "Shop Millet Noodles"}
        >
          <img
            src={leftImage}
            alt={settings?.promo_left_title || "Millet noodles banner"}
            className="block h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
            style={{ display: "block" }}
          />
        </Link>

        {/* Right Banner */}
        <Link
          href={rightLink}
          className="group block w-full overflow-hidden rounded-sm shadow-sm transition-shadow duration-300 hover:shadow-md"
          aria-label={settings?.promo_right_title || "Shop Tea Infusion"}
        >
          <img
            src={rightImage}
            alt={settings?.promo_right_title || "Tea infusion banner"}
            className="block h-auto w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
            style={{ display: "block" }}
          />
        </Link>
      </div>
    </section>
  );
}
