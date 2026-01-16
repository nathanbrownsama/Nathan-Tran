import React, { useState } from 'react';
import { useStore } from '../store';
import { NumberInput, GrowthInput, ArrayInput, SectionHeader, SmartInput, InputStatus } from './InputSection';
import { PlanType, ChannelMetric } from '../types';
import { BULL_CASE_PRESET, BEAR_CASE_PRESET } from '../constants';

const CPI_BENCHMARKS: Record<string, { good: number; bad: number; name: string }> = {
  'asa': { good: 3.5, bad: 6.0, name: 'Apple Search Ads' },
  'fb': { good: 3.0, bad: 5.0, name: 'Meta Ads' },
  'google': { good: 2.5, bad: 3.8, name: 'Google UAC' },
  'tt': { good: 2.0, bad: 3.5, name: 'TikTok Ads' },
};

// Threshold configurations
const BENCHMARKS = {
  installToTrial: { good: 0.142, bad: 0.035, type: 'high_good' },
  trialToPaid: { good: 0.553, bad: 0.278, type: 'high_good' },
  refund: { good: 0.034, bad: 0.058, type: 'low_good' },
  churnMonthly: { good: 0.293, bad: 0.488, type: 'low_good' }, // < 29.3% Good, > 48.8% Bad
  churnMonthlySteady: { good: 0.167, bad: 0.272, type: 'low_good' }, // < 16.7% Good, > 27.2% Bad
  churnAnnual: { good: 0.561, bad: 0.788, type: 'low_good' }, // < 56.1% Good, > 78.8% Bad
};

const getBenchmarkStatus = (id: string, cpi: number) => {
  const b = CPI_BENCHMARKS[id];
  if (!b) return null;
  
  if (cpi <= b.good) return { label: 'Good', inputBorder: 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20' };
  if (cpi >= b.bad) return { label: 'Bad', inputBorder: 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' };
  return { label: 'Fine', inputBorder: 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/20' };
};

const getMetricStatus = (key: keyof typeof BENCHMARKS, value: number): InputStatus | null => {
  const b = BENCHMARKS[key];
  if (!b) return null;

  let isGood = false;
  let isBad = false;

  if (b.type === 'high_good') {
    if (value >= b.good) isGood = true;
    else if (value < b.bad) isBad = true;
  } else {
    // low_good
    if (value <= b.good) isGood = true;
    else if (value > b.bad) isBad = true;
  }

  if (isGood) return { 
    label: 'Good', 
    inputBorder: 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20', 
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' 
  };
  
  if (isBad) return { 
    label: 'Bad', 
    inputBorder: 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20', 
    badgeColor: 'text-rose-700 bg-rose-50 border-rose-200' 
  };

  return { 
    label: 'Fine', 
    inputBorder: 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/20', 
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200' 
  };
};

export const Sidebar: React.FC = () => {
  const { 
    scenarios, activeScenarioId, 
    addScenario, switchScenario, deleteScenario,
    updateScenario, updateNestedScenario,
    openTactics 
  } = useStore();
  
  const activeScenario = scenarios.find(s => s.id === activeScenarioId)!;

  const [sections, setSections] = useState({
    marketing: true,
    funnel: false,
    plans: false,
    retention: false,
    costs: false
  });

  const toggle = (key: keyof typeof sections) => 
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Helper for Advanced CPI Update
  const handleAdvancedCpiUpdate = (newBreakdown: ChannelMetric[]) => {
      // Logic: Weighted Average based on Spend Share as requested
      // Formula: Sum(Share * CPI)
      // This represents the arithmetic weighted average of CPIs.
      
      const blendedCpi = newBreakdown.reduce((sum, ch) => {
          return sum + (ch.share * ch.cpi);
      }, 0);

      // Round to 1 decimal place as requested (e.g. 4.9)
      const roundedBlendedCpi = Math.round(blendedCpi * 10) / 10;

      updateNestedScenario('marketing', {
          cpi: { ...activeScenario.marketing.cpi, startValue: roundedBlendedCpi },
          cpiBreakdown: newBreakdown
      });
  };

  const totalShare = activeScenario.marketing.cpiBreakdown?.reduce((sum, ch) => sum + ch.share, 0) || 0;
  const isShareValid = Math.abs(totalShare - 1.0) < 0.01;

  return (
    <div className="w-full lg:w-[420px] flex-shrink-0 bg-white border-r border-gray-200 h-screen overflow-y-auto custom-scrollbar flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* App Header */}
      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          SubCalculator <span className="text-[12px] font-bold bg-black text-white px-2 py-0.5 rounded">PRO</span>
        </h1>
        <p className="text-[15px] text-gray-500 mt-1 font-medium">Growth modeling for subscriptions</p>
      </div>

      {/* Scenario Manager */}
      <div className="p-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex justify-between items-center mb-3">
           <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Active Scenario</label>
           <div className="flex gap-1.5">
             <button onClick={() => addScenario(BULL_CASE_PRESET)} className="text-[12px] px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md font-bold hover:bg-emerald-100 transition-colors">Bull</button>
             <button onClick={() => addScenario(BEAR_CASE_PRESET)} className="text-[12px] px-3 py-1.5 bg-rose-50 text-rose-600 rounded-md font-bold hover:bg-rose-100 transition-colors">Bear</button>
           </div>
        </div>
        <div className="flex gap-2">
            <div className="relative flex-1">
              <select 
                className="w-full appearance-none bg-white border border-gray-200 text-gray-800 text-[15px] font-semibold rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                value={activeScenarioId}
                onChange={(e) => switchScenario(e.target.value)}
              >
                {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                 <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            
            <button 
                onClick={() => {
                   const name = prompt("Scenario Name:", activeScenario.name);
                   if (name) updateScenario({ name });
                }}
                className="w-10 flex items-center justify-center border border-gray-200 bg-white rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            {scenarios.length > 1 && (
                <button 
                  onClick={() => deleteScenario(activeScenarioId)}
                  className="w-10 flex items-center justify-center border border-gray-200 bg-white rounded-lg text-gray-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            )}
        </div>
      </div>

      {/* Config Sections */}
      <div className="flex-1 overflow-y-auto">
        
        <div className="px-6 py-6 border-b border-gray-100">
             <NumberInput 
            label="Forecast Horizon" 
            value={activeScenario.horizonMonths} 
            onChange={(v) => updateScenario({ horizonMonths: v })} 
            suffix="Months" min={6} max={60}
            />
        </div>

        {/* 1. Marketing */}
        <div className="border-b border-gray-100">
          <SectionHeader 
            title="Acquisition" 
            isOpen={sections.marketing} 
            toggle={() => toggle('marketing')} 
            onShowTactics={() => openTactics('marketing')}
          />
          {sections.marketing && (
            <div className="px-6 pb-6 animate-fadeIn">
              <GrowthInput 
                label="Monthly Ad Spend" 
                value={activeScenario.marketing.adSpend} 
                onChange={(v) => updateNestedScenario('marketing', { adSpend: v })} 
                suffix="$"
              />
              
              {/* CUSTOM CPI INPUT START */}
              <div className="mb-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-200 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-[15px] font-bold text-gray-800 tracking-tight flex items-center gap-2">
                        {activeScenario.marketing.cpiAdvancedMode ? "CPI (Blended)" : "CPI (Cost Per Install)"}
                        {activeScenario.marketing.cpiAdvancedMode && (
                             <span className="text-amber-500" title="Locked by Advanced Mode">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                             </span>
                        )}
                    </label>
                    <button 
                        onClick={() => updateNestedScenario('marketing', { cpiAdvancedMode: !activeScenario.marketing.cpiAdvancedMode })}
                        className={`text-[13px] font-bold px-2.5 py-1 rounded transition-colors ${activeScenario.marketing.cpiAdvancedMode ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                        {activeScenario.marketing.cpiAdvancedMode ? 'Disable Advanced' : 'Advanced Setup'}
                    </button>
                </div>

                {/* Standard Growth Input Fields for CPI */}
                <div className="flex gap-3 mb-2">
                    <div className="flex-1 relative">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block pl-0.5">Start</label>
                        <SmartInput 
                            value={activeScenario.marketing.cpi.startValue}
                            onChange={(v) => updateNestedScenario('marketing', { cpi: { ...activeScenario.marketing.cpi, startValue: v } })}
                            suffix="$"
                            disabled={activeScenario.marketing.cpiAdvancedMode}
                            className={`w-full border rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]
                                ${activeScenario.marketing.cpiAdvancedMode 
                                    ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' 
                                    : 'bg-white text-gray-900 border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300'}`
                            }
                        />
                    </div>
                    <div className="w-24">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block pl-0.5">MoM</label>
                        <SmartInput 
                            value={activeScenario.marketing.cpi.growthRateMonthly}
                            onChange={(v) => updateNestedScenario('marketing', { cpi: { ...activeScenario.marketing.cpi, growthRateMonthly: v } })}
                            isPercent
                            suffix="%"
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-right pr-7 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-gray-300"
                        />
                    </div>
                </div>

                {/* Advanced Mode Accordion */}
                {activeScenario.marketing.cpiAdvancedMode && (
                    <div className="mt-5 pt-5 border-t border-gray-200 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Channel Mix</h4>
                            <span className={`text-[12px] font-bold px-2 py-0.5 rounded shadow-sm border ${isShareValid ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                Total: {(totalShare * 100).toFixed(0)}%
                            </span>
                        </div>
                        
                        <div className="space-y-4">
                             {/* Header Row */}
                             <div className="grid grid-cols-12 gap-3 px-1">
                                <div className="col-span-5 text-[13px] font-bold text-gray-500">Channel</div>
                                <div className="col-span-3 text-[13px] font-bold text-gray-500 text-right">Share %</div>
                                <div className="col-span-4 text-[13px] font-bold text-gray-500 text-right">CPI $</div>
                             </div>

                             {activeScenario.marketing.cpiBreakdown.map((channel, idx) => {
                                 const benchmark = getBenchmarkStatus(channel.id, channel.cpi);
                                 
                                 return (
                                     <div key={channel.id} className="grid grid-cols-12 gap-3 items-start group/row">
                                         <div className="col-span-5 pt-2">
                                            <div className="text-[15px] font-semibold text-gray-800 truncate" title={channel.name}>{channel.name}</div>
                                            {benchmark && (
                                                <div className="text-[12px] text-gray-400 leading-tight mt-0.5">
                                                    Target: ≤${CPI_BENCHMARKS[channel.id].good}
                                                </div>
                                            )}
                                         </div>
                                         <div className="col-span-3">
                                             <SmartInput 
                                                value={channel.share}
                                                onChange={(v) => {
                                                    const newBreakdown = [...activeScenario.marketing.cpiBreakdown];
                                                    newBreakdown[idx] = { ...channel, share: v };
                                                    handleAdvancedCpiUpdate(newBreakdown);
                                                }}
                                                isPercent
                                                className="w-full py-2 px-2 text-right text-[15px] font-medium text-gray-900 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder-gray-400 hover:border-gray-400 transition-colors"
                                             />
                                         </div>
                                         <div className="col-span-4 relative">
                                              <SmartInput 
                                                value={channel.cpi}
                                                onChange={(v) => {
                                                    const newBreakdown = [...activeScenario.marketing.cpiBreakdown];
                                                    newBreakdown[idx] = { ...channel, cpi: v };
                                                    handleAdvancedCpiUpdate(newBreakdown);
                                                }}
                                                className={`w-full py-2 px-2 text-right text-[15px] font-medium text-gray-900 bg-white border rounded-md shadow-sm placeholder-gray-400 transition-all ${benchmark ? benchmark.inputBorder : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-400'}`}
                                             />
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                        {!isShareValid && (
                            <div className="flex items-center gap-1.5 mt-5 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                                <span className="text-rose-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                </span>
                                <p className="text-[12px] text-rose-700 font-bold">
                                    Spend Share must equal 100%
                                </p>
                            </div>
                        )}
                    </div>
                )}
              </div>
              {/* CUSTOM CPI INPUT END */}

              <NumberInput 
                label="Organic Multiplier" 
                value={activeScenario.marketing.organicMultiplier} 
                onChange={(v) => updateNestedScenario('marketing', { organicMultiplier: v })} 
                step={0.1} 
                suffix="x"
                tooltip="e.g. 0.5 = 0.5 organic installs for every 1 paid install"
              />
            </div>
          )}
        </div>

        {/* 2. Funnel */}
        <div className="border-b border-gray-100">
          <SectionHeader 
            title="Funnel & Conversion" 
            isOpen={sections.funnel} 
            toggle={() => toggle('funnel')} 
            onShowTactics={() => openTactics('funnel')}
          />
          {sections.funnel && (
            <div className="px-6 pb-6 animate-fadeIn">
              
               <div className="flex items-center justify-between gap-2 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="text-[15px] text-gray-800 font-bold">Free Trial Model</label>
                <button 
                  onClick={() => updateNestedScenario('funnel', { usingTrial: !activeScenario.funnel.usingTrial })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${activeScenario.funnel.usingTrial ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${activeScenario.funnel.usingTrial ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
               </div>

               {activeScenario.funnel.usingTrial ? (
                 <>
                    <NumberInput 
                      label="Install → Trial Rate" 
                      value={activeScenario.funnel.installToTrialRate} 
                      onChange={(v) => updateNestedScenario('funnel', { installToTrialRate: v })} 
                      step={1} isPercent
                      status={getMetricStatus('installToTrial', activeScenario.funnel.installToTrialRate)}
                    />
                    <NumberInput 
                      label="Trial → Paid Rate" 
                      value={activeScenario.funnel.trialToPaidRate} 
                      onChange={(v) => updateNestedScenario('funnel', { trialToPaidRate: v })} 
                      step={1} isPercent
                      status={getMetricStatus('trialToPaid', activeScenario.funnel.trialToPaidRate)}
                    />
                 </>
               ) : (
                  <NumberInput 
                    label="Install → Paid Rate" 
                    value={activeScenario.funnel.installToPaidRate} 
                    onChange={(v) => updateNestedScenario('funnel', { installToPaidRate: v })} 
                    step={0.1} isPercent
                  />
               )}
               
               <NumberInput 
                  label="Refund Rate (Blended)" 
                  value={activeScenario.funnel.refundRate} 
                  onChange={(v) => updateNestedScenario('funnel', { refundRate: v })} 
                  step={0.5} isPercent
                  status={getMetricStatus('refund', activeScenario.funnel.refundRate)}
               />

               <div className="pt-6 mt-4 border-t border-gray-100">
                 <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4">Plan Mix (Sum 100%)</h4>
                 <div className="grid grid-cols-2 gap-x-4">
                  {(['weekly', 'monthly', 'annual', 'lifetime'] as const).map(p => (
                      <NumberInput 
                        key={p}
                        label={`${p.charAt(0).toUpperCase() + p.slice(1)}`} 
                        value={activeScenario.funnel.planMix[p]} 
                        onChange={(v) => {
                          const newMix = { ...activeScenario.funnel.planMix, [p]: v };
                          updateNestedScenario('funnel', { planMix: newMix });
                        }} 
                        step={1} isPercent
                      />
                  ))}
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* 3. Plans */}
        <div className="border-b border-gray-100">
          <SectionHeader title="Plans & Pricing" isOpen={sections.plans} toggle={() => toggle('plans')} />
          {sections.plans && (
            <div className="px-6 pb-6 animate-fadeIn space-y-4">
              {(['weekly', 'monthly', 'annual', 'lifetime'] as PlanType[]).map(p => {
                 if (activeScenario.funnel.planMix[p] === 0) return null;
                 return (
                  <div key={p} className="p-5 bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                     <div className="flex items-center gap-2 mb-4">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <h4 className="text-[15px] font-bold capitalize text-gray-900">{p} Plan</h4>
                     </div>
                     <div className="space-y-4">
                       <NumberInput 
                          label="Price" 
                          value={activeScenario.plans[p].price} 
                          onChange={(v) => {
                            const newPlans = { ...activeScenario.plans };
                            newPlans[p] = { ...newPlans[p], price: v };
                            updateScenario({ plans: newPlans });
                          }} 
                          suffix="$"
                        />
                        <NumberInput 
                          label="Year 1 Comm." 
                          value={activeScenario.plans[p].storeCommissionYear1} 
                          onChange={(v) => {
                            const newPlans = { ...activeScenario.plans };
                            newPlans[p] = { ...newPlans[p], storeCommissionYear1: v };
                            updateScenario({ plans: newPlans });
                          }} 
                          isPercent
                        />
                     </div>
                  </div>
                 );
              })}
            </div>
          )}
        </div>

        {/* 4. Retention */}
        <div className="border-b border-gray-100">
          <SectionHeader 
            title="Retention" 
            isOpen={sections.retention} 
            toggle={() => toggle('retention')} 
            onShowTactics={() => openTactics('retention')}
          />
          {sections.retention && (
            <div className="px-6 pb-6 animate-fadeIn">
              <div className="flex p-1.5 bg-gray-100 rounded-lg mb-6">
                   <button 
                    onClick={() => updateNestedScenario('retention', { mode: 'simple' })}
                    className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all ${activeScenario.retention.mode === 'simple' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    Simple
                   </button>
                   <button 
                    onClick={() => updateNestedScenario('retention', { mode: 'advanced' })}
                    className={`flex-1 py-2 text-[13px] font-bold rounded-md transition-all ${activeScenario.retention.mode === 'advanced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    Advanced
                   </button>
              </div>

              {activeScenario.retention.mode === 'simple' ? (
                <div className="space-y-5">
                  {activeScenario.funnel.planMix.monthly > 0 && (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-[13px] font-bold text-gray-700 uppercase mb-4">Monthly Churn</h4>
                      <NumberInput 
                        label="Month 1 Churn" 
                        value={activeScenario.retention.monthly.month1Churn} 
                        onChange={(v) => updateNestedScenario('retention', { monthly: { ...activeScenario.retention.monthly, month1Churn: v }})} 
                        step={1} isPercent 
                        status={getMetricStatus('churnMonthly', activeScenario.retention.monthly.month1Churn)}
                      />
                      <NumberInput 
                        label="Steady Churn" 
                        value={activeScenario.retention.monthly.steadyStateChurn} 
                        onChange={(v) => updateNestedScenario('retention', { monthly: { ...activeScenario.retention.monthly, steadyStateChurn: v }})} 
                        step={1} isPercent 
                        status={getMetricStatus('churnMonthlySteady', activeScenario.retention.monthly.steadyStateChurn)}
                      />
                      <NumberInput label="Decay Speed" value={activeScenario.retention.monthly.decayFactor} onChange={(v) => updateNestedScenario('retention', { monthly: { ...activeScenario.retention.monthly, decayFactor: v }})} step={0.1} tooltip="Higher = faster drop to steady state" />
                    </div>
                  )}
                  {activeScenario.funnel.planMix.annual > 0 && (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-[13px] font-bold text-gray-700 uppercase mb-4">Annual Churn</h4>
                      <NumberInput 
                        label="Year 1 Churn" 
                        value={activeScenario.retention.annual.year1Churn} 
                        onChange={(v) => updateNestedScenario('retention', { annual: { ...activeScenario.retention.annual, year1Churn: v }})} 
                        step={1} isPercent 
                        status={getMetricStatus('churnAnnual', activeScenario.retention.annual.year1Churn)}
                      />
                      <NumberInput label="Year 2+ Churn" value={activeScenario.retention.annual.steadyStateChurn} onChange={(v) => updateNestedScenario('retention', { annual: { ...activeScenario.retention.annual, steadyStateChurn: v }})} step={1} isPercent />
                    </div>
                  )}
                </div>
              ) : (
                 <div className="space-y-5">
                   <div className="text-[14px] text-gray-600 px-1 mb-2 font-medium">
                     Manually define survival rates for each period.
                   </div>
                   {activeScenario.funnel.planMix.monthly > 0 && (
                     <ArrayInput 
                      label="Monthly Plan Survival (Months 1-24)"
                      value={activeScenario.retention.advancedSurvival.monthly}
                      onChange={(v) => updateNestedScenario('retention', { advancedSurvival: { ...activeScenario.retention.advancedSurvival, monthly: v } })}
                      tooltip="Survival Rate at End of Month (1.0 = 100%)"
                     />
                   )}
                   {activeScenario.funnel.planMix.annual > 0 && (
                     <ArrayInput 
                      label="Annual Plan Survival (Years 1-5)"
                      value={activeScenario.retention.advancedSurvival.annual}
                      onChange={(v) => updateNestedScenario('retention', { advancedSurvival: { ...activeScenario.retention.advancedSurvival, annual: v } })}
                      tooltip="Survival Rate at End of Year (1.0 = 100%)"
                     />
                   )}
                   {activeScenario.funnel.planMix.weekly > 0 && (
                     <ArrayInput 
                      label="Weekly Plan Survival (Weeks 1-24)"
                      value={activeScenario.retention.advancedSurvival.weekly}
                      onChange={(v) => updateNestedScenario('retention', { advancedSurvival: { ...activeScenario.retention.advancedSurvival, weekly: v } })}
                      tooltip="Survival Rate at End of Week (1.0 = 100%)"
                     />
                   )}
                 </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Costs */}
        <div className="border-b border-gray-100">
          <SectionHeader title="Operational Costs" isOpen={sections.costs} toggle={() => toggle('costs')} />
          {sections.costs && (
            <div className="px-6 pb-6 animate-fadeIn">
              <NumberInput 
                label="Fixed Opex (Monthly)" 
                value={activeScenario.costs.fixedOpexMonthly} 
                onChange={(v) => updateNestedScenario('costs', { fixedOpexMonthly: v })} 
                suffix="$" step={100}
              />
              <NumberInput 
                label="Var Cost / Active Sub" 
                value={activeScenario.costs.variableCostPerActiveSub} 
                onChange={(v) => updateNestedScenario('costs', { variableCostPerActiveSub: v })} 
                suffix="$" step={0.01}
              />
               <NumberInput 
                label="Cost / Install" 
                value={activeScenario.costs.variableCostPerInstall} 
                onChange={(v) => updateNestedScenario('costs', { variableCostPerInstall: v })} 
                suffix="$" step={0.01}
              />
               <div className="grid grid-cols-2 gap-4">
                  <NumberInput 
                    label="Ticket Cost" 
                    value={activeScenario.costs.supportCostPerTicket} 
                    onChange={(v) => updateNestedScenario('costs', { supportCostPerTicket: v })} 
                    suffix="$"
                  />
                   <NumberInput 
                    label="Tickets/1k" 
                    value={activeScenario.costs.ticketsPer1000Subs} 
                    onChange={(v) => updateNestedScenario('costs', { ticketsPer1000Subs: v })} 
                  />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};