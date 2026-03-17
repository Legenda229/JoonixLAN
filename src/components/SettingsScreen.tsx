import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Network, Key, Wifi, WifiOff, CheckCircle2, Server, Info, Download, Globe } from 'lucide-react';
import { Input } from './Input';
import { Popup } from './Popup';
import { BottomSheet } from './BottomSheet';
import { Screen } from './Screen';
import { lanService } from '../services/lanService';
import { PYTHON_SERVER_CODE } from '../utils/pythonServerTemplate';

interface SettingsScreenProps {
  onSave: () => void;
  isConfigured: boolean;
}

export function SettingsScreen({ onSave, isConfigured }: SettingsScreenProps) {
  const [pcName, setPcName] = useState(localStorage.getItem('pc_name') || '');
  const [ipAddress, setIpAddress] = useState(localStorage.getItem('pc_ip') || '');
  const [port, setPort] = useState(localStorage.getItem('pc_port') || '8765');
  const [macAddress, setMacAddress] = useState(localStorage.getItem('pc_mac') || '');
  const [tunnelId, setTunnelId] = useState(localStorage.getItem('pc_tunnelId') || '');
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      setPcName(localStorage.getItem('pc_name') || '');
      setIpAddress(localStorage.getItem('pc_ip') || '');
      setPort(localStorage.getItem('pc_port') || '8765');
      setMacAddress(localStorage.getItem('pc_mac') || '');
      setTunnelId(localStorage.getItem('pc_tunnelId') || '');
    }
  }, [isConfigured]);

  const handleConnect = async () => {
    localStorage.setItem('pc_name', pcName);
    localStorage.setItem('pc_ip', ipAddress);
    localStorage.setItem('pc_port', port);
    localStorage.setItem('pc_mac', macAddress);
    localStorage.setItem('pc_tunnelId', tunnelId);
    
    onSave();
    
    if (!ipAddress) return;

    setIsConnecting(true);
    setConnectionStatus('idle');
    
    const success = await lanService.connect(ipAddress, port, tunnelId);
    
    setConnectionStatus(success ? 'success' : 'error');
    setIsConnecting(false);
  };

  const handleDownloadServer = () => {
    const blob = new Blob([PYTHON_SERVER_CODE], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'server.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Screen title="Настройки">
      <div className="flex flex-col gap-4">
        <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col gap-4">
          <Input 
            label="Название ПК" 
            icon={<Monitor className="w-5 h-5" />} 
            placeholder="Рабочий ПК"
            value={pcName}
            onChange={(e) => setPcName(e.target.value)}
          />
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <Input 
              label="IP / Домен" 
              icon={<Globe className="w-5 h-5" />} 
              placeholder="192.168.1.100"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            <Input 
              label="Порт" 
              icon={<Network className="w-5 h-5" />} 
              placeholder="8765"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="MAC-адрес (WOL)" 
              icon={<Network className="w-5 h-5" />} 
              placeholder="00:00:00:..."
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
            />
            <Input 
              label="ID (Пароль)" 
              icon={<Key className="w-5 h-5" />} 
              placeholder="Ваш ID"
              value={tunnelId}
              onChange={(e) => setTunnelId(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleDownloadServer}
            className="mt-2 w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium flex items-center justify-center transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Скачать server.py для ПК
          </button>
          
          <button
            onClick={() => setShowChecklist(true)}
            className="w-full py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-medium flex items-center justify-center transition-colors text-sm"
          >
            <Info className="w-4 h-4 mr-2" />
            Инструкция по подключению
          </button>
        </div>

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="relative overflow-hidden w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium flex items-center justify-center transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98]"
        >
          <AnimatePresence mode="wait">
            {isConnecting ? (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center"
              >
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                Подключение к {ipAddress}...
              </motion.div>
            ) : (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center"
              >
                <Wifi className="w-5 h-5 mr-2" />
                Подключиться к ПК
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Попап успешного подключения */}
        <Popup 
          isOpen={connectionStatus === 'success'} 
          onClose={() => setConnectionStatus('idle')}
          title="Связь установлена"
        >
          <div className="flex flex-col items-center text-center pb-2">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-slate-300 mb-6">
              Ваш ПК "{pcName}" успешно подключен. WebSocket соединение активно.
            </p>
            <button
              onClick={() => setConnectionStatus('idle')}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            >
              Отлично
            </button>
          </div>
        </Popup>

        {/* Попап ошибки подключения */}
        <Popup 
          isOpen={connectionStatus === 'error'} 
          onClose={() => setConnectionStatus('idle')}
          title="Ошибка подключения"
        >
          <div className="flex flex-col items-center text-center pb-2">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
              <WifiOff className="w-8 h-8 text-rose-400" />
            </div>
            <p className="text-slate-300 mb-6">
              Не удалось установить WebSocket соединение с {ipAddress}:{port}.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConnectionStatus('idle')}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  setConnectionStatus('idle');
                  setShowChecklist(true);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-200 font-medium transition-colors flex items-center justify-center"
              >
                Что не так?
              </button>
            </div>
          </div>
        </Popup>

        {/* Чек-лист (Bottom Sheet) */}
        <BottomSheet
          isOpen={showChecklist}
          onClose={() => setShowChecklist(false)}
          title="Решение проблем & Доступ из любой точки мира"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <span className="text-indigo-400 text-xs font-bold">1</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Скачайте и запустите server.py</div>
                <div className="text-slate-400 text-xs mt-1">
                  Нажмите кнопку "Скачать server.py" в настройках. Установите Python и библиотеки (<code>pip install websockets mss Pillow pynput</code>). Запустите скрипт на ПК.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <span className="text-indigo-400 text-xs font-bold">2</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Доступ из любой точки мира (Интернет)</div>
                <div className="text-slate-400 text-xs mt-1">
                  Чтобы управлять ПК не только из домашней Wi-Fi сети, вам нужно:
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Иметь белый (статический) IP и настроить <strong>Проброс портов (Port Forwarding)</strong> на роутере для порта {port}.</li>
                    <li>ИЛИ использовать сервисы типа <strong>Ngrok</strong>, <strong>Tailscale</strong> или <strong>ZeroTier</strong>. Введите выданный ими IP/Домен в поле "IP / Домен".</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <span className="text-indigo-400 text-xs font-bold">3</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Блокировка браузером (Mixed Content)</div>
                <div className="text-slate-400 text-xs mt-1">
                  Если вы открыли это приложение по HTTPS, браузер заблокирует подключение к локальному IP. Соберите приложение в APK (Capacitor) или используйте Ngrok (он дает HTTPS ссылку).
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <span className="text-indigo-400 text-xs font-bold">4</span>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Брандмауэр Windows</div>
                <div className="text-slate-400 text-xs mt-1">
                  Убедитесь, что брандмауэр Windows не блокирует входящие подключения для Python на порту {port}.
                </div>
              </div>
            </div>
          </div>
        </BottomSheet>
      </div>
    </Screen>
  );
}

