'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Upload, File, Search, Trash, Grid, List, Eye } from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  uploadedAt: string;
}

const INITIAL_MEDIA: MediaFile[] = [
  { id: '1', name: 'foxtail-millet-vermicelli.jpg', type: 'image/jpeg', size: '142 KB', url: '🌾', uploadedAt: '19 May 2026' },
  { id: '2', name: 'forest-honey-banner.png', type: 'image/png', size: '2.4 MB', url: '🍯', uploadedAt: '18 May 2026' },
  { id: '3', name: 'palm-jaggery-box.jpg', type: 'image/jpeg', size: '89 KB', url: '🌿', uploadedAt: '16 May 2026' },
  { id: '4', name: 'desi-cow-ghee-pack.jpg', type: 'image/jpeg', size: '210 KB', url: '🥛', uploadedAt: '15 May 2026' },
  { id: '5', name: 'newsletter-popup-bg.jpg', type: 'image/jpeg', size: '1.2 MB', url: '🌸', uploadedAt: '12 May 2026' },
];

export default function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [mediaList, setMediaList] = useState<MediaFile[]>(INITIAL_MEDIA);

  const filtered = mediaList.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleUpload = () => {
    const name = prompt('Enter a file name for the simulation image upload:');
    if (!name) return;
    const newFile: MediaFile = {
      id: String(mediaList.length + 1),
      name: name.endsWith('.jpg') || name.endsWith('.png') ? name : `${name}.jpg`,
      type: 'image/jpeg',
      size: '120 KB',
      url: '📦',
      uploadedAt: 'Today',
    };
    setMediaList([newFile, ...mediaList]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this media asset permanently?')) {
      setMediaList(mediaList.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500">Upload, organize, and manage image and video assets for your site</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          className="flex items-center gap-2 bg-[#1F6B3B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-[#154a28] transition-all"
        >
          <Upload size={16} />
          Upload Files
        </motion.button>
      </div>

      {/* Grid search and view filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search file assets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#1F6B3B] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(m => (
            <div
              key={m.id}
              className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all bg-gray-50 relative flex flex-col items-center justify-center p-4 aspect-square"
            >
              <div className="text-4xl select-none mb-3">{m.url}</div>
              <div className="w-full text-center space-y-0.5">
                <p className="text-xs font-bold text-gray-700 truncate px-1">{m.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{m.size}</p>
              </div>
              
              {/* Overlay tools */}
              <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                <button
                  onClick={() => alert(`Viewing file URL: ${m.name}`)}
                  className="p-2 bg-white text-gray-700 hover:text-gray-900 rounded-lg shadow-sm hover:scale-105 transition-all"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-2 bg-white text-red-600 hover:text-red-800 rounded-lg shadow-sm hover:scale-105 transition-all"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
