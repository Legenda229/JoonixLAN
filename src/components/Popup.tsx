import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Popup({ isOpen, onClose, title, children }: PopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-[#111111]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            {/* Decorative glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
                <button 
                  onClick={onClose} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="text-slate-300 text-sm leading-relaxed">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
