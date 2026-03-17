import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScreenProps {
  children: ReactNode;
  title: string;
  headerRight?: ReactNode;
}

export function Screen({ children, title, headerRight }: ScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-full w-full pt-12 px-6 pb-32 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        {headerRight}
      </div>
      <div className="flex-1 flex flex-col gap-6">
        {children}
      </div>
    </motion.div>
  );
}

