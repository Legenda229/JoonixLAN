/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Background } from './components/Background';
import { BottomNav, Tab } from './components/BottomNav';
import { Onboarding } from './components/Onboarding';
import { SettingsScreen } from './components/SettingsScreen';
import { MyPcScreen } from './components/MyPcScreen';
import { MonitoringScreen } from './components/MonitoringScreen';
import { AnimatePresence, motion } from 'motion/react';
import { lanService } from './services/lanService';
import { Download, X } from 'lucide-react';
import { haptic } from './utils/haptics';

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('mypc');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallHint, setShowInstallHint] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('joonix_onboarded');
    if (saved === 'true') {
      setIsOnboarded(true);
    }
    
    const ip = localStorage.getItem('pc_ip');
    if (ip) {
      setIsConfigured(true);
      // Auto-connect if configured
      const port = localStorage.getItem('pc_port') || '8765';
      const tunnelId = localStorage.getItem('pc_tunnelId') || '';
      lanService.connect(ip, port, tunnelId);
    }

    // PWA Install Prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallHint(true);
    });

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone && !localStorage.getItem('pwa_hint_closed')) {
      setTimeout(() => setShowInstallHint(true), 3000);
    }
  }, []);

  const handleInstallClick = async () => {
    haptic.medium();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallHint(false);
      }
    } else {
      // Show instructions for iOS/other browsers
      alert('Чтобы установить приложение:\n1. Нажмите "Поделиться" (Share)\n2. Выберите "На экран «Домой»" (Add to Home Screen)');
    }
  };

  const closeInstallHint = () => {
    haptic.light();
    setShowInstallHint(false);
    localStorage.setItem('pwa_hint_closed', 'true');
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('joonix_onboarded', 'true');
    setIsOnboarded(true);
  };

  const handleSettingsSaved = () => {
    setIsConfigured(true);
  };

  const handleDisconnect = () => {
    setIsConfigured(false);
    setCurrentTab('settings');
  };

  return (
    <Background>
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isOnboarded ? (
            <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
          ) : (
            <div key="main-content" className="h-full w-full">
              <AnimatePresence>
                {showInstallHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="absolute bottom-24 left-4 right-4 z-[60] bg-indigo-600/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">Установить JoonixLAN</div>
                        <div className="text-indigo-100 text-xs">Для быстрого доступа к ПК</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                      >
                        Установить
                      </button>
                      <button
                        onClick={closeInstallHint}
                        className="p-2 text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={currentTab === 'mypc' ? 'block h-full' : 'hidden'}>
                <MyPcScreen isConfigured={isConfigured} onGoToSettings={() => setCurrentTab('settings')} onDisconnect={handleDisconnect} />
              </div>
              <div className={currentTab === 'monitoring' ? 'block h-full' : 'hidden'}>
                <MonitoringScreen isConfigured={isConfigured} onGoToSettings={() => setCurrentTab('settings')} />
              </div>
              <div className={currentTab === 'settings' ? 'block h-full' : 'hidden'}>
                <SettingsScreen onSave={handleSettingsSaved} isConfigured={isConfigured} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
      {isOnboarded && <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />}
    </Background>
  );
}





