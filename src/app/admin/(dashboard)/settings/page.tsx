'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, AlertCircle, Loader2, Link2, Eye, EyeOff, Plus, Trash2, Video as VideoIcon, Check, DollarSign, ExternalLink } from 'lucide-react';

interface SettingsResponse {
  success?: boolean;
  settings?: {
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
    };
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'courier' | 'reels'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Social Video Settings
  const [instagramLink, setInstagramLink] = useState('https://instagram.com/vivasaya_ullagam');
  const [youtubeLink, setYoutubeLink] = useState('https://youtube.com/@vivasayauallagam');
  const [socialEnabled, setSocialEnabled] = useState(true);
  const [socialTitle, setSocialTitle] = useState('Shop Our Reels & Shorts');

  // Contact Info
  const [contactEmail, setContactEmail] = useState('crazyboyajith743@gmail.com');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [shopAddress, setShopAddress] = useState('12, Organic Green Valley, Coimbatore, Tamil Nadu - 641001');

  // Courier Charges (Weight Based)
  const [courier250g, setCourier250g] = useState<number | ''>(40);
  const [courier500g, setCourier500g] = useState<number | ''>(60);
  const [courier1kg, setCourier1kg] = useState<number | ''>(80);
  const [courierAbove, setCourierAbove] = useState<number | ''>(120);

  // Reels State
  const [reels, setReels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [addingReel, setAddingReel] = useState(false);

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
        }
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
      }
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
      const payload = {
        title: newReelTitle,
        videoUrl: newReelVideoUrl,
        img: newReelImg || (selectedProd ? selectedProd.images?.[0] : ''),
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
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        {(['general', 'courier', 'reels'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 capitalize transition-colors outline-none ${
              activeTab === tab
                ? 'border-[#1F6B3B] text-[#1F6B3B]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'general' ? 'General & Social' : tab === 'courier' ? 'Courier Charges' : 'Shoppable Reels'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 border-t-0 rounded-b-xl">
          <Loader2 className="animate-spin inline-block mr-2 text-[#1F6B3B]" size={20} />
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
                    <Link2 size={18} className="text-[#1F6B3B]" />
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
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">YouTube Channel Link</label>
                      <input
                        type="url"
                        value={youtubeLink}
                        onChange={e => setYoutubeLink(e.target.value)}
                        placeholder="https://youtube.com/@your-channel"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
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
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
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
                    <AlertCircle size={18} className="text-[#1F6B3B]" />
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
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Support Phone Number</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
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
                      className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors resize-none"
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
                    className="w-full flex items-center justify-center gap-2 bg-[#1F6B3B] text-white py-3 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer"
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
                    <DollarSign size={18} className="text-[#1F6B3B]" />
                    Weight-Based Courier Charges
                  </h2>
                  <p className="text-xs text-gray-500">
                    Define shipping rates dynamically based on the cumulative weight of the products in the customer's cart. Weights will be parsed and calculated at checkout.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Up to 250g Package (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={courier250g}
                          onChange={e => setCourier250g(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="40"
                          className="w-full text-sm pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Up to 500g Package (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={courier500g}
                          onChange={e => setCourier500g(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="60"
                          className="w-full text-sm pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Up to 1kg Package (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={courier1kg}
                          onChange={e => setCourier1kg(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="80"
                          className="w-full text-sm pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Above 1kg Package Rate (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={courierAbove}
                          onChange={e => setCourierAbove(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="120"
                          className="w-full text-sm pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
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
                    className="w-full flex items-center justify-center gap-2 bg-[#1F6B3B] text-white py-3 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* INSTAGRAM REELS / SHOPPABLE VIDEOS TAB */}
          {activeTab === 'reels' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Reel Form */}
              <div className="space-y-6 lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-b-xl lg:rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <VideoIcon size={18} className="text-[#1F6B3B]" />
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
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Video Stream URL (.mp4)</label>
                      <input
                        type="url"
                        value={newReelVideoUrl}
                        onChange={e => setNewReelVideoUrl(e.target.value)}
                        placeholder="https://assets.mixkit.co/.../video.mp4"
                        required
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tag Product</label>
                      <select
                        value={newReelProductId}
                        onChange={e => handleProductSelect(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none bg-white transition-colors"
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
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Thumbnail / Cover Image URL</label>
                      <input
                        type="text"
                        value={newReelImg}
                        onChange={e => setNewReelImg(e.target.value)}
                        placeholder="/uploads/products/image.png"
                        className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:ring-1 focus:ring-[#1F6B3B] focus:outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={addingReel}
                      className="w-full flex items-center justify-center gap-2 bg-[#1F6B3B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer mt-2"
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
                              <span className="text-xs font-bold text-[#1F6B3B] truncate block">
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
