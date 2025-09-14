/**
 * Blaze Intelligence Vision Engine - Synthesis Function
 * Championship-Level Data Fusion and Scoring System
 * Combines biomechanical and behavioral streams into unified insights
 */

const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const { PubSub } = require('@google-cloud/pubsub');

const firestore = new Firestore();
const pubsub = new PubSub();

// Championship performance thresholds
const ELITE_THRESHOLDS = {
  biomechanics: {
    efficiency: 85,      // Elite mechanical efficiency percentage
    consistency: 90,     // Elite movement consistency
    power: 80           // Elite power generation
  },
  behavioral: {
    composure: 75,      // Championship composure threshold
    confidence: 80,     // Elite confidence level
    resilience: 70      // Championship resilience score
  },
  combined: {
    championshipReady: 85,  // Overall championship readiness
    clutchFactor: 80        // Performance under pressure
  }
};

/**
 * Main synthesis function - triggered when both analysis streams complete
 */
functions.cloudEvent('synthesisEngine', async (cloudEvent) => {
  console.log('🏆 Championship Synthesis Engine: Initiated');

  const message = JSON.parse(Buffer.from(cloudEvent.data.message.data, 'base64').toString());
  const { sessionId, completedStream } = message;

  try {
    // Update session status for completed stream
    await updateStreamStatus(sessionId, completedStream);

    // Check if both streams are complete
    const session = await firestore.collection('analysis_sessions').doc(sessionId).get();
    const sessionData = session.data();

    if (sessionData.biomechanicsStatus === 'completed' &&
        sessionData.behavioralStatus === 'completed') {

      console.log(`🔄 Both streams complete for session ${sessionId}. Initiating synthesis...`);

      // Retrieve both analysis results
      const [biomechanicsData, behavioralData] = await Promise.all([
        retrieveBiomechanicsData(sessionId),
        retrieveBehavioralData(sessionId)
      ]);

      // Generate synchronized timeline
      const synchronizedTimeline = await synchronizeTimelines(
        biomechanicsData,
        behavioralData,
        sessionData.fps || 30
      );

      // Calculate championship metrics
      const championshipMetrics = calculateChampionshipMetrics(synchronizedTimeline);

      // Identify critical moments and turning points
      const criticalMoments = identifyCriticalMoments(synchronizedTimeline);

      // Generate coaching insights
      const coachingInsights = generateChampionshipInsights(
        championshipMetrics,
        criticalMoments,
        sessionData.sport,
        sessionData.sessionType
      );

      // Calculate overall scores
      const performanceScores = {
        overall: calculateOverallScore(championshipMetrics),
        biomechanical: championshipMetrics.biomechanical.overall,
        behavioral: championshipMetrics.behavioral.overall,
        clutchFactor: calculateClutchFactor(synchronizedTimeline, criticalMoments),
        championshipReadiness: calculateChampionshipReadiness(championshipMetrics),
        improvementPotential: calculateImprovementPotential(championshipMetrics)
      };

      // Store synthesized results
      await storeSynthesizedResults(sessionId, {
        timeline: synchronizedTimeline,
        metrics: championshipMetrics,
        criticalMoments,
        insights: coachingInsights,
        scores: performanceScores,
        processingMetadata: {
          completedAt: new Date().toISOString(),
          frameCount: synchronizedTimeline.length,
          sport: sessionData.sport,
          sessionType: sessionData.sessionType
        }
      });

      // Update session with final results
      await firestore.collection('analysis_sessions').doc(sessionId).update({
        synthesisStatus: 'completed',
        completedAt: Firestore.FieldValue.serverTimestamp(),
        performanceScores,
        championshipReadiness: performanceScores.championshipReadiness,
        keyInsights: coachingInsights.slice(0, 3) // Top 3 insights
      });

      // Trigger notification for completed analysis
      await publishCompletionNotification(sessionId, sessionData.playerId, performanceScores);

      console.log(`✅ Championship synthesis complete for session ${sessionId}`);
      console.log(`🏆 Championship Readiness: ${performanceScores.championshipReadiness}%`);

    } else {
      console.log(`⏳ Waiting for other stream to complete for session ${sessionId}`);
    }

  } catch (error) {
    console.error('❌ Synthesis error:', error);
    await firestore.collection('analysis_sessions').doc(sessionId).update({
      synthesisStatus: 'failed',
      synthesisError: error.message
    });
    throw error;
  }
});

/**
 * Synchronize biomechanical and behavioral timelines
 */
async function synchronizeTimelines(biomechanicsData, behavioralData, fps) {
  const frameInterval = 1000 / fps; // milliseconds per frame
  const timeline = [];

  // Create frame map for efficient lookup
  const bioMap = new Map(biomechanicsData.map(frame => [frame.frameNumber, frame]));
  const behMap = new Map(behavioralData.map(frame => [frame.frameNumber, frame]));

  const maxFrame = Math.max(
    Math.max(...biomechanicsData.map(f => f.frameNumber)),
    Math.max(...behavioralData.map(f => f.frameNumber))
  );

  for (let frameNum = 0; frameNum <= maxFrame; frameNum++) {
    const timestamp = frameNum * frameInterval;

    const bioFrame = bioMap.get(frameNum) || interpolateFrame(bioMap, frameNum);
    const behFrame = behMap.get(frameNum) || interpolateFrame(behMap, frameNum);

    // Combine data for this timestamp
    timeline.push({
      frameNumber: frameNum,
      timestamp,
      biomechanics: bioFrame ? {
        landmarks: bioFrame.landmarks,
        angles: bioFrame.jointAngles,
        phase: bioFrame.movementPhase,
        efficiency: bioFrame.efficiency,
        velocity: bioFrame.velocity,
        acceleration: bioFrame.acceleration,
        kineticChain: bioFrame.kineticChain
      } : null,
      behavioral: behFrame ? {
        landmarks: behFrame.landmarks,
        microExpressions: behFrame.microExpressions,
        confidence: behFrame.confidence,
        stress: behFrame.stress,
        concentration: behFrame.concentration,
        determination: behFrame.determination,
        composure: behFrame.composure,
        resilience: behFrame.resilienceScore
      } : null,
      // Calculate real-time fusion metrics
      fusion: calculateFusionMetrics(bioFrame, behFrame)
    });
  }

  return timeline;
}

/**
 * Calculate championship-level performance metrics
 */
function calculateChampionshipMetrics(timeline) {
  const validFrames = timeline.filter(f => f.biomechanics && f.behavioral);

  if (validFrames.length === 0) {
    throw new Error('No valid synchronized frames for analysis');
  }

  // Biomechanical metrics
  const biomechanicalMetrics = {
    efficiency: average(validFrames.map(f => f.biomechanics.efficiency || 0)),
    consistency: calculateConsistency(validFrames.map(f => f.biomechanics.angles)),
    powerGeneration: calculatePowerMetrics(validFrames),
    mechanicalSoundness: calculateMechanicalSoundness(validFrames),
    phases: analyzeMovementPhases(validFrames),
    overall: 0 // Will be calculated below
  };

  // Behavioral metrics
  const behavioralMetrics = {
    composure: average(validFrames.map(f => f.behavioral.composure || 0)),
    confidence: average(validFrames.map(f => f.behavioral.confidence || 0)),
    resilience: average(validFrames.map(f => f.behavioral.resilience || 0)),
    mentalToughness: calculateMentalToughness(validFrames),
    pressureResponse: analyzePressureResponse(validFrames),
    overall: 0 // Will be calculated below
  };

  // Calculate overall scores
  biomechanicalMetrics.overall = (
    biomechanicalMetrics.efficiency * 0.3 +
    biomechanicalMetrics.consistency * 0.25 +
    biomechanicalMetrics.powerGeneration * 0.25 +
    biomechanicalMetrics.mechanicalSoundness * 0.2
  );

  behavioralMetrics.overall = (
    behavioralMetrics.composure * 0.25 +
    behavioralMetrics.confidence * 0.25 +
    behavioralMetrics.resilience * 0.25 +
    behavioralMetrics.mentalToughness * 0.25
  );

  // Mind-body synchronization
  const synchronization = calculateMindBodySync(validFrames);

  return {
    biomechanical: biomechanicalMetrics,
    behavioral: behavioralMetrics,
    synchronization,
    frameAnalyzed: validFrames.length,
    totalFrames: timeline.length
  };
}

/**
 * Identify critical moments in performance
 */
function identifyCriticalMoments(timeline) {
  const moments = [];
  const WINDOW_SIZE = 30; // 1 second at 30fps

  for (let i = WINDOW_SIZE; i < timeline.length - WINDOW_SIZE; i++) {
    const window = timeline.slice(i - WINDOW_SIZE, i + WINDOW_SIZE);
    const current = timeline[i];

    if (!current.biomechanics || !current.behavioral) continue;

    // Check for pressure moments (high stress, maintained composure)
    if (current.behavioral.stress > 70 && current.behavioral.composure > 75) {
      moments.push({
        type: 'clutch_performance',
        frameNumber: i,
        timestamp: current.timestamp,
        description: 'Maintaining composure under pressure',
        metrics: {
          stress: current.behavioral.stress,
          composure: current.behavioral.composure,
          efficiency: current.biomechanics.efficiency
        }
      });
    }

    // Check for breakthrough moments (sudden improvement)
    const prevEfficiency = average(window.slice(0, WINDOW_SIZE).map(f =>
      f.biomechanics?.efficiency || 0
    ));
    const nextEfficiency = average(window.slice(WINDOW_SIZE).map(f =>
      f.biomechanics?.efficiency || 0
    ));

    if (nextEfficiency > prevEfficiency * 1.15) {
      moments.push({
        type: 'breakthrough',
        frameNumber: i,
        timestamp: current.timestamp,
        description: 'Significant performance improvement',
        metrics: {
          previousEfficiency: prevEfficiency,
          newEfficiency: nextEfficiency,
          improvement: ((nextEfficiency - prevEfficiency) / prevEfficiency * 100).toFixed(1)
        }
      });
    }

    // Check for vulnerability moments (technique breakdown)
    if (current.biomechanics.efficiency < 60 && current.behavioral.confidence < 50) {
      moments.push({
        type: 'vulnerability',
        frameNumber: i,
        timestamp: current.timestamp,
        description: 'Technique and confidence breakdown',
        metrics: {
          efficiency: current.biomechanics.efficiency,
          confidence: current.behavioral.confidence
        }
      });
    }
  }

  return moments.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Generate championship-level coaching insights
 */
function generateChampionshipInsights(metrics, moments, sport, sessionType) {
  const insights = [];

  // Biomechanical insights
  if (metrics.biomechanical.efficiency < ELITE_THRESHOLDS.biomechanics.efficiency) {
    insights.push({
      category: 'biomechanics',
      priority: 'high',
      insight: `Mechanical efficiency at ${metrics.biomechanical.efficiency.toFixed(1)}% - Elite level is ${ELITE_THRESHOLDS.biomechanics.efficiency}%. Focus on kinetic chain sequencing and energy transfer.`,
      recommendation: 'Implement drill progression focusing on ground force production and sequential acceleration through the kinetic chain.'
    });
  }

  // Behavioral insights
  if (metrics.behavioral.composure < ELITE_THRESHOLDS.behavioral.composure) {
    insights.push({
      category: 'mental',
      priority: 'high',
      insight: `Composure score at ${metrics.behavioral.composure.toFixed(1)}% - Championship level is ${ELITE_THRESHOLDS.behavioral.composure}%. Pressure situations causing visible tension.`,
      recommendation: 'Integrate pressure simulation drills with breathing protocols. Practice visualization of high-stakes scenarios.'
    });
  }

  // Mind-body synchronization insights
  if (metrics.synchronization < 80) {
    insights.push({
      category: 'integration',
      priority: 'critical',
      insight: `Mind-body synchronization at ${metrics.synchronization.toFixed(1)}% indicates disconnect between mental state and physical execution.`,
      recommendation: 'Implement rhythm-based training with progressive complexity. Focus on flow state development through graduated challenges.'
    });
  }

  // Clutch performance insights
  const clutchMoments = moments.filter(m => m.type === 'clutch_performance');
  if (clutchMoments.length > 0) {
    insights.push({
      category: 'strength',
      priority: 'medium',
      insight: `Demonstrated ${clutchMoments.length} clutch performance moments - maintaining technique under pressure.`,
      recommendation: 'Build on this mental toughness foundation. Increase pressure scenario complexity while maintaining technical focus.'
    });
  }

  // Vulnerability insights
  const vulnerabilities = moments.filter(m => m.type === 'vulnerability');
  if (vulnerabilities.length > 0) {
    insights.push({
      category: 'development',
      priority: 'high',
      insight: `Identified ${vulnerabilities.length} vulnerability windows where technique and confidence simultaneously dropped.`,
      recommendation: 'Target these specific moments with isolated technical work followed by confidence-building progressions.'
    });
  }

  // Sport-specific insights
  insights.push(...generateSportSpecificInsights(metrics, sport, sessionType));

  return insights.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Calculate overall performance score
 */
function calculateOverallScore(metrics) {
  return (
    metrics.biomechanical.overall * 0.4 +
    metrics.behavioral.overall * 0.4 +
    metrics.synchronization * 0.2
  ).toFixed(1);
}

/**
 * Calculate clutch factor - performance in critical moments
 */
function calculateClutchFactor(timeline, moments) {
  const criticalFrames = new Set();
  moments.forEach(m => {
    for (let i = m.frameNumber - 15; i <= m.frameNumber + 15; i++) {
      criticalFrames.add(i);
    }
  });

  if (criticalFrames.size === 0) return 75; // Default neutral score

  let clutchScore = 0;
  let count = 0;

  criticalFrames.forEach(frameNum => {
    const frame = timeline[frameNum];
    if (frame?.fusion?.performanceIndex) {
      clutchScore += frame.fusion.performanceIndex;
      count++;
    }
  });

  return count > 0 ? (clutchScore / count).toFixed(1) : 75;
}

/**
 * Calculate championship readiness percentage
 */
function calculateChampionshipReadiness(metrics) {
  const factors = [
    { value: metrics.biomechanical.overall, weight: 0.3 },
    { value: metrics.behavioral.overall, weight: 0.3 },
    { value: metrics.synchronization, weight: 0.2 },
    { value: metrics.behavioral.mentalToughness, weight: 0.1 },
    { value: metrics.biomechanical.consistency, weight: 0.1 }
  ];

  const readiness = factors.reduce((sum, factor) =>
    sum + (factor.value * factor.weight), 0
  );

  // Apply championship threshold scaling
  if (readiness >= ELITE_THRESHOLDS.combined.championshipReady) {
    return Math.min(95, readiness * 1.05); // Boost for elite performers
  }

  return readiness.toFixed(1);
}

/**
 * Calculate improvement potential based on current gaps
 */
function calculateImprovementPotential(metrics) {
  const gaps = [];

  // Biomechanical gaps
  Object.entries(ELITE_THRESHOLDS.biomechanics).forEach(([key, threshold]) => {
    if (metrics.biomechanical[key] !== undefined) {
      gaps.push(Math.max(0, threshold - metrics.biomechanical[key]));
    }
  });

  // Behavioral gaps
  Object.entries(ELITE_THRESHOLDS.behavioral).forEach(([key, threshold]) => {
    if (metrics.behavioral[key] !== undefined) {
      gaps.push(Math.max(0, threshold - metrics.behavioral[key]));
    }
  });

  const averageGap = average(gaps);

  // Convert gap to potential (larger gap = higher potential for improvement)
  return Math.min(95, 50 + averageGap * 0.75).toFixed(1);
}

/**
 * Store synthesized results in Firestore
 */
async function storeSynthesizedResults(sessionId, results) {
  const batch = firestore.batch();

  // Store main synthesis document
  const synthesisRef = firestore
    .collection('analysis_sessions')
    .doc(sessionId)
    .collection('synthesis')
    .doc('results');

  batch.set(synthesisRef, {
    metrics: results.metrics,
    scores: results.scores,
    insights: results.insights,
    criticalMomentCount: results.criticalMoments.length,
    processingMetadata: results.processingMetadata,
    createdAt: Firestore.FieldValue.serverTimestamp()
  });

  // Store timeline in chunks (100 frames per document)
  const CHUNK_SIZE = 100;
  for (let i = 0; i < results.timeline.length; i += CHUNK_SIZE) {
    const chunk = results.timeline.slice(i, i + CHUNK_SIZE);
    const chunkRef = firestore
      .collection('analysis_sessions')
      .doc(sessionId)
      .collection('timeline')
      .doc(`chunk_${Math.floor(i / CHUNK_SIZE)}`);

    batch.set(chunkRef, {
      startFrame: i,
      endFrame: Math.min(i + CHUNK_SIZE - 1, results.timeline.length - 1),
      frames: chunk
    });
  }

  // Store critical moments
  if (results.criticalMoments.length > 0) {
    const momentsRef = firestore
      .collection('analysis_sessions')
      .doc(sessionId)
      .collection('synthesis')
      .doc('critical_moments');

    batch.set(momentsRef, {
      moments: results.criticalMoments,
      count: results.criticalMoments.length
    });
  }

  await batch.commit();
  console.log(`💾 Stored ${results.timeline.length} frames and ${results.criticalMoments.length} critical moments`);
}

/**
 * Helper function to calculate fusion metrics for a single frame
 */
function calculateFusionMetrics(bioFrame, behFrame) {
  if (!bioFrame || !behFrame) return null;

  // Calculate mind-body alignment score
  const alignment = (
    (bioFrame.efficiency || 0) * 0.5 +
    (behFrame.confidence || 0) * 0.3 +
    (behFrame.composure || 0) * 0.2
  );

  // Calculate performance index
  const performanceIndex = (
    alignment * 0.4 +
    (bioFrame.kineticChain?.efficiency || 0) * 0.3 +
    (behFrame.determination || 0) * 0.3
  );

  return {
    alignment,
    performanceIndex,
    flowState: alignment > 85 && behFrame.concentration > 80,
    pressureAdapted: behFrame.stress > 60 && behFrame.composure > 70
  };
}

/**
 * Helper functions for metrics calculation
 */
function average(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateConsistency(angleArrays) {
  if (!angleArrays || angleArrays.length < 2) return 0;

  // Calculate standard deviation of key angles across frames
  const keyAngles = ['hip_angle', 'shoulder_angle', 'elbow_angle'];
  let totalVariance = 0;
  let count = 0;

  keyAngles.forEach(angle => {
    const values = angleArrays
      .map(angles => angles?.[angle])
      .filter(v => v !== undefined);

    if (values.length > 1) {
      const mean = average(values);
      const variance = average(values.map(v => Math.pow(v - mean, 2)));
      totalVariance += variance;
      count++;
    }
  });

  if (count === 0) return 0;

  // Convert variance to consistency score (lower variance = higher consistency)
  const avgVariance = totalVariance / count;
  return Math.max(0, 100 - avgVariance * 2);
}

function calculatePowerMetrics(frames) {
  const velocities = frames
    .map(f => f.biomechanics?.velocity)
    .filter(v => v !== undefined);

  const accelerations = frames
    .map(f => f.biomechanics?.acceleration)
    .filter(a => a !== undefined);

  if (velocities.length === 0 || accelerations.length === 0) return 0;

  const peakVelocity = Math.max(...velocities);
  const peakAcceleration = Math.max(...accelerations);

  // Normalize to 0-100 scale based on sport-specific expectations
  const velocityScore = Math.min(100, peakVelocity * 10);
  const accelerationScore = Math.min(100, peakAcceleration * 5);

  return (velocityScore + accelerationScore) / 2;
}

function calculateMechanicalSoundness(frames) {
  const efficiencies = frames
    .map(f => f.biomechanics?.kineticChain?.efficiency || 0);

  const phases = frames
    .map(f => f.biomechanics?.phase)
    .filter(p => p !== undefined);

  // Check for proper phase progression
  let phaseScore = 100;
  const expectedPhases = ['setup', 'load', 'stride', 'contact', 'follow_through'];
  let lastPhaseIndex = -1;

  phases.forEach(phase => {
    const currentIndex = expectedPhases.indexOf(phase);
    if (currentIndex < lastPhaseIndex && currentIndex !== 0) {
      phaseScore -= 5; // Penalty for phase regression
    }
    lastPhaseIndex = currentIndex;
  });

  return (average(efficiencies) + phaseScore) / 2;
}

function analyzeMovementPhases(frames) {
  const phaseCounts = {};
  const phaseMetrics = {};

  frames.forEach(frame => {
    const phase = frame.biomechanics?.phase;
    if (phase) {
      phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
      if (!phaseMetrics[phase]) {
        phaseMetrics[phase] = {
          efficiency: [],
          confidence: []
        };
      }
      phaseMetrics[phase].efficiency.push(frame.biomechanics.efficiency || 0);
      phaseMetrics[phase].confidence.push(frame.behavioral.confidence || 0);
    }
  });

  const analysis = {};
  Object.keys(phaseMetrics).forEach(phase => {
    analysis[phase] = {
      frameCount: phaseCounts[phase],
      avgEfficiency: average(phaseMetrics[phase].efficiency),
      avgConfidence: average(phaseMetrics[phase].confidence)
    };
  });

  return analysis;
}

function calculateMentalToughness(frames) {
  // Mental toughness = maintaining performance despite stress
  const stressfulFrames = frames.filter(f => f.behavioral.stress > 60);

  if (stressfulFrames.length === 0) return 75; // Neutral score if no stress

  const performanceUnderStress = average(stressfulFrames.map(f =>
    (f.behavioral.composure + f.behavioral.determination) / 2
  ));

  return performanceUnderStress;
}

function analyzePressureResponse(frames) {
  // Analyze how performance changes with increasing stress
  const lowStress = frames.filter(f => f.behavioral.stress < 40);
  const highStress = frames.filter(f => f.behavioral.stress > 70);

  if (lowStress.length === 0 || highStress.length === 0) return 75;

  const lowStressPerformance = average(lowStress.map(f =>
    f.biomechanics.efficiency || 0
  ));

  const highStressPerformance = average(highStress.map(f =>
    f.biomechanics.efficiency || 0
  ));

  // Calculate retention percentage (100% = no drop, 0% = complete failure)
  const retention = (highStressPerformance / lowStressPerformance) * 100;

  return Math.min(100, Math.max(0, retention));
}

function calculateMindBodySync(frames) {
  // Correlation between mental state and physical performance
  const correlations = frames.map(frame => {
    const mentalScore = (
      frame.behavioral.confidence * 0.3 +
      frame.behavioral.composure * 0.3 +
      frame.behavioral.concentration * 0.2 +
      frame.behavioral.determination * 0.2
    );

    const physicalScore = frame.biomechanics.efficiency || 0;

    // Calculate alignment (100 = perfect sync, 0 = complete disconnect)
    return 100 - Math.abs(mentalScore - physicalScore);
  });

  return average(correlations);
}

function generateSportSpecificInsights(metrics, sport, sessionType) {
  const insights = [];

  switch(sport) {
    case 'baseball':
      if (sessionType === 'batting') {
        if (metrics.biomechanical.phases?.load?.avgEfficiency < 80) {
          insights.push({
            category: 'technique',
            priority: 'high',
            insight: 'Load phase efficiency below elite standard. Hip-shoulder separation may be insufficient.',
            recommendation: 'Focus on creating torque through proper sequencing. Use resistance band work for separation drills.'
          });
        }
      } else if (sessionType === 'pitching') {
        if (metrics.biomechanical.powerGeneration < 75) {
          insights.push({
            category: 'power',
            priority: 'high',
            insight: 'Power generation lagging. Ground force production needs improvement.',
            recommendation: 'Implement plyometric training and focus on leg drive mechanics.'
          });
        }
      }
      break;

    case 'football':
      if (sessionType === 'quarterback') {
        if (metrics.behavioral.pressureResponse < 70) {
          insights.push({
            category: 'mental',
            priority: 'critical',
            insight: 'Pressure response indicates pocket presence needs development.',
            recommendation: 'Practice with rush simulation and progressive pressure scenarios.'
          });
        }
      }
      break;

    case 'basketball':
      if (sessionType === 'shooting') {
        if (metrics.biomechanical.consistency < 85) {
          insights.push({
            category: 'consistency',
            priority: 'high',
            insight: 'Shot mechanics showing variability. Release point inconsistent.',
            recommendation: 'Film study with overlay comparison. Focus on repeatable release mechanics.'
          });
        }
      }
      break;
  }

  return insights;
}

/**
 * Update stream completion status
 */
async function updateStreamStatus(sessionId, stream) {
  const statusField = `${stream}Status`;
  await firestore.collection('analysis_sessions').doc(sessionId).update({
    [statusField]: 'completed',
    [`${stream}CompletedAt`]: Firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Retrieve biomechanics analysis data
 */
async function retrieveBiomechanicsData(sessionId) {
  const snapshot = await firestore
    .collection('analysis_sessions')
    .doc(sessionId)
    .collection('biomechanics')
    .orderBy('startFrame')
    .get();

  const frames = [];
  snapshot.forEach(doc => {
    frames.push(...doc.data().frames);
  });

  return frames;
}

/**
 * Retrieve behavioral analysis data
 */
async function retrieveBehavioralData(sessionId) {
  const snapshot = await firestore
    .collection('analysis_sessions')
    .doc(sessionId)
    .collection('behavioral')
    .orderBy('startFrame')
    .get();

  const frames = [];
  snapshot.forEach(doc => {
    frames.push(...doc.data().frames);
  });

  return frames;
}

/**
 * Interpolate missing frame data
 */
function interpolateFrame(frameMap, targetFrame) {
  // Find nearest frames
  let prevFrame = null;
  let nextFrame = null;

  for (let i = targetFrame - 1; i >= 0; i--) {
    if (frameMap.has(i)) {
      prevFrame = frameMap.get(i);
      break;
    }
  }

  for (let i = targetFrame + 1; i < targetFrame + 30; i++) {
    if (frameMap.has(i)) {
      nextFrame = frameMap.get(i);
      break;
    }
  }

  if (!prevFrame && !nextFrame) return null;
  if (!prevFrame) return nextFrame;
  if (!nextFrame) return prevFrame;

  // Simple linear interpolation for numeric values
  const alpha = (targetFrame - prevFrame.frameNumber) /
                 (nextFrame.frameNumber - prevFrame.frameNumber);

  return {
    frameNumber: targetFrame,
    interpolated: true,
    // Interpolate numeric values
    efficiency: prevFrame.efficiency + (nextFrame.efficiency - prevFrame.efficiency) * alpha,
    confidence: prevFrame.confidence + (nextFrame.confidence - prevFrame.confidence) * alpha,
    // Use nearest for categorical values
    movementPhase: alpha < 0.5 ? prevFrame.movementPhase : nextFrame.movementPhase
  };
}

/**
 * Publish completion notification
 */
async function publishCompletionNotification(sessionId, playerId, scores) {
  const topic = pubsub.topic('vision-engine-complete');

  await topic.publishMessage({
    data: Buffer.from(JSON.stringify({
      sessionId,
      playerId,
      scores,
      completedAt: new Date().toISOString()
    })),
    attributes: {
      sessionId,
      playerId,
      championshipReadiness: scores.championshipReadiness.toString()
    }
  });

  console.log(`📢 Published completion notification for player ${playerId}`);
}

module.exports = { synthesisEngine };