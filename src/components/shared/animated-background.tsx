"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Primary orange glow - top right */}
      <motion.div
        className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(circle, #FF7A00 0%, transparent 70%)",
        }}
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary orange glow - left center */}
      <motion.div
        className="absolute top-1/3 -left-48 h-[600px] w-[600px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #FF7A00 0%, transparent 70%)",
        }}
        animate={{ x: [0, 30, 0], y: [0, 40, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle blue accent - bottom */}
      <motion.div
        className="absolute -bottom-40 right-1/3 h-[400px] w-[400px] rounded-full opacity-[0.02]"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
        }}
        animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fine grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
