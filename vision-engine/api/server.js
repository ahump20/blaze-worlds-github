/**
 * Blaze Intelligence Vision Engine API Server
 * Championship-Level Data Access and Real-Time Updates
 */

const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const admin = require('firebase-admin');
const Redis = require('ioredis');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIRESTORE_PROJECT_ID || 'blaze-intelligence-prod'
});

const db = admin.firestore();

// Initialize Redis for caching
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0
});

// Configure Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: 'vision-engine.log' })
    ]
});

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        championship: 'ready'
    });
});

/**
 * Get analysis session by ID
 */
app.get('/api/analysis/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    try {
        // Check cache first
        const cached = await redis.get(`session:${sessionId}`);
        if (cached) {
            logger.info(`Cache hit for session ${sessionId}`);
            return res.json(JSON.parse(cached));
        }

        // Fetch from Firestore
        const sessionDoc = await db.collection('analysis_sessions').doc(sessionId).get();

        if (!sessionDoc.exists) {
            return res.status(404).json({
                error: 'Session not found',
                sessionId
            });
        }

        const sessionData = sessionDoc.data();

        // Fetch synthesis results
        const synthesisDoc = await db
            .collection('analysis_sessions')
            .doc(sessionId)
            .collection('synthesis')
            .doc('results')
            .get();

        // Fetch timeline chunks
        const timelineSnapshot = await db
            .collection('analysis_sessions')
            .doc(sessionId)
            .collection('timeline')
            .orderBy('startFrame')
            .get();

        const timeline = [];
        timelineSnapshot.forEach(doc => {
            timeline.push(...doc.data().frames);
        });

        // Fetch critical moments
        const momentsDoc = await db
            .collection('analysis_sessions')
            .doc(sessionId)
            .collection('synthesis')
            .doc('critical_moments')
            .get();

        const response = {
            ...sessionData,
            synthesis: synthesisDoc.exists ? synthesisDoc.data() : null,
            timeline: timeline.slice(0, 100), // Return first 100 frames for initial load
            criticalMoments: momentsDoc.exists ? momentsDoc.data().moments : [],
            scores: sessionData.performanceScores || {}
        };

        // Cache for 1 hour
        await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(response));

        res.json(response);

    } catch (error) {
        logger.error('Error fetching session:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Get player analysis history
 */
app.get('/api/player/:playerId/history', async (req, res) => {
    const { playerId } = req.params;
    const { limit = 10, sport, sessionType } = req.query;

    try {
        let query = db.collection('analysis_sessions')
            .where('playerId', '==', playerId)
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit));

        if (sport) {
            query = query.where('sport', '==', sport);
        }

        if (sessionType) {
            query = query.where('sessionType', '==', sessionType);
        }

        const snapshot = await query.get();
        const sessions = [];

        snapshot.forEach(doc => {
            sessions.push({
                sessionId: doc.id,
                ...doc.data()
            });
        });

        res.json({
            playerId,
            sessionCount: sessions.length,
            sessions
        });

    } catch (error) {
        logger.error('Error fetching player history:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Get player progression metrics
 */
app.get('/api/player/:playerId/progression', async (req, res) => {
    const { playerId } = req.params;
    const { days = 30 } = req.query;

    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const snapshot = await db.collection('analysis_sessions')
            .where('playerId', '==', playerId)
            .where('createdAt', '>=', startDate)
            .orderBy('createdAt', 'asc')
            .get();

        const progression = {
            playerId,
            period: `${days} days`,
            dataPoints: [],
            improvements: {},
            trends: {}
        };

        const metrics = {
            biomechanical: [],
            behavioral: [],
            championshipReadiness: [],
            clutchFactor: []
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.performanceScores) {
                progression.dataPoints.push({
                    date: data.createdAt.toDate(),
                    scores: data.performanceScores
                });

                metrics.biomechanical.push(data.performanceScores.biomechanical || 0);
                metrics.behavioral.push(data.performanceScores.behavioral || 0);
                metrics.championshipReadiness.push(data.performanceScores.championshipReadiness || 0);
                metrics.clutchFactor.push(data.performanceScores.clutchFactor || 0);
            }
        });

        // Calculate improvements
        Object.keys(metrics).forEach(key => {
            const values = metrics[key];
            if (values.length > 1) {
                const first = values[0];
                const last = values[values.length - 1];
                const improvement = ((last - first) / first * 100).toFixed(1);
                progression.improvements[key] = parseFloat(improvement);

                // Calculate trend (positive, negative, stable)
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);

                if (recentAvg > avg * 1.05) {
                    progression.trends[key] = 'improving';
                } else if (recentAvg < avg * 0.95) {
                    progression.trends[key] = 'declining';
                } else {
                    progression.trends[key] = 'stable';
                }
            }
        });

        res.json(progression);

    } catch (error) {
        logger.error('Error calculating progression:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Get team analytics
 */
app.get('/api/team/:teamId/analytics', async (req, res) => {
    const { teamId } = req.params;

    try {
        // Fetch team roster
        const rosterDoc = await db.collection('teams').doc(teamId).get();

        if (!rosterDoc.exists) {
            return res.status(404).json({
                error: 'Team not found',
                teamId
            });
        }

        const team = rosterDoc.data();
        const playerIds = team.playerIds || [];

        // Fetch recent sessions for all team players
        const promises = playerIds.map(playerId =>
            db.collection('analysis_sessions')
                .where('playerId', '==', playerId)
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get()
        );

        const snapshots = await Promise.all(promises);

        const teamAnalytics = {
            teamId,
            teamName: team.name,
            playerCount: playerIds.length,
            averageScores: {
                biomechanical: 0,
                behavioral: 0,
                championshipReadiness: 0,
                clutchFactor: 0
            },
            topPerformers: [],
            needsAttention: [],
            recentActivity: []
        };

        let totalScores = {
            biomechanical: 0,
            behavioral: 0,
            championshipReadiness: 0,
            clutchFactor: 0
        };
        let scoreCount = 0;

        snapshots.forEach((snapshot, playerIndex) => {
            const playerId = playerIds[playerIndex];
            let playerTotal = 0;
            let sessionCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.performanceScores) {
                    Object.keys(totalScores).forEach(key => {
                        if (data.performanceScores[key]) {
                            totalScores[key] += data.performanceScores[key];
                            playerTotal += data.performanceScores[key];
                        }
                    });
                    scoreCount++;
                    sessionCount++;

                    // Track recent activity
                    teamAnalytics.recentActivity.push({
                        playerId,
                        sessionId: doc.id,
                        date: data.createdAt.toDate(),
                        championshipReadiness: data.performanceScores.championshipReadiness
                    });
                }
            });

            // Identify top performers and those needing attention
            if (sessionCount > 0) {
                const avgScore = playerTotal / (sessionCount * 4); // 4 metrics

                if (avgScore >= 85) {
                    teamAnalytics.topPerformers.push({
                        playerId,
                        averageScore: avgScore.toFixed(1)
                    });
                } else if (avgScore < 70) {
                    teamAnalytics.needsAttention.push({
                        playerId,
                        averageScore: avgScore.toFixed(1)
                    });
                }
            }
        });

        // Calculate team averages
        if (scoreCount > 0) {
            Object.keys(teamAnalytics.averageScores).forEach(key => {
                teamAnalytics.averageScores[key] = (totalScores[key] / scoreCount).toFixed(1);
            });
        }

        // Sort recent activity by date
        teamAnalytics.recentActivity.sort((a, b) => b.date - a.date);
        teamAnalytics.recentActivity = teamAnalytics.recentActivity.slice(0, 20);

        res.json(teamAnalytics);

    } catch (error) {
        logger.error('Error fetching team analytics:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Get championship comparison
 */
app.get('/api/championship/comparison', async (req, res) => {
    const { playerId, sport = 'baseball' } = req.query;

    try {
        // Fetch elite benchmarks
        const benchmarksDoc = await db.collection('benchmarks').doc(sport).get();
        const benchmarks = benchmarksDoc.exists ? benchmarksDoc.data() : {};

        let playerData = null;

        if (playerId) {
            // Get player's best performance
            const snapshot = await db.collection('analysis_sessions')
                .where('playerId', '==', playerId)
                .where('sport', '==', sport)
                .orderBy('performanceScores.championshipReadiness', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                playerData = snapshot.docs[0].data();
            }
        }

        const comparison = {
            sport,
            eliteBenchmarks: {
                biomechanical: benchmarks.biomechanical || 85,
                behavioral: benchmarks.behavioral || 80,
                championshipReadiness: benchmarks.championshipReadiness || 85,
                clutchFactor: benchmarks.clutchFactor || 80
            },
            playerPerformance: playerData ? {
                biomechanical: playerData.performanceScores?.biomechanical || 0,
                behavioral: playerData.performanceScores?.behavioral || 0,
                championshipReadiness: playerData.performanceScores?.championshipReadiness || 0,
                clutchFactor: playerData.performanceScores?.clutchFactor || 0
            } : null,
            gaps: {}
        };

        // Calculate gaps if player data exists
        if (playerData) {
            Object.keys(comparison.eliteBenchmarks).forEach(key => {
                const gap = comparison.eliteBenchmarks[key] - comparison.playerPerformance[key];
                comparison.gaps[key] = gap > 0 ? gap.toFixed(1) : 0;
            });
        }

        res.json(comparison);

    } catch (error) {
        logger.error('Error fetching championship comparison:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * WebSocket connections for real-time updates
 */
io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id);

    // Join session room for real-time updates
    socket.on('join_session', async (sessionId) => {
        socket.join(`session_${sessionId}`);
        logger.info(`Client ${socket.id} joined session ${sessionId}`);

        // Send current status
        try {
            const sessionDoc = await db.collection('analysis_sessions').doc(sessionId).get();
            if (sessionDoc.exists) {
                socket.emit('session_status', sessionDoc.data());
            }
        } catch (error) {
            logger.error('Error fetching session status:', error);
        }
    });

    // Leave session room
    socket.on('leave_session', (sessionId) => {
        socket.leave(`session_${sessionId}`);
        logger.info(`Client ${socket.id} left session ${sessionId}`);
    });

    // Handle frame requests
    socket.on('request_frames', async ({ sessionId, startFrame, endFrame }) => {
        try {
            const snapshot = await db
                .collection('analysis_sessions')
                .doc(sessionId)
                .collection('timeline')
                .where('startFrame', '>=', startFrame)
                .where('startFrame', '<=', endFrame)
                .orderBy('startFrame')
                .get();

            const frames = [];
            snapshot.forEach(doc => {
                frames.push(...doc.data().frames);
            });

            socket.emit('frames_data', {
                sessionId,
                startFrame,
                endFrame,
                frames
            });

        } catch (error) {
            logger.error('Error fetching frames:', error);
            socket.emit('error', {
                message: 'Failed to fetch frames',
                error: error.message
            });
        }
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
    });
});

/**
 * Firestore listener for real-time updates
 */
function setupRealtimeListeners() {
    // Listen for session updates
    db.collection('analysis_sessions')
        .where('status', 'in', ['processing', 'analyzing'])
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const data = change.doc.data();
                    const sessionId = change.doc.id;

                    // Emit update to clients watching this session
                    io.to(`session_${sessionId}`).emit('session_update', {
                        sessionId,
                        ...data
                    });

                    // If analysis is complete, emit completion event
                    if (data.status === 'completed') {
                        io.to(`session_${sessionId}`).emit('analysis_complete', {
                            sessionId,
                            scores: data.performanceScores,
                            championshipReadiness: data.championshipReadiness
                        });
                    }
                }
            });
        }, (error) => {
            logger.error('Firestore listener error:', error);
        });
}

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    logger.info(`🏆 Vision Engine API Server running on port ${PORT}`);
    logger.info(`WebSocket server ready for real-time updates`);

    // Setup real-time listeners
    setupRealtimeListeners();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing server gracefully');
    server.close(() => {
        logger.info('Server closed');
        redis.disconnect();
        process.exit(0);
    });
});

module.exports = { app, io };