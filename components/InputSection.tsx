import React, { useState, useEffect, useRef } from 'react';
import { GrowthInput as GrowthInputType } from '../types';

// Internal reusable component for smart input handling
export const SmartInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  isPercent?: boolean;
  className?: string;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
}> = ({ value, onChange, isPercent, className, step, min, max, suffix, placeholder, disabled }) => {
  // Calculate the display numeric value from the model value
  // We use round with 2 decimal places for percents to handle precision gracefully
  const computeDisplay = (v: number) => {
    if (isPercent) {
      const p = v * 100;
      return Math.round(p * 100) / 100; 
    }
    return v;
  };

  const targetVal = computeDisplay(value);
  const [localVal, setLocalVal] = useState(targetVal.toString());
  const isTypingRef = useRef(false);

  useEffect(() => {
    // Only sync from props if the user is NOT currently typing in this specific field
    if (!isTypingRef.current) {
      setLocalVal(targetVal.toString());
    }
    // We reset the typing ref after the effect runs (which happens after render)
    isTypingRef.current = false;
  }, [targetVal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    isTypingRef.current = true;
    setLocalVal(raw);

    // Allow empty string to exist in UI, but report 0 to the model
    if (raw === '') {
      onChange(0);
      return;
    }

    const val = parseFloat(raw);
    if (!isNaN(val)) {
      if (isPercent) {
        onChange(val / 100);
      } else {
        onChange(val);
      }
    }
  };

  const handleBlur = () => {
    isTypingRef.current = false;
    // On blur, re-sync to formatted value to clean up inputs (e.g. "007" -> "7")
    setLocalVal(targetVal.toString());
  };

  return (
    <div className="relative group w-full">
      <input
        type="number"
        className={className}
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
      />
      {suffix && (
          <span className="absolute right-3 top-3 text-[14px] text-gray-500 pointer-events-none font-medium">
            {suffix}
          </span>
      )}
    </div>
  );
};

export interface InputStatus {
  label: string;
  inputBorder: string;
  badgeColor: string;
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  tooltip?: string;
  isPercent?: boolean;
  status?: InputStatus | null;
}

const InputLabel: React.FC<{ label: string; tooltip?: string }> = ({ label, tooltip }) => (
  <div className="flex justify-between items-center mb-2">
    <label className="text-[15px] font-semibold text-gray-700 flex items-center gap-1.5 select-none transition-colors group-hover:text-gray-900">
      {label}
      {tooltip && (
        <div className="group/tooltip relative flex justify-center">
            <span className="text-gray-400 cursor-help text-[12px] hover:text-blue-600 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </span>
            <span className="absolute bottom-full mb-2 hidden group-hover/tooltip:block w-52 p-3 bg-gray-900/95 backdrop-blur-md text-white text-[12px] font-medium leading-relaxed rounded-xl shadow-xl z-50 text-center animate-fadeIn border border-white/10">
              {tooltip}
              <svg className="absolute text-gray-900/95 top-full left-1/2 -translate-x-1/2" width="10" height="5" viewBox="0 0 10 5" fill="currentColor"><path d="M5 5L0 0H10L5 5Z"/></svg>
            </span>
        </div>
      )}
    </label>
  </div>
);

export const NumberInput: React.FC<NumberInputProps> = ({ 
  label, value, onChange, step = 1, min = 0, max, suffix, tooltip, isPercent, status
}) => {
  return (
    <div className="mb-6 relative">
      <InputLabel label={label} tooltip={tooltip} />
      <div className="relative">
        <SmartInput
          value={value}
          onChange={onChange}
          step={step}
          min={min}
          max={max}
          suffix={suffix || (isPercent ? '%' : undefined)}
          isPercent={isPercent}
          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[15px] text-gray-900 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-4 transition-all duration-200 placeholder-gray-400 
            ${status 
              ? `${status.inputBorder}` 
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10 hover:border-gray-300'
            }`}
        />
        {status && (
             <div className={`absolute -top-3 right-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm z-10 pointer-events-none ${status.badgeColor}`}>
                 {status.label}
             </div>
        )}
      </div>
    </div>
  );
};

export const GrowthInput: React.FC<{ 
  label: string; 
  value: GrowthInputType; 
  onChange: (val: GrowthInputType) => void; 
  suffix?: string 
}> = ({ label, value, onChange, suffix }) => {
  return (
    <div className="mb-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-200">
      <label className="text-[15px] font-bold text-gray-800 block mb-3 tracking-tight">{label}</label>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block pl-0.5">Start</label>
          <SmartInput 
            value={value.startValue}
            onChange={(v) => onChange({...value, startValue: v})}
            suffix={suffix}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-gray-300"
          />
        </div>
        <div className="w-24">
          <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block pl-0.5">MoM</label>
          <SmartInput 
            value={value.growthRateMonthly}
            onChange={(v) => onChange({...value, growthRateMonthly: v})}
            isPercent
            suffix="%"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-right pr-7 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export const ArrayInput: React.FC<{
  label: string;
  value: number[];
  onChange: (val: number[]) => void;
  tooltip?: string;
  rows?: number;
}> = ({ label, value, onChange, tooltip, rows = 3 }) => {
  const [localStr, setLocalStr] = useState(value.join(', '));
  const isTypingRef = useRef(false);

  // Sync with external updates unless typing
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalStr(value.join(', '));
    }
    isTypingRef.current = false;
  }, [value.join(',')]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isTypingRef.current = true;
    setLocalStr(e.target.value);
  };

  const handleBlur = () => {
    isTypingRef.current = false;
    const parts = localStr.split(',');
    const nums = parts.map(p => {
        const clean = p.trim();
        if (clean === '') return null;
        const n = parseFloat(clean);
        return isNaN(n) ? null : n;
    }).filter((n): n is number => n !== null);
    
    onChange(nums);
    setLocalStr(nums.join(', '));
  };

  return (
    <div className="mb-6">
       <InputLabel label={label} tooltip={tooltip} />
       <textarea 
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] text-gray-800 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder-gray-400 hover:border-gray-300 leading-relaxed"
          rows={rows}
          value={localStr}
          onChange={handleChange}
          onBlur={handleBlur}
       />
       <p className="text-[13px] text-gray-500 mt-1.5 px-0.5">Comma-separated survival rates (0.0 to 1.0)</p>
    </div>
  );
};

export const SectionHeader: React.FC<{ 
  title: string; 
  isOpen: boolean; 
  toggle: () => void;
  onShowTactics?: () => void; 
}> = ({ title, isOpen, toggle, onShowTactics }) => (
  <div 
    onClick={toggle}
    className="w-full flex items-center justify-between px-6 py-5 bg-white hover:bg-gray-50 transition-colors text-left group border-b border-transparent select-none cursor-pointer"
  >
    <div className="flex items-center gap-3">
        <span className={`text-[17px] font-bold text-gray-800 group-hover:text-gray-900 transition-colors tracking-tight`}>{title}</span>
        {onShowTactics && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onShowTactics();
                }}
                className="group/tactics flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 hover:border-amber-200 rounded-full transition-all"
                title="View Growth Tactics"
            >
                <span className="text-sm grayscale group-hover/tactics:grayscale-0 transition-all">💡</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 group-hover/tactics:text-amber-700 hidden group-hover/tactics:inline-block pr-1 transition-all">Growth Tactics</span>
            </button>
        )}
    </div>
    <span className={`text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </span>
  </div>
);