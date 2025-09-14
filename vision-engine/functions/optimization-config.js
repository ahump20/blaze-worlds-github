/**
 * Blaze Intelligence Vision Engine - Performance Optimization Configuration
 * Championship-level processing efficiency for scale
 */

module.exports = {
  /**
   * Frame Processing Optimization
   */
  frameProcessing: {
    // Adaptive frame sampling based on video length
    adaptiveSampling: {
      enabled: true,
      rules: [
        { maxDuration: 30, sampleRate: 1 },      // Process every frame for short clips
        { maxDuration: 60, sampleRate: 2 },      // Every 2nd frame for 1 minute
        { maxDuration: 180, sampleRate: 3 },     // Every 3rd frame for 3 minutes
        { maxDuration: 600, sampleRate: 5 }      // Every 5th frame for 10 minutes
      ]
    },

    // Batch processing configuration
    batchConfig: {
      maxBatchSize: 30,           // Process 30 frames at once
      parallelBatches: 4,         // Run 4 batches in parallel
      memoryThreshold: 0.8        // Reduce batch size if memory > 80%
    },

    // Key frame detection for efficient processing
    keyFrameDetection: {
      enabled: true,
      motionThreshold: 0.15,      // Minimum motion to trigger processing
      sceneChangeDetection: true,
      sportSpecificEvents: {
        baseball: ['wind_up', 'release', 'contact', 'follow_through'],
        football: ['snap', 'throw', 'catch', 'tackle'],
        basketball: ['dribble', 'shot_start', 'release', 'landing']
      }
    }
  },

  /**
   * Memory Management
   */
  memoryManagement: {
    // Garbage collection optimization
    gcOptimization: {
      forceGcThreshold: 0.85,     // Force GC at 85% memory usage
      intervalMs: 30000,          // Check memory every 30 seconds
      cleanupBatchSize: 100       // Clean up 100 frames at a time
    },

    // Frame buffer management
    frameBuffer: {
      maxSize: 150,               // Maximum frames in memory
      preloadSize: 30,            // Preload next 30 frames
      cleanupDelay: 5000          // Cleanup after 5 seconds
    },

    // Tensor cleanup for MediaPipe
    tensorCleanup: {
      enabled: true,
      disposalDelay: 100,         // Dispose tensors after 100ms
      batchDisposal: true         // Dispose in batches for efficiency
    }
  },

  /**
   * Storage Optimization
   */
  storageOptimization: {
    // Firestore batch writes
    firestoreBatching: {
      maxBatchSize: 500,          // Firestore batch limit
      chunkSize: 100,             // Frames per document
      compressionEnabled: true,
      compressionLevel: 6         // zlib compression level (1-9)
    },

    // Cloud Storage optimization
    cloudStorage: {
      parallelUploads: 3,
      chunkSize: 8 * 1024 * 1024, // 8MB chunks
      resumableThreshold: 5 * 1024 * 1024, // Use resumable for > 5MB
      cacheControl: 'private, max-age=3600'
    },

    // Temporary file management
    tempFiles: {
      directory: '/tmp/vision-engine',
      maxAge: 3600000,            // Delete after 1 hour
      maxSize: 2 * 1024 * 1024 * 1024, // 2GB max temp storage
      cleanupInterval: 600000     // Cleanup every 10 minutes
    }
  },

  /**
   * Processing Pipeline Optimization
   */
  pipelineOptimization: {
    // Parallel processing configuration
    parallelStreams: {
      maxConcurrent: 2,           // Max concurrent video analyses
      queueSize: 10,              // Maximum queue size
      priorityQueue: true,        // Enable priority processing
      priorities: {
        live_game: 1,
        training: 2,
        historical: 3
      }
    },

    // Stream coordination
    streamCoordination: {
      synchronizationInterval: 100, // Check sync every 100ms
      maxDesync: 500,              // Maximum desync in milliseconds
      bufferSize: 50                // Frame buffer for synchronization
    },

    // Error recovery
    errorRecovery: {
      maxRetries: 3,
      retryDelay: 1000,           // Initial retry delay
      exponentialBackoff: true,
      maxRetryDelay: 30000,       // Maximum 30 second delay
      partialRecovery: true       // Continue with partial results
    }
  },

  /**
   * Model Optimization
   */
  modelOptimization: {
    // MediaPipe configuration
    mediaPipe: {
      modelComplexity: 2,         // 0=Lite, 1=Full, 2=Heavy
      smoothLandmarks: true,
      enableSegmentation: false,  // Disable unused features
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      staticImageMode: false      // Video mode optimization
    },

    // Model caching
    modelCaching: {
      enabled: true,
      preloadModels: true,
      cacheDirectory: '/tmp/models',
      maxCacheSize: 500 * 1024 * 1024 // 500MB cache
    },

    // Inference optimization
    inference: {
      useGPU: true,               // Use GPU if available
      gpuBackend: 'webgl',        // WebGL backend for browser
      wasmBackend: 'simd',        // SIMD for CPU fallback
      numThreads: 4               // Parallel inference threads
    }
  },

  /**
   * Network Optimization
   */
  networkOptimization: {
    // API throttling
    apiThrottling: {
      maxRequestsPerSecond: 100,
      burstSize: 200,
      queueRequests: true
    },

    // Connection pooling
    connectionPool: {
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000,
      keepAlive: true,
      keepAliveMsecs: 30000
    },

    // Retry configuration
    retryConfig: {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 60000,
      randomize: true
    }
  },

  /**
   * Caching Strategy
   */
  cachingStrategy: {
    // Result caching
    resultCache: {
      enabled: true,
      ttl: 3600,                  // 1 hour TTL
      maxSize: 1000,               // Maximum 1000 entries
      updateOnAccess: true         // Refresh TTL on access
    },

    // Landmark caching for similar frames
    landmarkCache: {
      enabled: true,
      similarityThreshold: 0.95,  // 95% similarity to use cache
      maxEntries: 500,
      ttl: 300                     // 5 minute TTL
    },

    // Processing state cache
    stateCache: {
      provider: 'redis',           // Redis for distributed cache
      keyPrefix: 'vision:',
      ttl: 7200,                   // 2 hour TTL
      compression: true
    }
  },

  /**
   * Monitoring & Metrics
   */
  monitoring: {
    // Performance metrics
    metrics: {
      enabled: true,
      sampleRate: 0.1,            // Sample 10% of requests
      customMetrics: [
        'frame_processing_time',
        'memory_usage',
        'cache_hit_rate',
        'model_inference_time'
      ]
    },

    // Alerting thresholds
    alerts: {
      memoryUsage: 0.9,           // Alert at 90% memory
      processingTime: 10000,      // Alert if > 10s per frame
      errorRate: 0.05,             // Alert at 5% error rate
      queueDepth: 50               // Alert if queue > 50
    },

    // Logging configuration
    logging: {
      level: 'info',
      structured: true,
      includeTimings: true,
      excludeSensitive: true,
      maxLogSize: 10 * 1024 * 1024 // 10MB max log size
    }
  },

  /**
   * Auto-scaling Configuration
   */
  autoScaling: {
    enabled: true,
    minInstances: 1,
    maxInstances: 100,
    targetCPU: 0.6,               // Scale at 60% CPU
    targetMemory: 0.7,            // Scale at 70% memory
    scaleDownDelay: 300,          // Wait 5 minutes before scaling down
    customMetrics: {
      queueDepth: {
        target: 20,
        scaleUpThreshold: 30,
        scaleDownThreshold: 10
      }
    }
  },

  /**
   * Sport-Specific Optimizations
   */
  sportOptimizations: {
    baseball: {
      criticalPhases: ['wind_up', 'release', 'contact'],
      enhancedProcessing: true,   // More detailed analysis
      frameRateOverride: 60       // Higher frame rate for fast motion
    },
    football: {
      criticalPhases: ['snap', 'release', 'catch'],
      enhancedProcessing: true,
      playerTracking: true         // Track multiple players
    },
    basketball: {
      criticalPhases: ['shot_start', 'release', 'follow_through'],
      enhancedProcessing: true,
      courtTracking: true          // Track position on court
    }
  },

  /**
   * Cost Optimization
   */
  costOptimization: {
    // Selective processing based on importance
    selectiveProcessing: {
      enabled: true,
      rules: [
        { tag: 'championship', processAll: true },
        { tag: 'playoff', sampleRate: 1 },
        { tag: 'regular_season', sampleRate: 2 },
        { tag: 'practice', sampleRate: 3 },
        { tag: 'historical', sampleRate: 5 }
      ]
    },

    // Resource allocation
    resourceAllocation: {
      premiumTier: {
        cpu: 4,
        memory: '8GB',
        timeout: 540
      },
      standardTier: {
        cpu: 2,
        memory: '4GB',
        timeout: 300
      },
      economyTier: {
        cpu: 1,
        memory: '2GB',
        timeout: 120
      }
    }
  }
};