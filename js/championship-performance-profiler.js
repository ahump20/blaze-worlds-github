/**
 * Blaze Worlds Championship Performance Profiler
 *
 * Like a championship coaching staff analyzing game film, this profiler
 * monitors every aspect of performance to ensure 60+ FPS gameplay
 * worthy of Texas football excellence.
 */

class ChampionshipPerformanceProfiler {
    constructor() {
        this.metrics = {
            fps: [],
            frameTime: [],
            memoryUsage: [],
            drawCalls: [],
            triangles: [],
            shaderCompileTime: [],
            particleCount: [],
            voxelChunks: [],
            audioNodes: []
        };

        this.thresholds = {
            targetFPS: 60,
            warningFPS: 45,
            criticalFPS: 30,
            maxFrameTime: 16.67, // 60 FPS in ms
            maxMemoryMB: 512,
            maxDrawCalls: 2000
        };

        this.isRecording = false;
        this.sessionStartTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;

        // Championship-grade monitoring intervals
        this.monitoringIntervals = {
            fps: 100,        // Every 100ms like a play clock
            memory: 1000,    // Every second like a timeout
            detailed: 5000   // Every 5 seconds like a quarter break
        };

        this.performanceLog = [];
        this.alertCallbacks = [];

        this.initializeMonitoring();
    }

    /**
     * Initialize championship-level performance monitoring
     * Like setting up the best coaching analytics system in the SEC
     */
    initializeMonitoring() {
        // FPS monitoring with championship precision
        this.fpsMonitor = {
            lastTime: performance.now(),
            frameCount: 0,
            currentFPS: 0
        };

        // Memory monitoring like tracking player stamina
        this.memoryMonitor = {
            baseline: this.getMemoryUsage(),
            peak: 0,
            current: 0
        };

        // GPU monitoring for graphics performance
        this.gpuMonitor = {
            drawCalls: 0,
            triangles: 0,
            textureMemory: 0
        };

        console.log('🏆 Championship Performance Profiler initialized - Ready for game time!');
    }

    /**
     * Start recording performance metrics
     * Like blowing the whistle to start the game
     */
    startProfiling() {
        this.isRecording = true;
        this.sessionStartTime = performance.now();
        this.frameCount = 0;
        this.performanceLog = [];

        // Start monitoring intervals
        this.startMonitoringIntervals();

        console.log('📊 Championship profiling started - Every play counts!');
    }

    /**
     * Stop recording and generate championship report
     * Like the final whistle and post-game analysis
     */
    stopProfiling() {
        this.isRecording = false;
        this.stopMonitoringIntervals();

        const report = this.generateChampionshipReport();
        console.log('🏆 Championship performance report generated!');
        return report;
    }

    /**
     * Record frame performance - called every frame like tracking each play
     */
    recordFrame(renderer, scene) {
        if (!this.isRecording) return;

        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Record frame metrics
        this.metrics.frameTime.push(frameTime);
        this.frameCount++;

        // Update FPS calculation
        this.updateFPSMetrics(currentTime);

        // Record GPU metrics if renderer is provided
        if (renderer) {
            this.recordGPUMetrics(renderer);
        }

        // Record scene complexity if scene is provided
        if (scene) {
            this.recordSceneMetrics(scene);
        }

        // Check for performance alerts
        this.checkPerformanceThresholds(frameTime);

        // Trim metrics arrays to prevent memory bloat
        this.trimMetricsArrays();
    }

    /**
     * Update FPS metrics with championship precision
     */
    updateFPSMetrics(currentTime) {
        this.fpsMonitor.frameCount++;

        const deltaTime = currentTime - this.fpsMonitor.lastTime;

        if (deltaTime >= this.monitoringIntervals.fps) {
            const fps = Math.round((this.fpsMonitor.frameCount * 1000) / deltaTime);
            this.metrics.fps.push(fps);
            this.fpsMonitor.currentFPS = fps;

            // Reset for next measurement
            this.fpsMonitor.frameCount = 0;
            this.fpsMonitor.lastTime = currentTime;
        }
    }

    /**
     * Record GPU performance metrics
     */
    recordGPUMetrics(renderer) {
        const info = renderer.info;

        this.metrics.drawCalls.push(info.render.calls);
        this.metrics.triangles.push(info.render.triangles);

        this.gpuMonitor.drawCalls = info.render.calls;
        this.gpuMonitor.triangles = info.render.triangles;
    }

    /**
     * Record scene complexity metrics
     */
    recordSceneMetrics(scene) {
        let objectCount = 0;
        let geometryCount = 0;
        let materialCount = 0;

        scene.traverse((object) => {
            objectCount++;
            if (object.geometry) geometryCount++;
            if (object.material) materialCount++;
        });

        // Store scene complexity
        this.sceneMetrics = {
            objects: objectCount,
            geometries: geometryCount,
            materials: materialCount
        };
    }

    /**
     * Check performance thresholds and trigger alerts
     * Like a coach calling timeout when things go wrong
     */
    checkPerformanceThresholds(frameTime) {
        const fps = this.fpsMonitor.currentFPS;

        // Critical FPS alert
        if (fps > 0 && fps < this.thresholds.criticalFPS) {
            this.triggerAlert('critical', 'FPS', fps, this.thresholds.criticalFPS);
        }
        // Warning FPS alert
        else if (fps > 0 && fps < this.thresholds.warningFPS) {
            this.triggerAlert('warning', 'FPS', fps, this.thresholds.warningFPS);
        }

        // Frame time alert
        if (frameTime > this.thresholds.maxFrameTime * 2) {
            this.triggerAlert('warning', 'Frame Time', frameTime, this.thresholds.maxFrameTime);
        }

        // Draw call alert
        if (this.gpuMonitor.drawCalls > this.thresholds.maxDrawCalls) {
            this.triggerAlert('warning', 'Draw Calls', this.gpuMonitor.drawCalls, this.thresholds.maxDrawCalls);
        }
    }

    /**
     * Trigger performance alert
     */
    triggerAlert(level, metric, current, threshold) {
        const alert = {
            timestamp: performance.now(),
            level,
            metric,
            current,
            threshold,
            message: `${metric} ${level}: ${current} (threshold: ${threshold})`
        };

        // Log to console with appropriate styling
        const style = level === 'critical' ? 'color: #ff0000; font-weight: bold;' : 'color: #ff8800;';
        console.warn(`%c⚠️ Performance Alert: ${alert.message}`, style);

        // Call registered alert callbacks
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error in alert callback:', error);
            }
        });
    }

    /**
     * Register alert callback for custom handling
     */
    onAlert(callback) {
        this.alertCallbacks.push(callback);
    }

    /**
     * Get current memory usage
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    /**
     * Start monitoring intervals
     */
    startMonitoringIntervals() {
        // Memory monitoring
        this.memoryInterval = setInterval(() => {
            if (this.isRecording) {
                const memory = this.getMemoryUsage();
                this.metrics.memoryUsage.push(memory.used);
                this.memoryMonitor.current = memory.used;
                this.memoryMonitor.peak = Math.max(this.memoryMonitor.peak, memory.used);
            }
        }, this.monitoringIntervals.memory);

        // Detailed system monitoring
        this.detailedInterval = setInterval(() => {
            if (this.isRecording) {
                this.recordDetailedMetrics();
            }
        }, this.monitoringIntervals.detailed);
    }

    /**
     * Stop monitoring intervals
     */
    stopMonitoringIntervals() {
        clearInterval(this.memoryInterval);
        clearInterval(this.detailedInterval);
    }

    /**
     * Record detailed system metrics
     */
    recordDetailedMetrics() {
        const timestamp = performance.now();
        const entry = {
            timestamp,
            fps: this.fpsMonitor.currentFPS,
            memory: this.memoryMonitor.current,
            drawCalls: this.gpuMonitor.drawCalls,
            triangles: this.gpuMonitor.triangles,
            sceneMetrics: { ...this.sceneMetrics }
        };

        this.performanceLog.push(entry);

        // Log detailed metrics every 5 seconds
        console.log('📊 Performance Snapshot:', entry);
    }

    /**
     * Trim metrics arrays to prevent memory bloat
     */
    trimMetricsArrays() {
        const maxEntries = 1000; // Keep last 1000 entries

        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > maxEntries) {
                this.metrics[key] = this.metrics[key].slice(-maxEntries);
            }
        });
    }

    /**
     * Generate comprehensive championship report
     * Like a post-game statistical analysis
     */
    generateChampionshipReport() {
        const sessionDuration = (performance.now() - this.sessionStartTime) / 1000;

        const report = {
            sessionInfo: {
                duration: sessionDuration,
                totalFrames: this.frameCount,
                averageFPS: this.calculateAverage(this.metrics.fps)
            },
            performance: {
                fps: this.analyzeFPSMetrics(),
                memory: this.analyzeMemoryMetrics(),
                gpu: this.analyzeGPUMetrics(),
                frameTime: this.analyzeFrameTimeMetrics()
            },
            recommendations: this.generateOptimizationRecommendations(),
            grade: this.calculatePerformanceGrade()
        };

        return report;
    }

    /**
     * Analyze FPS metrics
     */
    analyzeFPSMetrics() {
        const fps = this.metrics.fps;
        if (fps.length === 0) return null;

        return {
            average: this.calculateAverage(fps),
            min: Math.min(...fps),
            max: Math.max(...fps),
            percentile95: this.calculatePercentile(fps, 95),
            percentile99: this.calculatePercentile(fps, 99),
            framesAboveTarget: fps.filter(f => f >= this.thresholds.targetFPS).length,
            totalFramesMeasured: fps.length
        };
    }

    /**
     * Analyze memory metrics
     */
    analyzeMemoryMetrics() {
        const memory = this.metrics.memoryUsage;
        if (memory.length === 0) return null;

        return {
            baseline: this.memoryMonitor.baseline.used,
            average: this.calculateAverage(memory),
            peak: this.memoryMonitor.peak,
            current: this.memoryMonitor.current,
            growth: this.memoryMonitor.current - this.memoryMonitor.baseline.used
        };
    }

    /**
     * Analyze GPU metrics
     */
    analyzeGPUMetrics() {
        const drawCalls = this.metrics.drawCalls;
        const triangles = this.metrics.triangles;

        return {
            averageDrawCalls: this.calculateAverage(drawCalls),
            peakDrawCalls: drawCalls.length > 0 ? Math.max(...drawCalls) : 0,
            averageTriangles: this.calculateAverage(triangles),
            peakTriangles: triangles.length > 0 ? Math.max(...triangles) : 0
        };
    }

    /**
     * Analyze frame time metrics
     */
    analyzeFrameTimeMetrics() {
        const frameTime = this.metrics.frameTime;
        if (frameTime.length === 0) return null;

        return {
            average: this.calculateAverage(frameTime),
            min: Math.min(...frameTime),
            max: Math.max(...frameTime),
            percentile95: this.calculatePercentile(frameTime, 95),
            framesOverBudget: frameTime.filter(t => t > this.thresholds.maxFrameTime).length
        };
    }

    /**
     * Generate optimization recommendations
     * Like a championship coaching staff's game plan adjustments
     */
    generateOptimizationRecommendations() {
        const recommendations = [];

        const fps = this.analyzeFPSMetrics();
        const memory = this.analyzeMemoryMetrics();
        const gpu = this.analyzeGPUMetrics();

        // FPS recommendations
        if (fps && fps.average < this.thresholds.targetFPS) {
            recommendations.push({
                category: 'Performance',
                priority: 'High',
                issue: `Average FPS (${fps.average.toFixed(1)}) below target (${this.thresholds.targetFPS})`,
                recommendation: 'Implement LOD system, optimize particle count, or reduce texture quality'
            });
        }

        // Memory recommendations
        if (memory && memory.growth > 100) {
            recommendations.push({
                category: 'Memory',
                priority: 'Medium',
                issue: `Memory growth of ${memory.growth}MB detected`,
                recommendation: 'Implement object pooling and dispose of unused resources'
            });
        }

        // GPU recommendations
        if (gpu && gpu.averageDrawCalls > this.thresholds.maxDrawCalls) {
            recommendations.push({
                category: 'Rendering',
                priority: 'High',
                issue: `High draw call count (${gpu.averageDrawCalls.toFixed(0)})`,
                recommendation: 'Implement texture atlasing and mesh instancing'
            });
        }

        return recommendations;
    }

    /**
     * Calculate performance grade like a championship report card
     */
    calculatePerformanceGrade() {
        const fps = this.analyzeFPSMetrics();
        const memory = this.analyzeMemoryMetrics();

        let score = 100;

        // FPS scoring (50% of grade)
        if (fps) {
            const fpsRatio = fps.average / this.thresholds.targetFPS;
            if (fpsRatio < 0.5) score -= 25; // F performance
            else if (fpsRatio < 0.75) score -= 15; // D performance
            else if (fpsRatio < 0.9) score -= 10; // C performance
            else if (fpsRatio < 1.0) score -= 5; // B performance
            // A performance: no deduction
        }

        // Memory scoring (25% of grade)
        if (memory && memory.growth > 50) {
            score -= Math.min(15, memory.growth / 10);
        }

        // GPU scoring (25% of grade)
        const gpu = this.analyzeGPUMetrics();
        if (gpu && gpu.averageDrawCalls > this.thresholds.maxDrawCalls) {
            score -= Math.min(10, (gpu.averageDrawCalls - this.thresholds.maxDrawCalls) / 100);
        }

        // Determine letter grade
        let grade = 'F';
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';

        return {
            score: Math.max(0, Math.round(score)),
            letter: grade,
            evaluation: this.getGradeEvaluation(grade)
        };
    }

    /**
     * Get grade evaluation message
     */
    getGradeEvaluation(grade) {
        const evaluations = {
            'A': 'Championship Performance! Ready for the big game!',
            'B': 'Strong Performance - A few tweaks away from championship level',
            'C': 'Decent Performance - Needs optimization for championship play',
            'D': 'Below Par Performance - Requires significant optimization',
            'F': 'Poor Performance - Major optimization needed before game time'
        };
        return evaluations[grade] || 'Performance evaluation unavailable';
    }

    /**
     * Calculate average of array
     */
    calculateAverage(array) {
        if (array.length === 0) return 0;
        return array.reduce((sum, val) => sum + val, 0) / array.length;
    }

    /**
     * Calculate percentile of array
     */
    calculatePercentile(array, percentile) {
        if (array.length === 0) return 0;
        const sorted = [...array].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    /**
     * Export performance data for analysis
     */
    exportData() {
        return {
            metrics: { ...this.metrics },
            log: [...this.performanceLog],
            thresholds: { ...this.thresholds },
            sessionInfo: {
                startTime: this.sessionStartTime,
                duration: performance.now() - this.sessionStartTime,
                frameCount: this.frameCount
            }
        };
    }

    /**
     * Create performance dashboard HTML
     */
    createDashboard() {
        return `
            <div id="championship-performance-dashboard" style="
                position: fixed; top: 10px; right: 10px;
                background: rgba(0,0,0,0.8); color: #fff;
                padding: 15px; border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px; z-index: 10000;
                min-width: 250px;
            ">
                <h3 style="margin: 0 0 10px 0; color: #BF5700;">🏆 Championship Stats</h3>
                <div id="fps-display">FPS: <span style="color: #00ff00;">--</span></div>
                <div id="memory-display">Memory: <span style="color: #00ffff;">--</span> MB</div>
                <div id="drawcalls-display">Draw Calls: <span style="color: #ffff00;">--</span></div>
                <div id="triangles-display">Triangles: <span style="color: #ff8800;">--</span></div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444;">
                    <div id="grade-display">Grade: <span style="color: #fff; font-weight: bold;">--</span></div>
                </div>
            </div>
        `;
    }

    /**
     * Update dashboard display
     */
    updateDashboard() {
        const fpsEl = document.getElementById('fps-display');
        const memoryEl = document.getElementById('memory-display');
        const drawCallsEl = document.getElementById('drawcalls-display');
        const trianglesEl = document.getElementById('triangles-display');

        if (fpsEl) {
            const fps = this.fpsMonitor.currentFPS;
            const fpsColor = fps >= this.thresholds.targetFPS ? '#00ff00' :
                           fps >= this.thresholds.warningFPS ? '#ffff00' : '#ff0000';
            fpsEl.innerHTML = `FPS: <span style="color: ${fpsColor};">${fps}</span>`;
        }

        if (memoryEl) {
            const memory = this.memoryMonitor.current;
            const memoryColor = memory < this.thresholds.maxMemoryMB * 0.8 ? '#00ffff' : '#ffff00';
            memoryEl.innerHTML = `Memory: <span style="color: ${memoryColor};">${memory}</span> MB`;
        }

        if (drawCallsEl) {
            const drawCalls = this.gpuMonitor.drawCalls;
            const callsColor = drawCalls < this.thresholds.maxDrawCalls * 0.8 ? '#ffff00' : '#ff8800';
            drawCallsEl.innerHTML = `Draw Calls: <span style="color: ${callsColor};">${drawCalls}</span>`;
        }

        if (trianglesEl) {
            const triangles = this.gpuMonitor.triangles;
            trianglesEl.innerHTML = `Triangles: <span style="color: #ff8800;">${triangles.toLocaleString()}</span>`;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChampionshipPerformanceProfiler;
} else if (typeof window !== 'undefined') {
    window.ChampionshipPerformanceProfiler = ChampionshipPerformanceProfiler;
}