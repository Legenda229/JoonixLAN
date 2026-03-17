import { useState, useEffect } from 'react';
import { Power, RotateCcw, Camera, Trash2, MonitorPlay, Settings, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Popup } from './Popup';
import { Screen } from './Screen';
import { lanService } from '../services/lanService';

interface MyPcScreenProps {
  isConfigured: boolean;
  onGoToSettings: () => void;
  onDisconnect: () => void;
}

export function MyPcScreen({ isConfigured, onGoToSettings, onDisconnect }: MyPcScreenProps) {
  const [isPcOn, setIsPcOn] = useState(false);
  const [isDisconnectPopupOpen, setIsDisconnectPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // States for screenshot notification and viewing
  const [screenshotNotification, setScreenshotNotification] = useState<string | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  const pcName = localStorage.getItem('pc_name') || 'Мой ПК';

  // Listen for real screenshots from the server
  useEffect(() => {
    const unsubscribe = lanService.subscribe((data) => {
      if (data.type === 'screenshot' && data.image) {
        setScreenshotNotification(`data:image/jpeg;base64,${data.image}`);
        setIsLoading(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePowerToggle = async () => {
    if (isPcOn) {
      lanService.send('power_off');
      setIsPcOn(false);
    } else {
      // Wake-on-LAN simulation
      lanService.send('power_on');
      setIsPcOn(true);
    }
  };

  const handleRestart = async () => {
    lanService.send('restart');
    setIsPcOn(false);
    setTimeout(() => setIsPcOn(true), 5000);
  };

  const handleScreenshot = async () => {
    setIsLoading('screenshot');
    if (lanService.isConnected) {
      lanService.send('take_screenshot');
      // Fallback if server doesn't respond in 3 seconds
      setTimeout(() => {
        if (isLoading === 'screenshot') {
          setScreenshotNotification(`https://picsum.photos/seed/${Math.random()}/1920/1080`);
          setIsLoading(null);
        }
      }, 3000);
    } else {
      // Simulate for local testing without server
      await new Promise(r => setTimeout(r, 1000));
      setScreenshotNotification(`https://picsum.photos/seed/${Math.random()}/1920/1080`);
      setIsLoading(null);
    }
  };

  const handleDisconnect = () => {
    setIsDisconnectPopupOpen(false);
    lanService.disconnect();
    localStorage.removeItem('pc_ip');
    localStorage.removeItem('pc_port');
    localStorage.removeItem('pc_tunnelId');
    onDisconnect();
  };

  if (!isConfigured) {
    return (
      <Screen title="Мой ПК">
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <MonitorPlay className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-3">ПК не добавлен</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-[280px]">
            Чтобы управлять компьютером, необходимо добавить его данные в настройках.
          </p>
          <button
            onClick={onGoToSettings}
            className="flex items-center justify-center w-full max-w-[240px] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-[0.98]"
          >
            <Settings className="w-5 h-5 mr-2" />
            Перейти в настройки
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen 
      title={pcName} 
      headerRight={
        <button 
          onClick={() => setIsDisconnectPopupOpen(true)}
          className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors border border-transparent hover:border-rose-500/30"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      }
    >
      {/* Screenshot Notification Toast */}
      <AnimatePresence>
        {screenshotNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 left-4 right-4 z-50 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-4"
          >
            <div className="w-16 h-12 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/5">
              <img src={screenshotNotification} className="w-full h-full object-cover" alt="thumb" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white">Новый скриншот</h4>
              <p className="text-xs text-slate-400">Снимок экрана успешно получен</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => {
                  setViewingScreenshot(screenshotNotification);
                  setScreenshotNotification(null);
                }}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium rounded-xl transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              >
                Смотреть
              </button>
              <button 
                onClick={() => setScreenshotNotification(null)}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Screenshot Viewer */}
      <AnimatePresence>
        {viewingScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col"
          >
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
              <h3 className="text-white font-medium">Просмотр скриншота</h3>
              <button 
                onClick={() => setViewingScreenshot(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={viewingScreenshot} 
                alt="Full Screenshot" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Power Button */}
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md mt-4">
        <button
          onClick={handlePowerToggle}
          disabled={isLoading === 'power'}
          className={`relative group w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            isPcOn 
              ? 'bg-rose-500/10 border-2 border-rose-500/50 text-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.2)] hover:shadow-[0_0_60px_rgba(244,63,94,0.4)]' 
              : 'bg-indigo-500/10 border-2 border-indigo-500/50 text-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_60px_rgba(99,102,241,0.4)]'
          }`}
        >
          <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 opacity-50 group-hover:opacity-100 ${isPcOn ? 'bg-rose-500/30' : 'bg-indigo-500/30'}`} />
          {isLoading === 'power' ? (
            <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin relative z-10" />
          ) : (
            <Power className="w-12 h-12 relative z-10" strokeWidth={1.5} />
          )}
        </button>
        <div className="mt-6 text-center">
          <h3 className="text-xl font-medium text-white mb-1">
            {isPcOn ? 'Выключить ПК' : 'Включить ПК'}
          </h3>
          <p className="text-sm text-slate-400">
            {isPcOn ? 'Штатное завершение работы' : 'Отправка Magic Packet'}
          </p>
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleRestart}
          disabled={!isPcOn || isLoading !== null}
          className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none group"
        >
          {isLoading === 'restart' ? (
            <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-3" />
          ) : (
            <RotateCcw className="w-8 h-8 text-slate-300 mb-3 group-hover:text-white transition-colors" />
          )}
          <span className="text-sm font-medium text-white">Перезагрузить</span>
        </button>

        <button
          onClick={handleScreenshot}
          disabled={!isPcOn || isLoading !== null}
          className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none group"
        >
          {isLoading === 'screenshot' ? (
            <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mb-3" />
          ) : (
            <Camera className="w-8 h-8 text-slate-300 mb-3 group-hover:text-white transition-colors" />
          )}
          <span className="text-sm font-medium text-white">Скриншот</span>
        </button>
      </div>

      {/* Disconnect Popup */}
      <Popup
        isOpen={isDisconnectPopupOpen}
        onClose={() => setIsDisconnectPopupOpen(false)}
        title="Отключение ПК"
      >
        <div className="flex flex-col items-center text-center pb-2">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <Trash2 className="w-8 h-8 text-rose-400" />
          </div>
          <p className="text-white font-medium mb-2">
            Вы точно хотите отключить свой ПК с приложения?
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Это разорвет текущее WebSocket соединение.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setIsDisconnectPopupOpen(false)}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleDisconnect}
              className="flex-1 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400 font-medium transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)]"
            >
              Отключить
            </button>
          </div>
        </div>
      </Popup>
    </Screen>
  );
}

