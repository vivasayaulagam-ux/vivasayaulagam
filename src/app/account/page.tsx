"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  Heart,
  Home,
  Lock,
  LogOut,
  Loader2,
  Menu,
  Package,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type TabId = "orders" | "personal" | "password" | "addresses";
type MenuId = TabId | "logout";

interface LocalAccountMenuItem {
  id: MenuId;
  label: string;
  icon: LucideIcon;
}

interface LocalOrderThumbnail {
  src: string;
  alt: string;
}

interface LocalAccountOrder {
  id: string;
  dateLabel: "Shipped date" | "Order date";
  date: string;
  total: string;
  status: string;
  statusTone: "success" | "warning" | "muted";
  action: "VIEW ORDER" | "TRACK ORDER";
  secondaryAction?: string;
  secondaryTone?: "default" | "danger";
  images: LocalOrderThumbnail[];
}

interface LocalAddress {
  _id: string;
  label: string;
  line1: string;
  line2: string;
}

const MENU_ITEMS: LocalAccountMenuItem[] = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "personal", label: "Personal data", icon: User },
  { id: "password", label: "Change password", icon: Lock },
  { id: "addresses", label: "Addresses", icon: Home },
  { id: "logout", label: "Sign out", icon: LogOut },
];

const statusToneClass: Record<LocalAccountOrder["statusTone"], string> = {
  success: "text-[#64ad7d]",
  warning: "text-[#e1a84b]",
  muted: "text-[#c9c9c9]",
};

export default function MyAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const cartCount = useCartStore((state) => (state.hasHydrated ? state.totalItems() : 0));
  const [activeTab, setActiveTab] = useState<TabId>("orders");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Real Database States
  const [orders, setOrders] = useState<LocalAccountOrder[]>([]);
  const [addresses, setAddresses] = useState<LocalAddress[]>([]);
  const [profile, setProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    phone: "",
  });

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Address modal form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState("");
  const [newAddrLine1, setNewAddrLine1] = useState("");
  const [newAddrLine2, setNewAddrLine2] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?callbackUrl=/account");
    }
  }, [router, status]);

  // Load User Data
  useEffect(() => {
    if (status !== "authenticated") return;

    // Fetch user profile
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setProfile({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          });
        }
      })
      .catch(err => console.error("Failed to load profile", err))
      .finally(() => setLoadingProfile(false));

    // Fetch user addresses
    fetch('/api/user/addresses')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.addresses) {
          setAddresses(data.addresses);
        }
      })
      .catch(err => console.error("Failed to load addresses", err))
      .finally(() => setLoadingAddresses(false));

    // Fetch user orders
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.orders) {
          const mapped: LocalAccountOrder[] = data.orders.map((o: any) => {
            const formattedDate = new Date(o.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            const firstImg = o.items?.[0]?.image || "🌿";
            return {
              id: o._id,
              dateLabel: "Order date",
              date: formattedDate,
              total: `₹${Number(o.totalAmount || 0).toFixed(2)}`,
              status: o.status || "processing",
              statusTone: o.status === 'delivered' ? 'success' : o.status === 'pending' ? 'muted' : 'warning',
              action: o.status === 'pending' ? 'TRACK ORDER' : 'VIEW ORDER',
              secondaryAction: o.status === 'pending' ? 'Cancel order' : undefined,
              secondaryTone: 'danger',
              images: (o.items || []).map((itm: any) => ({
                src: itm.image || "/logo.png",
                alt: itm.name || "Product Item"
              }))
            };
          });
          setOrders(mapped);
        }
      })
      .catch(err => console.error("Failed to load orders", err))
      .finally(() => setLoadingOrders(false));

    // Favorites/Wishlist is disabled
  }, [status]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      useCartStore.getState().clearCart();
      signOut({ callbackUrl: "/" });
    }
  };

  const handleMenuClick = (id: MenuId) => {
    if (id === "logout") {
      handleLogout();
      return;
    }
    setActiveTab(id);
  };

  // removeFavorite logic removed

  const handleSaveProfile = async (updatedProfile: typeof profile) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedProfile.name,
          phone: updatedProfile.phone
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(updatedProfile);
        showToast("success", "Personal data updated successfully.");
      } else {
        showToast("error", data.error || "Failed to update profile.");
      }
    } catch {
      showToast("error", "Network connection failed.");
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLabel || !newAddrLine1) {
      showToast("error", "Label and Address Line 1 are required.");
      return;
    }
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newAddrLabel,
          line1: newAddrLine1,
          line2: newAddrLine2
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses);
        setShowAddressForm(false);
        setNewAddrLabel("");
        setNewAddrLine1("");
        setNewAddrLine2("");
        showToast("success", "Address added successfully!");
      } else {
        showToast("error", data.error || "Failed to add address.");
      }
    } catch {
      showToast("error", "Failed to connect to server.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses);
        showToast("success", "Address deleted successfully.");
      } else {
        showToast("error", data.error || "Failed to delete address.");
      }
    } catch {
      showToast("error", "Failed to connect to server.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center text-sm font-bold text-black font-body">
        <Loader2 className="animate-spin text-primary mr-2" size={20} /> Loading account...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div
        className="site-main account-reference-page min-h-screen bg-[#FAF9F5] px-0 lg:px-12 py-4 lg:py-12 pb-[100px] lg:pb-12"
      >
        <div className="account-shell mx-auto w-full max-w-[1170px] mt-6">
          <h1 className="account-desktop-title mb-6 text-[22px] font-bold leading-none tracking-tight text-black font-heading px-4 lg:px-0">
            My Account
          </h1>

          <div className="account-reference-layout flex flex-col lg:grid items-start gap-[24px] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 px-4 lg:px-0">
            {/* Sidebar Navigation */}
            <aside className="account-sidebar w-full lg:w-[300px] bg-white border border-[#e5e5e5] lg:border-gray-150 rounded-[14px] lg:rounded-2xl p-[14px] lg:p-5 shadow-[0_4px_14px_rgba(0,0,0,0.06)] lg:shadow-sm">
              <p className="account-welcome mb-5 lg:mb-6 text-sm font-bold leading-none text-[#111111] font-body">
                Welcome, {profile.name || session.user?.name}
              </p>

              <nav aria-label="Account menu" className="account-menu flex flex-col gap-0 lg:gap-1.5">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMenuClick(item.id)}
                      className={`account-menu-button flex w-full items-center justify-between border-0 rounded-none lg:rounded-xl text-left transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#2f9e24] lg:bg-primary text-white font-bold"
                          : "bg-white lg:bg-transparent text-[#111111] lg:text-gray-700 hover:bg-gray-50"
                      } ${
                        "h-11 lg:h-14 px-3 lg:px-4 border-b border-[#eeeeee] lg:border-b-0 last:border-b-0"
                      }`}
                    >
                      <span className="account-menu-inner flex items-center gap-3 lg:gap-4">
                        <Icon 
                          size={18} 
                          strokeWidth={isActive ? 2.5 : 1.75} 
                          className={isActive ? "text-white" : "text-gray-400 lg:text-gray-500"}
                          aria-hidden="true" 
                        />
                        <span className="account-menu-label text-xs font-bold">
                          {item.label}
                        </span>
                      </span>
                      <ChevronRight
                        className={`transition-colors ${isActive ? "text-white" : "text-gray-400"}`}
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main Tabs Panel Content */}
            <div className="account-content w-full min-h-[580px] bg-transparent lg:bg-white border-0 lg:border border-gray-150 rounded-none lg:rounded-2xl p-0 lg:p-6 shadow-none lg:shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                >
                  {activeTab === "orders" && (
                    <OrdersPanel
                      orders={orders}
                      loading={loadingOrders}
                      onAction={(orderId, actionType) => {
                        if (actionType === "Cancel order") {
                          if (confirm("Are you sure you want to cancel this order?")) {
                            showToast("success", `Cancel request submitted for order #${orderId}`);
                          }
                        } else if (actionType === "TRACK ORDER") {
                          router.push(`/track-order?orderId=${orderId}`);
                        } else {
                          router.push(`/orders/${orderId}`);
                        }
                      }}
                    />
                  )}

                  {activeTab === "personal" && (
                    <PersonalDataPanel
                      profile={profile}
                      loading={loadingProfile}
                      onSave={handleSaveProfile}
                    />
                  )}

                  {activeTab === "password" && (
                    <PasswordPanel onSave={() => showToast("success", "Password changed successfully.")} />
                  )}

                  {activeTab === "addresses" && (
                    <AddressesPanel
                      addresses={addresses}
                      loading={loadingAddresses}
                      onAdd={() => setShowAddressForm(true)}
                      onDelete={handleDeleteAddress}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Floating Address Add Form Modal */}
        <AnimatePresence>
          {showAddressForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 font-body"
              >
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-black border-0 bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
                <h3 className="font-heading font-bold text-lg text-black mb-4">Add New Address</h3>
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Address Label (e.g. Home, Work) *</label>
                    <input
                      type="text"
                      required
                      value={newAddrLabel}
                      onChange={e => setNewAddrLabel(e.target.value)}
                      placeholder="Home / Work / Office"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={newAddrLine1}
                      onChange={e => setNewAddrLine1(e.target.value)}
                      placeholder="Street address, P.O. Box"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={newAddrLine2}
                      onChange={e => setNewAddrLine2(e.target.value)}
                      placeholder="Apartment, suite, unit, building"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-primary"
                    />
                  </div>
                   <button
                    type="submit"
                    className="w-full bg-[#34a121] hover:bg-[#28801a] text-white py-2.5 rounded-lg font-bold tracking-wider text-xs border-0 cursor-pointer transition-colors shadow-sm"
                  >
                    ADD ADDRESS
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Alert Popups */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -12, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -12, x: "-50%" }}
              className={`fixed left-1/2 top-8 z-[1100] flex items-center gap-2 border px-5 py-3 text-[12px] font-bold shadow-lg ${
                toast.type === "success"
                  ? "border-[#cfe9d8] bg-white text-[#4f9d68]"
                  : "border-[#f0c3c3] bg-white text-[#c94f4f]"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <AlertCircle size={16} aria-hidden="true" />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
}

const renderStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "shipped") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-200 leading-none">
        Shipped
      </span>
    );
  }
  if (s === "delivered") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-200 leading-none">
        Delivered
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-200 leading-none">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-50 text-gray-600 border border-gray-200 leading-none">
      {status}
    </span>
  );
};

function OrdersPanel({
  orders,
  loading,
  onAction,
}: {
  orders: LocalAccountOrder[];
  loading: boolean;
  onAction: (orderId: string, actionType: "VIEW ORDER" | "TRACK ORDER" | "Cancel order") => void;
}) {
  if (loading) return <div className="text-center py-10 text-gray-500 font-bold">Loading orders...</div>;
  if (orders.length === 0) return <EmptyPanel title="No orders yet" description="Orders you place will appear here." />;

  return (
    <div>
      <h2 className="mb-6 text-[22px] font-bold leading-none text-black font-heading hidden lg:block">
        Orders
      </h2>

      <div className="flex flex-col gap-[12px] lg:space-y-4">
        {orders.map((order, index) => (
          <article
            key={`${order.id}-${index}`}
            className="border border-[#e5e5e5] lg:border-[#e8e8e8] rounded-[14px] lg:rounded-xl bg-white p-[14px] lg:p-5 shadow-[0_4px_14px_rgba(0,0,0,0.06)] lg:shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Desktop Layout */}
            <div className="hidden lg:grid gap-6 lg:grid-cols-[minmax(0,1fr)_160px] lg:gap-7 items-center">
              <div>
                <div className="flex min-h-[50px] items-start gap-3 flex-wrap">
                  {order.images.map((image, imgIdx) => (
                    <ProductThumbnail key={`${order.id}-${imgIdx}`} image={image} />
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-y-4 gap-x-2 sm:grid-cols-4 font-body">
                  <OrderMeta label="Order ID" value={order.id.slice(-8).toUpperCase()} />
                  <OrderMeta label={order.dateLabel} value={order.date} />
                  <OrderMeta label="Total" value={order.total} />
                  <OrderMeta
                    label="Status"
                    value={order.status}
                    valueClassName={`${statusToneClass[order.statusTone as LocalAccountOrder["statusTone"]]} uppercase font-bold`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-start lg:justify-end">
                <div className="text-center w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onAction(order.id, order.action)}
                    className="h-10 w-full sm:min-w-[134px] border border-black bg-white rounded-lg px-4 text-xs font-bold uppercase transition-colors hover:bg-black hover:text-white cursor-pointer"
                  >
                    {order.action}
                  </button>

                  {order.secondaryAction && (
                    <button
                      type="button"
                      onClick={() => onAction(order.id, "Cancel order")}
                      className={`mt-3 block w-full text-center text-[10px] font-bold leading-none cursor-pointer bg-transparent border-0 ${
                        order.secondaryTone === "danger"
                          ? "text-[#de5656] hover:underline"
                          : "text-black hover:underline"
                      }`}
                    >
                      {order.secondaryAction}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile/Tablet Layout */}
            <div className="lg:hidden flex flex-col gap-4 font-body">
              {/* Top Row: Image on top-left, details on top-right */}
              <div className="flex gap-4">
                <div className="shrink-0">
                  {order.images.length > 0 ? (
                    <ProductThumbnail image={order.images[0]} />
                  ) : (
                    <div className="w-14 h-16 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-center text-xl">🌿</div>
                  )}
                </div>
                
                <div className="flex-grow flex flex-col justify-center min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                  <span className="text-xs font-bold text-[#111111] truncate">#{order.id.slice(-8).toUpperCase()}</span>
                  
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{order.dateLabel}</span>
                  <span className="text-xs font-semibold text-[#555555]">{order.date}</span>
                </div>
              </div>

              {/* Middle Row: Total amount & status badge in 2 columns */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eeeeee] pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
                  <span className="text-sm font-bold text-[#111111] mt-0.5">{order.total}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  <div className="mt-1">
                    {renderStatusBadge(order.status)}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onAction(order.id, order.action)}
                  className="h-10 w-full bg-[#2f9e24] hover:bg-[#257d1c] text-white border-0 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer shadow-sm"
                >
                  {order.action}
                </button>

                {order.secondaryAction && (
                  <button
                    type="button"
                    onClick={() => onAction(order.id, "Cancel order")}
                    className="h-10 w-full border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer bg-transparent"
                  >
                    {order.secondaryAction}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProductThumbnail({ image }: { image: LocalOrderThumbnail }) {
  return (
    <div className="relative h-14 w-12 overflow-hidden bg-[#f2f2f2] rounded border border-gray-100 flex items-center justify-center">
      {image.src.startsWith("/") || image.src.startsWith("http") ? (
        <img
          src={image.src}
          alt={image.alt}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className="text-xl">{image.src || "🌿"}</span>
      )}
    </div>
  );
}

function OrderMeta({
  label,
  value,
  valueClassName = "text-black",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-h-[38px] border-r border-[#efefef] pr-2 last:border-r-0">
      <p className="mb-0.5 text-[10px] font-bold leading-none text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-xs leading-tight font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

// FavoritesPanel removed

function PersonalDataPanel({
  profile,
  loading,
  onSave,
}: {
  profile: { name: string; email: string; phone: string };
  loading: boolean;
  onSave: (updatedProfile: { name: string; email: string; phone: string }) => void;
}) {
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  if (loading) return <div className="text-center py-10 text-gray-500 font-body font-bold">Loading personal info...</div>;

  return (
    <div className="bg-white border border-[#e5e5e5] lg:border-0 rounded-[14px] lg:rounded-none p-[14px] lg:p-0 shadow-[0_4px_14px_rgba(0,0,0,0.06)] lg:shadow-none">
      <h2 className="mb-6 text-[22px] font-bold leading-none text-black font-heading hidden lg:block">
        Personal Data
      </h2>

      <form
        className="max-w-[520px] space-y-4 font-body"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(formData);
        }}
      >
        <AccountInput
          label="Full Name *"
          value={formData.name}
          onChange={(value) => setFormData((current) => ({ ...current, name: value }))}
        />
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-gray-600">Email Address (Read-only)</span>
          <input
            type="email"
            disabled
            value={formData.email}
            className="h-11 w-full border border-[#e2e2e2] rounded-lg bg-gray-50 px-4 text-xs text-gray-500 outline-none cursor-not-allowed"
          />
        </label>
        <AccountInput
          label="Phone Number"
          value={formData.phone}
          onChange={(value) => setFormData((current) => ({ ...current, phone: value }))}
        />
        <SubmitButton label="SAVE CHANGES" />
      </form>
    </div>
  );
}

function PasswordPanel({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  return (
    <div className="bg-white border border-[#e5e5e5] lg:border-0 rounded-[14px] lg:rounded-none p-[14px] lg:p-0 shadow-[0_4px_14px_rgba(0,0,0,0.06)] lg:shadow-none">
      <h2 className="mb-6 text-[22px] font-bold leading-none text-black font-heading hidden lg:block">
        Change Password
      </h2>

      <form
        className="max-w-[520px] space-y-4 font-body"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.newPassword.length < 6) {
            alert("New password must be at least 6 characters long.");
            return;
          }
          if (form.newPassword !== form.confirmPassword) {
            alert("New password and confirmation do not match.");
            return;
          }
          
          fetch("/api/user/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                onSave();
                setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
              } else {
                alert(data.error || "Failed to update password.");
              }
            })
            .catch(() => alert("Network error."));
        }}
      >
        <AccountInput
          label="Current Password"
          type="password"
          value={form.currentPassword}
          onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
        />
        <AccountInput
          label="New Password"
          type="password"
          value={form.newPassword}
          onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))}
        />
        <AccountInput
          label="Confirm New Password"
          type="password"
          value={form.confirmPassword}
          onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))}
        />
        <SubmitButton label="UPDATE PASSWORD" />
      </form>
    </div>
  );
}

function AddressesPanel({
  addresses,
  loading,
  onAdd,
  onDelete,
}: {
  addresses: LocalAddress[];
  loading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  if (loading) return <div className="text-center py-10 text-gray-500 font-body font-bold">Loading addresses...</div>;

  return (
    <div className="bg-transparent border-0 rounded-none p-0 shadow-none">
      <div className="mb-6 flex items-center justify-between gap-4 px-4 lg:px-0">
        <h2 className="text-[22px] font-bold leading-none text-black font-heading hidden lg:block">
          Addresses
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-10 items-center gap-1.5 border border-primary bg-transparent text-primary hover:bg-primary hover:text-white px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Plus size={14} aria-hidden="true" />
          ADD ADDRESS
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="px-4 lg:px-0">
          <EmptyPanel title="No addresses found" description="Click Add Address above to set one." />
        </div>
      ) : (
        <div className="account-address-grid grid gap-[12px] lg:gap-4 grid-cols-1 md:grid-cols-2 font-body">
          {addresses.map((address) => (
            <article key={address._id} className="border border-[#e5e5e5] lg:border-[#e8e8e8] rounded-[14px] lg:rounded-xl p-[14px] lg:p-5 relative bg-white shadow-[0_4px_14px_rgba(0,0,0,0.06)] lg:shadow-none">
              <button
                type="button"
                onClick={() => onDelete(address._id)}
                className="absolute right-4 top-4 text-gray-400 hover:text-red-500 border-0 bg-transparent cursor-pointer"
                title="Delete address"
              >
                <X size={14} />
              </button>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">{address.label}</h3>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-[#e8e8e8] rounded-xl py-12 text-center font-body">
      <h3 className="text-sm font-bold text-gray-500">{title}</h3>
      <p className="mt-1.5 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function AccountInput({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-[#e2e2e2] rounded-lg bg-white px-4 text-xs text-black outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="h-11 border-0 bg-primary hover:bg-primary-dark text-white rounded-lg px-6 text-xs font-bold transition-all cursor-pointer shadow-sm"
    >
      {label}
    </button>
  );
}
