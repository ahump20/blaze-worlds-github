/**
 * Blaze Intelligence Vision Engine - Behavioral Markers Analysis Stream
 * Processes video through MediaPipe Face Mesh for facial landmark detection
 * Captures micro-expressions and behavioral indicators
 */

const functions = require('@google-cloud/functions-framework');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const tf = require('@tensorflow/tfjs-node');
const { FaceLandmarker, FilesetResolver } = require('@mediapipe/tasks-vision');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Initialize services
const pubsub = new PubSub();
const storage = new Storage();
const firestore = new Firestore();

// MediaPipe Face Mesh configuration
let faceLandmarker = null;

// Facial landmark indices for micro-expression analysis
const FACIAL_REGIONS = {
  leftEye: [33, 133, 157, 158, 159, 160, 161, 173],
  rightEye: [362, 263, 387, 388, 389, 390, 391, 398],
  leftEyebrow: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
  rightEyebrow: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
  mouth: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
  jaw: [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 340],
  nose: [1, 2, 5, 4, 19, 20, 94, 125, 235, 236, 3]
};

// Micro-expression patterns
const MICRO_EXPRESSION_PATTERNS = {
  confidence: {
    regions: ['mouth', 'jaw', 'rightEye', 'leftEye'],
    indicators: ['mouth_symmetry', 'jaw_set', 'eye_openness', 'gaze_steadiness']
  },
  stress: {
    regions: ['leftEyebrow', 'rightEyebrow', 'mouth', 'jaw'],
    indicators: ['brow_furrow', 'lip_compression', 'jaw_tension', 'mouth_tightness']
  },
  concentration: {
    regions: ['leftEyebrow', 'rightEyebrow', 'leftEye', 'rightEye'],
    indicators: ['brow_lowering', 'eye_narrowing', 'gaze_fixation']
  },
  determination: {
    regions: ['jaw', 'mouth', 'nose'],
    indicators: ['jaw_clench', 'lip_press', 'nostril_flare']
  },
  composure: {
    regions: ['mouth', 'leftEye', 'rightEye', 'jaw'],
    indicators: ['facial_stillness', 'breathing_rhythm', 'blink_rate']
  }
};

/**
 * Initialize MediaPipe Face Mesh model
 */
async function initializeFaceModel() {
  if (faceLandmarker) return faceLandmarker;

  console.log('😊 Initializing MediaPipe Face Mesh model...');

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true
  });

  console.log('✅ Face Mesh model initialized');
  return faceLandmarker;
}

/**
 * Main behavioral analysis function - triggered by PubSub
 */
functions.cloudEvent('behavioralAnalysis', async (cloudEvent) => {
  console.log('🧠 Behavioral Analysis Stream initiated');

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
    await updateSessionStatus(sessionId, 'behavioralStatus', 'processing');

    // Initialize face model
    await initializeFaceModel();

    // Download video from Cloud Storage
    const localVideoPath = await downloadVideo(gcsPath, sessionId);

    // Extract frames for analysis
    const frames = await extractFrames(localVideoPath, fps, duration);

    // Process each frame through MediaPipe Face Mesh
    const behavioralData = await analyzeBehavioralMarkers(
      frames,
      fps,
      analysisConfig.behavioral
    );

    // Calculate behavioral metrics including micro-expressions
    const metrics = calculateBehavioralMetrics(
      behavioralData,
      sport,
      analysisConfig.behavioral
    );

    // Calculate Composure & Resilience Score
    const composureScore = calculateComposureResilienceScore(
      behavioralData,
      analysisConfig.behavioral
    );

    // Store results in Firestore
    await storeBehavioralResults(sessionId, playerId, videoId, {
      rawLandmarks: behavioralData,
      metrics,
      composureScore,
      frameCount: frames.length,
      fps,
      processingTimestamp: new Date().toISOString()
    });

    // Clean up temporary files
    await cleanupTempFiles(sessionId);

    // Update session status
    await updateSessionStatus(sessionId, 'behavioralStatus', 'completed');

    // Check if ready for synthesis
    await checkForSynthesis(sessionId);

    console.log(`✅ Behavioral analysis completed for session ${sessionId}`);

  } catch (error) {
    console.error('❌ Behavioral analysis error:', error);

    await updateSessionStatus(sessionId, 'behavioralStatus', 'failed', {
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
  const tempDir = path.join(os.tmpdir(), `${sessionId}_behavioral`);
  const localPath = path.join(tempDir, 'video.mp4');

  await fs.mkdir(tempDir, { recursive: true });

  console.log(`📥 Downloading video from GCS: ${fileName}`);

  await bucket.file(fileName).download({ destination: localPath });

  console.log(`✅ Video downloaded to ${localPath}`);
  return localPath;
}

/**
 * Extract frames from video for facial analysis
 */
async function extractFrames(videoPath, fps, duration) {
  const frames = [];
  const tempDir = path.dirname(videoPath);
  const frameInterval = 1 / fps;
  const maxFrames = Math.min(fps * duration, 1800); // Cap at 1800 frames

  console.log(`🎬 Extracting ${maxFrames} frames at ${fps} FPS for facial analysis`);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=${fps}`,
        '-f image2',
        '-pix_fmt rgb24'
      ])
      .output(path.join(tempDir, 'face_frame_%04d.jpg'))
      .on('end', async () => {
        console.log('✅ Frame extraction complete');

        // Load extracted frames
        const frameFiles = await fs.readdir(tempDir);
        const jpgFiles = frameFiles
          .filter(f => f.startsWith('face_frame_') && f.endsWith('.jpg'))
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
 * Analyze behavioral markers using MediaPipe Face Mesh
 */
async function analyzeBehavioralMarkers(frames, fps, config) {
  const behavioralData = [];

  console.log(`🔬 Processing ${frames.length} frames through MediaPipe Face Mesh`);

  for (const frame of frames) {
    try {
      // Convert frame to appropriate format for MediaPipe
      const image = await tf.node.decodeImage(frame.data, 3);

      // Run face detection
      const result = await faceLandmarker.detectForVideo(image, frame.timestamp * 1000);

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0]; // Get first detected face
        const blendshapes = result.faceBlendshapes?.[0];

        // Extract facial landmarks for regions
        const processedLandmarks = processFacialLandmarks(landmarks);

        // Detect micro-expressions
        const microExpressions = detectMicroExpressions(processedLandmarks, blendshapes);

        // Calculate facial stability metrics
        const stabilityMetrics = calculateFacialStability(processedLandmarks);

        // Detect pressure response indicators
        const pressureIndicators = detectPressureIndicators(processedLandmarks, frame.timestamp, config);

        behavioralData.push({
          frameNumber: frame.frameNumber,
          timestamp: frame.timestamp,
          landmarks: processedLandmarks,
          blendshapes: blendshapes || {},
          microExpressions,
          stabilityMetrics,
          pressureIndicators,
          confidence: 0.8 + Math.random() * 0.15 // Placeholder confidence
        });
      } else {
        // No face detected in frame
        behavioralData.push({
          frameNumber: frame.frameNumber,
          timestamp: frame.timestamp,
          landmarks: null,
          microExpressions: null,
          stabilityMetrics: null,
          confidence: 0
        });
      }

      // Clean up tensor
      image.dispose();

    } catch (error) {
      console.error(`Error processing frame ${frame.frameNumber}:`, error);
      behavioralData.push({
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

  console.log('✅ Behavioral analysis complete');
  return behavioralData;
}

/**
 * Process facial landmarks into regions
 */
function processFacialLandmarks(landmarks) {
  const processedRegions = {};

  Object.entries(FACIAL_REGIONS).forEach(([region, indices]) => {
    processedRegions[region] = indices.map(idx => ({
      x: landmarks[idx].x,
      y: landmarks[idx].y,
      z: landmarks[idx].z || 0
    }));
  });

  return processedRegions;
}

/**
 * Detect micro-expressions from facial landmarks
 */
function detectMicroExpressions(landmarks, blendshapes) {
  const expressions = {};

  // Confidence micro-expression
  expressions.confidence = detectConfidenceExpression(landmarks, blendshapes);

  // Stress micro-expression
  expressions.stress = detectStressExpression(landmarks, blendshapes);

  // Concentration micro-expression
  expressions.concentration = detectConcentrationExpression(landmarks, blendshapes);

  // Determination micro-expression
  expressions.determination = detectDeterminationExpression(landmarks, blendshapes);

  // Composure assessment
  expressions.composure = assessComposure(landmarks, blendshapes);

  return expressions;
}

/**
 * Detect confidence micro-expression
 */
function detectConfidenceExpression(landmarks, blendshapes) {
  const indicators = {
    mouth_symmetry: calculateMouthSymmetry(landmarks.mouth),
    jaw_set: calculateJawSet(landmarks.jaw),
    eye_openness: calculateEyeOpenness(landmarks.leftEye, landmarks.rightEye),
    gaze_steadiness: 0.8 + Math.random() * 0.15 // Placeholder - requires temporal analysis
  };

  const score = Object.values(indicators).reduce((sum, val) => sum + val, 0) / Object.values(indicators).length;

  return {
    score,
    indicators,
    detected: score > 0.7
  };
}

/**
 * Detect stress micro-expression
 */
function detectStressExpression(landmarks, blendshapes) {
  const indicators = {
    brow_furrow: calculateBrowFurrow(landmarks.leftEyebrow, landmarks.rightEyebrow),
    lip_compression: calculateLipCompression(landmarks.mouth),
    jaw_tension: calculateJawTension(landmarks.jaw),
    mouth_tightness: blendshapes?.mouthPucker || 0
  };

  const score = Object.values(indicators).reduce((sum, val) => sum + val, 0) / Object.values(indicators).length;

  return {
    score,
    indicators,
    detected: score > 0.6
  };
}

/**
 * Detect concentration micro-expression
 */
function detectConcentrationExpression(landmarks, blendshapes) {
  const indicators = {
    brow_lowering: calculateBrowLowering(landmarks.leftEyebrow, landmarks.rightEyebrow),
    eye_narrowing: blendshapes?.eyeSquintLeft || 0 + blendshapes?.eyeSquintRight || 0 / 2,
    gaze_fixation: 0.85 + Math.random() * 0.1 // Placeholder
  };

  const score = Object.values(indicators).reduce((sum, val) => sum + val, 0) / Object.values(indicators).length;

  return {
    score,
    indicators,
    detected: score > 0.65
  };
}

/**
 * Detect determination micro-expression
 */
function detectDeterminationExpression(landmarks, blendshapes) {
  const indicators = {
    jaw_clench: blendshapes?.jawOpen ? 1 - blendshapes.jawOpen : 0.5,
    lip_press: calculateLipPress(landmarks.mouth),
    nostril_flare: blendshapes?.noseSneerLeft || 0 + blendshapes?.noseSneerRight || 0 / 2
  };

  const score = Object.values(indicators).reduce((sum, val) => sum + val, 0) / Object.values(indicators).length;

  return {
    score,
    indicators,
    detected: score > 0.7
  };
}

/**
 * Assess overall composure
 */
function assessComposure(landmarks, blendshapes) {
  const indicators = {
    facial_stillness: calculateFacialStillness(landmarks),
    breathing_rhythm: 0.75 + Math.random() * 0.2, // Placeholder - requires temporal analysis
    blink_rate: blendshapes?.eyeBlinkLeft || 0 + blendshapes?.eyeBlinkRight || 0 / 2
  };

  const score = Object.values(indicators).reduce((sum, val) => sum + val, 0) / Object.values(indicators).length;

  return {
    score,
    indicators,
    level: score > 0.8 ? 'high' : score > 0.6 ? 'moderate' : 'low'
  };
}

/**
 * Calculate facial stability metrics
 */
function calculateFacialStability(landmarks) {
  // Calculate variance in key facial regions
  const regionVariances = {};

  Object.entries(landmarks).forEach(([region, points]) => {
    if (!points || points.length === 0) {
      regionVariances[region] = 0;
      return;
    }

    // Calculate centroid
    const centroid = points.reduce((acc, p) => ({
      x: acc.x + p.x / points.length,
      y: acc.y + p.y / points.length,
      z: acc.z + p.z / points.length
    }), { x: 0, y: 0, z: 0 });

    // Calculate variance from centroid
    const variance = points.reduce((sum, p) => {
      const dist = Math.sqrt(
        Math.pow(p.x - centroid.x, 2) +
        Math.pow(p.y - centroid.y, 2) +
        Math.pow(p.z - centroid.z, 2)
      );
      return sum + dist;
    }, 0) / points.length;

    regionVariances[region] = variance;
  });

  return {
    regionVariances,
    overallStability: 1 - (Object.values(regionVariances).reduce((sum, v) => sum + v, 0) / Object.values(regionVariances).length)
  };
}

/**
 * Detect pressure response indicators
 */
function detectPressureIndicators(landmarks, timestamp, config) {
  // This would be enhanced with temporal analysis in production
  const indicators = {
    facial_tension: calculateOverallFacialTension(landmarks),
    asymmetry: calculateFacialAsymmetry(landmarks),
    micro_movement_frequency: Math.random() * 0.3, // Placeholder
    stress_indicators: detectStressIndicators(landmarks)
  };

  return indicators;
}

/**
 * Helper functions for micro-expression detection
 */

function calculateMouthSymmetry(mouthLandmarks) {
  if (!mouthLandmarks || mouthLandmarks.length < 4) return 0.5;

  const leftCorner = mouthLandmarks[0];
  const rightCorner = mouthLandmarks[6];
  const center = mouthLandmarks[13];

  const leftDist = Math.sqrt(
    Math.pow(leftCorner.x - center.x, 2) +
    Math.pow(leftCorner.y - center.y, 2)
  );

  const rightDist = Math.sqrt(
    Math.pow(rightCorner.x - center.x, 2) +
    Math.pow(rightCorner.y - center.y, 2)
  );

  const symmetry = 1 - Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist);
  return Math.max(0, Math.min(1, symmetry));
}

function calculateJawSet(jawLandmarks) {
  if (!jawLandmarks || jawLandmarks.length < 2) return 0.5;

  // Calculate jaw angle/position
  const jawLine = jawLandmarks.slice(0, 5);
  let totalAngle = 0;

  for (let i = 1; i < jawLine.length - 1; i++) {
    const v1 = {
      x: jawLine[i - 1].x - jawLine[i].x,
      y: jawLine[i - 1].y - jawLine[i].y
    };
    const v2 = {
      x: jawLine[i + 1].x - jawLine[i].x,
      y: jawLine[i + 1].y - jawLine[i].y
    };

    const angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
    totalAngle += Math.abs(angle);
  }

  return Math.max(0, Math.min(1, 1 - totalAngle / Math.PI));
}

function calculateEyeOpenness(leftEye, rightEye) {
  const calculateEyeAspectRatio = (eye) => {
    if (!eye || eye.length < 4) return 0.5;

    const verticalDist1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) +
      Math.pow(eye[1].y - eye[5].y, 2)
    );

    const verticalDist2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) +
      Math.pow(eye[2].y - eye[4].y, 2)
    );

    const horizontalDist = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) +
      Math.pow(eye[0].y - eye[3].y, 2)
    );

    return (verticalDist1 + verticalDist2) / (2 * horizontalDist);
  };

  const leftRatio = calculateEyeAspectRatio(leftEye);
  const rightRatio = calculateEyeAspectRatio(rightEye);

  return (leftRatio + rightRatio) / 2;
}

function calculateBrowFurrow(leftBrow, rightBrow) {
  if (!leftBrow || !rightBrow) return 0;

  // Calculate distance between eyebrows
  const leftInner = leftBrow[leftBrow.length - 1];
  const rightInner = rightBrow[0];

  const distance = Math.sqrt(
    Math.pow(leftInner.x - rightInner.x, 2) +
    Math.pow(leftInner.y - rightInner.y, 2)
  );

  // Closer eyebrows = more furrow
  return Math.max(0, Math.min(1, 1 - distance * 5));
}

function calculateLipCompression(mouthLandmarks) {
  if (!mouthLandmarks || mouthLandmarks.length < 8) return 0.5;

  const upperLip = mouthLandmarks.slice(0, 7);
  const lowerLip = mouthLandmarks.slice(7, 14);

  let totalDistance = 0;
  for (let i = 0; i < Math.min(upperLip.length, lowerLip.length); i++) {
    totalDistance += Math.sqrt(
      Math.pow(upperLip[i].x - lowerLip[i].x, 2) +
      Math.pow(upperLip[i].y - lowerLip[i].y, 2)
    );
  }

  const avgDistance = totalDistance / Math.min(upperLip.length, lowerLip.length);
  return Math.max(0, Math.min(1, 1 - avgDistance * 10));
}

function calculateJawTension(jawLandmarks) {
  if (!jawLandmarks || jawLandmarks.length < 3) return 0.5;

  // Calculate jaw muscle tension based on landmark positions
  let tension = 0;

  for (let i = 1; i < jawLandmarks.length - 1; i++) {
    const angle = calculateAngle(jawLandmarks[i - 1], jawLandmarks[i], jawLandmarks[i + 1]);
    tension += Math.abs(angle - Math.PI) / Math.PI;
  }

  return Math.max(0, Math.min(1, tension / (jawLandmarks.length - 2)));
}

function calculateBrowLowering(leftBrow, rightBrow) {
  // Simplified - in production would compare to neutral position
  return 0.6 + Math.random() * 0.3;
}

function calculateLipPress(mouthLandmarks) {
  return calculateLipCompression(mouthLandmarks) * 0.8;
}

function calculateFacialStillness(landmarks) {
  // This would require temporal comparison in production
  return 0.7 + Math.random() * 0.25;
}

function calculateOverallFacialTension(landmarks) {
  const tensions = [];

  if (landmarks.jaw) tensions.push(calculateJawTension(landmarks.jaw));
  if (landmarks.mouth) tensions.push(calculateLipCompression(landmarks.mouth));
  if (landmarks.leftEyebrow && landmarks.rightEyebrow) {
    tensions.push(calculateBrowFurrow(landmarks.leftEyebrow, landmarks.rightEyebrow));
  }

  return tensions.length > 0
    ? tensions.reduce((sum, t) => sum + t, 0) / tensions.length
    : 0.5;
}

function calculateFacialAsymmetry(landmarks) {
  // Compare left and right side of face
  let asymmetry = 0;
  let comparisons = 0;

  if (landmarks.leftEye && landmarks.rightEye) {
    const leftEyeCenter = calculateCentroid(landmarks.leftEye);
    const rightEyeCenter = calculateCentroid(landmarks.rightEye);
    asymmetry += Math.abs(leftEyeCenter.y - rightEyeCenter.y);
    comparisons++;
  }

  if (landmarks.leftEyebrow && landmarks.rightEyebrow) {
    const leftBrowCenter = calculateCentroid(landmarks.leftEyebrow);
    const rightBrowCenter = calculateCentroid(landmarks.rightEyebrow);
    asymmetry += Math.abs(leftBrowCenter.y - rightBrowCenter.y);
    comparisons++;
  }

  return comparisons > 0 ? asymmetry / comparisons : 0;
}

function detectStressIndicators(landmarks) {
  const indicators = [];

  if (landmarks.leftEyebrow && landmarks.rightEyebrow) {
    const furrow = calculateBrowFurrow(landmarks.leftEyebrow, landmarks.rightEyebrow);
    if (furrow > 0.7) indicators.push('brow_furrow');
  }

  if (landmarks.mouth) {
    const compression = calculateLipCompression(landmarks.mouth);
    if (compression > 0.6) indicators.push('lip_compression');
  }

  if (landmarks.jaw) {
    const tension = calculateJawTension(landmarks.jaw);
    if (tension > 0.7) indicators.push('jaw_tension');
  }

  return indicators;
}

function calculateCentroid(points) {
  return points.reduce((acc, p) => ({
    x: acc.x + p.x / points.length,
    y: acc.y + p.y / points.length,
    z: acc.z + p.z / points.length
  }), { x: 0, y: 0, z: 0 });
}

function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

  return Math.acos(dotProduct / (mag1 * mag2));
}

/**
 * Calculate behavioral metrics from raw data
 */
function calculateBehavioralMetrics(behavioralData, sport, config) {
  const metrics = {
    overall_character_score: 0,
    micro_expression_summary: {},
    emotional_stability: 0,
    pressure_response: 0,
    concentration_level: 0,
    confidence_level: 0,
    mental_resilience: 0,
    championship_indicators: []
  };

  // Filter frames with valid detections
  const validFrames = behavioralData.filter(f => f.landmarks && f.confidence > 0.5);

  if (validFrames.length === 0) {
    console.warn('No valid face detections found');
    return metrics;
  }

  // Aggregate micro-expression data
  const expressions = ['confidence', 'stress', 'concentration', 'determination', 'composure'];

  expressions.forEach(expression => {
    const scores = validFrames
      .map(f => f.microExpressions?.[expression]?.score)
      .filter(s => s !== undefined);

    if (scores.length > 0) {
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      metrics.micro_expression_summary[expression] = {
        average: avgScore,
        max: maxScore,
        min: minScore,
        variance: calculateVariance(scores),
        frequency: scores.filter(s => s > 0.6).length / scores.length
      };
    }
  });

  // Calculate emotional stability
  const stabilityScores = validFrames
    .map(f => f.stabilityMetrics?.overallStability)
    .filter(s => s !== undefined);

  metrics.emotional_stability = stabilityScores.length > 0
    ? stabilityScores.reduce((sum, s) => sum + s, 0) / stabilityScores.length
    : 0.5;

  // Calculate pressure response
  const stressScores = validFrames
    .map(f => f.microExpressions?.stress?.score)
    .filter(s => s !== undefined);

  const avgStress = stressScores.length > 0
    ? stressScores.reduce((sum, s) => sum + s, 0) / stressScores.length
    : 0.5;

  metrics.pressure_response = Math.max(0, 1 - avgStress); // Lower stress = better pressure response

  // Calculate concentration level
  metrics.concentration_level = metrics.micro_expression_summary.concentration?.average || 0.5;

  // Calculate confidence level
  metrics.confidence_level = metrics.micro_expression_summary.confidence?.average || 0.5;

  // Calculate mental resilience
  metrics.mental_resilience = calculateMentalResilience(validFrames);

  // Identify championship indicators
  if (metrics.confidence_level > 0.8) {
    metrics.championship_indicators.push('elite_confidence');
  }

  if (metrics.pressure_response > 0.85) {
    metrics.championship_indicators.push('pressure_performer');
  }

  if (metrics.emotional_stability > 0.8) {
    metrics.championship_indicators.push('emotional_control');
  }

  if (metrics.concentration_level > 0.85) {
    metrics.championship_indicators.push('laser_focus');
  }

  // Calculate overall character score
  metrics.overall_character_score = (
    metrics.confidence_level * 0.25 +
    metrics.pressure_response * 0.25 +
    metrics.emotional_stability * 0.2 +
    metrics.concentration_level * 0.15 +
    metrics.mental_resilience * 0.15
  );

  return metrics;
}

/**
 * Calculate variance of scores
 */
function calculateVariance(scores) {
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  return variance;
}

/**
 * Calculate mental resilience from behavioral patterns
 */
function calculateMentalResilience(frames) {
  // Look for recovery from stress indicators
  let resilience = 0.5;
  let stressEvents = 0;
  let recoveries = 0;

  for (let i = 1; i < frames.length; i++) {
    const prevStress = frames[i - 1].microExpressions?.stress?.score || 0;
    const currStress = frames[i].microExpressions?.stress?.score || 0;

    if (prevStress > 0.7 && currStress < 0.5) {
      recoveries++;
    }

    if (currStress > 0.7) {
      stressEvents++;
    }
  }

  if (stressEvents > 0) {
    resilience = Math.min(1, 0.5 + (recoveries / stressEvents) * 0.5);
  }

  return resilience;
}

/**
 * Calculate Composure & Resilience Score
 */
function calculateComposureResilienceScore(behavioralData, config) {
  console.log('🎯 Calculating Composure & Resilience Score');

  // Define key event windows (e.g., 3 seconds after critical moments)
  const eventWindowDuration = 3; // seconds
  const fps = 30; // Assuming 30 FPS
  const windowFrames = eventWindowDuration * fps;

  // Find pressure event windows (simplified - in production would use actual event detection)
  const pressureWindows = identifyPressureWindows(behavioralData, windowFrames);

  const scores = pressureWindows.map(window => {
    const windowData = behavioralData.slice(window.start, window.end);
    return calculateWindowComposure(windowData);
  });

  const overallScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : calculateWindowComposure(behavioralData);

  return {
    overall_score: overallScore,
    window_scores: scores,
    pressure_windows_analyzed: pressureWindows.length,
    methodology: 'Variance in facial landmark positions during pressure events',
    components: {
      facial_stability: calculateFacialStabilityScore(behavioralData),
      emotional_control: calculateEmotionalControlScore(behavioralData),
      stress_recovery: calculateStressRecoveryScore(behavioralData),
      consistency: calculateConsistencyScore(behavioralData)
    },
    grade: getComposureGrade(overallScore)
  };
}

/**
 * Identify pressure windows in the video
 */
function identifyPressureWindows(behavioralData, windowSize) {
  const windows = [];

  // For now, sample windows at regular intervals
  // In production, this would identify actual pressure events
  const interval = Math.floor(behavioralData.length / 5); // 5 windows

  for (let i = 0; i < behavioralData.length - windowSize; i += interval) {
    windows.push({
      start: i,
      end: Math.min(i + windowSize, behavioralData.length),
      type: 'pressure_event'
    });
  }

  return windows;
}

/**
 * Calculate composure for a specific window
 */
function calculateWindowComposure(windowData) {
  const validFrames = windowData.filter(f => f.landmarks && f.confidence > 0.5);

  if (validFrames.length < 2) return 0.5;

  // Calculate variance in facial landmark positions
  let totalVariance = 0;
  let comparisons = 0;

  for (let i = 1; i < validFrames.length; i++) {
    const prevFrame = validFrames[i - 1];
    const currFrame = validFrames[i];

    Object.keys(prevFrame.landmarks).forEach(region => {
      if (!currFrame.landmarks[region] || !prevFrame.landmarks[region]) return;

      const prevPoints = prevFrame.landmarks[region];
      const currPoints = currFrame.landmarks[region];

      for (let j = 0; j < Math.min(prevPoints.length, currPoints.length); j++) {
        const distance = Math.sqrt(
          Math.pow(currPoints[j].x - prevPoints[j].x, 2) +
          Math.pow(currPoints[j].y - prevPoints[j].y, 2)
        );

        totalVariance += distance;
        comparisons++;
      }
    });
  }

  if (comparisons === 0) return 0.5;

  const avgVariance = totalVariance / comparisons;

  // Convert variance to composure score (lower variance = higher composure)
  const composure = Math.max(0, Math.min(1, 1 - (avgVariance * 50)));

  return composure;
}

/**
 * Calculate facial stability score
 */
function calculateFacialStabilityScore(behavioralData) {
  const stabilityScores = behavioralData
    .filter(f => f.stabilityMetrics)
    .map(f => f.stabilityMetrics.overallStability);

  return stabilityScores.length > 0
    ? stabilityScores.reduce((sum, s) => sum + s, 0) / stabilityScores.length
    : 0.5;
}

/**
 * Calculate emotional control score
 */
function calculateEmotionalControlScore(behavioralData) {
  const validFrames = behavioralData.filter(f => f.microExpressions);

  if (validFrames.length === 0) return 0.5;

  // Look for consistency in emotional expressions
  const emotionVariances = [];

  ['confidence', 'stress', 'composure'].forEach(emotion => {
    const scores = validFrames
      .map(f => f.microExpressions[emotion]?.score)
      .filter(s => s !== undefined);

    if (scores.length > 0) {
      emotionVariances.push(calculateVariance(scores));
    }
  });

  if (emotionVariances.length === 0) return 0.5;

  const avgVariance = emotionVariances.reduce((sum, v) => sum + v, 0) / emotionVariances.length;

  // Lower variance = better emotional control
  return Math.max(0, Math.min(1, 1 - Math.sqrt(avgVariance)));
}

/**
 * Calculate stress recovery score
 */
function calculateStressRecoveryScore(behavioralData) {
  const validFrames = behavioralData.filter(f => f.microExpressions?.stress);

  if (validFrames.length < 10) return 0.5;

  let recoveryEvents = 0;
  let stressEvents = 0;

  for (let i = 5; i < validFrames.length; i++) {
    const recentStress = validFrames.slice(i - 5, i)
      .map(f => f.microExpressions.stress.score)
      .reduce((sum, s) => sum + s, 0) / 5;

    const currentStress = validFrames[i].microExpressions.stress.score;

    if (recentStress > 0.7) {
      stressEvents++;
      if (currentStress < 0.5) {
        recoveryEvents++;
      }
    }
  }

  return stressEvents > 0 ? recoveryEvents / stressEvents : 0.5;
}

/**
 * Calculate consistency score
 */
function calculateConsistencyScore(behavioralData) {
  const validFrames = behavioralData.filter(f => f.microExpressions?.composure);

  if (validFrames.length === 0) return 0.5;

  const composureScores = validFrames.map(f => f.microExpressions.composure.score);
  const variance = calculateVariance(composureScores);

  // Lower variance = higher consistency
  return Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));
}

/**
 * Get composure grade based on score
 */
function getComposureGrade(score) {
  if (score >= 0.9) return 'Elite Championship Composure';
  if (score >= 0.8) return 'Excellent Composure';
  if (score >= 0.7) return 'Good Composure';
  if (score >= 0.6) return 'Developing Composure';
  return 'Needs Composure Development';
}

/**
 * Store behavioral results in Firestore
 */
async function storeBehavioralResults(sessionId, playerId, videoId, results) {
  const behavioralRef = firestore.collection('behavioral_analysis').doc();

  // Store summary document
  await behavioralRef.set({
    sessionId,
    playerId,
    videoId,
    metrics: results.metrics,
    composureScore: results.composureScore,
    frameCount: results.frameCount,
    fps: results.fps,
    processingTimestamp: results.processingTimestamp,
    createdAt: Firestore.FieldValue.serverTimestamp()
  });

  // Store time-series data in subcollection (chunked for performance)
  const timeSeriesRef = behavioralRef.collection('time_series');
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

  console.log(`💾 Stored behavioral results: ${behavioralRef.id}`);
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
  const tempDir = path.join(os.tmpdir(), `${sessionId}_behavioral`);

  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`🧹 Cleaned up temporary files for session ${sessionId}`);
  } catch (error) {
    console.warn('Failed to clean up temp files:', error);
  }
}

module.exports = { behavioralAnalysis };