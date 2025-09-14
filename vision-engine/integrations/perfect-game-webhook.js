/**
 * Blaze Intelligence - Perfect Game Integration
 * Championship Pipeline from Youth to Pro
 * Tracking Texas talent from 12U through the draft
 */

const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const axios = require('axios');

const router = express.Router();
const db = admin.firestore();

/**
 * Perfect Game Webhook Configuration
 */
const PG_CONFIG = {
  apiUrl: process.env.PERFECT_GAME_API_URL || 'https://api.perfectgame.org',
  apiKey: process.env.PERFECT_GAME_API_KEY,
  webhookSecret: process.env.PERFECT_GAME_WEBHOOK_SECRET,

  // Event types we care about
  events: {
    PLAYER_REGISTERED: 'player.registered',
    TOURNAMENT_STARTED: 'tournament.started',
    GAME_COMPLETED: 'game.completed',
    SHOWCASE_RESULTS: 'showcase.results',
    RANKING_UPDATED: 'ranking.updated',
    COMMITMENT_ANNOUNCED: 'commitment.announced'
  },

  // Texas and SEC focus regions
  focusRegions: ['TX', 'LA', 'AR', 'MS', 'AL', 'FL', 'GA', 'SC', 'TN', 'KY'],

  // Top programs we track
  elitePrograms: [
    'Texas Longhorns', 'Texas A&M', 'Rice', 'TCU', 'Baylor',
    'LSU', 'Arkansas', 'Ole Miss', 'Mississippi State', 'Alabama',
    'Florida', 'Georgia', 'Vanderbilt', 'Tennessee', 'South Carolina'
  ]
};

/**
 * Receive Perfect Game webhook events
 */
router.post('/webhooks/perfect-game', async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyPerfectGameSignature(req)) {
      console.error('Invalid Perfect Game webhook signature');
      return res.status(401).send('Unauthorized');
    }

    const { event, data } = req.body;
    console.log(`📊 Perfect Game Event: ${event}`);

    // Process based on event type
    switch (event) {
      case PG_CONFIG.events.PLAYER_REGISTERED:
        await handlePlayerRegistration(data);
        break;

      case PG_CONFIG.events.TOURNAMENT_STARTED:
        await handleTournamentStart(data);
        break;

      case PG_CONFIG.events.GAME_COMPLETED:
        await handleGameCompleted(data);
        break;

      case PG_CONFIG.events.SHOWCASE_RESULTS:
        await handleShowcaseResults(data);
        break;

      case PG_CONFIG.events.RANKING_UPDATED:
        await handleRankingUpdate(data);
        break;

      case PG_CONFIG.events.COMMITMENT_ANNOUNCED:
        await handleCommitment(data);
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Perfect Game webhook error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

/**
 * Handle new player registration
 */
async function handlePlayerRegistration(data) {
  const {
    playerId,
    firstName,
    lastName,
    graduationYear,
    position,
    height,
    weight,
    hometown,
    state,
    highSchool,
    travelTeam
  } = data;

  // Check if player is from our focus region
  if (!PG_CONFIG.focusRegions.includes(state)) {
    console.log(`Player from ${state} - outside focus region`);
    return;
  }

  // Create player profile in our system
  const playerProfile = {
    perfectGameId: playerId,
    name: `${firstName} ${lastName}`,
    graduationYear,
    position,
    physicalProfile: { height, weight },
    location: { hometown, state, highSchool },
    travelTeam,
    registeredAt: new Date().toISOString(),

    // Initialize Blaze Intelligence metrics
    blazeMetrics: {
      visionEngineEligible: true,
      baselineEstablished: false,
      lastAnalysis: null,
      championshipPotential: null,
      characterScore: null
    },

    // Texas-specific tracking
    texasConnection: state === 'TX',
    secTarget: PG_CONFIG.focusRegions.includes(state)
  };

  // Store in Firestore
  await db.collection('pg_players').doc(playerId).set(playerProfile, { merge: true });

  // If Texas player, flag for priority analysis
  if (state === 'TX') {
    await flagForPriorityAnalysis(playerId, 'Texas prospect registered');
  }

  console.log(`✅ Registered Perfect Game player: ${firstName} ${lastName} (${graduationYear}, ${state})`);
}

/**
 * Handle tournament start - prepare for video capture
 */
async function handleTournamentStart(data) {
  const {
    tournamentId,
    name,
    location,
    startDate,
    endDate,
    level, // 12U, 14U, 16U, 17U, 18U
    teams
  } = data;

  // Check for Texas teams
  const texasTeams = teams.filter(team =>
    team.state === 'TX' || team.name.toLowerCase().includes('texas')
  );

  if (texasTeams.length === 0) {
    console.log(`No Texas teams in ${name}`);
    return;
  }

  // Create tournament tracking document
  const tournament = {
    perfectGameId: tournamentId,
    name,
    location,
    dates: { start: startDate, end: endDate },
    level,
    texasTeams: texasTeams.map(t => ({
      id: t.id,
      name: t.name,
      players: t.rosterIds || []
    })),

    // Blaze Intelligence tracking
    blazeTracking: {
      videoCaptureEnabled: true,
      priorityLevel: texasTeams.length > 5 ? 'high' : 'medium',
      expectedSessions: texasTeams.length * 3 // Estimate 3 games per team
    }
  };

  await db.collection('pg_tournaments').doc(tournamentId).set(tournament);

  // Notify scouts about tournament
  await notifyScouts({
    type: 'tournament_alert',
    tournament: name,
    texasTeams: texasTeams.length,
    location,
    startDate
  });

  console.log(`🏆 Tournament tracked: ${name} with ${texasTeams.length} Texas teams`);
}

/**
 * Handle game completion - trigger video analysis if available
 */
async function handleGameCompleted(data) {
  const {
    gameId,
    tournamentId,
    homeTeam,
    awayTeam,
    finalScore,
    playerStats,
    videoUrl // If PG provides video
  } = data;

  // Check for Texas teams
  const hasTexasTeam =
    homeTeam.state === 'TX' ||
    awayTeam.state === 'TX';

  if (!hasTexasTeam) return;

  // Process player statistics
  const championshipMoments = [];

  for (const stat of playerStats) {
    // Look for clutch performances
    if (stat.rbis >= 3 || stat.hits >= 3 || stat.strikeouts >= 10) {
      championshipMoments.push({
        playerId: stat.playerId,
        type: 'clutch_performance',
        details: stat
      });
    }
  }

  // Store game data
  const gameData = {
    perfectGameId: gameId,
    tournamentId,
    teams: { home: homeTeam, away: awayTeam },
    finalScore,
    championshipMoments,
    processedAt: new Date().toISOString()
  };

  await db.collection('pg_games').doc(gameId).set(gameData);

  // If video available, trigger Vision Engine analysis
  if (videoUrl) {
    await triggerGameVideoAnalysis(videoUrl, gameId, championshipMoments);
  }

  console.log(`⚾ Game processed: ${homeTeam.name} vs ${awayTeam.name}`);
}

/**
 * Handle showcase results - identify elite talent
 */
async function handleShowcaseResults(data) {
  const {
    showcaseId,
    playerId,
    firstName,
    lastName,
    graduationYear,
    metrics: {
      sixtyYard,
      exitVelocity,
      infieldVelo,
      outfieldVelo,
      catcherPop,
      pitchingVelo
    },
    scoutGrades,
    videoUrls
  } = data;

  // Calculate elite score based on metrics
  const eliteScore = calculateEliteScore({
    sixtyYard,
    exitVelocity,
    infieldVelo,
    outfieldVelo,
    catcherPop,
    pitchingVelo
  }, graduationYear);

  // Championship threshold check
  const isChampionshipLevel = eliteScore >= 80;

  // Update player profile
  const showcaseData = {
    showcases: admin.firestore.FieldValue.arrayUnion({
      showcaseId,
      date: new Date().toISOString(),
      metrics: data.metrics,
      scoutGrades,
      eliteScore,
      isChampionshipLevel
    }),

    // Update Blaze metrics
    'blazeMetrics.lastShowcase': new Date().toISOString(),
    'blazeMetrics.eliteScore': eliteScore,
    'blazeMetrics.championshipLevel': isChampionshipLevel
  };

  await db.collection('pg_players').doc(playerId).update(showcaseData);

  // If championship level, trigger deep analysis
  if (isChampionshipLevel && videoUrls?.length > 0) {
    await triggerChampionshipAnalysis(playerId, videoUrls, {
      firstName,
      lastName,
      graduationYear,
      eliteScore,
      metrics: data.metrics
    });
  }

  // Alert scouts for elite Texas prospects
  const player = await db.collection('pg_players').doc(playerId).get();
  if (player.data()?.texasConnection && eliteScore >= 85) {
    await alertScoutsEliteProspect({
      playerId,
      name: `${firstName} ${lastName}`,
      graduationYear,
      eliteScore,
      metrics: data.metrics
    });
  }

  console.log(`🌟 Showcase results: ${firstName} ${lastName} - Elite Score: ${eliteScore}`);
}

/**
 * Handle ranking updates
 */
async function handleRankingUpdate(data) {
  const {
    playerId,
    firstName,
    lastName,
    newRanking: {
      national,
      state,
      position,
      graduationYear
    },
    previousRanking,
    commitmentStatus
  } = data;

  // Calculate ranking movement
  const movement = {
    national: previousRanking?.national ?
      previousRanking.national - national : null,
    state: previousRanking?.state ?
      previousRanking.state - state : null,
    trend: 'stable'
  };

  if (movement.national > 10) movement.trend = 'rising';
  if (movement.national < -10) movement.trend = 'falling';

  // Update player profile
  await db.collection('pg_players').doc(playerId).update({
    currentRanking: {
      national,
      state,
      position,
      graduationYear,
      updatedAt: new Date().toISOString()
    },
    rankingMovement: movement,
    commitmentStatus
  });

  // Alert for top Texas prospects
  if (state <= 10 && data.state === 'TX') {
    await alertTopTexasProspect({
      playerId,
      name: `${firstName} ${lastName}`,
      stateRank: state,
      nationalRank: national,
      position,
      graduationYear
    });
  }

  console.log(`📈 Ranking update: ${firstName} ${lastName} - #${state} in state, #${national} national`);
}

/**
 * Handle commitment announcements
 */
async function handleCommitment(data) {
  const {
    playerId,
    firstName,
    lastName,
    school,
    conference,
    commitmentDate,
    previousOffers
  } = data;

  // Check if committing to one of our elite programs
  const isEliteProgram = PG_CONFIG.elitePrograms.includes(school);
  const isSECSchool = conference === 'SEC';
  const isTexasSchool = school.toLowerCase().includes('texas') ||
                        ['TCU', 'Rice', 'Baylor'].includes(school);

  // Update player profile
  await db.collection('pg_players').doc(playerId).update({
    commitment: {
      school,
      conference,
      date: commitmentDate,
      isEliteProgram,
      isSECSchool,
      isTexasSchool
    },
    previousOffers
  });

  // Special tracking for Texas/SEC commits
  if (isTexasSchool || isSECSchool) {
    await trackEliteCommitment({
      playerId,
      name: `${firstName} ${lastName}`,
      school,
      conference,
      isTexasSchool,
      isSECSchool
    });
  }

  console.log(`🎓 Commitment: ${firstName} ${lastName} → ${school} (${conference})`);
}

/**
 * Calculate elite score based on showcase metrics
 */
function calculateEliteScore(metrics, graduationYear) {
  const currentYear = new Date().getFullYear();
  const yearsUntilGraduation = graduationYear - currentYear;

  // Age-adjusted benchmarks
  const benchmarks = {
    sixtyYard: 7.0 - (yearsUntilGraduation * 0.1),
    exitVelocity: 90 - (yearsUntilGraduation * 2),
    infieldVelo: 80 - (yearsUntilGraduation * 2),
    outfieldVelo: 85 - (yearsUntilGraduation * 2),
    catcherPop: 2.0 + (yearsUntilGraduation * 0.05),
    pitchingVelo: 85 - (yearsUntilGraduation * 2)
  };

  let totalScore = 0;
  let metricCount = 0;

  // Calculate score for each metric
  if (metrics.sixtyYard) {
    const score = Math.min(100, (benchmarks.sixtyYard / metrics.sixtyYard) * 100);
    totalScore += score;
    metricCount++;
  }

  if (metrics.exitVelocity) {
    const score = Math.min(100, (metrics.exitVelocity / benchmarks.exitVelocity) * 100);
    totalScore += score;
    metricCount++;
  }

  if (metrics.infieldVelo) {
    const score = Math.min(100, (metrics.infieldVelo / benchmarks.infieldVelo) * 100);
    totalScore += score;
    metricCount++;
  }

  if (metrics.outfieldVelo) {
    const score = Math.min(100, (metrics.outfieldVelo / benchmarks.outfieldVelo) * 100);
    totalScore += score;
    metricCount++;
  }

  if (metrics.catcherPop) {
    const score = Math.min(100, (benchmarks.catcherPop / metrics.catcherPop) * 100);
    totalScore += score;
    metricCount++;
  }

  if (metrics.pitchingVelo) {
    const score = Math.min(100, (metrics.pitchingVelo / benchmarks.pitchingVelo) * 100);
    totalScore += score;
    metricCount++;
  }

  return metricCount > 0 ? Math.round(totalScore / metricCount) : 0;
}

/**
 * Trigger Vision Engine analysis for game video
 */
async function triggerGameVideoAnalysis(videoUrl, gameId, championshipMoments) {
  try {
    const response = await axios.post(
      `${process.env.API_BASE_URL}/api/analysis/trigger`,
      {
        videoUrl,
        metadata: {
          source: 'perfect_game',
          gameId,
          championshipMoments,
          autoDetectPlayers: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY}`
        }
      }
    );

    console.log(`🎥 Video analysis triggered for game ${gameId}`);
    return response.data;

  } catch (error) {
    console.error('Failed to trigger video analysis:', error);
  }
}

/**
 * Trigger championship-level analysis for elite prospect
 */
async function triggerChampionshipAnalysis(playerId, videoUrls, playerData) {
  const analyses = [];

  for (const videoUrl of videoUrls) {
    try {
      const response = await axios.post(
        `${process.env.API_BASE_URL}/api/analysis/trigger`,
        {
          videoUrl,
          playerId,
          metadata: {
            source: 'perfect_game_showcase',
            ...playerData,
            priorityLevel: 'championship',
            deepAnalysis: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.API_KEY}`
          }
        }
      );

      analyses.push(response.data);
    } catch (error) {
      console.error(`Analysis failed for ${videoUrl}:`, error);
    }
  }

  // Update player with analysis results
  if (analyses.length > 0) {
    await db.collection('pg_players').doc(playerId).update({
      'blazeMetrics.analyses': admin.firestore.FieldValue.arrayUnion(...analyses),
      'blazeMetrics.lastAnalysis': new Date().toISOString(),
      'blazeMetrics.baselineEstablished': true
    });
  }

  return analyses;
}

/**
 * Alert scouts about elite prospects
 */
async function alertScoutsEliteProspect(prospectData) {
  // Get all active scouts
  const scoutsSnapshot = await db.collection('scouts')
    .where('active', '==', true)
    .where('regions', 'array-contains', 'TX')
    .get();

  const notifications = [];

  scoutsSnapshot.forEach(doc => {
    const scout = doc.data();

    notifications.push({
      scoutId: doc.id,
      type: 'elite_prospect_alert',
      priority: 'high',
      prospect: prospectData,
      message: `Elite Texas prospect identified: ${prospectData.name} (${prospectData.graduationYear}) - Elite Score: ${prospectData.eliteScore}`,
      createdAt: new Date().toISOString()
    });
  });

  // Batch create notifications
  const batch = db.batch();
  notifications.forEach(notification => {
    const ref = db.collection('scout_notifications').doc();
    batch.set(ref, notification);
  });

  await batch.commit();

  console.log(`📢 Alerted ${notifications.length} scouts about elite prospect`);
}

/**
 * Verify Perfect Game webhook signature
 */
function verifyPerfectGameSignature(req) {
  const signature = req.headers['x-pg-signature'];
  const timestamp = req.headers['x-pg-timestamp'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', PG_CONFIG.webhookSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  return signature === `v1=${expectedSignature}`;
}

/**
 * Other helper functions
 */
async function flagForPriorityAnalysis(playerId, reason) {
  await db.collection('analysis_queue').add({
    playerId,
    source: 'perfect_game',
    priority: 'high',
    reason,
    queuedAt: new Date().toISOString(),
    status: 'pending'
  });
}

async function notifyScouts(notification) {
  await db.collection('scout_notifications').add({
    ...notification,
    createdAt: new Date().toISOString(),
    read: false
  });
}

async function alertTopTexasProspect(data) {
  // Send to Texas scouts specifically
  const texasScouts = await db.collection('scouts')
    .where('focus', '==', 'texas_high_school')
    .get();

  const batch = db.batch();
  texasScouts.forEach(doc => {
    const ref = db.collection('scout_notifications').doc();
    batch.set(ref, {
      scoutId: doc.id,
      type: 'top_texas_prospect',
      priority: 'critical',
      data,
      createdAt: new Date().toISOString()
    });
  });

  await batch.commit();
}

async function trackEliteCommitment(data) {
  await db.collection('elite_commitments').add({
    ...data,
    trackedAt: new Date().toISOString(),
    followUp: true
  });
}

module.exports = router;