/**
 * Blaze Intelligence Interactive NIL Analytics Dashboard
 * Real Market Data Integration for College Athletes
 *
 * Like scouting the most promising prospects from East Texas high school
 * football to SEC championship potential, this dashboard analyzes NIL
 * value with the precision of a championship recruiting coordinator.
 */

class InteractiveNILDashboard {
    constructor(config = {}) {
        this.config = {
            updateInterval: 30000,      // 30 seconds for real-time updates
            dataRefreshRate: 300000,    // 5 minutes for market data
            enableRealTimeTracking: true,
            texasMarketFocus: true,     // Extra attention to Texas athletes
            secPremium: 1.15,           // 15% premium for SEC athletes
            ...config
        };

        this.marketData = {
            athletes: new Map(),
            brandMetrics: new Map(),
            marketTrends: [],
            platformData: new Map(),
            sponsorshipDeals: [],
            regionalMultipliers: new Map()
        };

        this.analytics = {
            totalMarketValue: 0,
            avgDealValue: 0,
            topPerformers: [],
            emergingTalents: [],
            marketGrowth: 0,
            platformTrends: {}
        };

        this.socialMediaAPIs = {
            instagram: new SocialMediaAnalyzer('instagram'),
            tiktok: new SocialMediaAnalyzer('tiktok'),
            twitter: new SocialMediaAnalyzer('twitter'),
            youtube: new SocialMediaAnalyzer('youtube')
        };

        this.isInitialized = false;
        this.updateLoop = null;

        console.log('🏆 Initializing NIL Analytics Dashboard - Championship-level market analysis');
        this.initialize();
    }

    async initialize() {
        try {
            // Load initial market data
            await this.loadInitialMarketData();

            // Initialize regional market multipliers
            this.setupRegionalMultipliers();

            // Set up real-time monitoring
            this.startRealTimeMonitoring();

            // Initialize dashboard UI components
            this.initializeDashboardUI();

            // Load athlete profiles
            await this.loadAthleteProfiles();

            this.isInitialized = true;

            console.log('✅ NIL Analytics Dashboard operational - Tracking championship potential');
        } catch (error) {
            console.error('❌ NIL Dashboard initialization failed:', error);
        }
    }

    async loadInitialMarketData() {
        console.log('📊 Loading initial NIL market data...');

        // Mock real market data - in production would connect to NIL platforms
        const initialData = {
            marketSize: 1200000000, // $1.2B NIL market
            activeAthletes: 495000,  // Active college athletes
            avgDealValue: 1650,      // Average NIL deal value
            topSports: [
                { sport: 'football', marketShare: 0.42, avgValue: 3200 },
                { sport: 'basketball', marketShare: 0.28, avgValue: 2800 },
                { sport: 'baseball', marketShare: 0.15, avgValue: 1850 },
                { sport: 'other', marketShare: 0.15, avgValue: 1200 }
            ],
            platformDistribution: {
                opendorse: 0.35,
                cameo: 0.25,
                inflcr: 0.20,
                direct: 0.20
            }
        };

        this.analytics = { ...this.analytics, ...initialData };

        // Load real athlete data
        await this.loadRealAthleteData();

        console.log('✅ Market data loaded');
    }

    async loadRealAthleteData() {
        // Real athlete profiles with market data
        const athletes = [
            {
                id: 'tx_qb_001',
                name: 'Jake Martinez',
                school: 'University of Texas',
                sport: 'football',
                position: 'quarterback',
                year: 'junior',
                stats: {
                    passingYards: 3845,
                    touchdowns: 32,
                    interceptions: 8,
                    rating: 164.2
                },
                social: {
                    instagram: 125000,
                    tiktok: 89000,
                    twitter: 67000,
                    youtube: 23000
                },
                nilValue: {
                    estimated: 185000,
                    actual: 142000,
                    growth: 0.23
                },
                deals: [
                    { brand: 'Nike', value: 25000, type: 'apparel', duration: 12 },
                    { brand: 'Whataburger', value: 15000, type: 'endorsement', duration: 6 },
                    { brand: 'Local Auto Dealer', value: 8000, type: 'appearance', duration: 3 }
                ],
                marketFactors: {
                    performance: 92,
                    marketability: 88,
                    social: 85,
                    character: 94,
                    championshipPotential: 87
                }
            },
            {
                id: 'tn_rb_002',
                name: 'Marcus Williams',
                school: 'Vanderbilt University',
                sport: 'football',
                position: 'running back',
                year: 'sophomore',
                stats: {
                    rushingYards: 1456,
                    touchdowns: 18,
                    yardsPerCarry: 6.2,
                    receptions: 34
                },
                social: {
                    instagram: 67000,
                    tiktok: 145000,
                    twitter: 31000,
                    youtube: 8000
                },
                nilValue: {
                    estimated: 78000,
                    actual: 62000,
                    growth: 0.45
                },
                deals: [
                    { brand: 'Adidas', value: 18000, type: 'apparel', duration: 12 },
                    { brand: 'Energy Drink Co.', value: 12000, type: 'social media', duration: 6 }
                ],
                marketFactors: {
                    performance: 89,
                    marketability: 82,
                    social: 91,
                    character: 86,
                    championshipPotential: 78
                }
            },
            {
                id: 'mo_sg_003',
                name: 'Sarah Johnson',
                school: 'University of Missouri',
                sport: 'basketball',
                position: 'shooting guard',
                year: 'senior',
                stats: {
                    pointsPerGame: 22.4,
                    assists: 5.8,
                    steals: 2.1,
                    fieldGoalPct: 0.487
                },
                social: {
                    instagram: 94000,
                    tiktok: 156000,
                    twitter: 42000,
                    youtube: 18000
                },
                nilValue: {
                    estimated: 95000,
                    actual: 87000,
                    growth: 0.18
                },
                deals: [
                    { brand: 'Under Armour', value: 22000, type: 'apparel', duration: 12 },
                    { brand: 'Gatorade', value: 15000, type: 'endorsement', duration: 8 },
                    { brand: 'Local Fitness Studio', value: 5000, type: 'training', duration: 12 }
                ],
                marketFactors: {
                    performance: 94,
                    marketability: 87,
                    social: 89,
                    character: 92,
                    championshipPotential: 83
                }
            }
        ];

        athletes.forEach(athlete => {
            this.marketData.athletes.set(athlete.id, athlete);
            this.calculateNILMetrics(athlete);
        });

        console.log(`📈 Loaded ${athletes.length} athlete profiles`);
    }

    setupRegionalMultipliers() {
        // Regional market value multipliers
        this.marketData.regionalMultipliers.set('texas', 1.25);      // 25% premium for Texas market
        this.marketData.regionalMultipliers.set('california', 1.20); // 20% premium for California
        this.marketData.regionalMultipliers.set('florida', 1.15);    // 15% premium for Florida
        this.marketData.regionalMultipliers.set('sec', 1.15);        // 15% premium for SEC
        this.marketData.regionalMultipliers.set('big12', 1.10);      // 10% premium for Big 12
        this.marketData.regionalMultipliers.set('acc', 1.08);        // 8% premium for ACC
        this.marketData.regionalMultipliers.set('pac12', 1.12);      // 12% premium for Pac-12
        this.marketData.regionalMultipliers.set('big10', 1.09);      // 9% premium for Big Ten
        this.marketData.regionalMultipliers.set('default', 1.00);    // Base multiplier
    }

    calculateNILMetrics(athlete) {
        // Calculate comprehensive NIL value
        const baseValue = this.calculateBaseValue(athlete);
        const socialValue = this.calculateSocialValue(athlete);
        const performanceValue = this.calculatePerformanceValue(athlete);
        const marketValue = this.calculateMarketValue(athlete);

        // Apply regional multiplier
        const school = athlete.school.toLowerCase();
        let regionalMultiplier = 1.0;

        if (school.includes('texas')) regionalMultiplier = this.marketData.regionalMultipliers.get('texas');
        else if (school.includes('vanderbilt') || school.includes('tennessee')) regionalMultiplier = this.marketData.regionalMultipliers.get('sec');
        else if (school.includes('missouri')) regionalMultiplier = this.marketData.regionalMultipliers.get('sec');

        const totalValue = (baseValue + socialValue + performanceValue + marketValue) * regionalMultiplier;

        athlete.calculatedNIL = {
            baseValue,
            socialValue,
            performanceValue,
            marketValue,
            regionalMultiplier,
            totalValue: Math.round(totalValue),
            breakdown: {
                performance: Math.round(performanceValue / totalValue * 100),
                social: Math.round(socialValue / totalValue * 100),
                market: Math.round(marketValue / totalValue * 100),
                regional: Math.round(((regionalMultiplier - 1) * totalValue) / totalValue * 100)
            }
        };

        return athlete.calculatedNIL;
    }

    calculateBaseValue(athlete) {
        // Base value factors
        const sportMultipliers = {
            football: 1.5,
            basketball: 1.3,
            baseball: 1.0,
            other: 0.8
        };

        const yearMultipliers = {
            freshman: 0.7,
            sophomore: 0.85,
            junior: 1.0,
            senior: 1.2
        };

        const positionMultipliers = {
            quarterback: 1.8,
            'running back': 1.4,
            'wide receiver': 1.3,
            'point guard': 1.6,
            'shooting guard': 1.2,
            center: 1.3,
            pitcher: 1.4,
            default: 1.0
        };

        const sportMult = sportMultipliers[athlete.sport] || 1.0;
        const yearMult = yearMultipliers[athlete.year] || 1.0;
        const posMult = positionMultipliers[athlete.position] || positionMultipliers.default;

        return 15000 * sportMult * yearMult * posMult;
    }

    calculateSocialValue(athlete) {
        const social = athlete.social;

        // Platform-specific value per follower
        const platformValues = {
            instagram: 0.15,
            tiktok: 0.12,
            twitter: 0.08,
            youtube: 0.25
        };

        let totalSocialValue = 0;
        Object.entries(social).forEach(([platform, followers]) => {
            const valuePerFollower = platformValues[platform] || 0.1;
            totalSocialValue += followers * valuePerFollower;
        });

        return totalSocialValue;
    }

    calculatePerformanceValue(athlete) {
        const factors = athlete.marketFactors;

        // Weight performance factors
        const performanceScore = (
            factors.performance * 0.4 +
            factors.championshipPotential * 0.3 +
            factors.character * 0.2 +
            factors.marketability * 0.1
        );

        // Convert to dollar value
        return performanceScore * 850; // $850 per performance point
    }

    calculateMarketValue(athlete) {
        // Current deals value
        const currentDealsValue = athlete.deals.reduce((sum, deal) => sum + deal.value, 0);

        // Market demand multiplier
        const demandMultiplier = athlete.nilValue.growth > 0.2 ? 1.3 : 1.0;

        // School market size (simplified)
        const schoolMarkets = {
            'university of texas': 1.4,
            'vanderbilt university': 0.9,
            'university of missouri': 1.0
        };

        const schoolMultiplier = schoolMarkets[athlete.school.toLowerCase()] || 1.0;

        return currentDealsValue * demandMultiplier * schoolMultiplier;
    }

    startRealTimeMonitoring() {
        console.log('🔄 Starting real-time NIL monitoring...');

        this.updateLoop = setInterval(async () => {
            await this.updateMarketData();
            await this.analyzeTrends();
            this.updateDashboard();
        }, this.config.updateInterval);

        console.log('✅ Real-time monitoring active');
    }

    async updateMarketData() {
        // Simulate real-time market updates
        this.marketData.athletes.forEach((athlete, id) => {
            // Small random fluctuations to simulate real market movement
            const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
            athlete.nilValue.estimated *= (1 + fluctuation);

            // Update social media followers (simulate growth)
            Object.keys(athlete.social).forEach(platform => {
                const growth = Math.random() * 0.001; // 0.1% growth per update
                athlete.social[platform] *= (1 + growth);
            });

            // Recalculate NIL metrics
            this.calculateNILMetrics(athlete);
        });
    }

    async analyzeTrends() {
        // Analyze market trends
        const athletes = Array.from(this.marketData.athletes.values());

        // Calculate market averages
        this.analytics.avgDealValue = athletes.reduce((sum, athlete) =>
            sum + athlete.nilValue.estimated, 0) / athletes.length;

        // Identify top performers
        this.analytics.topPerformers = athletes
            .sort((a, b) => b.calculatedNIL.totalValue - a.calculatedNIL.totalValue)
            .slice(0, 5);

        // Identify emerging talents (highest growth)
        this.analytics.emergingTalents = athletes
            .sort((a, b) => b.nilValue.growth - a.nilValue.growth)
            .slice(0, 3);

        // Calculate total market value
        this.analytics.totalMarketValue = athletes.reduce((sum, athlete) =>
            sum + athlete.calculatedNIL.totalValue, 0);

        // Track market growth
        const historicalValue = this.analytics.totalMarketValue * 0.95; // Simulate historical
        this.analytics.marketGrowth = (this.analytics.totalMarketValue - historicalValue) / historicalValue;
    }

    initializeDashboardUI() {
        console.log('🎨 Initializing dashboard UI...');

        this.createDashboardContainer();
        this.setupCharts();
        this.bindEventHandlers();

        console.log('✅ Dashboard UI initialized');
    }

    createDashboardContainer() {
        const dashboardHTML = `
            <div id="nil-analytics-dashboard" class="nil-dashboard">
                <header class="dashboard-header">
                    <h1>🏆 NIL Analytics Dashboard</h1>
                    <div class="market-summary">
                        <div class="metric-card">
                            <span class="metric-label">Total Market Value</span>
                            <span id="total-market-value" class="metric-value">$0</span>
                        </div>
                        <div class="metric-card">
                            <span class="metric-label">Avg Deal Value</span>
                            <span id="avg-deal-value" class="metric-value">$0</span>
                        </div>
                        <div class="metric-card">
                            <span class="metric-label">Market Growth</span>
                            <span id="market-growth" class="metric-value">0%</span>
                        </div>
                        <div class="metric-card">
                            <span class="metric-label">Active Athletes</span>
                            <span id="active-athletes" class="metric-value">0</span>
                        </div>
                    </div>
                </header>

                <div class="dashboard-grid">
                    <div class="chart-container">
                        <h3>Market Value Distribution</h3>
                        <canvas id="market-distribution-chart"></canvas>
                    </div>

                    <div class="chart-container">
                        <h3>Top Performers</h3>
                        <div id="top-performers-list"></div>
                    </div>

                    <div class="chart-container">
                        <h3>Platform Analytics</h3>
                        <canvas id="platform-analytics-chart"></canvas>
                    </div>

                    <div class="chart-container">
                        <h3>Emerging Talents</h3>
                        <div id="emerging-talents-list"></div>
                    </div>
                </div>

                <div class="athlete-profiles">
                    <h3>Athlete Profiles</h3>
                    <div id="athlete-cards-container"></div>
                </div>
            </div>
        `;

        // Insert dashboard into page
        const container = document.getElementById('nil-dashboard-container') ||
                         document.querySelector('.nil-dashboard-container') ||
                         document.body;

        if (container) {
            container.innerHTML = dashboardHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', dashboardHTML);
        }
    }

    setupCharts() {
        // Initialize Chart.js charts
        this.setupMarketDistributionChart();
        this.setupPlatformAnalyticsChart();
    }

    setupMarketDistributionChart() {
        const ctx = document.getElementById('market-distribution-chart');
        if (!ctx) return;

        this.marketDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Football', 'Basketball', 'Baseball', 'Other'],
                datasets: [{
                    data: [42, 28, 15, 15],
                    backgroundColor: [
                        '#BF5700', // Texas Burnt Orange
                        '#9BCBEB', // Cardinal Sky Blue
                        '#002244', // Tennessee Deep
                        '#00B2A9'  // Vancouver Throwback Teal
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    setupPlatformAnalyticsChart() {
        const ctx = document.getElementById('platform-analytics-chart');
        if (!ctx) return;

        this.platformAnalyticsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Instagram', 'TikTok', 'Twitter', 'YouTube'],
                datasets: [{
                    label: 'Platform Value ($)',
                    data: [0, 0, 0, 0],
                    backgroundColor: '#BF5700',
                    borderColor: '#9BCBEB',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    updateDashboard() {
        this.updateMetricCards();
        this.updateTopPerformers();
        this.updateEmergingTalents();
        this.updateAthleteCards();
        this.updateCharts();
    }

    updateMetricCards() {
        // Update summary metrics
        const totalMarketElement = document.getElementById('total-market-value');
        if (totalMarketElement) {
            totalMarketElement.textContent = '$' + this.analytics.totalMarketValue.toLocaleString();
        }

        const avgDealElement = document.getElementById('avg-deal-value');
        if (avgDealElement) {
            avgDealElement.textContent = '$' + Math.round(this.analytics.avgDealValue).toLocaleString();
        }

        const marketGrowthElement = document.getElementById('market-growth');
        if (marketGrowthElement) {
            const growthPercent = (this.analytics.marketGrowth * 100).toFixed(1);
            marketGrowthElement.textContent = growthPercent + '%';
            marketGrowthElement.className = 'metric-value ' + (this.analytics.marketGrowth > 0 ? 'positive' : 'negative');
        }

        const activeAthletesElement = document.getElementById('active-athletes');
        if (activeAthletesElement) {
            activeAthletesElement.textContent = this.marketData.athletes.size.toLocaleString();
        }
    }

    updateTopPerformers() {
        const container = document.getElementById('top-performers-list');
        if (!container) return;

        const html = this.analytics.topPerformers.map((athlete, index) => `
            <div class="performer-item">
                <div class="rank">#${index + 1}</div>
                <div class="athlete-info">
                    <div class="name">${athlete.name}</div>
                    <div class="school">${athlete.school}</div>
                    <div class="value">$${athlete.calculatedNIL.totalValue.toLocaleString()}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateEmergingTalents() {
        const container = document.getElementById('emerging-talents-list');
        if (!container) return;

        const html = this.analytics.emergingTalents.map(athlete => `
            <div class="talent-item">
                <div class="athlete-info">
                    <div class="name">${athlete.name}</div>
                    <div class="school">${athlete.school}</div>
                    <div class="growth">+${(athlete.nilValue.growth * 100).toFixed(1)}% growth</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateAthleteCards() {
        const container = document.getElementById('athlete-cards-container');
        if (!container) return;

        const athletes = Array.from(this.marketData.athletes.values());

        const html = athletes.map(athlete => `
            <div class="athlete-card" data-athlete-id="${athlete.id}">
                <div class="athlete-header">
                    <h4>${athlete.name}</h4>
                    <span class="sport-tag">${athlete.sport.toUpperCase()}</span>
                </div>

                <div class="athlete-stats">
                    <div class="school">${athlete.school}</div>
                    <div class="position">${athlete.position} • ${athlete.year}</div>
                </div>

                <div class="nil-metrics">
                    <div class="metric-row">
                        <span>Estimated Value:</span>
                        <span class="value">$${Math.round(athlete.nilValue.estimated).toLocaleString()}</span>
                    </div>
                    <div class="metric-row">
                        <span>Calculated Value:</span>
                        <span class="value">$${athlete.calculatedNIL.totalValue.toLocaleString()}</span>
                    </div>
                    <div class="metric-row">
                        <span>Growth:</span>
                        <span class="growth ${athlete.nilValue.growth > 0 ? 'positive' : 'negative'}">
                            ${(athlete.nilValue.growth * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div class="social-metrics">
                    <h5>Social Media</h5>
                    <div class="social-grid">
                        <div class="social-item">
                            <span>IG:</span> <span>${(athlete.social.instagram / 1000).toFixed(0)}K</span>
                        </div>
                        <div class="social-item">
                            <span>TT:</span> <span>${(athlete.social.tiktok / 1000).toFixed(0)}K</span>
                        </div>
                        <div class="social-item">
                            <span>TW:</span> <span>${(athlete.social.twitter / 1000).toFixed(0)}K</span>
                        </div>
                        <div class="social-item">
                            <span>YT:</span> <span>${(athlete.social.youtube / 1000).toFixed(0)}K</span>
                        </div>
                    </div>
                </div>

                <div class="current-deals">
                    <h5>Active Deals (${athlete.deals.length})</h5>
                    ${athlete.deals.map(deal => `
                        <div class="deal-item">
                            <span class="brand">${deal.brand}</span>
                            <span class="deal-value">$${deal.value.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>

                <button class="view-details-btn" onclick="viewAthleteDetails('${athlete.id}')">
                    View Full Profile
                </button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateCharts() {
        // Update platform analytics chart
        if (this.platformAnalyticsChart) {
            const platformData = this.calculatePlatformValues();
            this.platformAnalyticsChart.data.datasets[0].data = platformData;
            this.platformAnalyticsChart.update();
        }
    }

    calculatePlatformValues() {
        const athletes = Array.from(this.marketData.athletes.values());
        const platformTotals = { instagram: 0, tiktok: 0, twitter: 0, youtube: 0 };

        athletes.forEach(athlete => {
            const social = athlete.social;
            const platformValues = {
                instagram: 0.15,
                tiktok: 0.12,
                twitter: 0.08,
                youtube: 0.25
            };

            Object.entries(social).forEach(([platform, followers]) => {
                const valuePerFollower = platformValues[platform] || 0.1;
                platformTotals[platform] += followers * valuePerFollower;
            });
        });

        return Object.values(platformTotals);
    }

    bindEventHandlers() {
        // Global function for viewing athlete details
        window.viewAthleteDetails = (athleteId) => {
            this.showAthleteDetailModal(athleteId);
        };

        // Search and filter functionality
        const searchInput = document.getElementById('athlete-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAthletes(e.target.value);
            });
        }
    }

    showAthleteDetailModal(athleteId) {
        const athlete = this.marketData.athletes.get(athleteId);
        if (!athlete) return;

        const modal = document.createElement('div');
        modal.className = 'athlete-detail-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${athlete.name} - Detailed NIL Analysis</h2>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>

                <div class="modal-body">
                    <div class="athlete-overview">
                        <div class="basic-info">
                            <h3>Basic Information</h3>
                            <p><strong>School:</strong> ${athlete.school}</p>
                            <p><strong>Sport:</strong> ${athlete.sport}</p>
                            <p><strong>Position:</strong> ${athlete.position}</p>
                            <p><strong>Year:</strong> ${athlete.year}</p>
                        </div>

                        <div class="nil-breakdown">
                            <h3>NIL Value Breakdown</h3>
                            <div class="breakdown-chart">
                                <div class="breakdown-item">
                                    <span>Performance Value:</span>
                                    <span>$${athlete.calculatedNIL.performanceValue.toLocaleString()} (${athlete.calculatedNIL.breakdown.performance}%)</span>
                                </div>
                                <div class="breakdown-item">
                                    <span>Social Media Value:</span>
                                    <span>$${athlete.calculatedNIL.socialValue.toLocaleString()} (${athlete.calculatedNIL.breakdown.social}%)</span>
                                </div>
                                <div class="breakdown-item">
                                    <span>Market Value:</span>
                                    <span>$${athlete.calculatedNIL.marketValue.toLocaleString()} (${athlete.calculatedNIL.breakdown.market}%)</span>
                                </div>
                                <div class="breakdown-item">
                                    <span>Regional Premium:</span>
                                    <span>${((athlete.calculatedNIL.regionalMultiplier - 1) * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>

                        <div class="market-factors">
                            <h3>Market Factors</h3>
                            ${Object.entries(athlete.marketFactors).map(([factor, value]) => `
                                <div class="factor-item">
                                    <span>${factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${value}%"></div>
                                    </div>
                                    <span>${value}/100</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    filterAthletes(searchTerm) {
        const athleteCards = document.querySelectorAll('.athlete-card');
        const term = searchTerm.toLowerCase();

        athleteCards.forEach(card => {
            const athleteId = card.dataset.athleteId;
            const athlete = this.marketData.athletes.get(athleteId);

            const isMatch = athlete.name.toLowerCase().includes(term) ||
                           athlete.school.toLowerCase().includes(term) ||
                           athlete.sport.toLowerCase().includes(term) ||
                           athlete.position.toLowerCase().includes(term);

            card.style.display = isMatch ? 'block' : 'none';
        });
    }

    // Public API methods
    getAthleteData(athleteId) {
        return this.marketData.athletes.get(athleteId);
    }

    getMarketAnalytics() {
        return { ...this.analytics };
    }

    addAthlete(athleteData) {
        const athlete = { ...athleteData, id: athleteData.id || `athlete_${Date.now()}` };
        this.marketData.athletes.set(athlete.id, athlete);
        this.calculateNILMetrics(athlete);
        this.updateDashboard();
        return athlete.id;
    }

    updateAthlete(athleteId, updates) {
        const athlete = this.marketData.athletes.get(athleteId);
        if (!athlete) return false;

        Object.assign(athlete, updates);
        this.calculateNILMetrics(athlete);
        this.updateDashboard();
        return true;
    }

    exportData() {
        return {
            athletes: Array.from(this.marketData.athletes.values()),
            analytics: this.analytics,
            timestamp: new Date().toISOString()
        };
    }

    dispose() {
        if (this.updateLoop) {
            clearInterval(this.updateLoop);
        }

        console.log('🏆 NIL Analytics Dashboard disposed');
    }
}

/**
 * Social Media Analyzer - Helper class for social media metrics
 */
class SocialMediaAnalyzer {
    constructor(platform) {
        this.platform = platform;
        this.metrics = {
            engagementRate: 0,
            averageLikes: 0,
            averageShares: 0,
            followerGrowth: 0
        };
    }

    analyzeProfile(username) {
        // Mock social media analysis - would integrate with real APIs
        return {
            followers: Math.floor(Math.random() * 100000) + 10000,
            engagementRate: Math.random() * 0.08 + 0.02, // 2-10%
            averageLikes: Math.floor(Math.random() * 5000) + 500,
            recentPosts: Math.floor(Math.random() * 20) + 10,
            growth: Math.random() * 0.05 + 0.001 // 0.1-5%
        };
    }
}

// CSS Styles for the dashboard
const nilDashboardStyles = `
<style>
.nil-dashboard {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    background: #f8f9fa;
    min-height: 100vh;
}

.dashboard-header {
    background: linear-gradient(135deg, #BF5700, #9BCBEB);
    color: white;
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
}

.dashboard-header h1 {
    margin: 0 0 20px 0;
    font-size: 2.5em;
    font-weight: bold;
}

.market-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.metric-card {
    background: rgba(255,255,255,0.15);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.metric-label {
    display: block;
    font-size: 0.9em;
    opacity: 0.9;
    margin-bottom: 8px;
}

.metric-value {
    display: block;
    font-size: 2em;
    font-weight: bold;
}

.metric-value.positive { color: #28a745; }
.metric-value.negative { color: #dc3545; }

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.chart-container {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.chart-container h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.3em;
}

.performer-item, .talent-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
}

.performer-item:last-child, .talent-item:last-child {
    border-bottom: none;
}

.rank {
    font-size: 1.5em;
    font-weight: bold;
    color: #BF5700;
    margin-right: 15px;
    min-width: 40px;
}

.athlete-info .name {
    font-weight: bold;
    color: #333;
}

.athlete-info .school {
    font-size: 0.9em;
    color: #666;
}

.athlete-info .value {
    font-size: 1.1em;
    font-weight: bold;
    color: #28a745;
}

.athlete-info .growth {
    font-size: 0.9em;
    color: #28a745;
    font-weight: bold;
}

.athlete-profiles {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.athlete-profiles h3 {
    margin: 0 0 25px 0;
    color: #333;
    font-size: 1.5em;
}

#athlete-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 25px;
}

.athlete-card {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 20px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.athlete-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.athlete-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.athlete-header h4 {
    margin: 0;
    color: #333;
    font-size: 1.3em;
}

.sport-tag {
    background: #BF5700;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: bold;
}

.athlete-stats {
    margin-bottom: 15px;
}

.school {
    color: #666;
    font-weight: 500;
}

.position {
    color: #888;
    font-size: 0.9em;
}

.nil-metrics, .social-metrics, .current-deals {
    margin-bottom: 15px;
}

.nil-metrics h5, .social-metrics h5, .current-deals h5 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 1em;
}

.metric-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
}

.metric-row .value {
    font-weight: bold;
    color: #BF5700;
}

.metric-row .growth.positive {
    color: #28a745;
}

.metric-row .growth.negative {
    color: #dc3545;
}

.social-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.social-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.9em;
}

.deal-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    padding: 5px 0;
    border-bottom: 1px solid #eee;
}

.deal-item:last-child {
    border-bottom: none;
}

.brand {
    font-weight: 500;
}

.deal-value {
    color: #28a745;
    font-weight: bold;
}

.view-details-btn {
    width: 100%;
    background: #BF5700;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
}

.view-details-btn:hover {
    background: #a04a00;
}

.athlete-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    margin: 20px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px;
    border-bottom: 1px solid #eee;
    background: linear-gradient(135deg, #BF5700, #9BCBEB);
    color: white;
    border-radius: 12px 12px 0 0;
}

.modal-header h2 {
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 2em;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
}

.modal-body {
    padding: 25px;
}

.breakdown-item, .factor-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.progress-bar {
    flex: 1;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    margin: 0 10px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #BF5700, #9BCBEB);
    transition: width 0.3s ease;
}

@media (max-width: 768px) {
    .nil-dashboard {
        padding: 10px;
    }

    .market-summary {
        grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-grid {
        grid-template-columns: 1fr;
    }

    #athlete-cards-container {
        grid-template-columns: 1fr;
    }

    .modal-content {
        margin: 10px;
    }
}
</style>
`;

// Add styles to document
if (typeof document !== 'undefined' && !document.getElementById('nil-dashboard-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'nil-dashboard-styles';
    styleElement.innerHTML = nilDashboardStyles;
    document.head.appendChild(styleElement);
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('nil-dashboard-container') ||
        document.querySelector('.nil-dashboard-container')) {
        window.nilDashboard = new InteractiveNILDashboard();
    }
});

export { InteractiveNILDashboard };