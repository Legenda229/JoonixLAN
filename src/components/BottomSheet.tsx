import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[2rem] p-6 pb-12 max-h-[85vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Drag Handle (Visual only for now) */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
              <button 
                onClick={onClose} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="text-slate-300 text-sm leading-relaxed">
              {children}
            </div>
            
            <button
              onClick={onClose}
              className="mt-8 w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            >
              Понятно
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
