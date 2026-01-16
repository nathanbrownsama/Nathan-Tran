import { ScenarioInput } from './types';

export const DEFAULT_SCENARIO: ScenarioInput = {
  id: 'base-case',
  name: 'Base Case',
  horizonMonths: 24,
  marketing: {
    adSpend: { startValue: 5000, growthRateMonthly: 0.0 },
    cpi: { startValue: 2.70, growthRateMonthly: 0.0 }, // Blended: (0.2*3.5) + (0*1.5) + (0.3*5) + (0.5*1) = 2.7
    cpiAdvancedMode: false,
    cpiBreakdown: [
      { id: 'fb', name: 'Facebook', share: 0.2, cpi: 3.50 },
      { id: 'tt', name: 'TikTok', share: 0.0, cpi: 1.50 },
      { id: 'asa', name: 'Apple Search', share: 0.3, cpi: 5.00 },
      { id: 'google', name: 'Google Ads', share: 0.5, cpi: 1.00 },
    ],
    organicMultiplier: 0.2,
  },
  funnel: {
    usingTrial: true,
    installToTrialRate: 0.03,
    trialToPaidRate: 0.60,
    installToPaidRate: 0.05, 
    refundRate: 0.05,
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
      steadyStateChurn: 0.05,
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
    variableCostPerActiveSub: 0.10, // Hosting/Infra
    variableCostPerInstall: 0.00,
    supportCostPerTicket: 5.00,
    ticketsPer1000Subs: 15,
  },
};

export const BULL_CASE_PRESET: Partial<ScenarioInput> = {
  name: 'Bull Case',
  marketing: {
    ...DEFAULT_SCENARIO.marketing,
    adSpend: { startValue: 15000, growthRateMonthly: 0.05 }, // Aggressive spend growth
    organicMultiplier: 0.5,
  },
  funnel: {
    ...DEFAULT_SCENARIO.funnel,
    installToTrialRate: 0.20,
    trialToPaidRate: 0.70,
  }
};

export const BEAR_CASE_PRESET: Partial<ScenarioInput> = {
  name: 'Bear Case',
  marketing: {
    ...DEFAULT_SCENARIO.marketing,
    cpi: { startValue: 4.00, growthRateMonthly: 0.02 }, // Rising costs
    organicMultiplier: 0.05,
  },
  funnel: {
    ...DEFAULT_SCENARIO.funnel,
    installToTrialRate: 0.02,
    trialToPaidRate: 0.40,
  }
};