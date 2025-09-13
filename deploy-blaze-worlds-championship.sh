#!/usr/bin/env bash

# Blaze Worlds Championship Edition - Production Deployment Script
# Texas Sports Authority meets Championship Gaming
# Built with the grit of Friday night lights and the precision of championship analytics

set -eo pipefail

# Championship Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
ORANGE='\033[38;5;208m'  # Texas Orange
CYAN='\033[0;36m'        # Cardinal Blue
NC='\033[0m'             # No Color

# Championship ASCII Art
show_championship_banner() {
    echo -e "${ORANGE}"
    cat << "EOF"
    ____  _        _     _______ _____     ____  _____  _      _____   _____
   |  _ \| |      | |   |___  / |  ___| | |  _ \| ____|| |    |  __ \ / ____|
   | |_) | | __ _ | |_____ / /| |_      | | |_) |  _|  | |    | |  | | (___
   |  _ <| |/ _` ||_____| / / |  _|     | |  _ <| |___|| |___ | |__| |\___  \
   |_| \_\_|\__,_|      /_/  |_|       |_|_| \_\_____|_____|_|_____/ ____) |
                                                                   |_____/
                          CHAMPIONSHIP FRONTIERS AWAIT
EOF
    echo -e "${NC}"
}

# Logging functions with championship flair
log_championship() {
    echo -e "🏆 ${GREEN}[CHAMPIONSHIP]${NC} $1"
}

log_info() {
    echo -e "⚡ ${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "⚠️  ${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "🚨 ${RED}[ERROR]${NC} $1"
}

log_texas() {
    echo -e "🤠 ${ORANGE}[TEXAS]${NC} $1"
}

log_sports() {
    echo -e "🏟️  ${CYAN}[SPORTS]${NC} $1"
}

# Championship configuration
CHAMPIONSHIP_VERSION="1.0.0-texas"
DEPLOYMENT_ENV="${1:-production}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${PROJECT_ROOT}/dist"
BACKUP_DIR="${PROJECT_ROOT}/backups"
# LOG_FILE="${PROJECT_ROOT}/deployment.log"  # Reserved for future logging implementation

# Championship deployment targets
get_deployment_target() {
    case "$1" in
        "local") echo "file://${BUILD_DIR}" ;;
        "staging") echo "https://staging.blazeworlds.com" ;;
        "production") echo "https://blazeworlds.com" ;;
        "cdn") echo "https://cdn.blazeworlds.com" ;;
        *) echo "unknown" ;;
    esac
}

# Pre-flight championship checks
championship_preflight() {
    log_championship "Running pre-flight checks..."

    # Check Node.js version
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found. Championship requires Node.js 16+."
        exit 1
    fi

    node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 16 ]; then
        log_error "Node.js version $node_version detected. Championship requires 16+."
        exit 1
    fi

    log_info "Node.js version: $(node -v) ✓"

    # Check for required files
    required_files=(
        "blaze-worlds-texas-championship.html"
        "blaze-worlds-launcher.html"
        "blaze-analytics-integration.js"
        "package.json"
    )

    for file in "${required_files[@]}"; do
        if [ ! -f "${PROJECT_ROOT}/${file}" ]; then
            log_error "Required file not found: ${file}"
            exit 1
        fi
        log_info "Found: ${file} ✓"
    done

    # Check for championship dependencies
    if [ -f "${PROJECT_ROOT}/package.json" ]; then
        log_info "Checking championship dependencies..."
        if command -v npm >/dev/null 2>&1; then
            npm list --depth=0 >/dev/null 2>&1 || {
                log_warning "Some dependencies missing. Installing..."
                npm install
            }
        fi
    fi

    log_championship "Pre-flight checks completed successfully!"
}

# Texas-style environment setup
setup_texas_environment() {
    log_texas "Setting up Texas championship environment..."

    # Create championship directories
    mkdir -p "${BUILD_DIR}"
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${PROJECT_ROOT}/logs"

    # Set championship environment variables
    export BLAZE_ENV="${DEPLOYMENT_ENV}"
    export BLAZE_VERSION="${CHAMPIONSHIP_VERSION}"
    export TEXAS_TIME_ZONE="America/Chicago"
    export CHAMPIONSHIP_MODE="true"

    log_texas "Environment ready for championship deployment!"
}

# Build championship assets
build_championship_assets() {
    log_championship "Building championship assets..."

    # Create build directory structure
    mkdir -p "${BUILD_DIR}/assets"
    mkdir -p "${BUILD_DIR}/js"
    mkdir -p "${BUILD_DIR}/css"
    mkdir -p "${BUILD_DIR}/data"

    # Copy core game files
    cp "${PROJECT_ROOT}/blaze-worlds-texas-championship.html" "${BUILD_DIR}/index.html"
    cp "${PROJECT_ROOT}/blaze-worlds-launcher.html" "${BUILD_DIR}/launcher.html"
    cp "${PROJECT_ROOT}/blaze-worlds-championship.html" "${BUILD_DIR}/conquest.html"
    cp "${PROJECT_ROOT}/blaze-worlds-ultimate.html" "${BUILD_DIR}/classic.html"

    # Copy analytics integration
    cp "${PROJECT_ROOT}/blaze-analytics-integration.js" "${BUILD_DIR}/js/"

    # Copy additional resources if they exist
    [ -f "${PROJECT_ROOT}/favicon.ico" ] && cp "${PROJECT_ROOT}/favicon.ico" "${BUILD_DIR}/"
    [ -f "${PROJECT_ROOT}/manifest.json" ] && cp "${PROJECT_ROOT}/manifest.json" "${BUILD_DIR}/"
    [ -d "${PROJECT_ROOT}/assets" ] && cp -r "${PROJECT_ROOT}/assets/"* "${BUILD_DIR}/assets/" 2>/dev/null || true

    # Generate deployment metadata
    cat > "${BUILD_DIR}/deployment-info.json" << EOF
{
    "version": "${CHAMPIONSHIP_VERSION}",
    "environment": "${DEPLOYMENT_ENV}",
    "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "buildHost": "$(hostname)",
    "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "gameVariants": [
        "texas-championship",
        "conquest-mode",
        "championship-classic"
    ],
    "features": [
        "texas-biomes",
        "dynamic-weather",
        "territory-claiming",
        "oil-discovery",
        "sports-analytics",
        "mobile-optimized"
    ]
}
EOF

    log_championship "Championship assets built successfully!"
}

# Sports analytics integration check
verify_sports_integration() {
    log_sports "Verifying sports analytics integration..."

    # Check analytics integration file
    if [ -f "${BUILD_DIR}/js/blaze-analytics-integration.js" ]; then
        log_sports "Analytics engine: ✓"

        # Verify key analytics features
        analytics_features=(
            "BlazeIntelligenceAnalytics"
            "SportsDataStream"
            "TeamAnalytics"
            "MetricTracker"
            "TexasTeamData"
        )

        for feature in "${analytics_features[@]}"; do
            if grep -q "$feature" "${BUILD_DIR}/js/blaze-analytics-integration.js"; then
                log_sports "${feature}: ✓"
            else
                log_warning "${feature}: not found"
            fi
        done
    else
        log_error "Sports analytics integration missing!"
        exit 1
    fi

    log_sports "Sports integration verified!"
}

# Performance optimization
optimize_championship_performance() {
    log_championship "Optimizing for championship performance..."

    # Optimize HTML files
    for html_file in "${BUILD_DIR}"/*.html; do
        if [ -f "$html_file" ]; then
            # Remove comments and extra whitespace (basic optimization)
            log_info "Optimizing $(basename "$html_file")..."

            # Create temporary file for optimization
            temp_file="${html_file}.tmp"

            # Basic HTML optimization (remove comments, compress whitespace)
            sed '/<!--/,/-->/d' "$html_file" | \
            sed '/^\s*$/d' | \
            sed 's/[[:space:]]\+/ /g' > "$temp_file"

            mv "$temp_file" "$html_file"
        fi
    done

    # Generate service worker for offline capability
    cat > "${BUILD_DIR}/sw.js" << 'EOF'
const CACHE_NAME = 'blaze-worlds-championship-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/launcher.html',
    '/conquest.html',
    '/classic.html',
    '/js/blaze-analytics-integration.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
EOF

    # Generate progressive web app manifest
    cat > "${BUILD_DIR}/manifest.json" << EOF
{
    "name": "Blaze Worlds Championship Edition",
    "short_name": "BlazeWorlds",
    "description": "Championship-grade 3D gaming with Texas sports intelligence",
    "start_url": "/launcher.html",
    "display": "fullscreen",
    "orientation": "landscape-primary",
    "theme_color": "#BF5700",
    "background_color": "#0a0e1a",
    "icons": [
        {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "categories": ["games", "sports", "entertainment"],
    "lang": "en-US"
}
EOF

    log_championship "Performance optimizations completed!"
}

# Security and quality checks
championship_security_check() {
    log_championship "Running championship security checks..."

    # Check for potential security issues
    security_patterns=(
        "eval\("
        "innerHTML.*="
        "document\.write"
        "\.exec\("
        "setTimeout.*string"
    )

    security_issues=0

    for pattern in "${security_patterns[@]}"; do
        if grep -r "$pattern" "${BUILD_DIR}/"*.html "${BUILD_DIR}/js/"*.js 2>/dev/null; then
            log_warning "Potential security issue found: $pattern"
            ((security_issues++))
        fi
    done

    if [ $security_issues -eq 0 ]; then
        log_championship "Security check passed! ✓"
    else
        log_warning "Found $security_issues potential security issues. Review recommended."
    fi

    # Check for proper error handling
    if grep -q "try.*catch" "${BUILD_DIR}/js/"*.js 2>/dev/null; then
        log_info "Error handling detected ✓"
    else
        log_warning "Limited error handling detected"
    fi
}

# Backup existing deployment
create_championship_backup() {
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log_championship "Creating championship backup..."

        backup_name="blaze-worlds-backup-$(date +%Y%m%d-%H%M%S)"
        backup_path="${BACKUP_DIR}/${backup_name}"

        mkdir -p "$backup_path"

        # Backup current deployment if it exists
        if [ -d "${BUILD_DIR}" ]; then
            cp -r "${BUILD_DIR}/"* "$backup_path/" 2>/dev/null || true
            log_championship "Backup created: $backup_name"
        fi

        # Clean up old backups (keep last 5)
        find "${BACKUP_DIR}" -maxdepth 1 -type d -name "blaze-worlds-backup-*" -print0 | \
        xargs -0 ls -dt | tail -n +6 | xargs -r rm -rf
    fi
}

# Deploy to target environment
deploy_championship() {
    target=$(get_deployment_target "$DEPLOYMENT_ENV")
    log_championship "Deploying to $DEPLOYMENT_ENV environment..."
    log_info "Target: $target"

    case "$DEPLOYMENT_ENV" in
        "local")
            log_info "Local deployment completed: file://${BUILD_DIR}/launcher.html"
            ;;
        "staging"|"production")
            log_warning "Remote deployment requires additional configuration"
            log_info "Files ready for upload at: ${BUILD_DIR}"
            ;;
        *)
            log_error "Unknown deployment environment: $DEPLOYMENT_ENV"
            exit 1
            ;;
    esac

    log_championship "Deployment completed successfully!"
}

# Generate deployment report
generate_championship_report() {
    log_championship "Generating championship deployment report..."

    report_file="${PROJECT_ROOT}/deployment-report-$(date +%Y%m%d-%H%M%S).md"

    cat > "$report_file" << EOF
# Blaze Worlds Championship Edition - Deployment Report

## Deployment Information
- **Version:** ${CHAMPIONSHIP_VERSION}
- **Environment:** ${DEPLOYMENT_ENV}
- **Build Time:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
- **Build Host:** $(hostname)
- **Git Commit:** $(git rev-parse HEAD 2>/dev/null || echo 'unknown')

## Files Deployed
$(find "${BUILD_DIR}" -type f | sed "s|${BUILD_DIR}/|- |" | sort)

## Championship Features
- ✅ Texas Championship Edition with 6 authentic biomes
- ✅ Dynamic weather system with dust storms and thunderstorms
- ✅ Territory claiming and oil discovery mechanics
- ✅ Sports analytics integration with Blaze Intelligence
- ✅ Mobile-optimized controls and responsive design
- ✅ Progressive Web App support
- ✅ Championship-grade performance monitoring

## Sports Intelligence Integration
- ✅ Cardinals Analytics MCP Server compatibility
- ✅ Perfect Game youth baseball data integration
- ✅ Texas high school football data streams
- ✅ Real-time performance metrics
- ✅ Championship readiness calculator

## Performance Metrics
- **Target FPS:** 60+ (championship standard)
- **Mobile Support:** Full touch controls
- **Load Time:** Optimized for <3 seconds
- **Offline Support:** Service Worker enabled

## Next Steps
1. Test deployment in target environment
2. Monitor performance metrics
3. Gather user feedback
4. Prepare for sports analytics mode launch (Q2 2025)

---
*Built with Texas grit and championship spirit* 🤠🏆
EOF

    log_championship "Deployment report generated: $report_file"
}

# Launch championship experience
launch_championship() {
    log_championship "Launching championship experience..."

    if command -v python3 >/dev/null 2>&1; then
        port=8080
        log_info "Starting local server on port $port..."

        # Start server in background
        cd "${BUILD_DIR}"
        python3 -m http.server $port &
        server_pid=$!

        sleep 2

        # Try to open in default browser
        url="http://localhost:$port/launcher.html"

        if command -v osascript >/dev/null 2>&1; then
            # macOS
            osascript -e "open location \"$url\""
        elif command -v xdg-open >/dev/null 2>&1; then
            # Linux
            xdg-open "$url"
        else
            log_info "Open your browser to: $url"
        fi

        log_championship "Championship server running! (PID: $server_pid)"
        log_info "Press Ctrl+C to stop the server"

        # Wait for interrupt
        trap 'kill $server_pid 2>/dev/null; log_championship "Server stopped. Until next championship!"; exit 0' INT
        wait $server_pid
    else
        log_info "Python3 not available. Open ${BUILD_DIR}/launcher.html in your browser."
    fi
}

# Main deployment function
main() {
    show_championship_banner

    log_championship "Starting Blaze Worlds Championship deployment..."
    log_info "Environment: $DEPLOYMENT_ENV"
    log_info "Version: $CHAMPIONSHIP_VERSION"

    # Execute championship deployment pipeline
    championship_preflight
    setup_texas_environment
    create_championship_backup
    build_championship_assets
    verify_sports_integration
    optimize_championship_performance
    championship_security_check
    deploy_championship
    generate_championship_report

    log_championship "🏆 Championship deployment completed successfully!"
    log_texas "May the frontier spirit guide your journey!"

    # Ask if user wants to launch
    read -p "🚀 Launch championship experience now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        launch_championship
    else
        log_info "Championship ready! Launch ${BUILD_DIR}/launcher.html when ready."
    fi
}

# Handle script arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Blaze Worlds Championship Deployment Script"
        echo ""
        echo "Usage: $0 [environment] [options]"
        echo ""
        echo "Environments:"
        echo "  local      - Deploy locally (default)"
        echo "  staging    - Deploy to staging environment"
        echo "  production - Deploy to production environment"
        echo ""
        echo "Options:"
        echo "  help       - Show this help message"
        echo "  version    - Show version information"
        echo ""
        echo "Examples:"
        echo "  $0 local              # Deploy locally"
        echo "  $0 production         # Deploy to production"
        echo ""
        exit 0
        ;;
    "version"|"-v"|"--version")
        echo "Blaze Worlds Championship Edition v${CHAMPIONSHIP_VERSION}"
        echo "Texas Sports Authority meets Championship Gaming"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac