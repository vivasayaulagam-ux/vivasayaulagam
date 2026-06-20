"use client";

import { motion } from "framer-motion";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ message = "Loading...", fullScreen = false }: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm" : "min-h-[300px] w-full"
      }`}
    >
      {/* Animated leaf spinner */}
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-0 h-5 w-2.5 -translate-x-1/2 rounded-full bg-[#34a121]"
              style={{
                transformOrigin: "center 32px",
                transform: `translateX(-50%) rotate(${i * 90}deg)`,
                opacity: 0.25 + i * 0.25,
              }}
            />
          ))}
        </motion.div>
        <span className="absolute inset-0 flex items-center justify-center text-lg">🌿</span>
      </div>

      {/* Pulsing text */}
      <motion.p
        className="text-sm font-semibold text-[#34a121]/70 tracking-wide"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {message}
      </motion.p>
    </div>
  );
}
