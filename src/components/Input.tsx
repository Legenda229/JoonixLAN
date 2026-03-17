import React, { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label: string;
  className?: string;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function Input({ icon, label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 ml-1">{label}</label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
            icon ? 'pl-11' : ''
          } ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
