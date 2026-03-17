import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Keyboard, MousePointer2, Activity, Settings, Maximize, Minimize, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from './Screen';
import { lanService } from '../services/lanService';

interface MonitoringScreenProps {
  isConfigured: boolean;
  onGoToSettings: () => void;
}

export function MonitoringScreen({ isConfigured, onGoToSettings }: MonitoringScreenProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Высокопроизводительная подписка на кадры (без React State)
  useEffect(() => {
    const unsubscribe = lanService.subscribe((data) => {
      if (data.type === 'frame' && imgRef.current && isStreaming) {
        // Прямое обновление DOM для максимальной производительности (60 FPS без лагов React)
        imgRef.current.src = `data:image/jpeg;base64,${data.image}`;
      }
    });
    return () => unsubscribe();
  }, [isStreaming]);

  // Отслеживание изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Перехват клавиатуры ТОЛЬКО в полноэкранном режиме
  useEffect(() => {
    if (!isFullscreen || !isStreaming) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      lanService.send('keydown', { key: e.key });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      lanService.send('keyup', { key: e.key });
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isFullscreen, isStreaming]);

  const toggleStream = async () => {
    if (isStreaming) {
      lanService.send('stop_stream');
      setIsStreaming(false);
      if (isFullscreen) {
        try { await document.exitFullscreen(); } catch (e) {}
      }
    } else {
      if (!lanService.isConnected) {
        alert('Сначала подключитесь к ПК в Настройках!');
        return;
      }
      setIsLoading(true);
      lanService.send('start_stream', { quality: 50 }); // Initial quality
      setTimeout(() => {
        setIsStreaming(true);
        setIsLoading(false);
      }, 600);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        try {
          await containerRef.current.requestFullscreen();
          try { await (screen.orientation as any).lock('landscape'); } catch (e) {}
        } catch (e) { console.error('Fullscreen error:', e); }
      }
    } else {
      try {
        await document.exitFullscreen();
        try { screen.orientation.unlock(); } catch (e) {}
      } catch (e) { console.error('Exit fullscreen error:', e); }
    }
  };

  // Управление мышью
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isStreaming || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    lanService.send('mouse_move', { x, y });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isStreaming) return;
    const button = e.button === 0 ? 0 : 1;
    lanService.send('mouse_click', { button, action: 'down' });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isStreaming) return;
    const button = e.button === 0 ? 0 : 1;
    lanService.send('mouse_click', { button, action: 'up' });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Блокируем стандартное меню браузера
  };

  const handleMobileKeyboardClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isConfigured) {
    return (
      <Screen title="Мониторинг">
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <Activity className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-xl font-medium text-white mb-3">ПК не добавлен</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-[280px]">
            Чтобы начать трансляцию экрана, необходимо добавить данные ПК в настройках.
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
    <Screen title="Мониторинг">
      <div className="flex flex-col gap-4 h-full">
        
        {/* Контейнер трансляции */}
        <div 
          ref={containerRef}
          className={`relative w-full bg-[#050505] overflow-hidden transition-all duration-300 ${
            isFullscreen 
              ? 'fixed inset-0 z-50 flex items-center justify-center' 
              : 'aspect-[4/3] sm:aspect-video rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Видеопоток */}
          <img 
            ref={imgRef}
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" // Прозрачный пиксель по умолчанию
            alt="PC Stream" 
            className={`w-full h-full object-contain transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onContextMenu={handleContextMenu}
            style={{ touchAction: 'none' }} // Блокируем скролл при свайпах по видео
          />

          {/* Анимация и оверлей при остановке */}
          <AnimatePresence>
            {!isStreaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                  <Activity className="w-16 h-16 text-indigo-400/50 relative z-10 mb-4" />
                </div>
                <p className="text-white font-medium text-lg tracking-wide">Трансляция остановлена</p>
                <p className="text-slate-400 text-sm mt-2 max-w-[250px] text-center">
                  Нажмите "Запустить", чтобы начать захват экрана с максимальной оптимизацией.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Элементы управления внутри плеера */}
          <AnimatePresence>
            {isStreaming && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Индикатор LIVE */}
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-rose-500/20 border border-rose-500/50 rounded-full flex items-center backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse mr-2" />
                  <span className="text-rose-200 text-xs font-bold tracking-wider">LIVE</span>
                </div>

                {/* Кнопка Fullscreen (если не в Fullscreen) */}
                {!isFullscreen && (
                  <button 
                    onClick={toggleFullscreen}
                    className="absolute bottom-4 right-4 p-3 bg-black/50 hover:bg-black/70 border border-white/10 rounded-xl backdrop-blur-md text-white pointer-events-auto transition-colors"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                )}

                {/* Панель управления в Fullscreen */}
                {isFullscreen && (
                  <div className="absolute top-4 left-4 flex gap-3 pointer-events-auto opacity-30 hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={toggleFullscreen}
                      className="p-3 bg-black/60 border border-white/20 rounded-xl backdrop-blur-md text-white hover:bg-white/10 transition-colors"
                    >
                      <Minimize className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleMobileKeyboardClick}
                      className="p-3 bg-black/60 border border-white/20 rounded-xl backdrop-blur-md text-white hover:bg-white/10 transition-colors"
                    >
                      <Keyboard className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Панель управления (видна только вне Fullscreen) */}
        {!isFullscreen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 mt-2"
          >
            {/* Инфо об адаптивном качестве */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mr-3 border border-indigo-500/30">
                  <Wifi className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Адаптивное качество</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Авто-настройка под ваш интернет</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
                ACTIVE
              </div>
            </div>

            {/* Кнопка запуска */}
            <button
              onClick={toggleStream}
              disabled={isLoading}
              className={`relative overflow-hidden py-4 rounded-2xl font-medium flex items-center justify-center transition-all active:scale-[0.98] ${
                isStreaming 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isStreaming ? (
                <>
                  <Square className="w-5 h-5 mr-2 fill-current" />
                  Остановить трансляцию
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Запустить трансляцию
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Скрытый input для вызова системной клавиатуры на мобильных устройствах */}
        <input 
          ref={inputRef}
          type="text"
          className="absolute opacity-0 -z-10 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </Screen>
  );
}

