import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, ArrowRight, Info } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface OnboardingProps {
  onComplete: () => void;
  key?: string;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [activeSheet, setActiveSheet] = useState<'privacy' | 'terms' | null>(null);

  return (
    <div className="flex flex-col h-full w-full px-6 pt-16 pb-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
          <Info className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-4 leading-snug">
          Ознакомьтесь с данной информацией перед использованием нашего приложения
        </h1>
        
        <p className="text-slate-400 text-sm mb-10 leading-relaxed">
          Для обеспечения безопасности и правильной работы JoonixLAN, пожалуйста, изучите наши правила и политику обработки данных.
        </p>

        <div className="flex flex-col gap-4 mt-auto">
          <button
            onClick={() => setActiveSheet('privacy')}
            className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
          >
            <div className="p-3 bg-white/5 rounded-xl mr-4 group-hover:bg-white/10 transition-colors">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">Политика конфиденциальности</div>
              <div className="text-slate-500 text-xs mt-1">Защита данных и туннелирование</div>
            </div>
          </button>

          <button
            onClick={() => setActiveSheet('terms')}
            className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
          >
            <div className="p-3 bg-white/5 rounded-xl mr-4 group-hover:bg-white/10 transition-colors">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">Пользовательское соглашение</div>
              <div className="text-slate-500 text-xs mt-1">Правила управления питанием ПК</div>
            </div>
          </button>
        </div>

        <button
          onClick={onComplete}
          className="mt-10 w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98]"
        >
          Принять и продолжить
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </motion.div>

      <BottomSheet
        isOpen={activeSheet === 'privacy'}
        onClose={() => setActiveSheet(null)}
        title="Политика конфиденциальности"
      >
        <div className="space-y-4">
          <p>
            Ваша безопасность — наш приоритет. Мы используем современные методы шифрования для защиты вашего соединения.
          </p>
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-200">
            Данные IP/MAC и трансляция экрана защищены туннелем, не передаются третьим лицам.
          </div>
          <p>
            Все команды управления и видеопоток передаются напрямую между вашим устройством и ПК. Мы не храним историю ваших сессий на промежуточных серверах.
          </p>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeSheet === 'terms'}
        onClose={() => setActiveSheet(null)}
        title="Пользовательское соглашение"
      >
        <div className="space-y-4">
          <p>
            Используя JoonixLAN, вы получаете полный контроль над питанием вашего компьютера удаленно.
          </p>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-200">
            Приложение завершает работу и перезагружает ПК в штатном режиме, что позволяет Windows сохранить данные.
          </div>
          <p>
            Мы используем безопасные системные вызовы (без флага принудительного завершения <code>/f</code>), чтобы операционная система могла корректно закрыть программы и предложить сохранить открытые документы.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
