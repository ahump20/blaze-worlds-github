/**
 * Blaze Intelligence Vision Mobile SDK
 * Championship Field Capture & Analysis
 * For coaches, scouts, and programs from Perfect Game to the Pros
 */

class BlazeVisionSDK {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = config.apiUrl || 'https://api.blaze-intelligence.com';
        this.cloudinaryConfig = config.cloudinary;
        this.autoUpload = config.autoUpload !== false;
        this.sport = config.defaultSport || 'baseball';

        // Texas high school and Perfect Game integration
        this.perfectGameIntegration = config.perfectGame || false;
        this.txHSIntegration = config.texasHighSchool || false;

        this.initializeSDK();
    }

    /**
     * Initialize SDK components
     */
    async initializeSDK() {
        // Check device capabilities
        this.deviceCapabilities = await this.checkDeviceCapabilities();

        // Initialize camera and sensors
        this.camera = new CameraManager(this.deviceCapabilities);

        // Set up local storage for offline capture
        this.storage = new OfflineStorage();

        // Initialize WebSocket for real-time updates
        this.initializeRealtimeConnection();

        console.log('🔥 Blaze Vision SDK initialized - Championship ready');
    }

    /**
     * Check device capabilities for optimal capture
     */
    async checkDeviceCapabilities() {
        const capabilities = {
            camera: {
                hasCamera: 'mediaDevices' in navigator,
                maxResolution: null,
                supportedFrameRates: [],
                hasStabilization: false
            },
            sensors: {
                hasGyroscope: 'DeviceOrientationEvent' in window,
                hasAccelerometer: 'DeviceMotionEvent' in window
            },
            performance: {
                cores: navigator.hardwareConcurrency || 4,
                memory: navigator.deviceMemory || 4,
                connection: navigator.connection?.effectiveType || '4g'
            },
            platform: this.detectPlatform()
        };

        // Check camera capabilities
        if (capabilities.camera.hasCamera) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter(d => d.kind === 'videoinput');

                if (cameras.length > 0) {
                    // Get video capabilities
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' }
                    });

                    const track = stream.getVideoTracks()[0];
                    const settings = track.getSettings();
                    const capabilities = track.getCapabilities();

                    capabilities.camera.maxResolution = {
                        width: capabilities.width?.max || 1920,
                        height: capabilities.height?.max || 1080
                    };

                    capabilities.camera.supportedFrameRates = [
                        ...(capabilities.frameRate?.max >= 60 ? [60] : []),
                        30, 24
                    ];

                    capabilities.camera.hasStabilization =
                        capabilities.opticalImageStabilization ||
                        capabilities.digitalImageStabilization || false;

                    track.stop();
                }
            } catch (error) {
                console.warn('Camera capability check failed:', error);
            }
        }

        return capabilities;
    }

    /**
     * Detect platform (iOS/Android/Web)
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();

        if (/iphone|ipad|ipod/.test(userAgent)) {
            return { os: 'ios', version: this.getIOSVersion() };
        } else if (/android/.test(userAgent)) {
            return { os: 'android', version: this.getAndroidVersion() };
        } else {
            return { os: 'web', version: null };
        }
    }

    /**
     * Start video capture session
     */
    async startCapture(options = {}) {
        const session = {
            id: this.generateSessionId(),
            playerId: options.playerId,
            playerName: options.playerName,
            sport: options.sport || this.sport,
            sessionType: options.sessionType || 'training',
            location: options.location || await this.getCurrentLocation(),
            metadata: {
                ...options.metadata,
                captureDevice: this.deviceCapabilities.platform,
                timestamp: new Date().toISOString(),
                // Perfect Game tournament tracking
                tournamentId: options.tournamentId,
                teamId: options.teamId,
                gameId: options.gameId
            }
        };

        // Configure camera settings for sport
        const cameraConfig = this.getOptimalCameraSettings(session.sport, session.sessionType);

        try {
            // Start camera capture
            const stream = await this.camera.startCapture(cameraConfig);

            // Initialize MediaRecorder
            this.recorder = new MediaRecorder(stream, {
                mimeType: this.getOptimalCodec(),
                videoBitsPerSecond: cameraConfig.bitrate
            });

            // Set up data collection
            const chunks = [];
            this.recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            // Handle recording completion
            this.recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                await this.processCapture(blob, session);
            };

            // Start recording
            this.recorder.start();

            // Start real-time preview if enabled
            if (options.showPreview) {
                this.startPreviewOverlay(stream, session);
            }

            // Store session
            this.currentSession = session;

            return {
                sessionId: session.id,
                status: 'recording',
                startTime: new Date().toISOString()
            };

        } catch (error) {
            console.error('Capture failed:', error);
            throw new Error(`Failed to start capture: ${error.message}`);
        }
    }

    /**
     * Stop capture and trigger analysis
     */
    async stopCapture() {
        if (!this.recorder || this.recorder.state === 'inactive') {
            throw new Error('No active recording');
        }

        return new Promise((resolve) => {
            this.recorder.addEventListener('stop', () => {
                resolve({
                    sessionId: this.currentSession.id,
                    status: 'processing'
                });
            });

            this.recorder.stop();
            this.camera.stopCapture();
        });
    }

    /**
     * Process captured video
     */
    async processCapture(videoBlob, session) {
        // Show processing UI
        this.showProcessingOverlay();

        try {
            // Upload to Cloudinary
            const uploadResult = await this.uploadToCloudinary(videoBlob, session);

            // Trigger Vision Engine analysis
            const analysisResult = await this.triggerAnalysis({
                videoUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                ...session
            });

            // Store locally for offline access
            await this.storage.saveSession({
                ...session,
                videoUrl: uploadResult.secure_url,
                analysisId: analysisResult.sessionId,
                status: 'analyzing'
            });

            // Start polling for results
            this.pollForResults(analysisResult.sessionId);

            return analysisResult;

        } catch (error) {
            console.error('Processing failed:', error);

            // Store for retry when connection available
            if (!navigator.onLine) {
                await this.storage.queueForUpload(videoBlob, session);
                this.showOfflineNotification();
            }

            throw error;
        }
    }

    /**
     * Get optimal camera settings for sport
     */
    getOptimalCameraSettings(sport, sessionType) {
        const baseSettings = {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        };

        const sportSettings = {
            baseball: {
                batting: {
                    frameRate: { ideal: 60, min: 30 },
                    bitrate: 8000000, // 8 Mbps for fast motion
                    focusMode: 'continuous',
                    exposureMode: 'continuous'
                },
                pitching: {
                    frameRate: { ideal: 60, min: 30 },
                    bitrate: 8000000,
                    focusMode: 'continuous',
                    exposureMode: 'sports'
                },
                fielding: {
                    frameRate: { ideal: 30 },
                    bitrate: 5000000,
                    focusMode: 'continuous',
                    exposureMode: 'continuous'
                }
            },
            football: {
                quarterback: {
                    frameRate: { ideal: 60, min: 30 },
                    bitrate: 8000000,
                    focusMode: 'continuous',
                    exposureMode: 'sports'
                },
                receiver: {
                    frameRate: { ideal: 30 },
                    bitrate: 6000000,
                    focusMode: 'continuous',
                    exposureMode: 'continuous'
                }
            },
            basketball: {
                shooting: {
                    frameRate: { ideal: 60, min: 30 },
                    bitrate: 7000000,
                    focusMode: 'continuous',
                    exposureMode: 'sports'
                }
            }
        };

        const specific = sportSettings[sport]?.[sessionType] || {
            frameRate: { ideal: 30 },
            bitrate: 5000000,
            focusMode: 'continuous',
            exposureMode: 'continuous'
        };

        return { ...baseSettings, ...specific };
    }

    /**
     * Upload video to Cloudinary
     */
    async uploadToCloudinary(videoBlob, session) {
        const formData = new FormData();
        formData.append('file', videoBlob);
        formData.append('upload_preset', this.cloudinaryConfig.uploadPreset);
        formData.append('public_id', `${session.sport}_${session.playerId}_${session.id}`);
        formData.append('context', `player_id=${session.playerId}|sport=${session.sport}|session_type=${session.sessionType}`);
        formData.append('tags', [
            session.sport,
            session.sessionType,
            `player_${session.playerId}`,
            session.metadata.tournamentId ? `tournament_${session.metadata.tournamentId}` : null
        ].filter(Boolean).join(','));

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/video/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return await response.json();
    }

    /**
     * Trigger Vision Engine analysis
     */
    async triggerAnalysis(data) {
        const response = await fetch(`${this.apiUrl}/api/analysis/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Analysis trigger failed');
        }

        return await response.json();
    }

    /**
     * Poll for analysis results
     */
    async pollForResults(sessionId) {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiUrl}/api/analysis/${sessionId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                });

                const data = await response.json();

                if (data.status === 'completed') {
                    clearInterval(pollInterval);
                    this.handleAnalysisComplete(data);
                } else if (data.status === 'failed') {
                    clearInterval(pollInterval);
                    this.handleAnalysisError(data);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000); // Poll every 3 seconds

        // Store interval ID for cleanup
        this.activePolls = this.activePolls || new Map();
        this.activePolls.set(sessionId, pollInterval);
    }

    /**
     * Handle completed analysis
     */
    handleAnalysisComplete(data) {
        // Update local storage
        this.storage.updateSession(data.sessionId, {
            status: 'completed',
            results: data
        });

        // Show results overlay
        this.showResultsOverlay(data);

        // Trigger callbacks
        if (this.onAnalysisComplete) {
            this.onAnalysisComplete(data);
        }

        // Send to Perfect Game integration if enabled
        if (this.perfectGameIntegration && data.metadata?.tournamentId) {
            this.sendToPerfectGame(data);
        }
    }

    /**
     * Real-time preview overlay with AI feedback
     */
    startPreviewOverlay(stream, session) {
        const overlay = new PreviewOverlay(stream);

        // Add championship metrics display
        overlay.addMetricDisplay({
            position: 'top-right',
            metrics: ['biomechanical', 'composure', 'efficiency']
        });

        // Add coaching cues based on sport
        if (session.sport === 'baseball' && session.sessionType === 'batting') {
            overlay.addCoachingCues([
                'Keep hands back',
                'Drive through the ball',
                'Stay balanced'
            ]);
        }

        // Add recording indicator
        overlay.addRecordingIndicator();

        overlay.show();
        this.currentOverlay = overlay;
    }

    /**
     * Show results overlay
     */
    showResultsOverlay(data) {
        const resultsUI = new ResultsOverlay(data);

        // Championship scores
        resultsUI.addScoreCard({
            overall: data.scores.overall,
            biomechanical: data.scores.biomechanical,
            behavioral: data.scores.behavioral,
            clutchFactor: data.scores.clutchFactor,
            championshipReadiness: data.scores.championshipReadiness
        });

        // Key insights in Texas coaching style
        resultsUI.addInsights(data.insights.slice(0, 3));

        // Comparison to elite benchmarks
        resultsUI.addBenchmarkComparison(data.comparison);

        // Share options
        resultsUI.addShareOptions({
            perfectGame: this.perfectGameIntegration,
            texasHighSchool: this.txHSIntegration,
            social: true
        });

        resultsUI.show();
    }

    /**
     * Initialize WebSocket for real-time updates
     */
    initializeRealtimeConnection() {
        const wsUrl = this.apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');

        this.socket = io(wsUrl, {
            auth: {
                token: this.apiKey
            }
        });

        this.socket.on('connect', () => {
            console.log('📡 Connected to Blaze Vision Engine');
        });

        this.socket.on('frame_analysis', (data) => {
            if (this.currentOverlay) {
                this.currentOverlay.updateMetrics(data);
            }
        });

        this.socket.on('critical_moment', (data) => {
            if (this.currentOverlay) {
                this.currentOverlay.highlightMoment(data);
            }
        });
    }

    /**
     * Perfect Game integration
     */
    async sendToPerfectGame(analysisData) {
        if (!this.perfectGameIntegration) return;

        const pgData = {
            playerId: analysisData.playerId,
            eventId: analysisData.metadata.tournamentId,
            metrics: {
                overallScore: analysisData.scores.overall,
                biomechanics: analysisData.scores.biomechanical,
                composure: analysisData.scores.behavioral,
                championshipPotential: analysisData.scores.championshipReadiness
            },
            videoUrl: analysisData.videoUrl,
            insights: analysisData.insights.slice(0, 3)
        };

        try {
            await fetch('https://api.perfectgame.org/player-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.perfectGameIntegration.apiKey}`
                },
                body: JSON.stringify(pgData)
            });
        } catch (error) {
            console.error('Perfect Game sync failed:', error);
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current location for session metadata
     */
    async getCurrentLocation() {
        if (!navigator.geolocation) {
            return null;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => resolve(null),
                { timeout: 5000 }
            );
        });
    }

    /**
     * Get optimal video codec
     */
    getOptimalCodec() {
        const codecs = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];

        for (const codec of codecs) {
            if (MediaRecorder.isTypeSupported(codec)) {
                return codec;
            }
        }

        return 'video/webm';
    }

    /**
     * Export session data for coaches
     */
    async exportSessionData(sessionId, format = 'pdf') {
        const session = await this.storage.getSession(sessionId);

        if (!session || !session.results) {
            throw new Error('Session not found or not completed');
        }

        const exporter = new DataExporter(session);

        switch (format) {
            case 'pdf':
                return await exporter.toPDF({
                    includeFrames: true,
                    includeInsights: true,
                    branding: 'blaze'
                });

            case 'csv':
                return exporter.toCSV();

            case 'json':
                return exporter.toJSON();

            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Batch analysis for team sessions
     */
    async batchAnalyze(videoUrls, teamId) {
        const batchId = this.generateSessionId();

        const promises = videoUrls.map(url =>
            this.triggerAnalysis({
                videoUrl: url,
                teamId: teamId,
                batchId: batchId
            })
        );

        const results = await Promise.allSettled(promises);

        return {
            batchId,
            total: videoUrls.length,
            successful: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length,
            sessions: results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value.sessionId)
        };
    }
}

/**
 * Camera Manager for optimized capture
 */
class CameraManager {
    constructor(capabilities) {
        this.capabilities = capabilities;
        this.stream = null;
    }

    async startCapture(config) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: config,
                audio: false
            });

            // Apply stabilization if available
            if (this.capabilities.camera.hasStabilization) {
                const track = this.stream.getVideoTracks()[0];
                await track.applyConstraints({
                    advanced: [{ opticalImageStabilization: true }]
                });
            }

            return this.stream;
        } catch (error) {
            throw new Error(`Camera access failed: ${error.message}`);
        }
    }

    stopCapture() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

/**
 * Offline Storage Manager
 */
class OfflineStorage {
    constructor() {
        this.dbName = 'BlazeVisionDB';
        this.version = 1;
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('sessions')) {
                    db.createObjectStore('sessions', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('uploadQueue')) {
                    db.createObjectStore('uploadQueue', { keyPath: 'id' });
                }
            };
        });
    }

    async saveSession(session) {
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        return store.put(session);
    }

    async getSession(sessionId) {
        const transaction = this.db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        return new Promise((resolve, reject) => {
            const request = store.get(sessionId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateSession(sessionId, updates) {
        const session = await this.getSession(sessionId);
        if (session) {
            Object.assign(session, updates);
            return this.saveSession(session);
        }
    }

    async queueForUpload(videoBlob, session) {
        const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
        const store = transaction.objectStore('uploadQueue');

        return store.put({
            id: session.id,
            videoBlob: videoBlob,
            session: session,
            timestamp: new Date().toISOString()
        });
    }
}

// Export for various platforms
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeVisionSDK;
}

if (typeof window !== 'undefined') {
    window.BlazeVisionSDK = BlazeVisionSDK;
}