"use client";

import { useState, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { 
  Palette, 
  Type, 
  Layout, 
  Store, 
  Image as ImageIcon, 
  Link2, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Info,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  Upload,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  ChevronRight,
  ChevronDown
} from "lucide-react";

async function uploadCmsImage(e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as { success?: boolean; url?: string; error?: string };
    if (data.success && data.url) {
      setter(data.url);
    } else {
      alert(data.error || "Failed to upload image");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to upload image");
  }
}

function ImagePicker({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  description?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:border-[#1F6B3B] focus:outline-none transition-colors"
          placeholder="e.g. /uploads/image.jpg"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 text-gray-700 transition-colors"
        >
          <Upload size={12} />
          Upload
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => void uploadCmsImage(e, onChange)}
          className="hidden"
        />
      </div>
      {description && <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>}
      {value && (
        <div className="relative w-16 h-16 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 mt-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function AccordionHeader({
  id,
  label,
  icon: Icon,
  activeAccordion,
  setActiveAccordion,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  activeAccordion: string | null;
  setActiveAccordion: Dispatch<SetStateAction<string | null>>;
}) {
  const isOpen = activeAccordion === id;
  return (
    <button
      type="button"
      onClick={() => setActiveAccordion(isOpen ? null : id)}
      className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left text-xs font-bold border transition-colors ${
        isOpen
          ? "border-[#1F6B3B] bg-[#1F6B3B]/5 text-[#1F6B3B]"
          : "border-gray-200 text-gray-700"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={15} />
        {label}
      </div>
      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}

export default function CmsForm({ initialData }: { initialData: Record<string, any> }) {
  const [activeAccordion, setActiveAccordion] = useState<string | null>("general");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Preview Sandbox States
  const [previewPage, setPreviewPage] = useState("/");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  // 1. Theme & Global Announcement Settings
  const [primaryColor, setPrimaryColor] = useState(initialData.primary_color || "#1F6B3B");
  const [announcementText, setAnnouncementText] = useState(initialData.announcement_text || "Free Shipping on orders above ₹1000!");
  const [announcementEnabled, setAnnouncementEnabled] = useState(initialData.announcement_enabled !== false);
  const [announcementBg, setAnnouncementBg] = useState(initialData.announcement_bg || "#1F6B3B");
  const [announcementTextColor, setAnnouncementTextColor] = useState(initialData.announcement_text_color || "#ffffff");

  // 2. Brand Identity Settings
  const [logoPath, setLogoPath] = useState(initialData.logo_path || "/logo.png");
  const [faviconPath, setFaviconPath] = useState(initialData.favicon_path || "/favicon.ico");
  const [contactEmail, setContactEmail] = useState(initialData.contact_email || "crazyboyajith743@gmail.com");
  const [contactPhone, setContactPhone] = useState(initialData.contact_phone || "+91 98765 43210");
  const [shopAddress, setShopAddress] = useState(initialData.shop_address || "12, Organic Green Valley, Coimbatore, Tamil Nadu - 641001");

  // 3. Hero Slideshow Settings
  const defaultSlides = [
    { id: 1, image: "/nari-payuru-banner-new.jpg", isImageOnly: true, link: "#shop", bg: "bg-black" },
    { id: 2, headline: "Wholesome Pasta, made with Millet Goodness", subtitle: "Directly from the farms of Tamil Nadu to your kitchen.", bg: "from-[#1F6B3B] to-[#3F8F55]", imgEmoji: "🍝", isImageOnly: false, link: "#shop" },
    { id: 3, headline: "Pure Cold Pressed Oils for your Family", subtitle: "100% natural, unrefined, and chemical-free.", bg: "from-[#C9A227] to-[#A4811A]", imgEmoji: "🫙", isImageOnly: false, link: "#shop" },
    { id: 4, headline: "100% Organic Traditional Palm Jaggery", subtitle: "The healthy sweetener alternative.", bg: "from-[#2A4433] to-[#1F3326]", imgEmoji: "🍯", isImageOnly: false, link: "#shop" }
  ];
  const [heroSlides, setHeroSlides] = useState<any[]>(initialData.hero_slides || defaultSlides);

  // 4. Promo Banners
  const [promoLeftTitle, setPromoLeftTitle] = useState(initialData.promo_left_title || "8 PACK");
  const [promoLeftSubtitle, setPromoLeftSubtitle] = useState(initialData.promo_left_subtitle || "Combo");
  const [promoLeftEmoji, setPromoLeftEmoji] = useState(initialData.promo_left_emoji || "🍜");
  const [promoLeftLink, setPromoLeftLink] = useState(initialData.promo_left_link || "#");
  
  const [promoRightTag, setPromoRightTag] = useState(initialData.promo_right_tag || "Best Seller");
  const [promoRightTitle, setPromoRightTitle] = useState(initialData.promo_right_title || "Traditional");
  const [promoRightSubtitle, setPromoRightSubtitle] = useState(initialData.promo_right_subtitle || "Palm Jaggery");
  const [promoRightEmoji, setPromoRightEmoji] = useState(initialData.promo_right_emoji || "🥥");
  const [promoRightLink, setPromoRightLink] = useState(initialData.promo_right_link || "#");

  const defaultFeaturedBanners = [
    { id: 1, label: "Millet Noodles", tagline: "Healthy & Delicious", emoji: "🍜", bg: "from-[#1b4332] to-[#52b788]", link: "#" },
    { id: 2, label: "Organic Pasta", tagline: "Italian Taste, Indian Heart", emoji: "🍝", bg: "from-[#92400e] to-[#f4a261]", link: "#" },
    { id: 3, label: "Millet Vermicelli", tagline: "Traditional Goodness", emoji: "🌾", bg: "from-[#0f766e] to-[#2dd4bf]", link: "#" }
  ];
  const [featuredBanners, setFeaturedBanners] = useState<any[]>(initialData.featured_banners || defaultFeaturedBanners);

  const defaultCategoryBanners = [
    { id: 1, name: "Honey", tagline: "Pure & Raw", emoji: "🍯", bg: "from-amber-400 to-orange-500", link: "#" },
    { id: 2, name: "Noodles", tagline: "Millet Goodness", emoji: "🍜", bg: "from-green-500 to-emerald-700", link: "#" },
    { id: 3, name: "Ghee", tagline: "A2 Desi Cow", emoji: "🥛", bg: "from-yellow-400 to-amber-600", link: "#" },
    { id: 4, name: "Spices", tagline: "Aromatic Blends", emoji: "🌶️", bg: "from-red-400 to-rose-700", link: "#" },
    { id: 5, name: "Oils", tagline: "Cold Pressed", emoji: "🫙", bg: "from-teal-500 to-cyan-700", link: "#" }
  ];
  const [categoryBanners, setCategoryBanners] = useState<any[]>(initialData.category_banners || defaultCategoryBanners);

  // 5. Homepage Section Config
  const [sectionHeroEnabled, setSectionHeroEnabled] = useState(initialData.section_hero_enabled !== false);
  const [sectionCategoryGridEnabled, setSectionCategoryGridEnabled] = useState(initialData.section_category_grid_enabled !== false);
  const [sectionFeaturedBannersEnabled, setSectionFeaturedBannersEnabled] = useState(initialData.section_featured_banners_enabled !== false);
  const [sectionLargeFeaturedBannersEnabled, setSectionLargeFeaturedBannersEnabled] = useState(initialData.section_large_featured_banners_enabled !== false);
  const [sectionCategoryBannersEnabled, setSectionCategoryBannersEnabled] = useState(initialData.section_category_banners_enabled !== false);
  const [sectionShopByVideosEnabled, setSectionShopByVideosEnabled] = useState(initialData.section_shop_by_videos_enabled !== false);
  const [sectionNewProductsEnabled, setSectionNewProductsEnabled] = useState(initialData.section_new_products_enabled !== false);
  const [sectionLimitedDealsEnabled, setSectionLimitedDealsEnabled] = useState(initialData.section_limited_deals_enabled !== false);
  const [sectionWhyUsEnabled, setSectionWhyUsEnabled] = useState(initialData.section_why_us_enabled !== false);
  const [sectionCertificationsEnabled, setSectionCertificationsEnabled] = useState(initialData.section_certifications_enabled !== false);

  const [sectionCategoryGridTitle, setSectionCategoryGridTitle] = useState(initialData.section_category_grid_title || "OUR ORGANIC RANGE");
  const [sectionNewProductsTitle, setSectionNewProductsTitle] = useState(initialData.section_new_products_title || "New Products");
  const [sectionNewProductsSubtitle, setSectionNewProductsSubtitle] = useState(initialData.section_new_products_subtitle || "Elevate your health with our organic delights - Shop now and experience the natural difference!");
  const [sectionLimitedDealsTitle, setSectionLimitedDealsTitle] = useState(initialData.section_limited_deals_title || "Limited Time Deals! Grab now ⌛");
  const [sectionLimitedDealsSubtitle, setSectionLimitedDealsSubtitle] = useState(initialData.section_limited_deals_subtitle || "Flash Sale");
  const [whyChooseTitle, setWhyChooseTitle] = useState(initialData.why_choose_title || "Why Choose Vivasaya Ulagam?");
  const [whyChooseSubtitle, setWhyChooseSubtitle] = useState(initialData.why_choose_subtitle || "We believe in food that is good for you and good for the planet.");
  const [sectionCertificationsTitle, setSectionCertificationsTitle] = useState(initialData.section_certifications_title || "Our Certifications");
  const [sectionCertificationsSubtitle, setSectionCertificationsSubtitle] = useState(initialData.section_certifications_subtitle || "Quality you can trust, verified by the best authorities in India");

  // 6. About Page Content
  const [aboutHeroTitle, setAboutHeroTitle] = useState(initialData.about_hero_title || "Nurturing Wholesome Living");
  const [aboutHeroSubtitle, setAboutHeroSubtitle] = useState(initialData.about_hero_subtitle || "Honoring traditional farming wisdom to deliver pure, unadulterated organic products directly to your doorstep.");
  const [aboutHeroBg, setAboutHeroBg] = useState(initialData.about_hero_bg || "from-[#1F6B3B] to-[#154a28]");
  
  const [aboutStoryTag, setAboutStoryTag] = useState(initialData.about_story_tag || "Our Beginnings");
  const [aboutStoryTitle, setAboutStoryTitle] = useState(initialData.about_story_title || "Cultivating Health and Preserving Bio-diversity");
  const [aboutStoryDesc1, setAboutStoryDesc1] = useState(initialData.about_story_desc_1 || "Founded with a modest vision to revitalize local agrarian heritage in Tamil Nadu, Vivasaya Ullagam has grown into a trusted cooperative network of over 40 certified organic farms. We recognized that the modern diet is heavily burdened by processed chemicals, stripping our tables of authentic, nutrient-dense nutrition.");
  const [aboutStoryDesc2, setAboutStoryDesc2] = useState(initialData.about_story_desc_2 || "Every grain of millet, drop of forest honey, and spoon of desi ghee we offer represents a sacred bond with soil health. We combine age-old organic farming techniques with clean, minimal modern processing to deliver unparalleled quality.");
  const [aboutStoryQuote, setAboutStoryQuote] = useState(initialData.about_story_quote || "Organic farming is not just a commercial catalog; it is an act of restoration. It restores our health, our ecosystem, and our respect for nature.");
  const [aboutStoryCite, setAboutStoryCite] = useState(initialData.about_story_cite || "Vivasaya Farmers Council");
  
  const [aboutMissionTitle, setAboutMissionTitle] = useState(initialData.about_mission_title || "Our Mission");
  const [aboutMissionDesc, setAboutMissionDesc] = useState(initialData.about_mission_desc || "To build a direct, transparent bridge between dedicated traditional farmers and conscious families seeking uncompromised, clean organic nourishment.");
  const [aboutVisionTitle, setAboutVisionTitle] = useState(initialData.about_vision_title || "Our Vision");
  const [aboutVisionDesc, setAboutVisionDesc] = useState(initialData.about_vision_desc || "To foster healthier community generations by making authentic, native grains, cold-pressed oils, and traditional sweeteners accessible globally.");
  const [aboutValuesTitle, setAboutValuesTitle] = useState(initialData.about_values_title || "Our Values");
  const [aboutValuesDesc, setAboutValuesDesc] = useState(initialData.about_values_desc || "Absolute pesticide-free verification, fair compensation policies for organic farmers, ecological sustainability, and transparent quality tracking.");

  const [aboutStat1Val, setAboutStat1Val] = useState(initialData.about_stat1_val || "40+");
  const [aboutStat1Lbl, setAboutStat1Lbl] = useState(initialData.about_stat1_lbl || "Cooperative Farms");
  const [aboutStat2Val, setAboutStat2Val] = useState(initialData.about_stat2_val || "100%");
  const [aboutStat2Lbl, setAboutStat2Lbl] = useState(initialData.about_stat2_lbl || "Pesticide-Free");
  const [aboutStat3Val, setAboutStat3Val] = useState(initialData.about_stat3_val || "10k+");
  const [aboutStat3Lbl, setAboutStat3Lbl] = useState(initialData.about_stat3_lbl || "Happy Families");
  const [aboutStat4Val, setAboutStat4Val] = useState(initialData.about_stat4_val || "150+");
  const [aboutStat4Lbl, setAboutStat4Lbl] = useState(initialData.about_stat4_lbl || "Verified Products");

  const [aboutTimelineYear1, setAboutTimelineYear1] = useState(initialData.about_timeline_year1 || "2024");
  const [aboutTimelineTitle1, setAboutTimelineTitle1] = useState(initialData.about_timeline_title1 || "Rooting the Cooperative");
  const [aboutTimelineDesc1, setAboutTimelineDesc1] = useState(initialData.about_timeline_desc1 || "Started as a joint coalition with 10 traditional farmers in Western Tamil Nadu to address high pesticide residues in urban rice supplies.");
  const [aboutTimelineYear2, setAboutTimelineYear2] = useState(initialData.about_timeline_year2 || "2025");
  const [aboutTimelineTitle2, setAboutTimelineTitle2] = useState(initialData.about_timeline_title2 || "Native Crop Catalog Launch");
  const [aboutTimelineDesc2, setAboutTimelineDesc2] = useState(initialData.about_timeline_desc2 || "Expanded catalog to include nutrient-dense millet noodles, raw forest honey, and cold-pressed oils. Partnered with regional certification networks.");
  const [aboutTimelineYear3, setAboutTimelineYear3] = useState(initialData.about_timeline_year3 || "2026");
  const [aboutTimelineTitle3, setAboutTimelineTitle3] = useState(initialData.about_timeline_title3 || "Clean Store Digitization");
  const [aboutTimelineDesc3, setAboutTimelineDesc3] = useState(initialData.about_timeline_desc3 || "Upgraded our technology architecture to launch custom farm builder pages, dynamic category controls, and quick regional distributions.");

  const [aboutCtaTitle, setAboutCtaTitle] = useState(initialData.about_cta_title || "Ready to Taste Wholesome Farm Purity?");
  const [aboutCtaSubtitle, setAboutCtaSubtitle] = useState(initialData.about_cta_subtitle || "Browse our fresh categories of high-fidelity, pesticide-free grains, noodles, oils, and sweeteners.");
  const [aboutCtaBtnText, setAboutCtaBtnText] = useState(initialData.about_cta_btn_text || "Browse Catalog");
  const [aboutCtaBtnLink, setAboutCtaBtnLink] = useState(initialData.about_cta_btn_link || "/shop");

  // 7. Contact Page Content
  const [contactHeroTitle, setContactHeroTitle] = useState(initialData.contact_hero_title || "Get In Touch");
  const [contactHeroSubtitle, setContactHeroSubtitle] = useState(initialData.contact_hero_subtitle || "Have a question about our organic harvests or bulk orders? Reach out to us, and our farm support representatives will reply promptly.");
  const [contactHelplineHours, setContactHelplineHours] = useState(initialData.contact_helpline_hours || "Mon - Sat, 9 AM - 6 PM IST");
  const [contactEmailSub, setContactEmailSub] = useState(initialData.contact_email_sub || "Replies within 24 hours");
  const [contactMapTitle, setContactMapTitle] = useState(initialData.contact_map_title || "Vivasaya Ullagam HQ");
  const [contactMapSubtitle, setContactMapSubtitle] = useState(initialData.contact_map_subtitle || "Coimbatore, Tamil Nadu");
  const [contactMapZone, setContactMapZone] = useState(initialData.contact_map_zone || "100% Organic Soil Zone");

  const [contactFaqQ1, setContactFaqQ1] = useState(initialData.contact_faq_q1 || "Do you offer home delivery outside Coimbatore?");
  const [contactFaqA1, setContactFaqA1] = useState(initialData.contact_faq_a1 || "Yes! We deliver across Tamil Nadu. Orders usually take 2-4 working days to arrive.");
  const [contactFaqQ2, setContactFaqQ2] = useState(initialData.contact_faq_q2 || "Are all products 100% certified organic?");
  const [contactFaqA2, setContactFaqA2] = useState(initialData.contact_faq_a2 || "Absolutely. We maintain strict certifications and source directly from farms maintaining natural bio-diversity.");

  // 8. Page Banners & Images
  const [shopBannerImage, setShopBannerImage] = useState(initialData.shop_banner_image || "");
  const [shopBannerTitle, setShopBannerTitle] = useState(initialData.shop_banner_title || "Our Organic Shop");
  const [shopBannerSubtitle, setShopBannerSubtitle] = useState(initialData.shop_banner_subtitle || "Pure, fresh, and chemical-free crops direct from the farm.");
  const [shopBannerEnabled, setShopBannerEnabled] = useState(initialData.shop_banner_enabled !== false);

  const [aboutHeroImage, setAboutHeroImage] = useState(initialData.about_hero_image || "");
  const [aboutStoryImage, setAboutStoryImage] = useState(initialData.about_story_image || "");
  const [contactHeroImage, setContactHeroImage] = useState(initialData.contact_hero_image || "");
  const [contactMapImage, setContactMapImage] = useState(initialData.contact_map_image || "");

  const [categoriesBannerImage, setCategoriesBannerImage] = useState(initialData.categories_banner_image || "");
  const [categoriesBannerTitle, setCategoriesBannerTitle] = useState(initialData.categories_banner_title || "Explore All Categories");
  const [categoriesBannerSubtitle, setCategoriesBannerSubtitle] = useState(initialData.categories_banner_subtitle || "Discover native traditional foods, chemical-free cold pressed oils, stone-ground flours, and wholesome sweets harvested with love.");
  const [categoriesBannerEnabled, setCategoriesBannerEnabled] = useState(initialData.categories_banner_enabled !== false);

  const [cartBannerImage, setCartBannerImage] = useState(initialData.cart_banner_image || "");
  const [cartBannerTitle, setCartBannerTitle] = useState(initialData.cart_banner_title || "Your Shopping Cart");
  const [cartBannerSubtitle, setCartBannerSubtitle] = useState(initialData.cart_banner_subtitle || "Review your selected items and proceed to a secure checkout.");
  const [cartBannerEnabled, setCartBannerEnabled] = useState(initialData.cart_banner_enabled !== false);

  const [promoLeftImage, setPromoLeftImage] = useState(initialData.promo_left_image || "");
  const [promoRightImage, setPromoRightImage] = useState(initialData.promo_right_image || "");

  // Dynamic Header Settings
  const [headerStyle, setHeaderStyle] = useState(initialData.header_style || "white");
  const [menuBadgeBestText, setMenuBadgeBestText] = useState(initialData.menu_badge_best_text || "HOT");
  const [menuBadgeBestBg, setMenuBadgeBestBg] = useState(initialData.menu_badge_best_bg || "#ff0000");
  const [menuBadgeComboText, setMenuBadgeComboText] = useState(initialData.menu_badge_combo_text || "Offers");
  const [menuBadgeComboBg, setMenuBadgeComboBg] = useState(initialData.menu_badge_combo_bg || "#ff0000");

  const [megamenuPromoEnabled, setMegamenuPromoEnabled] = useState(initialData.megamenu_promo_enabled === true);
  const [megamenuPromoTitle, setMegamenuPromoTitle] = useState(initialData.megamenu_promo_title || "Pure Palm Jaggery");
  const [megamenuPromoTag, setMegamenuPromoTag] = useState(initialData.megamenu_promo_tag || "15% OFF");
  const [megamenuPromoImage, setMegamenuPromoImage] = useState(initialData.megamenu_promo_image || "");
  const [megamenuPromoLink, setMegamenuPromoLink] = useState(initialData.megamenu_promo_link || "/shop?category=combo");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: primaryColor,
          announcement_text: announcementText,
          announcement_enabled: announcementEnabled,
          announcement_bg: announcementBg,
          announcement_text_color: announcementTextColor,
          logo_path: logoPath,
          favicon_path: faviconPath,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          shop_address: shopAddress,
          hero_slides: heroSlides,
          promo_left_title: promoLeftTitle,
          promo_left_subtitle: promoLeftSubtitle,
          promo_left_emoji: promoLeftEmoji,
          promo_left_link: promoLeftLink,
          promo_right_tag: promoRightTag,
          promo_right_title: promoRightTitle,
          promo_right_subtitle: promoRightSubtitle,
          promo_right_emoji: promoRightEmoji,
          promo_right_link: promoRightLink,
          featured_banners: featuredBanners,
          category_banners: categoryBanners,
          why_choose_title: whyChooseTitle,
          why_choose_subtitle: whyChooseSubtitle,
          section_hero_enabled: sectionHeroEnabled,
          section_category_grid_enabled: sectionCategoryGridEnabled,
          section_featured_banners_enabled: sectionFeaturedBannersEnabled,
          section_large_featured_banners_enabled: sectionLargeFeaturedBannersEnabled,
          section_category_banners_enabled: sectionCategoryBannersEnabled,
          section_shop_by_videos_enabled: sectionShopByVideosEnabled,
          section_new_products_enabled: sectionNewProductsEnabled,
          section_limited_deals_enabled: sectionLimitedDealsEnabled,
          section_why_us_enabled: sectionWhyUsEnabled,
          section_certifications_enabled: sectionCertificationsEnabled,
          section_category_grid_title: sectionCategoryGridTitle,
          section_new_products_title: sectionNewProductsTitle,
          section_new_products_subtitle: sectionNewProductsSubtitle,
          section_limited_deals_title: sectionLimitedDealsTitle,
          section_limited_deals_subtitle: sectionLimitedDealsSubtitle,
          section_certifications_title: sectionCertificationsTitle,
          section_certifications_subtitle: sectionCertificationsSubtitle,
          about_hero_title: aboutHeroTitle,
          about_hero_subtitle: aboutHeroSubtitle,
          about_hero_bg: aboutHeroBg,
          about_story_tag: aboutStoryTag,
          about_story_title: aboutStoryTitle,
          about_story_desc_1: aboutStoryDesc1,
          about_story_desc_2: aboutStoryDesc2,
          about_story_quote: aboutStoryQuote,
          about_story_cite: aboutStoryCite,
          about_mission_title: aboutMissionTitle,
          about_mission_desc: aboutMissionDesc,
          about_vision_title: aboutVisionTitle,
          about_vision_desc: aboutVisionDesc,
          about_values_title: aboutValuesTitle,
          about_values_desc: aboutValuesDesc,
          about_stat1_val: aboutStat1Val,
          about_stat1_lbl: aboutStat1Lbl,
          about_stat2_val: aboutStat2Val,
          about_stat2_lbl: aboutStat2Lbl,
          about_stat3_val: aboutStat3Val,
          about_stat3_lbl: aboutStat3Lbl,
          about_stat4_val: aboutStat4Val,
          about_stat4_lbl: aboutStat4Lbl,
          about_timeline_year1: aboutTimelineYear1,
          about_timeline_title1: aboutTimelineTitle1,
          about_timeline_desc1: aboutTimelineDesc1,
          about_timeline_year2: aboutTimelineYear2,
          about_timeline_title2: aboutTimelineTitle2,
          about_timeline_desc2: aboutTimelineDesc2,
          about_timeline_year3: aboutTimelineYear3,
          about_timeline_title3: aboutTimelineTitle3,
          about_timeline_desc3: aboutTimelineDesc3,
          about_cta_title: aboutCtaTitle,
          about_cta_subtitle: aboutCtaSubtitle,
          about_cta_btn_text: aboutCtaBtnText,
          about_cta_btn_link: aboutCtaBtnLink,
          contact_hero_title: contactHeroTitle,
          contact_hero_subtitle: contactHeroSubtitle,
          contact_helpline_hours: contactHelplineHours,
          contact_email_sub: contactEmailSub,
          contact_map_title: contactMapTitle,
          contact_map_subtitle: contactMapSubtitle,
          contact_map_zone: contactMapZone,
          contact_faq_q1: contactFaqQ1,
          contact_faq_a1: contactFaqA1,
          contact_faq_q2: contactFaqQ2,
          contact_faq_a2: contactFaqA2,
          shop_banner_image: shopBannerImage,
          shop_banner_title: shopBannerTitle,
          shop_banner_subtitle: shopBannerSubtitle,
          shop_banner_enabled: shopBannerEnabled,
          about_hero_image: aboutHeroImage,
          about_story_image: aboutStoryImage,
          contact_hero_image: contactHeroImage,
          contact_map_image: contactMapImage,
          categories_banner_image: categoriesBannerImage,
          categories_banner_title: categoriesBannerTitle,
          categories_banner_subtitle: categoriesBannerSubtitle,
          categories_banner_enabled: categoriesBannerEnabled,
          cart_banner_image: cartBannerImage,
          cart_banner_title: cartBannerTitle,
          cart_banner_subtitle: cartBannerSubtitle,
          cart_banner_enabled: cartBannerEnabled,
          promo_left_image: promoLeftImage,
          promo_right_image: promoRightImage,
          header_style: headerStyle,
          menu_badge_best_text: menuBadgeBestText,
          menu_badge_best_bg: menuBadgeBestBg,
          menu_badge_combo_text: menuBadgeComboText,
          menu_badge_combo_bg: menuBadgeComboBg,
          megamenu_promo_enabled: megamenuPromoEnabled,
          megamenu_promo_title: megamenuPromoTitle,
          megamenu_promo_tag: megamenuPromoTag,
          megamenu_promo_image: megamenuPromoImage,
          megamenu_promo_link: megamenuPromoLink,
        }),
      });
      router.refresh();
      // Auto-reload preview iframe
      setPreviewKey(k => k + 1);
      alert('CMS Settings saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Slideshow Handlers
  const addSlide = () => {
    const nextId = heroSlides.length > 0 ? Math.max(...heroSlides.map(s => s.id)) + 1 : 1;
    setHeroSlides([...heroSlides, { id: nextId, image: "/logo.png", isImageOnly: false, headline: "New Slide Title", subtitle: "Slide Subtitle description here", bg: "from-[#1F6B3B] to-[#3F8F55]", imgEmoji: "🌾", link: "#shop" }]);
  };

  const removeSlide = (id: number) => {
    setHeroSlides(heroSlides.filter(s => s.id !== id));
  };

  const updateSlideField = (id: number, field: string, value: any) => {
    setHeroSlides(heroSlides.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === heroSlides.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const list = [...heroSlides];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setHeroSlides(list);
  };

  // Small Banners Handlers
  const updateFeaturedBannerField = (id: number, field: string, value: any) => {
    setFeaturedBanners(featuredBanners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Category Banners Handlers
  const updateCategoryBannerField = (id: number, field: string, value: any) => {
    setCategoryBanners(categoryBanners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] gap-6">
      
      {/* ── LEFT PANEL: WordPress-Style Customizer Sidebar ── */}
      <div className="w-full lg:w-[420px] bg-white border border-gray-200 rounded-2xl p-6 flex flex-col shadow-sm shrink-0">
        
        {/* Header */}
        <div className="mb-6 border-b border-gray-150 pb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Store size={20} className="text-[#1F6B3B]" />
            Site Customizer
          </h2>
          <p className="text-xs text-gray-400 mt-1">Configure layout, assets, and banner options in modular sections.</p>
        </div>

        {/* Scrollable Accordions */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[calc(100vh-280px)]">
            
            {/* Section 1: General & Color */}
            <div className="space-y-1">
              <AccordionHeader id="general" label="General Settings & Colors" icon={Palette} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "general" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Primary Accent Color</label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 p-1 border border-gray-200 rounded-xl cursor-pointer"
                      />
                      <span className="text-xs text-gray-600 font-mono font-bold">{primaryColor}</span>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">Announcement Bar</span>
                      <button
                        type="button"
                        onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                        className={`text-[11px] px-2.5 py-1.5 border rounded-lg font-semibold transition-colors ${
                          announcementEnabled
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {announcementEnabled ? "Visible" : "Hidden"}
                      </button>
                    </div>

                    {announcementEnabled && (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-gray-600">Announcement text</label>
                          <input
                            type="text"
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#1F6B3B]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600">Background</label>
                            <input
                              type="color"
                              value={announcementBg}
                              onChange={(e) => setAnnouncementBg(e.target.value)}
                              className="w-full h-8 p-1 border rounded-lg cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-gray-600">Text color</label>
                            <input
                              type="color"
                              value={announcementTextColor}
                              onChange={(e) => setAnnouncementTextColor(e.target.value)}
                              className="w-full h-8 p-1 border rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Brand Identity */}
            <div className="space-y-1">
              <AccordionHeader id="branding" label="Brand Identity & Header" icon={Store} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "branding" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <ImagePicker 
                    label="Store Logo" 
                    value={logoPath} 
                    onChange={setLogoPath} 
                    description="Upload your store logo (.png or .jpg)"
                  />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">Favicon Path</label>
                    <input
                      type="text"
                      value={faviconPath}
                      onChange={(e) => setFaviconPath(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#1F6B3B]"
                    />
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700">Support Details</h4>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600">Support Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#1F6B3B]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600">Support Phone</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#1F6B3B]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-600">Store Address</label>
                      <textarea
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#1F6B3B] resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2.5: Header Navigation Module */}
            <div className="space-y-1">
              <AccordionHeader id="header" label="Header Navigation Module" icon={Layout} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "header" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">Header Layout Style</label>
                    <select
                      value={headerStyle}
                      onChange={(e) => setHeaderStyle(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-2 text-xs bg-white focus:outline-none focus:border-[#1F6B3B]"
                    >
                      <option value="white">Classic Clean White</option>
                      <option value="premium-clean">Premium Clean Ecommerce Header (92px White)</option>
                      <option value="forest">Solid Forest Green (Theme Accent)</option>
                      <option value="floating">Modern Floating Organic Glassmorphic</option>
                      <option value="split">Luxury Centered Split Navigation</option>
                      <option value="double-row">Double Row eCommerce Portal</option>
                      <option value="transparent">Transparent Hero Blend</option>
                      <option value="centered-search">Centered Logo & Bottom Navigation</option>
                      <option value="minimal-drawer">Boutique Off-Canvas Header</option>
                      <option value="dark-minimal">Charcoal & Lime Minimalist</option>
                      <option value="capsule-forest">Floating White Capsule in Forest Green Bar (Image 1 Style)</option>
                      <option value="split-cards-hero">Split Floating Cards over Hero (Image 2 Style)</option>
                      <option value="luxury-shopify">Shopify Luxury Minimalist Header</option>
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">Changes the header background style matching your organic theme.</p>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Best Selling Badge</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Badge Text</label>
                        <input
                          type="text"
                          value={menuBadgeBestText}
                          onChange={(e) => setMenuBadgeBestText(e.target.value)}
                          className="w-full border border-gray-250 rounded-lg p-1.5 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Badge BG Color</label>
                        <input
                          type="color"
                          value={menuBadgeBestBg}
                          onChange={(e) => setMenuBadgeBestBg(e.target.value)}
                          className="w-full h-8 p-1 border rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Special Combo Badge</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Badge Text</label>
                        <input
                          type="text"
                          value={menuBadgeComboText}
                          onChange={(e) => setMenuBadgeComboText(e.target.value)}
                          className="w-full border border-gray-250 rounded-lg p-1.5 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Badge BG Color</label>
                        <input
                          type="color"
                          value={menuBadgeComboBg}
                          onChange={(e) => setMenuBadgeComboBg(e.target.value)}
                          className="w-full h-8 p-1 border rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between border-b border-gray-150 pb-1.5">
                      <h4 className="text-xs font-bold text-[#1F6B3B]">Mega Menu Promo Block</h4>
                      <button
                        type="button"
                        onClick={() => setMegamenuPromoEnabled(!megamenuPromoEnabled)}
                        className={`text-[10px] px-2 py-0.5 border rounded font-semibold transition-colors ${
                          megamenuPromoEnabled ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {megamenuPromoEnabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    {megamenuPromoEnabled && (
                      <div className="space-y-2.5 pt-1">
                        <ImagePicker 
                          label="Promo Image banner" 
                          value={megamenuPromoImage} 
                          onChange={setMegamenuPromoImage} 
                        />
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-600">Promo Title</label>
                          <input
                            type="text"
                            value={megamenuPromoTitle}
                            onChange={(e) => setMegamenuPromoTitle(e.target.value)}
                            className="w-full border border-gray-250 rounded-lg p-1.5 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-600">Tagline / Badge</label>
                            <input
                              type="text"
                              value={megamenuPromoTag}
                              onChange={(e) => setMegamenuPromoTag(e.target.value)}
                              className="w-full border border-gray-250 rounded-lg p-1.5 text-xs"
                              placeholder="e.g. 15% OFF"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-gray-600">Action Link</label>
                            <input
                              type="text"
                              value={megamenuPromoLink}
                              onChange={(e) => setMegamenuPromoLink(e.target.value)}
                              className="w-full border border-gray-250 rounded-lg p-1.5 text-xs"
                              placeholder="e.g. /shop?category=combo"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Hero Slideshow */}
            <div className="space-y-1">
              <AccordionHeader id="hero" label="Hero Slideshow Module" icon={ImageIcon} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "hero" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-[10px] text-gray-400">Aspect ratio recommended 2:1.</span>
                    <button
                      type="button"
                      onClick={addSlide}
                      className="flex items-center gap-1 bg-[#1F6B3B]/10 hover:bg-[#1F6B3B]/20 text-[#1F6B3B] text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={12} /> Add Slide
                    </button>
                  </div>

                  <div className="space-y-4">
                    {heroSlides.map((slide, index) => (
                      <div key={slide.id} className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-sm relative">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-[11px] font-bold text-[#1F6B3B]">Slide #{index + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveSlide(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-40"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSlide(index, 'down')}
                              disabled={index === heroSlides.length - 1}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-40"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSlide(slide.id)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded ml-1"
                              title="Delete Slide"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500">Overlay Content</label>
                            <select
                              value={slide.isImageOnly ? "image" : "text"}
                              onChange={(e) => updateSlideField(slide.id, "isImageOnly", e.target.value === "image")}
                              className="w-full border border-gray-200 rounded-xl p-1.5 text-xs bg-white"
                            >
                              <option value="text">Show Text Overlay & Emojis</option>
                              <option value="image">Show Image Banner Only</option>
                            </select>
                          </div>

                          <ImagePicker
                            label="Background Banner Image"
                            value={slide.image || ""}
                            onChange={(val) => updateSlideField(slide.id, "image", val)}
                          />

                          {!slide.isImageOnly && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500">Headline</label>
                                <input
                                  type="text"
                                  value={slide.headline || ""}
                                  onChange={(e) => updateSlideField(slide.id, "headline", e.target.value)}
                                  className="w-full border border-gray-200 rounded-xl p-1.5 text-xs focus:outline-none focus:border-[#1F6B3B]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500">Subtitle tagline</label>
                                <input
                                  type="text"
                                  value={slide.subtitle || ""}
                                  onChange={(e) => updateSlideField(slide.id, "subtitle", e.target.value)}
                                  className="w-full border border-gray-200 rounded-xl p-1.5 text-xs focus:outline-none focus:border-[#1F6B3B]"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500">Emoji (e.g. 🌾)</label>
                                  <input
                                    type="text"
                                    value={slide.imgEmoji || ""}
                                    onChange={(e) => updateSlideField(slide.id, "imgEmoji", e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-1.5 text-xs focus:outline-none focus:border-[#1F6B3B]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500">Background (Tailwind)</label>
                                  <input
                                    type="text"
                                    value={slide.bg || ""}
                                    onChange={(e) => updateSlideField(slide.id, "bg", e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-1.5 text-xs focus:outline-none focus:border-[#1F6B3B]"
                                    placeholder="from-[#1F6B3B] to-[#3F8F55]"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500">Action Link</label>
                            <input
                              type="text"
                              value={slide.link || ""}
                              onChange={(e) => updateSlideField(slide.id, "link", e.target.value)}
                              className="w-full border border-gray-200 rounded-xl p-1.5 text-xs focus:outline-none focus:border-[#1F6B3B]"
                              placeholder="#shop"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Promo Banners */}
            <div className="space-y-1">
              <AccordionHeader id="promo_banners" label="Promo Banners Module" icon={Layout} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "promo_banners" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Left Featured Combo Banner</h4>
                    <ImagePicker 
                      label="Banner Background Image" 
                      value={promoLeftImage} 
                      onChange={setPromoLeftImage}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Title</label>
                        <input type="text" value={promoLeftTitle} onChange={(e)=>setPromoLeftTitle(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Subtitle</label>
                        <input type="text" value={promoLeftSubtitle} onChange={(e)=>setPromoLeftSubtitle(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Emoji (e.g. 🍜)</label>
                        <input type="text" value={promoLeftEmoji} onChange={(e)=>setPromoLeftEmoji(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Link</label>
                        <input type="text" value={promoLeftLink} onChange={(e)=>setPromoLeftLink(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Right Featured Combo Banner</h4>
                    <ImagePicker 
                      label="Banner Background Image" 
                      value={promoRightImage} 
                      onChange={setPromoRightImage}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Title</label>
                        <input type="text" value={promoRightTitle} onChange={(e)=>promoRightTitle && setPromoRightTitle(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Subtitle</label>
                        <input type="text" value={promoRightSubtitle} onChange={(e)=>setPromoRightSubtitle(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Tag Badge</label>
                        <input type="text" value={promoRightTag} onChange={(e)=>setPromoRightTag(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">Emoji (e.g. 🥥)</label>
                        <input type="text" value={promoRightEmoji} onChange={(e)=>setPromoRightEmoji(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-gray-500">Link</label>
                        <input type="text" value={promoRightLink} onChange={(e)=>setPromoRightLink(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1 text-xs"/>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700">Small Featured Banners (3 Cards)</h4>
                    {featuredBanners.map((b, i) => (
                      <div key={b.id} className="bg-white p-2.5 border rounded-lg space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-gray-400">Card #{i+1}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input type="text" value={b.label} onChange={(e)=>updateFeaturedBannerField(b.id, 'label', e.target.value)} placeholder="Title" className="border rounded px-1.5 py-0.5"/>
                          <input type="text" value={b.tagline} onChange={(e)=>updateFeaturedBannerField(b.id, 'tagline', e.target.value)} placeholder="Tagline" className="border rounded px-1.5 py-0.5"/>
                          <input type="text" value={b.emoji} onChange={(e)=>updateFeaturedBannerField(b.id, 'emoji', e.target.value)} placeholder="Emoji" className="border rounded px-1.5 py-0.5"/>
                          <input type="text" value={b.bg} onChange={(e)=>updateFeaturedBannerField(b.id, 'bg', e.target.value)} placeholder="Background Class" className="border rounded px-1.5 py-0.5"/>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700">Scrollable Category Banners (5 Cards)</h4>
                    {categoryBanners.map((b, i) => (
                      <div key={b.id} className="bg-white p-2.5 border rounded-lg space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-gray-400">Category Scroll #{i+1}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input type="text" value={b.name} onChange={(e)=>updateCategoryBannerField(b.id, 'name', e.target.value)} placeholder="Name" className="border rounded px-1.5 py-0.5"/>
                          <input type="text" value={b.tagline} onChange={(e)=>updateCategoryBannerField(b.id, 'tagline', e.target.value)} placeholder="Tagline" className="border rounded px-1.5 py-0.5"/>
                          <input type="text" value={b.emoji} onChange={(e)=>updateCategoryBannerField(b.id, 'emoji', e.target.value)} placeholder="Emoji" className="border rounded px-1.5 py-0.5"/>
                          <input type="text" value={b.bg} onChange={(e)=>updateCategoryBannerField(b.id, 'bg', e.target.value)} placeholder="Background Class" className="border rounded px-1.5 py-0.5"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Homepage Section Toggles */}
            <div className="space-y-1">
              <AccordionHeader id="sections" label="Homepage Sections Grid" icon={Type} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "sections" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700">Toggle Block Visibility</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Hero Slideshow", val: sectionHeroEnabled, set: setSectionHeroEnabled },
                        { label: "Category Grid", val: sectionCategoryGridEnabled, set: setSectionCategoryGridEnabled },
                        { label: "Small Banners (3 Cards)", val: sectionFeaturedBannersEnabled, set: setSectionFeaturedBannersEnabled },
                        { label: "Large Combo Banners", val: sectionLargeFeaturedBannersEnabled, set: setSectionLargeFeaturedBannersEnabled },
                        { label: "Category Scroll Banners", val: sectionCategoryBannersEnabled, set: setSectionCategoryBannersEnabled },
                        { label: "Shop By Videos Block", val: sectionShopByVideosEnabled, set: setSectionShopByVideosEnabled },
                        { label: "New Products Module", val: sectionNewProductsEnabled, set: setSectionNewProductsEnabled },
                        { label: "Limited Flash Deals", val: sectionLimitedDealsEnabled, set: setSectionLimitedDealsEnabled },
                        { label: "Why Choose Us Info", val: sectionWhyUsEnabled, set: setSectionWhyUsEnabled },
                        { label: "Certifications Badges", val: sectionCertificationsEnabled, set: setSectionCertificationsEnabled },
                      ].map((sec) => (
                        <div key={sec.label} className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-150 shadow-sm text-xs">
                          <span className="font-semibold text-gray-700">{sec.label}</span>
                          <button
                            type="button"
                            onClick={() => sec.set(!sec.val)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              sec.val
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-gray-200 bg-gray-50 text-gray-500"
                            }`}
                          >
                            {sec.val ? "Active" : "Disabled"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-700">Block Headings & Titles</h4>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Category Grid Title</label>
                        <input type="text" value={sectionCategoryGridTitle} onChange={(e)=>setSectionCategoryGridTitle(e.target.value)} className="w-full border rounded-lg p-1.5 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">New Products Title</label>
                        <input type="text" value={sectionNewProductsTitle} onChange={(e)=>setSectionNewProductsTitle(e.target.value)} className="w-full border rounded-lg p-1.5 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">New Products Tagline</label>
                        <textarea value={sectionNewProductsSubtitle} onChange={(e)=>setSectionNewProductsSubtitle(e.target.value)} rows={2} className="w-full border rounded-lg p-1.5 text-xs resize-none"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Flash Deal Heading</label>
                        <input type="text" value={sectionLimitedDealsTitle} onChange={(e)=>setSectionLimitedDealsTitle(e.target.value)} className="w-full border rounded-lg p-1.5 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Why Us Title</label>
                        <input type="text" value={whyChooseTitle} onChange={(e)=>setWhyChooseTitle(e.target.value)} className="w-full border rounded-lg p-1.5 text-xs"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-600">Certifications Header</label>
                        <input type="text" value={sectionCertificationsTitle} onChange={(e)=>setSectionCertificationsTitle(e.target.value)} className="w-full border rounded-lg p-1.5 text-xs"/>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Sub-Page Header Banners */}
            <div className="space-y-1">
              <AccordionHeader id="page_banners" label="Page Banners & Imagery" icon={ImageIcon} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "page_banners" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  
                  {/* Shop Page Banner */}
                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between border-b border-gray-150 pb-1.5">
                      <h4 className="text-xs font-bold text-[#1F6B3B]">Shop Page Banner</h4>
                      <button
                        type="button"
                        onClick={() => setShopBannerEnabled(!shopBannerEnabled)}
                        className={`text-[10px] px-2 py-0.5 border rounded font-semibold transition-colors ${
                          shopBannerEnabled ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {shopBannerEnabled ? "Active" : "Disabled"}
                      </button>
                    </div>
                    {shopBannerEnabled && (
                      <div className="space-y-2">
                        <ImagePicker label="Banner Image" value={shopBannerImage} onChange={setShopBannerImage}/>
                        <input type="text" value={shopBannerTitle} onChange={(e)=>setShopBannerTitle(e.target.value)} placeholder="Title" className="w-full border rounded p-1 text-xs"/>
                        <input type="text" value={shopBannerSubtitle} onChange={(e)=>setShopBannerSubtitle(e.target.value)} placeholder="Subtitle" className="w-full border rounded p-1 text-xs"/>
                      </div>
                    )}
                  </div>

                  {/* Categories Page Banner */}
                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between border-b border-gray-150 pb-1.5">
                      <h4 className="text-xs font-bold text-[#1F6B3B]">Categories Page Banner</h4>
                      <button
                        type="button"
                        onClick={() => setCategoriesBannerEnabled(!categoriesBannerEnabled)}
                        className={`text-[10px] px-2 py-0.5 border rounded font-semibold transition-colors ${
                          categoriesBannerEnabled ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {categoriesBannerEnabled ? "Active" : "Disabled"}
                      </button>
                    </div>
                    {categoriesBannerEnabled && (
                      <div className="space-y-2">
                        <ImagePicker label="Banner Image" value={categoriesBannerImage} onChange={setCategoriesBannerImage}/>
                        <input type="text" value={categoriesBannerTitle} onChange={(e)=>setCategoriesBannerTitle(e.target.value)} placeholder="Title" className="w-full border rounded p-1 text-xs"/>
                        <input type="text" value={categoriesBannerSubtitle} onChange={(e)=>setCategoriesBannerSubtitle(e.target.value)} placeholder="Subtitle" className="w-full border rounded p-1 text-xs"/>
                      </div>
                    )}
                  </div>

                  {/* Cart Page Banner */}
                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between border-b border-gray-150 pb-1.5">
                      <h4 className="text-xs font-bold text-[#1F6B3B]">Cart Page Banner</h4>
                      <button
                        type="button"
                        onClick={() => setCartBannerEnabled(!cartBannerEnabled)}
                        className={`text-[10px] px-2 py-0.5 border rounded font-semibold transition-colors ${
                          cartBannerEnabled ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {cartBannerEnabled ? "Active" : "Disabled"}
                      </button>
                    </div>
                    {cartBannerEnabled && (
                      <div className="space-y-2">
                        <ImagePicker label="Banner Image" value={cartBannerImage} onChange={setCartBannerImage}/>
                        <input type="text" value={cartBannerTitle} onChange={(e)=>setCartBannerTitle(e.target.value)} placeholder="Title" className="w-full border rounded p-1 text-xs"/>
                        <input type="text" value={cartBannerSubtitle} onChange={(e)=>setCartBannerSubtitle(e.target.value)} placeholder="Subtitle" className="w-full border rounded p-1 text-xs"/>
                      </div>
                    )}
                  </div>

                  {/* About Page Hero & Story Custom Images */}
                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">About Page Imagery</h4>
                    <ImagePicker label="About Page Hero Image" value={aboutHeroImage} onChange={setAboutHeroImage}/>
                    <ImagePicker label="About Page Story Image" value={aboutStoryImage} onChange={setAboutStoryImage}/>
                  </div>

                  {/* Contact Page Hero & Map Custom Images */}
                  <div className="space-y-3 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Contact Page Imagery</h4>
                    <ImagePicker label="Contact Page Hero Image" value={contactHeroImage} onChange={setContactHeroImage}/>
                    <ImagePicker label="Contact Page Map Placeholder" value={contactMapImage} onChange={setContactMapImage}/>
                  </div>

                </div>
              )}
            </div>

            {/* Section 7: About Page Details */}
            <div className="space-y-1">
              <AccordionHeader id="about" label="About Page Content" icon={Info} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "about" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <div className="space-y-2 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Hero Section</h4>
                    <input type="text" value={aboutHeroTitle} onChange={(e)=>setAboutHeroTitle(e.target.value)} placeholder="Hero Title" className="w-full border rounded p-1.5 text-xs mb-2"/>
                    <textarea value={aboutHeroSubtitle} onChange={(e)=>setAboutHeroSubtitle(e.target.value)} placeholder="Hero Subtitle" rows={2} className="w-full border rounded p-1.5 text-xs resize-none"/>
                  </div>

                  <div className="space-y-2 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Brand Story Text</h4>
                    <input type="text" value={aboutStoryTag} onChange={(e)=>setAboutStoryTag(e.target.value)} placeholder="Story Tag" className="w-full border rounded p-1 text-xs"/>
                    <input type="text" value={aboutStoryTitle} onChange={(e)=>setAboutStoryTitle(e.target.value)} placeholder="Story Heading" className="w-full border rounded p-1 text-xs"/>
                    <textarea value={aboutStoryDesc1} onChange={(e)=>setAboutStoryDesc1(e.target.value)} placeholder="Story Paragraph 1" rows={3} className="w-full border rounded p-1 text-xs resize-none"/>
                    <textarea value={aboutStoryDesc2} onChange={(e)=>setAboutStoryDesc2(e.target.value)} placeholder="Story Paragraph 2" rows={3} className="w-full border rounded p-1 text-xs resize-none"/>
                    <textarea value={aboutStoryQuote} onChange={(e)=>setAboutStoryQuote(e.target.value)} placeholder="Quote text" rows={2} className="w-full border rounded p-1 text-xs resize-none"/>
                    <input type="text" value={aboutStoryCite} onChange={(e)=>setAboutStoryCite(e.target.value)} placeholder="Quote Author Citation" className="w-full border rounded p-1 text-xs"/>
                  </div>

                  <div className="space-y-2 bg-white p-3 border border-gray-200 rounded-xl text-xs">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Statistics Counters</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input type="text" value={aboutStat1Val} onChange={(e)=>setAboutStat1Val(e.target.value)} className="border rounded w-full p-1"/>
                        <input type="text" value={aboutStat1Lbl} onChange={(e)=>setAboutStat1Lbl(e.target.value)} className="border rounded w-full p-1 text-[10px] text-gray-400 mt-0.5"/>
                      </div>
                      <div>
                        <input type="text" value={aboutStat2Val} onChange={(e)=>setAboutStat2Val(e.target.value)} className="border rounded w-full p-1"/>
                        <input type="text" value={aboutStat2Lbl} onChange={(e)=>setAboutStat2Lbl(e.target.value)} className="border rounded w-full p-1 text-[10px] text-gray-400 mt-0.5"/>
                      </div>
                      <div>
                        <input type="text" value={aboutStat3Val} onChange={(e)=>setAboutStat3Val(e.target.value)} className="border rounded w-full p-1"/>
                        <input type="text" value={aboutStat3Lbl} onChange={(e)=>setAboutStat3Lbl(e.target.value)} className="border rounded w-full p-1 text-[10px] text-gray-400 mt-0.5"/>
                      </div>
                      <div>
                        <input type="text" value={aboutStat4Val} onChange={(e)=>setAboutStat4Val(e.target.value)} className="border rounded w-full p-1"/>
                        <input type="text" value={aboutStat4Lbl} onChange={(e)=>setAboutStat4Lbl(e.target.value)} className="border rounded w-full p-1 text-[10px] text-gray-400 mt-0.5"/>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Mission & Vision</h4>
                    <input type="text" value={aboutMissionTitle} onChange={(e)=>setAboutMissionTitle(e.target.value)} className="w-full border rounded p-1 text-xs"/>
                    <textarea value={aboutMissionDesc} onChange={(e)=>setAboutMissionDesc(e.target.value)} rows={2} className="w-full border rounded p-1 text-xs resize-none"/>
                    <input type="text" value={aboutVisionTitle} onChange={(e)=>setAboutVisionTitle(e.target.value)} className="w-full border rounded p-1 text-xs"/>
                    <textarea value={aboutVisionDesc} onChange={(e)=>setAboutVisionDesc(e.target.value)} rows={2} className="w-full border rounded p-1 text-xs resize-none"/>
                  </div>
                </div>
              )}
            </div>

            {/* Section 8: Contact Page Details */}
            <div className="space-y-1">
              <AccordionHeader id="contact" label="Contact Page Content" icon={Phone} activeAccordion={activeAccordion} setActiveAccordion={setActiveAccordion} />
              {activeAccordion === "contact" && (
                <div className="p-4 bg-gray-50 border-x border-b border-gray-200 rounded-b-xl space-y-4 -mt-1.5 mb-2 animate-in fade-in duration-200">
                  <div className="space-y-2 bg-white p-3 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">Helpline & Address</h4>
                    <input type="text" value={contactHeroTitle} onChange={(e)=>setContactHeroTitle(e.target.value)} placeholder="Contact Title" className="w-full border rounded p-1 text-xs"/>
                    <textarea value={contactHeroSubtitle} onChange={(e)=>setContactHeroSubtitle(e.target.value)} placeholder="Subtext description" rows={2} className="w-full border rounded p-1 text-xs resize-none"/>
                    <input type="text" value={contactHelplineHours} onChange={(e)=>setContactHelplineHours(e.target.value)} placeholder="Opening hours details" className="w-full border rounded p-1 text-xs"/>
                    <input type="text" value={contactEmailSub} onChange={(e)=>setContactEmailSub(e.target.value)} placeholder="Email support times" className="w-full border rounded p-1 text-xs"/>
                  </div>

                  <div className="space-y-2 bg-white p-3 border border-gray-200 rounded-xl text-xs">
                    <h4 className="text-xs font-bold text-[#1F6B3B]">FAQ Accordion Items</h4>
                    <div className="border border-gray-150 p-2 rounded-lg space-y-1">
                      <span className="text-[10px] font-bold text-gray-400">FAQ 1</span>
                      <input type="text" value={contactFaqQ1} onChange={(e)=>setContactFaqQ1(e.target.value)} className="w-full border rounded p-1"/>
                      <textarea value={contactFaqA1} onChange={(e)=>setContactFaqA1(e.target.value)} rows={2} className="w-full border rounded p-1 resize-none"/>
                    </div>
                    <div className="border border-gray-150 p-2 rounded-lg space-y-1">
                      <span className="text-[10px] font-bold text-gray-400">FAQ 2</span>
                      <input type="text" value={contactFaqQ2} onChange={(e)=>setContactFaqQ2(e.target.value)} className="w-full border rounded p-1"/>
                      <textarea value={contactFaqA2} onChange={(e)=>setContactFaqA2(e.target.value)} rows={2} className="w-full border rounded p-1 resize-none"/>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Form Save Button Footer */}
          <div className="mt-4 pt-4 border-t border-gray-150 flex justify-end shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F6B3B] hover:bg-[#154a28] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving Settings...
                </>
              ) : (
                "Publish Customizations"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── RIGHT PANEL: Live Storefront Preview Workspace ── */}
      <div className="flex-1 hidden lg:flex flex-col bg-gray-100 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Preview Topbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          
          {/* Page Route Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500">Preview:</span>
            <select
              value={previewPage}
              onChange={(e) => setPreviewPage(e.target.value)}
              className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white font-medium text-gray-700 focus:outline-none focus:border-[#1F6B3B]"
            >
              <option value="/">Homepage ( / )</option>
              <option value="/shop">Shop Page ( /shop )</option>
              <option value="/categories">Categories ( /categories )</option>
              <option value="/about">About Us ( /about )</option>
              <option value="/contact">Contact Us ( /contact )</option>
              <option value="/cart">Cart Page ( /cart )</option>
            </select>
          </div>

          {/* Sizing Viewport Toggles */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {[
              { id: "desktop", icon: Monitor, label: "Desktop view" },
              { id: "tablet", icon: Tablet, label: "Tablet view" },
              { id: "mobile", icon: Smartphone, label: "Mobile view" },
            ].map((device) => {
              const Icon = device.icon;
              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => setPreviewWidth(device.id as any)}
                  title={device.label}
                  className={`p-1.5 rounded-lg transition-all ${
                    previewWidth === device.id
                      ? "bg-white text-[#1F6B3B] shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          {/* Manual Refresh Button */}
          <div>
            <button
              type="button"
              onClick={() => setPreviewKey(k => k + 1)}
              title="Refresh Live Preview"
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          </div>

        </div>

        {/* Live Preview Container Frame */}
        <div className="flex-1 flex items-center justify-center p-4 bg-[#f3f4f6] overflow-auto">
          <div
            className={`h-full bg-white shadow-xl transition-all duration-300 ${
              previewWidth === "desktop"
                ? "w-full"
                : previewWidth === "tablet"
                ? "w-[768px] border-[12px] border-gray-800 rounded-3xl"
                : "w-[375px] border-[12px] border-gray-800 rounded-3xl"
            }`}
          >
            <iframe
              key={previewKey}
              src={previewPage}
              className="w-full h-full border-0 rounded-2xl"
              title="Site Live Preview"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
