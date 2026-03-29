import React, { useMemo } from 'react';
import { useStore } from '../store';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, Legend, ComposedChart, ReferenceLine 
} from 'recharts';
import { calculateModel } from '../utils/calculations';
import { calculateSaasModel } from '../utils/saasCalculations';

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  darkGray: '#636366',
  lightGray: '#E5E5EA'
};

const KPICard: React.FC<{ label: string; value: string; subtext?: string; status?: 'good' | 'bad' | 'neutral' }> = ({ label, value, subtext, status = 'neutral' }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow duration-300">
    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</div>
    <div className={`text-3xl font-bold tracking-tight ${status === 'good' ? 'text-emerald-600' : status === 'bad' ? 'text-rose-600' : 'text-gray-900'}`}>
      {value}
    </div>
    {subtext && <div className="text-[13px] text-gray-500 mt-2 font-medium">{subtext}</div>}
  </div>
);

const HealthBanner: React.FC<{ alerts: string[] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;
  return (
    <div className="mb-8 bg-amber-50/50 border border-amber-100 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-600">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </span>
        <h4 className="text-amber-900 font-bold text-sm">Model Health Check</h4>
      </div>
      <ul className="list-disc list-inside text-sm text-amber-900/80 space-y-1 ml-1 font-medium">
        {alerts.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
    </div>
  );
};

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);

const FunnelVisualization: React.FC<{ mode: 'mobile' | 'saas', scenario: any, month1Data: any }> = ({ mode, scenario, month1Data }) => {
  const steps = [];
  
  if (mode === 'mobile') {
    const installs = month1Data.totalInstalls;
    steps.push({ label: 'Installs', value: installs, color: '#3b82f6' });
    
    if (scenario.funnel.usingTrial) {
      const onboarding = installs * (scenario.funnel.installToOnboardingRate ?? 1);
      const trials = onboarding * (scenario.funnel.onboardingToTrialRate ?? scenario.funnel.installToTrialRate);
      const payers = trials * scenario.funnel.trialToPaidRate;
      
      if (scenario.funnel.installToOnboardingRate !== undefined) {
        steps.push({ label: 'Onboarding', value: onboarding, color: '#6366f1' });
      }
      steps.push({ label: 'Trials', value: trials, color: '#8b5cf6' });
      steps.push({ label: 'Payers', value: payers, color: '#10b981' });
    } else {
      const payers = installs * scenario.funnel.installToPaidRate;
      steps.push({ label: 'Payers', value: payers, color: '#10b981' });
    }
  } else {
    const visitors = month1Data.totalInstalls;
    const signups = visitors * scenario.funnel.visitorToSignupRate;
    const activated = signups * scenario.funnel.signupToActivationRate;
    const trials = activated * scenario.funnel.activationToTrialRate;
    const payers = trials * scenario.funnel.trialToPaidRate;
    
    steps.push({ label: 'Visitors', value: visitors, color: '#3b82f6' });
    steps.push({ label: 'Signups', value: signups, color: '#6366f1' });
    steps.push({ label: 'Activated', value: activated, color: '#8b5cf6' });
    steps.push({ label: 'Trials', value: trials, color: '#d946ef' });
    steps.push({ label: 'Payers', value: payers, color: '#10b981' });
  }

  const maxVal = steps[0]?.value || 1;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-10">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Month 1 Funnel</h3>
      <div className="flex flex-col gap-3">
        {steps.map((step, idx) => {
          const pctOfMax = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
          const pctOfPrev = idx === 0 ? 100 : (steps[idx - 1].value > 0 ? (step.value / steps[idx - 1].value) * 100 : 0);
          return (
            <div key={step.label} className="flex items-center gap-4">
              <div className="w-24 text-right text-sm font-bold text-gray-700">{step.label}</div>
              <div className="flex-1 h-10 bg-gray-50 rounded-r-lg relative flex items-center">
                <div 
                  className="absolute left-0 top-0 bottom-0 rounded-r-lg transition-all duration-500"
                  style={{ width: `${pctOfMax}%`, backgroundColor: step.color, opacity: 0.8 }}
                ></div>
                <div className="relative z-10 px-3 font-numeric font-bold text-gray-900 flex items-center justify-between w-full">
                  <span>{formatNumber(step.value)}</span>
                  {idx > 0 && <span className="text-xs text-gray-600 bg-white/50 px-2 py-0.5 rounded backdrop-blur-sm">{pctOfPrev.toFixed(1)}%</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SensitivityAnalysis: React.FC<{ scenario: any, mode: 'mobile' | 'saas' }> = ({ scenario, mode }) => {
  const baseResult = mode === 'mobile' ? calculateModel(scenario) : calculateSaasModel(scenario);
  const baseProfit = baseResult.summary.totalProfit;
  
  const variations = [];
  
  if (mode === 'mobile') {
    const cpiUp = JSON.parse(JSON.stringify(scenario));
    cpiUp.marketing.cpi.startValue *= 1.2;
    const resCpiUp = calculateModel(cpiUp);
    variations.push({ name: 'CPI +20%', profitDelta: resCpiUp.summary.totalProfit - baseProfit, breakEven: resCpiUp.summary.breakEvenMonth });
    
    const ttpDown = JSON.parse(JSON.stringify(scenario));
    ttpDown.funnel.trialToPaidRate *= 0.85;
    const resTtpDown = calculateModel(ttpDown);
    variations.push({ name: 'Trial to Paid -15%', profitDelta: resTtpDown.summary.totalProfit - baseProfit, breakEven: resTtpDown.summary.breakEvenMonth });
    
    const churnUp = JSON.parse(JSON.stringify(scenario));
    churnUp.retention.monthly.month1Churn = Math.min(1, churnUp.retention.monthly.month1Churn * 1.2);
    const resChurnUp = calculateModel(churnUp);
    variations.push({ name: 'M1 Churn +20%', profitDelta: resChurnUp.summary.totalProfit - baseProfit, breakEven: resChurnUp.summary.breakEvenMonth });

    const onboardingDown = JSON.parse(JSON.stringify(scenario));
    onboardingDown.funnel.installToOnboardingRate = (onboardingDown.funnel.installToOnboardingRate ?? 1) * 0.9;
    const resOnboardingDown = calculateModel(onboardingDown);
    variations.push({ name: 'Install to Onboarding -10%', profitDelta: resOnboardingDown.summary.totalProfit - baseProfit, breakEven: resOnboardingDown.summary.breakEvenMonth });

    const organicUp = JSON.parse(JSON.stringify(scenario));
    organicUp.marketing.organicUplift *= 1.2;
    const resOrganicUp = calculateModel(organicUp);
    variations.push({ name: 'Organic Uplift +20%', profitDelta: resOrganicUp.summary.totalProfit - baseProfit, breakEven: resOrganicUp.summary.breakEvenMonth });
  } else {
    const cpcUp = JSON.parse(JSON.stringify(scenario));
    cpcUp.acquisition.cpc.startValue *= 1.2;
    const resCpcUp = calculateSaasModel(cpcUp);
    variations.push({ name: 'CPC +20%', profitDelta: resCpcUp.summary.totalProfit - baseProfit, breakEven: resCpcUp.summary.breakEvenMonth });
    
    const ttpDown = JSON.parse(JSON.stringify(scenario));
    ttpDown.funnel.trialToPaidRate *= 0.85;
    const resTtpDown = calculateSaasModel(ttpDown);
    variations.push({ name: 'Trial to Paid -15%', profitDelta: resTtpDown.summary.totalProfit - baseProfit, breakEven: resTtpDown.summary.breakEvenMonth });
    
    const churnUp = JSON.parse(JSON.stringify(scenario));
    churnUp.retention.monthlyChurn = Math.min(1, churnUp.retention.monthlyChurn * 1.2);
    const resChurnUp = calculateSaasModel(churnUp);
    variations.push({ name: 'Monthly Churn +20%', profitDelta: resChurnUp.summary.totalProfit - baseProfit, breakEven: resChurnUp.summary.breakEvenMonth });

    const signupDown = JSON.parse(JSON.stringify(scenario));
    signupDown.funnel.visitorToSignupRate *= 0.9;
    const resSignupDown = calculateSaasModel(signupDown);
    variations.push({ name: 'Visitor to Signup -10%', profitDelta: resSignupDown.summary.totalProfit - baseProfit, breakEven: resSignupDown.summary.breakEvenMonth });

    const organicUp = JSON.parse(JSON.stringify(scenario));
    organicUp.acquisition.organicSessions.startValue *= 1.2;
    const resOrganicUp = calculateSaasModel(organicUp);
    variations.push({ name: 'Organic Sessions +20%', profitDelta: resOrganicUp.summary.totalProfit - baseProfit, breakEven: resOrganicUp.summary.breakEvenMonth });
  }

  // Sort by absolute profit delta to show biggest impact first
  variations.sort((a, b) => Math.abs(b.profitDelta) - Math.abs(a.profitDelta));

  const maxDelta = Math.max(...variations.map(v => Math.abs(v.profitDelta)));

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Sensitivity Analysis (Tornado)</h3>
      <div className="space-y-4">
        {variations.map(v => {
          const widthPct = maxDelta > 0 ? (Math.abs(v.profitDelta) / maxDelta) * 100 : 0;
          const isPositive = v.profitDelta >= 0;
          return (
            <div key={v.name} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-gray-800 text-sm">{v.name}</div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(v.profitDelta)} Profit
                  </div>
                  <div className="text-xs text-gray-500">
                    Break-even: {v.breakEven ? `M${v.breakEven}` : 'Never'}
                  </div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden relative">
                {isPositive ? (
                  <div 
                    className="absolute top-0 bottom-0 bg-emerald-500 rounded-r-full"
                    style={{ left: '50%', width: `${(widthPct / 2)}%` }}
                  />
                ) : (
                  <div 
                    className="absolute top-0 bottom-0 bg-rose-500 rounded-l-full"
                    style={{ right: '50%', width: `${(widthPct / 2)}%` }}
                  />
                )}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { results, scenarios, activeScenarioId, mode, saasScenarios, activeSaasScenarioId } = useStore();
  
  let scenarioName = 'Scenario';
  let horizon = 0;
  let activeScenario: any = null;

  if (mode === 'mobile') {
      const active = scenarios.find(s => s.id === activeScenarioId);
      if (active) { scenarioName = active.name; horizon = active.horizonMonths; activeScenario = active; }
  } else {
      const active = saasScenarios.find(s => s.id === activeSaasScenarioId);
      if (active) { scenarioName = active.name; horizon = active.horizonMonths; activeScenario = active; }
  }

  const { summary, monthlyData, unitEconomics, cohortMrr } = results;

  // Logic for Health Checks
  const alerts: string[] = [];
  if (unitEconomics.ltvCacRatio < 1) alerts.push("LTV is lower than CAC. Unit economics are negative.");
  else if (unitEconomics.ltvCacRatio < 3) alerts.push("LTV:CAC is below 3.0 (Target 3.0+ for healthy SaaS).");
  
  if (!unitEconomics.paybackMonths || unitEconomics.paybackMonths > 12) alerts.push("Payback period is greater than 12 months (or never). High capital risk.");
  if (summary.breakEvenMonth === null) alerts.push("Business does not reach cash flow break-even within the forecast horizon.");

  // Data Prep
  const cashFlowData = useMemo(() => monthlyData.map(m => ({
    name: `M${m.monthIndex}`,
    Cash: m.cashBalance,
    Profit: m.profit,
    MRR: m.mrr
  })), [monthlyData]);

  const unitEconData = useMemo(() => unitEconomics.contributionCurve.filter((_, i) => i < 36).map(c => ({
    month: c.month,
    Contribution: c.cumulativeContribution,
    CAC: unitEconomics.cac
  })), [unitEconomics]);

  const cohortChartData = useMemo(() => {
    if (!cohortMrr) return [];
    return cohortMrr.map(m => {
      const dataPoint: any = { name: `M${m.month}` };
      Object.entries(m.cohorts).forEach(([cohortName, mrr]) => {
        dataPoint[cohortName] = mrr;
      });
      return dataPoint;
    });
  }, [cohortMrr]);

  // Labels based on Mode
  const labels = {
      installs: mode === 'mobile' ? 'Installs' : 'Total Visitors',
      newPayers: mode === 'mobile' ? 'New Payers' : 'New Customers',
      cpi: mode === 'mobile' ? 'CPI (Blended)' : 'Effective CAC',
      cpiSubtext: mode === 'mobile' ? 'Spend / Install' : 'Spend / Customer',
  };

  return (
    <div className="flex-1 overflow-y-auto h-screen p-8 custom-scrollbar bg-[#F5F5F7]">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{scenarioName}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600 shadow-sm">{horizon} Month Forecast</span>
            <span className="text-gray-400 text-sm">•</span>
            <span className="text-gray-600 text-sm font-semibold">Decision Grade Analysis ({mode === 'mobile' ? 'Mobile' : 'SaaS'})</span>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => document.getElementById('table-view')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                View Data Table
            </button>
        </div>
      </div>

      <HealthBanner alerts={alerts} />

      {activeScenario && monthlyData.length > 0 && (
        <FunnelVisualization mode={mode} scenario={activeScenario} month1Data={monthlyData[0]} />
      )}

      {/* KPI Grid */}
      <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        Unit Economics 
        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Per User</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <KPICard 
          label="LTV (Net)" 
          value={formatCurrency(unitEconomics.ltv)} 
          subtext="Net Contribution after variable costs"
        />
        <KPICard 
          label="CAC (Blended)" 
          value={formatCurrency(unitEconomics.cac)} 
          subtext="Total Spend / Total Payers"
        />
        <KPICard 
          label="LTV : CAC" 
          value={`${unitEconomics.ltvCacRatio.toFixed(2)}x`} 
          status={unitEconomics.ltvCacRatio >= 3 ? 'good' : unitEconomics.ltvCacRatio >= 1 ? 'neutral' : 'bad'}
        />
        <KPICard 
          label="Payback Period" 
          value={unitEconomics.paybackMonths ? `${unitEconomics.paybackMonths} Months` : 'Never'} 
          status={unitEconomics.paybackMonths && unitEconomics.paybackMonths <= 12 ? 'good' : 'bad'}
        />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        Company Performance
        <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Aggregate</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <KPICard 
          label="Ending MRR" 
          value={formatCurrency(summary.finalMrr)} 
          subtext={`ARR: ${formatCurrency(summary.finalMrr * 12)}`}
        />
        <KPICard 
          label="Total Profit" 
          value={formatCurrency(summary.totalProfit)} 
          subtext="Cumulative over horizon"
          status={summary.totalProfit > 0 ? 'good' : 'neutral'}
        />
        <KPICard 
          label="Min Cash Balance" 
          value={formatCurrency(summary.maxNegativeCashflow)} 
          subtext="Max capital exposure"
        />
        <KPICard 
          label="Break Even Month" 
          value={summary.breakEvenMonth ? `Month ${summary.breakEvenMonth}` : 'Not in range'} 
          status={summary.breakEvenMonth ? 'good' : 'bad'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Cohort Payback */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cohort Payback Curve</h3>
             <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Contribution</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> CAC</span>
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={unitEconData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.lightGray} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: COLORS.darkGray, fontWeight: 500}} dy={10} />
                <YAxis tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} tick={{fontSize: 12, fill: COLORS.darkGray, fontWeight: 500}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Outfit'}}
                  formatter={(val: number) => formatCurrency(val)} 
                />
                <Line type="monotone" dataKey="Contribution" stroke={COLORS.green} strokeWidth={3} dot={false} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="CAC" stroke={COLORS.red} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit & Cash */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cash Flow & MRR</h3>
             <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS.purple}}></span> MRR</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span> Monthly Profit</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Cash Balance</span>
             </div>
          </div>
          <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.lightGray} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: COLORS.darkGray, fontWeight: 500}} dy={10} minTickGap={30} />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} tick={{fontSize: 12, fill: COLORS.darkGray, fontWeight: 500}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Outfit'}}
                  formatter={(val: number) => formatCurrency(val)} 
                />
                <Bar dataKey="Profit" fill="#D1D5DB" radius={[4, 4, 0, 0]} barSize={12} />
                <Line type="monotone" dataKey="MRR" stroke={COLORS.purple} strokeWidth={3} dot={false} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="Cash" stroke={COLORS.blue} strokeWidth={3} dot={false} activeDot={{r: 6}} />
                <ReferenceLine y={0} stroke={COLORS.gray} strokeOpacity={0.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Cohort MRR */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Cohort MRR</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cohortChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.lightGray} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: COLORS.darkGray, fontWeight: 500}} dy={10} minTickGap={30} />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} tick={{fontSize: 12, fill: COLORS.darkGray, fontWeight: 500}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Outfit'}}
                  formatter={(val: number) => formatCurrency(val)} 
                />
                {cohortChartData.length > 0 && Object.keys(cohortChartData[0]).filter(k => k !== 'name').map((cohort, idx) => (
                  <Area 
                    key={cohort} 
                    type="monotone" 
                    dataKey={cohort} 
                    stackId="1" 
                    stroke={`hsl(${(idx * 137.5) % 360}, 70%, 50%)`} 
                    fill={`hsl(${(idx * 137.5) % 360}, 70%, 50%)`} 
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensitivity Analysis */}
        {activeScenario && (
          <SensitivityAnalysis scenario={activeScenario} mode={mode} />
        )}
      </div>

      {/* Data Table */}
      <div id="table-view" className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
           <h3 className="text-lg font-bold text-gray-900">Monthly Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-bold text-gray-500 uppercase bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4 text-right">{labels.installs}</th>
                <th className="px-6 py-4 text-right">{labels.newPayers}</th>
                <th className="px-6 py-4 text-right">Act. Subs</th>
                <th className="px-6 py-4 text-right">Gross Rev</th>
                <th className="px-6 py-4 text-right">Net Rev</th>
                <th className="px-6 py-4 text-right">Ad Spend</th>
                <th className="px-6 py-4 text-right">OpEx</th>
                <th className="px-6 py-4 text-right">Profit</th>
                <th className="px-6 py-4 text-right">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyData.map((row) => (
                <tr key={row.monthIndex} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-3 font-semibold text-gray-900">{row.monthIndex}</td>
                  <td className="px-6 py-3 text-right text-gray-700 font-numeric">{formatNumber(row.totalInstalls)}</td>
                  <td className="px-6 py-3 text-right text-gray-700 font-numeric">{formatNumber(row.newPayers)}</td>
                  <td className="px-6 py-3 text-right text-gray-700 font-numeric">{formatNumber(row.activeSubsTotal)}</td>
                  <td className="px-6 py-3 text-right text-gray-700 font-numeric">{formatCurrency(row.grossRevenue)}</td>
                  <td className="px-6 py-3 text-right text-gray-700 font-numeric">{formatCurrency(row.netRevenue)}</td>
                  <td className="px-6 py-3 text-right text-gray-700 font-numeric">{formatCurrency(row.adSpend)}</td>
                  <td className="px-6 py-3 text-right text-gray-700 font-numeric">{formatCurrency(row.fixedOpex + row.variableCosts)}</td>
                  <td className={`px-6 py-3 text-right font-bold font-numeric ${row.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(row.profit)}
                  </td>
                  <td className="px-6 py-3 text-right text-blue-600 font-bold font-numeric">{formatCurrency(row.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};