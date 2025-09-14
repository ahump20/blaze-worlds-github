/**
 * Blaze Intelligence Analytics Consolidation System
 * Championship Performance Tracking Across All Properties
 * From Perfect Game Youth to SEC Dominance
 */

const ANALYTICS_CONFIG = {
  // All Blaze Intelligence Properties
  properties: {
    main: {
      name: 'Blaze Intelligence Main',
      urls: [
        'https://blaze-intelligence.replit.app',
        'https://blaze-intelligence.netlify.app',
        'https://blaze-intelligence.com'
      ],
      type: 'landing',
      priority: 'critical'
    },
    visionEngine: {
      name: 'Championship Vision Engine',
      urls: [
        'https://70d41e32.blaze-intelligence-platform.pages.dev',
        'https://vision.blaze-intelligence.com'
      ],
      type: 'application',
      priority: 'critical'
    },
    coachDashboard: {
      name: 'Texas Coach Pipeline',
      urls: [
        'https://70d41e32.blaze-intelligence-platform.pages.dev/coach',
        'https://coach.blaze-intelligence.com'
      ],
      type: 'application',
      priority: 'high'
    },
    scoutingHub: {
      name: 'Elite Talent Discovery',
      urls: [
        'https://76c9e5b9.blaze-intelligence.pages.dev',
        'https://scout.blaze-intelligence.com'
      ],
      type: 'application',
      priority: 'high'
    },
    statisticsDashboard: {
      name: 'Live Championship Analytics',
      urls: [
        'https://blaze-intelligence-lsl.pages.dev/statistics-dashboard',
        'https://stats.blaze-intelligence.com'
      ],
      type: 'dashboard',
      priority: 'high'
    },
    fbsCoverage: {
      name: 'College Football Dominance',
      urls: [
        'https://blaze-intelligence-lsl.pages.dev/fbs-coverage-integration',
        'https://college.blaze-intelligence.com'
      ],
      type: 'application',
      priority: 'medium'
    },
    blazeWorlds: {
      name: 'Championship Gaming Platform',
      urls: [
        'https://a8c4d118-11e0-4a90-bcb7-2578261e3b27.spock.prod.repl.run',
        'https://worlds.blaze-intelligence.com'
      ],
      type: 'gaming',
      priority: 'medium'
    },
    blaze3D: {
      name: 'Immersive Sports Visualization',
      urls: [
        'https://blaze-3d.netlify.app',
        'https://3d.blaze-intelligence.com'
      ],
      type: 'visualization',
      priority: 'medium'
    },
    portfolio: {
      name: 'Founder Championship Story',
      urls: [
        'https://austin-humphrey-portfolio.pages.dev',
        'https://austin.blaze-intelligence.com'
      ],
      type: 'brand',
      priority: 'low'
    },
    videoShowcase: {
      name: 'Championship Moments Archive',
      urls: [
        'https://9fb73261.blaze-intelligence.pages.dev/video-showcase',
        'https://showcase.blaze-intelligence.com'
      ],
      type: 'showcase',
      priority: 'low'
    }
  },

  // Key Performance Indicators
  kpis: {
    engagement: [
      'session_duration',
      'pages_per_session',
      'bounce_rate',
      'return_visitor_rate'
    ],
    conversion: [
      'signup_rate',
      'trial_conversion',
      'video_analysis_requests',
      'demo_bookings'
    ],
    sports: [
      'championship_scores_calculated',
      'nil_valuations_generated',
      'perfect_game_integrations',
      'coach_signups'
    ],
    business: [
      'qualified_leads',
      'revenue_pipeline',
      'customer_acquisition_cost',
      'lifetime_value'
    ]
  },

  // Championship Goals (Weekly)
  championshipGoals: {
    visitors: 10000,
    videoAnalyses: 500,
    coachSignups: 50,
    nilValuations: 100,
    championshipScores: 1000,
    perfectGameIntegrations: 25
  }
};

/**
 * Unified Analytics Collector
 */
class BlazeAnalyticsCollector {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.propertyId = this.detectPropertyId();
    this.userId = this.getUserId();
    this.events = [];
    this.sessionStartTime = Date.now();

    this.initialize();
  }

  initialize() {
    // Set up event tracking
    this.trackPageViews();
    this.trackUserInteractions();
    this.trackChampionshipEvents();
    this.trackPerformanceMetrics();

    // Send data periodically
    setInterval(() => this.flushEvents(), 30000); // Every 30 seconds

    // Send on page unload
    window.addEventListener('beforeunload', () => this.flushEvents());

    console.log(`🔥 Blaze Analytics initialized for ${this.propertyId}`);
  }

  detectPropertyId() {
    const currentUrl = window.location.href;

    for (const [key, property] of Object.entries(ANALYTICS_CONFIG.properties)) {
      if (property.urls.some(url => currentUrl.includes(this.extractDomain(url)))) {
        return key;
      }
    }

    return 'unknown';
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  generateSessionId() {
    return `blz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUserId() {
    // Check for existing user ID
    let userId = localStorage.getItem('blaze_user_id');

    if (!userId) {
      userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('blaze_user_id', userId);
    }

    return userId;
  }

  /**
   * Track page views and navigation
   */
  trackPageViews() {
    // Initial page view
    this.trackEvent('page_view', {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer
    });

    // Track SPA navigation
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        this.trackEvent('page_change', {
          from: lastUrl,
          to: window.location.href,
          title: document.title
        });
        lastUrl = window.location.href;
      }
    }, 1000);
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    // Click tracking
    document.addEventListener('click', (event) => {
      const element = event.target;

      // Track CTAs
      if (element.matches('.cta, .btn-primary, .signup-btn, .get-started')) {
        this.trackEvent('cta_click', {
          text: element.textContent.trim(),
          type: 'cta',
          position: this.getElementPosition(element)
        });
      }

      // Track navigation
      if (element.matches('a[href]')) {
        const href = element.getAttribute('href');
        this.trackEvent('link_click', {
          text: element.textContent.trim(),
          href,
          type: this.isExternalLink(href) ? 'external' : 'internal'
        });
      }

      // Track video interactions
      if (element.matches('.video-play, .analysis-start, .vision-engine-btn')) {
        this.trackEvent('video_interaction', {
          action: 'start',
          type: element.dataset.videoType || 'analysis'
        });
      }
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const formType = form.dataset.form || 'unknown';

      this.trackEvent('form_submit', {
        type: formType,
        fields: this.getFormFields(form)
      });
    });

    // Scroll depth
    this.trackScrollDepth();
  }

  /**
   * Track championship-specific events
   */
  trackChampionshipEvents() {
    // Track when championship scores are displayed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Championship score display
            const scoreElements = node.querySelectorAll?.('.championship-score, .readiness-score');
            scoreElements?.forEach(el => {
              const score = parseFloat(el.textContent);
              if (score && !isNaN(score)) {
                this.trackEvent('championship_score_viewed', {
                  score,
                  category: this.getScoreCategory(score)
                });
              }
            });

            // NIL valuations
            const nilElements = node.querySelectorAll?.('.nil-valuation, .market-value');
            nilElements?.forEach(el => {
              const value = this.extractNumericalValue(el.textContent);
              if (value) {
                this.trackEvent('nil_valuation_viewed', {
                  value,
                  tier: this.getNILTier(value)
                });
              }
            });

            // Perfect Game data
            const pgElements = node.querySelectorAll?.('.perfect-game-data, .pg-ranking');
            pgElements?.forEach(el => {
              this.trackEvent('perfect_game_data_viewed', {
                type: el.dataset.pgType || 'ranking'
              });
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetrics() {
    // Web Vitals
    this.trackWebVitals();

    // Load times
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.trackEvent('page_load_time', {
        loadTime,
        property: this.propertyId
      });
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });
  }

  trackWebVitals() {
    // Use Web Vitals library if available
    if (typeof webVitals !== 'undefined') {
      webVitals.getCLS((metric) => this.trackEvent('web_vital', { name: 'CLS', value: metric.value }));
      webVitals.getFID((metric) => this.trackEvent('web_vital', { name: 'FID', value: metric.value }));
      webVitals.getFCP((metric) => this.trackEvent('web_vital', { name: 'FCP', value: metric.value }));
      webVitals.getLCP((metric) => this.trackEvent('web_vital', { name: 'LCP', value: metric.value }));
      webVitals.getTTFB((metric) => this.trackEvent('web_vital', { name: 'TTFB', value: metric.value }));
    }
  }

  trackScrollDepth() {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 100];
    const tracked = new Set();

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      maxScroll = Math.max(maxScroll, scrollPercent);

      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          this.trackEvent('scroll_depth', { depth: milestone });
        }
      });
    });
  }

  /**
   * Core event tracking
   */
  trackEvent(eventName, properties = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: this.sessionId,
      userId: this.userId,
      propertyId: this.propertyId,
      eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        sessionDuration: Date.now() - this.sessionStartTime
      }
    };

    this.events.push(event);

    // Immediate tracking for critical events
    const criticalEvents = ['signup', 'purchase', 'video_analysis_complete', 'championship_score_calculated'];
    if (criticalEvents.includes(eventName)) {
      this.sendEvent(event);
    }
  }

  /**
   * Send events to analytics backend
   */
  async flushEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch('https://api.blaze-intelligence.com/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          metadata: {
            propertyId: this.propertyId,
            sessionId: this.sessionId,
            batchSize: eventsToSend.length,
            timestamp: Date.now()
          }
        }),
        keepalive: true
      });

      console.log(`📊 Sent ${eventsToSend.length} analytics events`);

    } catch (error) {
      console.error('Analytics send failed:', error);
      // Re-queue events for retry
      this.events.unshift(...eventsToSend);
    }
  }

  async sendEvent(event) {
    try {
      await fetch('https://api.blaze-intelligence.com/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        keepalive: true
      });
    } catch (error) {
      console.error('Single event send failed:', error);
    }
  }

  /**
   * Helper methods
   */
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      fold: rect.top < window.innerHeight ? 'above' : 'below'
    };
  }

  isExternalLink(href) {
    if (!href || href.startsWith('#') || href.startsWith('/')) return false;

    try {
      const url = new URL(href, window.location.href);
      return url.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }

  getFormFields(form) {
    const formData = new FormData(form);
    const fields = {};

    for (const [key] of formData.entries()) {
      // Don't send actual values, just field names for privacy
      fields[key] = 'present';
    }

    return fields;
  }

  getScoreCategory(score) {
    if (score >= 90) return 'elite';
    if (score >= 80) return 'championship';
    if (score >= 70) return 'varsity';
    if (score >= 60) return 'developing';
    return 'baseline';
  }

  extractNumericalValue(text) {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : null;
  }

  getNILTier(value) {
    if (value >= 100000) return 'elite';
    if (value >= 50000) return 'power5';
    if (value >= 25000) return 'college';
    if (value >= 10000) return 'high_school';
    return 'development';
  }
}

/**
 * Championship Dashboard Data Aggregator
 */
class ChampionshipDashboard {
  constructor() {
    this.metrics = {};
    this.goals = ANALYTICS_CONFIG.championshipGoals;
    this.updateInterval = 300000; // 5 minutes

    this.initialize();
  }

  async initialize() {
    await this.loadMetrics();
    this.startPeriodicUpdates();
    this.displayDashboard();
  }

  async loadMetrics() {
    try {
      const response = await fetch('https://api.blaze-intelligence.com/analytics/dashboard');
      const data = await response.json();
      this.metrics = data.metrics;
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    }
  }

  startPeriodicUpdates() {
    setInterval(async () => {
      await this.loadMetrics();
      this.updateDisplay();
    }, this.updateInterval);
  }

  displayDashboard() {
    // Only show if we're on a dashboard page
    if (!window.location.href.includes('dashboard') && !window.location.href.includes('analytics')) {
      return;
    }

    const dashboardContainer = document.createElement('div');
    dashboardContainer.id = 'blaze-championship-dashboard';
    dashboardContainer.innerHTML = this.generateDashboardHTML();

    // Add styles
    this.injectDashboardStyles();

    // Add to page
    document.body.appendChild(dashboardContainer);

    this.updateDisplay();
  }

  generateDashboardHTML() {
    return `
      <div class="championship-header">
        <h2>🏆 Championship Analytics Dashboard</h2>
        <div class="last-updated">Last updated: <span id="last-updated-time">--</span></div>
      </div>

      <div class="metrics-grid">
        ${this.generateMetricCards()}
      </div>

      <div class="property-breakdown">
        <h3>Property Performance</h3>
        <div class="property-cards">
          ${this.generatePropertyCards()}
        </div>
      </div>

      <div class="goals-section">
        <h3>Championship Goals Progress</h3>
        <div class="goals-grid">
          ${this.generateGoalCards()}
        </div>
      </div>
    `;
  }

  generateMetricCards() {
    const metrics = [
      { key: 'totalVisitors', label: 'Total Visitors', icon: '👥' },
      { key: 'championshipScores', label: 'Championship Scores', icon: '🏆' },
      { key: 'videoAnalyses', label: 'Video Analyses', icon: '🎥' },
      { key: 'nilValuations', label: 'NIL Valuations', icon: '💰' },
      { key: 'coachSignups', label: 'Coach Signups', icon: '📋' },
      { key: 'perfectGameIntegrations', label: 'Perfect Game Data', icon: '⚾' }
    ];

    return metrics.map(metric => `
      <div class="metric-card">
        <div class="metric-icon">${metric.icon}</div>
        <div class="metric-value" id="metric-${metric.key}">--</div>
        <div class="metric-label">${metric.label}</div>
        <div class="metric-change" id="change-${metric.key}">--</div>
      </div>
    `).join('');
  }

  generatePropertyCards() {
    return Object.entries(ANALYTICS_CONFIG.properties).map(([key, property]) => `
      <div class="property-card" data-property="${key}">
        <div class="property-name">${property.name}</div>
        <div class="property-stats">
          <span class="stat">Visitors: <span id="visitors-${key}">--</span></span>
          <span class="stat">Engagement: <span id="engagement-${key}">--</span></span>
        </div>
        <div class="property-status" id="status-${key}">--</div>
      </div>
    `).join('');
  }

  generateGoalCards() {
    return Object.entries(this.goals).map(([key, goal]) => `
      <div class="goal-card">
        <div class="goal-label">${this.formatGoalLabel(key)}</div>
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-${key}" style="width: 0%"></div>
          </div>
          <div class="progress-text">
            <span id="current-${key}">0</span> / ${goal.toLocaleString()}
          </div>
        </div>
      </div>
    `).join('');
  }

  updateDisplay() {
    if (!this.metrics) return;

    // Update last updated time
    document.getElementById('last-updated-time').textContent = new Date().toLocaleTimeString();

    // Update metric cards
    Object.entries(this.metrics).forEach(([key, value]) => {
      const element = document.getElementById(`metric-${key}`);
      if (element) {
        element.textContent = this.formatNumber(value.current);
      }

      const changeElement = document.getElementById(`change-${key}`);
      if (changeElement && value.change !== undefined) {
        const changePercent = value.change;
        changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
        changeElement.className = `metric-change ${changePercent > 0 ? 'positive' : 'negative'}`;
      }
    });

    // Update goals progress
    Object.entries(this.goals).forEach(([key, goal]) => {
      const current = this.metrics[key]?.current || 0;
      const percentage = Math.min(100, (current / goal) * 100);

      const progressBar = document.getElementById(`progress-${key}`);
      const currentSpan = document.getElementById(`current-${key}`);

      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (currentSpan) currentSpan.textContent = this.formatNumber(current);
    });
  }

  injectDashboardStyles() {
    if (document.getElementById('championship-dashboard-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'championship-dashboard-styles';
    styles.textContent = `
      #blaze-championship-dashboard {
        position: fixed;
        top: 70px;
        right: 20px;
        width: 400px;
        background: linear-gradient(135deg, rgba(10, 10, 10, 0.95), rgba(26, 26, 46, 0.95));
        border: 1px solid #BF5700;
        border-radius: 12px;
        padding: 20px;
        z-index: 9999;
        font-family: 'Inter', sans-serif;
        max-height: 80vh;
        overflow-y: auto;
        backdrop-filter: blur(10px);
      }

      .championship-header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(191, 87, 0, 0.3);
        padding-bottom: 15px;
      }

      .championship-header h2 {
        color: #BF5700;
        margin: 0 0 5px 0;
        font-size: 18px;
      }

      .last-updated {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 20px;
      }

      .metric-card {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid rgba(155, 203, 235, 0.2);
      }

      .metric-icon {
        font-size: 24px;
        margin-bottom: 8px;
      }

      .metric-value {
        font-size: 20px;
        font-weight: bold;
        color: #9BCBEB;
        margin-bottom: 5px;
      }

      .metric-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-change {
        font-size: 10px;
        margin-top: 5px;
      }

      .metric-change.positive { color: #00ff00; }
      .metric-change.negative { color: #ff4444; }

      .property-breakdown h3,
      .goals-section h3 {
        color: #FF6B35;
        font-size: 14px;
        margin: 15px 0 10px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .property-cards,
      .goals-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .property-card,
      .goal-card {
        background: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 6px;
        border-left: 3px solid #BF5700;
      }

      .property-name {
        color: white;
        font-weight: 600;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .property-stats {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
      }

      .goal-label {
        color: white;
        font-size: 12px;
        margin-bottom: 8px;
      }

      .progress-bar {
        background: rgba(255, 255, 255, 0.1);
        height: 6px;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 5px;
      }

      .progress-fill {
        background: linear-gradient(90deg, #BF5700, #FF6B35);
        height: 100%;
        transition: width 0.5s ease;
      }

      .progress-text {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        text-align: right;
      }
    `;

    document.head.appendChild(styles);
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatGoalLabel(key) {
    return key.replace(/([A-Z])/g, ' $1')
             .replace(/^./, str => str.toUpperCase())
             .trim();
  }
}

// Initialize analytics on page load
window.addEventListener('DOMContentLoaded', () => {
  window.blazeAnalytics = new BlazeAnalyticsCollector();

  // Initialize dashboard if on analytics page
  if (window.location.href.includes('dashboard') || window.location.href.includes('analytics')) {
    window.championshipDashboard = new ChampionshipDashboard();
  }

  console.log('🔥 Blaze Intelligence Analytics System Active');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BlazeAnalyticsCollector,
    ChampionshipDashboard,
    ANALYTICS_CONFIG
  };
}