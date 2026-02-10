export type AppMode = 'mobile' | 'saas';

// --- Shared Types ---

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

// --- Mobile Specific Types ---

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
  advancedSurvival: {
    weekly: number[];
    monthly: number[];
    annual: number[];
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

// --- SaaS Specific Types ---

export type SaasBillingPeriod = 'monthly' | 'annual';

export interface SaasPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: SaasBillingPeriod;
}

export interface SaasAcquisition {
  adSpend: GrowthInput;
  cpc: GrowthInput; // Cost Per Click/Visitor
  organicSessions: GrowthInput;
}

export interface SaasFunnel {
  visitorToSignupRate: number;
  signupToActivationRate: number;
  activationToTrialRate: number;
  trialToPaidRate: number;
  refundRate: number;
}

export interface SaasRetention {
  monthlyChurn: number; // Simple monthly churn
  annualRenewalRate: number; // % who renew annually
}

export interface SaasCosts {
  fixedOpex: number;
  costPerActiveUser: number; // Server/Infra
  paymentProcessingPct: number; // e.g. 0.029
  paymentFixedFee: number; // e.g. 0.30
}

export interface WebSaasScenario {
  id: string;
  name: string;
  horizonMonths: number;
  acquisition: SaasAcquisition;
  funnel: SaasFunnel;
  pricing: {
    monthly: SaasPlan;
    annual: SaasPlan;
    planMix: { monthly: number; annual: number }; // Sum 1.0
  };
  retention: SaasRetention;
  costs: SaasCosts;
}

// --- Result Interfaces ---

export interface MonthlyMetric {
  monthIndex: number; // 1-based
  
  // Acquisition / Traffic
  adSpend: number;
  cpi: number; // Effective CPA/CPI
  paidInstalls: number; // OR Paid Users/Signups
  organicInstalls: number; // OR Organic Users/Signups
  totalInstalls: number; // OR Total New Users/Signups (Top of Funnel)
  
  // Funnel
  trials: number;
  newPayers: number;
  
  // Subscriber Base
  activeSubsTotal: number;
  activeSubsByPlan: Record<string, number>; // Generic keys
  
  // Financials
  grossRevenue: number;
  netRevenue: number; // After comms/fees & refunds
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