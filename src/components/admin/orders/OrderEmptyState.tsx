"use client";

import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function OrderEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-24 px-6"
    >
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Outer glow rings */}
        <div className="absolute inset-0 rounded-full bg-[#34a121]/5 scale-150 animate-pulse" />
        <div className="absolute inset-0 rounded-full bg-[#34a121]/8 scale-125" />

        {/* Icon container */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border-2 border-[#34a121]/15 flex items-center justify-center">
          {/* Decorative floating dots */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-[#C9A227] rounded-full opacity-60"
          />
          <motion.div
            animate={{ y: [4, -4, 4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -bottom-1 -left-3 w-3.5 h-3.5 bg-[#34a121] rounded-full opacity-40"
          />
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-2 -left-4 w-2.5 h-2.5 bg-[#2563eb] rounded-full opacity-30"
          />

          <ShoppingBag size={44} className="text-[#34a121]" strokeWidth={1.5} />
        </div>

        {/* Small package boxes around */}
        {[
          { top: "-8px", left: "90px", size: "22px", delay: 0 },
          { top: "80px", left: "100px", size: "16px", delay: 0.3 },
          { top: "90px", left: "-12px", size: "18px", delay: 0.6 },
        ].map((box, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + box.delay, duration: 0.4, type: "spring" }}
            style={{
              position: "absolute",
              top: box.top,
              left: box.left,
              width: box.size,
              height: box.size,
            }}
            className="bg-white border-2 border-[#e5e5e5] rounded-lg shadow-sm flex items-center justify-center text-[10px]"
          >
            📦
          </motion.div>
        ))}
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-center max-w-xs"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Your orders will show here
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          When customers place orders, they&apos;ll appear here for you to manage,
          fulfill, and track.
        </p>
      </motion.div>

      {/* Dashed line suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col gap-2 w-full max-w-xs"
      >
        {["Share your store link", "Add your first product", "Set up payments"].map(
          (tip, i) => (
            <motion.div
              key={tip}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.1 }}
              className="flex items-center gap-2.5 p-3 bg-gray-50/80 border border-dashed border-gray-200 rounded-xl text-sm text-gray-500 group hover:bg-white hover:border-[#34a121]/30 hover:text-[#34a121] transition-all cursor-default"
            >
              <span className="w-5 h-5 flex items-center justify-center bg-gray-100 group-hover:bg-[#34a121]/10 rounded-full text-[11px] font-bold text-gray-400 group-hover:text-[#34a121] transition-colors">
                {i + 1}
              </span>
              {tip}
              <ArrowRight
                size={13}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </motion.div>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
