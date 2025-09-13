/**
 * Championship WebSocket Client
 * Real-time data streaming client for Blaze Intelligence platforms
 * Connects to live sports data with <100ms latency
 */

class ChampionshipWebSocketClient {
    constructor(serverUrl = 'ws://localhost:8080/ws/live-data') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscribers = new Map();
        this.latencyHistory = [];
        this.connectionStats = {
            connectTime: null,
            messagesReceived: 0,
            messagessent: 0,
            lastActivity: null
        };

        this.connect();
    }

    connect() {
        console.log('🔗 Connecting to Championship WebSocket Server...');

        try {
            this.ws = new WebSocket(this.serverUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('❌ WebSocket connection error:', error);
            this.handleConnectionError();
        }
    }

    setupEventHandlers() {
        this.ws.onopen = (event) => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.connectionStats.connectTime = new Date();
            console.log('✅ Connected to Championship WebSocket Server');
            this.emit('connected', { timestamp: new Date().toISOString() });
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.connectionStats.messagesReceived++;
                this.connectionStats.lastActivity = new Date();
                this.handleMessage(data);
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
            }
        };

        this.ws.onclose = (event) => {
            this.isConnected = false;
            console.log(`🔌 WebSocket connection closed (Code: ${event.code})`);
            this.emit('disconnected', {
                code: event.code,
                reason: event.reason,
                timestamp: new Date().toISOString()
            });

            if (event.code !== 1000) { // Not a normal closure
                this.handleConnectionError();
            }
        };

        this.ws.onerror = (event) => {
            console.error('❌ WebSocket error:', event);
            this.emit('error', { error: event, timestamp: new Date().toISOString() });
        };
    }

    handleMessage(data) {
        // Calculate latency if timestamp is provided
        if (data.timestamp) {
            const latency = Date.now() - new Date(data.timestamp).getTime();
            this.latencyHistory.push(latency);
            if (this.latencyHistory.length > 100) {
                this.latencyHistory.shift(); // Keep only last 100 measurements
            }
        }

        switch (data.type) {
            case 'connection':
                console.log('🎯 Connection established:', data.message);
                this.emit('ready', data);
                break;

            case 'live_data':
                this.handleLiveData(data);
                break;

            case 'platform_metrics':
                this.handlePlatformMetrics(data);
                break;

            case 'heartbeat':
                this.handleHeartbeat(data);
                break;

            case 'pong':
                this.handlePong(data);
                break;

            case 'subscription_confirmed':
                console.log(`📡 Subscribed to ${data.stream} stream`);
                this.emit('subscription_confirmed', data);
                break;

            case 'status':
                this.emit('status', data);
                break;

            default:
                console.log('📨 Unknown message type:', data.type);
                this.emit('message', data);
        }
    }

    handleLiveData(data) {
        console.log(`📊 ${data.stream.toUpperCase()} data:`, data.data);
        this.emit('live_data', data);
        this.emit(`live_data_${data.stream}`, data);
    }

    handlePlatformMetrics(data) {
        console.log('⚡ Platform metrics:', data.data);
        this.emit('platform_metrics', data);
    }

    handleHeartbeat(data) {
        // Respond to heartbeat to maintain connection
        this.ping();
        this.emit('heartbeat', data);
    }

    handlePong(data) {
        if (data.latency !== undefined) {
            console.log(`🏓 Ping response: ${data.latency}ms latency`);
        }
        this.emit('pong', data);
    }

    handleConnectionError() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached. Connection failed.');
            this.emit('connection_failed');
        }
    }

    // Public API methods
    subscribe(stream) {
        if (!this.isConnected) {
            console.warn('⚠️ Cannot subscribe: Not connected to server');
            return false;
        }

        const message = {
            type: 'subscribe',
            stream: stream,
            timestamp: new Date().toISOString()
        };

        this.send(message);
        return true;
    }

    unsubscribe(stream) {
        if (!this.isConnected) {
            console.warn('⚠️ Cannot unsubscribe: Not connected to server');
            return false;
        }

        const message = {
            type: 'unsubscribe',
            stream: stream,
            timestamp: new Date().toISOString()
        };

        this.send(message);
        return true;
    }

    ping() {
        if (!this.isConnected) return false;

        const message = {
            type: 'ping',
            timestamp: new Date().toISOString()
        };

        this.send(message);
        return true;
    }

    getStatus() {
        if (!this.isConnected) return false;

        const message = {
            type: 'get_status',
            timestamp: new Date().toISOString()
        };

        this.send(message);
        return true;
    }

    send(data) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            this.connectionStats.messagesSet++;
            return true;
        }
        return false;
    }

    // Event system
    on(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        this.subscribers.get(event).add(callback);
    }

    off(event, callback) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.subscribers.has(event)) {
            for (const callback of this.subscribers.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in event callback for ${event}:`, error);
                }
            }
        }
    }

    // Utility methods
    getLatencyStats() {
        if (this.latencyHistory.length === 0) return null;

        const sorted = [...this.latencyHistory].sort((a, b) => a - b);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            average: Math.round(sorted.reduce((a, b) => a + b) / sorted.length),
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            samples: sorted.length
        };
    }

    getConnectionStats() {
        return {
            ...this.connectionStats,
            isConnected: this.isConnected,
            uptime: this.connectionStats.connectTime ?
                Math.floor((Date.now() - this.connectionStats.connectTime.getTime()) / 1000) : 0,
            latencyStats: this.getLatencyStats()
        };
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 Disconnecting from Championship WebSocket Server...');
            this.ws.close(1000, 'Client requested disconnect');
        }
    }

    // Championship-specific convenience methods
    subscribeToAllSports() {
        return this.subscribe('all');
    }

    subscribeToTeam(team) {
        const validTeams = ['cardinals', 'titans', 'longhorns', 'grizzlies'];
        if (!validTeams.includes(team.toLowerCase())) {
            console.warn(`⚠️ Invalid team: ${team}. Valid teams: ${validTeams.join(', ')}`);
            return false;
        }
        return this.subscribe(team.toLowerCase());
    }

    startLatencyMonitoring(interval = 30000) {
        if (this.latencyMonitor) {
            clearInterval(this.latencyMonitor);
        }

        this.latencyMonitor = setInterval(() => {
            if (this.isConnected) {
                this.ping();
            }
        }, interval);

        console.log(`📊 Started latency monitoring (${interval}ms intervals)`);
    }

    stopLatencyMonitoring() {
        if (this.latencyMonitor) {
            clearInterval(this.latencyMonitor);
            this.latencyMonitor = null;
            console.log('📊 Stopped latency monitoring');
        }
    }
}

// Global instance for easy access
if (typeof window !== 'undefined') {
    window.ChampionshipWebSocketClient = ChampionshipWebSocketClient;

    // Auto-initialize if enabled
    if (window.BLAZE_AUTO_CONNECT_WEBSOCKET) {
        window.blazeWebSocket = new ChampionshipWebSocketClient();
        console.log('🏆 Championship WebSocket client auto-initialized');
    }
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChampionshipWebSocketClient;
}

// ES module export
export default ChampionshipWebSocketClient;