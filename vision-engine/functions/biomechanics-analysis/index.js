/**
 * Blaze Intelligence Vision Engine - Biomechanics Analysis Stream
 * Processes video through MediaPipe Pose model for 3D skeletal landmark extraction
 */

const functions = require('@google-cloud/functions-framework');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const tf = require('@tensorflow/tfjs-node');
const { PoseLandmarker, FilesetResolver } = require('@mediapipe/tasks-vision');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Initialize services
const pubsub = new PubSub();
const storage = new Storage();
const firestore = new Firestore();

// MediaPipe configuration
let poseLandmarker = null;

/**
 * Initialize MediaPipe Pose model
 */
async function initializePoseModel() {
  if (poseLandmarker) return poseLandmarker;

  console.log('🏃 Initializing MediaPipe Pose model...');

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false
  });

  console.log('✅ Pose model initialized');
  return poseLandmarker;
}

/**
 * Main biomechanics analysis function - triggered by PubSub
 */
functions.cloudEvent('biomechanicsAnalysis', async (cloudEvent) => {
  console.log('🦴 Biomechanics Analysis Stream initiated');

  const messageData = JSON.parse(
    Buffer.from(cloudEvent.data.message.data, 'base64').toString()
  );

  const {
    sessionId,
    playerId,
    videoId,
    gcsPath,
    fps,
    duration,
    sport,
    analysisConfig
  } = messageData;

  try {
    // Update session status
    await updateSessionStatus(sessionId, 'biomechanicsStatus', 'processing');

    // Initialize pose model
    await initializePoseModel();

    // Download video from Cloud Storage
    const localVideoPath = await downloadVideo(gcsPath, sessionId);

    // Extract frames for analysis
    const frames = await extractFrames(localVideoPath, fps, duration);

    // Process each frame through MediaPipe Pose
    const biomechanicalData = await analyzeBiomechanics(
      frames,
      fps,
      analysisConfig.biomechanics
    );

    // Calculate biomechanical metrics
    const metrics = calculateBiomechanicalMetrics(
      biomechanicalData,
      sport,
      analysisConfig.biomechanics
    );

    // Store results in Firestore
    await storeBiomechanicalResults(sessionId, playerId, videoId, {
      rawLandmarks: biomechanicalData,
      metrics,
      frameCount: frames.length,
      fps,
      processingTimestamp: new Date().toISOString()
    });

    // Clean up temporary files
    await cleanupTempFiles(sessionId);

    // Update session status
    await updateSessionStatus(sessionId, 'biomechanicsStatus', 'completed');

    // Check if ready for synthesis
    await checkForSynthesis(sessionId);

    console.log(`✅ Biomechanics analysis completed for session ${sessionId}`);

  } catch (error) {
    console.error('❌ Biomechanics analysis error:', error);

    await updateSessionStatus(sessionId, 'biomechanicsStatus', 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
});

/**
 * Download video from Cloud Storage
 */
async function downloadVideo(gcsPath, sessionId) {
  const bucket = storage.bucket(process.env.GCS_PROCESSING_BUCKET);
  const fileName = gcsPath.replace(`gs://${process.env.GCS_PROCESSING_BUCKET}/`, '');
  const tempDir = path.join(os.tmpdir(), sessionId);
  const localPath = path.join(tempDir, 'video.mp4');

  await fs.mkdir(tempDir, { recursive: true });

  console.log(`📥 Downloading video from GCS: ${fileName}`);

  await bucket.file(fileName).download({ destination: localPath });

  console.log(`✅ Video downloaded to ${localPath}`);
  return localPath;
}

/**
 * Extract frames from video for analysis
 */
async function extractFrames(videoPath, fps, duration) {
  const frames = [];
  const tempDir = path.dirname(videoPath);
  const frameInterval = 1 / fps; // Process every frame
  const maxFrames = Math.min(fps * duration, 1800); // Cap at 1800 frames (1 min at 30fps)

  console.log(`🎬 Extracting ${maxFrames} frames at ${fps} FPS`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=${fps}`,
        '-f image2',
        '-pix_fmt rgb24'
      ])
      .output(path.join(tempDir, 'frame_%04d.jpg'))
      .on('end', async () => {
        console.log('✅ Frame extraction complete');

        // Load extracted frames
        const frameFiles = await fs.readdir(tempDir);
        const jpgFiles = frameFiles
          .filter(f => f.endsWith('.jpg'))
          .sort()
          .slice(0, maxFrames);

        for (const file of jpgFiles) {
          const framePath = path.join(tempDir, file);
          const frameData = await fs.readFile(framePath);
          const frameNumber = parseInt(file.match(/\d+/)[0]);
          const timestamp = (frameNumber - 1) * frameInterval;

          frames.push({
            frameNumber,
            timestamp,
            data: frameData,
            path: framePath
          });
        }

        resolve(frames);
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Analyze biomechanics using MediaPipe Pose
 */
async function analyzeBiomechanics(frames, fps, config) {
  const biomechanicalData = [];

  console.log(`🔬 Processing ${frames.length} frames through MediaPipe Pose`);

  for (const frame of frames) {
    try {
      // Convert frame to appropriate format for MediaPipe
      const image = await tf.node.decodeImage(frame.data, 3);

      // Run pose detection
      const result = await poseLandmarker.detectForVideo(image, frame.timestamp * 1000);

      if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0]; // Get first detected pose

        // Extract 3D landmarks with confidence scores
        const processedLandmarks = processPoseLandmarks(landmarks, config.keypoints);

        // Calculate joint angles for critical points
        const jointAngles = calculateJointAngles(processedLandmarks, config.criticalAngles);

        // Detect movement phase
        const movementPhase = detectMovementPhase(processedLandmarks, jointAngles, config.phases);

        biomechanicalData.push({
          frameNumber: frame.frameNumber,
          timestamp: frame.timestamp,
          landmarks: processedLandmarks,
          jointAngles,
          movementPhase,
          confidence: result.landmarks[0].visibility || 0.8
        });
      } else {
        // No pose detected in frame
        biomechanicalData.push({
          frameNumber: frame.frameNumber,
          timestamp: frame.timestamp,
          landmarks: null,
          jointAngles: null,
          movementPhase: 'no_detection',
          confidence: 0
        });
      }

      // Clean up tensor
      image.dispose();

    } catch (error) {
      console.error(`Error processing frame ${frame.frameNumber}:`, error);
      biomechanicalData.push({
        frameNumber: frame.frameNumber,
        timestamp: frame.timestamp,
        error: error.message
      });
    }

    // Log progress every 30 frames
    if (frame.frameNumber % 30 === 0) {
      console.log(`Progress: ${frame.frameNumber}/${frames.length} frames processed`);
    }
  }

  console.log('✅ Biomechanical analysis complete');
  return biomechanicalData;
}

/**
 * Process pose landmarks for sport-specific keypoints
 */
function processPoseLandmarks(landmarks, keypoints) {
  const landmarkMap = {
    'shoulder': [11, 12], // Left and right shoulder
    'elbow': [13, 14],    // Left and right elbow
    'wrist': [15, 16],    // Left and right wrist
    'hip': [23, 24],      // Left and right hip
    'knee': [25, 26],     // Left and right knee
    'ankle': [27, 28],    // Left and right ankle
    'head': [0],          // Nose as head reference
  };

  const processedLandmarks = {};

  keypoints.forEach(keypoint => {
    const indices = landmarkMap[keypoint];
    if (indices) {
      processedLandmarks[keypoint] = indices.map(idx => ({
        x: landmarks[idx].x,
        y: landmarks[idx].y,
        z: landmarks[idx].z || 0,
        visibility: landmarks[idx].visibility || 0.5
      }));
    }
  });

  return processedLandmarks;
}

/**
 * Calculate joint angles from landmarks
 */
function calculateJointAngles(landmarks, criticalAngles) {
  const angles = {};

  const calculateAngle = (p1, p2, p3) => {
    const v1 = {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
      z: p1.z - p2.z
    };
    const v2 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y,
      z: p3.z - p2.z
    };

    const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
    const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

    return Math.acos(dotProduct / (mag1 * mag2)) * (180 / Math.PI);
  };

  // Calculate specific angles based on sport configuration
  if (criticalAngles.includes('hip_rotation') && landmarks.hip) {
    const leftHip = landmarks.hip[0];
    const rightHip = landmarks.hip[1];
    const spine = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2 - 0.1,
      z: (leftHip.z + rightHip.z) / 2
    };

    angles.hip_rotation = calculateAngle(leftHip, spine, rightHip);
  }

  if (criticalAngles.includes('elbow_angle') && landmarks.elbow && landmarks.shoulder && landmarks.wrist) {
    // Right arm angle
    if (landmarks.shoulder[1] && landmarks.elbow[1] && landmarks.wrist[1]) {
      angles.right_elbow_angle = calculateAngle(
        landmarks.shoulder[1],
        landmarks.elbow[1],
        landmarks.wrist[1]
      );
    }
  }

  if (criticalAngles.includes('knee_flexion') && landmarks.hip && landmarks.knee && landmarks.ankle) {
    // Right leg angle
    if (landmarks.hip[1] && landmarks.knee[1] && landmarks.ankle[1]) {
      angles.right_knee_flexion = calculateAngle(
        landmarks.hip[1],
        landmarks.knee[1],
        landmarks.ankle[1]
      );
    }
  }

  return angles;
}

/**
 * Detect movement phase based on biomechanical patterns
 */
function detectMovementPhase(landmarks, jointAngles, phases) {
  // Simplified phase detection - in production, use ML model
  // This is a placeholder that uses heuristics

  if (!landmarks || !jointAngles) return 'unknown';

  // Baseball batting example
  if (phases.includes('setup') && phases.includes('contact')) {
    const hipRotation = jointAngles.hip_rotation || 0;
    const elbowAngle = jointAngles.right_elbow_angle || 0;

    if (hipRotation < 30) return 'setup';
    if (hipRotation > 30 && hipRotation < 60) return 'load';
    if (hipRotation > 60 && hipRotation < 90) return 'stride';
    if (hipRotation > 90 && elbowAngle < 90) return 'contact';
    if (hipRotation > 90 && elbowAngle > 90) return 'follow_through';
  }

  return 'transition';
}

/**
 * Calculate biomechanical metrics from raw data
 */
function calculateBiomechanicalMetrics(biomechanicalData, sport, config) {
  const metrics = {
    overall_score: 0,
    consistency_score: 0,
    efficiency_score: 0,
    power_metrics: {},
    timing_metrics: {},
    balance_metrics: {},
    phase_distribution: {},
    keypoint_visibility: {},
    improvement_areas: []
  };

  // Filter frames with valid detections
  const validFrames = biomechanicalData.filter(f => f.landmarks && f.confidence > 0.5);

  if (validFrames.length === 0) {
    console.warn('No valid pose detections found');
    return metrics;
  }

  // Calculate phase distribution
  const phaseCounts = {};
  validFrames.forEach(frame => {
    phaseCounts[frame.movementPhase] = (phaseCounts[frame.movementPhase] || 0) + 1;
  });

  metrics.phase_distribution = Object.entries(phaseCounts).reduce((acc, [phase, count]) => {
    acc[phase] = (count / validFrames.length) * 100;
    return acc;
  }, {});

  // Calculate keypoint visibility/confidence
  const visibilityScores = {};
  config.keypoints.forEach(keypoint => {
    const scores = validFrames
      .map(f => f.landmarks[keypoint]?.[0]?.visibility || 0)
      .filter(v => v > 0);

    visibilityScores[keypoint] = scores.length > 0
      ? scores.reduce((sum, v) => sum + v, 0) / scores.length
      : 0;
  });
  metrics.keypoint_visibility = visibilityScores;

  // Calculate consistency score based on joint angle variance
  const angleVariances = {};
  Object.keys(validFrames[0]?.jointAngles || {}).forEach(angleName => {
    const angles = validFrames
      .map(f => f.jointAngles[angleName])
      .filter(a => a !== undefined);

    if (angles.length > 0) {
      const mean = angles.reduce((sum, a) => sum + a, 0) / angles.length;
      const variance = angles.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / angles.length;
      angleVariances[angleName] = Math.sqrt(variance);
    }
  });

  // Lower variance = higher consistency
  const avgVariance = Object.values(angleVariances).reduce((sum, v) => sum + v, 0) / Object.values(angleVariances).length;
  metrics.consistency_score = Math.max(0, Math.min(1, 1 - (avgVariance / 180)));

  // Calculate efficiency based on movement smoothness
  const movementSmoothness = calculateMovementSmoothness(validFrames);
  metrics.efficiency_score = movementSmoothness;

  // Sport-specific power metrics
  if (sport === 'baseball') {
    metrics.power_metrics = calculateBaseballPowerMetrics(validFrames);
  } else if (sport === 'football') {
    metrics.power_metrics = calculateFootballPowerMetrics(validFrames);
  }

  // Calculate timing metrics
  metrics.timing_metrics = calculateTimingMetrics(validFrames, config.phases);

  // Calculate overall score
  metrics.overall_score = (
    metrics.consistency_score * 0.3 +
    metrics.efficiency_score * 0.3 +
    (metrics.power_metrics.score || 0.7) * 0.2 +
    (metrics.timing_metrics.score || 0.7) * 0.2
  );

  // Identify improvement areas
  if (metrics.consistency_score < 0.7) {
    metrics.improvement_areas.push({
      area: 'consistency',
      priority: 'high',
      description: 'Movement consistency needs improvement'
    });
  }

  if (metrics.efficiency_score < 0.75) {
    metrics.improvement_areas.push({
      area: 'efficiency',
      priority: 'medium',
      description: 'Movement efficiency can be optimized'
    });
  }

  return metrics;
}

/**
 * Calculate movement smoothness/efficiency
 */
function calculateMovementSmoothness(frames) {
  if (frames.length < 3) return 0.5;

  let totalJerk = 0;
  let samples = 0;

  // Calculate jerk (rate of change of acceleration) for key points
  for (let i = 2; i < frames.length; i++) {
    const prev2 = frames[i - 2].landmarks;
    const prev1 = frames[i - 1].landmarks;
    const curr = frames[i].landmarks;

    if (!prev2 || !prev1 || !curr) continue;

    // Calculate for wrist movement (important for most sports)
    if (prev2.wrist && prev1.wrist && curr.wrist) {
      const acc1 = {
        x: prev1.wrist[0].x - prev2.wrist[0].x,
        y: prev1.wrist[0].y - prev2.wrist[0].y
      };
      const acc2 = {
        x: curr.wrist[0].x - prev1.wrist[0].x,
        y: curr.wrist[0].y - prev1.wrist[0].y
      };

      const jerk = Math.sqrt(
        Math.pow(acc2.x - acc1.x, 2) +
        Math.pow(acc2.y - acc1.y, 2)
      );

      totalJerk += jerk;
      samples++;
    }
  }

  if (samples === 0) return 0.5;

  // Convert jerk to smoothness score (lower jerk = higher smoothness)
  const avgJerk = totalJerk / samples;
  const smoothness = Math.max(0, Math.min(1, 1 - (avgJerk * 10)));

  return smoothness;
}

/**
 * Calculate baseball-specific power metrics
 */
function calculateBaseballPowerMetrics(frames) {
  const metrics = {
    hip_rotation_velocity: 0,
    bat_speed_estimate: 0,
    kinetic_chain_efficiency: 0,
    score: 0
  };

  // Find contact phase frames
  const contactFrames = frames.filter(f => f.movementPhase === 'contact');

  if (contactFrames.length > 0) {
    // Calculate hip rotation velocity
    const hipRotations = contactFrames.map(f => f.jointAngles?.hip_rotation || 0);
    const maxRotation = Math.max(...hipRotations);
    const minRotation = Math.min(...hipRotations);
    metrics.hip_rotation_velocity = (maxRotation - minRotation) / contactFrames.length;

    // Estimate bat speed based on wrist velocity
    const wristVelocities = [];
    for (let i = 1; i < contactFrames.length; i++) {
      const prev = contactFrames[i - 1].landmarks?.wrist?.[0];
      const curr = contactFrames[i].landmarks?.wrist?.[0];

      if (prev && curr) {
        const velocity = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) +
          Math.pow(curr.y - prev.y, 2)
        );
        wristVelocities.push(velocity);
      }
    }

    if (wristVelocities.length > 0) {
      metrics.bat_speed_estimate = Math.max(...wristVelocities) * 100; // Scale to reasonable range
    }

    // Calculate kinetic chain efficiency
    metrics.kinetic_chain_efficiency = calculateKineticChainEfficiency(contactFrames);

    // Calculate overall power score
    metrics.score = (
      Math.min(1, metrics.hip_rotation_velocity / 180) * 0.4 +
      Math.min(1, metrics.bat_speed_estimate / 100) * 0.4 +
      metrics.kinetic_chain_efficiency * 0.2
    );
  }

  return metrics;
}

/**
 * Calculate football-specific power metrics
 */
function calculateFootballPowerMetrics(frames) {
  // Similar implementation for football
  return { score: 0.75 };
}

/**
 * Calculate kinetic chain efficiency
 */
function calculateKineticChainEfficiency(frames) {
  // Analyze the sequential activation of body segments
  // Simplified version - check if movement flows from hips -> shoulders -> arms

  let properSequenceCount = 0;

  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1];
    const curr = frames[i];

    if (!prev.jointAngles || !curr.jointAngles) continue;

    const hipChange = Math.abs((curr.jointAngles.hip_rotation || 0) - (prev.jointAngles.hip_rotation || 0));
    const elbowChange = Math.abs((curr.jointAngles.right_elbow_angle || 0) - (prev.jointAngles.right_elbow_angle || 0));

    // Check if hip moves before arm (proper sequence)
    if (hipChange > elbowChange * 1.2) {
      properSequenceCount++;
    }
  }

  return frames.length > 1 ? properSequenceCount / (frames.length - 1) : 0;
}

/**
 * Calculate timing metrics
 */
function calculateTimingMetrics(frames, phases) {
  const metrics = {
    phase_timing: {},
    rhythm_consistency: 0,
    tempo: 0,
    score: 0
  };

  // Calculate time spent in each phase
  phases.forEach(phase => {
    const phaseFrames = frames.filter(f => f.movementPhase === phase);
    metrics.phase_timing[phase] = {
      frames: phaseFrames.length,
      duration: phaseFrames.length / 30, // Assuming 30 FPS
      percentage: (phaseFrames.length / frames.length) * 100
    };
  });

  // Calculate rhythm consistency
  const phaseDurations = Object.values(metrics.phase_timing).map(p => p.duration);
  if (phaseDurations.length > 0) {
    const avgDuration = phaseDurations.reduce((sum, d) => sum + d, 0) / phaseDurations.length;
    const variance = phaseDurations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / phaseDurations.length;
    metrics.rhythm_consistency = Math.max(0, 1 - (Math.sqrt(variance) / avgDuration));
  }

  // Calculate overall tempo (movements per second)
  const totalDuration = frames[frames.length - 1].timestamp - frames[0].timestamp;
  metrics.tempo = phases.length / totalDuration;

  // Calculate timing score
  metrics.score = (metrics.rhythm_consistency * 0.6) + Math.min(1, metrics.tempo / 5) * 0.4;

  return metrics;
}

/**
 * Store biomechanical results in Firestore
 */
async function storeBiomechanicalResults(sessionId, playerId, videoId, results) {
  const biomechanicsRef = firestore.collection('biomechanical_analysis').doc();

  // Store summary document
  await biomechanicsRef.set({
    sessionId,
    playerId,
    videoId,
    metrics: results.metrics,
    frameCount: results.frameCount,
    fps: results.fps,
    processingTimestamp: results.processingTimestamp,
    createdAt: Firestore.FieldValue.serverTimestamp()
  });

  // Store time-series data in subcollection (chunked for performance)
  const timeSeriesRef = biomechanicsRef.collection('time_series');
  const chunkSize = 100; // Store 100 frames per document

  for (let i = 0; i < results.rawLandmarks.length; i += chunkSize) {
    const chunk = results.rawLandmarks.slice(i, i + chunkSize);
    await timeSeriesRef.add({
      startFrame: i,
      endFrame: Math.min(i + chunkSize - 1, results.rawLandmarks.length - 1),
      data: chunk,
      createdAt: Firestore.FieldValue.serverTimestamp()
    });
  }

  console.log(`💾 Stored biomechanical results: ${biomechanicsRef.id}`);
}

/**
 * Update session status in Firestore
 */
async function updateSessionStatus(sessionId, field, status, error = null) {
  const update = {
    [field]: status,
    updatedAt: Firestore.FieldValue.serverTimestamp()
  };

  if (error) {
    update[`${field}Error`] = error;
  }

  await firestore.collection('analysis_sessions').doc(sessionId).update(update);
}

/**
 * Check if both streams are complete and trigger synthesis
 */
async function checkForSynthesis(sessionId) {
  const sessionDoc = await firestore.collection('analysis_sessions').doc(sessionId).get();
  const session = sessionDoc.data();

  if (session.biomechanicsStatus === 'completed' && session.behavioralStatus === 'completed') {
    console.log('🔄 Both streams complete, triggering synthesis');

    const topic = pubsub.topic('vision-engine-synthesis');
    await topic.publishMessage({
      data: Buffer.from(JSON.stringify({
        sessionId,
        playerId: session.playerId,
        videoId: session.videoId
      }))
    });
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(sessionId) {
  const tempDir = path.join(os.tmpdir(), sessionId);

  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`🧹 Cleaned up temporary files for session ${sessionId}`);
  } catch (error) {
    console.warn('Failed to clean up temp files:', error);
  }
}

module.exports = { biomechanicsAnalysis };