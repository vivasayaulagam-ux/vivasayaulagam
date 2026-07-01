'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, Loader2, Link2, Eye, EyeOff, Plus, Trash2, Video as VideoIcon, Check, DollarSign, ExternalLink, Image as ImageIcon, LayoutTemplate, ChevronUp, ChevronDown, Timer, Monitor, Smartphone } from 'lucide-react';
import Image from "next/image";

interface BannerSlide {
  id: string;
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  link?: string;
  headline?: string;
  subtitle?: string;
}

interface SettingsResponse {
  success?: boolean;
  settings?: {
    cod_enabled?: boolean | number;
    social_media_settings?: {
      instagramLink?: string;
      youtubeLink?: string;
      enabled?: boolean;
      title?: string;
    };
    contact_settings?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    courier_charges?: {
      charge_250g?: number;
      charge_500g?: number;
      charge_1kg?: number;
      charge_above?: number;
      rate_per_kg?: number;
    };
    banner_slides?: BannerSlide[];
    banner_timer?: number;
    banner_height_desktop?: number;
    banner_height_mobile?: number;
    banner_show_arrows?: boolean;
    banner_show_dots?: boolean;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'courier' | 'reels' | 'banner'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);

  // Social Video Settings
  const [instagramLink, setInstagramLink] = useState('https://instagram.com/vivasaya_ullagam');
  const [youtubeLink, setYoutubeLink] = useState('https://youtube.com/@vivasayauallagam');
  const [socialEnabled, setSocialEnabled] = useState(true);
  const [socialTitle, setSocialTitle] = useState('Shop Our Reels & Shorts');

  // Contact Info
  const [contactEmail, setContactEmail] = useState('vivasayaulagam@gmail.com');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [shopAddress, setShopAddress] = useState('12, Organic Green Valley, Coimbatore, Tamil Nadu - 641001');

  // Courier Charges (Weight Based)
  const [courier250g, setCourier250g] = useState<number | ''>(40);
  const [courier500g, setCourier500g] = useState<number | ''>(60);
  const [courier1kg, setCourier1kg] = useState<number | ''>(80);
  const [courierAbove, setCourierAbove] = useState<number | ''>(120);
  const [ratePerKg, setRatePerKg] = useState<number | ''>(100);

  // Banner Slider State
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);
  const [bannerTimer, setBannerTimer] = useState(5);
  const [bannerHeightDesktop, setBannerHeightDesktop] = useState(560);
  const [bannerHeightMobile, setBannerHeightMobile] = useState(320);
  const [bannerShowArrows, setBannerShowArrows] = useState(true);
  const [bannerShowDots, setBannerShowDots] = useState(true);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState(false);
  const [bannerUploading, setBannerUploading] = useState<string | null>(null);
  const bannerFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const mobileBannerFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reels State
  const [reels, setReels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [addingReel, setAddingReel] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setNewReelVideoUrl(data.url);
      } else {
        alert(data.error || 'Failed to upload video');
      }
    } catch (err) {
      alert('Error uploading video');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setNewReelImg(data.url);
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      alert('Error uploading image');
    } finally {
      setImageUploading(false);
    }
  };

  // Add Reel Form
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelVideoUrl, setNewReelVideoUrl] = useState('');
  const [newReelImg, setNewReelImg] = useState('');
  const [newReelProductId, setNewReelProductId] = useState('');
  const [newReelPrice, setNewReelPrice] = useState<number | ''>('');

  useEffect(() => {
    let isMounted = true;

    // Load Settings
    fetch('/api/settings')
      .then(res => res.json() as Promise<SettingsResponse>)
      .then(data => {
        if (!isMounted || !data.success || !data.settings) return;

        const social = data.settings.social_media_settings;
        if (social) {
          setInstagramLink(social.instagramLink || '');
          setYoutubeLink(social.youtubeLink || '');
          setSocialEnabled(social.enabled !== false);
          setSocialTitle(social.title || 'Shop Our Reels & Shorts');
        }

        const contact = data.settings.contact_settings;
        if (contact) {
          setContactEmail(contact.email || '');
          setContactPhone(contact.phone || '');
          setShopAddress(contact.address || '');
        }

        const courier = data.settings.courier_charges;
        if (courier) {
          setCourier250g(courier.charge_250g ?? 40);
          setCourier500g(courier.charge_500g ?? 60);
          setCourier1kg(courier.charge_1kg ?? 80);
          setCourierAbove(courier.charge_above ?? 120);
          setRatePerKg(courier.rate_per_kg ?? 100);
        }

        if (data.settings.cod_enabled !== undefined) {
          setCodEnabled(Number(data.settings.cod_enabled) === 1);
        }

        if (data.settings.banner_slides) {
          setBannerSlides(data.settings.banner_slides);
        }
        if (data.settings.banner_timer !== undefined) setBannerTimer(data.settings.banner_timer);
        if (data.settings.banner_height_desktop !== undefined) setBannerHeightDesktop(data.settings.banner_height_desktop);
        if (data.settings.banner_height_mobile !== undefined) setBannerHeightMobile(data.settings.banner_height_mobile);
        if (data.settings.banner_show_arrows !== undefined) setBannerShowArrows(data.settings.banner_show_arrows);
        if (data.settings.banner_show_dots !== undefined) setBannerShowDots(data.settings.banner_show_dots);
      })
      .catch(err => console.error('Failed to load settings:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Load active products
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success && data.products) {
          setProducts(data.products.filter((p: any) => p.status === 'active'));
        }
      })
      .catch(err => console.error('Failed to load products:', err));

    // Load reels
    fetch('/api/social/instagram/reels')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success && data.videos) {
          setReels(data.videos);
        }
      })
      .catch(err => console.error('Failed to load reels:', err))
      .finally(() => {
        if (isMounted) setReelsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const payload = {
      social_media_settings: {
        instagramLink,
        youtubeLink,
        enabled: socialEnabled,
        title: socialTitle,
      },
      contact_settings: {
        email: contactEmail,
        phone: contactPhone,
        address: shopAddress,
      },
      courier_charges: {
        charge_250g: courier250g === '' ? 40 : Number(courier250g),
        charge_500g: courier500g === '' ? 60 : Number(courier500g),
        charge_1kg: courier1kg === '' ? 80 : Number(courier1kg),
        charge_above: courierAbove === '' ? 120 : Number(courierAbove),
        rate_per_kg: ratePerKg === '' ? 100 : Number(ratePerKg),
      },
      cod_enabled: codEnabled ? 1 : 0
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelTitle || !newReelVideoUrl) {
      alert('Title and Video URL are required');
      return;
    }
    setAddingReel(true);
    try {
      const selectedProd = products.find(p => p._id === newReelProductId);
      
      let normalizedVideoUrl = newReelVideoUrl.trim();
      if (normalizedVideoUrl && !normalizedVideoUrl.startsWith('http://') && !normalizedVideoUrl.startsWith('https://') && !normalizedVideoUrl.startsWith('/') && !normalizedVideoUrl.startsWith('data:')) {
        normalizedVideoUrl = `/uploads/${normalizedVideoUrl}`;
      }

      let normalizedImg = newReelImg.trim();
      if (normalizedImg && !normalizedImg.startsWith('http://') && !normalizedImg.startsWith('https://') && !normalizedImg.startsWith('/') && !normalizedImg.startsWith('data:')) {
        normalizedImg = `/uploads/${normalizedImg}`;
      }

      const payload = {
        title: newReelTitle,
        videoUrl: normalizedVideoUrl,
        img: normalizedImg || (selectedProd ? selectedProd.images?.[0] : ''),
        taggedProductId: newReelProductId || null,
        price: newReelPrice !== '' ? Number(newReelPrice) : (selectedProd ? selectedProd.price : 0),
        isActive: true,
      };

      const res = await fetch('/api/social/instagram/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.video) {
        // Refresh video list to get populated info
        const refreshRes = await fetch('/api/social/instagram/reels');
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.videos) {
          setReels(refreshData.videos);
        }
        
        // Reset form
        setNewReelTitle('');
        setNewReelVideoUrl('');
        setNewReelImg('');
        setNewReelProductId('');
        setNewReelPrice('');
      } else {
        alert(data.error || 'Failed to add reel');
      }
    } catch (err) {
      alert('Error adding reel');
    } finally {
      setAddingReel(false);
    }
  };

  const handleDeleteReel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel?')) return;
    try {
      const res = await fetch(`/api/social/instagram/reels/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setReels(prev => prev.filter(r => r._id !== id));
      } else {
        alert(data.error || 'Failed to delete reel');
      }
    } catch (err) {
      alert('Error deleting reel');
    }
  };

  const handleToggleReelActive = async (reel: any) => {
    try {
      const updatedStatus = !reel.isActive;
      const res = await fetch(`/api/social/instagram/reels/${reel._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReels(prev => prev.map(r => r._id === reel._id ? { ...r, isActive: updatedStatus } : r));
      } else {
        alert(data.error || 'Failed to toggle status');
      }
    } catch (err) {
      alert('Error toggling status');
    }
  };

  const handleProductSelect = (pId: string) => {
    setNewReelProductId(pId);
    if (pId) {
      const prod = products.find(p => p._id === pId);
      if (prod) {
        setNewReelPrice(prod.price);
        if (prod.images && prod.images[0]) {
          setNewReelImg(prod.images[0]);
        }
      }
    } else {
      setNewReelPrice('');
      setNewReelImg('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Configure global shop parameters, integrations, courier charges, and shoppable reels</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 overflow-x-auto">
        {(['general', 'payment', 'banner', 'reels'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 capitalize transition-colors outline-none whitespace-nowrap ${
              activeTab === tab
                ? 'border-[#34a121] text-[#34a121]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'general' ? 'General & Social' : tab === 'payment' ? '💳 Payment Methods' : tab === 'banner' ? '🖼 Banner Slider' : 'Shoppable Reels'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 border-t-0 rounded-b-xl">
          <Loader2 className="animate-spin inline-block mr-2 text-[#34a121]" size={20} />
          Loading settings parameters...
        </div>
      ) : (
        <div>
          {/* GENERAL & SOCIAL TAB */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Social Media Integration */}
                <div className="bg-white border border-gray-200 rounded-b-xl lg:rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <Link2 size={18} className="text-[#34a121]" />
                    Social Media Integration
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Instagram Account Link</label>
                      <input
                        type="url"
                        value={instagramLink}
                        onChange={e => setInstagramLink(e.target.value)}
                        placeholder="https://instagram.com/your-username"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">YouTube Channel Link</label>
                      <input
                        type="url"
                        value={youtubeLink}
                        onChange={e => setYoutubeLink(e.target.value)}
                        placeholder="https://youtube.com/@your-channel"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Carousel / Grid Title</label>
                    <input
                      type="text"
                      value={socialTitle}
                      onChange={e => setSocialTitle(e.target.value)}
                      placeholder="Shop Our Reels & Shorts"
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Display Section on Homepage</h3>
                      <p className="text-xs text-gray-400">Toggle whether the social feeds appear on the frontend index page</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSocialEnabled(!socialEnabled)}
                      className={`flex items-center gap-2 text-xs px-3.5 py-2 border rounded-xl font-semibold transition-colors ${
                        socialEnabled
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}
                    >
                      {socialEnabled ? (
                        <>
                          <Eye size={14} /> Enabled
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} /> Disabled
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Shop Contact Settings */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <AlertCircle size={18} className="text-[#34a121]" />
                    Contact Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Support Email Address</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        placeholder="support@vivasayauallagam.com"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Support Phone Number</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Physical Shop Address</label>
                    <textarea
                      rows={3}
                      value={shopAddress}
                      onChange={e => setShopAddress(e.target.value)}
                      placeholder="Enter store location"
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar Save */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-semibold text-gray-800">Save Parameters</h2>
                  <p className="text-xs text-gray-400">All modifications will propagate globally and update visual storefront modules instantly.</p>

                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                      <Check size={14} /> Settings saved successfully!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[#34a121] text-white py-3 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* PAYMENT METHODS TAB */}
          {activeTab === 'payment' && (
            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-b-xl lg:rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <DollarSign size={18} className="text-[#34a121]" />
                    Payment Methods
                  </h2>
                  <p className="text-xs text-gray-500">
                    Enable or disable payment options available to customers during checkout.
                  </p>

                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Cash on Delivery (COD)</h3>
                      <p className="text-xs text-gray-400">Allow customers to pay with cash upon delivery of their order</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCodEnabled(!codEnabled)}
                      className={`flex items-center gap-2 text-xs px-3.5 py-2 border rounded-xl font-semibold transition-colors cursor-pointer ${
                        codEnabled
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}
                    >
                      {codEnabled ? (
                        <>
                          <Eye size={14} /> ON (Enabled)
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} /> OFF (Disabled)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Save */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-semibold text-gray-800">Save Parameters</h2>
                  <p className="text-xs text-gray-400">All modifications will propagate globally and update visual storefront modules instantly.</p>

                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                      <Check size={14} /> Settings saved successfully!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[#34a121] text-white py-3 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* COURIER CHARGES TAB */}
          {activeTab === 'courier' && (
            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-b-xl lg:rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <DollarSign size={18} className="text-[#34a121]" />
                    Weight-Based Courier Charges
                  </h2>
                  <p className="text-xs text-gray-500">
                    Define shipping rates dynamically based on the cumulative weight of the products in the customer's cart. Weights will be parsed and calculated at checkout.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Global Courier Rate Per KG (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={ratePerKg}
                          onChange={e => setRatePerKg(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="100"
                          className="w-full text-sm pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Save */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-semibold text-gray-800">Save Parameters</h2>
                  <p className="text-xs text-gray-400">All modifications will propagate globally and update courier charges at checkouts instantly.</p>

                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                      <Check size={14} /> Charges saved successfully!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[#34a121] text-white py-3 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* BANNER SLIDER TAB */}
          {activeTab === 'banner' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Slides Manager */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-200 rounded-b-xl lg:rounded-xl p-6 shadow-sm">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5 flex items-center gap-2">
                    <LayoutTemplate size={18} className="text-[#34a121]" />
                    Banner Slides
                    <span className="ml-auto text-xs font-normal text-gray-400">Up to 6 slides supported</span>
                  </h2>

                  <div className="space-y-4">
                    {bannerSlides.map((slide, idx) => (
                      <div key={slide.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Slide {idx + 1}</span>
                          <div className="flex items-center gap-1.5">
                            <button type="button" disabled={idx === 0} onClick={() => {
                              const arr = [...bannerSlides];
                              [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                              setBannerSlides(arr);
                            }} className="p-1 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer">
                              <ChevronUp size={14} />
                            </button>
                            <button type="button" disabled={idx === bannerSlides.length - 1} onClick={() => {
                              const arr = [...bannerSlides];
                              [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                              setBannerSlides(arr);
                            }} className="p-1 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer">
                              <ChevronDown size={14} />
                            </button>
                            <button type="button" onClick={() => setBannerSlides(prev => prev.filter(s => s.id !== slide.id))} className="p-1 rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-gray-600">Desktop Banner Image <span className="font-normal text-gray-400">(recommended 1920 x 800 px)</span></p>
                        {/* Desktop image preview + upload */}
                        <div className="flex gap-3 items-start">
                          <div className="relative w-28 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                            {(slide.desktopImage || slide.image) ? (
                              <Image
  src={slide.desktopImage || slide.image}
  alt={`Slide ${idx + 1}`}
  fill
  className="object-cover"
/>
                            ) : (
                              <ImageIcon size={20} className="text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                ref={el => { bannerFileRefs.current[slide.id] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setBannerUploading(slide.id);
                                  try {
                                    const fd = new FormData();
                                    fd.append('file', file);
                                    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
                                    const data = await res.json();
                                    if (data.success && data.url) {
                                      setBannerSlides(prev => prev.map(s => s.id === slide.id ? { ...s, desktopImage: data.url, image: s.image || data.url } : s));
                                    } else {
                                      alert('Upload failed: ' + (data.error || 'Unknown error'));
                                    }
                                  } catch { alert('Upload error'); }
                                  finally { setBannerUploading(null); }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => bannerFileRefs.current[slide.id]?.click()}
                                disabled={bannerUploading === slide.id}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#34a121] text-white rounded-lg hover:bg-[#154a28] disabled:opacity-60 cursor-pointer"
                              >
                                {bannerUploading === slide.id ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                {bannerUploading === slide.id ? 'Uploading...' : 'Upload Desktop'}
                              </button>
                              <span className="text-xs text-gray-400">or paste URL below</span>
                            </div>
                            <input
                              type="text"
                              value={slide.desktopImage || slide.image}
                              onChange={e => setBannerSlides(prev => prev.map(s => s.id === slide.id ? { ...s, desktopImage: e.target.value, image: s.image || e.target.value } : s))}
                              placeholder="/uploads/banner.jpg or https://..."
                              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none"
                            />
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-gray-600">Mobile Banner Image <span className="font-normal text-gray-400">(optional, recommended 1080 x 1350 px / 4:5)</span></p>
                        <div className="flex gap-3 items-start">
                          <div className="relative w-20 aspect-[4/5] shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                            {slide.mobileImage ? <Image src={slide.mobileImage} alt={`Mobile slide ${idx + 1}`} fill className="object-contain" /> : <Smartphone size={20} className="text-gray-300" />}
                          </div>
                          <div className="flex-1 space-y-2">
                            <input ref={el => { mobileBannerFileRefs.current[slide.id] = el; }} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setBannerUploading(`${slide.id}-mobile`);
                              try {
                                const fd = new FormData(); fd.append('file', file);
                                const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
                                const data = await res.json();
                                if (data.success && data.url) setBannerSlides(prev => prev.map(s => s.id === slide.id ? { ...s, mobileImage: data.url } : s));
                                else alert('Upload failed: ' + (data.error || 'Unknown error'));
                              } catch { alert('Upload error'); } finally { setBannerUploading(null); }
                            }} />
                            <button type="button" onClick={() => mobileBannerFileRefs.current[slide.id]?.click()} disabled={bannerUploading === `${slide.id}-mobile`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#34a121] text-white rounded-lg hover:bg-[#154a28] disabled:opacity-60 cursor-pointer">
                              {bannerUploading === `${slide.id}-mobile` ? <Loader2 size={12} className="animate-spin" /> : <Smartphone size={12} />}
                              {bannerUploading === `${slide.id}-mobile` ? 'Uploading...' : 'Upload Mobile'}
                            </button>
                            <input type="text" value={slide.mobileImage || ''} onChange={e => setBannerSlides(prev => prev.map(s => s.id === slide.id ? { ...s, mobileImage: e.target.value } : s))} placeholder="Optional mobile image URL" className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Headline (optional)</label>
                            <input type="text" value={slide.headline || ''} onChange={e => setBannerSlides(prev => prev.map(s => s.id === slide.id ? { ...s, headline: e.target.value } : s))} placeholder="Pure Organic Foods..." className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Link URL (optional)</label>
                            <input type="text" value={slide.link || ''} onChange={e => setBannerSlides(prev => prev.map(s => s.id === slide.id ? { ...s, link: e.target.value } : s))} placeholder="/shop" className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Subtitle (optional)</label>
                            <input type="text" value={slide.subtitle || ''} onChange={e => setBannerSlides(prev => prev.map(s => s.id === slide.id ? { ...s, subtitle: e.target.value } : s))} placeholder="Traditional staples, cold-pressed oils..." className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {bannerSlides.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setBannerSlides(prev => [...prev, { id: `slide-${Date.now()}`, image: '', desktopImage: '', mobileImage: '', link: '/shop', headline: '', subtitle: '' }])}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#34a121]/30 rounded-xl text-sm font-semibold text-[#34a121] hover:border-[#34a121] hover:bg-[#34a121]/5 transition-colors cursor-pointer"
                      >
                        <Plus size={16} /> Add New Slide
                      </button>
                    )}
                    {bannerSlides.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No slides yet. Click "Add New Slide" to begin.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Settings Panel */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <Timer size={16} className="text-[#34a121]" /> Slider Configuration
                  </h2>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <Timer size={12} /> Auto-slide Timer (seconds)
                    </label>
                    <input type="number" min={2} max={30} value={bannerTimer} onChange={e => setBannerTimer(Number(e.target.value))} className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none" />
                    <p className="text-xs text-gray-400 mt-1">Time between slides (2–30 sec)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <Monitor size={12} /> Desktop Banner Height (px)
                    </label>
                    <input type="number" min={200} max={900} step={10} value={bannerHeightDesktop} onChange={e => setBannerHeightDesktop(Number(e.target.value))} className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <Smartphone size={12} /> Mobile Banner Height (px)
                    </label>
                    <input type="number" min={150} max={600} step={10} value={bannerHeightMobile} onChange={e => setBannerHeightMobile(Number(e.target.value))} className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none" />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-gray-600">Display Options</label>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-medium text-gray-700">Show Arrow Buttons</span>
                      <button type="button" onClick={() => setBannerShowArrows(!bannerShowArrows)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg font-semibold transition-colors cursor-pointer ${ bannerShowArrows ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500' }`}>
                        {bannerShowArrows ? <Eye size={12} /> : <EyeOff size={12} />} {bannerShowArrows ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-medium text-gray-700">Show Dot Indicators</span>
                      <button type="button" onClick={() => setBannerShowDots(!bannerShowDots)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg font-semibold transition-colors cursor-pointer ${ bannerShowDots ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500' }`}>
                        {bannerShowDots ? <Eye size={12} /> : <EyeOff size={12} />} {bannerShowDots ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                  </div>

                  {bannerSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                      <Check size={14} /> Banner settings saved!
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={bannerSaving}
                    onClick={async () => {
                      const invalid = bannerSlides.filter(s => !(s.desktopImage || s.image).trim());
                      if (invalid.length > 0) { alert('Please add an image for every slide before saving.'); return; }
                      setBannerSaving(true);
                      setBannerSuccess(false);
                      try {
                        const payload = {
                          banner_slides: bannerSlides,
                          banner_timer: bannerTimer,
                          banner_height_desktop: bannerHeightDesktop,
                          banner_height_mobile: bannerHeightMobile,
                          banner_show_arrows: bannerShowArrows,
                          banner_show_dots: bannerShowDots,
                        };
                        const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                        const data = await res.json();
                        if (data.success) { setBannerSuccess(true); setTimeout(() => setBannerSuccess(false), 3000); }
                        else { alert(data.error || 'Save failed'); }
                      } catch { alert('Network error saving banner settings'); }
                      finally { setBannerSaving(false); }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#34a121] text-white py-3 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {bannerSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {bannerSaving ? 'Saving...' : 'Save Banner Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INSTAGRAM REELS / SHOPPABLE VIDEOS TAB */}
          {activeTab === 'reels' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Reel Form */}
              <div className="space-y-6 lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-b-xl lg:rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <VideoIcon size={18} className="text-[#34a121]" />
                    Add Shoppable Reel
                  </h2>

                  <form onSubmit={handleAddReel} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Reel Title</label>
                      <input
                        type="text"
                        value={newReelTitle}
                        onChange={e => setNewReelTitle(e.target.value)}
                        placeholder="e.g. Pure Honey Processing"
                        required
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Video Stream URL (.mp4)</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleVideoUpload}
                        />
                        <button
                          type="button"
                          disabled={videoUploading}
                          onClick={() => videoInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#34a121] text-white rounded-xl hover:bg-[#154a28] disabled:opacity-60 cursor-pointer"
                        >
                          {videoUploading ? <Loader2 size={14} className="animate-spin" /> : <VideoIcon size={14} />}
                          {videoUploading ? 'Uploading...' : 'Upload Video'}
                        </button>
                        <span className="text-xs text-gray-400 self-center">or paste URL below</span>
                      </div>
                      <input
                        type="text"
                        value={newReelVideoUrl}
                        onChange={e => setNewReelVideoUrl(e.target.value)}
                        placeholder="https://assets.mixkit.co/.../video.mp4"
                        required
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tag Product</label>
                      <select
                        value={newReelProductId}
                        onChange={e => handleProductSelect(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none bg-white transition-colors"
                      >
                        <option value="">-- Select Active Product --</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.title} (₹{p.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Custom Overlay Price (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={newReelPrice}
                        onChange={e => setNewReelPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Auto-fills from product, or override"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Thumbnail / Cover Image URL</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          ref={imgInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <button
                          type="button"
                          disabled={imageUploading}
                          onClick={() => imgInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#34a121] text-white rounded-xl hover:bg-[#154a28] disabled:opacity-60 cursor-pointer"
                        >
                          {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                          {imageUploading ? 'Uploading...' : 'Upload Image'}
                        </button>
                        <span className="text-xs text-gray-400 self-center">or paste URL below</span>
                      </div>
                      <input
                        type="text"
                        value={newReelImg}
                        onChange={e => setNewReelImg(e.target.value)}
                        placeholder="/uploads/products/image.png"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={addingReel}
                      className="w-full flex items-center justify-center gap-2 bg-[#34a121] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer mt-2"
                    >
                      {addingReel ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      {addingReel ? 'Adding...' : 'Add Video'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Reels Listing */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">
                  Current Synced Reels ({reels.length})
                </h2>

                {reelsLoading ? (
                  <div className="py-8 text-center text-gray-400">Loading reels list...</div>
                ) : reels.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    No shoppable reels synced yet. Use the form on the left to add one!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reels.map(r => (
                      <div
                        key={r._id}
                        className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
                          r.isActive ? 'border-gray-200 bg-white' : 'border-gray-150 bg-gray-50 opacity-70'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-24 bg-gray-900 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center text-white">
                            {r.videoUrl ? (
                              <video src={r.videoUrl} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <VideoIcon size={20} className="text-gray-500" />
                            )}
                            <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <ExternalLink size={12} className="text-white opacity-80" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="text-xs font-bold text-gray-800 truncate" title={r.title}>
                              {r.title}
                            </h3>
                            <p className="text-[10px] text-gray-400 truncate" title={r.videoUrl}>
                              {r.videoUrl}
                            </p>
                            <div className="pt-1">
                              <span className="text-[10px] font-semibold text-gray-500 uppercase block">Tagged Item:</span>
                              <span className="text-xs font-bold text-[#34a121] truncate block">
                                {r.taggedProductId?.title || 'No Product Tagged'}
                              </span>
                            </div>
                            <div className="pt-0.5">
                              <span className="text-xs font-extrabold text-gray-900">₹{r.price || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                          <button
                            onClick={() => handleToggleReelActive(r)}
                            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                              r.isActive
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {r.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                            {r.isActive ? 'Active' : 'Inactive'}
                          </button>

                          <button
                            onClick={() => handleDeleteReel(r._id)}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
