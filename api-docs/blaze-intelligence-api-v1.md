# Blaze Intelligence API Documentation v1.0

**Championship-level Sports Intelligence APIs**

*From Friday night lights to championship stadiums - accessing the data that drives athletic excellence.*

---

## Table of Contents

- [Authentication](#authentication)
- [Vision AI Endpoints](#vision-ai-endpoints)
- [Sports Data Endpoints](#sports-data-endpoints)
- [ROI Calculator Endpoints](#roi-calculator-endpoints)
- [NIL Analytics Endpoints](#nil-analytics-endpoints)
- [Performance Metrics](#performance-metrics)
- [Webhooks](#webhooks)
- [Rate Limits](#rate-limits)
- [Error Handling](#error-handling)
- [SDKs and Libraries](#sdks-and-libraries)
- [Code Examples](#code-examples)

---

## Authentication

The Blaze Intelligence API uses API keys for authentication. All requests must include your API key in the `Authorization` header.

```bash
Authorization: Bearer YOUR_API_KEY
```

### Getting Your API Key

1. Sign up at [portal.blaze-intelligence.com](https://portal.blaze-intelligence.com)
2. Navigate to Settings → API Keys
3. Generate a new key for your application
4. Store securely (keys cannot be recovered)

### API Key Scopes

| Scope | Description | Use Cases |
|-------|-------------|-----------|
| `vision:read` | Access Vision AI analysis results | Video analysis, player assessment |
| `vision:analyze` | Submit videos for analysis | Real-time coaching, biomechanics |
| `data:read` | Access sports data and statistics | Performance tracking, analytics |
| `roi:calculate` | Use ROI calculator endpoints | Business analysis, proposals |
| `nil:read` | Access NIL market data | Athlete valuations, market trends |
| `nil:analyze` | Perform NIL calculations | Deal negotiations, brand partnerships |
| `webhooks:manage` | Manage webhook subscriptions | Real-time integrations |

---

## Vision AI Endpoints

### Analyze Video Stream

**POST** `/api/v1/vision/analyze`

Analyze video content for biomechanics, micro-expressions, and character assessment.

```bash
curl -X POST "https://api.blaze-intelligence.com/v1/vision/analyze" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/video.mp4",
    "analysis_types": ["biomechanics", "micro_expressions", "character"],
    "sport": "football",
    "position": "quarterback",
    "real_time": false
  }'
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `video_url` | string | Yes | URL to video file (MP4, MOV, AVI) |
| `analysis_types` | array | Yes | Types of analysis: `biomechanics`, `micro_expressions`, `character` |
| `sport` | string | No | Sport type for context |
| `position` | string | No | Player position for targeted analysis |
| `real_time` | boolean | No | Enable real-time streaming analysis |
| `confidence_threshold` | float | No | Minimum confidence (0.0-1.0, default: 0.85) |

**Response:**

```json
{
  "analysis_id": "va_ChZgHx7829bHdK",
  "status": "completed",
  "results": {
    "biomechanics": {
      "overall_score": 87.3,
      "mechanics_breakdown": {
        "throwing_motion": {
          "score": 92.1,
          "accuracy": 0.94,
          "efficiency": 0.89,
          "recommendations": [
            "Slight hip rotation adjustment for increased velocity",
            "Follow-through consistency improved by 12%"
          ]
        },
        "footwork": {
          "score": 83.7,
          "balance": 0.91,
          "timing": 0.87
        }
      }
    },
    "micro_expressions": {
      "confidence": 94.2,
      "focus": 88.7,
      "pressure_response": 91.3,
      "leadership_indicators": 85.9
    },
    "character_analysis": {
      "grit_score": 89.4,
      "determination": 92.1,
      "teamwork": 87.6,
      "coachability": 94.3
    }
  },
  "championship_metrics": {
    "readiness_score": 89.1,
    "clutch_factor": 87.8,
    "development_potential": 91.2
  },
  "processing_time_ms": 2847,
  "timestamp": "2024-09-13T20:45:32Z"
}
```

### Get Analysis Results

**GET** `/api/v1/vision/analysis/{analysis_id}`

Retrieve results from a previous video analysis.

**Response:**
Same format as analyze endpoint response.

### List Analysis History

**GET** `/api/v1/vision/analyses`

Get paginated list of all video analyses.

**Query Parameters:**
- `limit` (int): Number of results (max 100, default 20)
- `offset` (int): Pagination offset
- `sport` (string): Filter by sport
- `date_from` (string): ISO date filter
- `date_to` (string): ISO date filter

---

## Sports Data Endpoints

### Get Team Data

**GET** `/api/v1/sports/teams/{team_id}`

Retrieve comprehensive team data with championship metrics.

```bash
curl -X GET "https://api.blaze-intelligence.com/v1/sports/teams/cardinals" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**

```json
{
  "team": {
    "id": "cardinals",
    "name": "St. Louis Cardinals",
    "sport": "mlb",
    "league": "National League",
    "division": "NL Central"
  },
  "current_season": {
    "wins": 78,
    "losses": 67,
    "win_percentage": 0.538,
    "games_remaining": 17
  },
  "championship_metrics": {
    "readiness_score": 84.2,
    "playoff_probability": 67.3,
    "world_series_odds": 12.8,
    "strength_of_schedule": 0.523
  },
  "recent_performance": {
    "last_10_games": "7-3",
    "home_record": "42-30",
    "road_record": "36-37",
    "vs_division": "32-23"
  },
  "key_players": [
    {
      "name": "Nolan Arenado",
      "position": "3B",
      "championship_value": 91.7,
      "clutch_rating": 88.2
    }
  ],
  "last_updated": "2024-09-13T20:30:15Z"
}
```

### Get Player Stats

**GET** `/api/v1/sports/players/{player_id}`

Individual player statistics and championship metrics.

### Get Live Games

**GET** `/api/v1/sports/games/live`

Currently active games across all sports.

**Response:**

```json
{
  "games": [
    {
      "game_id": "mlb_2024091301",
      "sport": "mlb",
      "home_team": "Cardinals",
      "away_team": "Cubs",
      "score": {
        "home": 4,
        "away": 2
      },
      "inning": 8,
      "inning_state": "Bottom",
      "championship_impact": 7.2
    }
  ],
  "total_games": 1,
  "last_updated": "2024-09-13T21:15:42Z"
}
```

### Perfect Game Integration

**GET** `/api/v1/sports/perfect-game/tournaments`

Youth baseball tournament and prospect data.

**GET** `/api/v1/sports/perfect-game/prospects`

Top prospects with championship potential scores.

---

## ROI Calculator Endpoints

### Calculate ROI

**POST** `/api/v1/roi/calculate`

Perform comprehensive ROI analysis for sports intelligence investments.

```bash
curl -X POST "https://api.blaze-intelligence.com/v1/roi/calculate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "program_type": "college",
    "team_size": 85,
    "games_per_season": 12,
    "current_budget": 8500000,
    "sport": "football",
    "current_solutions": ["hudl", "catapult"],
    "goals": ["championship", "recruiting"]
  }'
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `program_type` | string | Yes | `youth`, `high_school`, `college`, `professional` |
| `team_size` | integer | Yes | Number of athletes (1-200) |
| `games_per_season` | integer | Yes | Games per season (1-200) |
| `current_budget` | integer | Yes | Annual budget in dollars |
| `sport` | string | No | Primary sport |
| `current_solutions` | array | No | Existing solutions: `hudl`, `krossover`, `catapult` |
| `goals` | array | No | Program goals: `championship`, `recruiting`, `development` |

**Response:**

```json
{
  "roi_analysis": {
    "total_investment": 157500,
    "annual_benefits": 892000,
    "cost_savings": 143000,
    "roi_percentage": 567,
    "payback_period_months": 2.1,
    "three_year_value": 2518500
  },
  "breakdown": {
    "efficiency_gains": {
      "coaching_time_savings": 156000,
      "recruiting_efficiency": 89000,
      "injury_prevention": 127000,
      "player_development": 245000
    },
    "competitive_advantages": {
      "championship_probability": 75000,
      "recruiting_advantage": 125000,
      "revenue_generation": 89000
    }
  },
  "recommendations": [
    {
      "type": "tier",
      "title": "Championship Tier Recommended",
      "description": "Optimal value for your program size and goals",
      "annual_cost": 147500
    }
  ],
  "texas_bonus": 15,
  "championship_multiplier": 1.25,
  "calculation_id": "roi_ChZgHx7829bHdK",
  "timestamp": "2024-09-13T20:45:32Z"
}
```

### Get ROI Presets

**GET** `/api/v1/roi/presets`

Pre-configured ROI scenarios for common program types.

### ROI Comparison

**POST** `/api/v1/roi/compare`

Compare ROI across multiple scenarios or competitor solutions.

---

## NIL Analytics Endpoints

### Get Athlete Valuation

**GET** `/api/v1/nil/athletes/{athlete_id}/valuation`

Comprehensive NIL valuation for college athletes.

```bash
curl -X GET "https://api.blaze-intelligence.com/v1/nil/athletes/tx_qb_001/valuation" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**

```json
{
  "athlete": {
    "id": "tx_qb_001",
    "name": "Jake Martinez",
    "school": "University of Texas",
    "sport": "football",
    "position": "quarterback",
    "year": "junior"
  },
  "valuation": {
    "estimated_value": 185000,
    "calculated_value": 197500,
    "growth_rate": 0.23,
    "market_rank": 47,
    "sport_rank": 12
  },
  "breakdown": {
    "performance_value": 67500,
    "social_media_value": 45200,
    "market_value": 58300,
    "regional_premium": 26500
  },
  "social_metrics": {
    "instagram_followers": 125000,
    "tiktok_followers": 89000,
    "twitter_followers": 67000,
    "youtube_subscribers": 23000,
    "engagement_rate": 0.067
  },
  "current_deals": [
    {
      "brand": "Nike",
      "value": 25000,
      "type": "apparel",
      "duration_months": 12,
      "signed_date": "2024-08-15"
    }
  ],
  "market_factors": {
    "performance_score": 92,
    "marketability": 88,
    "character_score": 94,
    "championship_potential": 87
  },
  "last_updated": "2024-09-13T19:30:22Z"
}
```

### Market Trends

**GET** `/api/v1/nil/market/trends`

NIL market trends and analytics.

**Response:**

```json
{
  "market_overview": {
    "total_market_value": 1200000000,
    "active_athletes": 495000,
    "average_deal_value": 1650,
    "market_growth": 0.152
  },
  "sport_breakdown": [
    {
      "sport": "football",
      "market_share": 0.42,
      "average_value": 3200,
      "top_position": "quarterback"
    },
    {
      "sport": "basketball",
      "market_share": 0.28,
      "average_value": 2800,
      "top_position": "point_guard"
    }
  ],
  "trending_athletes": [
    {
      "athlete_id": "tx_qb_001",
      "growth_rate": 0.45,
      "reason": "Championship game performance"
    }
  ],
  "platform_analytics": {
    "instagram_roi": 0.15,
    "tiktok_roi": 0.12,
    "twitter_roi": 0.08,
    "youtube_roi": 0.25
  },
  "timestamp": "2024-09-13T21:00:15Z"
}
```

### Brand Partnership Opportunities

**GET** `/api/v1/nil/opportunities`

Matching athletes with potential brand partnerships.

**Query Parameters:**
- `athlete_id` (string): Specific athlete
- `sport` (string): Filter by sport
- `budget_min` (int): Minimum budget
- `budget_max` (int): Maximum budget
- `location` (string): Geographic targeting

---

## Performance Metrics

### System Health

**GET** `/api/v1/metrics/health`

Real-time system performance metrics.

**Response:**

```json
{
  "status": "operational",
  "response_time_ms": 89,
  "uptime": "99.97%",
  "active_analyses": 247,
  "queue_depth": 12,
  "championship_ready": true,
  "last_check": "2024-09-13T21:15:30Z"
}
```

### Usage Analytics

**GET** `/api/v1/metrics/usage`

API usage statistics and billing information.

---

## Webhooks

Subscribe to real-time events for immediate updates.

### Available Events

| Event | Description | Payload |
|-------|-------------|---------|
| `analysis.completed` | Vision AI analysis finished | Analysis results |
| `game.score_update` | Live game score change | Game data |
| `nil.valuation_change` | Athlete NIL value updated | Valuation data |
| `roi.calculation_complete` | ROI analysis finished | ROI results |

### Create Webhook

**POST** `/api/v1/webhooks`

```json
{
  "url": "https://your-app.com/webhook",
  "events": ["analysis.completed", "game.score_update"],
  "secret": "your_webhook_secret"
}
```

### Webhook Security

All webhook payloads are signed with HMAC-SHA256. Verify signatures:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}
```

---

## Rate Limits

| Tier | Requests/Minute | Daily Limit | Burst Limit |
|------|-----------------|-------------|-------------|
| Starter | 60 | 10,000 | 120 |
| Professional | 300 | 50,000 | 600 |
| Championship | 1,000 | 200,000 | 2,000 |
| Enterprise | Custom | Custom | Custom |

Rate limit headers included in all responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1694645732
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Required parameter 'video_url' is missing",
    "details": {
      "parameter": "video_url",
      "expected_type": "string"
    }
  },
  "request_id": "req_ChZgHx7829bHdK",
  "timestamp": "2024-09-13T21:15:42Z"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Temporary service outage |

---

## SDKs and Libraries

### Official SDKs

**JavaScript/Node.js:**
```bash
npm install @blaze-intelligence/api-client
```

```javascript
const BlazeIntelligence = require('@blaze-intelligence/api-client');

const blaze = new BlazeIntelligence({
  apiKey: 'YOUR_API_KEY',
  environment: 'production' // or 'sandbox'
});

// Analyze video
const analysis = await blaze.vision.analyze({
  videoUrl: 'https://example.com/video.mp4',
  analysisTypes: ['biomechanics', 'character']
});
```

**Python:**
```bash
pip install blaze-intelligence
```

```python
from blaze_intelligence import BlazeClient

client = BlazeClient(api_key='YOUR_API_KEY')

# Calculate ROI
roi_result = client.roi.calculate({
    'program_type': 'college',
    'team_size': 85,
    'current_budget': 8500000
})
```

**PHP:**
```bash
composer require blaze-intelligence/api-client
```

### Community Libraries

- **Ruby**: [blaze-intelligence-ruby](https://github.com/blaze-intelligence/ruby)
- **Go**: [blaze-intelligence-go](https://github.com/blaze-intelligence/go)
- **Java**: [blaze-intelligence-java](https://github.com/blaze-intelligence/java)

---

## Code Examples

### Complete Video Analysis Workflow

```javascript
const BlazeIntelligence = require('@blaze-intelligence/api-client');

async function analyzePlayerVideo() {
  const blaze = new BlazeIntelligence({
    apiKey: process.env.BLAZE_API_KEY
  });

  try {
    // Upload video for analysis
    const analysis = await blaze.vision.analyze({
      videoUrl: 'https://example.com/quarterback-practice.mp4',
      analysisTypes: ['biomechanics', 'micro_expressions', 'character'],
      sport: 'football',
      position: 'quarterback',
      confidenceThreshold: 0.9
    });

    console.log('Analysis ID:', analysis.analysis_id);
    console.log('Championship Readiness:', analysis.championship_metrics.readiness_score);

    // Get detailed biomechanics data
    if (analysis.results.biomechanics) {
      console.log('Throwing Motion Score:', analysis.results.biomechanics.mechanics_breakdown.throwing_motion.score);
    }

    // Calculate NIL value based on performance
    if (analysis.championship_metrics.readiness_score > 85) {
      const nilValuation = await blaze.nil.calculateValue({
        athleteId: 'custom_athlete_001',
        performanceMetrics: analysis.championship_metrics,
        sport: 'football',
        position: 'quarterback'
      });

      console.log('Estimated NIL Value:', nilValuation.estimated_value);
    }

  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

analyzePlayerVideo();
```

### ROI Calculator Integration

```python
from blaze_intelligence import BlazeClient
import json

def calculate_program_roi(program_data):
    client = BlazeClient(api_key=os.getenv('BLAZE_API_KEY'))

    try:
        # Calculate ROI for sports program
        roi_result = client.roi.calculate({
            'program_type': program_data['type'],
            'team_size': program_data['team_size'],
            'games_per_season': program_data['games'],
            'current_budget': program_data['budget'],
            'sport': program_data['sport'],
            'goals': ['championship', 'recruiting']
        })

        # Generate summary report
        report = {
            'roi_percentage': roi_result['roi_analysis']['roi_percentage'],
            'payback_months': roi_result['roi_analysis']['payback_period_months'],
            'annual_savings': roi_result['roi_analysis']['cost_savings'],
            'championship_improvement': roi_result['breakdown']['competitive_advantages']['championship_probability']
        }

        print(f"ROI Analysis: {roi_result['roi_analysis']['roi_percentage']}% return")
        print(f"Payback Period: {roi_result['roi_analysis']['payback_period_months']} months")

        return report

    except Exception as e:
        print(f"ROI calculation failed: {e}")
        return None

# Example usage
texas_high_school = {
    'type': 'high_school',
    'team_size': 85,
    'games': 12,
    'budget': 150000,
    'sport': 'football'
}

roi_report = calculate_program_roi(texas_high_school)
```

### Real-time Data Dashboard

```javascript
// WebSocket connection for live updates
const ws = new WebSocket('wss://api.blaze-intelligence.com/v1/live');

ws.onopen = function() {
    // Subscribe to live game updates
    ws.send(JSON.stringify({
        action: 'subscribe',
        channels: ['games.cardinals', 'nil.trending', 'vision.completed']
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);

    switch(data.channel) {
        case 'games.cardinals':
            updateGameScore(data.payload);
            break;
        case 'nil.trending':
            updateNILTrends(data.payload);
            break;
        case 'vision.completed':
            displayAnalysisResults(data.payload);
            break;
    }
};

function updateGameScore(gameData) {
    document.getElementById('cardinals-score').textContent = gameData.score.home;
    document.getElementById('opponent-score').textContent = gameData.score.away;

    // Update championship impact
    const impactElement = document.getElementById('championship-impact');
    impactElement.textContent = gameData.championship_impact.toFixed(1);
}
```

---

## Support and Resources

### Developer Resources

- **API Portal**: [portal.blaze-intelligence.com](https://portal.blaze-intelligence.com)
- **Documentation**: [docs.blaze-intelligence.com](https://docs.blaze-intelligence.com)
- **GitHub**: [github.com/blaze-intelligence](https://github.com/blaze-intelligence)
- **Community Forum**: [community.blaze-intelligence.com](https://community.blaze-intelligence.com)

### Support Channels

- **Technical Support**: `developers@blaze-intelligence.com`
- **Business Inquiries**: `partnerships@blaze-intelligence.com`
- **Emergency Support** (Enterprise): `emergency@blaze-intelligence.com`

### API Status

- **Status Page**: [status.blaze-intelligence.com](https://status.blaze-intelligence.com)
- **Uptime**: 99.97% (last 30 days)
- **Response Time**: < 100ms average

---

## Changelog

### v1.0 (Current)
- Initial API release
- Vision AI analysis endpoints
- Sports data integration
- ROI calculator
- NIL analytics
- Real-time webhooks

### Coming Soon (v1.1)
- Perfect Game expanded integration
- Advanced biomechanics analysis
- Championship prediction models
- Mobile SDK releases
- GraphQL endpoint

---

*Built with championship-level precision in the heart of Texas. From East Texas high school dreams to SEC championship reality.*

**🏆 Hook 'em Horns! 🏆**