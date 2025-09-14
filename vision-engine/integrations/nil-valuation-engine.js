/**
 * Blaze Intelligence NIL Valuation Engine
 * Championship Performance to Market Value
 * Quantifying athlete worth from Texas high school to SEC dominance
 */

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * NIL Valuation Configuration
 */
const NIL_CONFIG = {
  // Base valuations by level (annual)
  baselines: {
    highSchool: {
      elite: 10000,      // Top 100 nationally
      allState: 5000,    // All-state level
      varsity: 1000,     // Varsity starter
      jv: 100           // JV level
    },
    college: {
      power5Starter: 50000,
      power5Rotation: 25000,
      power5Bench: 10000,
      mid majorStarter: 20000,
      group5Starter: 15000,
      fcs: 5000,
      d2: 2500,
      d3: 1000,
      juco: 2000
    }
  },

  // Market multipliers by region/school
  marketMultipliers: {
    // Texas schools get premium
    texas: {
      'Texas': 3.5,           // Longhorns Nation
      'Texas A&M': 3.2,       // Aggie faithful
      'TCU': 2.0,
      'Baylor': 1.8,
      'Texas Tech': 1.7,
      'Houston': 1.6,
      'SMU': 1.5,
      'Rice': 1.3
    },
    sec: {
      'Alabama': 3.0,
      'Georgia': 2.8,
      'LSU': 2.5,
      'Florida': 2.3,
      'Tennessee': 2.2,
      'Auburn': 2.0,
      'Texas A&M': 3.2,      // Also SEC now
      'Ole Miss': 1.8,
      'Arkansas': 1.7,
      'Mississippi State': 1.6,
      'South Carolina': 1.5,
      'Missouri': 1.4,
      'Kentucky': 1.3,
      'Vanderbilt': 1.2
    }
  },

  // Performance weights
  performanceWeights: {
    championshipReadiness: 0.25,   // Vision Engine score
    biomechanical: 0.15,
    behavioral: 0.20,              // Character matters for sponsors
    clutchFactor: 0.15,
    statisticalProduction: 0.15,
    socialMedia: 0.10
  },

  // Sport-specific adjustments
  sportMultipliers: {
    football: {
      quarterback: 5.0,
      runningBack: 2.5,
      wideReceiver: 3.0,
      offensiveLine: 1.5,
      defensive: 2.0,
      special: 1.0
    },
    baseball: {
      pitcher: 2.5,
      catcher: 1.8,
      infield: 1.5,
      outfield: 1.3,
      dh: 1.0
    },
    basketball: {
      pointGuard: 3.0,
      shootingGuard: 2.5,
      forward: 2.0,
      center: 1.8
    }
  }
};

/**
 * Calculate comprehensive NIL valuation
 */
async function calculateNILValuation(playerId, options = {}) {
  try {
    console.log(`💰 Calculating NIL valuation for player ${playerId}`);

    // Fetch player data
    const playerData = await getPlayerComprehensiveData(playerId);

    if (!playerData) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Calculate base value
    const baseValue = calculateBaseValue(playerData);

    // Apply performance multipliers
    const performanceMultiplier = calculatePerformanceMultiplier(playerData);

    // Apply market factors
    const marketMultiplier = calculateMarketMultiplier(playerData);

    // Apply social media influence
    const socialMultiplier = await calculateSocialInfluence(playerData);

    // Calculate championship premium
    const championshipPremium = calculateChampionshipPremium(playerData);

    // Final valuation
    const nilValuation = {
      playerId,
      playerName: playerData.name,
      school: playerData.school,
      sport: playerData.sport,
      position: playerData.position,

      // Component scores
      components: {
        baseValue,
        performanceMultiplier,
        marketMultiplier,
        socialMultiplier,
        championshipPremium
      },

      // Final calculations
      annualValue: Math.round(
        baseValue *
        performanceMultiplier *
        marketMultiplier *
        socialMultiplier +
        championshipPremium
      ),

      // Breakdown by category
      breakdown: {
        merchandise: 0,
        socialMedia: 0,
        appearances: 0,
        camps: 0,
        endorsements: 0
      },

      // Confidence and range
      confidence: calculateConfidence(playerData),
      range: {
        low: 0,
        expected: 0,
        high: 0
      },

      // Comparable players
      comparables: [],

      // Growth potential
      growthPotential: calculateGrowthPotential(playerData),

      // Texas/SEC specific bonuses
      regionalBonuses: calculateRegionalBonuses(playerData),

      // Timestamp
      calculatedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    // Calculate category breakdown
    nilValuation.breakdown = calculateCategoryBreakdown(nilValuation.annualValue, playerData);

    // Calculate value range
    nilValuation.range = {
      low: Math.round(nilValuation.annualValue * 0.7),
      expected: nilValuation.annualValue,
      high: Math.round(nilValuation.annualValue * 1.5)
    };

    // Find comparable players
    nilValuation.comparables = await findComparablePlayers(playerData, nilValuation.annualValue);

    // Store valuation
    await storeValuation(nilValuation);

    // Check for significant changes
    await checkValuationChanges(playerId, nilValuation);

    return nilValuation;

  } catch (error) {
    console.error('NIL valuation error:', error);
    throw error;
  }
}

/**
 * Get comprehensive player data
 */
async function getPlayerComprehensiveData(playerId) {
  // Fetch from multiple sources
  const [
    playerDoc,
    visionData,
    statsData,
    socialData
  ] = await Promise.all([
    db.collection('players').doc(playerId).get(),
    getLatestVisionAnalysis(playerId),
    getPlayerStatistics(playerId),
    getPlayerSocialMetrics(playerId)
  ]);

  if (!playerDoc.exists) {
    return null;
  }

  const player = playerDoc.data();

  return {
    ...player,
    playerId,
    visionMetrics: visionData,
    statistics: statsData,
    socialMetrics: socialData
  };
}

/**
 * Calculate base value based on level and performance tier
 */
function calculateBaseValue(playerData) {
  const { level, classification, ranking } = playerData;

  let baseValue = 0;

  if (level === 'high_school') {
    if (ranking?.national <= 100) {
      baseValue = NIL_CONFIG.baselines.highSchool.elite;
    } else if (ranking?.state <= 50) {
      baseValue = NIL_CONFIG.baselines.highSchool.allState;
    } else if (classification === 'varsity') {
      baseValue = NIL_CONFIG.baselines.highSchool.varsity;
    } else {
      baseValue = NIL_CONFIG.baselines.highSchool.jv;
    }
  } else if (level === 'college') {
    const conference = playerData.conference?.toLowerCase();
    const isStarter = playerData.depthChart === 1;

    if (['sec', 'big ten', 'big 12', 'pac 12', 'acc'].includes(conference)) {
      if (isStarter) {
        baseValue = NIL_CONFIG.baselines.college.power5Starter;
      } else if (playerData.depthChart <= 3) {
        baseValue = NIL_CONFIG.baselines.college.power5Rotation;
      } else {
        baseValue = NIL_CONFIG.baselines.college.power5Bench;
      }
    } else {
      // Mid-major and below
      baseValue = NIL_CONFIG.baselines.college.midMajorStarter;
    }
  }

  return baseValue;
}

/**
 * Calculate performance multiplier from Vision Engine metrics
 */
function calculatePerformanceMultiplier(playerData) {
  const { visionMetrics, statistics } = playerData;

  if (!visionMetrics) {
    return 1.0; // No Vision Engine data, use baseline
  }

  const weights = NIL_CONFIG.performanceWeights;

  // Vision Engine scores (0-100 scale, convert to multiplier)
  const championshipScore = (visionMetrics.championshipReadiness || 50) / 50; // 2x at 100
  const biomechanicalScore = (visionMetrics.biomechanical || 50) / 50;
  const behavioralScore = (visionMetrics.behavioral || 50) / 50;
  const clutchScore = (visionMetrics.clutchFactor || 50) / 50;

  // Statistical production (normalized)
  const statsScore = calculateStatisticalScore(statistics);

  // Social media influence (handled separately)
  const socialScore = 1.0;

  const performanceMultiplier =
    championshipScore * weights.championshipReadiness +
    biomechanicalScore * weights.biomechanical +
    behavioralScore * weights.behavioral +
    clutchScore * weights.clutchFactor +
    statsScore * weights.statisticalProduction +
    socialScore * weights.socialMedia;

  // Minimum 0.5x, maximum 3x
  return Math.max(0.5, Math.min(3.0, performanceMultiplier));
}

/**
 * Calculate market multiplier based on school/region
 */
function calculateMarketMultiplier(playerData) {
  const { school, state, conference } = playerData;

  let multiplier = 1.0;

  // Check Texas schools first (highest priority)
  if (NIL_CONFIG.marketMultipliers.texas[school]) {
    multiplier = NIL_CONFIG.marketMultipliers.texas[school];
  }
  // Then check SEC schools
  else if (NIL_CONFIG.marketMultipliers.sec[school]) {
    multiplier = NIL_CONFIG.marketMultipliers.sec[school];
  }
  // Texas high school gets bonus
  else if (state === 'TX' && playerData.level === 'high_school') {
    multiplier = 1.5; // Texas HS football/baseball premium
  }

  // Sport position multiplier
  const sportMult = NIL_CONFIG.sportMultipliers[playerData.sport];
  if (sportMult && sportMult[playerData.position]) {
    multiplier *= sportMult[playerData.position];
  }

  return multiplier;
}

/**
 * Calculate social media influence multiplier
 */
async function calculateSocialInfluence(playerData) {
  const { socialMetrics } = playerData;

  if (!socialMetrics) {
    return 1.0; // No social data
  }

  const {
    instagramFollowers = 0,
    twitterFollowers = 0,
    tiktokFollowers = 0,
    engagementRate = 0
  } = socialMetrics;

  const totalFollowers = instagramFollowers + twitterFollowers + tiktokFollowers;

  // Follower tiers
  let followerMultiplier = 1.0;
  if (totalFollowers >= 1000000) {
    followerMultiplier = 5.0; // Million+ followers
  } else if (totalFollowers >= 100000) {
    followerMultiplier = 3.0; // 100K+
  } else if (totalFollowers >= 50000) {
    followerMultiplier = 2.0; // 50K+
  } else if (totalFollowers >= 10000) {
    followerMultiplier = 1.5; // 10K+
  } else if (totalFollowers >= 5000) {
    followerMultiplier = 1.2; // 5K+
  }

  // Engagement rate bonus (high engagement = more valuable)
  const engagementBonus = engagementRate > 5 ? 1.2 : 1.0;

  return followerMultiplier * engagementBonus;
}

/**
 * Calculate championship premium
 */
function calculateChampionshipPremium(playerData) {
  const { visionMetrics, achievements } = playerData;

  let premium = 0;

  // Championship readiness above 90 = significant premium
  if (visionMetrics?.championshipReadiness >= 90) {
    premium += 25000; // Elite champion potential
  } else if (visionMetrics?.championshipReadiness >= 85) {
    premium += 15000; // Championship caliber
  } else if (visionMetrics?.championshipReadiness >= 80) {
    premium += 10000; // Championship trajectory
  }

  // Actual championships won
  if (achievements?.nationalChampionships > 0) {
    premium += achievements.nationalChampionships * 50000;
  }
  if (achievements?.stateChampionships > 0) {
    premium += achievements.stateChampionships * 20000;
  }
  if (achievements?.conferenceChampionships > 0) {
    premium += achievements.conferenceChampionships * 10000;
  }

  // Individual awards
  if (achievements?.allAmerican) {
    premium += 30000;
  }
  if (achievements?.allConference) {
    premium += 15000;
  }
  if (achievements?.allState) {
    premium += 10000;
  }

  return premium;
}

/**
 * Calculate statistical production score
 */
function calculateStatisticalScore(statistics) {
  if (!statistics) return 1.0;

  // Sport-specific statistical evaluation
  const { sport, stats } = statistics;

  let score = 1.0;

  switch (sport) {
    case 'football':
      // QB: TD/INT ratio, completion %, yards
      // RB: Yards, TDs, YPC
      // WR: Catches, yards, TDs
      if (stats.position === 'quarterback') {
        const efficiency = (stats.completionPct || 50) / 50;
        const production = Math.min(2, (stats.passingTDs || 0) / 20);
        score = (efficiency + production) / 2;
      }
      break;

    case 'baseball':
      // Batting: AVG, OPS, RBIs
      // Pitching: ERA, K/9, WHIP
      if (stats.battingAverage) {
        score = Math.min(2, stats.battingAverage / 0.250);
      } else if (stats.era !== undefined) {
        score = Math.min(2, 3.00 / Math.max(1, stats.era));
      }
      break;

    case 'basketball':
      // PPG, APG, RPG, efficiency
      const ppgScore = Math.min(2, (stats.pointsPerGame || 0) / 15);
      score = ppgScore;
      break;
  }

  return Math.max(0.5, Math.min(2.0, score));
}

/**
 * Calculate confidence in valuation
 */
function calculateConfidence(playerData) {
  let confidence = 50; // Base confidence

  // More data = higher confidence
  if (playerData.visionMetrics) confidence += 20;
  if (playerData.statistics) confidence += 15;
  if (playerData.socialMetrics) confidence += 10;
  if (playerData.achievements) confidence += 5;

  return Math.min(100, confidence);
}

/**
 * Calculate growth potential
 */
function calculateGrowthPotential(playerData) {
  const {
    age,
    graduationYear,
    visionMetrics,
    trajectory
  } = playerData;

  const currentYear = new Date().getFullYear();
  const yearsToGraduation = graduationYear - currentYear;

  let potential = 'moderate';

  // Young players with high metrics = high potential
  if (yearsToGraduation >= 2 && visionMetrics?.championshipReadiness >= 80) {
    potential = 'elite';
  } else if (yearsToGraduation >= 1 && visionMetrics?.championshipReadiness >= 75) {
    potential = 'high';
  } else if (trajectory === 'improving') {
    potential = 'high';
  }

  return {
    rating: potential,
    factors: {
      yearsRemaining: yearsToGraduation,
      currentTrajectory: trajectory || 'stable',
      improvementRate: visionMetrics?.improvementRate || 0,
      ceilingEstimate: visionMetrics?.championshipReadiness ?
        Math.min(100, visionMetrics.championshipReadiness + (yearsToGraduation * 5)) : null
    }
  };
}

/**
 * Calculate regional bonuses
 */
function calculateRegionalBonuses(playerData) {
  const bonuses = {
    texasHighSchoolLegend: 0,
    secDominance: 0,
    rivalryGame: 0,
    localHero: 0
  };

  // Texas HS legend bonus
  if (playerData.state === 'TX' && playerData.achievements?.allState) {
    bonuses.texasHighSchoolLegend = 15000;
  }

  // SEC dominance bonus
  if (playerData.conference === 'SEC' && playerData.statistics?.conferenceRank <= 10) {
    bonuses.secDominance = 20000;
  }

  // Rivalry game performance
  if (playerData.achievements?.rivalryGameMVP) {
    bonuses.rivalryGame = 10000;
  }

  // Local hero (from same city as school)
  if (playerData.hometown === playerData.schoolCity) {
    bonuses.localHero = 5000;
  }

  return bonuses;
}

/**
 * Calculate category breakdown
 */
function calculateCategoryBreakdown(totalValue, playerData) {
  const { socialMetrics, sport, position } = playerData;

  const breakdown = {
    merchandise: 0,
    socialMedia: 0,
    appearances: 0,
    camps: 0,
    endorsements: 0
  };

  // High social following = more social media revenue
  const socialWeight = socialMetrics?.totalFollowers > 50000 ? 0.4 : 0.2;

  // QBs and skill positions get more merchandise
  const merchandiseWeight = ['quarterback', 'runningBack'].includes(position) ? 0.3 : 0.2;

  // Calculate breakdown
  breakdown.socialMedia = Math.round(totalValue * socialWeight);
  breakdown.merchandise = Math.round(totalValue * merchandiseWeight);
  breakdown.appearances = Math.round(totalValue * 0.2);
  breakdown.camps = Math.round(totalValue * 0.15);
  breakdown.endorsements = Math.round(
    totalValue - breakdown.socialMedia - breakdown.merchandise -
    breakdown.appearances - breakdown.camps
  );

  return breakdown;
}

/**
 * Find comparable players
 */
async function findComparablePlayers(playerData, valuationAmount) {
  const { sport, position, level, conference } = playerData;

  // Query for similar players
  const comparablesQuery = await db.collection('nil_valuations')
    .where('sport', '==', sport)
    .where('position', '==', position)
    .where('level', '==', level)
    .orderBy('annualValue')
    .startAt(valuationAmount * 0.8)
    .endAt(valuationAmount * 1.2)
    .limit(5)
    .get();

  const comparables = [];

  comparablesQuery.forEach(doc => {
    const comp = doc.data();
    if (comp.playerId !== playerData.playerId) {
      comparables.push({
        playerId: comp.playerId,
        name: comp.playerName,
        school: comp.school,
        value: comp.annualValue,
        similarity: calculateSimilarity(playerData, comp)
      });
    }
  });

  return comparables.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

/**
 * Calculate similarity between players
 */
function calculateSimilarity(player1, player2) {
  let similarity = 0;

  // Same school = high similarity
  if (player1.school === player2.school) similarity += 30;

  // Same conference
  if (player1.conference === player2.conference) similarity += 20;

  // Similar Vision Engine scores
  if (player1.visionMetrics && player2.components?.performanceMultiplier) {
    const scoreDiff = Math.abs(
      player1.visionMetrics.championshipReadiness -
      (player2.components.performanceMultiplier * 50)
    );
    similarity += Math.max(0, 25 - scoreDiff);
  }

  // Similar social following
  if (player1.socialMetrics && player2.components?.socialMultiplier) {
    similarity += 15;
  }

  // Same state
  if (player1.state === player2.state) similarity += 10;

  return similarity;
}

/**
 * Store valuation in database
 */
async function storeValuation(valuation) {
  // Store in valuations collection
  await db.collection('nil_valuations').doc(valuation.playerId).set(valuation, { merge: true });

  // Add to valuation history
  await db.collection('nil_valuation_history').add({
    ...valuation,
    historicalEntry: true
  });

  // Update player document
  await db.collection('players').doc(valuation.playerId).update({
    nilValuation: {
      current: valuation.annualValue,
      lastUpdated: valuation.calculatedAt,
      range: valuation.range,
      confidence: valuation.confidence
    }
  });
}

/**
 * Check for significant valuation changes
 */
async function checkValuationChanges(playerId, newValuation) {
  // Get previous valuation
  const previousDoc = await db.collection('nil_valuations').doc(playerId).get();

  if (!previousDoc.exists) {
    return; // First valuation
  }

  const previous = previousDoc.data();
  const percentChange = ((newValuation.annualValue - previous.annualValue) / previous.annualValue) * 100;

  // Alert if significant change (>20%)
  if (Math.abs(percentChange) > 20) {
    await db.collection('nil_alerts').add({
      playerId,
      playerName: newValuation.playerName,
      type: percentChange > 0 ? 'significant_increase' : 'significant_decrease',
      previousValue: previous.annualValue,
      newValue: newValuation.annualValue,
      percentChange,
      reasons: analyzeChangeReasons(previous, newValuation),
      createdAt: new Date().toISOString()
    });

    console.log(`⚠️ Significant NIL change for ${newValuation.playerName}: ${percentChange.toFixed(1)}%`);
  }
}

/**
 * Analyze reasons for valuation change
 */
function analyzeChangeReasons(previous, current) {
  const reasons = [];

  // Check performance changes
  if (current.components.performanceMultiplier > previous.components.performanceMultiplier * 1.1) {
    reasons.push('Improved performance metrics');
  }

  // Check social growth
  if (current.components.socialMultiplier > previous.components.socialMultiplier * 1.2) {
    reasons.push('Social media growth');
  }

  // Check market changes
  if (current.components.marketMultiplier !== previous.components.marketMultiplier) {
    reasons.push('Market factor adjustment');
  }

  // Check championship premium
  if (current.components.championshipPremium > previous.components.championshipPremium) {
    reasons.push('Championship achievement or potential increase');
  }

  return reasons;
}

/**
 * Helper functions
 */
async function getLatestVisionAnalysis(playerId) {
  const analysis = await db.collection('analysis_sessions')
    .where('playerId', '==', playerId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (analysis.empty) {
    return null;
  }

  return analysis.docs[0].data().performanceScores;
}

async function getPlayerStatistics(playerId) {
  const stats = await db.collection('player_statistics')
    .doc(playerId)
    .get();

  return stats.exists ? stats.data() : null;
}

async function getPlayerSocialMetrics(playerId) {
  const social = await db.collection('player_social')
    .doc(playerId)
    .get();

  return social.exists ? social.data() : null;
}

module.exports = {
  calculateNILValuation,
  NIL_CONFIG
};