/**
 * Blaze Intelligence Platform Master Router
 * Unified Navigation & Authentication System
 * Championship-Level Platform Architecture
 */

const BLAZE_PROPERTIES = {
  // Primary Domains
  main: {
    production: 'https://blaze-intelligence.com',
    staging: 'https://blaze-intelligence.netlify.app',
    development: 'https://blaze-intelligence.replit.app'
  },

  // Specialized Applications
  applications: {
    visionEngine: {
      url: 'https://vision.blaze-intelligence.com',
      fallback: 'https://70d41e32.blaze-intelligence-platform.pages.dev',
      description: 'Championship Video Analysis Platform',
      requiredRole: ['coach', 'scout', 'athlete', 'admin']
    },
    coachDashboard: {
      url: 'https://coach.blaze-intelligence.com',
      fallback: 'https://70d41e32.blaze-intelligence-platform.pages.dev/coach',
      description: 'Texas High School to SEC Pipeline',
      requiredRole: ['coach', 'admin']
    },
    scoutingHub: {
      url: 'https://scout.blaze-intelligence.com',
      fallback: 'https://76c9e5b9.blaze-intelligence.pages.dev',
      description: 'Elite Talent Discovery System',
      requiredRole: ['scout', 'recruiter', 'admin']
    },
    statisticsDashboard: {
      url: 'https://stats.blaze-intelligence.com',
      fallback: 'https://blaze-intelligence-lsl.pages.dev/statistics-dashboard',
      description: 'Real-Time Championship Analytics',
      requiredRole: ['all']
    },
    fbsCoverage: {
      url: 'https://college.blaze-intelligence.com',
      fallback: 'https://blaze-intelligence-lsl.pages.dev/fbs-coverage-integration',
      description: 'FBS & SEC Dominance Tracking',
      requiredRole: ['scout', 'coach', 'admin']
    },
    blazeWorlds: {
      url: 'https://worlds.blaze-intelligence.com',
      fallback: 'https://a8c4d118-11e0-4a90-bcb7-2578261e3b27.spock.prod.repl.run',
      description: 'Championship Gaming Experience',
      requiredRole: ['all']
    },
    blaze3D: {
      url: 'https://3d.blaze-intelligence.com',
      fallback: 'https://blaze-3d.netlify.app',
      description: 'Immersive Sports Visualization',
      requiredRole: ['all']
    },
    portfolio: {
      url: 'https://austin.blaze-intelligence.com',
      fallback: 'https://austin-humphrey-portfolio.pages.dev',
      description: 'Founder & Championship Vision',
      requiredRole: ['public']
    },
    videoShowcase: {
      url: 'https://showcase.blaze-intelligence.com',
      fallback: 'https://9fb73261.blaze-intelligence.pages.dev/video-showcase',
      description: 'Championship Moments Archive',
      requiredRole: ['all']
    }
  },

  // API Endpoints
  apis: {
    main: 'https://api.blaze-intelligence.com',
    vision: 'https://vision-api.blaze-intelligence.com',
    cardinals: 'https://cardinals.blaze-intelligence.com',
    nil: 'https://nil.blaze-intelligence.com'
  },

  // CDN Resources
  cdn: {
    assets: 'https://cdn.blaze-intelligence.com',
    videos: 'https://videos.blaze-intelligence.com',
    analytics: 'https://analytics.blaze-intelligence.com'
  }
};

/**
 * Unified Authentication System
 */
class BlazeAuthSystem {
  constructor() {
    this.currentUser = null;
    this.sessionToken = null;
    this.permissions = [];
    this.initializeAuth();
  }

  async initializeAuth() {
    // Check for existing session across all properties
    const storedSession = this.getStoredSession();

    if (storedSession) {
      await this.validateSession(storedSession);
    }

    // Set up cross-domain communication
    this.setupCrossDomainMessaging();
  }

  getStoredSession() {
    // Check multiple storage locations
    const sources = [
      localStorage.getItem('blaze_session'),
      sessionStorage.getItem('blaze_session'),
      this.getCookie('blaze_session')
    ];

    for (const source of sources) {
      if (source) {
        try {
          return JSON.parse(source);
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  async validateSession(session) {
    try {
      const response = await fetch(`${BLAZE_PROPERTIES.apis.main}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        this.currentUser = userData.user;
        this.sessionToken = session.token;
        this.permissions = userData.permissions;
        this.syncSessionAcrossProperties();
        return true;
      }
    } catch (error) {
      console.error('Session validation failed:', error);
    }

    this.clearSession();
    return false;
  }

  syncSessionAcrossProperties() {
    const sessionData = {
      token: this.sessionToken,
      user: this.currentUser,
      permissions: this.permissions,
      timestamp: Date.now()
    };

    // Store in multiple locations for redundancy
    localStorage.setItem('blaze_session', JSON.stringify(sessionData));
    sessionStorage.setItem('blaze_session', JSON.stringify(sessionData));
    this.setCookie('blaze_session', JSON.stringify(sessionData), 7);

    // Broadcast to other tabs/windows
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('blaze_auth');
      channel.postMessage({ type: 'session_sync', data: sessionData });
    }
  }

  setupCrossDomainMessaging() {
    // Listen for auth messages from other Blaze properties
    window.addEventListener('message', (event) => {
      // Verify origin is a Blaze property
      const trustedOrigins = [
        ...Object.values(BLAZE_PROPERTIES.main),
        ...Object.values(BLAZE_PROPERTIES.applications).map(app => app.fallback)
      ];

      if (!trustedOrigins.some(origin => event.origin.startsWith(origin))) {
        return;
      }

      if (event.data.type === 'blaze_auth_sync') {
        this.handleAuthSync(event.data.payload);
      }
    });
  }

  handleAuthSync(payload) {
    if (payload.action === 'login') {
      this.currentUser = payload.user;
      this.sessionToken = payload.token;
      this.permissions = payload.permissions;
      this.syncSessionAcrossProperties();
    } else if (payload.action === 'logout') {
      this.clearSession();
    }
  }

  clearSession() {
    this.currentUser = null;
    this.sessionToken = null;
    this.permissions = [];

    localStorage.removeItem('blaze_session');
    sessionStorage.removeItem('blaze_session');
    this.deleteCookie('blaze_session');

    // Broadcast logout to other properties
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('blaze_auth');
      channel.postMessage({ type: 'logout' });
    }
  }

  hasPermission(requiredRoles) {
    if (requiredRoles.includes('all') || requiredRoles.includes('public')) {
      return true;
    }

    if (!this.currentUser) {
      return false;
    }

    return requiredRoles.some(role =>
      this.permissions.includes(role) || this.permissions.includes('admin')
    );
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; domain=.blaze-intelligence.com; secure; samesite=lax`;
  }

  deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.blaze-intelligence.com`;
  }
}

/**
 * Intelligent Platform Router
 */
class BlazePlatformRouter {
  constructor() {
    this.auth = new BlazeAuthSystem();
    this.currentProperty = this.detectCurrentProperty();
    this.setupRouting();
  }

  detectCurrentProperty() {
    const currentUrl = window.location.href;

    for (const [key, app] of Object.entries(BLAZE_PROPERTIES.applications)) {
      if (currentUrl.includes(app.url) || currentUrl.includes(app.fallback)) {
        return key;
      }
    }

    return 'main';
  }

  setupRouting() {
    // Intercept navigation to handle cross-property routing
    this.interceptNavigation();

    // Set up unified navigation menu
    this.createUnifiedNavigation();

    // Handle deep linking
    this.handleDeepLinks();
  }

  interceptNavigation() {
    // Override default link behavior for Blaze properties
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Check if it's a Blaze property link
      const targetProperty = this.identifyTargetProperty(href);
      if (targetProperty) {
        event.preventDefault();
        this.navigateToProperty(targetProperty, href);
      }
    });
  }

  identifyTargetProperty(url) {
    for (const [key, app] of Object.entries(BLAZE_PROPERTIES.applications)) {
      if (url.includes(app.url) || url.includes(app.fallback)) {
        return key;
      }
    }
    return null;
  }

  navigateToProperty(propertyKey, targetUrl) {
    const property = BLAZE_PROPERTIES.applications[propertyKey];

    // Check permissions
    if (!this.auth.hasPermission(property.requiredRole)) {
      this.showAccessDenied(property);
      return;
    }

    // Prepare session handoff
    const handoffData = {
      token: this.auth.sessionToken,
      user: this.auth.currentUser,
      source: this.currentProperty,
      timestamp: Date.now()
    };

    // Encode handoff data
    const handoffParam = btoa(JSON.stringify(handoffData));

    // Navigate with session handoff
    const separator = targetUrl.includes('?') ? '&' : '?';
    window.location.href = `${targetUrl}${separator}blaze_handoff=${handoffParam}`;
  }

  createUnifiedNavigation() {
    // Don't create nav if it already exists
    if (document.getElementById('blaze-unified-nav')) return;

    const nav = document.createElement('div');
    nav.id = 'blaze-unified-nav';
    nav.innerHTML = this.generateNavigationHTML();

    // Add styles
    this.injectNavigationStyles();

    // Insert at top of body
    document.body.insertBefore(nav, document.body.firstChild);

    // Adjust page content
    document.body.style.paddingTop = '60px';

    // Activate current section
    this.highlightCurrentSection();
  }

  generateNavigationHTML() {
    const isAuthenticated = !!this.auth.currentUser;

    return `
      <div class="blaze-nav-container">
        <div class="blaze-nav-brand">
          <a href="${BLAZE_PROPERTIES.main.production}" class="blaze-logo">
            🔥 BLAZE INTELLIGENCE
          </a>
          <span class="blaze-tagline">Championship Intelligence Platform</span>
        </div>

        <nav class="blaze-nav-menu">
          ${this.generateMenuItems()}
        </nav>

        <div class="blaze-nav-user">
          ${isAuthenticated ? this.generateUserMenu() : this.generateAuthButtons()}
        </div>
      </div>
    `;
  }

  generateMenuItems() {
    const items = [];

    for (const [key, app] of Object.entries(BLAZE_PROPERTIES.applications)) {
      if (this.auth.hasPermission(app.requiredRole)) {
        const isActive = this.currentProperty === key;
        items.push(`
          <a href="${app.url || app.fallback}"
             class="blaze-nav-item ${isActive ? 'active' : ''}"
             title="${app.description}">
            ${this.getPropertyIcon(key)} ${this.getPropertyName(key)}
          </a>
        `);
      }
    }

    return items.join('');
  }

  generateUserMenu() {
    const user = this.auth.currentUser;
    return `
      <div class="blaze-user-menu">
        <span class="blaze-user-name">${user.name}</span>
        <span class="blaze-user-role">${user.role}</span>
        <button class="blaze-logout-btn" onclick="blazeAuth.logout()">Logout</button>
      </div>
    `;
  }

  generateAuthButtons() {
    return `
      <div class="blaze-auth-buttons">
        <a href="${BLAZE_PROPERTIES.main.production}/login" class="blaze-login-btn">Login</a>
        <a href="${BLAZE_PROPERTIES.main.production}/signup" class="blaze-signup-btn">Get Started</a>
      </div>
    `;
  }

  getPropertyIcon(key) {
    const icons = {
      visionEngine: '🎥',
      coachDashboard: '📋',
      scoutingHub: '🔍',
      statisticsDashboard: '📊',
      fbsCoverage: '🏈',
      blazeWorlds: '🎮',
      blaze3D: '🎭',
      portfolio: '👤',
      videoShowcase: '🏆'
    };
    return icons[key] || '📱';
  }

  getPropertyName(key) {
    const names = {
      visionEngine: 'Vision',
      coachDashboard: 'Coach',
      scoutingHub: 'Scout',
      statisticsDashboard: 'Stats',
      fbsCoverage: 'College',
      blazeWorlds: 'Worlds',
      blaze3D: '3D',
      portfolio: 'About',
      videoShowcase: 'Showcase'
    };
    return names[key] || key;
  }

  injectNavigationStyles() {
    if (document.getElementById('blaze-nav-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'blaze-nav-styles';
    styles.textContent = `
      #blaze-unified-nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: linear-gradient(90deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
        border-bottom: 2px solid #BF5700;
        z-index: 10000;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .blaze-nav-container {
        max-width: 1400px;
        margin: 0 auto;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
      }

      .blaze-nav-brand {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .blaze-logo {
        font-size: 18px;
        font-weight: 900;
        color: #BF5700;
        text-decoration: none;
        letter-spacing: 1px;
      }

      .blaze-tagline {
        color: #9BCBEB;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
      }

      .blaze-nav-menu {
        display: flex;
        gap: 5px;
        align-items: center;
      }

      .blaze-nav-item {
        padding: 8px 16px;
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        border-radius: 6px;
        transition: all 0.3s ease;
        position: relative;
      }

      .blaze-nav-item:hover {
        background: rgba(191, 87, 0, 0.2);
        color: #FF6B35;
      }

      .blaze-nav-item.active {
        background: rgba(191, 87, 0, 0.3);
        color: #FF6B35;
      }

      .blaze-nav-item.active::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 10%;
        right: 10%;
        height: 2px;
        background: #BF5700;
      }

      .blaze-nav-user {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .blaze-user-menu {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .blaze-user-name {
        color: white;
        font-weight: 600;
      }

      .blaze-user-role {
        color: #9BCBEB;
        font-size: 12px;
        text-transform: uppercase;
        padding: 2px 8px;
        background: rgba(155, 203, 235, 0.1);
        border-radius: 4px;
      }

      .blaze-logout-btn {
        padding: 6px 12px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .blaze-logout-btn:hover {
        border-color: #BF5700;
        color: #BF5700;
      }

      .blaze-auth-buttons {
        display: flex;
        gap: 10px;
      }

      .blaze-login-btn {
        padding: 8px 16px;
        color: white;
        text-decoration: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        transition: all 0.3s ease;
      }

      .blaze-login-btn:hover {
        border-color: #9BCBEB;
        color: #9BCBEB;
      }

      .blaze-signup-btn {
        padding: 8px 16px;
        background: #BF5700;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .blaze-signup-btn:hover {
        background: #FF6B35;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(191, 87, 0, 0.4);
      }

      @media (max-width: 768px) {
        .blaze-tagline {
          display: none;
        }

        .blaze-nav-menu {
          display: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  highlightCurrentSection() {
    const navItems = document.querySelectorAll('.blaze-nav-item');
    navItems.forEach(item => {
      if (item.href === window.location.href) {
        item.classList.add('active');
      }
    });
  }

  showAccessDenied(property) {
    alert(`Championship Access Required\n\nYou need ${property.requiredRole.join(' or ')} permissions to access ${property.description}.\n\nContact your administrator for access.`);
  }

  handleDeepLinks() {
    // Check for handoff parameter
    const urlParams = new URLSearchParams(window.location.search);
    const handoff = urlParams.get('blaze_handoff');

    if (handoff) {
      try {
        const handoffData = JSON.parse(atob(handoff));

        // Validate handoff timestamp (5 minute window)
        if (Date.now() - handoffData.timestamp < 300000) {
          this.auth.currentUser = handoffData.user;
          this.auth.sessionToken = handoffData.token;
          this.auth.syncSessionAcrossProperties();
        }

        // Clean URL
        urlParams.delete('blaze_handoff');
        const cleanUrl = window.location.pathname +
          (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', cleanUrl);

      } catch (error) {
        console.error('Invalid handoff data:', error);
      }
    }
  }
}

/**
 * Analytics Tracker
 */
class BlazeAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.propertyName = new BlazePlatformRouter().currentProperty;
    this.startTracking();
  }

  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  startTracking() {
    // Track page views
    this.trackPageView();

    // Track navigation events
    this.trackNavigation();

    // Track user interactions
    this.trackInteractions();

    // Send heartbeat
    this.sendHeartbeat();
  }

  trackPageView() {
    this.sendEvent('page_view', {
      property: this.propertyName,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }

  trackNavigation() {
    // Track internal navigation
    let lastUrl = window.location.href;

    setInterval(() => {
      if (window.location.href !== lastUrl) {
        this.sendEvent('navigation', {
          from: lastUrl,
          to: window.location.href,
          property: this.propertyName
        });
        lastUrl = window.location.href;
      }
    }, 1000);
  }

  trackInteractions() {
    // Track clicks on key elements
    document.addEventListener('click', (event) => {
      const target = event.target;

      // Track CTA clicks
      if (target.matches('.cta, .btn-primary, [data-track]')) {
        this.sendEvent('cta_click', {
          element: target.textContent,
          property: this.propertyName,
          url: window.location.href
        });
      }
    });
  }

  sendHeartbeat() {
    // Send heartbeat every 30 seconds to track engagement
    setInterval(() => {
      this.sendEvent('heartbeat', {
        property: this.propertyName,
        sessionDuration: Date.now() - parseInt(this.sessionId.split('_')[0])
      });
    }, 30000);
  }

  async sendEvent(eventType, data) {
    try {
      await fetch(`${BLAZE_PROPERTIES.apis.main}/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          eventType,
          data,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
}

/**
 * Initialize Blaze Platform
 */
window.addEventListener('DOMContentLoaded', () => {
  // Initialize platform router
  window.blazeRouter = new BlazePlatformRouter();

  // Initialize analytics
  window.blazeAnalytics = new BlazeAnalytics();

  // Initialize auth globally
  window.blazeAuth = window.blazeRouter.auth;

  console.log('🔥 Blaze Intelligence Platform Initialized');
  console.log(`📍 Current Property: ${window.blazeRouter.currentProperty}`);
  console.log(`👤 Authenticated: ${!!window.blazeAuth.currentUser}`);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BLAZE_PROPERTIES,
    BlazeAuthSystem,
    BlazePlatformRouter,
    BlazeAnalytics
  };
}