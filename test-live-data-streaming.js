#!/usr/bin/env node

/**
 * Live Data Streaming Test Suite
 * Tests WebSocket connections, API endpoints, and real-time data functionality
 * for the Blaze Intelligence Championship Platform
 */

import fetch from 'node-fetch';
import WebSocket from 'ws';
import fs from 'fs';

class LiveDataStreamingTester {
    constructor() {
        this.platforms = {
            cloudflare: 'https://blaze-intelligence-lsl.pages.dev/',
            netlify: 'https://blaze-intelligence-main.netlify.app/'
        };

        this.testResults = {
            timestamp: new Date().toISOString(),
            apiEndpoints: {},
            websocketTests: {},
            realTimeFeatures: {}
        };
    }

    async testAPIEndpoints() {
        console.log('🔗 TESTING API ENDPOINTS');
        console.log('========================\n');

        const endpoints = [
            '/api/health',
            '/api/analytics',
            '/api/cardinals/readiness',
            '/api/live-data-engine',
            '/api/video-analysis',
            '/api/ar-coaching-engine'
        ];

        for (const [platform, baseUrl] of Object.entries(this.platforms)) {
            console.log(`🌐 Testing ${platform} APIs:`);
            this.testResults.apiEndpoints[platform] = {};

            for (const endpoint of endpoints) {
                const fullUrl = baseUrl + endpoint.substring(1);
                const startTime = Date.now();

                try {
                    const response = await fetch(fullUrl, {
                        timeout: 5000,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'Blaze-Intelligence-Monitor/1.0'
                        }
                    });

                    const responseTime = Date.now() - startTime;
                    const result = {
                        status: response.status,
                        responseTime,
                        headers: Object.fromEntries(response.headers.entries()),
                        contentType: response.headers.get('content-type')
                    };

                    if (response.ok) {
                        console.log(`  ✅ ${endpoint}: ${response.status} (${responseTime}ms)`);
                    } else {
                        console.log(`  ⚠️ ${endpoint}: ${response.status} (${responseTime}ms)`);
                    }

                    this.testResults.apiEndpoints[platform][endpoint] = result;

                } catch (error) {
                    console.log(`  ❌ ${endpoint}: ${error.message}`);
                    this.testResults.apiEndpoints[platform][endpoint] = {
                        error: error.message,
                        status: 'ERROR'
                    };
                }
            }
            console.log('');
        }
    }

    async testWebSocketConnections() {
        console.log('🔌 TESTING WEBSOCKET CONNECTIONS');
        console.log('=================================\n');

        const wsEndpoints = [
            'wss://blaze-intelligence-lsl.pages.dev/ws/live-data',
            'wss://blaze-intelligence-main.netlify.app/ws/live-data'
        ];

        for (const wsUrl of wsEndpoints) {
            console.log(`🔗 Testing WebSocket: ${wsUrl}`);

            try {
                const ws = new WebSocket(wsUrl, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Blaze-Intelligence-Monitor/1.0'
                    }
                });

                const testResult = await new Promise((resolve) => {
                    const startTime = Date.now();
                    let connected = false;

                    ws.on('open', () => {
                        connected = true;
                        const connectionTime = Date.now() - startTime;
                        console.log(`  ✅ Connected in ${connectionTime}ms`);

                        // Test data streaming
                        ws.send(JSON.stringify({
                            type: 'test',
                            message: 'Championship platform test'
                        }));

                        resolve({
                            status: 'CONNECTED',
                            connectionTime,
                            timestamp: new Date().toISOString()
                        });

                        ws.close();
                    });

                    ws.on('message', (data) => {
                        console.log(`  📨 Received: ${data.toString().substring(0, 100)}...`);
                    });

                    ws.on('error', (error) => {
                        console.log(`  ❌ WebSocket Error: ${error.message}`);
                        resolve({
                            status: 'ERROR',
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    });

                    ws.on('close', () => {
                        if (!connected) {
                            console.log(`  ⚠️ Connection closed without opening`);
                            resolve({
                                status: 'CLOSED',
                                timestamp: new Date().toISOString()
                            });
                        }
                    });

                    // Timeout after 5 seconds
                    setTimeout(() => {
                        if (!connected) {
                            ws.terminate();
                            console.log(`  ⏱️ Connection timeout`);
                            resolve({
                                status: 'TIMEOUT',
                                timestamp: new Date().toISOString()
                            });
                        }
                    }, 5000);
                });

                this.testResults.websocketTests[wsUrl] = testResult;

            } catch (error) {
                console.log(`  ❌ Failed to create WebSocket: ${error.message}`);
                this.testResults.websocketTests[wsUrl] = {
                    status: 'FAILED',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }

            console.log('');
        }
    }

    async testRealTimeFeatures() {
        console.log('⚡ TESTING REAL-TIME FEATURES');
        console.log('=============================\n');

        const features = [
            {
                name: 'Cardinals Analytics Data',
                endpoint: '/data/live/mlb-cardinals-live.json',
                test: this.testCardinalsData.bind(this)
            },
            {
                name: 'Live Performance Metrics',
                endpoint: '/api/live-connections',
                test: this.testLiveMetrics.bind(this)
            },
            {
                name: 'Neural Network Visualization',
                endpoint: '/',
                test: this.testNeuralNetwork.bind(this)
            }
        ];

        for (const feature of features) {
            console.log(`🎯 Testing ${feature.name}:`);

            try {
                const result = await feature.test(feature.endpoint);
                this.testResults.realTimeFeatures[feature.name] = result;

                if (result.status === 'SUCCESS') {
                    console.log(`  ✅ ${feature.name}: Operational`);
                } else {
                    console.log(`  ⚠️ ${feature.name}: ${result.status}`);
                }

                if (result.metrics) {
                    Object.entries(result.metrics).forEach(([key, value]) => {
                        console.log(`    📊 ${key}: ${value}`);
                    });
                }

            } catch (error) {
                console.log(`  ❌ ${feature.name}: ${error.message}`);
                this.testResults.realTimeFeatures[feature.name] = {
                    status: 'ERROR',
                    error: error.message
                };
            }

            console.log('');
        }
    }

    async testCardinalsData(endpoint) {
        const url = this.platforms.netlify + endpoint.substring(1);

        try {
            const response = await fetch(url, { timeout: 3000 });

            if (response.ok) {
                const data = await response.json();
                return {
                    status: 'SUCCESS',
                    metrics: {
                        'Data Size': `${JSON.stringify(data).length} bytes`,
                        'Has Readiness': data.readiness ? '✅' : '❌',
                        'Has Leverage': data.leverage ? '✅' : '❌',
                        'Last Updated': data.lastUpdated || 'Unknown'
                    }
                };
            } else {
                return {
                    status: 'HTTP_ERROR',
                    httpStatus: response.status
                };
            }
        } catch (error) {
            return {
                status: 'FETCH_ERROR',
                error: error.message
            };
        }
    }

    async testLiveMetrics(endpoint) {
        const url = this.platforms.cloudflare + endpoint.substring(1);
        const startTime = Date.now();

        try {
            const response = await fetch(url, { timeout: 3000 });
            const responseTime = Date.now() - startTime;

            return {
                status: response.ok ? 'SUCCESS' : 'HTTP_ERROR',
                metrics: {
                    'Response Time': `${responseTime}ms`,
                    'HTTP Status': response.status,
                    'Latency Target': responseTime < 100 ? '✅ <100ms' : '⚠️ >100ms'
                }
            };
        } catch (error) {
            return {
                status: 'CONNECTION_ERROR',
                error: error.message
            };
        }
    }

    async testNeuralNetwork(endpoint) {
        const url = this.platforms.netlify;

        try {
            const response = await fetch(url);
            const html = await response.text();

            const features = {
                'Three.js': html.includes('three.js') || html.includes('THREE.'),
                'Neural Visualization': html.includes('neural') || html.includes('Neural'),
                'Particle System': html.includes('particle') || html.includes('Particle'),
                'Animation Frame': html.includes('requestAnimationFrame'),
                'WebGL Context': html.includes('getContext') && html.includes('webgl')
            };

            const successCount = Object.values(features).filter(Boolean).length;

            return {
                status: successCount >= 3 ? 'SUCCESS' : 'PARTIAL',
                metrics: {
                    'Features Detected': `${successCount}/5`,
                    ...Object.fromEntries(
                        Object.entries(features).map(([key, value]) => [key, value ? '✅' : '❌'])
                    )
                }
            };
        } catch (error) {
            return {
                status: 'ERROR',
                error: error.message
            };
        }
    }

    async runAllTests() {
        console.log('🏆 BLAZE INTELLIGENCE LIVE DATA STREAMING TESTS');
        console.log('==============================================\n');

        await this.testAPIEndpoints();
        await this.testWebSocketConnections();
        await this.testRealTimeFeatures();

        this.generateTestSummary();
        this.saveTestResults();
    }

    generateTestSummary() {
        console.log('📊 TEST SUMMARY REPORT');
        console.log('=====================\n');

        // Count successful tests
        let totalTests = 0;
        let passedTests = 0;

        // API endpoint summary
        for (const [platform, endpoints] of Object.entries(this.testResults.apiEndpoints)) {
            for (const [endpoint, result] of Object.entries(endpoints)) {
                totalTests++;
                if (result.status >= 200 && result.status < 400) {
                    passedTests++;
                }
            }
        }

        // WebSocket summary
        for (const [url, result] of Object.entries(this.testResults.websocketTests)) {
            totalTests++;
            if (result.status === 'CONNECTED') {
                passedTests++;
            }
        }

        // Real-time features summary
        for (const [feature, result] of Object.entries(this.testResults.realTimeFeatures)) {
            totalTests++;
            if (result.status === 'SUCCESS') {
                passedTests++;
            }
        }

        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        console.log(`🎯 Overall Test Results:`);
        console.log(`  📈 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
        console.log(`  ⚡ API Endpoints: ${Object.keys(this.testResults.apiEndpoints).length} platforms tested`);
        console.log(`  🔌 WebSocket Tests: ${Object.keys(this.testResults.websocketTests).length} connections tested`);
        console.log(`  🚀 Real-time Features: ${Object.keys(this.testResults.realTimeFeatures).length} features validated`);

        console.log(`\n🏆 Championship Platform Status:`);
        if (successRate >= 80) {
            console.log(`  ✅ CHAMPIONSHIP READY - Platform performing at elite level`);
        } else if (successRate >= 60) {
            console.log(`  ⚠️ OPTIMIZATION NEEDED - Platform functional but needs improvements`);
        } else {
            console.log(`  ❌ CRITICAL ISSUES - Platform requires immediate attention`);
        }
    }

    saveTestResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `live-data-test-results-${timestamp}.json`;

        try {
            fs.writeFileSync(filename, JSON.stringify(this.testResults, null, 2));
            console.log(`\n💾 Test results saved to: ${filename}`);
        } catch (error) {
            console.log(`\n❌ Error saving test results: ${error.message}`);
        }
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new LiveDataStreamingTester();
    tester.runAllTests().catch(console.error);
}

export default LiveDataStreamingTester;