'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Save, ArrowLeft, Loader2, Trash2, Copy, MoveUp, MoveDown,
  Layers, Settings, Monitor, Tablet, Smartphone, Sparkles, Check,
  Sliders, Type, Grid, FileText, Image as ImageIcon, Heart
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

type SectionSettingValue = string | number;

interface SectionConfig {
  id: string;
  type: string;
  settings: Record<string, SectionSettingValue>;
}

const SECTION_TEMPLATES: Array<{
  type: string;
  label: string;
  icon: LucideIcon;
  defaults: Record<string, SectionSettingValue>;
}> = [
  { type: 'hero_banner', label: 'Hero Banner', icon: ImageIcon, defaults: { title: 'Fresh Organic Harvest', subtitle: 'Straight from local fields to your family kitchen', ctaText: 'Shop Now', ctaLink: '/shop', bgGradient: 'from-[#1F6B3B] to-[#154a28]' } },
  { type: 'heading', label: 'Section Heading', icon: Type, defaults: { text: 'Our Bestsellers', alignment: 'center', color: '#111827', size: 'text-3xl' } },
  { type: 'text_block', label: 'Rich Text Paragraph', icon: FileText, defaults: { text: 'Vivasaya Ullagam is committed to bringing back clean eating. We partner with over 40+ certified organic farms to source wholesome items.', color: '#4b5563', alignment: 'left' } },
  { type: 'product_grid', label: 'Product Grid', icon: Grid, defaults: { limit: 4, category: 'Millets', title: 'Featured Products' } },
  { type: 'faq', label: 'FAQ Accordion', icon: Sliders, defaults: { question: 'Is shipping free?', answer: 'We offer free home delivery on all purchases above ₹1,000 across Tamil Nadu.' } },
  { type: 'testimonials', label: 'Testimonial Card', icon: Heart, defaults: { author: 'Kavitha S.', text: 'The multi millet noodles are amazing! My children love them and they take only 5 minutes to prepare.', role: 'Mother of two, Chennai' } },
  { type: 'newsletter', label: 'Newsletter Capture', icon: Sparkles, defaults: { title: 'Subscribe to Fresh Updates', buttonText: 'Join Farm Club' } }
];

let sectionIdCounter = 0;

function createSectionId() {
  sectionIdCounter += 1;
  return globalThis.crypto?.randomUUID?.() ?? `section-${sectionIdCounter}`;
}

function settingText(value: SectionSettingValue | undefined, fallback = '') {
  return value === undefined ? fallback : String(value);
}

function settingAlignment(value: SectionSettingValue | undefined) {
  return value === 'center' || value === 'right' ? value : 'left';
}

export default function PageBuilder() {
  const params = useParams();
  const pageId = params.id as string;

  const [pageTitle, setPageTitle] = useState('');
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/pages/${pageId}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success && data.page) {
          setPageTitle(data.page.title);
          setSections(data.page.sections || []);
          if (data.page.sections?.length > 0) {
            setSelectedSectionId(data.page.sections[0].id);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pageId]);

  const handleAddSection = (type: string) => {
    const template = SECTION_TEMPLATES.find(t => t.type === type);
    if (!template) return;

    const newSec: SectionConfig = {
      id: createSectionId(),
      type,
      settings: { ...template.defaults }
    };

    setSections([...sections, newSec]);
    setSelectedSectionId(newSec.id);
  };

  const handleUpdateSetting = (secId: string, key: string, value: SectionSettingValue) => {
    setSections(prev =>
      prev.map(sec => {
        if (sec.id === secId) {
          return {
            ...sec,
            settings: { ...sec.settings, [key]: value }
          };
        }
        return sec;
      })
    );
  };

  const handleDuplicate = (index: number) => {
    const original = sections[index];
    const copy: SectionConfig = {
      id: createSectionId(),
      type: original.type,
      settings: JSON.parse(JSON.stringify(original.settings))
    };
    const updated = [...sections];
    updated.splice(index + 1, 0, copy);
    setSections(updated);
    setSelectedSectionId(copy.id);
  };

  const handleDelete = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
    if (selectedSectionId === sections[index].id) {
      setSelectedSectionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const updated = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSections(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.error || 'Failed to save page sections');
      }
    } catch {
      alert('Save operation failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#111] text-gray-300">
        <Loader2 size={28} className="animate-spin text-[#1F6B3B]" />
        <p className="text-sm font-semibold">Loading page builder...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#111] text-gray-200 overflow-hidden font-sans">
      {/* ── Visual Builder Topbar ── */}
      <header className="h-14 shrink-0 bg-neutral-900 border-b border-neutral-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pages" className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">{pageTitle}</h1>
            <p className="text-[10px] text-neutral-500 mt-0.5">Custom Page visual layout editor</p>
          </div>
        </div>

        {/* Viewport controls */}
        <div className="hidden sm:flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded-md transition-all ${viewport === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
            <Monitor size={14} />
          </button>
          <button onClick={() => setViewport('tablet')} className={`p-1.5 rounded-md transition-all ${viewport === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
            <Tablet size={14} />
          </button>
          <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded-md transition-all ${viewport === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>
            <Smartphone size={14} />
          </button>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Check size={12} /> Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#1F6B3B] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-[#154a28] disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </header>

      {/* ── Visual Builder Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Add sections & reordering */}
        <aside className="w-[300px] shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col overflow-y-auto">
          {/* Add Section Library */}
          <div className="p-4 border-b border-neutral-800">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Add Custom Module</h3>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TEMPLATES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    onClick={() => handleAddSection(t.type)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-[#1F6B3B] hover:bg-neutral-900 transition-all text-neutral-300 hover:text-white"
                  >
                    <Icon size={18} className="text-neutral-500 mb-1.5" />
                    <span className="text-[10px] font-bold text-center">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Sections list */}
          <div className="p-4 flex-1">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Sections Hierarchy</h3>
            {sections.length === 0 ? (
              <p className="text-xs text-neutral-500 italic text-center p-4">Add a module above to get started editing</p>
            ) : (
              <div className="space-y-2">
                {sections.map((sec, index) => {
                  const template = SECTION_TEMPLATES.find(t => t.type === sec.type);
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedSectionId === sec.id
                          ? 'border-[#1F6B3B] bg-neutral-950/80 text-white shadow-sm'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-xs font-bold">{template?.label || sec.type}</span>
                      <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); handleMove(index, 'up'); }} disabled={index === 0}>
                          <MoveUp size={12} className="hover:text-white" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleMove(index, 'down'); }} disabled={index === sections.length - 1}>
                          <MoveDown size={12} className="hover:text-white" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDuplicate(index); }}>
                          <Copy size={12} className="hover:text-white" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(index); }} className="hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* MIDDLE COLUMN: Real-time Live Preview */}
        <main className="flex-1 bg-neutral-950 flex flex-col justify-center items-center p-6 overflow-y-auto">
          <div
            className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 overflow-y-auto text-gray-800 flex flex-col`}
            style={{
              width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
              maxWidth: '100%',
              height: '100%',
              aspectRatio: viewport === 'mobile' ? '9/16' : 'auto'
            }}
          >
            {/* Live mockup layout */}
            {sections.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <Layers size={48} className="text-gray-300 mb-3" />
                <p className="text-sm font-semibold">Your Page Canvas is Empty</p>
                <p className="text-xs max-w-xs mt-1">Select and add components from the library sidebar to customize your organic shop campaign.</p>
              </div>
            ) : (
              <div className="flex-1 divide-y divide-gray-100">
                {sections.map(sec => {
                  const s = sec.settings;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`relative group cursor-pointer transition-all border-2 ${
                        selectedSectionId === sec.id ? 'border-[#1F6B3B]' : 'border-transparent hover:border-dashed hover:border-gray-300'
                      }`}
                    >
                      {/* Section mock renderers */}
                      {sec.type === 'hero_banner' && (
                        <div className={`p-12 text-white bg-gradient-to-r ${s.bgGradient} text-center space-y-4 rounded-xl m-2`}>
                          <h2 className="text-3xl font-extrabold">{s.title}</h2>
                          <p className="text-sm text-white/80 max-w-md mx-auto">{s.subtitle}</p>
                          <button className="bg-white text-gray-900 text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm hover:scale-105 transition-all">
                            {s.ctaText}
                          </button>
                        </div>
                      )}

                      {sec.type === 'heading' && (
                        <div className="py-6 text-center m-2">
                          <h2 className={`${s.size} font-extrabold`} style={{ color: settingText(s.color, '#111827') }}>
                            {s.text}
                          </h2>
                        </div>
                      )}

                      {sec.type === 'text_block' && (
                        <div className="p-6 m-2">
                          <p className="text-sm leading-relaxed" style={{ color: settingText(s.color, '#4b5563'), textAlign: settingAlignment(s.alignment) }}>
                            {s.text}
                          </p>
                        </div>
                      )}

                      {sec.type === 'product_grid' && (
                        <div className="p-6 m-2 space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h3 className="font-bold text-sm text-gray-800">{s.title || 'Dynamic Collection'}</h3>
                            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-bold">{s.category}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Array.from({ length: Number(s.limit || 4) }).map((_, i) => (
                              <div key={i} className="border border-gray-150 rounded-xl p-3 bg-gray-50 flex flex-col space-y-2">
                                <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-xl">🌾</div>
                                <div className="space-y-0.5 text-center">
                                  <p className="text-xs font-bold text-gray-700">Millet Crop Pack</p>
                                  <p className="text-[10px] font-bold text-[#1F6B3B]">₹180</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'faq' && (
                        <div className="p-6 m-2 border border-gray-200 rounded-xl bg-gray-50 space-y-2">
                          <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">❓ {s.question}</p>
                          <p className="text-xs text-gray-500 pl-4">{s.answer}</p>
                        </div>
                      )}

                      {sec.type === 'testimonials' && (
                        <div className="p-6 m-2 bg-gradient-to-br from-green-50 to-lime-50 rounded-xl border border-green-100 flex flex-col items-center text-center space-y-2">
                          <p className="text-xs italic text-gray-600">&ldquo;{s.text}&rdquo;</p>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{s.author}</p>
                            <p className="text-[10px] text-gray-400">{s.role}</p>
                          </div>
                        </div>
                      )}

                      {sec.type === 'newsletter' && (
                        <div className="p-8 text-center bg-gray-900 text-white rounded-xl m-2 space-y-3">
                          <p className="text-sm font-bold">{s.title}</p>
                          <div className="flex max-w-xs mx-auto gap-2">
                            <input type="email" placeholder="Enter your email" disabled className="text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg flex-1" />
                            <button className="bg-[#1F6B3B] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">{s.buttonText}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Selected module configuration inspector */}
        <aside className="w-[300px] shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-neutral-800">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Settings size={14} className="text-[#1F6B3B]" />
              Module Inspector
            </h3>
            <p className="text-[10px] text-neutral-500">Configure parameters for the selected canvas row.</p>
          </div>

          {selectedSection ? (
            <div className="p-4 space-y-4">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-bold">Module Type</span>
                <p className="text-xs font-bold text-white mt-0.5">{selectedSection.type.toUpperCase()}</p>
              </div>

              {/* Dynamic properties based on component type */}
              {selectedSection.type === 'hero_banner' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={selectedSection.settings.title || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'title', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Banner Subtitle</label>
                    <textarea
                      rows={2}
                      value={selectedSection.settings.subtitle || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'subtitle', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Button CTA Text</label>
                    <input
                      type="text"
                      value={selectedSection.settings.ctaText || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'ctaText', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Background Gradient</label>
                    <input
                      type="text"
                      value={selectedSection.settings.bgGradient || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'bgGradient', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedSection.type === 'heading' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Heading Text</label>
                    <input
                      type="text"
                      value={selectedSection.settings.text || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'text', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Typography Size</label>
                    <select
                      value={selectedSection.settings.size || 'text-3xl'}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'size', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none text-gray-300"
                    >
                      <option value="text-xl">Small (text-xl)</option>
                      <option value="text-2xl">Medium (text-2xl)</option>
                      <option value="text-3xl">Large (text-3xl)</option>
                      <option value="text-5xl">Extra Large (text-5xl)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Color HEX</label>
                    <input
                      type="color"
                      value={selectedSection.settings.color || '#111827'}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'color', e.target.value)}
                      className="w-full h-8 bg-neutral-950 border border-neutral-800 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {selectedSection.type === 'text_block' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Paragraph Content</label>
                    <textarea
                      rows={4}
                      value={selectedSection.settings.text || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'text', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Text Alignment</label>
                    <select
                      value={selectedSection.settings.alignment || 'left'}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'alignment', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none text-gray-300"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedSection.type === 'product_grid' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Section Title</label>
                    <input
                      type="text"
                      value={selectedSection.settings.title || 'Featured Products'}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'title', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Category Category Filter</label>
                    <input
                      type="text"
                      value={selectedSection.settings.category || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'category', e.target.value)}
                      placeholder="e.g. Millets, Honey"
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Products Limit</label>
                    <input
                      type="number"
                      value={selectedSection.settings.limit || 4}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'limit', Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedSection.type === 'faq' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Question</label>
                    <input
                      type="text"
                      value={selectedSection.settings.question || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'question', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Answer</label>
                    <textarea
                      rows={3}
                      value={selectedSection.settings.answer || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'answer', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {selectedSection.type === 'testimonials' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Quote Text</label>
                    <textarea
                      rows={3}
                      value={selectedSection.settings.text || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'text', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Author Name</label>
                    <input
                      type="text"
                      value={selectedSection.settings.author || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'author', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Role / Subtitle</label>
                    <input
                      type="text"
                      value={selectedSection.settings.role || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'role', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedSection.type === 'newsletter' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Call to Action Title</label>
                    <input
                      type="text"
                      value={selectedSection.settings.title || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'title', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Submit Button Label</label>
                    <input
                      type="text"
                      value={selectedSection.settings.buttonText || ''}
                      onChange={e => handleUpdateSetting(selectedSection.id, 'buttonText', e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:border-[#1F6B3B] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic text-center p-8">No module selected for inspection.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
