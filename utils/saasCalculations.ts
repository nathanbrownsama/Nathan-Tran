import { WebSaasScenario, ModelOutput, MonthlyMetric } from '../types';

export function calculateSaasModel(input: WebSaasScenario): ModelOutput {
  const { horizonMonths, acquisition, funnel, pricing, retention, costs } = input;
  const horizon = Math.max(horizonMonths, 60);

  const monthlyData: MonthlyMetric[] = [];
  let cumulativeProfit = 0;
  const cohortMrr: { month: number; cohorts: Record<string, number> }[] = [];

  // Track cohorts for survival
  // cohorts[plan][month_acquired] = count
  const cohorts: Record<'monthly' | 'annual', number[]> = {
    monthly: new Array(horizon + 1).fill(0),
    annual: new Array(horizon + 1).fill(0),
  };

  for (let m = 1; m <= input.horizonMonths; m++) {
    // 1. Traffic & Acquisition
    const currentAdSpend = acquisition.adSpend.startValue * Math.pow(1 + acquisition.adSpend.growthRateMonthly, m - 1);
    const currentCpc = acquisition.cpc.startValue * Math.pow(1 + acquisition.cpc.growthRateMonthly, m - 1);
    const organicSessions = acquisition.organicSessions.startValue * Math.pow(1 + acquisition.organicSessions.growthRateMonthly, m - 1);

    const paidSessions = currentCpc > 0 ? currentAdSpend / currentCpc : 0;
    const totalSessions = paidSessions + organicSessions;

    // 2. Funnel
    // Visitor -> Signup -> Activated -> Trial -> Paid
    const signups = totalSessions * funnel.visitorToSignupRate;
    const activated = signups * funnel.signupToActivationRate;
    const trials = activated * funnel.activationToTrialRate;
    const newPayers = trials * funnel.trialToPaidRate;

    const newPayersMonthly = newPayers * pricing.planMix.monthly;
    const newPayersAnnual = newPayers * pricing.planMix.annual;

    cohorts.monthly[m] = newPayersMonthly;
    cohorts.annual[m] = newPayersAnnual;

    // 3. Revenue & Subs
    let activeSubsTotal = 0;
    let grossRevenue = 0;
    let processingFees = 0;
    let mrr = 0;
    const activeSubsByPlan = { monthly: 0, annual: 0, weekly: 0, lifetime: 0 }; // align with shared types
    const currentMonthCohortMrr: Record<string, number> = {};

    // Monthly Plan Logic
    for (let c = 1; c <= m; c++) {
      const cohortStart = cohorts.monthly[c];
      if (cohortStart <= 0) continue;
      const age = m - c;
      // Simple exponential decay: (1 - churn)^age
      const survival = Math.pow(1 - retention.monthlyChurn, age);
      const active = cohortStart * survival;
      
      activeSubsByPlan.monthly += active;
      activeSubsTotal += active;

      // Monthly Billing
      const revenue = active * pricing.monthly.price;
      grossRevenue += revenue;
      mrr += revenue;
      currentMonthCohortMrr[`Cohort M${c}`] = (currentMonthCohortMrr[`Cohort M${c}`] || 0) + revenue;
      
      // Fees
      processingFees += (revenue * costs.paymentProcessingPct) + (active * costs.paymentFixedFee);
    }

    // Annual Plan Logic
    for (let c = 1; c <= m; c++) {
      const cohortStart = cohorts.annual[c];
      if (cohortStart <= 0) continue;
      const age = m - c;
      
      // Step decay at year mark
      const yearIdx = Math.floor(age / 12);
      const survival = Math.pow(retention.annualRenewalRate, yearIdx); // 1.0 for year 0, renewal^1 for year 1...
      const active = cohortStart * survival;

      activeSubsByPlan.annual += active;
      activeSubsTotal += active;
      const annualMrr = active * (pricing.annual.price / 12);
      mrr += annualMrr;
      currentMonthCohortMrr[`Cohort M${c}`] = (currentMonthCohortMrr[`Cohort M${c}`] || 0) + annualMrr;

      // Billing Event (Month 0, 12, 24...)
      if (age % 12 === 0) {
        const revenue = active * pricing.annual.price;
        grossRevenue += revenue;
        // Fees
        processingFees += (revenue * costs.paymentProcessingPct) + (active * costs.paymentFixedFee);
      }
    }
    
    cohortMrr.push({ month: m, cohorts: currentMonthCohortMrr });

    // 4. Financials
    const netRevenue = (grossRevenue * (1 - funnel.refundRate)) - processingFees;
    
    // Variable Costs
    const infraCost = activeSubsTotal * costs.costPerActiveUser;
    const variableCosts = infraCost; // Add more if needed

    const contribution = netRevenue - variableCosts;
    const profit = contribution - costs.fixedOpex - currentAdSpend;

    cumulativeProfit += profit;

    // "CPI" equivalent for dashboard = AdSpend / New Payers (CAC) or AdSpend / Signups
    // Let's use CAC for the dashboard metric "CPI" slot to be useful
    const effectiveCac = newPayers > 0 ? currentAdSpend / newPayers : 0;

    monthlyData.push({
      monthIndex: m,
      adSpend: currentAdSpend,
      cpi: effectiveCac, 
      paidInstalls: paidSessions, // "Paid Visitors"
      organicInstalls: organicSessions, // "Organic Visitors"
      totalInstalls: totalSessions, // "Total Visitors"
      trials: trials,
      newPayers: newPayers,
      activeSubsTotal,
      activeSubsByPlan,
      grossRevenue,
      netRevenue,
      variableCosts,
      fixedOpex: costs.fixedOpex,
      contributionMargin: contribution,
      profit,
      cumulativeProfit,
      cashBalance: cumulativeProfit,
      mrr,
      arr: mrr * 12
    });
  }

  // Unit Economics (Simplified Cohort)
  const unitHorizon = 60;
  let cumContribution = 0;
  const contributionCurve: { month: number; cumulativeContribution: number }[] = [];
  
  // Blended CAC
  const m1 = monthlyData[0];
  const blendedCac = m1.newPayers > 0 ? m1.adSpend / m1.newPayers : 0;

  for (let t = 0; t < unitHorizon; t++) {
    let monthlyContrib = 0;
    
    // Monthly Plan
    if (pricing.planMix.monthly > 0) {
        const active = pricing.planMix.monthly * Math.pow(1 - retention.monthlyChurn, t);
        const rev = active * pricing.monthly.price * (1 - funnel.refundRate);
        const fee = (rev * costs.paymentProcessingPct) + (active * costs.paymentFixedFee);
        const cost = active * costs.costPerActiveUser;
        monthlyContrib += (rev - fee - cost);
    }

    // Annual Plan
    if (pricing.planMix.annual > 0) {
        const yearIdx = Math.floor(t / 12);
        const active = pricing.planMix.annual * Math.pow(retention.annualRenewalRate, yearIdx);
        let rev = 0;
        let fee = 0;
        if (t % 12 === 0) {
            rev = active * pricing.annual.price * (1 - funnel.refundRate);
            fee = (rev * costs.paymentProcessingPct) + (active * costs.paymentFixedFee);
        }
        const cost = active * costs.costPerActiveUser;
        monthlyContrib += (rev - fee - cost);
    }

    cumContribution += monthlyContrib;
    contributionCurve.push({ month: t + 1, cumulativeContribution: cumContribution });
  }

  const paybackMonthData = contributionCurve.find(p => p.cumulativeContribution >= blendedCac);
  
  return {
    monthlyData,
    summary: {
      totalProfit: cumulativeProfit,
      maxNegativeCashflow: Math.min(...monthlyData.map(m => m.cumulativeProfit)),
      breakEvenMonth: monthlyData.find(m => m.cumulativeProfit >= 0)?.monthIndex || null,
      finalMrr: monthlyData[monthlyData.length - 1].mrr
    },
    unitEconomics: {
      ltv: cumContribution,
      cac: blendedCac,
      ltvCacRatio: blendedCac > 0 ? cumContribution / blendedCac : 0,
      paybackMonths: paybackMonthData ? paybackMonthData.month : null,
      contributionCurve
    },
    cohortMrr
  };
}