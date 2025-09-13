/**
 * Championship AR Coaching Overlay System
 * Real-time augmented reality coaching interface
 * Combines biomechanical analysis with micro-expression feedback in immersive AR environment
 */

class ChampionshipARCoachingOverlay {
    constructor(options = {}) {
        this.initialized = false;
        this.isActive = false;
        this.arSession = null;
        this.neuralCoachingSystem = null;
        this.overlayCanvas = null;
        this.overlayContext = null;

        // AR Overlay configuration
        this.overlayConfig = {
            opacity: options.opacity || 0.8,
            scale: options.scale || 1.0,
            position: options.position || 'center',
            coaching_intensity: options.coaching_intensity || 'balanced', // 'minimal', 'balanced', 'intensive'
            feedback_frequency: options.feedback_frequency || 'real_time' // 'real_time', 'key_moments', 'post_rep'
        };

        // Visual overlay elements
        this.overlayElements = {
            biomechanical_lines: true,
            force_vectors: true,
            character_indicators: true,
            coaching_text: true,
            performance_meters: true,
            trend_indicators: true
        };

        // Coaching overlay themes
        this.coachingThemes = {
            championship: {
                colors: {
                    primary: '#BF5700', // Burnt Orange
                    secondary: '#00B2A9', // Teal
                    accent: '#FFB500', // Gold
                    success: '#10B981', // Green
                    warning: '#F59E0B', // Amber
                    danger: '#EF4444', // Red
                    text: '#FFFFFF',
                    background: 'rgba(0, 0, 0, 0.7)'
                },
                typography: {
                    coaching_font: 'Inter, sans-serif',
                    metric_font: 'JetBrains Mono, monospace',
                    size_primary: 16,
                    size_secondary: 14,
                    size_metrics: 12
                },
                animations: {
                    fade_in: 300,
                    fade_out: 200,
                    pulse_success: 1000,
                    flash_correction: 500
                }
            },
            elite_performance: {
                colors: {
                    primary: '#1E40AF',
                    secondary: '#7C3AED',
                    accent: '#F97316',
                    success: '#059669',
                    warning: '#D97706',
                    danger: '#DC2626',
                    text: '#F8FAFC',
                    background: 'rgba(15, 23, 42, 0.8)'
                },
                typography: {
                    coaching_font: 'Space Grotesk, sans-serif',
                    metric_font: 'Fira Code, monospace',
                    size_primary: 15,
                    size_secondary: 13,
                    size_metrics: 11
                }
            }
        };

        // Real-time feedback queue
        this.feedbackQueue = [];
        this.maxFeedbackItems = 5;
        this.feedbackDisplayDuration = 4000; // 4 seconds

        // Performance tracking for AR display
        this.realtimeMetrics = {
            biomechanical_score: 0,
            character_score: 0,
            integration_score: 0,
            trend_direction: 'stable',
            coaching_priority: 'balanced'
        };

        // AR positioning and tracking
        this.arAnchors = {
            athlete_body: null,
            performance_zone: null,
            coaching_panel: null
        };
    }

    async initialize(videoElement, canvasElement) {
        try {
            console.log('🥽 Initializing Championship AR Coaching Overlay...');

            this.videoElement = videoElement;
            this.overlayCanvas = canvasElement;
            this.overlayContext = this.overlayCanvas.getContext('2d');

            // Set canvas dimensions to match video
            this.updateCanvasDimensions();

            // Initialize neural coaching system integration
            this.neuralCoachingSystem = new ChampionshipNeuralCoaching({
                coachingStyle: 'deep_south_championship',
                sport: 'baseball' // Default, can be changed
            });

            await this.neuralCoachingSystem.initialize();

            // Setup AR overlay rendering
            this.setupOverlayRendering();

            // Initialize real-time analysis loop
            this.startAnalysisLoop();

            this.initialized = true;
            this.isActive = true;

            console.log('✅ Championship AR Coaching Overlay initialized');

            return {
                status: 'initialized',
                ar_features: [
                    'real_time_biomechanical_overlay',
                    'character_feedback_display',
                    'coaching_text_integration',
                    'performance_trend_visualization',
                    'neural_coaching_integration'
                ],
                overlay_theme: 'championship'
            };

        } catch (error) {
            console.error('❌ AR Coaching Overlay initialization failed:', error);
            throw error;
        }
    }

    setupOverlayRendering() {
        // Set up high-performance canvas rendering
        this.overlayContext.imageSmoothingEnabled = true;
        this.overlayContext.imageSmoothingQuality = 'high';

        // Apply championship theme
        this.currentTheme = this.coachingThemes.championship;

        // Setup font loading
        this.loadOverlayFonts();
    }

    async loadOverlayFonts() {
        // Load custom fonts for AR overlay
        const fontPromises = [
            this.loadFont('Inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700'),
            this.loadFont('JetBrains Mono', 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600')
        ];

        try {
            await Promise.all(fontPromises);
            console.log('✅ AR overlay fonts loaded');
        } catch (error) {
            console.warn('⚠️ Some AR overlay fonts failed to load, using fallbacks');
        }
    }

    async loadFont(name, url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.href = url;
            link.rel = 'stylesheet';
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    startAnalysisLoop() {
        // Real-time analysis and overlay update loop
        const analysisInterval = 1000 / 30; // 30 FPS analysis

        this.analysisTimer = setInterval(async () => {
            if (this.isActive && this.videoElement && !this.videoElement.paused) {
                await this.performRealtimeAnalysis();
                this.renderAROverlay();
            }
        }, analysisInterval);
    }

    async performRealtimeAnalysis() {
        try {
            const timestamp = Date.now();

            // Get neural coaching analysis
            const analysis = await this.neuralCoachingSystem.analyzePerformanceFrame(
                this.videoElement,
                timestamp
            );

            if (analysis.status === 'analysis_complete') {
                this.updateRealtimeMetrics(analysis);
                this.processCoachingFeedback(analysis.coaching_feedback);
                this.updateARAnchors(analysis);
            }

        } catch (error) {
            console.error('Real-time analysis error:', error);
        }
    }

    updateRealtimeMetrics(analysis) {
        // Update metrics for AR display
        const bioData = analysis.biomechanical;
        const charData = analysis.character;
        const integrated = analysis.integrated_analysis;

        if (bioData?.biomechanical_scores) {
            const bioScores = Object.values(bioData.biomechanical_scores).map(s => s.score);
            this.realtimeMetrics.biomechanical_score = bioScores.reduce((sum, s) => sum + s, 0) / bioScores.length;
        }

        if (charData?.character_assessment?.character_scores) {
            const charScores = Object.values(charData.character_assessment.character_scores);
            this.realtimeMetrics.character_score = charScores.reduce((sum, s) => sum + s, 0) / charScores.length;
        }

        if (integrated?.mind_body_alignment?.alignment_score) {
            this.realtimeMetrics.integration_score = integrated.mind_body_alignment.alignment_score;
        }

        if (analysis.trend_analysis?.championship_trajectory?.trajectory_direction) {
            this.realtimeMetrics.trend_direction = analysis.trend_analysis.championship_trajectory.trajectory_direction;
        }

        // Smooth metric updates to prevent jarring changes
        this.smoothMetricUpdates();
    }

    smoothMetricUpdates() {
        // Apply exponential moving average for smooth AR display
        const smoothingFactor = 0.3;

        Object.keys(this.realtimeMetrics).forEach(key => {
            if (typeof this.realtimeMetrics[key] === 'number') {
                const newValue = this.realtimeMetrics[key];
                const currentValue = this.previousMetrics?.[key] || newValue;
                this.realtimeMetrics[key] = currentValue + smoothingFactor * (newValue - currentValue);
            }
        });

        this.previousMetrics = { ...this.realtimeMetrics };
    }

    processCoachingFeedback(coachingFeedback) {
        if (!coachingFeedback) return;

        // Process different types of coaching feedback for AR display
        const allFeedback = [
            ...coachingFeedback.immediate_feedback || [],
            ...coachingFeedback.character_reinforcement || [],
            ...coachingFeedback.championship_insights || []
        ];

        allFeedback.forEach(feedback => {
            this.addFeedbackToQueue({
                message: feedback.message,
                type: feedback.type,
                urgency: feedback.urgency,
                timestamp: Date.now(),
                displayDuration: this.getFeedbackDisplayDuration(feedback.urgency)
            });
        });
    }

    addFeedbackToQueue(feedback) {
        // Add to feedback queue with priority handling
        this.feedbackQueue.push(feedback);

        // Sort by urgency (urgent feedback first)
        this.feedbackQueue.sort((a, b) => {
            const urgencyOrder = { urgent: 0, important: 1, medium: 2, low: 3, positive: 4 };
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        });

        // Limit queue size
        while (this.feedbackQueue.length > this.maxFeedbackItems) {
            this.feedbackQueue.pop();
        }

        // Auto-remove expired feedback
        this.cleanupExpiredFeedback();
    }

    cleanupExpiredFeedback() {
        const now = Date.now();
        this.feedbackQueue = this.feedbackQueue.filter(feedback =>
            (now - feedback.timestamp) < feedback.displayDuration
        );
    }

    getFeedbackDisplayDuration(urgency) {
        const durations = {
            urgent: 6000,     // 6 seconds
            important: 5000,  // 5 seconds
            medium: 4000,     // 4 seconds
            low: 3000,        // 3 seconds
            positive: 4000,   // 4 seconds
            celebration: 3000 // 3 seconds
        };
        return durations[urgency] || this.feedbackDisplayDuration;
    }

    updateARAnchors(analysis) {
        // Update AR anchor positions based on analysis
        // In production, this would use actual pose detection for precise positioning

        this.arAnchors.athlete_body = {
            center: { x: this.overlayCanvas.width * 0.5, y: this.overlayCanvas.height * 0.6 },
            bounds: {
                width: this.overlayCanvas.width * 0.3,
                height: this.overlayCanvas.height * 0.7
            }
        };

        this.arAnchors.performance_zone = {
            top_right: { x: this.overlayCanvas.width * 0.85, y: this.overlayCanvas.height * 0.1 },
            size: { width: 200, height: 300 }
        };

        this.arAnchors.coaching_panel = {
            bottom_left: { x: this.overlayCanvas.width * 0.05, y: this.overlayCanvas.height * 0.7 },
            size: { width: 350, height: 200 }
        };
    }

    renderAROverlay() {
        if (!this.overlayContext || !this.isActive) return;

        // Clear canvas
        this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        // Render different overlay components
        this.renderBiomechanicalOverlay();
        this.renderCharacterIndicators();
        this.renderPerformanceMeters();
        this.renderCoachingFeedback();
        this.renderTrendIndicators();
    }

    renderBiomechanicalOverlay() {
        if (!this.overlayElements.biomechanical_lines) return;

        const ctx = this.overlayContext;
        const theme = this.currentTheme;
        const anchor = this.arAnchors.athlete_body;

        if (!anchor) return;

        // Draw biomechanical analysis lines and points
        ctx.strokeStyle = theme.colors.primary;
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.overlayConfig.opacity;

        // Simulated pose keypoints for demonstration
        const keypoints = this.generateSimulatedKeypoints(anchor);

        // Draw skeleton structure
        this.drawBiomechanicalSkeleton(ctx, keypoints);

        // Draw force vectors if enabled
        if (this.overlayElements.force_vectors) {
            this.drawForceVectors(ctx, keypoints);
        }

        // Draw joint angle indicators
        this.drawJointAngleIndicators(ctx, keypoints);

        ctx.globalAlpha = 1.0;
    }

    generateSimulatedKeypoints(anchor) {
        // Generate realistic keypoint positions for demo
        const center = anchor.center;
        const bounds = anchor.bounds;

        return {
            head: { x: center.x, y: center.y - bounds.height * 0.35 },
            neck: { x: center.x, y: center.y - bounds.height * 0.25 },
            left_shoulder: { x: center.x - bounds.width * 0.15, y: center.y - bounds.height * 0.2 },
            right_shoulder: { x: center.x + bounds.width * 0.15, y: center.y - bounds.height * 0.2 },
            left_elbow: { x: center.x - bounds.width * 0.25, y: center.y - bounds.height * 0.05 },
            right_elbow: { x: center.x + bounds.width * 0.25, y: center.y - bounds.height * 0.05 },
            left_wrist: { x: center.x - bounds.width * 0.3, y: center.y + bounds.height * 0.1 },
            right_wrist: { x: center.x + bounds.width * 0.3, y: center.y + bounds.height * 0.1 },
            hip: { x: center.x, y: center.y + bounds.height * 0.05 },
            left_knee: { x: center.x - bounds.width * 0.1, y: center.y + bounds.height * 0.25 },
            right_knee: { x: center.x + bounds.width * 0.1, y: center.y + bounds.height * 0.25 },
            left_ankle: { x: center.x - bounds.width * 0.12, y: center.y + bounds.height * 0.45 },
            right_ankle: { x: center.x + bounds.width * 0.12, y: center.y + bounds.height * 0.45 }
        };
    }

    drawBiomechanicalSkeleton(ctx, keypoints) {
        const connections = [
            ['head', 'neck'],
            ['neck', 'left_shoulder'], ['neck', 'right_shoulder'],
            ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
            ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
            ['left_shoulder', 'hip'], ['right_shoulder', 'hip'],
            ['hip', 'left_knee'], ['hip', 'right_knee'],
            ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle']
        ];

        ctx.beginPath();
        connections.forEach(([start, end]) => {
            if (keypoints[start] && keypoints[end]) {
                ctx.moveTo(keypoints[start].x, keypoints[start].y);
                ctx.lineTo(keypoints[end].x, keypoints[end].y);
            }
        });
        ctx.stroke();

        // Draw keypoint markers
        ctx.fillStyle = this.currentTheme.colors.accent;
        Object.values(keypoints).forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawForceVectors(ctx, keypoints) {
        // Draw force vectors based on biomechanical analysis
        ctx.strokeStyle = this.currentTheme.colors.secondary;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);

        // Example: Ground reaction force vector
        if (keypoints.hip) {
            const forceLength = 60;
            const forceAngle = Math.PI / 4; // 45 degrees

            ctx.beginPath();
            ctx.moveTo(keypoints.hip.x, keypoints.hip.y);
            ctx.lineTo(
                keypoints.hip.x + Math.cos(forceAngle) * forceLength,
                keypoints.hip.y - Math.sin(forceAngle) * forceLength
            );
            ctx.stroke();

            // Arrow head
            this.drawArrowHead(ctx,
                keypoints.hip.x + Math.cos(forceAngle) * forceLength,
                keypoints.hip.y - Math.sin(forceAngle) * forceLength,
                forceAngle
            );
        }

        ctx.setLineDash([]);
    }

    drawArrowHead(ctx, x, y, angle) {
        const headLength = 10;
        const headAngle = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x - headLength * Math.cos(angle - headAngle),
            y + headLength * Math.sin(angle - headAngle)
        );
        ctx.moveTo(x, y);
        ctx.lineTo(
            x - headLength * Math.cos(angle + headAngle),
            y + headLength * Math.sin(angle + headAngle)
        );
        ctx.stroke();
    }

    drawJointAngleIndicators(ctx, keypoints) {
        // Draw joint angle measurements
        ctx.strokeStyle = this.currentTheme.colors.warning;
        ctx.lineWidth = 1;
        ctx.font = `${this.currentTheme.typography.size_metrics}px ${this.currentTheme.typography.metric_font}`;
        ctx.fillStyle = this.currentTheme.colors.text;

        // Example: Knee angle
        if (keypoints.left_knee && keypoints.hip && keypoints.left_ankle) {
            const angle = this.calculateAngle(keypoints.hip, keypoints.left_knee, keypoints.left_ankle);
            const radius = 25;

            // Draw angle arc
            ctx.beginPath();
            ctx.arc(keypoints.left_knee.x, keypoints.left_knee.y, radius, 0, Math.PI / 3);
            ctx.stroke();

            // Draw angle text
            ctx.fillText(
                `${Math.round(angle)}°`,
                keypoints.left_knee.x + 30,
                keypoints.left_knee.y - 10
            );
        }
    }

    calculateAngle(p1, vertex, p2) {
        // Calculate angle between three points
        const dx1 = p1.x - vertex.x;
        const dy1 = p1.y - vertex.y;
        const dx2 = p2.x - vertex.x;
        const dy2 = p2.y - vertex.y;

        const angle1 = Math.atan2(dy1, dx1);
        const angle2 = Math.atan2(dy2, dx2);

        return Math.abs(angle2 - angle1) * (180 / Math.PI);
    }

    renderCharacterIndicators() {
        if (!this.overlayElements.character_indicators) return;

        const ctx = this.overlayContext;
        const anchor = this.arAnchors.athlete_body;

        if (!anchor || !anchor.center) return;

        // Character assessment indicators around athlete
        const indicators = [
            { trait: 'Confidence', score: this.realtimeMetrics.character_score * 100, color: this.currentTheme.colors.success },
            { trait: 'Focus', score: (this.realtimeMetrics.character_score + 0.1) * 100, color: this.currentTheme.colors.primary },
            { trait: 'Grit', score: (this.realtimeMetrics.character_score + 0.05) * 100, color: this.currentTheme.colors.accent }
        ];

        indicators.forEach((indicator, index) => {
            const angle = (index * (Math.PI * 2)) / indicators.length - Math.PI / 2;
            const radius = 120;
            const x = anchor.center.x + Math.cos(angle) * radius;
            const y = anchor.center.y + Math.sin(angle) * radius;

            this.drawCharacterIndicator(ctx, x, y, indicator);
        });
    }

    drawCharacterIndicator(ctx, x, y, indicator) {
        const radius = 15;
        const score = Math.max(0, Math.min(100, indicator.score));

        // Background circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.currentTheme.colors.background;
        ctx.fill();

        // Score arc
        ctx.beginPath();
        ctx.arc(x, y, radius - 2, -Math.PI / 2, -Math.PI / 2 + (score / 100) * Math.PI * 2);
        ctx.strokeStyle = indicator.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Label
        ctx.font = `${this.currentTheme.typography.size_secondary}px ${this.currentTheme.typography.coaching_font}`;
        ctx.fillStyle = this.currentTheme.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(indicator.trait, x, y - radius - 10);
        ctx.fillText(`${Math.round(score)}%`, x, y + 5);
    }

    renderPerformanceMeters() {
        if (!this.overlayElements.performance_meters) return;

        const ctx = this.overlayContext;
        const anchor = this.arAnchors.performance_zone;

        if (!anchor) return;

        const x = anchor.top_right.x - anchor.size.width;
        const y = anchor.top_right.y;

        // Performance dashboard
        this.drawPerformanceDashboard(ctx, x, y, anchor.size.width, anchor.size.height);
    }

    drawPerformanceDashboard(ctx, x, y, width, height) {
        // Dashboard background
        ctx.fillStyle = this.currentTheme.colors.background;
        ctx.fillRect(x, y, width, height);

        // Dashboard border
        ctx.strokeStyle = this.currentTheme.colors.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = `bold ${this.currentTheme.typography.size_primary}px ${this.currentTheme.typography.coaching_font}`;
        ctx.fillStyle = this.currentTheme.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText('PERFORMANCE', x + width / 2, y + 25);

        // Performance bars
        const metrics = [
            { label: 'Biomechanics', value: this.realtimeMetrics.biomechanical_score, color: this.currentTheme.colors.primary },
            { label: 'Character', value: this.realtimeMetrics.character_score, color: this.currentTheme.colors.secondary },
            { label: 'Integration', value: this.realtimeMetrics.integration_score, color: this.currentTheme.colors.accent }
        ];

        metrics.forEach((metric, index) => {
            const barY = y + 50 + index * 40;
            this.drawPerformanceBar(ctx, x + 20, barY, width - 40, 20, metric);
        });

        // Trend indicator
        this.drawTrendIndicator(ctx, x + 20, y + height - 40, this.realtimeMetrics.trend_direction);
    }

    drawPerformanceBar(ctx, x, y, width, height, metric) {
        const value = Math.max(0, Math.min(1, metric.value));

        // Background bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, width, height);

        // Value bar
        ctx.fillStyle = metric.color;
        ctx.fillRect(x, y, width * value, height);

        // Label and value
        ctx.font = `${this.currentTheme.typography.size_secondary}px ${this.currentTheme.typography.coaching_font}`;
        ctx.fillStyle = this.currentTheme.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText(metric.label, x, y - 5);
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(value * 100)}%`, x + width, y - 5);
    }

    drawTrendIndicator(ctx, x, y, trend) {
        const colors = {
            improving: this.currentTheme.colors.success,
            stable: this.currentTheme.colors.accent,
            declining: this.currentTheme.colors.danger
        };

        ctx.fillStyle = colors[trend] || colors.stable;
        ctx.font = `${this.currentTheme.typography.size_secondary}px ${this.currentTheme.typography.coaching_font}`;
        ctx.textAlign = 'left';
        ctx.fillText(`Trend: ${trend.toUpperCase()}`, x, y);
    }

    renderCoachingFeedback() {
        if (!this.overlayElements.coaching_text || this.feedbackQueue.length === 0) return;

        const ctx = this.overlayContext;
        const anchor = this.arAnchors.coaching_panel;

        if (!anchor) return;

        const x = anchor.bottom_left.x;
        const y = anchor.bottom_left.y;
        const width = anchor.size.width;
        const height = anchor.size.height;

        // Coaching panel background
        ctx.fillStyle = this.currentTheme.colors.background;
        ctx.fillRect(x, y, width, height);

        // Panel border
        ctx.strokeStyle = this.currentTheme.colors.secondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = `bold ${this.currentTheme.typography.size_primary}px ${this.currentTheme.typography.coaching_font}`;
        ctx.fillStyle = this.currentTheme.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText('COACHING FEEDBACK', x + 15, y + 25);

        // Render active feedback items
        const visibleFeedback = this.feedbackQueue.slice(0, 4); // Show top 4 items
        visibleFeedback.forEach((feedback, index) => {
            const feedbackY = y + 50 + index * 35;
            this.drawCoachingFeedback(ctx, x + 15, feedbackY, width - 30, feedback);
        });
    }

    drawCoachingFeedback(ctx, x, y, maxWidth, feedback) {
        const urgencyColors = {
            urgent: this.currentTheme.colors.danger,
            important: this.currentTheme.colors.warning,
            medium: this.currentTheme.colors.primary,
            low: this.currentTheme.colors.text,
            positive: this.currentTheme.colors.success,
            celebration: this.currentTheme.colors.accent
        };

        const age = Date.now() - feedback.timestamp;
        const alpha = Math.max(0.3, 1 - (age / feedback.displayDuration));

        ctx.globalAlpha = alpha;

        // Urgency indicator
        ctx.fillStyle = urgencyColors[feedback.urgency] || this.currentTheme.colors.text;
        ctx.fillRect(x - 10, y - 15, 4, 20);

        // Feedback text
        ctx.font = `${this.currentTheme.typography.size_secondary}px ${this.currentTheme.typography.coaching_font}`;
        ctx.fillStyle = this.currentTheme.colors.text;
        ctx.textAlign = 'left';

        // Wrap text if too long
        const wrappedText = this.wrapText(ctx, feedback.message, maxWidth);
        wrappedText.forEach((line, lineIndex) => {
            ctx.fillText(line, x, y + lineIndex * 16);
        });

        ctx.globalAlpha = 1.0;
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    renderTrendIndicators() {
        if (!this.overlayElements.trend_indicators) return;

        const ctx = this.overlayContext;

        // Simple trend arrow in top-left corner
        const x = 20;
        const y = 30;

        this.drawTrendArrow(ctx, x, y, this.realtimeMetrics.trend_direction);
    }

    drawTrendArrow(ctx, x, y, trend) {
        const colors = {
            improving: this.currentTheme.colors.success,
            stable: this.currentTheme.colors.accent,
            declining: this.currentTheme.colors.danger
        };

        const arrows = {
            improving: '↗',
            stable: '→',
            declining: '↘'
        };

        ctx.font = `bold 24px ${this.currentTheme.typography.coaching_font}`;
        ctx.fillStyle = colors[trend] || colors.stable;
        ctx.textAlign = 'left';
        ctx.fillText(arrows[trend] || '→', x, y);

        ctx.font = `${this.currentTheme.typography.size_secondary}px ${this.currentTheme.typography.coaching_font}`;
        ctx.fillText(trend.toUpperCase(), x + 30, y);
    }

    updateCanvasDimensions() {
        if (this.videoElement && this.overlayCanvas) {
            this.overlayCanvas.width = this.videoElement.videoWidth || this.videoElement.clientWidth;
            this.overlayCanvas.height = this.videoElement.videoHeight || this.videoElement.clientHeight;
        }
    }

    // Public API methods
    toggleOverlay(enabled) {
        this.isActive = enabled;
        if (!enabled) {
            this.overlayContext?.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
        return { overlay_active: this.isActive };
    }

    updateOverlayConfiguration(config) {
        Object.assign(this.overlayConfig, config);
        return { configuration_updated: true };
    }

    updateOverlayElements(elements) {
        Object.assign(this.overlayElements, elements);
        return { elements_updated: true };
    }

    switchTheme(themeName) {
        if (this.coachingThemes[themeName]) {
            this.currentTheme = this.coachingThemes[themeName];
            return { theme_switched: themeName };
        }
        throw new Error(`Unknown theme: ${themeName}`);
    }

    getOverlayStatus() {
        return {
            initialized: this.initialized,
            active: this.isActive,
            theme: Object.keys(this.coachingThemes).find(key =>
                this.coachingThemes[key] === this.currentTheme
            ),
            feedback_queue_size: this.feedbackQueue.length,
            realtime_metrics: this.realtimeMetrics,
            overlay_elements: this.overlayElements
        };
    }

    destroy() {
        this.isActive = false;
        if (this.analysisTimer) {
            clearInterval(this.analysisTimer);
        }
        if (this.overlayContext) {
            this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
        console.log('🥽 AR Coaching Overlay destroyed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChampionshipARCoachingOverlay;
}

// Global scope for browser usage
if (typeof window !== 'undefined') {
    window.ChampionshipARCoachingOverlay = ChampionshipARCoachingOverlay;
}

console.log('🥽 Championship AR Coaching Overlay loaded - Immersive real-time performance coaching');