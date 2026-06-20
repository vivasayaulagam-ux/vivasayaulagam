'use client';

import { useRef, useState, useCallback, useEffect, useId } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
  Upload, ImagePlus, FolderOpen, Star, ChevronRight, Edit3, Loader2, Trash2,
} from 'lucide-react';
import { ProductFormData } from '@/app/admin/(dashboard)/products/add/page';
import MediaCustomizeModal, { MediaImage } from './MediaCustomizeModal';
import { normalizeImageUrl, getFullImageUrl } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function getFileType(name: string) {
  return name.split('.').pop()?.toUpperCase() || 'IMG';
}

function today() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function fileToMediaImage(file: File): Promise<MediaImage> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = document.createElement('img');
      img.onload = () => {
        resolve({
          id: generateId(),
          src,
          altText: '',
          fileName: file.name,
          fileType: getFileType(file.name),
          fileSize: formatBytes(file.size),
          resolution: `${img.naturalWidth} × ${img.naturalHeight}`,
          createdDate: today(),
          usedInProducts: 0,
          focusX: 50,
          focusY: 50,
          isFeatured: false,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = { form: ProductFormData; update: (f: Partial<ProductFormData>) => void };

// ─── Thumbnail Card ───────────────────────────────────────────────────────────
function ThumbCard({
  img,
  isFeatured,
  onRemove,
  onEdit,
}: {
  img: MediaImage;
  isFeatured: boolean;
  onRemove: () => void;
  onSetFeatured: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ y: -2, scale: 1.02 }}
      onClick={onEdit}
      className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm cursor-pointer"
    >
      {/* Image */}
      <img src={getFullImageUrl(img.src)} alt={img.altText || img.fileName} className="w-full h-full object-cover" draggable={false} />

      {/* Subtle dark overlay on hover to signal clickability */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200" />

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1.5 right-1.5 z-10 p-1.5 rounded-lg bg-white/95 text-gray-500 hover:text-red-600 hover:bg-white shadow-sm border border-gray-200 md:opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
        title="Remove image"
      >
        <Trash2 size={12} />
      </button>

      {/* Featured badge */}
      {isFeatured && (
        <div className="absolute bottom-1.5 left-1.5">
          <span className="flex items-center gap-0.5 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">
            <Star size={8} className="fill-yellow-400 text-yellow-400" />
            Cover
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MediaUpload({ form, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaImages, setMediaImages] = useState<MediaImage[]>(() => {
    if (form?.images && form.images.length > 0) {
      return form.images.map((src, i) => {
        const cleanSrc = normalizeImageUrl(src);
        return {
          id: `existing-${i}-${Math.random().toString(36).slice(2, 9)}`,
          src: cleanSrc,
          altText: '',
          fileName: cleanSrc.split('/').pop() || `image-${i}`,
          fileType: cleanSrc.split('.').pop()?.toUpperCase() || 'IMG',
          fileSize: '—',
          resolution: '—',
          createdDate: today(),
          usedInProducts: 1,
          focusX: 50,
          focusY: 50,
          isFeatured: i === 0,
        };
      });
    }
    return [];
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const dropId = useId();

  // Keep internal mediaImages state in sync if form.images has items but mediaImages is empty
  // (e.g. if loaded asynchronously after mount)
  useEffect(() => {
    if (form?.images && form.images.length > 0 && mediaImages.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMediaImages(
        form.images.map((src, i) => {
          const cleanSrc = normalizeImageUrl(src);
          return {
            id: `existing-${i}-${Math.random().toString(36).slice(2, 9)}`,
            src: cleanSrc,
            altText: '',
            fileName: cleanSrc.split('/').pop() || `image-${i}`,
            fileType: cleanSrc.split('.').pop()?.toUpperCase() || 'IMG',
            fileSize: '—',
            resolution: '—',
            createdDate: today(),
            usedInProducts: 1,
            focusX: 50,
            focusY: 50,
            isFeatured: i === 0,
          };
        })
      );
    }
  }, [form?.images]);

  // ── Sync local mediaImages → parent form.images after every change ──────────
  // IMPORTANT: never call update() inside a setState functional updater —
  // that triggers setState-during-render. useEffect runs after the render.
  useEffect(() => {
    update({ images: mediaImages.map((m) => m.src) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaImages]);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newImgs = await Promise.all(
        Array.from(files).map(async (file) => {
          try {
            // Post file to upload api
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/admin/upload', {
              method: 'POST',
              body: fd,
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            if (!data.success || !data.url) throw new Error(data.error || 'Upload failed');
            
            const fileUrl = data.url;
            return new Promise<MediaImage>((resolve) => {
              const img = document.createElement('img');
              img.onload = () => {
                resolve({
                  id: generateId(),
                  src: fileUrl,
                  altText: '',
                  fileName: file.name,
                  fileType: getFileType(file.name),
                  fileSize: formatBytes(file.size),
                  resolution: `${img.naturalWidth} × ${img.naturalHeight}`,
                  createdDate: today(),
                  usedInProducts: 0,
                  focusX: 50,
                  focusY: 50,
                  isFeatured: false,
                });
              };
              img.src = fileUrl;
            });
          } catch (err: any) {
            console.error('Error uploading file:', file.name, err);
            alert(`Failed to upload ${file.name}: ${err.message || 'Unknown error'}`);
            return null;
          }
        })
      );

      const validNewImgs = newImgs.filter((img): img is MediaImage => img !== null);
      if (validNewImgs.length > 0) {
        setMediaImages((prev) => [...prev, ...validNewImgs]);
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('An error occurred during file upload');
    } finally {
      setUploading(false);
    }
  }, []);

  const removeImage = (id: string) => {
    setMediaImages((prev) => prev.filter((m) => m.id !== id));
  };

  const setFeatured = (id: string) => {
    setMediaImages((prev) => prev.map((m) => ({ ...m, isFeatured: m.id === id })));
  };

  const openEdit = (idx: number) => {
    setActiveIdx(idx);
    setModalOpen(true);
  };

  const handleReorder = (newOrder: MediaImage[]) => {
    setMediaImages(newOrder);
  };

  const handleModalSave = (updated: MediaImage[]) => {
    setMediaImages(updated);
    setModalOpen(false);
  };

  const featured = mediaImages.find((m) => m.isFeatured) || mediaImages[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Media</h2>
          {mediaImages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => openEdit(0)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Edit3 size={12} />
              Edit media
              <ChevronRight size={11} className="text-gray-400" />
            </motion.button>
          )}
        </div>

        {/* ── Drop Zone ──────────────────────────────────────────────── */}
        <div
          id={dropId}
          role="button"
          tabIndex={0}
          aria-label="Upload media files"
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!uploading) processFiles(e.dataTransfer.files); }}
          onClick={() => { if (!uploading) fileRef.current?.click(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !uploading) fileRef.current?.click(); }}
          className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
            uploading
              ? 'border-gray-300 bg-gray-50/50 cursor-not-allowed opacity-70'
              : dragging
              ? 'border-gray-900 bg-gray-50 scale-[1.01]'
              : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/60'
          }`}
        >
          <motion.div
            animate={{ y: dragging ? -3 : 0 }}
            className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center ${
              uploading ? 'bg-gray-200' : dragging ? 'bg-gray-900' : 'bg-gray-100'
            } transition-colors`}
          >
            {uploading ? (
              <Loader2 size={18} className="text-gray-500 animate-spin" />
            ) : (
              <Upload size={18} className={dragging ? 'text-white' : 'text-gray-500'} />
            )}
          </motion.div>
          <p className="text-sm font-semibold text-gray-700">
            {uploading ? 'Uploading files...' : dragging ? 'Drop to upload' : 'Drop files to upload'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">or use the buttons below</p>

          <div className="flex justify-center gap-2.5 mt-4">
            <button
              type="button"
              disabled={uploading}
              onClick={(e) => { e.stopPropagation(); if (!uploading) fileRef.current?.click(); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImagePlus size={13} />
              Upload files
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mt-3">
            JPG, PNG, WEBP, SVG · up to 20 MB each
          </p>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>

        {/* ── Image Grid ────────────────────────────────────────────── */}
        <AnimatePresence>
          {mediaImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              {/* Featured hint */}
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] text-gray-400 font-medium">
                  {mediaImages.length} file{mediaImages.length !== 1 ? 's' : ''} ·{' '}
                  <span className="text-gray-500">Drag to reorder</span>
                </p>
                {featured && (
                  <span className="text-[11px] text-gray-500">
                    Cover:{' '}
                    <span className="font-medium text-gray-700 truncate max-w-[120px] inline-block align-bottom">
                      {featured.fileName}
                    </span>
                  </span>
                )}
              </div>

              {/* Reorderable grid */}
              <Reorder.Group
                axis="x"
                values={mediaImages}
                onReorder={handleReorder}
                className="grid grid-cols-4 gap-3"
              >
                <AnimatePresence>
                  {mediaImages.map((img, i) => (
                    <Reorder.Item key={img.id} value={img} className="list-none">
                      <ThumbCard
                        img={img}
                        isFeatured={img.isFeatured || i === 0}
                        onRemove={() => removeImage(img.id)}
                        onSetFeatured={() => setFeatured(img.id)}
                        onEdit={() => openEdit(i)}
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>

              {/* Alt-text progress */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500 rounded-full"
                    animate={{
                      width: `${(mediaImages.filter((m) => m.altText).length / mediaImages.length) * 100}%`,
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {mediaImages.filter((m) => m.altText).length}/{mediaImages.length} alt texts
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Media Customize Modal ─────────────────────────────────────── */}
      {modalOpen && mediaImages.length > 0 && (
        <MediaCustomizeModal
          images={mediaImages}
          activeIndex={activeIdx}
          onClose={() => setModalOpen(false)}
          onSave={handleModalSave}
        />
      )}
    </>
  );
}
