import { ScenarioInput, ModelOutput, MonthlyMetric, PlanType, UnitEconomics } from '../types';

// --- Helper Functions ---

function getSurvivalCurve(input: ScenarioInput, plan: PlanType, length: number): number[] {
  const { retention } = input;
  const curve: number[] = [1.0]; // Month 0 (purchase) is always 100%

  if (retention.mode === 'advanced') {
    // Map advanced inputs to monthly survival
    if (plan === 'monthly') {
       return [1.0, ...retention.advancedSurvival.monthly.slice(0, length)];
    }
    if (plan === 'annual') {
       // Convert yearly survival checkpoints to monthly steps
       // Year 1 survival applies at month 12
       const yearly = retention.advancedSurvival.annual;
       const monthly = new Array(length).fill(0);
       monthly[0] = 1.0;
       
       for(let m=1; m<length; m++) {
         const yearIdx = Math.floor(m / 12);
         if (yearIdx === 0) monthly[m] = 1.0; // Active during year 1
         else {
            // Apply drop at month 12, 24, etc.
            const rate = yearly[yearIdx - 1] || yearly[yearly.length-1] || 0;
            monthly[m] = rate;
         }
       }
       return monthly;
    }
    if (plan === 'weekly') {
      // Approximate 4.33 weeks per month
      const weekly = retention.advancedSurvival.weekly;
      const monthly = [];
      for(let m=0; m<length; m++) {
        const weekIdx = Math.floor(m * 4.33);
        const rate = weekly[weekIdx] ?? (weekly[weekly.length-1] || 0);
        monthly.push(rate);
      }
      return monthly;
    }
    return new Array(length).fill(1.0); // Lifetime
  }

  // Simple Mode Calculation
  if (plan === 'monthly') {
    let currentChurn = retention.monthly.month1Churn;
    for (let i = 1; i < length; i++) {
      if (i === 1) {
        currentChurn = retention.monthly.month1Churn;
      } else if (i === 2) {
        currentChurn = retention.monthly.month2Churn ?? retention.monthly.steadyStateChurn;
      } else {
        currentChurn = currentChurn - (currentChurn - retention.monthly.steadyStateChurn) * retention.monthly.decayFactor;
        if (currentChurn < retention.monthly.steadyStateChurn) currentChurn = retention.monthly.steadyStateChurn;
      }
      const prev = curve[i - 1];
      curve.push(prev * (1 - currentChurn));
    }
  } else if (plan === 'annual') {
    // Step function: 100% for months 0-11, then drops at 12, 24...
    for (let i = 1; i < length; i++) {
       const yearIdx = Math.floor(i / 12);
       // Year 0: 100%
       // Year 1: (1 - y1Churn)
       // Year 2+: (1 - y1Churn) * (1 - steady)^n
       let rate = 1.0;
       if (yearIdx >= 1) rate *= (1 - retention.annual.year1Churn);
       for(let y=2; y <= yearIdx; y++) {
         rate *= (1 - retention.annual.steadyStateChurn);
       }
       curve.push(rate);
    }
  } else if (plan === 'weekly') {
    // Convert weekly params to effective monthly
    const weeksPerMonth = 4.33;
    const effInitialChurn = 1 - Math.pow(1 - retention.weekly.week1Churn, weeksPerMonth);
    const effSteadyChurn = 1 - Math.pow(1 - retention.weekly.steadyStateChurn, weeksPerMonth);
    
    let currentChurn = effInitialChurn;
    for (let i = 1; i < length; i++) {
      const prev = curve[i - 1];
      curve.push(prev * (1 - currentChurn));
      currentChurn = currentChurn - (currentChurn - effSteadyChurn) * 0.5; // Fast decay for weekly
      if (currentChurn < effSteadyChurn) currentChurn = effSteadyChurn;
    }
  } else {
    // Lifetime
    for(let i=1; i<length; i++) curve.push(1.0);
  }

  return curve;
}

// --- Main Calculation ---

export function calculateModel(input: ScenarioInput): ModelOutput {
  const { horizonMonths, marketing, funnel, plans, costs } = input;
  
  // 1. Prepare Survival Curves (extend beyond horizon for LTV calc)
  const calcHorizon = Math.max(horizonMonths, 60); 
  const survivalCurves: Record<PlanType, number[]> = {
    weekly: getSurvivalCurve(input, 'weekly', calcHorizon + 12),
    monthly: getSurvivalCurve(input, 'monthly', calcHorizon + 12),
    annual: getSurvivalCurve(input, 'annual', calcHorizon + 12),
    lifetime: getSurvivalCurve(input, 'lifetime', calcHorizon + 12),
  };

  const monthlyData: MonthlyMetric[] = [];
  const cohortMrr: { month: number; cohorts: Record<string, number> }[] = [];
  let cumulativeProfit = 0;
  
  // Track Payers: cohorts[plan][month_acquired] = count
  const cohorts: Record<PlanType, number[]> = {
    weekly: new Array(calcHorizon + 1).fill(0),
    monthly: new Array(calcHorizon + 1).fill(0),
    annual: new Array(calcHorizon + 1).fill(0),
    lifetime: new Array(calcHorizon + 1).fill(0),
  };

  // --- Aggregate Simulation (Month by Month) ---
  for (let m = 1; m <= horizonMonths; m++) {
    // A. Marketing & Acquisition
    // Apply linear growth if specified
    const currentAdSpend = marketing.adSpend.startValue * Math.pow(1 + marketing.adSpend.growthRateMonthly, m - 1);
    const currentCpi = marketing.cpi.startValue * Math.pow(1 + marketing.cpi.growthRateMonthly, m - 1);
    
    const seasonalityMultiplier = marketing.seasonality ? marketing.seasonality[(m - 1) % 12] : 1;
    const paidInstalls = currentCpi > 0 ? (currentAdSpend / currentCpi) * seasonalityMultiplier : 0;
    const organicInstalls = paidInstalls * marketing.organicMultiplier;
    const totalInstalls = paidInstalls + organicInstalls;

    // B. Funnel
    let trials = 0;
    let newPayers = 0;
    if (funnel.usingTrial) {
      const effectiveInstallToTrial = (funnel.installToOnboardingRate !== undefined && funnel.onboardingToTrialRate !== undefined) 
        ? (funnel.installToOnboardingRate * funnel.onboardingToTrialRate) 
        : funnel.installToTrialRate;
      trials = totalInstalls * effectiveInstallToTrial;
      newPayers = trials * funnel.trialToPaidRate;
    } else {
      newPayers = totalInstalls * funnel.installToPaidRate;
    }

    const newPayersByPlan = {
      weekly: newPayers * funnel.planMix.weekly,
      monthly: newPayers * funnel.planMix.monthly,
      annual: newPayers * funnel.planMix.annual,
      lifetime: newPayers * funnel.planMix.lifetime,
    };

    // Store cohort
    cohorts.weekly[m] = newPayersByPlan.weekly;
    cohorts.monthly[m] = newPayersByPlan.monthly;
    cohorts.annual[m] = newPayersByPlan.annual;
    cohorts.lifetime[m] = newPayersByPlan.lifetime;

    // C. Revenue & Costs Recognition
    let activeSubsTotal = 0;
    const activeSubsByPlan = { weekly: 0, monthly: 0, annual: 0, lifetime: 0 };
    let grossRevenue = 0;
    let netRevenue = 0;
    let mrr = 0;
    const currentCohortMrr: Record<string, number> = {};

    (Object.keys(plans) as PlanType[]).forEach(plan => {
      let planActive = 0;
      let planGross = 0;
      let planNet = 0;
      
      const config = plans[plan];
      
      // Look back at all previous cohorts (c = start month)
      for (let c = 1; c <= m; c++) {
        const cohortStart = cohorts[plan][c];
        if (cohortStart < 0.01) continue;

        const age = m - c; // 0 for acquisition month
        const survival = survivalCurves[plan][age] || 0;
        const currentActive = cohortStart * survival;
        
        planActive += currentActive;

        // Billing Logic
        let isBillingEvent = false;
        let billingMultiplier = 1;

        if (plan === 'monthly') isBillingEvent = true; // Pays every month
        if (plan === 'weekly') { isBillingEvent = true; billingMultiplier = 4.33; }
        if (plan === 'annual') isBillingEvent = (age % 12 === 0);
        if (plan === 'lifetime') isBillingEvent = (age === 0);

        if (isBillingEvent && currentActive > 0) {
          const revenue = currentActive * config.price * billingMultiplier;
          planGross += revenue;

          // Commission logic: Year 1 vs Year 2+
          // Age 0-11 months = Year 1. Age 12+ = Year 2.
          const isYear1 = age < 12;
          const commRate = isYear1 ? config.storeCommissionYear1 : config.storeCommissionYear2Plus;
          
          const revenueAfterComm = revenue * (1 - commRate);
          const revenueAfterRefund = revenueAfterComm * (1 - funnel.refundRate);
          
          planNet += revenueAfterRefund;
        }

        // MRR Logic (Normalized monthly value)
        let cohortMrrForC = 0;
        if (plan === 'monthly') cohortMrrForC = currentActive * config.price;
        if (plan === 'weekly') cohortMrrForC = currentActive * config.price * 4.33;
        if (plan === 'annual') cohortMrrForC = currentActive * (config.price / 12);
        
        mrr += cohortMrrForC;
        if (cohortMrrForC > 0) {
          currentCohortMrr[`Month ${c}`] = (currentCohortMrr[`Month ${c}`] || 0) + cohortMrrForC;
        }
      }
      
      activeSubsByPlan[plan] = planActive;
      activeSubsTotal += planActive;
      grossRevenue += planGross;
      netRevenue += planNet;
    });

    // D. Expenses
    const supportCosts = (costs.supportCostPerTicket * costs.ticketsPer1000Subs * (activeSubsTotal / 1000));
    const varCostSubs = activeSubsTotal * costs.variableCostPerActiveSub;
    const varCostInstalls = totalInstalls * costs.variableCostPerInstall;
    const variableCosts = supportCosts + varCostSubs + varCostInstalls;

    const contribution = netRevenue - variableCosts;
    const profit = contribution - costs.fixedOpexMonthly - currentAdSpend;

    cumulativeProfit += profit;

    monthlyData.push({
      monthIndex: m,
      adSpend: currentAdSpend,
      cpi: currentCpi,
      paidInstalls,
      organicInstalls,
      totalInstalls,
      trials,
      newPayers,
      activeSubsTotal,
      activeSubsByPlan,
      grossRevenue,
      netRevenue,
      variableCosts,
      fixedOpex: costs.fixedOpexMonthly,
      contributionMargin: contribution,
      profit,
      cumulativeProfit,
      cashBalance: cumulativeProfit, // simplified
      mrr,
      arr: mrr * 12
    });
    
    cohortMrr.push({ month: m, cohorts: currentCohortMrr });
  }


  // --- Unit Economics (Theoretical Cohort Analysis) ---
  // Simulate 1 blended user for 60 months
  const unitEconHorizon = 60;
  let cumContribution = 0;
  const contributionCurve: { month: number; cumulativeContribution: number }[] = [];
  
  // Calculate Blended CAC
  // Use month 1 stats as baseline for Unit Econ CAC
  const m1 = monthlyData[0];
  const blendedCac = m1.newPayers > 0 ? m1.adSpend / m1.newPayers : 0;

  for (let t = 0; t < unitEconHorizon; t++) {
    let monthlyContribution = 0;

    (Object.keys(plans) as PlanType[]).forEach(plan => {
      const share = funnel.planMix[plan];
      if (share <= 0) return;
      
      const survival = survivalCurves[plan][t] || 0;
      const config = plans[plan];
      const activeUserShare = share * survival;

      if (activeUserShare <= 0) return;

      // Revenue Event
      let revenue = 0;
      let isBilling = false;
      let mult = 1;
      
      if (plan === 'monthly') isBilling = true;
      if (plan === 'weekly') { isBilling = true; mult = 4.33; }
      if (plan === 'annual') isBilling = (t % 12 === 0);
      if (plan === 'lifetime') isBilling = (t === 0);

      if (isBilling) {
        const gross = config.price * mult;
        const comm = (t < 12) ? config.storeCommissionYear1 : config.storeCommissionYear2Plus;
        const net = gross * (1 - comm) * (1 - funnel.refundRate);
        revenue = net;
      }

      // Variable Costs (incurred every active month)
      const subVarCost = costs.variableCostPerActiveSub + (costs.supportCostPerTicket * costs.ticketsPer1000Subs / 1000);
      
      // Install cost is CAC, not variable here usually, but prompt asked for varCostPerInstall in VariableCosts.
      // In LTV calc, we subtract post-acquisition variable costs. Install cost is acquisition.
      // We will deduct subVarCost * activeUserShare.
      
      monthlyContribution += (activeUserShare * revenue) - (activeUserShare * subVarCost);
    });

    cumContribution += monthlyContribution;
    contributionCurve.push({ month: t + 1, cumulativeContribution: cumContribution });
  }

  // Payback Month
  const paybackMonthData = contributionCurve.find(p => p.cumulativeContribution >= blendedCac);
  const paybackMonths = paybackMonthData ? paybackMonthData.month : null;

  const summary = {
    totalProfit: cumulativeProfit,
    maxNegativeCashflow: Math.min(...monthlyData.map(m => m.cumulativeProfit)),
    breakEvenMonth: monthlyData.find(m => m.cumulativeProfit >= 0)?.monthIndex || null,
    finalMrr: monthlyData[monthlyData.length - 1].mrr,
  };

  return {
    monthlyData,
    summary,
    unitEconomics: {
      ltv: cumContribution,
      cac: blendedCac,
      ltvCacRatio: blendedCac > 0 ? cumContribution / blendedCac : 0,
      paybackMonths,
      contributionCurve
    },
    cohortMrr
  };
}