"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Users,
  BarChart2, Settings, FileText, LogOut, Store,
  Layers, Image, Tag, Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/admin",            icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products",   icon: Package,         label: "Products" },
  { href: "/admin/categories", icon: Tag,             label: "Categories" },
  { href: "/admin/orders",     icon: ShoppingBag,     label: "Orders" },
  { href: "/admin/customers",  icon: Users,           label: "Customers" },
  { href: "/admin/pages",      icon: FileText,        label: "Pages" },
  { href: "/admin/cms",        icon: Layers,          label: "Theme Customizer" },
  { href: "/admin/media",      icon: Image,           label: "Media" },
  { href: "/admin/settings",   icon: Settings,        label: "Settings" },
];

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
      router.push("/admin/login");
    } catch (err) {
      console.error(err);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1F6B3B] flex items-center justify-center shadow-sm">
            <Store size={16} strokeWidth={1.75} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-gray-800 leading-none">Vivasaya</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-250 ease-in-out group ${
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} className={`transition-all duration-250 shrink-0 ${isActive ? "text-[#1F6B3B]" : "text-gray-400 group-hover:text-[#1F6B3B] group-hover:scale-105"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#e5e5e5] space-y-0.5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-gray-500 text-[13px] font-medium hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all duration-250 ease-in-out group border-0 bg-transparent cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.75} className="text-gray-400 group-hover:text-red-500 group-hover:scale-105 transition-all duration-250 shrink-0" />
          Logout Admin
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-gray-500 text-[13px] font-medium hover:bg-gray-100 hover:text-gray-800 transition-all duration-250 ease-in-out group mt-1"
        >
          <Store size={18} strokeWidth={1.75} className="text-gray-400 group-hover:text-gray-600 group-hover:scale-105 transition-all duration-250 shrink-0" />
          Back to Store
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#efefef] border-b border-[#e5e5e5] z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1F6B3B] flex items-center justify-center shadow-sm">
            <Store size={14} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-xs font-bold text-gray-800">Admin Panel</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 -mr-2 bg-transparent border-0 cursor-pointer">
          <Menu size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-[240px] shrink-0 flex-col fixed top-0 left-0 h-screen z-30"
        style={{ background: "#efefef", borderRight: "1px solid #e5e5e5" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="md:hidden fixed top-0 left-0 h-screen w-[260px] bg-[#efefef] flex flex-col z-50 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-white rounded-full shadow-sm border-0 cursor-pointer"
              >
                <X size={18} className="text-gray-500" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
