import { Monitor, Activity, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export type Tab = 'mypc' | 'monitoring' | 'settings';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'mypc', label: 'Мой ПК', icon: Monitor },
    { id: 'monitoring', label: 'Мониторинг', icon: Activity },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ] as const;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-50">
      <div className="flex items-center justify-around bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-20 h-16 rounded-2xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white/10 rounded-2xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon 
                className={`w-6 h-6 mb-1 z-10 transition-colors duration-300 ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={`text-[10px] font-medium z-10 transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
