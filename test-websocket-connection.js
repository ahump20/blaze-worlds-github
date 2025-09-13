#!/usr/bin/env node

/**
 * WebSocket Connection Test
 * Tests the Championship WebSocket Server connection and data flow
 */

import ChampionshipWebSocketClient from './js/championship-websocket-client.js';
import fs from 'fs';

class WebSocketConnectionTest {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                latency: {
                    min: null,
                    max: null,
                    average: null
                }
            }
        };
        this.client = null;
        this.testTimeout = 30000; // 30 seconds
    }

    async runAllTests() {
        console.log('🏆 CHAMPIONSHIP WEBSOCKET CONNECTION TESTS');
        console.log('==========================================\n');

        try {
            await this.testConnection();
            await this.testSubscriptions();
            await this.testLatency();
            await this.testDataStreams();
            this.generateSummary();
        } catch (error) {
            console.error('❌ Test suite error:', error);
        } finally {
            if (this.client) {
                this.client.disconnect();
            }
        }
    }

    async testConnection() {
        return new Promise((resolve, reject) => {
            console.log('🔗 Testing WebSocket Connection...');
            const testStart = Date.now();

            this.client = new ChampionshipWebSocketClient();

            this.client.on('connected', () => {
                const duration = Date.now() - testStart;
                this.addTest('Connection Test', 'PASSED', `Connected in ${duration}ms`);
                console.log(`✅ Connection established in ${duration}ms`);
                setTimeout(resolve, 1000); // Wait for initial messages
            });

            this.client.on('connection_failed', () => {
                this.addTest('Connection Test', 'FAILED', 'Failed to connect to WebSocket server');
                console.log('❌ Connection failed');
                reject(new Error('Connection failed'));
            });

            this.client.on('error', (error) => {
                this.addTest('Connection Test', 'FAILED', `Connection error: ${error.error}`);
                console.log('❌ Connection error:', error);
                reject(error);
            });

            // Timeout safety
            setTimeout(() => {
                if (!this.client.isConnected) {
                    this.addTest('Connection Test', 'FAILED', 'Connection timeout');
                    console.log('❌ Connection timeout');
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
        });
    }

    async testSubscriptions() {
        return new Promise((resolve) => {
            console.log('\n📡 Testing Stream Subscriptions...');

            const streams = ['cardinals', 'titans', 'longhorns', 'grizzlies'];
            let confirmations = 0;

            this.client.on('subscription_confirmed', (data) => {
                confirmations++;
                console.log(`✅ Subscribed to ${data.stream} stream`);
                this.addTest(`Subscribe to ${data.stream}`, 'PASSED', 'Subscription confirmed');

                if (confirmations === streams.length) {
                    console.log(`✅ All ${streams.length} subscriptions confirmed`);
                    setTimeout(resolve, 2000); // Wait for data
                }
            });

            // Subscribe to all streams
            streams.forEach(stream => {
                const success = this.client.subscribe(stream);
                if (!success) {
                    this.addTest(`Subscribe to ${stream}`, 'FAILED', 'Failed to send subscription');
                    console.log(`❌ Failed to subscribe to ${stream}`);
                }
            });

            // Timeout safety
            setTimeout(() => {
                if (confirmations < streams.length) {
                    this.addTest('All Subscriptions', 'FAILED', `Only ${confirmations}/${streams.length} confirmed`);
                    console.log(`⚠️ Only ${confirmations}/${streams.length} subscriptions confirmed`);
                }
                resolve();
            }, 8000);
        });
    }

    async testLatency() {
        return new Promise((resolve) => {
            console.log('\n⚡ Testing Latency Performance...');

            let pings = 0;
            const targetPings = 5;
            const latencies = [];

            this.client.on('pong', (data) => {
                pings++;
                const latency = data.latency || 0;
                latencies.push(latency);

                console.log(`🏓 Ping ${pings}/${targetPings}: ${latency}ms`);

                if (pings >= targetPings) {
                    const avgLatency = Math.round(latencies.reduce((a, b) => a + b) / latencies.length);
                    const maxLatency = Math.max(...latencies);
                    const minLatency = Math.min(...latencies);

                    this.testResults.summary.latency = {
                        min: minLatency,
                        max: maxLatency,
                        average: avgLatency
                    };

                    if (avgLatency < 100) {
                        this.addTest('Latency Performance', 'PASSED', `Average ${avgLatency}ms (target <100ms)`);
                        console.log(`✅ Latency test passed: ${avgLatency}ms average`);
                    } else {
                        this.addTest('Latency Performance', 'FAILED', `Average ${avgLatency}ms exceeds 100ms target`);
                        console.log(`⚠️ Latency exceeds target: ${avgLatency}ms`);
                    }

                    resolve();
                }
            });

            // Send ping requests
            const pingInterval = setInterval(() => {
                if (pings < targetPings) {
                    this.client.ping();
                } else {
                    clearInterval(pingInterval);
                }
            }, 1000);

            // Timeout safety
            setTimeout(() => {
                clearInterval(pingInterval);
                if (pings === 0) {
                    this.addTest('Latency Performance', 'FAILED', 'No ping responses received');
                    console.log('❌ No ping responses received');
                }
                resolve();
            }, 10000);
        });
    }

    async testDataStreams() {
        return new Promise((resolve) => {
            console.log('\n📊 Testing Live Data Streams...');

            const expectedStreams = ['cardinals', 'titans', 'longhorns', 'grizzlies', 'platform'];
            const receivedStreams = new Set();
            let dataCount = 0;

            this.client.on('live_data', (data) => {
                dataCount++;
                receivedStreams.add(data.stream);
                console.log(`📈 ${data.stream.toUpperCase()}: Received data packet ${dataCount}`);

                // Verify data structure
                if (data.data && data.timestamp && data.latency !== undefined) {
                    this.addTest(`${data.stream} Data Stream`, 'PASSED', 'Valid data structure received');
                } else {
                    this.addTest(`${data.stream} Data Stream`, 'FAILED', 'Invalid data structure');
                }
            });

            this.client.on('platform_metrics', (data) => {
                dataCount++;
                receivedStreams.add('platform');
                console.log(`📊 PLATFORM: Received metrics packet`);

                if (data.data && data.data.status && data.data.accuracy) {
                    this.addTest('Platform Metrics', 'PASSED', 'Valid metrics structure received');
                } else {
                    this.addTest('Platform Metrics', 'FAILED', 'Invalid metrics structure');
                }
            });

            // Test for 15 seconds to collect data
            setTimeout(() => {
                console.log(`\n📋 Data Stream Summary:`);
                console.log(`  📦 Total data packets received: ${dataCount}`);
                console.log(`  📡 Unique streams: ${receivedStreams.size}/${expectedStreams.length}`);

                if (receivedStreams.size >= 3) {
                    this.addTest('Data Stream Coverage', 'PASSED', `Received data from ${receivedStreams.size} streams`);
                    console.log(`✅ Data stream test passed`);
                } else {
                    this.addTest('Data Stream Coverage', 'FAILED', `Only ${receivedStreams.size} streams active`);
                    console.log(`⚠️ Limited stream coverage`);
                }

                resolve();
            }, 15000);
        });
    }

    addTest(name, status, details) {
        this.testResults.tests.push({
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        });

        this.testResults.summary.total++;
        if (status === 'PASSED') {
            this.testResults.summary.passed++;
        } else {
            this.testResults.summary.failed++;
        }
    }

    generateSummary() {
        console.log('\n🏁 TEST RESULTS SUMMARY');
        console.log('======================\n');

        const { summary } = this.testResults;
        const successRate = ((summary.passed / summary.total) * 100).toFixed(1);

        console.log(`📊 Overall Results:`);
        console.log(`  ✅ Passed: ${summary.passed}`);
        console.log(`  ❌ Failed: ${summary.failed}`);
        console.log(`  📈 Success Rate: ${successRate}%`);

        if (summary.latency.average) {
            console.log(`\n⚡ Latency Performance:`);
            console.log(`  📏 Min: ${summary.latency.min}ms`);
            console.log(`  📏 Max: ${summary.latency.max}ms`);
            console.log(`  📏 Average: ${summary.latency.average}ms`);
            console.log(`  🎯 Target: <100ms ${summary.latency.average < 100 ? '✅' : '❌'}`);
        }

        console.log(`\n🔍 Detailed Results:`);
        this.testResults.tests.forEach((test, index) => {
            const icon = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`  ${index + 1}. ${icon} ${test.name}: ${test.details}`);
        });

        console.log(`\n🏆 Championship Platform Status:`);
        if (successRate >= 90) {
            console.log(`  ✅ CHAMPIONSHIP READY - WebSocket system performing at elite level`);
        } else if (successRate >= 70) {
            console.log(`  ⚠️ OPTIMIZATION NEEDED - WebSocket system functional but needs improvements`);
        } else {
            console.log(`  ❌ CRITICAL ISSUES - WebSocket system requires immediate attention`);
        }

        // Save results
        this.saveResults();
    }

    saveResults() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `websocket-test-results-${timestamp}.json`;

            fs.writeFileSync(filename, JSON.stringify(this.testResults, null, 2));
            console.log(`\n💾 Test results saved to: ${filename}`);
        } catch (error) {
            console.log(`\n❌ Error saving results: ${error.message}`);
        }
    }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new WebSocketConnectionTest();
    tester.runAllTests().catch(console.error);
}

export default WebSocketConnectionTest;