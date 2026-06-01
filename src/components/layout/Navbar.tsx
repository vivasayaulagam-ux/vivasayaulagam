"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  Home,
  LayoutGrid,
  Leaf,
  LogOut,
  Mail,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
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
  icon: LucideIcon;
  active?: boolean;
  hasDropdown?: boolean;
};

const leftNavItems: NavItem[] = [
  { label: "HOME", href: "/", icon: Home, active: true },
  { label: "SHOP", href: "/shop", icon: ShoppingBag },
  { label: "CATEGORIES", href: "/categories", icon: LayoutGrid, hasDropdown: true },
  { label: "OFFERS", href: "/shop?category=combo", icon: Sparkles },
];

const rightNavItems: NavItem[] = [
  { label: "ABOUT US", href: "/about", icon: User },
  { label: "BLOG", href: "/pages/blog", icon: BookOpen },
  { label: "CONTACT", href: "/contact", icon: Phone },
];

const drawerLinks: NavItem[] = [...leftNavItems, ...rightNavItems];

function FarmLandscape() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-[46px] w-full text-[#163D14]"
      viewBox="0 0 1440 130"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="fieldFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3D7A1C" stopOpacity="0" />
          <stop offset="1" stopColor="#3D7A1C" stopOpacity="0.11" />
        </linearGradient>
      </defs>
      <rect width="1440" height="130" fill="url(#fieldFade)" />
      <path
        d="M0 82 C130 44 230 72 360 46 C465 25 548 62 640 44 C783 16 884 72 1008 44 C1160 10 1262 70 1440 42"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.11"
        strokeWidth="2"
      />
      <path
        d="M0 103 C130 90 221 110 342 92 C458 75 523 112 639 91 C766 68 864 108 1000 88 C1154 65 1284 94 1440 75"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="2"
      />
      <g stroke="currentColor" strokeOpacity="0.11" strokeWidth="1.35" fill="none">
        {Array.from({ length: 18 }).map((_, index) => {
          const x = index * 86;
          return <path key={x} d={`M${x} 128 C${x + 38} 104 ${x + 58} 94 ${x + 98} 82`} />;
        })}
      </g>
      <g stroke="currentColor" strokeOpacity="0.16" strokeWidth="1.4" fill="none">
        <path d="M79 110 V62 M79 64 C54 50 50 36 38 23 M80 64 C99 50 110 35 124 19 M80 70 C63 65 47 63 30 58 M81 71 C99 66 116 63 134 58" />
        <path d="M1312 108 V61 M1312 63 C1288 51 1283 36 1271 24 M1313 63 C1334 49 1342 35 1358 17 M1313 70 C1294 66 1278 64 1262 59 M1314 70 C1334 66 1351 64 1371 58" />
        <path d="M1188 115 V78 M1188 78 C1171 69 1165 58 1158 46 M1189 78 C1205 69 1212 58 1220 45" />
        <path d="M214 116 V80 M214 80 C199 71 193 60 186 48 M215 80 C231 70 237 60 245 48" />
      </g>
      <g fill="currentColor" opacity="0.09">
        <circle cx="560" cy="77" r="3" />
        <circle cx="903" cy="70" r="2.6" />
        <circle cx="1004" cy="81" r="2.2" />
        <circle cx="376" cy="76" r="2.4" />
      </g>
    </svg>
  );
}

function CenterWave() {
  return (
    <svg
      aria-hidden="true"
      className="absolute left-1/2 top-[42px] z-[1] hidden h-[58px] w-[470px] -translate-x-1/2 lg:block"
      viewBox="0 0 580 92"
      preserveAspectRatio="none"
    >
      <path
        d="M0 11 C82 12 137 19 194 49 C229 68 256 82 290 82 C324 82 351 68 386 49 C443 19 498 12 580 11 L580 0 L0 0 Z"
        fill="#f8f8f5"
      />
      <path
        d="M24 30 C115 30 167 34 220 57 C248 69 270 76 290 76 C310 76 332 69 360 57 C413 34 465 30 556 30"
        fill="none"
        stroke="#3D7A1C"
        strokeLinecap="round"
        strokeWidth="6"
        opacity="0.92"
      />
      <path
        d="M38 38 C130 37 180 43 230 62 C254 71 273 76 290 76 C307 76 326 71 350 62 C400 43 450 37 542 38"
        fill="none"
        stroke="#79D420"
        strokeLinecap="round"
        strokeWidth="2.2"
        opacity="0.42"
      />
    </svg>
  );
}

function LogoMedallion({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Vivasaya Ulagam Home"
      className={`organic-logo-medallion group absolute left-1/2 z-20 -translate-x-1/2 rounded-full ${
        mobile
          ? "top-[7px] h-[58px] w-[58px]"
          : "top-[-6px] h-[86px] w-[86px] xl:h-[96px] xl:w-[96px]"
      }`}
    >
      <span className="absolute -inset-4 rounded-full bg-white/40 blur-2xl transition-opacity duration-300 group-hover:opacity-90" />
      <span className="absolute inset-0 rounded-full bg-white border-2 border-[#1F6B3B]/15 shadow-[0_24px_52px_-25px_rgba(22,61,20,0.4)]">
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-[inset_0_0_20px_rgba(31,107,59,0.05)]">
          <Logo
            className={
              mobile
                ? "h-[46px] w-[46px] rounded-full object-contain"
                : "h-[70px] w-[70px] xl:h-[78px] xl:w-[78px] rounded-full object-contain"
            }
          />
        </span>
      </span>
      {!mobile && (
        <span className="absolute -bottom-2 left-1/2 h-[12px] w-[64px] -translate-x-1/2 rounded-full bg-[#163D14]/15 blur-[7px]" />
      )}
    </Link>
  );
}

function FloatingLeaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 hidden lg:block">
      <Leaf className="organic-leaf-float absolute left-[39%] top-[-10px] h-7 w-7 -rotate-12 fill-[#3D7A1C]/45 text-[#3D7A1C]/70" strokeWidth={1.6} />
      <Leaf className="organic-leaf-float organic-leaf-delay absolute right-[38%] top-[7px] h-5 w-5 rotate-45 fill-[#79D420]/45 text-[#3D7A1C]/70" strokeWidth={1.6} />
      <Leaf className="organic-leaf-float organic-leaf-slow absolute left-[46%] top-[88px] h-4 w-4 rotate-12 fill-[#3D7A1C]/35 text-[#3D7A1C]/55" strokeWidth={1.6} />
      <Leaf className="organic-leaf-float organic-leaf-delay absolute right-[9%] top-[-5px] h-8 w-8 rotate-45 fill-[#79D420]/35 text-[#3D7A1C]/70" strokeWidth={1.4} />
    </div>
  );
}

export default function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState<NavCategory[]>([]);
  const [contactEmail, setContactEmail] = useState("crazyboyajith743@gmail.com");
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");

  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { data: session } = useSession();

  const activeCategories: NavCategory[] = dbCategories.length > 0 ? dbCategories : categories;

  useEffect(() => {
    async function loadDbCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = (await res.json()) as CategoriesResponse;
        const visibleCategories = data.categories?.filter((category) => category.isVisible !== false) ?? [];
        if (data.success && visibleCategories.length > 0) {
          setDbCategories(visibleCategories);
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
        const res = await fetch("/api/settings");
        const data = (await res.json()) as SettingsResponse;
        if (data.success && data.settings) {
          setContactEmail(String(data.settings.contact_email || "crazyboyajith743@gmail.com"));
          setContactPhone(String(data.settings.contact_phone || "+91 98765 43210"));
        }
      } catch {
        // Keep fallback contact details if the optional settings request is interrupted.
      }
    }

    loadNavbarSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 12) {
        setVisible(true);
        setScrolled(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      setVisible(currentScrollY < lastScrollY.current);
      setScrolled(currentScrollY > 10);
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

  const renderCategoryDropdown = () => (
    <AnimatePresence>
      {catDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-1/2 top-[calc(100%+14px)] z-50 w-[760px] -translate-x-1/2 rounded-[24px] border border-[#3D7A1C]/10 bg-[#fffffb]/98 p-5 shadow-[0_28px_80px_-36px_rgba(22,61,20,0.55)] backdrop-blur-xl"
        >
          <div className="grid grid-cols-3 gap-3">
            {activeCategories.slice(0, 9).map((cat) => (
              <Link
                key={cat.id || cat._id || cat.slug}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setCatDropdownOpen(false)}
                className="group flex items-center gap-3 rounded-2xl border border-[#163D14]/8 bg-white/70 px-3.5 py-3 text-[12px] font-semibold text-[#263024] shadow-[0_10px_24px_-22px_rgba(22,61,20,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D7A1C]/30 hover:bg-[#F7F6F1] hover:text-[#3D7A1C]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3D7A1C]/10 text-[#3D7A1C] transition-colors group-hover:bg-[#3D7A1C] group-hover:text-white">
                  <Leaf size={17} strokeWidth={1.8} />
                </span>
                <span className="leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
          <Link
            href="/categories"
            onClick={() => setCatDropdownOpen(false)}
            className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#163D14] text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#3D7A1C]"
          >
            View All Categories
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const content = (
      <Link
        href={item.href}
        className={`group relative flex min-w-[58px] flex-col items-center justify-center gap-1 py-2 text-[10.5px] font-bold uppercase leading-none tracking-[0.02em] transition-colors duration-200 ${
          item.active ? "text-[#3D7A1C]" : "text-[#1E1E1E] hover:text-[#3D7A1C]"
        }`}
      >
        <Icon
          size={21}
          strokeWidth={1.65}
          className={`transition-all duration-200 ${item.active ? "text-[#3D7A1C]" : "text-[#141414] group-hover:-translate-y-0.5 group-hover:text-[#3D7A1C]"}`}
        />
        <span className="flex items-center gap-1 whitespace-nowrap">
          {item.label}
          {item.hasDropdown && <ChevronDown size={12} strokeWidth={2.2} className={catDropdownOpen ? "rotate-180 transition-transform" : "transition-transform"} />}
        </span>
        <span
          className={`absolute bottom-[2px] h-[2px] rounded-full bg-[#3D7A1C] transition-all duration-300 ${
            item.active ? "w-7" : "w-0 group-hover:w-7"
          }`}
        />
      </Link>
    );

    if (!item.hasDropdown) {
      return <div key={item.label}>{content}</div>;
    }

    return (
      <div
        key={item.label}
        className="relative"
        onMouseEnter={() => setCatDropdownOpen(true)}
        onMouseLeave={() => setCatDropdownOpen(false)}
      >
        {content}
        {renderCategoryDropdown()}
      </div>
    );
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes organicLeafDrift {
              0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--leaf-rotate, 0deg)); }
              50% { transform: translate3d(8px, 9px, 0) rotate(calc(var(--leaf-rotate, 0deg) + 10deg)); }
            }
            .organic-leaf-float { --leaf-rotate: -12deg; animation: organicLeafDrift 5.5s ease-in-out infinite; }
            .organic-leaf-delay { animation-delay: 1.4s; }
            .organic-leaf-slow { animation-duration: 7s; }
          `,
        }}
      />

      <header
        ref={headerRef}
        className={`site-header fixed left-0 right-0 top-0 z-[999] h-[84px] bg-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:h-[96px] ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="relative hidden h-full w-full px-5 pt-3 lg:block xl:px-7">
          <div
            className={`relative mx-auto h-[76px] w-full max-w-[1510px] overflow-visible rounded-[28px] border border-white/90 bg-[#f8f8f5]/95 shadow-[0_22px_58px_-42px_rgba(22,61,20,0.58),0_8px_24px_-23px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all duration-300 ${
              scrolled ? "shadow-[0_20px_56px_-40px_rgba(22,61,20,0.7),inset_0_1px_0_rgba(255,255,255,0.92)]" : ""
            }`}
          >
            <FarmLandscape />
            <CenterWave />
            <FloatingLeaves />

            <div className="relative z-10 grid h-[60px] grid-cols-[minmax(0,1fr)_142px_minmax(0,1fr)] items-center px-6 xl:grid-cols-[minmax(0,1fr)_170px_minmax(0,1fr)] xl:px-9 2xl:px-12">
              <nav className="flex items-center justify-end gap-4 xl:gap-7 2xl:gap-10" aria-label="Primary navigation left">
                {leftNavItems.map(renderNavItem)}
              </nav>

              <div className="relative h-full" aria-hidden="true" />

              <div className="flex items-center justify-start gap-4 xl:gap-7 2xl:gap-9">
                <nav className="flex items-center gap-4 xl:gap-7 2xl:gap-10" aria-label="Primary navigation right">
                  {rightNavItems.map(renderNavItem)}
                </nav>

                <div className="h-9 w-px bg-[#163D14]/12" aria-hidden="true" />

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search Products"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#163D14]/12 bg-white/55 text-[#101510] shadow-[0_12px_22px_-20px_rgba(22,61,20,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D7A1C]/35 hover:text-[#3D7A1C]"
                  >
                    <Search size={21} strokeWidth={1.65} />
                  </button>

                  <div
                    className="relative"
                    onMouseEnter={() => setUserMenuOpen(true)}
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <Link
                      href={accountHref}
                      aria-label={session ? "Open Account" : "Login Account"}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#163D14]/12 bg-white/55 text-[#101510] shadow-[0_12px_22px_-20px_rgba(22,61,20,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D7A1C]/35 hover:text-[#3D7A1C]"
                    >
                      <User size={21} strokeWidth={1.65} />
                    </Link>

                    <AnimatePresence>
                      {session && userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute right-0 top-[calc(100%+12px)] z-50 w-52 rounded-2xl border border-[#3D7A1C]/10 bg-white p-2.5 text-[#1E1E1E] shadow-[0_24px_70px_-34px_rgba(22,61,20,0.45)]"
                        >
                          <Link href="/account" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold hover:bg-[#F7F6F1] hover:text-[#3D7A1C]">
                            <User size={15} strokeWidth={2} /> My Account
                          </Link>
                          {(session.user as { role?: string } | undefined)?.role === "admin" && (
                            <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold hover:bg-[#F7F6F1] hover:text-[#3D7A1C]">
                              <LayoutGrid size={15} strokeWidth={2} /> Admin Panel
                            </Link>
                          )}
                          <div className="my-1.5 h-px bg-[#163D14]/10" />
                          <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            <LogOut size={15} strokeWidth={2} /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link
                    href="/cart"
                    aria-label="View Cart"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#163D14]/12 bg-white/55 text-[#101510] shadow-[0_12px_22px_-20px_rgba(22,61,20,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D7A1C]/35 hover:text-[#3D7A1C]"
                  >
                    <ShoppingBag size={21} strokeWidth={1.65} />
                    <AnimatePresence mode="popLayout">
                      {cartCount > 0 && (
                        <motion.span
                          key={cartCount}
                          initial={{ opacity: 0, scale: 0.5, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5, y: -4 }}
                          className="absolute -right-1 -top-2 flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#3D7A1C] px-1 text-[10px] font-black leading-none text-white shadow-[0_8px_16px_-9px_rgba(22,61,20,0.85)]"
                        >
                          {cartCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </div>
              </div>
            </div>

            <LogoMedallion />
          </div>
        </div>

        <div className="relative h-full px-3 pt-2.5 lg:hidden">
          <div className="relative mx-auto h-[68px] overflow-hidden rounded-[22px] border border-white/90 bg-[#f8f8f5]/96 px-4 shadow-[0_16px_46px_-34px_rgba(22,61,20,0.65)] backdrop-blur-xl">
            <FarmLandscape />
            <div className="relative z-10 flex h-full items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open Navigation Menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#163D14]/12 bg-white/70 text-[#1E1E1E] shadow-[0_10px_22px_-18px_rgba(22,61,20,0.55)]"
              >
                <Menu size={21} strokeWidth={1.8} />
              </button>

              <LogoMedallion mobile />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search Products"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#163D14]/12 bg-white/70 text-[#1E1E1E] shadow-[0_10px_22px_-18px_rgba(22,61,20,0.55)]"
                >
                  <Search size={20} strokeWidth={1.8} />
                </button>
                <Link
                  href="/cart"
                  aria-label="View Cart"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#163D14]/12 bg-white/70 text-[#1E1E1E] shadow-[0_10px_22px_-18px_rgba(22,61,20,0.55)]"
                >
                  <ShoppingBag size={20} strokeWidth={1.8} />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#3D7A1C] px-1 text-[9px] font-black leading-none text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[1050] bg-[#071709]/45 backdrop-blur-[5px]"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 z-[1060] flex h-full w-[min(90vw,24rem)] flex-col overflow-hidden border-l border-[#3D7A1C]/10 bg-[#FBFAF5] shadow-[0_26px_80px_-28px_rgba(0,0,0,0.42)]"
            >
              <div className="relative flex min-h-[118px] items-center justify-between overflow-hidden border-b border-[#163D14]/10 px-5">
                <FarmLandscape />
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="relative z-10 flex items-center gap-3"
                  aria-label="Vivasaya Ulagam Home"
                >
                  <span className="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full border-2 border-[#1F6B3B]/15 bg-white shadow-sm">
                    <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                      <Logo className="h-[48px] w-[48px] rounded-full object-contain" />
                    </span>
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[12px] font-black uppercase tracking-[0.18em] text-[#163D14]">Vivasaya</span>
                    <span className="text-[19px] font-extrabold text-[#3D7A1C]">Ulagam</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close Navigation Menu"
                  className="relative z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#163D14]/10 bg-white text-[#1E1E1E] shadow-sm"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-5" aria-label="Mobile navigation">
                <div className="grid gap-2">
                  {drawerLinks.map(({ icon: Icon, label, href, active }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-[13px] font-extrabold uppercase tracking-[0.08em] transition-colors ${
                        active
                          ? "border-[#3D7A1C]/25 bg-[#3D7A1C]/10 text-[#3D7A1C]"
                          : "border-[#163D14]/8 bg-white/64 text-[#1E1E1E] hover:border-[#3D7A1C]/25 hover:text-[#3D7A1C]"
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      {label}
                    </Link>
                  ))}
                </div>

                <div className="mt-6 border-t border-[#163D14]/10 pt-5">
                  <p className="mb-3 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#66715f]">
                    Shop by Category
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {activeCategories.slice(0, 6).map((cat) => (
                      <Link
                        key={cat.id || cat._id || cat.slug}
                        href={`/shop?category=${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 rounded-2xl border border-[#163D14]/8 bg-white/70 p-3 text-[11px] font-bold leading-tight text-[#263024] hover:border-[#3D7A1C]/25 hover:text-[#3D7A1C]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D7A1C]/10 text-[#3D7A1C]">
                          <Leaf size={15} strokeWidth={1.8} />
                        </span>
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>

              <div className="space-y-3 border-t border-[#163D14]/10 bg-white/62 p-5">
                <div className="grid gap-1.5 text-[11px] font-semibold text-[#66715f]">
                  {contactPhone && (
                    <span className="flex items-center gap-2">
                      <Phone size={13} strokeWidth={1.8} /> {contactPhone}
                    </span>
                  )}
                  {contactEmail && (
                    <span className="flex items-center gap-2 break-all">
                      <Mail size={13} strokeWidth={1.8} /> {contactEmail}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href={accountHref}
                    onClick={() => setMobileOpen(false)}
                    className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#163D14]/12 bg-white text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#1E1E1E]"
                  >
                    <User size={16} strokeWidth={1.8} /> Account
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#3D7A1C] text-[12px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_14px_28px_-18px_rgba(22,61,20,0.8)]"
                  >
                    <ShoppingBag size={16} strokeWidth={1.8} /> Cart ({cartCount})
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchDrawer isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="mobile-bottom-bar" role="navigation" aria-label="Mobile quick navigation">
        {[
          { icon: Home, label: "Home", href: "/" },
          { icon: LayoutGrid, label: "Categories", href: "/categories" },
          { icon: ShoppingBag, label: "Cart", href: "/cart" },
          { icon: User, label: "Account", href: accountHref },
        ].map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="relative flex flex-col items-center gap-0.5 px-3 text-text-muted transition-colors hover:text-primary"
            aria-label={label}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold">{label}</span>
            {label === "Cart" && cartCount > 0 && (
              <span className="absolute right-3 top-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold leading-none text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                {cartCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
