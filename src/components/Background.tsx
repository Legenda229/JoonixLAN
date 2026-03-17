import { ReactNode } from 'react';

export function Background({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-sans selection:bg-indigo-500/30">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black"></div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-indigo-600/20 blur-[100px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-purple-600/20 blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-rose-600/10 blur-[120px] animate-blob animation-delay-4000" />

      {/* Subtle Noise Texture Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen w-full max-w-md mx-auto overflow-hidden">
        {children}
      </div>
    </div>
  );
}
