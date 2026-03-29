import { ScenarioInput, WebSaasScenario } from './types';

export const DEFAULT_SCENARIO: ScenarioInput = {
  id: 'base-case',
  name: 'Mobile Base Case',
  horizonMonths: 24,
  marketing: {
    adSpend: { startValue: 5000, growthRateMonthly: 0.0 },
    cpi: { startValue: 3.20, growthRateMonthly: 0.0 }, 
    cpiAdvancedMode: false,
    cpiBreakdown: [
      { id: 'tt', name: 'TikTok', share: 0.2, cpi: 2.00 },
      { id: 'fb', name: 'Meta', share: 0.3, cpi: 3.75 },
      { id: 'google', name: 'Google UAC', share: 0.2, cpi: 3.25 },
      { id: 'asa', name: 'Apple Search', share: 0.2, cpi: 3.50 },
      { id: 'snap', name: 'Snapchat', share: 0.1, cpi: 2.25 },
    ],
    organicMultiplier: 0.3,
    seasonality: [0.90, 0.90, 0.90, 1.00, 1.00, 1.00, 1.10, 1.10, 1.10, 1.25, 1.25, 1.25],
  },
  funnel: {
    usingTrial: true,
    installToOnboardingRate: 0.50,
    onboardingToTrialRate: 0.20,
    installToTrialRate: 0.10, // Keep for legacy, but we'll use onboarding * trial
    trialToPaidRate: 0.40,
    installToPaidRate: 0.05, 
    refundRate: 0.04,
    planMix: {
      weekly: 0.0,
      monthly: 0.6,
      annual: 0.4,
      lifetime: 0.0,
    },
  },
  plans: {
    weekly: {
      price: 4.99,
      storeCommissionYear1: 0.30,
      storeCommissionYear2Plus: 0.15,
    },
    monthly: {
      price: 9.99,
      storeCommissionYear1: 0.30,
      storeCommissionYear2Plus: 0.15,
    },
    annual: {
      price: 59.99,
      storeCommissionYear1: 0.30,
      storeCommissionYear2Plus: 0.15,
    },
    lifetime: {
      price: 199.99,
      storeCommissionYear1: 0.30,
      storeCommissionYear2Plus: 0.15,
    },
  },
  retention: {
    mode: 'simple',
    weekly: {
      week1Churn: 0.20,
      steadyStateChurn: 0.10,
    },
    monthly: {
      month1Churn: 0.30,
      month2Churn: 0.15,
      steadyStateChurn: 0.08,
      decayFactor: 0.5,
    },
    annual: {
      year1Churn: 0.60,
      steadyStateChurn: 0.20,
    },
    advancedSurvival: {
      weekly: [0.8, 0.7, 0.65, 0.6, 0.58, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51, 0.50],
      monthly: [0.85, 0.80, 0.76, 0.73, 0.71, 0.70, 0.69, 0.68, 0.67, 0.66, 0.65, 0.64],
      annual: [0.60, 0.50, 0.45, 0.40, 0.35],
    }
  },
  costs: {
    fixedOpexMonthly: 5000,
    variableCostPerActiveSub: 0.10, 
    variableCostPerInstall: 0.00,
    supportCostPerTicket: 5.00,
    ticketsPer1000Subs: 15,
  },
};

export const BULL_CASE_PRESET: Partial<ScenarioInput> = {
  name: 'Bull Case',
  marketing: {
    ...DEFAULT_SCENARIO.marketing,
    adSpend: { startValue: 15000, growthRateMonthly: 0.05 }, 
    cpi: { startValue: 2.00, growthRateMonthly: 0.0 },
    cpiBreakdown: [
      { id: 'tt', name: 'TikTok', share: 0.2, cpi: 0.70 },
      { id: 'fb', name: 'Meta', share: 0.3, cpi: 2.00 },
      { id: 'google', name: 'Google UAC', share: 0.2, cpi: 2.65 },
      { id: 'asa', name: 'Apple Search', share: 0.2, cpi: 2.00 },
      { id: 'snap', name: 'Snapchat', share: 0.1, cpi: 1.50 },
    ],
    organicMultiplier: 0.5,
  },
  funnel: {
    ...DEFAULT_SCENARIO.funnel,
    installToOnboardingRate: 0.65,
    onboardingToTrialRate: 0.30,
    installToTrialRate: 0.15,
    trialToPaidRate: 0.60,
    refundRate: 0.025,
  },
  retention: {
    ...DEFAULT_SCENARIO.retention,
    monthly: {
      ...DEFAULT_SCENARIO.retention.monthly,
      month1Churn: 0.15,
      steadyStateChurn: 0.05,
    },
    annual: {
      ...DEFAULT_SCENARIO.retention.annual,
      year1Churn: 0.45,
    }
  }
};

export const BEAR_CASE_PRESET: Partial<ScenarioInput> = {
  name: 'Bear Case',
  marketing: {
    ...DEFAULT_SCENARIO.marketing,
    adSpend: { startValue: 2000, growthRateMonthly: 0.0 }, 
    cpi: { startValue: 5.00, growthRateMonthly: 0.02 }, 
    cpiBreakdown: [
      { id: 'tt', name: 'TikTok', share: 0.2, cpi: 4.50 },
      { id: 'fb', name: 'Meta', share: 0.3, cpi: 5.50 },
      { id: 'google', name: 'Google UAC', share: 0.2, cpi: 4.00 },
      { id: 'asa', name: 'Apple Search', share: 0.2, cpi: 5.00 },
      { id: 'snap', name: 'Snapchat', share: 0.1, cpi: 3.00 },
    ],
    organicMultiplier: 0.1,
  },
  funnel: {
    ...DEFAULT_SCENARIO.funnel,
    installToOnboardingRate: 0.30,
    onboardingToTrialRate: 0.12,
    installToTrialRate: 0.04,
    trialToPaidRate: 0.25,
    refundRate: 0.07,
  },
  retention: {
    ...DEFAULT_SCENARIO.retention,
    monthly: {
      ...DEFAULT_SCENARIO.retention.monthly,
      month1Churn: 0.45,
      steadyStateChurn: 0.12,
    },
    annual: {
      ...DEFAULT_SCENARIO.retention.annual,
      year1Churn: 0.75,
    }
  }
};

// --- SaaS Defaults ---

export const DEFAULT_SAAS_SCENARIO: WebSaasScenario = {
  id: 'saas-base',
  name: 'SaaS Base Case',
  horizonMonths: 24,
  acquisition: {
    adSpend: { startValue: 10000, growthRateMonthly: 0.0 },
    cpc: { startValue: 2.50, growthRateMonthly: 0.0 },
    organicSessions: { startValue: 2000, growthRateMonthly: 0.05 }
  },
  funnel: {
    visitorToSignupRate: 0.05,
    signupToActivationRate: 0.60,
    activationToTrialRate: 0.50,
    trialToPaidRate: 0.40,
    refundRate: 0.02
  },
  pricing: {
    monthly: { id: 'm', name: 'Pro Monthly', price: 29, billingPeriod: 'monthly' },
    annual: { id: 'a', name: 'Pro Annual', price: 290, billingPeriod: 'annual' },
    planMix: { monthly: 0.8, annual: 0.2 }
  },
  retention: {
    monthlyChurn: 0.05,
    annualRenewalRate: 0.85
  },
  costs: {
    fixedOpex: 8000,
    costPerActiveUser: 0.50,
    paymentProcessingPct: 0.029,
    paymentFixedFee: 0.30
  }
};