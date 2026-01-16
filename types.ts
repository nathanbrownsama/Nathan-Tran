export type PlanType = 'weekly' | 'monthly' | 'annual' | 'lifetime';

export interface ScenarioMeta {
  id: string;
  name: string;
  type: 'base' | 'bull' | 'bear' | 'custom';
}

export interface GrowthInput {
  startValue: number;
  growthRateMonthly: number; // 0.0 to 1.0 (e.g. 0.05 for 5% MoM)
}

export interface ChannelMetric {
  id: string;
  name: string;
  share: number; // 0.0 to 1.0
  cpi: number;
}

export interface MarketingInput {
  adSpend: GrowthInput; 
  cpi: GrowthInput;
  cpiAdvancedMode: boolean;
  cpiBreakdown: ChannelMetric[];
  organicMultiplier: number; // 0.5 = 50% boost
}

export interface FunnelInput {
  usingTrial: boolean;
  installToTrialRate: number; // 0-1
  trialToPaidRate: number; // 0-1
  installToPaidRate: number; // 0-1 (if no trial)
  refundRate: number; // 0-1
  planMix: {
    weekly: number;
    monthly: number;
    annual: number;
    lifetime: number;
  };
}

export interface PlanConfig {
  price: number;
  storeCommissionYear1: number;
  storeCommissionYear2Plus: number;
}

export interface RetentionInput {
  mode: 'simple' | 'advanced';
  
  // Simple Mode Params
  monthly: {
    month1Churn: number;
    steadyStateChurn: number;
    decayFactor: number;
  };
  annual: {
    year1Churn: number;
    steadyStateChurn: number;
  };
  weekly: {
    week1Churn: number;
    steadyStateChurn: number;
  };

  // Advanced Mode: Manual arrays of survival rates (0.0 to 1.0) for the first 24 periods
  advancedSurvival: {
    weekly: number[]; // 1..24 weeks
    monthly: number[]; // 1..24 months
    annual: number[]; // 1..5 years
  };
}

export interface CostsInput {
  fixedOpexMonthly: number;
  variableCostPerActiveSub: number;
  variableCostPerInstall: number;
  supportCostPerTicket: number;
  ticketsPer1000Subs: number;
}

export interface ScenarioInput {
  id: string;
  name: string;
  horizonMonths: number;
  marketing: MarketingInput;
  funnel: FunnelInput;
  plans: Record<PlanType, PlanConfig>;
  retention: RetentionInput;
  costs: CostsInput;
}

// Result Interfaces

export interface MonthlyMetric {
  monthIndex: number; // 1-based
  
  // Acquisition
  adSpend: number;
  cpi: number;
  paidInstalls: number;
  organicInstalls: number;
  totalInstalls: number;
  
  // Funnel
  trials: number;
  newPayers: number;
  
  // Subscriber Base
  activeSubsTotal: number;
  activeSubsByPlan: Record<PlanType, number>;
  
  // Financials
  grossRevenue: number;
  netRevenue: number; // After comms & refunds
  variableCosts: number;
  fixedOpex: number;
  contributionMargin: number; // NetRev - VarCost
  profit: number; // Contribution - FixedOpex - AdSpend
  
  cumulativeProfit: number;
  cashBalance: number; // Assuming starting 0
  
  mrr: number;
  arr: number;
}

export interface UnitEconomics {
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackMonths: number | null;
  contributionCurve: { month: number; cumulativeContribution: number }[];
}

export interface ModelOutput {
  monthlyData: MonthlyMetric[];
  summary: {
    totalProfit: number;
    maxNegativeCashflow: number;
    breakEvenMonth: number | null;
    finalMrr: number;
  };
  unitEconomics: UnitEconomics;
}