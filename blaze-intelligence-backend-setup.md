# Blaze Intelligence Dashboard - Championship Backend Implementation

## Phase 1: Foundational Backend & Data Integration

### Database Architecture (Supabase/PostgreSQL)

```sql
-- Core Database Schema for Blaze Intelligence

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT UNIQUE,
  organization TEXT,
  role TEXT CHECK (role IN ('admin', 'coach', 'scout', 'analyst')),
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('youth', 'high_school', 'college', 'professional')),
  sport TEXT CHECK (sport IN ('baseball', 'football', 'basketball')),
  organization_id UUID REFERENCES public.user_profiles(id),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT,
  team_id UUID REFERENCES public.teams(id),
  class_year TEXT,
  height TEXT,
  weight INTEGER,
  hometown TEXT,
  perfect_game_id TEXT,
  recruiting_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Analysis Sessions
CREATE TABLE public.video_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id),
  video_url TEXT,
  cloudinary_public_id TEXT,
  analysis_type TEXT CHECK (analysis_type IN ('biomechanical', 'character', 'integrated', 'recruiting')),
  sport TEXT,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Biomechanical Analysis Results
CREATE TABLE public.biomechanical_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.video_analysis_sessions(id),
  overall_score DECIMAL(3,2),
  consistency_score DECIMAL(3,2),
  keypoint_confidence DECIMAL(3,2),
  movement_phase TEXT,
  force_vectors JSONB,
  joint_angles JSONB,
  efficiency_metrics JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Character Assessment Results
CREATE TABLE public.character_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.video_analysis_sessions(id),
  grit_score DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  pressure_resilience DECIMAL(3,2),
  leadership_score DECIMAL(3,2),
  competitive_fire DECIMAL(3,2),
  micro_expressions JSONB,
  championship_indicators JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Metrics Time Series
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id),
  metric_date DATE NOT NULL,
  batting_average DECIMAL(4,3),
  on_base_percentage DECIMAL(4,3),
  slugging_percentage DECIMAL(4,3),
  exit_velocity DECIMAL(5,2),
  sprint_speed DECIMAL(4,2),
  arm_strength INTEGER,
  fielding_percentage DECIMAL(4,3),
  biomechanical_score DECIMAL(3,2),
  character_score DECIMAL(3,2),
  integration_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, metric_date)
);

-- Scouting Reports
CREATE TABLE public.scouting_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id),
  report_type TEXT CHECK (report_type IN ('brief', 'comprehensive', 'executive')),
  overall_grade TEXT,
  recommendation_tier TEXT,
  executive_summary TEXT,
  biomechanical_analysis JSONB,
  character_assessment JSONB,
  championship_potential JSONB,
  development_projection JSONB,
  generated_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Coaching Sessions
CREATE TABLE public.ai_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  player_ids UUID[],
  context_data JSONB,
  prompt TEXT,
  response TEXT,
  model_used TEXT DEFAULT 'gemini-pro',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_players_team ON public.players(team_id);
CREATE INDEX idx_performance_player_date ON public.performance_metrics(player_id, metric_date DESC);
CREATE INDEX idx_video_sessions_player ON public.video_analysis_sessions(player_id);
CREATE INDEX idx_scouting_reports_player ON public.scouting_reports(player_id);

-- Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data and their organization's data
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their teams" ON public.teams
  FOR SELECT USING (organization_id = auth.uid());

CREATE POLICY "Users can manage their teams" ON public.teams
  FOR ALL USING (organization_id = auth.uid());
```

### API Layer Implementation (Next.js API Routes)

```typescript
// /app/api/roster/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  const position = searchParams.get('position')
  const classYear = searchParams.get('class')

  let query = supabase
    .from('players')
    .select(`
      *,
      teams (name, level),
      performance_metrics (
        batting_average,
        biomechanical_score,
        character_score,
        metric_date
      )
    `)
    .order('jersey_number', { ascending: true })

  if (teamId) query = query.eq('team_id', teamId)
  if (position) query = query.eq('position', position)
  if (classYear) query = query.eq('class_year', classYear)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Transform data to match frontend expectations
  const roster = data?.map(player => ({
    id: player.id,
    name: player.name,
    jerseyNumber: player.jersey_number,
    position: player.position,
    team: player.teams?.name || 'Unassigned',
    classYear: player.class_year,
    height: player.height,
    weight: player.weight,
    hometown: player.hometown,
    battingAverage: player.performance_metrics?.[0]?.batting_average || 0,
    biomechanicalScore: player.performance_metrics?.[0]?.biomechanical_score || 0,
    characterScore: player.performance_metrics?.[0]?.character_score || 0,
    recruitingStatus: player.recruiting_status
  }))

  return NextResponse.json(roster)
}

export async function POST(request: Request) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('players')
    .insert({
      name: body.name,
      jersey_number: body.jerseyNumber,
      position: body.position,
      team_id: body.teamId,
      class_year: body.classYear,
      height: body.height,
      weight: body.weight,
      hometown: body.hometown,
      perfect_game_id: body.perfectGameId
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

```typescript
// /app/api/analytics/overview/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  // Aggregate KPIs
  const [playersCount, avgBiomechanical, avgCharacter, recentAnalyses] = await Promise.all([
    supabase
      .from('players')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('performance_metrics')
      .select('biomechanical_score')
      .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    supabase
      .from('performance_metrics')
      .select('character_score')
      .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    supabase
      .from('video_analysis_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const overview = {
    totalPlayers: playersCount.count || 0,
    avgBiomechanicalScore: calculateAverage(avgBiomechanical.data, 'biomechanical_score'),
    avgCharacterScore: calculateAverage(avgCharacter.data, 'character_score'),
    championshipReadiness: calculateChampionshipReadiness(avgBiomechanical.data, avgCharacter.data),
    recentAnalyses: recentAnalyses.data?.length || 0,
    improvementTrend: calculateTrend(avgBiomechanical.data)
  }

  return NextResponse.json(overview)
}
```

### Authentication Integration (Supabase Auth)

```typescript
// /app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

```typescript
// /middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
```

## Phase 2: Core Feature Enhancement

### AI Copilot Integration

```typescript
// /app/api/ai/chat/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { StreamingTextResponse, GoogleGenerativeAIStream } from 'ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: Request) {
  const { messages, context } = await request.json()

  // Build championship-level prompt with context
  const systemPrompt = `You are an elite sports intelligence analyst for Blaze Intelligence,
    combining Deep South coaching wisdom with cutting-edge analytics. You have access to:
    - Player roster data: ${JSON.stringify(context.roster)}
    - Recent performance metrics: ${JSON.stringify(context.metrics)}
    - Video analysis results: ${JSON.stringify(context.analyses)}

    Provide insights that blend championship-level character assessment with biomechanical excellence.
    Speak with the authority of someone who's spent decades in Texas high school football and SEC programs.`

  const model = genAI.getGenerativeModel({
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  })

  const chat = model.startChat({
    history: messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: m.content
    }))
  })

  const result = await chat.sendMessageStream(systemPrompt + '\n\n' + messages[messages.length - 1].content)
  const stream = GoogleGenerativeAIStream(result)

  return new StreamingTextResponse(stream)
}
```

### Video Processing Pipeline

```typescript
// /app/api/video/analyze/route.ts
import { v2 as cloudinary } from 'cloudinary'
import { ChampionshipMicroExpressionEngine } from '@/lib/video-intelligence/micro-expression'
import { ChampionshipNeuralCoaching } from '@/lib/video-intelligence/neural-coaching'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('video') as File
  const playerId = formData.get('playerId') as string
  const analysisType = formData.get('analysisType') as string

  // Upload to Cloudinary
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'blaze-intelligence/video-analysis'
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  // Initialize analysis engines
  const microExpressionEngine = new ChampionshipMicroExpressionEngine()
  const neuralCoaching = new ChampionshipNeuralCoaching()

  await microExpressionEngine.initialize()
  await neuralCoaching.initialize()

  // Create analysis session in database
  const { data: session } = await supabase
    .from('video_analysis_sessions')
    .insert({
      player_id: playerId,
      video_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id,
      analysis_type: analysisType,
      created_by: userId
    })
    .select()
    .single()

  // Trigger async processing
  await processVideoAnalysis(session.id, uploadResult.secure_url)

  return NextResponse.json({
    sessionId: session.id,
    status: 'processing',
    estimatedTime: '2-3 minutes'
  })
}

async function processVideoAnalysis(sessionId: string, videoUrl: string) {
  // This would run as a background job (e.g., using Vercel Functions or a queue)

  // Extract frames and analyze
  const frames = await extractKeyFrames(videoUrl)
  const analyses = []

  for (const frame of frames) {
    const analysis = await neuralCoaching.analyzePerformanceFrame(
      frame.element,
      frame.timestamp
    )
    analyses.push(analysis)
  }

  // Generate comprehensive report
  const scoutingReport = await generateScoutingReport(analyses, sessionId)

  // Save results to database
  await saveAnalysisResults(sessionId, analyses, scoutingReport)

  // Send notification
  await sendAnalysisCompleteNotification(sessionId)
}
```

## Phase 3: Real-time Features & Production

### WebSocket Integration for Live Updates

```typescript
// /lib/realtime.ts
import { createClient } from '@supabase/supabase-js'

export function subscribeToPlayerUpdates(playerId: string, callback: (payload: any) => void) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const subscription = supabase
    .channel(`player-${playerId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'performance_metrics',
        filter: `player_id=eq.${playerId}`
      },
      callback
    )
    .subscribe()

  return subscription
}

// Usage in component
useEffect(() => {
  const subscription = subscribeToPlayerUpdates(playerId, (payload) => {
    if (payload.eventType === 'INSERT') {
      // Update UI with new performance data
      setMetrics(prev => [...prev, payload.new])
      toast({
        title: "New Performance Data",
        description: `${playerName} has new metrics available`
      })
    }
  })

  return () => {
    subscription.unsubscribe()
  }
}, [playerId])
```

### State Management with Zustand

```typescript
// /store/roster.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface RosterState {
  players: Player[]
  selectedPlayers: string[]
  filters: {
    team?: string
    position?: string
    classYear?: string
    search?: string
  }
  isLoading: boolean
  error: string | null

  // Actions
  fetchRoster: () => Promise<void>
  selectPlayer: (id: string) => void
  updateFilters: (filters: Partial<RosterState['filters']>) => void
  clearSelection: () => void
}

export const useRosterStore = create<RosterState>()(
  devtools(
    persist(
      (set, get) => ({
        players: [],
        selectedPlayers: [],
        filters: {},
        isLoading: false,
        error: null,

        fetchRoster: async () => {
          set({ isLoading: true, error: null })

          try {
            const params = new URLSearchParams(get().filters as any)
            const response = await fetch(`/api/roster?${params}`)

            if (!response.ok) throw new Error('Failed to fetch roster')

            const players = await response.json()
            set({ players, isLoading: false })
          } catch (error) {
            set({ error: error.message, isLoading: false })
          }
        },

        selectPlayer: (id) => {
          set(state => ({
            selectedPlayers: state.selectedPlayers.includes(id)
              ? state.selectedPlayers.filter(p => p !== id)
              : [...state.selectedPlayers, id]
          }))
        },

        updateFilters: (filters) => {
          set(state => ({ filters: { ...state.filters, ...filters } }))
          get().fetchRoster()
        },

        clearSelection: () => set({ selectedPlayers: [] })
      }),
      {
        name: 'roster-storage',
        partialize: (state) => ({ filters: state.filters })
      }
    )
  )
)
```

### Environment Configuration

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

GOOGLE_GEMINI_API_KEY=your-gemini-key

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production URLs
DATABASE_URL=your-database-url
DIRECT_URL=your-direct-database-url
```

### Deployment Configuration (Vercel)

```json
// vercel.json
{
  "functions": {
    "app/api/video/analyze/route.ts": {
      "maxDuration": 300
    },
    "app/api/ai/chat/route.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "SUPABASE_SERVICE_KEY": "@supabase-service-key",
    "GOOGLE_GEMINI_API_KEY": "@gemini-api-key"
  }
}
```

## Implementation Timeline

### Week 1-2: Database & Authentication
- Set up Supabase project
- Create database schema
- Implement authentication flow
- Configure Row Level Security

### Week 3-4: API Development
- Build CRUD endpoints for all models
- Implement data aggregation endpoints
- Create video upload pipeline
- Integrate AI chat endpoint

### Week 5-6: Frontend Integration
- Replace mock data with API calls
- Implement real-time subscriptions
- Add loading states and error handling
- Build player detail views

### Week 7-8: Advanced Features
- Complete video analysis integration
- Implement AR coaching overlay
- Generate automated scouting reports
- Perfect Game data integration

### Week 9-10: Production Preparation
- Performance optimization
- Security audit
- Load testing
- Deploy to production

## Performance Optimizations

```typescript
// Implement React Query for efficient data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useRoster(filters: RosterFilters) {
  return useQuery({
    queryKey: ['roster', filters],
    queryFn: () => fetchRoster(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Implement virtual scrolling for large datasets
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualRosterTable({ players }: { players: Player[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <PlayerRow
            key={virtualItem.key}
            player={players[virtualItem.index]}
            style={{
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

## Security Best Practices

1. **API Rate Limiting**: Implement rate limiting on all endpoints
2. **Input Validation**: Use Zod for request validation
3. **SQL Injection Prevention**: Use parameterized queries
4. **XSS Protection**: Sanitize all user inputs
5. **CORS Configuration**: Restrict origins in production
6. **Secret Management**: Use Vercel environment variables
7. **Audit Logging**: Track all data modifications

This implementation transforms your dashboard from a mock prototype into a championship-level production system that can scale from youth leagues to professional organizations.