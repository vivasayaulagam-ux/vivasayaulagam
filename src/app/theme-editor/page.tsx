'use client';

import Link from 'next/link';

export default function ThemeEditorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F6F1] text-gray-900 font-sans p-6 text-center">
      <span className="text-5xl mb-4 select-none">🎨</span>
      <h1 className="text-2xl font-bold mb-2 font-heading text-gray-800">Theme Editor Under Construction</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        This custom theme customizer is currently under construction. Please use the CMS Settings tab in the Admin panel to configure all sections and layouts.
      </p>
      <Link 
        href="/admin" 
        className="bg-[#34a121] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-[#154a28] transition-all duration-200"
      >
        Return to Admin Dashboard
      </Link>
    </div>
  );
}
