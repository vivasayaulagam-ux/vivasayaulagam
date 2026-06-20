'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Crop, Maximize2,
  PenLine, Info, ChevronLeft, ChevronRight, Undo2,
  Redo2, MoreHorizontal, Save, Trash2, ZoomIn, ZoomOut,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MediaImage {
  id: string;
  src: string;
  altText: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  resolution: string;
  createdDate: string;
  usedInProducts: number;
  focusX: number; // 0–100
  focusY: number; // 0–100
  isFeatured: boolean;
}

interface Props {
  images: MediaImage[];
  activeIndex: number;
  onClose: () => void;
  onSave: (images: MediaImage[]) => void;
}



// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function MediaCustomizeModal({ images, activeIndex, onClose, onSave }: Props) {
  const [imgs, setImgs] = useState<MediaImage[]>(images);
  const [idx, setIdx] = useState(activeIndex);
  const [zoomById, setZoomById] = useState<Record<string, number>>({});
  const [draggingFocus, setDraggingFocus] = useState(false);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const img = imgs[idx];
  const zoom = img ? zoomById[img.id] ?? 1 : 1;

  const setCurrentZoom = useCallback((updater: (value: number) => number) => {
    if (!img) return;
    setZoomById((prev) => ({
      ...prev,
      [img.id]: updater(prev[img.id] ?? 1),
    }));
  }, [img]);

  const updateImg = useCallback((patch: Partial<MediaImage>) => {
    setImgs((prev) => prev.map((im, i) => (i === idx ? { ...im, ...patch } : im)));
  }, [idx]);

  // Focus point drag
  const handleFocusDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!imgContainerRef.current) return;
      const rect = imgContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      updateImg({ focusX: x, focusY: y });
    },
    [updateImg]
  );

  const handleSave = () => onSave(imgs);

  const handleDelete = () => {
    if (!img) return;
    
    // Create new array excluding current image
    const updatedImgs = imgs.filter((_, i) => i !== idx);
    
    if (updatedImgs.length === 0) {
      onSave([]);
      onClose();
      return;
    }

    // If we deleted the featured image, make the first image featured
    const wasFeatured = img.isFeatured;
    const cleanedImgs = updatedImgs.map((im, i) => {
      if (wasFeatured && i === 0) {
        return { ...im, isFeatured: true };
      }
      return im;
    });

    setImgs(cleanedImgs);
    
    // Adjust index to stay within valid range
    if (idx >= cleanedImgs.length) {
      setIdx(cleanedImgs.length - 1);
    }
  };

  if (!img) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="media-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col"
        style={{ background: '#050505' }}
      >
        {/* Dot-grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-3 border-b border-white/[0.07]">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <span
            className="text-[13px] text-white/50 truncate max-w-[300px] hidden sm:block"
            title={img.fileName}
          >
            {img.fileName}
          </span>

          {/* Image nav */}
          {imgs.length > 1 && (
            <div className="flex items-center gap-1 ml-auto mr-auto">
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[12px] text-white/40 px-2">
                {idx + 1} / {imgs.length}
              </span>
              <button
                onClick={() => setIdx((i) => Math.min(imgs.length - 1, i + 1))}
                disabled={idx === imgs.length - 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <Undo2 size={15} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <Redo2 size={15} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <MoreHorizontal size={15} />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-white/15 text-white/60 text-[12px] font-medium hover:bg-white/10 transition-colors"
            >
              Discard
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black text-[12px] font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              <Save size={13} />
              Save
            </motion.button>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 relative z-10">
          {/* Left – Image Preview (75%) */}
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Zoom controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1 z-20">
              <button
                onClick={() => setCurrentZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors border border-white/10"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setCurrentZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors border border-white/10"
              >
                <ZoomOut size={14} />
              </button>
            </div>

            {/* Focus point hint */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                <motion.div
                  className="w-2.5 h-2.5 rounded-full border-2 border-blue-400"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[11px] text-white/70">
                  Click or drag to change focal point
                </span>
                {img.focusX !== 50 || img.focusY !== 50 ? (
                  <button
                    onClick={() => updateImg({ focusX: 50, focusY: 50 })}
                    className="text-[10px] text-red-400 hover:text-red-300 font-medium ml-1"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            {/* Image Container */}
            <div
              ref={imgContainerRef}
              className="relative select-none cursor-crosshair"
              style={{
                width: 'min(520px, 80%)',
                maxHeight: 'calc(100vh - 180px)',
                aspectRatio: '4/5',
              }}
              onMouseMove={(e) => draggingFocus && handleFocusDrag(e)}
              onMouseDown={(e) => { setDraggingFocus(true); handleFocusDrag(e); }}
              onMouseUp={() => setDraggingFocus(false)}
              onMouseLeave={() => setDraggingFocus(false)}
            >
              {/* soft glow behind image */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  boxShadow: '0 0 80px 12px rgba(255,255,255,0.03)',
                }}
              />
              <motion.img
                src={img.src}
                alt={img.altText || img.fileName}
                className="w-full h-full object-contain rounded-2xl"
                style={{ scale: zoom }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                draggable={false}
              />

              {/* Focus point indicator */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  left: `${img.focusX}%`,
                  top: `${img.focusY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{ scale: draggingFocus ? 1.4 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {/* Outer ring */}
                <div className="absolute -inset-4 rounded-full border-2 border-blue-400/40" />
                {/* Inner dot */}
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50" />
                {/* Crosshair lines */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-px bg-white/40 -translate-x-1/2 relative left-1/2" />
                  <div className="w-px h-8 bg-white/40 -translate-y-full relative left-[3px] -mt-4" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right – Controls Sidebar (25%) */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-[300px] shrink-0 border-l border-white/[0.07] flex flex-col overflow-y-auto"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex-1 p-4 space-y-5 overflow-y-auto">

              {/* ── Image Information ─────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <Info size={12} className="text-white/30" />
                  <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                    Image Information
                  </h3>
                </div>

                {/* File Name */}
                <div className="mb-3">
                  <label className="block text-[11px] text-white/50 mb-1.5 font-medium">
                    File Name
                  </label>
                  <input
                    value={img.fileName}
                    onChange={(e) => updateImg({ fileName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all truncate"
                  />
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-[11px] text-white/50 mb-1.5 font-medium">
                    Alt Text
                  </label>
                  <textarea
                    value={img.altText}
                    onChange={(e) => updateImg({ altText: e.target.value })}
                    placeholder="Enter SEO-friendly alt text"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder-white/20 outline-none resize-none focus:border-white/25 focus:bg-white/[0.07] transition-all"
                  />
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* ── Image Details ─────────────────────────────────────── */}
              <section>
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">
                  Details
                </h3>
                <dl className="space-y-2">
                  {[
                    { label: 'File type', value: img.fileType },
                    { label: 'Resolution', value: img.resolution },
                    { label: 'File size', value: img.fileSize },
                    { label: 'Added', value: img.createdDate },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <dt className="text-[11px] text-white/35">{label}</dt>
                      <dd className="text-[11px] text-white/65 font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>

                {img.usedInProducts > 0 && (
                  <div className="mt-3">
                    <span className="text-[11px] text-white/35">Used in </span>
                    <button className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
                      Products ({img.usedInProducts})
                    </button>
                  </div>
                )}
              </section>

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* ── Media Tools ───────────────────────────────────────── */}
              <section>
                <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">
                  Media Tools
                </h3>
                <div className="space-y-1.5">
                  {[
                    { icon: Crop, label: 'Crop and transform' },
                    { icon: Maximize2, label: 'Resize' },
                    { icon: PenLine, label: 'Draw' },
                  ].map(({ icon: Icon, label }) => (
                    <motion.button
                      key={label}
                      whileHover={{ x: 2 }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 text-[12px] text-white/60 hover:text-white/90 transition-all group"
                    >
                      <Icon size={13} className="text-white/35 group-hover:text-white/60 transition-colors" />
                      {label}
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* ── Featured Toggle ───────────────────────────────────── */}
              <div className="h-px bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/50">Set as featured image</span>
                <button
                  onClick={() => updateImg({ isFeatured: !img.isFeatured })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    img.isFeatured ? 'bg-blue-500' : 'bg-white/15'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                    animate={{ left: img.isFeatured ? '18px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Bottom – Delete */}
            <div className="p-4 border-t border-white/[0.06]">
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[12px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <Trash2 size={13} />
                Delete image
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
