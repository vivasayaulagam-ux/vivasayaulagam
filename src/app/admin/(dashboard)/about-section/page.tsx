'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Leaf,
  ChefHat,
  Truck,
  ShieldCheck,
  Shirt,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import Image from 'next/image';

const iconMap: Record<string, any> = {
  leaf: Leaf,
  chefhat: ChefHat,
  shirt: Shirt,
  truck: Truck,
  shield: ShieldCheck,
  award: Award
};

function getIcon(name: string) {
  if (!name) return Leaf;
  const key = name.toLowerCase().trim();
  return iconMap[key] || Leaf;
}

export default function EditAboutSectionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form States
  const [smallLabel, setSmallLabel] = useState('');
  const [mainHeading, setMainHeading] = useState('');
  const [paragraph1, setParagraph1] = useState('');
  const [paragraph2, setParagraph2] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [mainImage, setMainImage] = useState('/about-us.png');
  const [ctaButtonText, setCtaButtonText] = useState('');
  const [ctaButtonLink, setCtaButtonLink] = useState('');
  const [trustCards, setTrustCards] = useState<any[]>([]);
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/about-section');
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setSmallLabel(d.smallLabel || '');
          setMainHeading(d.mainHeading || '');
          setParagraph1(d.paragraph1 || '');
          setParagraph2(d.paragraph2 || '');
          setQuoteText(d.quoteText || '');
          setMainImage(d.mainImage || '/about-us.png');
          setCtaButtonText(d.ctaButtonText || '');
          setCtaButtonLink(d.ctaButtonLink || '');
          setTrustCards(d.trustCards || []);
          setIsActive(d.isActive !== false);
        }
      } catch (err) {
        console.error('Failed to load about section configurations:', err);
        setErrorMsg('Failed to load settings data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setMainImage(data.url);
      } else {
        setErrorMsg(data.error || 'Failed to upload image');
      }
    } catch (err) {
      setErrorMsg('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const addTrustCard = () => {
    setTrustCards((prev) => [
      ...prev,
      {
        icon: 'leaf',
        title: 'New Trust Card',
        description: 'Description detail here.',
        isActive: true,
        sortOrder: prev.length + 1
      }
    ]);
  };

  const deleteTrustCard = (index: number) => {
    setTrustCards((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTrustCard = (index: number, field: string, value: any) => {
    setTrustCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === trustCards.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const arr = [...trustCards];

    // Swap items
    [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];

    // Recalculate sortOrders
    const updated = arr.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    setTrustCards(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!smallLabel.trim()) {
      setErrorMsg('Small label is required.');
      setSaving(false);
      return;
    }
    if (!mainHeading.trim()) {
      setErrorMsg('Main heading is required.');
      setSaving(false);
      return;
    }
    if (!paragraph1.trim()) {
      setErrorMsg('Paragraph 1 content is required.');
      setSaving(false);
      return;
    }
    if (!mainImage.trim()) {
      setErrorMsg('Main image path or upload is required.');
      setSaving(false);
      return;
    }
    if (!ctaButtonText.trim()) {
      setErrorMsg('CTA button text is required.');
      setSaving(false);
      return;
    }
    if (!ctaButtonLink.trim()) {
      setErrorMsg('CTA button redirection link is required.');
      setSaving(false);
      return;
    }

    if (trustCards.length === 0) {
      setErrorMsg('At least one trust card is required.');
      setSaving(false);
      return;
    }
    const hasActiveCard = trustCards.some((card) => card.isActive);
    if (!hasActiveCard) {
      setErrorMsg('Minimum 1 active card is required.');
      setSaving(false);
      return;
    }

    const payload = {
      smallLabel,
      mainHeading,
      paragraph1,
      paragraph2,
      quoteText,
      mainImage,
      ctaButtonText,
      ctaButtonLink,
      trustCards,
      isActive
    };

    try {
      const res = await fetch('/api/admin/about-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'About section saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setErrorMsg('Error sending request.');
    } finally {
      setSaving(false);
    }
  };

  const previewActiveCards = trustCards.filter((c) => c.isActive);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit About Section</h1>
          <p className="text-sm text-gray-500">Configure content, image, call-to-action buttons, and trust cards for the homepage About block</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Loader2 className="animate-spin inline-block mr-2 text-[#34a121]" size={20} />
          Loading about section configurations...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Editor Panel */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">
                Content & Layout Settings
              </h2>

              {/* Status Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Display About Section</h3>
                  <p className="text-xs text-gray-400">Toggle whether this section appears on the homepage storefront</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-2 text-xs px-3.5 py-2 border rounded-xl font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  {isActive ? (
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

              {/* Text Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Small Label (Eyebrow Text)</label>
                  <input
                    type="text"
                    required
                    value={smallLabel}
                    onChange={(e) => setSmallLabel(e.target.value)}
                    placeholder="ABOUT VIVASAYA ULAGAM"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Main Heading</label>
                  <input
                    type="text"
                    required
                    value={mainHeading}
                    onChange={(e) => setMainHeading(e.target.value)}
                    placeholder="Rooted in Tradition. Delivered with Trust."
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paragraph 1</label>
                  <textarea
                    rows={4}
                    required
                    value={paragraph1}
                    onChange={(e) => setParagraph1(e.target.value)}
                    placeholder="Enter main paragraph..."
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paragraph 2 (Optional)</label>
                  <textarea
                    rows={4}
                    value={paragraph2}
                    onChange={(e) => setParagraph2(e.target.value)}
                    placeholder="Enter secondary paragraph..."
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quote Block Text (Optional)</label>
                  <input
                    type="text"
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="We believe food is not just a product..."
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Main Image Upload */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Main Section Image</label>
                <div className="flex gap-4 items-start">
                  <div className="relative w-28 h-32 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                    {mainImage ? (
                      <Image src={mainImage} alt="Main Image Preview" fill className="object-cover animate-fadeIn" />
                    ) : (
                      <ImageIcon size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 text-xs px-3.5 py-2.5 bg-[#34a121] text-white rounded-xl hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer border-0"
                      >
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      <span className="text-[11px] text-gray-400">Allowed: PNG, JPG, WEBP. Recommend ratio 4:5.</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={mainImage}
                      onChange={(e) => setMainImage(e.target.value)}
                      placeholder="/about-us.png or paste image path"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* CTA Button Settings */}
              <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">CTA Button Text</label>
                  <input
                    type="text"
                    required
                    value={ctaButtonText}
                    onChange={(e) => setCtaButtonText(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">CTA Button Redirection Link</label>
                  <input
                    type="text"
                    required
                    value={ctaButtonLink}
                    onChange={(e) => setCtaButtonLink(e.target.value)}
                    placeholder="/shop"
                    className="w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:border-[#34a121] focus:ring-1 focus:ring-[#34a121] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Trust Cards Repeater Manager */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex justify-between items-center">
                <span>Trust Cards Manager</span>
                <span className="text-xs font-normal text-gray-400">Repeater list</span>
              </h2>

              <div className="space-y-4">
                {trustCards.map((card, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3 relative">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item {idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        {/* Sort Order buttons */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCard(idx, 'up')}
                          className="p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === trustCards.length - 1}
                          onClick={() => moveCard(idx, 'down')}
                          className="p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTrustCard(idx, 'isActive', !card.isActive)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 border rounded-lg font-bold cursor-pointer ${
                            card.isActive
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-gray-100 text-gray-400'
                          }`}
                        >
                          {card.isActive ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTrustCard(idx)}
                          className="p-1 rounded bg-white border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Select Icon</label>
                        <select
                          value={card.icon}
                          onChange={(e) => updateTrustCard(idx, 'icon', e.target.value)}
                          className="w-full text-xs px-2.5 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:outline-none"
                        >
                          <option value="leaf">🍃 Leaf (Natural)</option>
                          <option value="shirt">👕 Shirt (Traditional)</option>
                          <option value="chefhat">👨‍🍳 Chef Hat (Homemade)</option>
                          <option value="truck">🚚 Truck (Shipping)</option>
                          <option value="shield">🛡 Shield (Secure)</option>
                          <option value="award">🏆 Award (Certified)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Card Title</label>
                        <input
                          type="text"
                          required
                          value={card.title}
                          onChange={(e) => updateTrustCard(idx, 'title', e.target.value)}
                          placeholder="Enter card title"
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Description</label>
                        <input
                          type="text"
                          value={card.description}
                          onChange={(e) => updateTrustCard(idx, 'description', e.target.value)}
                          placeholder="Card description text"
                          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:border-[#34a121] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTrustCard}
                  className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-[#34a121]/30 rounded-xl text-xs font-semibold text-[#34a121] hover:border-[#34a121] hover:bg-[#34a121]/5 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add New Trust Card
                </button>
              </div>
            </div>

            {/* Error / Success feedback */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
                <Check size={16} /> {successMsg}
              </div>
            )}

            {/* Fixed Action Bottom Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold pl-1">All changes immediately apply to homepage.</span>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-[#34a121] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#154a28] disabled:opacity-60 transition-colors cursor-pointer border-0 text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Right Live Preview Panel */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
                🖥 Live Storefront Preview
              </h2>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-[#FAF9F5] p-4 scale-95 origin-top max-h-[75vh] overflow-y-auto">
                <div className="flex flex-col gap-5 text-[#1f2933]">
                  {/* Eyebrow Label */}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#34a121] leading-none">
                    {smallLabel || 'ABOUT VIVASAYA ULAGAM'}
                  </span>

                  {/* Heading */}
                  <h2 className="font-heading text-xl font-extrabold text-[#111111] leading-tight">
                    {mainHeading || 'Rooted in Tradition. Delivered with Trust.'}
                  </h2>

                  {/* Image mock */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-white shadow-sm bg-gray-100">
                    {mainImage ? (
                      <img src={mainImage} alt="Preview Image" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">Image</div>
                    )}
                  </div>

                  {/* Paragraphs */}
                  <div className="flex flex-col gap-2.5 text-[11px] leading-relaxed text-gray-500 font-body">
                    <p>{paragraph1 || 'Primary paragraph text...'}</p>
                    {paragraph2 && <p>{paragraph2}</p>}
                    {quoteText && (
                      <blockquote className="border-l-4 border-[#34a121] pl-3.5 italic font-medium text-[#111111] py-1 bg-green-50/50 rounded-r-xl pr-3">
                        &ldquo;{quoteText}&rdquo;
                      </blockquote>
                    )}
                  </div>

                  {/* Trust cards previews */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {previewActiveCards.map((card, idx) => {
                      const Icon = getIcon(card.icon);
                      return (
                        <div
                          key={idx}
                          className="bg-white border border-[#e2e8f0]/60 p-3 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] flex gap-3 items-start"
                        >
                          <div className="w-8 h-8 bg-green-50 text-[#34a121] rounded-lg flex items-center justify-center shrink-0 border border-green-100/50">
                            <Icon size={16} />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <h4 className="font-heading font-bold text-[10px] text-gray-900 leading-tight">
                              {card.title}
                            </h4>
                            <p className="text-[9px] leading-snug text-gray-400 font-semibold">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {previewActiveCards.length === 0 && (
                      <div className="p-3 text-center text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl">
                        At least 1 active trust card is required!
                      </div>
                    )}
                  </div>

                  {/* CTA button mock */}
                  <div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center bg-[#34a121] text-white px-6 py-2 rounded-full text-[10px] font-bold shadow-sm select-none cursor-default border-0"
                    >
                      {ctaButtonText || 'Shop Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
