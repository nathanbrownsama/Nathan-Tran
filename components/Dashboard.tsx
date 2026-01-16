import React, { useMemo } from 'react';
import { useStore } from '../store';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, Legend, ComposedChart, ReferenceLine 
} from 'recharts';

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

export const Dashboard: React.FC = () => {
  const { results, scenarios, activeScenarioId } = useStore();
  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  if (!activeScenario) {
     return <div className="flex items-center justify-center h-full text-gray-500 font-medium">Loading Scenario...</div>;
  }

  const { summary, monthlyData, unitEconomics } = results;

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

  return (
    <div className="flex-1 overflow-y-auto h-screen p-8 custom-scrollbar bg-[#F5F5F7]">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{activeScenario.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-600 shadow-sm">{activeScenario.horizonMonths} Month Forecast</span>
            <span className="text-gray-400 text-sm">•</span>
            <span className="text-gray-600 text-sm font-semibold">Decision Grade Analysis</span>
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
                <th className="px-6 py-4 text-right">Installs</th>
                <th className="px-6 py-4 text-right">Payers</th>
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