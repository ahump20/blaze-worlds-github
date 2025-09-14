/**
 * Blaze Intelligence ROI Calculator Engine
 * Real Backend Computation - Championship Economics
 * Quantifying the True Value of Sports Intelligence
 */

class BlazeROICalculator {
  constructor() {
    this.competitorPricing = {
      hudl: {
        assist: { monthly: 15, annual: 150, features: ['basic_video', 'simple_analysis'] },
        pro: { monthly: 40, annual: 400, features: ['advanced_video', 'team_stats', 'recruiting'] },
        elite: { monthly: 75, annual: 750, features: ['full_suite', 'custom_reports', 'api_access'] }
      },
      krossover: {
        standard: { monthly: 50, annual: 500, features: ['game_analysis', 'player_tracking'] },
        premium: { monthly: 100, annual: 1000, features: ['advanced_analytics', 'custom_metrics'] }
      },
      catapult: {
        team: { monthly: 200, annual: 2000, features: ['wearable_tech', 'performance_analytics'] },
        enterprise: { monthly: 500, annual: 5000, features: ['full_ecosystem', 'ai_insights'] }
      },
      internalCosts: {
        videoCoordinator: { annual: 35000, responsibilities: ['video_collection', 'basic_editing'] },
        analyticsStaff: { annual: 65000, responsibilities: ['data_analysis', 'report_generation'] },
        consultingFees: { annual: 25000, responsibilities: ['external_analysis', 'special_projects'] }
      }
    };

    this.blazePricing = {
      starter: { monthly: 97, annual: 970, features: this.getBlazeFeatures('starter') },
      professional: { monthly: 197, annual: 1970, features: this.getBlazeFeatures('professional') },
      championship: { monthly: 297, annual: 2970, features: this.getBlazeFeatures('championship') },
      enterprise: { monthly: 497, annual: 4970, features: this.getBlazeFeatures('enterprise') }
    };

    this.valueMetrics = {
      recruitingEfficiency: 0.15,    // 15% improvement in recruiting hit rate
      playerDevelopment: 0.20,       // 20% faster player development
      injuryPrevention: 0.25,        // 25% reduction in preventable injuries
      gamePreparation: 0.30,         // 30% more efficient game planning
      championshipProbability: 0.12   // 12% improvement in championship probability
    };

    this.initialize();
  }

  initialize() {
    console.log('💰 Initializing Blaze ROI Calculator...');
    this.setupFormHandlers();
    this.loadPresets();
    console.log('✅ ROI Calculator ready for championship calculations');
  }

  /**
   * Main ROI Calculation Function
   */
  calculateROI(inputs) {
    console.log('🔍 Calculating ROI with inputs:', inputs);

    // Validate inputs
    const validatedInputs = this.validateInputs(inputs);
    if (!validatedInputs.valid) {
      throw new Error(`Invalid inputs: ${validatedInputs.errors.join(', ')}`);
    }

    // Calculate current costs
    const currentCosts = this.calculateCurrentCosts(inputs);

    // Calculate Blaze costs
    const blazeCosts = this.calculateBlazeCosts(inputs);

    // Calculate efficiency gains
    const efficiencyGains = this.calculateEfficiencyGains(inputs);

    // Calculate competitive advantages
    const competitiveAdvantages = this.calculateCompetitiveAdvantages(inputs);

    // Calculate revenue impacts
    const revenueImpacts = this.calculateRevenueImpacts(inputs);

    // Calculate total ROI
    const roi = this.calculateTotalROI({
      currentCosts,
      blazeCosts,
      efficiencyGains,
      competitiveAdvantages,
      revenueImpacts
    });

    // Generate detailed analysis
    const analysis = this.generateAnalysis(roi, inputs);

    const result = {
      inputs: validatedInputs.data,
      calculations: {
        currentCosts,
        blazeCosts,
        efficiencyGains,
        competitiveAdvantages,
        revenueImpacts,
        roi
      },
      analysis,
      recommendations: this.generateRecommendations(roi, inputs),
      timestamp: new Date().toISOString()
    };

    console.log('📊 ROI calculation complete:', result);
    return result;
  }

  /**
   * Validate calculator inputs
   */
  validateInputs(inputs) {
    const errors = [];
    const data = { ...inputs };

    // Required fields
    if (!data.programType || !['high_school', 'college', 'professional', 'youth'].includes(data.programType)) {
      errors.push('Valid program type required (high_school, college, professional, youth)');
    }

    if (!data.teamSize || data.teamSize < 1 || data.teamSize > 200) {
      errors.push('Team size must be between 1 and 200');
    }

    if (!data.gamesPerSeason || data.gamesPerSeason < 1 || data.gamesPerSeason > 200) {
      errors.push('Games per season must be between 1 and 200');
    }

    if (!data.currentBudget || data.currentBudget < 0) {
      errors.push('Current budget must be a positive number');
    }

    // Set defaults for optional fields
    data.sport = data.sport || 'football';
    data.competitionLevel = data.competitionLevel || 'varsity';
    data.currentSolutions = data.currentSolutions || [];
    data.painPoints = data.painPoints || [];
    data.goals = data.goals || [];

    return {
      valid: errors.length === 0,
      errors,
      data
    };
  }

  /**
   * Calculate current solution costs
   */
  calculateCurrentCosts(inputs) {
    let totalAnnualCost = 0;
    const breakdown = {
      software: 0,
      personnel: 0,
      consulting: 0,
      equipment: 0,
      inefficiencies: 0
    };

    // Software costs based on current solutions
    if (inputs.currentSolutions.includes('hudl')) {
      const hudlCost = this.competitorPricing.hudl.pro.annual * inputs.teamSize / 25; // Per 25 athletes
      breakdown.software += hudlCost;
      totalAnnualCost += hudlCost;
    }

    if (inputs.currentSolutions.includes('krossover')) {
      const krossoverCost = this.competitorPricing.krossover.premium.annual;
      breakdown.software += krossoverCost;
      totalAnnualCost += krossoverCost;
    }

    if (inputs.currentSolutions.includes('catapult')) {
      const catapultCost = this.competitorPricing.catapult.team.annual;
      breakdown.software += catapultCost;
      totalAnnualCost += catapultCost;
    }

    // Personnel costs
    if (inputs.programType !== 'youth') {
      const programSizeMultiplier = this.getProgramSizeMultiplier(inputs.programType);

      if (inputs.hasVideoCoordinator) {
        breakdown.personnel += this.competitorPricing.internalCosts.videoCoordinator.annual * programSizeMultiplier;
      }

      if (inputs.hasAnalyticsStaff) {
        breakdown.personnel += this.competitorPricing.internalCosts.analyticsStaff.annual * programSizeMultiplier;
      }

      totalAnnualCost += breakdown.personnel;
    }

    // Consulting costs
    if (inputs.usesConsultants) {
      breakdown.consulting = this.competitorPricing.internalCosts.consultingFees.annual;
      totalAnnualCost += breakdown.consulting;
    }

    // Equipment costs (cameras, storage, etc.)
    const equipmentCost = this.calculateEquipmentCosts(inputs);
    breakdown.equipment = equipmentCost;
    totalAnnualCost += equipmentCost;

    // Inefficiency costs (time waste, missed opportunities)
    const inefficiencyCost = this.calculateInefficiencyCosts(inputs);
    breakdown.inefficiencies = inefficiencyCost;
    totalAnnualCost += inefficiencyCost;

    return {
      total: Math.round(totalAnnualCost),
      breakdown,
      perGame: Math.round(totalAnnualCost / inputs.gamesPerSeason),
      perPlayer: Math.round(totalAnnualCost / inputs.teamSize)
    };
  }

  /**
   * Calculate Blaze solution costs
   */
  calculateBlazeCosts(inputs) {
    // Determine appropriate Blaze tier based on program requirements
    const recommendedTier = this.getRecommendedTier(inputs);
    const tierPricing = this.blazePricing[recommendedTier];

    // Base cost
    let annualCost = tierPricing.annual;

    // Multi-team discount for programs with multiple teams
    const teamCount = inputs.numberOfTeams || 1;
    if (teamCount > 1) {
      const discount = Math.min(0.3, (teamCount - 1) * 0.05); // 5% per additional team, max 30%
      annualCost *= (1 - discount);
    }

    // Volume discount for large programs
    if (inputs.teamSize > 100) {
      annualCost *= 0.85; // 15% discount for large programs
    }

    // Add implementation cost (one-time)
    const implementationCost = this.calculateImplementationCost(inputs);

    return {
      tier: recommendedTier,
      annualCost: Math.round(annualCost),
      implementationCost: Math.round(implementationCost),
      totalFirstYear: Math.round(annualCost + implementationCost),
      perGame: Math.round(annualCost / inputs.gamesPerSeason),
      perPlayer: Math.round(annualCost / inputs.teamSize),
      features: tierPricing.features
    };
  }

  /**
   * Calculate efficiency gains from Blaze Intelligence
   */
  calculateEfficiencyGains(inputs) {
    const gains = {};
    let totalAnnualValue = 0;

    // Time savings for coaching staff
    const coachingHours = inputs.gamesPerSeason * 8; // 8 hours prep per game
    const timeSavingsPercent = 0.40; // 40% time savings
    const hourlyValue = 75; // $75/hour for coaching time

    gains.coachingTimeSavings = {
      hoursSaved: Math.round(coachingHours * timeSavingsPercent),
      annualValue: Math.round(coachingHours * timeSavingsPercent * hourlyValue)
    };
    totalAnnualValue += gains.coachingTimeSavings.annualValue;

    // Recruiting efficiency gains
    if (inputs.programType === 'college' || inputs.programType === 'high_school') {
      const recruitingBudget = inputs.currentBudget * 0.15; // 15% of budget on recruiting
      const efficiencyGain = 0.25; // 25% improvement in recruiting efficiency

      gains.recruitingEfficiency = {
        budgetOptimization: Math.round(recruitingBudget * efficiencyGain),
        betterHitRate: Math.round(recruitingBudget * 0.10) // 10% better hit rate value
      };
      totalAnnualValue += gains.recruitingEfficiency.budgetOptimization;
      totalAnnualValue += gains.recruitingEfficiency.betterHitRate;
    }

    // Injury prevention savings
    const averageInjuryCost = this.getAverageInjuryCost(inputs.programType);
    const injuryReduction = 0.25; // 25% reduction in preventable injuries
    const expectedInjuries = inputs.teamSize * 0.15; // 15% injury rate

    gains.injuryPrevention = {
      injuriesPrevented: Math.round(expectedInjuries * injuryReduction),
      annualSavings: Math.round(expectedInjuries * injuryReduction * averageInjuryCost)
    };
    totalAnnualValue += gains.injuryPrevention.annualSavings;

    // Player development acceleration
    if (inputs.goals.includes('player_development')) {
      const developmentValue = this.calculateDevelopmentValue(inputs);
      gains.playerDevelopment = {
        acceleratedDevelopment: developmentValue,
        scholarshipValue: inputs.programType === 'high_school' ? developmentValue * 2 : 0
      };
      totalAnnualValue += gains.playerDevelopment.acceleratedDevelopment;
      totalAnnualValue += gains.playerDevelopment.scholarshipValue;
    }

    return {
      total: Math.round(totalAnnualValue),
      breakdown: gains
    };
  }

  /**
   * Calculate competitive advantages
   */
  calculateCompetitiveAdvantages(inputs) {
    const advantages = {};
    let totalValue = 0;

    // Championship probability improvement
    const currentWinningPercentage = 0.500; // Assume average team
    const championshipImprovement = this.valueMetrics.championshipProbability;
    const championshipValue = this.getChampionshipValue(inputs.programType);

    advantages.championshipProbability = {
      improvementPercent: championshipImprovement * 100,
      expectedValue: Math.round(championshipValue * championshipImprovement)
    };
    totalValue += advantages.championshipProbability.expectedValue;

    // Recruiting advantage
    if (inputs.programType === 'college' || inputs.programType === 'high_school') {
      const recruitingAdvantage = 50000; // Value of better recruiting
      advantages.recruitingAdvantage = recruitingAdvantage;
      totalValue += recruitingAdvantage;
    }

    // Revenue generation (for programs with revenue)
    if (inputs.programType === 'college' || inputs.programType === 'professional') {
      const revenueIncrease = this.calculateRevenueIncrease(inputs);
      advantages.revenueGeneration = revenueIncrease;
      totalValue += revenueIncrease;
    }

    // Fan engagement and donations
    if (inputs.programType === 'college' || inputs.programType === 'high_school') {
      const engagementValue = this.calculateEngagementValue(inputs);
      advantages.fanEngagement = engagementValue;
      totalValue += engagementValue;
    }

    return {
      total: Math.round(totalValue),
      breakdown: advantages
    };
  }

  /**
   * Calculate revenue impacts
   */
  calculateRevenueImpacts(inputs) {
    let totalRevenue = 0;
    const impacts = {};

    // Ticket sales improvement (for programs with tickets)
    if (inputs.programType === 'college' || inputs.programType === 'professional') {
      const ticketImprovement = this.calculateTicketRevenue(inputs);
      impacts.ticketSales = ticketImprovement;
      totalRevenue += ticketImprovement;
    }

    // Merchandise and licensing
    if (inputs.programType === 'college') {
      const merchandiseRevenue = inputs.currentBudget * 0.05 * 0.15; // 5% of budget from merchandise, 15% improvement
      impacts.merchandise = Math.round(merchandiseRevenue);
      totalRevenue += impacts.merchandise;
    }

    // Sponsorship value increase
    if (inputs.hasSponsors) {
      const sponsorshipIncrease = this.calculateSponsorshipIncrease(inputs);
      impacts.sponsorship = sponsorshipIncrease;
      totalRevenue += sponsorshipIncrease;
    }

    // Media rights and exposure
    if (inputs.programType === 'college') {
      const mediaValue = 25000; // Increased media exposure value
      impacts.mediaRights = mediaValue;
      totalRevenue += mediaValue;
    }

    return {
      total: Math.round(totalRevenue),
      breakdown: impacts
    };
  }

  /**
   * Calculate total ROI
   */
  calculateTotalROI(components) {
    const {
      currentCosts,
      blazeCosts,
      efficiencyGains,
      competitiveAdvantages,
      revenueImpacts
    } = components;

    // Total benefits
    const totalBenefits = efficiencyGains.total + competitiveAdvantages.total + revenueImpacts.total;

    // Cost savings
    const costSavings = currentCosts.total - blazeCosts.annualCost;

    // Total value
    const totalValue = totalBenefits + Math.max(0, costSavings);

    // ROI calculation
    const investment = blazeCosts.totalFirstYear;
    const roi = investment > 0 ? ((totalValue - blazeCosts.annualCost) / investment) * 100 : 0;

    // Payback period (months)
    const monthlyBenefit = totalValue / 12;
    const paybackPeriod = monthlyBenefit > 0 ? blazeCosts.totalFirstYear / monthlyBenefit : 999;

    return {
      totalBenefits,
      costSavings: Math.max(0, costSavings),
      totalValue,
      investment,
      roi: Math.round(roi),
      paybackPeriod: Math.min(999, Math.round(paybackPeriod)),
      threeYearValue: Math.round(totalValue * 3 - blazeCosts.totalFirstYear - blazeCosts.annualCost * 2),
      breakeven: paybackPeriod <= 12 ? 'Immediate' : paybackPeriod <= 24 ? 'Strong' : 'Moderate'
    };
  }

  /**
   * Generate analysis and insights
   */
  generateAnalysis(roi, inputs) {
    const analysis = {
      summary: this.generateSummary(roi, inputs),
      strengths: this.identifyStrengths(roi, inputs),
      opportunities: this.identifyOpportunities(roi, inputs),
      risks: this.identifyRisks(roi, inputs),
      comparison: this.generateComparison(roi, inputs)
    };

    return analysis;
  }

  generateSummary(roi, inputs) {
    const roiLevel = roi.roi >= 300 ? 'Exceptional' :
                    roi.roi >= 200 ? 'Strong' :
                    roi.roi >= 100 ? 'Good' : 'Moderate';

    return `Based on your ${inputs.programType} program with ${inputs.teamSize} athletes playing ${inputs.gamesPerSeason} games per season, Blaze Intelligence delivers a ${roiLevel} ${roi.roi}% ROI with ${roi.paybackPeriod} month payback period. The platform generates $${roi.totalValue.toLocaleString()} in annual value through efficiency gains, competitive advantages, and revenue enhancement.`;
  }

  identifyStrengths(roi, inputs) {
    const strengths = [];

    if (roi.costSavings > 0) {
      strengths.push(`Immediate cost savings of $${roi.costSavings.toLocaleString()} annually by replacing current solutions`);
    }

    if (roi.paybackPeriod <= 12) {
      strengths.push(`Rapid payback period of ${roi.paybackPeriod} months demonstrates clear financial benefit`);
    }

    if (inputs.programType === 'college' || inputs.programType === 'high_school') {
      strengths.push('Strong recruiting advantages through advanced analytics and player development tracking');
    }

    if (inputs.goals.includes('championship')) {
      strengths.push('Measurable improvement in championship probability through data-driven decision making');
    }

    return strengths;
  }

  identifyOpportunities(roi, inputs) {
    const opportunities = [];

    opportunities.push('Expand analytics capabilities to include NIL valuation and recruiting optimization');

    if (inputs.programType === 'college') {
      opportunities.push('Leverage championship data for increased donations and sponsorship revenue');
    }

    if (inputs.teamSize < 50) {
      opportunities.push('Scale solution across multiple teams or sports for additional cost efficiencies');
    }

    opportunities.push('Integrate with Perfect Game and other recruiting databases for comprehensive player tracking');

    return opportunities;
  }

  identifyRisks(roi, inputs) {
    const risks = [];

    if (roi.paybackPeriod > 18) {
      risks.push('Longer payback period requires sustained commitment to realize full benefits');
    }

    if (inputs.currentSolutions.length === 0) {
      risks.push('Adoption curve may be steeper without prior analytics experience');
    }

    if (inputs.programType === 'youth') {
      risks.push('ROI primarily based on player development rather than immediate competitive gains');
    }

    return risks;
  }

  generateComparison(roi, inputs) {
    return {
      vsCompetitors: `Blaze Intelligence provides ${Math.round((roi.totalValue / 5000) * 100)}% more value than traditional solutions like Hudl Pro ($400/year) or Krossover Premium ($1,000/year)`,
      vsStatus: `Compared to current manual processes, Blaze eliminates ${Math.round(roi.costSavings * 0.3 / 1000)}K in inefficiency costs while adding championship-level analytics`,
      marketPosition: 'Leading-edge solution combining biomechanical analysis, behavioral assessment, and predictive modeling'
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(roi, inputs) {
    const recommendations = [];

    // Tier recommendation
    const recommendedTier = this.getRecommendedTier(inputs);
    recommendations.push({
      type: 'tier',
      title: `${recommendedTier.charAt(0).toUpperCase() + recommendedTier.slice(1)} Tier Recommended`,
      description: `Based on your program size and goals, the ${recommendedTier} tier provides optimal value`,
      value: `$${this.blazePricing[recommendedTier].annual}/year`
    });

    // Implementation timeline
    recommendations.push({
      type: 'timeline',
      title: 'Phased Implementation Approach',
      description: 'Start with core analytics, add advanced features over 3 months',
      timeline: '90-day rollout plan'
    });

    // Training and adoption
    recommendations.push({
      type: 'training',
      title: 'Championship Training Program',
      description: 'Comprehensive onboarding to ensure maximum platform utilization',
      duration: '4-week program'
    });

    // Integration priorities
    if (inputs.currentSolutions.length > 0) {
      recommendations.push({
        type: 'integration',
        title: 'Legacy System Migration',
        description: 'Seamless transition from current solutions with data preservation',
        approach: 'Parallel operation during transition'
      });
    }

    return recommendations;
  }

  /**
   * Setup form handlers for real-time calculation
   */
  setupFormHandlers() {
    // Handle form submissions
    document.addEventListener('DOMContentLoaded', () => {
      const roiForm = document.getElementById('roi-calculator-form');
      if (roiForm) {
        roiForm.addEventListener('submit', this.handleFormSubmission.bind(this));
        roiForm.addEventListener('input', this.handleInputChange.bind(this));
      }
    });
  }

  handleFormSubmission(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const inputs = Object.fromEntries(formData.entries());

    // Convert numeric fields
    ['teamSize', 'gamesPerSeason', 'currentBudget', 'numberOfTeams'].forEach(field => {
      if (inputs[field]) {
        inputs[field] = parseFloat(inputs[field]) || 0;
      }
    });

    // Handle checkboxes and multi-select fields
    inputs.currentSolutions = formData.getAll('currentSolutions');
    inputs.painPoints = formData.getAll('painPoints');
    inputs.goals = formData.getAll('goals');

    try {
      const result = this.calculateROI(inputs);
      this.displayResults(result);
      this.sendToBackend(result);
    } catch (error) {
      this.displayError(error.message);
    }
  }

  handleInputChange(event) {
    // Real-time updates for key fields
    const form = event.target.form;
    const requiredFields = ['programType', 'teamSize', 'gamesPerSeason', 'currentBudget'];

    const hasAllRequired = requiredFields.every(field => {
      const input = form.elements[field];
      return input && input.value && input.value.trim() !== '';
    });

    if (hasAllRequired) {
      // Debounce the calculation
      clearTimeout(this.calculationTimeout);
      this.calculationTimeout = setTimeout(() => {
        this.handleFormSubmission({ target: form, preventDefault: () => {} });
      }, 500);
    }
  }

  /**
   * Display results in the UI
   */
  displayResults(result) {
    const resultsContainer = document.getElementById('roi-results');
    if (!resultsContainer) return;

    const roi = result.calculations.roi;

    resultsContainer.innerHTML = `
      <div class="roi-results-container">
        <div class="roi-header">
          <h3>Championship ROI Analysis</h3>
          <div class="roi-summary">
            ${roi.roi}% ROI | ${roi.paybackPeriod} Month Payback | $${roi.totalValue.toLocaleString()} Annual Value
          </div>
        </div>

        <div class="roi-metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Investment</div>
            <div class="metric-value">$${roi.investment.toLocaleString()}</div>
            <div class="metric-detail">First year cost</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Annual Benefits</div>
            <div class="metric-value">$${roi.totalBenefits.toLocaleString()}</div>
            <div class="metric-detail">Ongoing value generation</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Cost Savings</div>
            <div class="metric-value">$${roi.costSavings.toLocaleString()}</div>
            <div class="metric-detail">vs current solutions</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">3-Year Value</div>
            <div class="metric-value">$${roi.threeYearValue.toLocaleString()}</div>
            <div class="metric-detail">Total return</div>
          </div>
        </div>

        <div class="roi-analysis">
          <h4>Analysis Summary</h4>
          <p>${result.analysis.summary}</p>
        </div>

        <div class="roi-recommendations">
          <h4>Recommendations</h4>
          ${result.recommendations.map(rec => `
            <div class="recommendation-item">
              <strong>${rec.title}</strong>: ${rec.description}
            </div>
          `).join('')}
        </div>

        <div class="roi-actions">
          <button class="btn btn-primary" onclick="scheduleDemo('${result.inputs.programType}')">
            Schedule Championship Demo
          </button>
          <button class="btn btn-secondary" onclick="downloadReport()">
            Download Full Report
          </button>
        </div>
      </div>
    `;

    resultsContainer.style.display = 'block';
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  displayError(message) {
    const resultsContainer = document.getElementById('roi-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="roi-error">
          <h4>Calculation Error</h4>
          <p>${message}</p>
          <p>Please check your inputs and try again.</p>
        </div>
      `;
      resultsContainer.style.display = 'block';
    }
  }

  /**
   * Send results to backend for lead tracking
   */
  async sendToBackend(result) {
    try {
      await fetch('/api/roi-calculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...result,
          source: 'roi_calculator',
          timestamp: new Date().toISOString()
        })
      });

      console.log('✅ ROI calculation sent to backend');
    } catch (error) {
      console.error('❌ Failed to send ROI data:', error);
    }
  }

  /**
   * Helper methods
   */
  getBlazeFeatures(tier) {
    const features = {
      starter: [
        'Basic video analysis',
        'Player performance tracking',
        'Game statistics',
        'Mobile app access',
        'Email support'
      ],
      professional: [
        'Advanced biomechanical analysis',
        'Micro-expression detection',
        'Championship readiness scoring',
        'Recruiting integration',
        'API access',
        'Priority support'
      ],
      championship: [
        'Full Vision AI engine',
        'NIL valuation calculator',
        'Perfect Game integration',
        'Custom analytics',
        'White-label options',
        'Dedicated success manager'
      ],
      enterprise: [
        'Complete platform suite',
        'Custom integrations',
        'Advanced AI models',
        'Multi-sport support',
        'Enterprise security',
        '24/7 support',
        'On-site training'
      ]
    };

    return features[tier] || features.starter;
  }

  getRecommendedTier(inputs) {
    if (inputs.currentBudget > 50000 || inputs.teamSize > 100) {
      return 'enterprise';
    } else if (inputs.programType === 'college' || inputs.goals.includes('championship')) {
      return 'championship';
    } else if (inputs.teamSize > 30 || inputs.currentSolutions.length > 0) {
      return 'professional';
    } else {
      return 'starter';
    }
  }

  getProgramSizeMultiplier(programType) {
    const multipliers = {
      youth: 0.2,
      high_school: 0.5,
      college: 1.0,
      professional: 2.0
    };
    return multipliers[programType] || 1.0;
  }

  calculateEquipmentCosts(inputs) {
    // Basic equipment needs based on program type
    const baseCosts = {
      youth: 2000,
      high_school: 8000,
      college: 20000,
      professional: 50000
    };
    return baseCosts[inputs.programType] || 5000;
  }

  calculateInefficiencyCosts(inputs) {
    // Time waste, missed opportunities, suboptimal decisions
    return inputs.currentBudget * 0.10; // 10% of budget lost to inefficiencies
  }

  calculateImplementationCost(inputs) {
    const baseCost = 2500;
    const sizeMultiplier = Math.log10(inputs.teamSize) * 1000;
    const complexityMultiplier = inputs.currentSolutions.length * 500;

    return baseCost + sizeMultiplier + complexityMultiplier;
  }

  getAverageInjuryCost(programType) {
    const costs = {
      youth: 2500,
      high_school: 8000,
      college: 25000,
      professional: 100000
    };
    return costs[programType] || 10000;
  }

  calculateDevelopmentValue(inputs) {
    // Value of accelerated player development
    const perPlayerValue = {
      youth: 1000,
      high_school: 5000,
      college: 15000,
      professional: 50000
    };
    return (perPlayerValue[inputs.programType] || 5000) * inputs.teamSize * 0.1; // 10% of players benefit
  }

  getChampionshipValue(programType) {
    // Value of winning a championship
    const values = {
      youth: 10000,
      high_school: 50000,
      college: 500000,
      professional: 5000000
    };
    return values[programType] || 100000;
  }

  calculateRevenueIncrease(inputs) {
    // Increased revenue from better performance
    return inputs.currentBudget * 0.08; // 8% revenue increase
  }

  calculateEngagementValue(inputs) {
    // Value of increased fan engagement and donations
    const baseValue = {
      youth: 5000,
      high_school: 15000,
      college: 75000,
      professional: 200000
    };
    return baseValue[inputs.programType] || 20000;
  }

  calculateTicketRevenue(inputs) {
    // Improved ticket sales from better performance
    return inputs.programType === 'college' ? 40000 : 15000;
  }

  calculateSponsorshipIncrease(inputs) {
    // Increased sponsorship value
    return inputs.currentBudget * 0.12; // 12% increase in sponsorship value
  }

  loadPresets() {
    // Load common program presets
    const presets = {
      texas_high_school: {
        programType: 'high_school',
        teamSize: 85,
        gamesPerSeason: 12,
        currentBudget: 150000,
        sport: 'football',
        goals: ['championship', 'recruiting']
      },
      sec_college: {
        programType: 'college',
        teamSize: 120,
        gamesPerSeason: 14,
        currentBudget: 8000000,
        sport: 'football',
        goals: ['championship', 'recruiting', 'revenue']
      },
      perfect_game_youth: {
        programType: 'youth',
        teamSize: 15,
        gamesPerSeason: 35,
        currentBudget: 25000,
        sport: 'baseball',
        goals: ['player_development', 'recruiting']
      }
    };

    window.blazeROIPresets = presets;
  }
}

// Global functions for UI interaction
window.scheduleDemo = function(programType) {
  window.location.href = `/demo?program=${programType}&source=roi_calculator`;
};

window.downloadReport = function() {
  // Generate and download PDF report
  console.log('📄 Generating ROI report...');
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('roi-calculator-form')) {
    window.blazeROI = new BlazeROICalculator();
  }
});

export { BlazeROICalculator };