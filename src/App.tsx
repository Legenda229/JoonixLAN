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
import { AnimatePresence } from 'motion/react';
import { lanService } from './services/lanService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('mypc');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

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
  }, []);

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





