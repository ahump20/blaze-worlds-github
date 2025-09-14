/**
 * Blaze Intelligence Vision Engine - Video Ingestion Function
 * Google Cloud Function triggered by Cloudinary webhook
 * Validates video and triggers parallel analysis pipelines
 */

const functions = require('@google-cloud/functions-framework');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');

// Initialize services
const pubsub = new PubSub();
const storage = new Storage();
const firestore = new Firestore();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Topic names for parallel processing
const BIOMECHANICS_TOPIC = 'vision-engine-biomechanics';
const BEHAVIORAL_TOPIC = 'vision-engine-behavioral';
const SYNTHESIS_TOPIC = 'vision-engine-synthesis';

/**
 * Main ingestion function - triggered by Cloudinary webhook
 */
functions.http('videoIngestion', async (req, res) => {
  console.log('🎥 Vision Engine: Video ingestion triggered');

  try {
    // Validate webhook signature
    if (!validateCloudinaryWebhook(req)) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    // Extract video metadata from Cloudinary notification
    const {
      public_id,
      secure_url,
      resource_type,
      format,
      duration,
      width,
      height,
      created_at,
      tags,
      context
    } = req.body;

    // Validate video file
    if (resource_type !== 'video') {
      console.error('Invalid resource type:', resource_type);
      return res.status(400).send('Only video files are accepted');
    }

    // Validate video specifications
    const validationResult = await validateVideoSpecifications({
      format,
      duration,
      width,
      height
    });

    if (!validationResult.isValid) {
      console.error('Video validation failed:', validationResult.errors);
      await updateVideoStatus(public_id, 'validation_failed', validationResult.errors);
      return res.status(400).json({
        error: 'Video validation failed',
        details: validationResult.errors
      });
    }

    // Extract player and session metadata
    const playerId = context?.custom?.player_id || extractPlayerIdFromTags(tags);
    const sessionType = context?.custom?.session_type || 'training';
    const sport = context?.custom?.sport || 'baseball';

    if (!playerId) {
      console.error('No player ID found in video metadata');
      return res.status(400).send('Player ID is required');
    }

    // Create analysis session in Firestore
    const sessionId = await createAnalysisSession({
      playerId,
      videoId: public_id,
      videoUrl: secure_url,
      duration,
      dimensions: { width, height },
      sessionType,
      sport,
      uploadedAt: created_at,
      status: 'processing'
    });

    console.log(`📊 Created analysis session: ${sessionId}`);

    // Prepare video for parallel processing
    const videoMetadata = {
      sessionId,
      playerId,
      videoId: public_id,
      videoUrl: secure_url,
      duration,
      fps: await extractVideoFPS(secure_url),
      sport,
      sessionType,
      analysisConfig: getAnalysisConfig(sport, sessionType)
    };

    // Download video to temporary Cloud Storage for processing
    const gcsPath = await downloadToCloudStorage(secure_url, sessionId);
    videoMetadata.gcsPath = gcsPath;

    // Trigger parallel analysis pipelines
    await Promise.all([
      publishToAnalysisPipeline(BIOMECHANICS_TOPIC, {
        ...videoMetadata,
        streamType: 'biomechanics'
      }),
      publishToAnalysisPipeline(BEHAVIORAL_TOPIC, {
        ...videoMetadata,
        streamType: 'behavioral'
      })
    ]);

    console.log('✅ Parallel analysis pipelines triggered successfully');

    // Update session status
    await updateAnalysisSession(sessionId, {
      status: 'analyzing',
      pipelineStartTime: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      sessionId,
      message: 'Video analysis initiated',
      estimatedProcessingTime: calculateEstimatedProcessingTime(duration)
    });

  } catch (error) {
    console.error('❌ Video ingestion error:', error);
    res.status(500).json({
      error: 'Video ingestion failed',
      message: error.message
    });
  }
});

/**
 * Validate Cloudinary webhook signature
 */
function validateCloudinaryWebhook(req) {
  const signature = req.headers['x-cld-signature'];
  const timestamp = req.headers['x-cld-timestamp'];
  const expectedSignature = cloudinary.utils.webhook_signature(
    req.body,
    timestamp,
    process.env.CLOUDINARY_WEBHOOK_SECRET
  );
  return signature === expectedSignature;
}

/**
 * Validate video specifications
 */
async function validateVideoSpecifications({ format, duration, width, height }) {
  const errors = [];
  const validFormats = ['mp4', 'mov', 'avi', 'webm'];
  const maxDuration = 600; // 10 minutes
  const minResolution = 720; // Minimum 720p for accurate analysis

  if (!validFormats.includes(format.toLowerCase())) {
    errors.push(`Invalid format: ${format}. Supported formats: ${validFormats.join(', ')}`);
  }

  if (duration > maxDuration) {
    errors.push(`Video too long: ${duration}s. Maximum duration: ${maxDuration}s`);
  }

  if (Math.min(width, height) < minResolution) {
    errors.push(`Resolution too low: ${width}x${height}. Minimum resolution: 720p`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extract player ID from video tags
 */
function extractPlayerIdFromTags(tags) {
  if (!tags || tags.length === 0) return null;

  const playerTag = tags.find(tag => tag.startsWith('player_'));
  return playerTag ? playerTag.replace('player_', '') : null;
}

/**
 * Create analysis session in Firestore
 */
async function createAnalysisSession(sessionData) {
  const sessionRef = firestore.collection('analysis_sessions').doc();

  await sessionRef.set({
    ...sessionData,
    createdAt: Firestore.FieldValue.serverTimestamp(),
    biomechanicsStatus: 'pending',
    behavioralStatus: 'pending',
    synthesisStatus: 'pending',
    completedAt: null,
    results: null
  });

  return sessionRef.id;
}

/**
 * Extract video FPS using ffprobe
 */
async function extractVideoFPS(videoUrl) {
  try {
    // Use Cloudinary's API to get video metadata
    const videoInfo = await cloudinary.api.resource(
      videoUrl.split('/').pop().split('.')[0],
      { resource_type: 'video' }
    );

    return videoInfo.frame_rate || 30; // Default to 30 FPS
  } catch (error) {
    console.warn('Could not extract FPS, using default:', error.message);
    return 30;
  }
}

/**
 * Get sport-specific analysis configuration
 */
function getAnalysisConfig(sport, sessionType) {
  const configs = {
    baseball: {
      biomechanics: {
        keypoints: ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'],
        phases: ['setup', 'load', 'stride', 'contact', 'follow_through'],
        criticalAngles: ['hip_rotation', 'shoulder_tilt', 'elbow_angle']
      },
      behavioral: {
        focusRegions: ['eyes', 'jaw', 'brow'],
        microExpressionWindow: 200, // milliseconds
        pressureEvents: ['pitch_release', 'contact', 'result']
      }
    },
    football: {
      biomechanics: {
        keypoints: ['shoulder', 'elbow', 'hip', 'knee', 'ankle', 'head'],
        phases: ['stance', 'drop_back', 'release', 'follow_through'],
        criticalAngles: ['throwing_angle', 'hip_rotation', 'stride_length']
      },
      behavioral: {
        focusRegions: ['eyes', 'jaw', 'mouth'],
        microExpressionWindow: 150,
        pressureEvents: ['snap', 'pressure', 'release']
      }
    },
    basketball: {
      biomechanics: {
        keypoints: ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'],
        phases: ['setup', 'dip', 'rise', 'release', 'follow_through'],
        criticalAngles: ['elbow_angle', 'release_angle', 'knee_flexion']
      },
      behavioral: {
        focusRegions: ['eyes', 'brow', 'mouth'],
        microExpressionWindow: 100,
        pressureEvents: ['shot_attempt', 'free_throw', 'pressure_situation']
      }
    }
  };

  return configs[sport] || configs.baseball;
}

/**
 * Download video to Cloud Storage for processing
 */
async function downloadToCloudStorage(videoUrl, sessionId) {
  const bucket = storage.bucket(process.env.GCS_PROCESSING_BUCKET);
  const fileName = `sessions/${sessionId}/original.mp4`;
  const file = bucket.file(fileName);

  console.log(`📥 Downloading video to GCS: ${fileName}`);

  // Stream video from Cloudinary to Cloud Storage
  const response = await axios({
    method: 'GET',
    url: videoUrl,
    responseType: 'stream'
  });

  return new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          sessionId,
          source: 'cloudinary',
          downloadedAt: new Date().toISOString()
        }
      }
    });

    stream.on('error', reject);
    stream.on('finish', () => {
      console.log(`✅ Video downloaded to GCS: ${fileName}`);
      resolve(`gs://${process.env.GCS_PROCESSING_BUCKET}/${fileName}`);
    });

    response.data.pipe(stream);
  });
}

/**
 * Publish message to analysis pipeline
 */
async function publishToAnalysisPipeline(topicName, data) {
  const topic = pubsub.topic(topicName);

  const message = {
    data: Buffer.from(JSON.stringify(data)),
    attributes: {
      sessionId: data.sessionId,
      playerId: data.playerId,
      streamType: data.streamType
    }
  };

  await topic.publishMessage(message);
  console.log(`📤 Published to ${topicName} for session ${data.sessionId}`);
}

/**
 * Update analysis session in Firestore
 */
async function updateAnalysisSession(sessionId, updates) {
  await firestore.collection('analysis_sessions').doc(sessionId).update({
    ...updates,
    updatedAt: Firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Update video status in Cloudinary
 */
async function updateVideoStatus(publicId, status, errors = null) {
  try {
    await cloudinary.uploader.update_metadata(
      {
        analysis_status: status,
        analysis_errors: errors ? JSON.stringify(errors) : null,
        analysis_timestamp: new Date().toISOString()
      },
      [publicId]
    );
  } catch (error) {
    console.error('Failed to update Cloudinary metadata:', error);
  }
}

/**
 * Calculate estimated processing time based on video duration
 */
function calculateEstimatedProcessingTime(duration) {
  // Roughly 2x real-time for processing
  const processingSeconds = duration * 2;

  if (processingSeconds < 60) {
    return `${Math.ceil(processingSeconds)} seconds`;
  } else {
    return `${Math.ceil(processingSeconds / 60)} minutes`;
  }
}

module.exports = { videoIngestion };