"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Apple,
  Candy,
  ChevronDown,
  CookingPot,
  Flame,
  FlaskConical,
  FlaskRound,
  Gift,
  Home,
  Info,
  LayoutGrid,
  Leaf,
  Mail,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
  Sprout,
  Store,
  Tag,
  Truck,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import SearchDrawer from "@/components/layout/SearchDrawer";
import Logo from "@/components/ui/Logo";
import { categories } from "@/data/categories";
import { useCartStore } from "@/store/cartStore";

type NavCategory = {
  id?: number | string;
  _id?: string;
  name: string;
  slug: string;
  emoji?: string;
  isVisible?: boolean;
  parentId?: string | null;
};

type CategoriesResponse = {
  success?: boolean;
  categories?: NavCategory[];
};

type NavbarSettings = Record<string, string | boolean | undefined> & {
  contact_email?: string;
  contact_phone?: string;
};

type SettingsResponse = {
  success?: boolean;
  settings?: NavbarSettings;
};

type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  badgeLabel?: string;
  badgeTone?: "green" | "red";
  hasDropdown?: boolean;
  hideDesktopChevron?: boolean;
  hideDesktopIcon?: boolean;
};

const desktopNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  {
    label: "All categories",
    href: "/categories",
    icon: LayoutGrid,
    hasDropdown: true,
    hideDesktopChevron: true,
    hideDesktopIcon: true,
  },
  {
    label: "Best selling",
    href: "/shop?sort=bestselling",
    icon: Flame,
    badgeLabel: "HOT",
    badgeTone: "red",
  },
  {
    label: "Special Combo",
    href: "/shop?category=combo",
    badgeLabel: "Offers",
    badgeTone: "red",
  },
  { label: "About Us", href: "/about-us" },
  { label: "Track Order", href: "/track-order" },
];

const drawerLinks: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Categories", href: "/categories", icon: LayoutGrid },
  { label: "About Us", href: "/about-us", icon: Info },
  { label: "Offers", href: "/shop?category=combo", icon: Sparkles },
  { label: "Track Order", href: "/track-order", icon: Truck },
];

function LogoMedallion({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Vivasaya Ulagam Home"
      className={`group z-20 rounded-full transition-all duration-300 ${
        mobile
          ? "mobile-logo-medallion absolute left-1/2 top-[2px] h-[56px] w-[56px] -translate-x-1/2 overflow-hidden bg-white border border-[#3D7A1C]/12 shadow-sm"
          : "top-[2px] h-[82px] w-[82px] -translate-x-1/2 bg-[#fffef9] border border-[#cfdab8] shadow-[0_14px_26px_-16px_rgba(69,96,36,0.36)] hover:scale-[1.03]"
      }`}
    >
      <span className="absolute inset-[4px] rounded-full border border-[#dde5ca]" aria-hidden="true" />
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#fffef9] p-1.5">
        <Logo
          className="h-full w-full rounded-full object-contain"
        />
      </span>
    </Link>
  );
}

function DesktopWordmark() {
  return (
    <Link
      href="/"
      aria-label="Vivasaya Ulagam Home"
      className="flex h-full w-[138px] shrink-0 items-center overflow-visible"
    >
      <Logo className="h-[78px] w-[188px] max-w-none object-contain" />
    </Link>
  );
}


function DeliveryTruckIcon({ size = 27, strokeWidth = 1.8, color = "#222" }: { size?: number; strokeWidth?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Cargo container */}
      <rect x="2" y="7" width="13" height="9" rx="1" />
      {/* Cabin */}
      <path d="M15 9h4l3 3v4h-7V9z" />
      {/* Wheels */}
      <circle cx="6.5" cy="18.5" r="1.5" />
      <circle cx="18.5" cy="18.5" r="1.5" />
      {/* Location pin in cargo container */}
      <path d="M8.5 9c-1 0-1.8.8-1.8 1.8 0 1.4 1.8 3.2 1.8 3.2s1.8-1.8 1.8-3.2C10.3 9.8 9.5 9 8.5 9z" />
      <circle cx="8.5" cy="10.8" r="0.6" fill={color} />
    </svg>
  );
}

// Exact name-to-icon map for drawer categories
const categoryIcons: Record<string, LucideIcon> = {
  "COMBO": Gift,
  "Dry Vegetables": Leaf,
  "Fruits": Apple,
  "HOME MADE MASALAS": CookingPot,
  "Herbal Powders": Sprout,
  "Oil And Ghee": FlaskRound,   // Lucide has no Bottle icon; FlaskRound is the closest
  "Others": Tag,
  "Sweet & Snacks": Candy,
  "pickle": FlaskConical,       // Lucide has no Jar icon; FlaskConical is the closest
};

// Fallback: derive icon from slug keywords when name not in map
const getFallbackIcon = (slug: string): LucideIcon => {
  const s = slug.toLowerCase();
  if (s.includes("combo") || s.includes("gift")) return Gift;
  if (s.includes("dry") || s.includes("vegetable")) return Leaf;
  if (s.includes("fruit")) return Apple;
  if (s.includes("masala") || s.includes("spice") || s.includes("home")) return CookingPot;
  if (s.includes("herbal") || s.includes("herb") || s.includes("powder")) return Sprout;
  if (s.includes("oil") || s.includes("ghee")) return FlaskRound;
  if (s.includes("pickle") || s.includes("thokku")) return FlaskConical;
  if (s.includes("sweet") || s.includes("snack")) return Candy;
  if (s.includes("skin") || s.includes("hair")) return Sparkles;
  return Tag;
};

export default function Navbar() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [visible, setVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState<NavCategory[]>(() => {
    if (typeof window !== "undefined") {
      const cache = (window as any).__vivasayaCategoriesCache;
      if (cache) return cache;
    }
    return [];
  });
  const [contactEmail, setContactEmail] = useState(() => {
    if (typeof window !== "undefined") {
      const cache = (window as any).__vivasayaSettingsCache;
      if (cache?.contact_email) return String(cache.contact_email);
    }
    return "vivasayaulagam@gmail.com";
  });
  const [contactPhone, setContactPhone] = useState(() => {
    if (typeof window !== "undefined") {
      const cache = (window as any).__vivasayaSettingsCache;
      if (cache?.contact_phone) return String(cache.contact_phone);
    }
    return "+91 98765 43210";
  });
  const [mobileSearchVal, setMobileSearchVal] = useState("");
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<"categories" | "menu">("categories");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCatExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(mobileSearchVal.trim())}`);
    }
  };

  const cartItems = useCartStore((state) => state.items);
  const hasClientHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const cartCount = hasClientHydrated
    ? cartItems.reduce((acc, item) => acc + item.quantity, 0)
    : 0;
  const { data: session } = useSession();
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      if (pathname !== path) return false;
      if (typeof window !== "undefined") {
        return window.location.search.includes(query);
      }
      return false;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const activeCategories: NavCategory[] = dbCategories.length > 0 ? dbCategories : categories;

  useEffect(() => {
    async function loadDbCategories() {
      try {
        const res = await fetch(`/api/categories?t=${Date.now()}`, { cache: "no-store" });
        const data = (await res.json()) as CategoriesResponse;
        const visibleCategories = data.categories?.filter((category) => category.isVisible !== false) ?? [];
        if (data.success && visibleCategories.length > 0) {
          setDbCategories(visibleCategories);
          if (typeof window !== "undefined") {
            (window as any).__vivasayaCategoriesCache = visibleCategories;
          }
        }
      } catch {
        // Keep the static category fallback if the optional CMS request is interrupted.
      }
    }

    loadDbCategories();
  }, []);

  useEffect(() => {
    async function loadNavbarSettings() {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
        const data = (await res.json()) as SettingsResponse;
        if (data.success && data.settings) {
          setContactEmail(String(data.settings.contact_email || "vivasayaulagam@gmail.com"));
          setContactPhone(String(data.settings.contact_phone || "+91 98765 43210"));
          if (typeof window !== "undefined") {
            (window as any).__vivasayaSettingsCache = data.settings;
          }
        }
      } catch {
        // Keep fallback contact details if the optional settings request is interrupted.
      }
    }

    loadNavbarSettings();
  }, []);

  useEffect(() => {
    // Reset all temporary navigation states on route transition
    setMobileOpen(false);
    setSearchOpen(false);
    setCatDropdownOpen(false);
    setMobileCatsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 12) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      setVisible(currentScrollY < lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty("--announcement-offset", "0px");
        document.documentElement.style.setProperty("--navbar-height", `${headerRef.current.offsetHeight}px`);
      }
    };

    const timer = window.setTimeout(updateHeaderHeight, 80);
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  const accountHref = session ? "/account" : "/auth";
  const wishlistCount = 0;

  const renderCategoryDropdown = () => (
    <AnimatePresence>
      {catDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15 }}
          onMouseEnter={() => setCatDropdownOpen(true)}
          onMouseLeave={() => setCatDropdownOpen(false)}
          className="absolute left-0 right-0 top-full z-[999] w-full border-t border-[#eeeeee] bg-white px-10 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-b-2xl hidden lg:block"
        >
          <div className="mx-auto max-w-[1540px] px-10 xl:px-12 grid grid-cols-3 gap-x-12 gap-y-0">
            {activeCategories.map((cat) => (
              <Link
                key={cat.id || cat._id || cat.slug}
                href={`/categories?category=${cat.slug}`}
                onClick={() => setCatDropdownOpen(false)}
                className="mega-menu-item"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="mx-auto max-w-[1540px] px-10 xl:px-12 mt-8 flex justify-start">
            <Link
              href="/categories"
              onClick={() => setCatDropdownOpen(false)}
              className="text-[#2f7d32] text-[14px] font-semibold hover:underline flex items-center gap-1"
            >
              View all categories &rarr;
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderDesktopNavItem = (item: NavItem) => {
    const isActive = isLinkActive(item.href);
    const Icon = item.icon;
    const badgeClasses =
      item.badgeTone === "green"
        ? "bg-[#18a14a] text-white"
        : "bg-[#ff1f1f] text-white";
    const content = (
      <Link
        href={item.href}
        className={`group relative flex items-center gap-2 py-2 text-[14px] font-medium tracking-[0.01em] transition-colors duration-200 ${
          isActive ? "text-[#101010]" : "text-[#353535] hover:text-[#101010]"
        }`}
      >
        {item.badgeLabel && (
          <span
            className={`absolute -right-4 -top-2 rounded-full px-2 py-[2px] text-[10px] font-bold leading-none ${badgeClasses}`}
          >
            {item.badgeLabel}
          </span>
        )}
        {!item.hideDesktopIcon && Icon && (
          <Icon
            size={16}
            strokeWidth={1.9}
            className={item.label === "Best selling" ? "text-[#5d5d5d]" : "text-current"}
          />
        )}
        <span className="flex items-center gap-1 whitespace-nowrap">
          {item.label}
          {item.hasDropdown && !item.hideDesktopChevron && (
            <ChevronDown
              size={15}
              strokeWidth={2}
              className={`transition-transform duration-200 ${
                catDropdownOpen ? "rotate-180 text-[#101010]" : "text-[#7a7a7a] group-hover:text-[#101010]"
              }`}
            />
          )}
        </span>
      </Link>
    );

    if (!item.hasDropdown) {
      return <div key={item.label}>{content}</div>;
    }

    return (
      <div
        key={item.label}
        onMouseEnter={() => setCatDropdownOpen(true)}
        onMouseLeave={() => setCatDropdownOpen(false)}
      >
        {content}
      </div>
    );
  };


  return (
    <>
      <header
        ref={headerRef}
        className={`site-header fixed left-0 right-0 top-0 z-[999] h-[60px] lg:h-[78px] bg-white border-b border-[#ececec] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Desktop Header */}
        <div className="relative hidden h-full w-full lg:block">
          <div className="mx-auto flex h-full w-full max-w-[1540px] items-center justify-between gap-8 px-10 xl:px-12">
            <DesktopWordmark />

            <nav className="flex min-w-0 flex-1 items-center justify-center gap-8 xl:gap-10" aria-label="Primary navigation">
              {desktopNavItems.map(renderDesktopNavItem)}
            </nav>

            <div className="flex shrink-0 items-center gap-5 text-[#171717]">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search Products"
                className="cursor-pointer transition-colors duration-200 hover:text-[#d58d00]"
              >
                <Search size={19} strokeWidth={1.75} />
              </button>

              <Link
                href={accountHref}
                aria-label={session ? "Open Account" : "Login Account"}
                className="relative transition-colors duration-200 hover:text-[#111111]"
              >
                <User size={19} strokeWidth={1.8} />
              </Link>

              <Link
                href="/cart"
                aria-label="View Cart"
                className="relative transition-colors duration-200 hover:text-[#111111]"
              >
                <ShoppingBag size={19} strokeWidth={1.8} />
                <span className="absolute -right-2.5 -top-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold leading-none text-white">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tablet/Medium Screen Header (769px to 1023px) */}
        <div className="tablet-only-header relative h-full w-full px-4 lg:hidden items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation Menu"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>

          <div className="relative h-full w-[100px]">
            <LogoMedallion mobile />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search Products"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm"
            >
              <Search size={18} strokeWidth={1.8} />
            </button>
            <Link
              href="/cart"
              aria-label="View Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm"
            >
              <ShoppingBag size={18} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#3D7A1C] px-1 text-[9px] font-black leading-none text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Header (<= 768px) */}
        <div className="mobile-only-header">
          {/* Header Bar */}
          <div className="mobile-header-bar">
            {/* Left menu and logo */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open Navigation Menu"
                className="mobile-menu-btn"
              >
                <Menu size={20} strokeWidth={1.8} />
              </button>
              
              <Link
                href="/"
                aria-label="Vivasaya Ulagam Home"
                className="mobile-logo-link"
              >
                <Logo className="w-[44px] h-[44px] rounded-full object-contain" />
              </Link>
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Right icons */}
            <div className="mobile-right-icons">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search Products"
                className="mobile-right-icon-link"
              >
                <Search size={20} strokeWidth={1.8} />
              </button>
              <Link
                href="/cart"
                aria-label="View Cart"
                className="mobile-right-icon-link relative"
              >
                <ShoppingBag size={20} strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-black px-1 text-[8px] font-bold leading-none text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

        </div>
        {renderCategoryDropdown()}
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="mobile-drawer-overlay md:hidden"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="mobile-drawer-container md:hidden"
            >
              {/* ── Header: Logo + Close ── */}
              <div className="mobile-drawer-header">
                <div className="mobile-drawer-header-logo">
                  <Logo className="h-[40px] w-[40px] rounded-full object-contain" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#163D14]">Vivasaya</span>
                    <span className="text-[15px] font-extrabold text-[#3D7A1C]">Ulagam</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="mobile-drawer-close-btn"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* ── Menu List ── */}
              <div
                className="mobile-drawer-content"
                style={{ paddingTop: 0, paddingBottom: "env(safe-area-inset-bottom)" }}
              >
                {[
                  { label: "Home", href: "/", icon: Home },
                  { label: "All Categories", href: "/categories", icon: LayoutGrid },
                  { label: "About Us", href: "/about-us", icon: Info },
                  { label: "Track Order", href: "/track-order", icon: Truck },
                  { label: session ? "My Account" : "Login / Register", href: accountHref, icon: User },
                  { label: "Cart", href: "/cart", icon: ShoppingBag, badge: cartCount },
                  { label: "Contact Us", href: "/contact", icon: Phone },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = "action" in item ? false : isLinkActive(item.href);
                  const isLast = idx === 6; // no divider after last

                  const inner = (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        background: isActive ? "#f2fbf1" : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            width: "22px",
                            flexShrink: 0,
                          }}
                        >
                          <Icon
                            size={20}
                            strokeWidth={1.8}
                            color={isActive ? "#2f9e24" : "#6b7280"}
                          />
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "15px",
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#2f9e24" : "#111111",
                          }}
                        >
                          {item.label}
                        </span>
                        {"badge" in item && item.badge !== undefined && item.badge > 0 && (
                          <span
                            style={{
                              background: "#2f9e24",
                              color: "#fff",
                              borderRadius: "999px",
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "1px 7px",
                              lineHeight: "16px",
                              display: "inline-block",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span style={{ color: isActive ? "#2f9e24" : "#c4c4c4", lineHeight: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </div>
                  );

                  return (
                    <div
                      key={item.label}
                      style={{ borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}
                    >
                      {"action" in item ? (
                        <button
                          type="button"
                          onClick={(item as any).action}
                          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", display: "block" }}
                        >
                          {inner}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          style={{ display: "block", textDecoration: "none" }}
                        >
                          {inner}
                        </Link>
                      )}
                    </div>
                  );
                })}

                {/* WhatsApp / Contact quick-action */}
                {contactPhone && (
                  <a
                    href={`https://wa.me/${contactPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      textDecoration: "none",
                      borderTop: "1px solid #f3f4f6",
                      marginTop: "4px",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", width: "22px", flexShrink: 0 }}>
                      {/* WhatsApp SVG icon */}
                      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#25D366"/>
                        <path d="M22.9 9.1A9.66 9.66 0 0 0 16 6.4C10.7 6.4 6.4 10.7 6.4 16c0 1.7.44 3.3 1.28 4.74L6.4 25.6l5.02-1.28A9.6 9.6 0 0 0 16 25.6c5.3 0 9.6-4.3 9.6-9.6 0-2.57-1-4.97-2.7-6.9zm-6.9 14.76a7.97 7.97 0 0 1-4.07-1.12l-.29-.17-3 .78.8-2.9-.2-.3a7.97 7.97 0 0 1-1.23-4.25c0-4.4 3.58-7.98 7.99-7.98 2.13 0 4.14.83 5.65 2.34a7.94 7.94 0 0 1 2.34 5.65c0 4.4-3.57 7.95-7.99 7.95zm4.38-5.97c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06a6.55 6.55 0 0 1-3.28-2.88c-.25-.42.25-.39.7-1.3.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3s-.84.82-.84 2 .86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" fill="#fff"/>
                      </svg>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#25D366",
                      }}
                    >
                      WhatsApp Us
                    </span>
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      <SearchDrawer isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="mobile-bottom-bar" role="navigation" aria-label="Mobile quick navigation">
        {[
          { icon: Home, label: "Home", href: "/" },
          { icon: Store, label: "Shop", href: "/shop" },
          { icon: ShoppingBag, label: "Cart", href: "/cart" },
          { icon: User, label: "Account", href: accountHref },
        ].map(({ icon, label, href }) => {
          const Icon = icon as any;
          const isActive = isLinkActive(href);
          return (
            <Link
              key={label}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 px-3 transition-colors ${
                isActive ? "text-[#3D7A1C]" : "text-[#777777] hover:text-[#3D7A1C]"
              }`}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span className="text-[10px] font-semibold">{label}</span>
              {label === "Cart" && cartCount > 0 && (
                <span className="absolute right-3 top-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#3D7A1C] px-1 text-[8px] font-bold leading-none text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Mobile Categories Bottom Sheet */}
      <AnimatePresence>
        {mobileCatsOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCatsOpen(false)}
              className="fixed inset-0 z-[1050] bg-black/40 backdrop-blur-[2px] md:hidden"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-[1060] bg-white rounded-t-[20px] p-5 max-h-[80vh] overflow-y-auto flex flex-col font-body md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-[18px] font-bold text-[#142D16]">
                  All Categories
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileCatsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-black border-0 cursor-pointer p-0"
                  aria-label="Close categories"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Category list */}
              <div className="flex-1 overflow-y-auto py-2">
                <div className="flex flex-col">
                  {activeCategories.map((cat) => (
                    <Link
                      key={cat.id || cat._id || cat.slug}
                      href={`/categories?category=${cat.slug}`}
                      onClick={() => setMobileCatsOpen(false)}
                      className="mobile-category-item"
                    >
                      <span>{cat.name}</span>
                      <span className="text-gray-400 font-light">&rarr;</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
