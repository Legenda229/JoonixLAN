import React from 'react';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050505]">
      {/* Animated Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-indigo-600/20 blur-[100px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-purple-600/20 blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-rose-600/10 blur-[120px] animate-blob animation-delay-4000" />
      
      {/* Subtle Noise/Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
}
