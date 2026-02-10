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
  churnMonthly: { good: 0.293, bad: 0.488, type: 'low_good' }, 
  churnMonthlySteady: { good: 0.167, bad: 0.272, type: 'low_good' },
  churnAnnual: { good: 0.561, bad: 0.788, type: 'low_good' }, 
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
    mode, setMode,
    scenarios, activeScenarioId, saasScenarios, activeSaasScenarioId,
    addScenario, switchScenario, deleteScenario,
    updateScenario, updateNestedScenario,
    updateSaasScenario, updateNestedSaasScenario,
    openTactics 
  } = useStore();
  
  const activeScenario = scenarios.find(s => s.id === activeScenarioId)!;
  const activeSaasScenario = saasScenarios.find(s => s.id === activeSaasScenarioId)!;

  const [sections, setSections] = useState({
    marketing: true,
    funnel: false,
    plans: false,
    retention: false,
    costs: false
  });

  const toggle = (key: keyof typeof sections) => 
    setSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Helper for Advanced CPI Update (Mobile only)
  const handleAdvancedCpiUpdate = (newBreakdown: ChannelMetric[]) => {
      const blendedCpi = newBreakdown.reduce((sum, ch) => sum + (ch.share * ch.cpi), 0);
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
        <div className="flex items-center justify-between mt-2">
           <p className="text-[15px] text-gray-500 font-medium">Growth modeling</p>
           {/* Mode Toggle */}
           <div className="flex p-0.5 bg-gray-100 rounded-lg">
             <button 
               onClick={() => setMode('mobile')}
               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
             >Mobile App</button>
             <button 
               onClick={() => setMode('saas')}
               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'saas' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
             >Web SaaS</button>
           </div>
        </div>
      </div>

      {mode === 'mobile' ? (
        /* --- MOBILE INPUTS --- */
        <>
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
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
             <div className="px-6 py-6 border-b border-gray-100">
                <NumberInput 
                    label="Forecast Horizon" 
                    value={activeScenario.horizonMonths} 
                    onChange={(v) => updateScenario({ horizonMonths: v })} 
                    suffix="Months" min={6} max={60}
                />
            </div>
            {/* Marketing */}
            <div className="border-b border-gray-100">
            <SectionHeader title="Acquisition" isOpen={sections.marketing} toggle={() => toggle('marketing')} onShowTactics={() => openTactics('marketing')} />
            {sections.marketing && (
                <div className="px-6 pb-6 animate-fadeIn">
                <GrowthInput label="Monthly Ad Spend" value={activeScenario.marketing.adSpend} onChange={(v) => updateNestedScenario('marketing', { adSpend: v })} suffix="$" />
                
                {/* CUSTOM CPI INPUT */}
                <div className="mb-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-200 transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-[15px] font-bold text-gray-800 tracking-tight flex items-center gap-2">
                            {activeScenario.marketing.cpiAdvancedMode ? "CPI (Blended)" : "CPI (Cost Per Install)"}
                        </label>
                        <button 
                            onClick={() => updateNestedScenario('marketing', { cpiAdvancedMode: !activeScenario.marketing.cpiAdvancedMode })}
                            className={`text-[13px] font-bold px-2.5 py-1 rounded transition-colors ${activeScenario.marketing.cpiAdvancedMode ? 'bg-blue-100 text-blue-700' : 'text-blue-600'}`}
                        >
                            {activeScenario.marketing.cpiAdvancedMode ? 'Disable Advanced' : 'Advanced Setup'}
                        </button>
                    </div>
                    <div className="flex gap-3 mb-2">
                        <div className="flex-1 relative">
                            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block pl-0.5">Start</label>
                            <SmartInput 
                                value={activeScenario.marketing.cpi.startValue}
                                onChange={(v) => updateNestedScenario('marketing', { cpi: { ...activeScenario.marketing.cpi, startValue: v } })}
                                suffix="$"
                                disabled={activeScenario.marketing.cpiAdvancedMode}
                                className={`w-full border rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all ${activeScenario.marketing.cpiAdvancedMode ? 'bg-gray-100' : 'bg-white'}`}
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block pl-0.5">MoM</label>
                            <SmartInput 
                                value={activeScenario.marketing.cpi.growthRateMonthly}
                                onChange={(v) => updateNestedScenario('marketing', { cpi: { ...activeScenario.marketing.cpi, growthRateMonthly: v } })}
                                isPercent suffix="%"
                                className="w-full bg-white border rounded-lg px-3 py-2.5 text-[15px] font-medium text-right"
                            />
                        </div>
                    </div>
                    {activeScenario.marketing.cpiAdvancedMode && (
                        <div className="mt-5 pt-5 border-t border-gray-200 animate-fadeIn space-y-4">
                            {activeScenario.marketing.cpiBreakdown.map((channel, idx) => {
                                const benchmark = getBenchmarkStatus(channel.id, channel.cpi);
                                return (
                                    <div key={channel.id} className="grid grid-cols-12 gap-3 items-start">
                                        <div className="col-span-5 pt-2">
                                            <div className="text-[15px] font-semibold text-gray-800 truncate">{channel.name}</div>
                                            {benchmark && <div className="text-[12px] text-gray-400">Target: ≤${CPI_BENCHMARKS[channel.id].good}</div>}
                                        </div>
                                        <div className="col-span-3">
                                            <SmartInput value={channel.share} onChange={(v) => {
                                                const newBreakdown = [...activeScenario.marketing.cpiBreakdown];
                                                newBreakdown[idx] = { ...channel, share: v };
                                                handleAdvancedCpiUpdate(newBreakdown);
                                            }} isPercent className="w-full py-2 px-2 text-right bg-white border rounded-md" />
                                        </div>
                                        <div className="col-span-4">
                                            <SmartInput value={channel.cpi} onChange={(v) => {
                                                const newBreakdown = [...activeScenario.marketing.cpiBreakdown];
                                                newBreakdown[idx] = { ...channel, cpi: v };
                                                handleAdvancedCpiUpdate(newBreakdown);
                                            }} className={`w-full py-2 px-2 text-right bg-white border rounded-md ${benchmark ? benchmark.inputBorder : ''}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <NumberInput label="Organic Multiplier" value={activeScenario.marketing.organicMultiplier} onChange={(v) => updateNestedScenario('marketing', { organicMultiplier: v })} step={0.1} suffix="x" />
                </div>
            )}
            </div>

            {/* Funnel */}
            <div className="border-b border-gray-100">
                <SectionHeader title="Funnel & Conversion" isOpen={sections.funnel} toggle={() => toggle('funnel')} onShowTactics={() => openTactics('funnel')} />
                {sections.funnel && (
                    <div className="px-6 pb-6 animate-fadeIn">
                        <div className="flex items-center justify-between gap-2 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="text-[15px] text-gray-800 font-bold">Free Trial Model</label>
                            <button onClick={() => updateNestedScenario('funnel', { usingTrial: !activeScenario.funnel.usingTrial })} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${activeScenario.funnel.usingTrial ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${activeScenario.funnel.usingTrial ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        {activeScenario.funnel.usingTrial ? (
                            <>
                            <NumberInput label="Install → Trial Rate" value={activeScenario.funnel.installToTrialRate} onChange={(v) => updateNestedScenario('funnel', { installToTrialRate: v })} isPercent status={getMetricStatus('installToTrial', activeScenario.funnel.installToTrialRate)} />
                            <NumberInput label="Trial → Paid Rate" value={activeScenario.funnel.trialToPaidRate} onChange={(v) => updateNestedScenario('funnel', { trialToPaidRate: v })} isPercent status={getMetricStatus('trialToPaid', activeScenario.funnel.trialToPaidRate)} />
                            </>
                        ) : (
                            <NumberInput label="Install → Paid Rate" value={activeScenario.funnel.installToPaidRate} onChange={(v) => updateNestedScenario('funnel', { installToPaidRate: v })} isPercent />
                        )}
                        <NumberInput label="Refund Rate" value={activeScenario.funnel.refundRate} onChange={(v) => updateNestedScenario('funnel', { refundRate: v })} isPercent status={getMetricStatus('refund', activeScenario.funnel.refundRate)} />
                        
                        <div className="pt-6 mt-4 border-t border-gray-100">
                            <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4">Plan Mix</h4>
                            <div className="grid grid-cols-2 gap-x-4">
                                {(['weekly', 'monthly', 'annual', 'lifetime'] as const).map(p => (
                                    <NumberInput key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} value={activeScenario.funnel.planMix[p]} onChange={(v) => updateNestedScenario('funnel', { planMix: { ...activeScenario.funnel.planMix, [p]: v } })} isPercent />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Plans */}
            <div className="border-b border-gray-100">
                <SectionHeader title="Plans & Pricing" isOpen={sections.plans} toggle={() => toggle('plans')} />
                {sections.plans && (
                    <div className="px-6 pb-6 animate-fadeIn space-y-4">
                        {(['weekly', 'monthly', 'annual', 'lifetime'] as PlanType[]).map(p => {
                            if (activeScenario.funnel.planMix[p] === 0) return null;
                            return (
                                <div key={p} className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                        <h4 className="text-[15px] font-bold capitalize text-gray-900">{p} Plan</h4>
                                    </div>
                                    <NumberInput label="Price" value={activeScenario.plans[p].price} onChange={(v) => {
                                        const newPlans = { ...activeScenario.plans };
                                        newPlans[p] = { ...newPlans[p], price: v };
                                        updateScenario({ plans: newPlans });
                                    }} suffix="$" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Retention */}
            <div className="border-b border-gray-100">
                <SectionHeader title="Retention" isOpen={sections.retention} toggle={() => toggle('retention')} />
                {sections.retention && (
                    <div className="px-6 pb-6 animate-fadeIn">
                        {/* Simplified for brevity in this response, using Simple mode only for visual clarity */}
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                            <h4 className="text-[13px] font-bold text-gray-700 uppercase mb-4">Monthly Churn</h4>
                            <NumberInput label="Month 1" value={activeScenario.retention.monthly.month1Churn} onChange={(v) => updateNestedScenario('retention', { monthly: { ...activeScenario.retention.monthly, month1Churn: v }})} isPercent status={getMetricStatus('churnMonthly', activeScenario.retention.monthly.month1Churn)} />
                            <NumberInput label="Steady State" value={activeScenario.retention.monthly.steadyStateChurn} onChange={(v) => updateNestedScenario('retention', { monthly: { ...activeScenario.retention.monthly, steadyStateChurn: v }})} isPercent status={getMetricStatus('churnMonthlySteady', activeScenario.retention.monthly.steadyStateChurn)} />
                        </div>
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                             <h4 className="text-[13px] font-bold text-gray-700 uppercase mb-4">Annual Churn</h4>
                             <NumberInput label="Year 1" value={activeScenario.retention.annual.year1Churn} onChange={(v) => updateNestedScenario('retention', { annual: { ...activeScenario.retention.annual, year1Churn: v }})} isPercent status={getMetricStatus('churnAnnual', activeScenario.retention.annual.year1Churn)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Costs */}
            <div className="border-b border-gray-100">
                <SectionHeader title="Costs" isOpen={sections.costs} toggle={() => toggle('costs')} />
                {sections.costs && (
                    <div className="px-6 pb-6 animate-fadeIn">
                        <NumberInput label="Fixed Opex" value={activeScenario.costs.fixedOpexMonthly} onChange={(v) => updateNestedScenario('costs', { fixedOpexMonthly: v })} suffix="$" />
                        <NumberInput label="Var Cost / Sub" value={activeScenario.costs.variableCostPerActiveSub} onChange={(v) => updateNestedScenario('costs', { variableCostPerActiveSub: v })} suffix="$" />
                    </div>
                )}
            </div>
        </div>
        </>
      ) : (
        /* --- SAAS INPUTS --- */
        <>
            <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-widest block mb-2">SaaS Scenario</label>
                <div className="text-[15px] font-bold text-gray-900">{activeSaasScenario.name}</div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 border-b border-gray-100">
                    <NumberInput 
                        label="Forecast Horizon" 
                        value={activeSaasScenario.horizonMonths} 
                        onChange={(v) => updateSaasScenario({ horizonMonths: v })} 
                        suffix="Months" min={6} max={60}
                    />
                </div>

                <div className="border-b border-gray-100">
                    <SectionHeader title="Acquisition" isOpen={sections.marketing} toggle={() => toggle('marketing')} />
                    {sections.marketing && (
                        <div className="px-6 pb-6 animate-fadeIn">
                            <GrowthInput label="Monthly Ad Spend" value={activeSaasScenario.acquisition.adSpend} onChange={(v) => updateNestedSaasScenario('acquisition', { adSpend: v })} suffix="$" />
                            <GrowthInput label="Blended CPC (Cost Per Click)" value={activeSaasScenario.acquisition.cpc} onChange={(v) => updateNestedSaasScenario('acquisition', { cpc: v })} suffix="$" />
                            <GrowthInput label="Organic Sessions" value={activeSaasScenario.acquisition.organicSessions} onChange={(v) => updateNestedSaasScenario('acquisition', { organicSessions: v })} />
                        </div>
                    )}
                </div>

                <div className="border-b border-gray-100">
                    <SectionHeader title="Funnel & Conversion" isOpen={sections.funnel} toggle={() => toggle('funnel')} />
                    {sections.funnel && (
                        <div className="px-6 pb-6 animate-fadeIn">
                            <NumberInput label="Visitor → Signup" value={activeSaasScenario.funnel.visitorToSignupRate} onChange={(v) => updateNestedSaasScenario('funnel', { visitorToSignupRate: v })} isPercent />
                            <NumberInput label="Signup → Activated" value={activeSaasScenario.funnel.signupToActivationRate} onChange={(v) => updateNestedSaasScenario('funnel', { signupToActivationRate: v })} isPercent />
                            <NumberInput label="Activated → Trial" value={activeSaasScenario.funnel.activationToTrialRate} onChange={(v) => updateNestedSaasScenario('funnel', { activationToTrialRate: v })} isPercent />
                            <NumberInput label="Trial → Paid" value={activeSaasScenario.funnel.trialToPaidRate} onChange={(v) => updateNestedSaasScenario('funnel', { trialToPaidRate: v })} isPercent />
                            <NumberInput label="Refund Rate" value={activeSaasScenario.funnel.refundRate} onChange={(v) => updateNestedSaasScenario('funnel', { refundRate: v })} isPercent />
                        </div>
                    )}
                </div>

                <div className="border-b border-gray-100">
                    <SectionHeader title="Plans & Pricing" isOpen={sections.plans} toggle={() => toggle('plans')} />
                    {sections.plans && (
                        <div className="px-6 pb-6 animate-fadeIn">
                            <div className="mb-4 p-5 bg-white rounded-xl border border-gray-200">
                                <h4 className="text-[15px] font-bold text-gray-900 mb-3">Monthly Plan</h4>
                                <NumberInput label="Price" value={activeSaasScenario.pricing.monthly.price} onChange={(v) => updateNestedSaasScenario('pricing', { monthly: { ...activeSaasScenario.pricing.monthly, price: v }})} suffix="$" />
                                <NumberInput label="Mix %" value={activeSaasScenario.pricing.planMix.monthly} onChange={(v) => updateNestedSaasScenario('pricing', { planMix: { ...activeSaasScenario.pricing.planMix, monthly: v, annual: 1 - v }})} isPercent />
                            </div>
                            <div className="p-5 bg-white rounded-xl border border-gray-200">
                                <h4 className="text-[15px] font-bold text-gray-900 mb-3">Annual Plan</h4>
                                <NumberInput label="Price" value={activeSaasScenario.pricing.annual.price} onChange={(v) => updateNestedSaasScenario('pricing', { annual: { ...activeSaasScenario.pricing.annual, price: v }})} suffix="$" />
                                <div className="flex justify-between mt-2">
                                    <span className="text-sm font-medium text-gray-600">Mix %</span>
                                    <span className="text-sm font-bold text-gray-900">{(activeSaasScenario.pricing.planMix.annual * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-b border-gray-100">
                    <SectionHeader title="Retention" isOpen={sections.retention} toggle={() => toggle('retention')} />
                    {sections.retention && (
                        <div className="px-6 pb-6 animate-fadeIn">
                             <NumberInput label="Monthly Churn" value={activeSaasScenario.retention.monthlyChurn} onChange={(v) => updateNestedSaasScenario('retention', { monthlyChurn: v })} isPercent />
                             <NumberInput label="Annual Renewal Rate" value={activeSaasScenario.retention.annualRenewalRate} onChange={(v) => updateNestedSaasScenario('retention', { annualRenewalRate: v })} isPercent />
                        </div>
                    )}
                </div>

                <div className="border-b border-gray-100">
                    <SectionHeader title="Costs" isOpen={sections.costs} toggle={() => toggle('costs')} />
                    {sections.costs && (
                        <div className="px-6 pb-6 animate-fadeIn">
                            <NumberInput label="Fixed Opex" value={activeSaasScenario.costs.fixedOpex} onChange={(v) => updateNestedSaasScenario('costs', { fixedOpex: v })} suffix="$" />
                            <NumberInput label="Cost Per User" value={activeSaasScenario.costs.costPerActiveUser} onChange={(v) => updateNestedSaasScenario('costs', { costPerActiveUser: v })} suffix="$" />
                            <NumberInput label="Payment Fee %" value={activeSaasScenario.costs.paymentProcessingPct} onChange={(v) => updateNestedSaasScenario('costs', { paymentProcessingPct: v })} isPercent />
                        </div>
                    )}
                </div>
            </div>
        </>
      )}

    </div>
  );
};