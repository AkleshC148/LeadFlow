"use client";

import React from "react";

export function LiquidBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#070611]"
    >
      {/* Base radial ambient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 10%, #1e1b4b 0%, #0f0e26 40%, #070611 100%)",
        }}
      />

      {/* Floating blurred mesh orbs */}
      {/* Orb 1: Deep Violet / Indigo */}
      <div
        className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full bg-violet-600/30 blur-[120px] animate-orb-1"
      />

      {/* Orb 2: Bright Cyan */}
      <div
        className="absolute top-1/4 -right-20 w-[28rem] h-[28rem] rounded-full bg-cyan-500/25 blur-[110px] animate-orb-2"
      />

      {/* Orb 3: Deep Indigo */}
      <div
        className="absolute -bottom-32 left-1/4 w-[36rem] h-[36rem] rounded-full bg-indigo-700/30 blur-[130px] animate-orb-3"
      />

      {/* Orb 4: Subtle Pink / Magenta Accent */}
      <div
        className="absolute top-1/2 left-2/3 w-[26rem] h-[26rem] rounded-full bg-pink-500/18 blur-[100px] animate-orb-1"
      />

      {/* Fine glass specular noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
