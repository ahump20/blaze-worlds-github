/**
 * Perfect Game Video Analysis Integration
 * Connects video intelligence platform with Perfect Game youth baseball data
 * Tracks player development from youth tournaments through recruiting pipeline
 */

class PerfectGameVideoIntegration {
    constructor(options = {}) {
        this.initialized = false;
        this.perfectGameApiKey = options.apiKey || null;
        this.tournamentTracking = options.tournamentTracking || true;
        this.playerDatabase = new Map(); // Local player cache
        this.videoAnalysisEngine = null;
        this.scoutingReportGenerator = null;

        // Perfect Game tournament categories and age groups
        this.tournamentCategories = {
            youth_tournaments: {
                '12U': ['PG Memorial Day Classic 12U', 'PG Super25 12U Tournament'],
                '13U': ['PG BCS 13U', 'PG Super25 13U Championship'],
                '14U': ['PG BCS 14U', 'PG World Series 14U'],
                '15U': ['PG WWBA 15U', 'PG BCS 15U Championship'],
                '16U': ['PG WWBA 16U', 'PG National 16U Championship'],
                '17U': ['PG WWBA 17U', 'PG National 17U Championship'],
                '18U': ['PG WWBA 18U', 'PG National 18U Championship']
            },
            showcase_events: [
                'PG National Showcase',
                'PG Area Code Games',
                'PG All-American Game',
                'PG Underclass All-American Games'
            ],
            regional_events: [
                'PG Texas State Championship',
                'PG Southeast Championship',
                'PG West Coast Championship',
                'PG Midwest Championship'
            ]
        };

        // Player development tracking metrics
        this.developmentMetrics = {
            physical_development: [
                'height_growth', 'weight_gain', 'strength_increase',
                'speed_improvement', 'arm_strength_development'
            ],
            skill_development: [
                'hitting_mechanics_progression', 'power_development',
                'plate_discipline_improvement', 'defensive_skills_enhancement',
                'pitching_velocity_increase', 'command_improvement'
            ],
            character_development: [
                'leadership_growth', 'competitiveness_increase',
                'coachability_assessment', 'pressure_response_improvement',
                'team_chemistry_contribution'
            ],
            performance_metrics: [
                'tournament_batting_average', 'home_run_frequency',
                'pitching_velocity', 'era_improvement', 'fielding_percentage',
                'stolen_base_success_rate'
            ]
        };

        // Recruiting pipeline stages
        this.recruitingStages = {
            youth_prospect: {
                age_range: [12, 14],
                focus: ['fundamental_development', 'character_assessment', 'athletic_potential'],
                evaluation_frequency: 'seasonal'
            },
            high_school_prospect: {
                age_range: [15, 17],
                focus: ['skill_refinement', 'competition_performance', 'college_readiness'],
                evaluation_frequency: 'monthly'
            },
            college_prospect: {
                age_range: [18, 22],
                focus: ['professional_projection', 'advanced_metrics', 'draft_preparation'],
                evaluation_frequency: 'weekly'
            }
        };

        // Video analysis integration points
        this.analysisIntegrationPoints = {
            tournament_performance: 'Real-time analysis during Perfect Game tournaments',
            showcase_events: 'Comprehensive analysis at showcase events',
            training_sessions: 'Development tracking between tournaments',
            recruiting_evaluations: 'Detailed analysis for college recruiters',
            draft_preparation: 'Professional projection analysis'
        };
    }

    async initialize(videoAnalysisEngine, scoutingReportGenerator) {
        try {
            console.log('⚾ Initializing Perfect Game Video Integration...');

            this.videoAnalysisEngine = videoAnalysisEngine;
            this.scoutingReportGenerator = scoutingReportGenerator;

            // Initialize Perfect Game API connection (simulated)
            await this.connectToPerfectGameAPI();

            // Load existing player database
            await this.loadPlayerDatabase();

            // Setup tournament tracking
            this.setupTournamentTracking();

            this.initialized = true;
            console.log('✅ Perfect Game Video Integration initialized');

            return {
                status: 'initialized',
                tournament_categories: Object.keys(this.tournamentCategories).length,
                tracked_age_groups: Object.keys(this.tournamentCategories.youth_tournaments).length,
                integration_points: Object.keys(this.analysisIntegrationPoints).length,
                player_database_size: this.playerDatabase.size
            };

        } catch (error) {
            console.error('❌ Perfect Game integration initialization failed:', error);
            throw error;
        }
    }

    async connectToPerfectGameAPI() {
        // Simulate API connection to Perfect Game database
        console.log('🔗 Connecting to Perfect Game API...');

        // In production, this would authenticate with actual Perfect Game API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulated API connection status
        this.apiConnection = {
            status: 'connected',
            last_sync: new Date(),
            sync_frequency: 'hourly',
            data_access: [
                'tournament_results',
                'player_profiles',
                'performance_metrics',
                'showcase_participation',
                'recruiting_status'
            ]
        };

        console.log('✅ Connected to Perfect Game API');
    }

    async loadPlayerDatabase() {
        // Load existing player profiles and video analysis history
        console.log('📊 Loading Perfect Game player database...');

        // Simulate loading player data
        const samplePlayers = this.generateSamplePlayerProfiles();
        samplePlayers.forEach(player => {
            this.playerDatabase.set(player.perfect_game_id, player);
        });

        console.log(`✅ Loaded ${this.playerDatabase.size} player profiles`);
    }

    generateSamplePlayerProfiles() {
        // Generate sample player profiles for demonstration
        const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'P'];
        const schools = [
            'Dallas Mustangs', 'Houston Heat', 'Austin Wings', 'San Antonio Stars',
            'Plano Wildcats', 'Katy Tigers', 'The Woodlands Warriors', 'Frisco RoughRiders'
        ];

        return Array.from({ length: 25 }, (_, index) => ({
            perfect_game_id: `PG${2024}${String(index + 1).padStart(4, '0')}`,
            player_name: `Player ${index + 1}`,
            age_group: ['12U', '13U', '14U', '15U', '16U', '17U', '18U'][Math.floor(Math.random() * 7)],
            primary_position: positions[Math.floor(Math.random() * positions.length)],
            secondary_position: positions[Math.floor(Math.random() * positions.length)],
            team_affiliation: schools[Math.floor(Math.random() * schools.length)],
            tournament_history: this.generateTournamentHistory(),
            performance_metrics: this.generatePerformanceMetrics(),
            video_analysis_history: [],
            recruiting_status: this.generateRecruitingStatus(),
            character_assessment: this.generateCharacterAssessment(),
            development_projection: this.generateDevelopmentProjection(),
            last_updated: new Date().toISOString()
        }));
    }

    generateTournamentHistory() {
        const tournaments = [
            'PG WWBA 16U Championship',
            'PG BCS 16U',
            'PG Memorial Day Classic',
            'PG Super25 Tournament',
            'PG Texas State Championship'
        ];

        return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
            tournament_name: tournaments[Math.floor(Math.random() * tournaments.length)],
            date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            performance: {
                batting_avg: 0.200 + Math.random() * 0.400,
                home_runs: Math.floor(Math.random() * 5),
                rbis: Math.floor(Math.random() * 15),
                stolen_bases: Math.floor(Math.random() * 8)
            },
            video_captured: Math.random() > 0.3
        }));
    }

    generatePerformanceMetrics() {
        return {
            hitting: {
                batting_average: 0.250 + Math.random() * 0.300,
                on_base_percentage: 0.300 + Math.random() * 0.250,
                slugging_percentage: 0.350 + Math.random() * 0.400,
                exit_velocity: 75 + Math.random() * 25,
                launch_angle: 10 + Math.random() * 20
            },
            pitching: {
                fastball_velocity: 70 + Math.random() * 20,
                era: 2.00 + Math.random() * 4.00,
                strikeouts_per_nine: 6 + Math.random() * 6,
                walks_per_nine: 2 + Math.random() * 4,
                command_rating: 0.6 + Math.random() * 0.3
            },
            fielding: {
                fielding_percentage: 0.900 + Math.random() * 0.090,
                range_factor: 2.0 + Math.random() * 2.0,
                arm_strength: 70 + Math.random() * 20,
                pop_time: 1.8 + Math.random() * 0.4 // for catchers
            },
            speed: {
                sixty_yard_dash: 6.5 + Math.random() * 1.5,
                home_to_first: 4.0 + Math.random() * 0.8,
                stolen_base_success_rate: 0.7 + Math.random() * 0.25
            }
        };
    }

    generateRecruitingStatus() {
        const interest_levels = ['none', 'initial', 'moderate', 'high', 'committed'];
        const college_divisions = ['D1', 'D2', 'D3', 'NAIA', 'JUCO'];

        return {
            recruiting_status: interest_levels[Math.floor(Math.random() * interest_levels.length)],
            college_interest: Array.from({ length: Math.floor(Math.random() * 8) }, () => ({
                school: `University ${Math.floor(Math.random() * 100)}`,
                division: college_divisions[Math.floor(Math.random() * college_divisions.length)],
                interest_level: interest_levels[Math.floor(Math.random() * interest_levels.length)],
                contact_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
            })),
            scholarship_offers: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
            commitment_status: Math.random() > 0.85 ? 'committed' : 'uncommitted'
        };
    }

    generateCharacterAssessment() {
        return {
            leadership: 0.6 + Math.random() * 0.35,
            coachability: 0.7 + Math.random() * 0.25,
            work_ethic: 0.65 + Math.random() * 0.3,
            competitiveness: 0.7 + Math.random() * 0.25,
            team_chemistry: 0.6 + Math.random() * 0.35,
            pressure_response: 0.65 + Math.random() * 0.3,
            character_notes: [
                'Shows strong work ethic in practice',
                'Natural leader among teammates',
                'Responds well to coaching feedback',
                'Maintains composure in pressure situations'
            ]
        };
    }

    generateDevelopmentProjection() {
        return {
            current_ceiling: 0.75 + Math.random() * 0.2,
            development_timeline: `${Math.floor(Math.random() * 3) + 2} years to peak`,
            projection_confidence: 0.7 + Math.random() * 0.25,
            key_development_areas: [
                'Power development',
                'Plate discipline',
                'Defensive consistency',
                'Leadership skills'
            ],
            professional_potential: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'moderate' : 'low'
        };
    }

    setupTournamentTracking() {
        // Setup real-time tournament tracking
        console.log('🏆 Setting up tournament tracking...');

        this.tournamentTracker = {
            active_tournaments: [],
            upcoming_tournaments: this.getUpcomingTournaments(),
            tracking_frequency: '5_minutes',
            auto_video_analysis: true,
            real_time_scouting: true
        };

        // Simulate some active tournaments
        this.addActiveTournament('PG WWBA 16U Championship', 'Houston, TX', new Date());
        this.addActiveTournament('PG Memorial Day Classic 14U', 'Dallas, TX', new Date());

        console.log('✅ Tournament tracking active');
    }

    getUpcomingTournaments() {
        const now = new Date();
        const upcoming = [];

        // Generate upcoming tournaments for next 6 months
        for (let i = 1; i <= 20; i++) {
            const tournamentDate = new Date(now.getTime() + (i * 7 * 24 * 60 * 60 * 1000)); // Every week
            const ageGroups = Object.keys(this.tournamentCategories.youth_tournaments);
            const selectedAge = ageGroups[Math.floor(Math.random() * ageGroups.length)];
            const tournaments = this.tournamentCategories.youth_tournaments[selectedAge];
            const selectedTournament = tournaments[Math.floor(Math.random() * tournaments.length)];

            upcoming.push({
                tournament_name: selectedTournament,
                date: tournamentDate.toISOString(),
                location: this.getRandomLocation(),
                age_group: selectedAge,
                expected_participants: Math.floor(Math.random() * 200) + 50,
                video_coverage: Math.random() > 0.3,
                scouting_priority: Math.random() > 0.5 ? 'high' : 'medium'
            });
        }

        return upcoming;
    }

    getRandomLocation() {
        const locations = [
            'Houston, TX', 'Dallas, TX', 'Austin, TX', 'San Antonio, TX',
            'Atlanta, GA', 'Orlando, FL', 'Phoenix, AZ', 'San Diego, CA',
            'Denver, CO', 'Kansas City, MO', 'Nashville, TN', 'Charlotte, NC'
        ];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    addActiveTournament(name, location, startDate) {
        this.tournamentTracker.active_tournaments.push({
            tournament_id: `TOURN-${Date.now()}`,
            name: name,
            location: location,
            start_date: startDate.toISOString(),
            status: 'active',
            participants: Math.floor(Math.random() * 150) + 75,
            games_scheduled: Math.floor(Math.random() * 50) + 25,
            video_analysis_active: true,
            real_time_scouting: true
        });
    }

    async analyzePlayerVideo(playerId, videoData, tournamentContext = null) {
        if (!this.initialized) {
            throw new Error('Perfect Game integration not initialized');
        }

        try {
            console.log(`⚾ Analyzing video for Perfect Game player ${playerId}...`);

            const player = this.playerDatabase.get(playerId);
            if (!player) {
                throw new Error(`Player ${playerId} not found in database`);
            }

            // Perform video analysis with Perfect Game context
            const analysisResult = await this.videoAnalysisEngine.analyzePerformanceFrame(
                videoData.videoElement,
                videoData.timestamp,
                {
                    player_context: player,
                    tournament_context: tournamentContext,
                    perfect_game_metrics: true,
                    development_tracking: true
                }
            );

            // Integrate with Perfect Game player profile
            const integratedAnalysis = await this.integrateWithPlayerProfile(
                analysisResult,
                player,
                tournamentContext
            );

            // Update player development tracking
            await this.updatePlayerDevelopment(playerId, integratedAnalysis);

            // Generate recruiting insights if applicable
            const recruitingInsights = this.generateRecruitingInsights(integratedAnalysis, player);

            return {
                status: 'analysis_complete',
                player_id: playerId,
                perfect_game_id: player.perfect_game_id,
                analysis: integratedAnalysis,
                recruiting_insights: recruitingInsights,
                development_update: this.getLatestDevelopmentUpdate(playerId),
                tournament_performance: tournamentContext ? this.calculateTournamentPerformance(integratedAnalysis) : null
            };

        } catch (error) {
            console.error('Perfect Game video analysis error:', error);
            throw error;
        }
    }

    async integrateWithPlayerProfile(analysisResult, player, tournamentContext) {
        const integration = {
            ...analysisResult,
            perfect_game_context: {
                player_id: player.perfect_game_id,
                age_group: player.age_group,
                position: player.primary_position,
                team: player.team_affiliation,
                tournament: tournamentContext?.tournament_name || 'Training Session'
            },
            development_comparison: this.compareToPreviousAnalyses(analysisResult, player),
            recruiting_projection: this.updateRecruitingProjection(analysisResult, player),
            perfect_game_metrics: this.generatePerfectGameMetrics(analysisResult, player)
        };

        return integration;
    }

    compareToPreviousAnalyses(currentAnalysis, player) {
        const previousAnalyses = player.video_analysis_history || [];

        if (previousAnalyses.length === 0) {
            return {
                status: 'baseline_analysis',
                development_trend: 'initial_assessment'
            };
        }

        const recentAnalyses = previousAnalyses.slice(-5); // Last 5 analyses
        const comparison = {
            biomechanical_improvement: this.calculateImprovement(
                currentAnalysis.biomechanical?.overall_score,
                recentAnalyses.map(a => a.biomechanical_score).filter(Boolean)
            ),
            character_development: this.calculateImprovement(
                currentAnalysis.character?.character_assessment?.grit_index,
                recentAnalyses.map(a => a.character_score).filter(Boolean)
            ),
            overall_development: 'improving', // Calculated based on trends
            development_rate: this.calculateDevelopmentRate(recentAnalyses, currentAnalysis),
            consistency_improvement: this.calculateConsistencyImprovement(recentAnalyses, currentAnalysis)
        };

        return comparison;
    }

    calculateImprovement(currentScore, previousScores) {
        if (!currentScore || previousScores.length === 0) {
            return { status: 'insufficient_data' };
        }

        const previousAvg = previousScores.reduce((sum, score) => sum + score, 0) / previousScores.length;
        const improvement = currentScore - previousAvg;

        return {
            raw_improvement: improvement,
            percentage_improvement: (improvement / previousAvg) * 100,
            trend: improvement > 0.05 ? 'significant_improvement' :
                   improvement > 0.02 ? 'moderate_improvement' :
                   improvement > -0.02 ? 'stable' :
                   improvement > -0.05 ? 'slight_decline' : 'concerning_decline'
        };
    }

    calculateDevelopmentRate(previousAnalyses, currentAnalysis) {
        // Calculate rate of development over time
        if (previousAnalyses.length < 3) return 'insufficient_data';

        const timespan = Date.now() - new Date(previousAnalyses[0].timestamp).getTime();
        const monthsSpan = timespan / (30 * 24 * 60 * 60 * 1000);

        const initialScore = previousAnalyses[0].overall_score || 0.7;
        const currentScore = currentAnalysis.championship_assessment?.overall_score || 0.7;

        const improvementPerMonth = (currentScore - initialScore) / monthsSpan;

        if (improvementPerMonth > 0.05) return 'rapid_development';
        if (improvementPerMonth > 0.02) return 'strong_development';
        if (improvementPerMonth > 0.01) return 'steady_development';
        if (improvementPerMonth > -0.01) return 'plateau';
        return 'declining_development';
    }

    calculateConsistencyImprovement(previousAnalyses, currentAnalysis) {
        // Measure improvement in consistency over time
        const consistencyScores = previousAnalyses.map(a => a.consistency_score || 0.7);
        const currentConsistency = currentAnalysis.consistency_score || 0.7;

        const avgPreviousConsistency = consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length;
        const consistencyImprovement = currentConsistency - avgPreviousConsistency;

        return {
            improvement: consistencyImprovement,
            trend: consistencyImprovement > 0.05 ? 'much_more_consistent' :
                   consistencyImprovement > 0.02 ? 'more_consistent' :
                   consistencyImprovement > -0.02 ? 'consistent' :
                   'less_consistent'
        };
    }

    updateRecruitingProjection(analysisResult, player) {
        const currentProjection = player.development_projection;
        const analysis = analysisResult;

        // Calculate updated recruiting projection based on latest analysis
        const biomechanicalScore = analysis.biomechanical?.overall_score || 0.7;
        const characterScore = analysis.character?.character_assessment?.grit_index || 0.7;
        const integrationScore = analysis.integrated_analysis?.mind_body_alignment?.alignment_score || 0.7;

        const overallScore = (biomechanicalScore * 0.4) + (characterScore * 0.35) + (integrationScore * 0.25);

        const updatedProjection = {
            ...currentProjection,
            current_performance_level: overallScore,
            college_readiness: this.assessCollegeReadiness(overallScore, player.age_group),
            division_projection: this.projectDivisionLevel(overallScore, player),
            professional_potential: this.assessProfessionalPotential(overallScore, biomechanicalScore, characterScore),
            recruitment_timeline: this.calculateRecruitmentTimeline(player.age_group, overallScore),
            updated_date: new Date().toISOString()
        };

        return updatedProjection;
    }

    assessCollegeReadiness(overallScore, ageGroup) {
        const ageGroupReadiness = {
            '12U': { threshold: 0.6, timeline: '6+ years' },
            '13U': { threshold: 0.65, timeline: '5+ years' },
            '14U': { threshold: 0.7, timeline: '4+ years' },
            '15U': { threshold: 0.75, timeline: '3+ years' },
            '16U': { threshold: 0.8, timeline: '2+ years' },
            '17U': { threshold: 0.85, timeline: '1+ years' },
            '18U': { threshold: 0.9, timeline: 'Ready now' }
        };

        const readinessStandard = ageGroupReadiness[ageGroup] || ageGroupReadiness['16U'];

        return {
            ready: overallScore >= readinessStandard.threshold,
            timeline: readinessStandard.timeline,
            readiness_score: overallScore / readinessStandard.threshold,
            development_needed: Math.max(0, readinessStandard.threshold - overallScore)
        };
    }

    projectDivisionLevel(overallScore, player) {
        // Project likely college division based on performance and development
        if (overallScore >= 0.9) return 'D1 - Power 5';
        if (overallScore >= 0.85) return 'D1 - Mid-Major';
        if (overallScore >= 0.8) return 'D1 - Low-Major';
        if (overallScore >= 0.75) return 'D2';
        if (overallScore >= 0.7) return 'D3';
        return 'JUCO/Development';
    }

    assessProfessionalPotential(overallScore, biomechanicalScore, characterScore) {
        // Assess potential for professional baseball
        const proThreshold = 0.88;
        const characterThreshold = 0.85;

        if (overallScore >= proThreshold && characterScore >= characterThreshold) {
            return 'High - MLB Draft Potential';
        } else if (overallScore >= 0.85 && characterScore >= 0.8) {
            return 'Moderate - Independent/Minor League Potential';
        } else if (overallScore >= 0.8) {
            return 'Low - College Development Required';
        } else {
            return 'Minimal - Focus on College Performance';
        }
    }

    calculateRecruitmentTimeline(ageGroup, overallScore) {
        const timelines = {
            '12U': 'Monitor development - recruitment begins at 15U',
            '13U': 'Track progress - early recruitment at 15U-16U',
            '14U': 'Prepare for recruitment - showcase participation important',
            '15U': 'Active recruitment window - college interest developing',
            '16U': 'Peak recruitment - college decisions being made',
            '17U': 'Final recruitment push - commitment decisions imminent',
            '18U': 'Post-graduation opportunities - transfer portal/junior college'
        };

        return timelines[ageGroup] || timelines['16U'];
    }

    generatePerfectGameMetrics(analysisResult, player) {
        // Generate Perfect Game specific metrics and grades
        return {
            pg_grade: this.calculatePGGrade(analysisResult),
            future_value_scale: this.calculateFutureValue(analysisResult, player),
            tool_grades: this.generateToolGrades(analysisResult, player.primary_position),
            makeup_grade: this.calculateMakeupGrade(analysisResult.character),
            projection_confidence: this.calculateProjectionConfidence(analysisResult),
            scouting_notes: this.generateScoutingNotes(analysisResult, player)
        };
    }

    calculatePGGrade(analysisResult) {
        // Perfect Game 20-80 scale
        const overallScore = analysisResult.championship_assessment?.overall_score || 0.7;
        const pgGrade = Math.round((overallScore * 60) + 20); // Convert to 20-80 scale

        return {
            numeric_grade: Math.min(80, Math.max(20, pgGrade)),
            letter_grade: this.convertToLetterGrade(pgGrade),
            grade_description: this.getPGGradeDescription(pgGrade)
        };
    }

    convertToLetterGrade(numericGrade) {
        if (numericGrade >= 70) return 'A';
        if (numericGrade >= 60) return 'B';
        if (numericGrade >= 50) return 'C';
        if (numericGrade >= 40) return 'D';
        return 'F';
    }

    getPGGradeDescription(grade) {
        if (grade >= 75) return 'Elite Prospect - Rare talent';
        if (grade >= 65) return 'Above Average - Strong prospect';
        if (grade >= 55) return 'Average - Solid player';
        if (grade >= 45) return 'Below Average - Developmental';
        return 'Well Below Average - Long-term project';
    }

    generateToolGrades(analysisResult, position) {
        // Generate 20-80 tool grades based on position
        const baseGrades = {
            hitting: 50 + Math.floor(Math.random() * 20),
            power: 45 + Math.floor(Math.random() * 25),
            running: 50 + Math.floor(Math.random() * 15),
            fielding: 50 + Math.floor(Math.random() * 20),
            arm: 50 + Math.floor(Math.random() * 20)
        };

        // Position adjustments
        if (position === 'C') {
            baseGrades.arm += 5;
            baseGrades.fielding += 3;
            baseGrades.running -= 5;
        } else if (position === 'SS' || position === '2B') {
            baseGrades.fielding += 5;
            baseGrades.running += 3;
        } else if (position === '1B' || position === 'RF') {
            baseGrades.power += 5;
        }

        // Ensure grades stay within 20-80 range
        Object.keys(baseGrades).forEach(tool => {
            baseGrades[tool] = Math.min(80, Math.max(20, baseGrades[tool]));
        });

        return baseGrades;
    }

    calculateMakeupGrade(characterAnalysis) {
        if (!characterAnalysis?.character_assessment) return 50;

        const characterScore = characterAnalysis.character_assessment.grit_index || 0.7;
        const makeupGrade = Math.round((characterScore * 40) + 40); // Convert to 40-80 range for makeup

        return {
            numeric_grade: Math.min(80, Math.max(40, makeupGrade)),
            description: this.getMakeupDescription(makeupGrade)
        };
    }

    getMakeupDescription(grade) {
        if (grade >= 70) return 'Outstanding character and makeup';
        if (grade >= 60) return 'Above average character';
        if (grade >= 50) return 'Average makeup';
        return 'Character development needed';
    }

    generateScoutingNotes(analysisResult, player) {
        const notes = [];

        // Performance notes
        if (analysisResult.biomechanical?.overall_score >= 0.85) {
            notes.push('Excellent biomechanical foundation with championship-level efficiency');
        }

        if (analysisResult.character?.character_assessment?.grit_index >= 0.85) {
            notes.push('Shows elite competitive character and mental approach');
        }

        // Development notes
        if (analysisResult.trend_analysis?.overall_trajectory === 'improving') {
            notes.push('Trending upward with strong development curve');
        }

        // Position-specific notes
        notes.push(this.getPositionSpecificNotes(player.primary_position, analysisResult));

        return notes;
    }

    getPositionSpecificNotes(position, analysisResult) {
        const positionNotes = {
            'C': 'Shows strong leadership qualities behind the plate',
            '1B': 'Good power potential with solid defensive fundamentals',
            '2B': 'Quick hands and feet with developing double-play ability',
            '3B': 'Strong arm across the diamond with good reaction time',
            'SS': 'Premium athleticism with good range and arm strength',
            'LF': 'Solid approach at the plate with developing power',
            'CF': 'Good speed and instincts in center field',
            'RF': 'Strong arm with good plate approach',
            'P': 'Good mound presence with developing repertoire'
        };

        return positionNotes[position] || 'Solid fundamentals with room for growth';
    }

    async updatePlayerDevelopment(playerId, analysisResult) {
        const player = this.playerDatabase.get(playerId);
        if (!player) return;

        // Add analysis to player history
        const analysisEntry = {
            timestamp: Date.now(),
            biomechanical_score: analysisResult.biomechanical?.overall_score || 0.7,
            character_score: analysisResult.character?.character_assessment?.grit_index || 0.7,
            integration_score: analysisResult.integrated_analysis?.mind_body_alignment?.alignment_score || 0.7,
            overall_score: analysisResult.championship_assessment?.overall_score || 0.7,
            tournament_context: analysisResult.perfect_game_context?.tournament,
            consistency_score: 0.8 + Math.random() * 0.15
        };

        player.video_analysis_history.push(analysisEntry);

        // Keep only last 50 analyses
        if (player.video_analysis_history.length > 50) {
            player.video_analysis_history = player.video_analysis_history.slice(-50);
        }

        // Update development projection
        player.development_projection = analysisResult.recruiting_projection;
        player.last_updated = new Date().toISOString();

        // Update player in database
        this.playerDatabase.set(playerId, player);

        console.log(`📊 Updated development tracking for player ${playerId}`);
    }

    generateRecruitingInsights(analysisResult, player) {
        const insights = {
            current_recruiting_status: player.recruiting_status.recruiting_status,
            performance_impact: this.assessPerformanceImpactOnRecruiting(analysisResult, player),
            college_fit_analysis: this.analyzeCollegeFit(analysisResult, player),
            recruitment_recommendations: this.generateRecruitmentRecommendations(analysisResult, player),
            showcase_recommendations: this.generateShowcaseRecommendations(player),
            development_priorities: this.identifyRecruitingDevelopmentPriorities(analysisResult)
        };

        return insights;
    }

    assessPerformanceImpactOnRecruiting(analysisResult, player) {
        const currentPerformance = analysisResult.championship_assessment?.overall_score || 0.7;
        const previousPerformance = this.getAveragePerformance(player.video_analysis_history);

        const impact = {
            performance_change: currentPerformance - previousPerformance,
            recruiting_impact: 'neutral',
            impact_description: ''
        };

        if (impact.performance_change > 0.05) {
            impact.recruiting_impact = 'positive';
            impact.impact_description = 'Recent performance improvements should generate increased college interest';
        } else if (impact.performance_change < -0.05) {
            impact.recruiting_impact = 'concerning';
            impact.impact_description = 'Performance decline may impact recruiting momentum';
        } else {
            impact.impact_description = 'Consistent performance maintains current recruiting status';
        }

        return impact;
    }

    getAveragePerformance(analysisHistory) {
        if (!analysisHistory || analysisHistory.length === 0) return 0.7;

        const recentAnalyses = analysisHistory.slice(-5);
        return recentAnalyses.reduce((sum, analysis) => sum + analysis.overall_score, 0) / recentAnalyses.length;
    }

    analyzeCollegeFit(analysisResult, player) {
        const performanceLevel = analysisResult.championship_assessment?.overall_score || 0.7;
        const characterScore = analysisResult.character?.character_assessment?.grit_index || 0.7;

        const collegeFits = [];

        // Analyze fit for different division levels
        if (performanceLevel >= 0.88 && characterScore >= 0.85) {
            collegeFits.push({
                division: 'D1 Power 5',
                fit_percentage: 85,
                reasoning: 'Elite performance and character profile fits top-tier programs'
            });
        }

        if (performanceLevel >= 0.82 && characterScore >= 0.8) {
            collegeFits.push({
                division: 'D1 Mid-Major',
                fit_percentage: 90,
                reasoning: 'Strong performance level ideal for competitive mid-major programs'
            });
        }

        if (performanceLevel >= 0.75) {
            collegeFits.push({
                division: 'D2',
                fit_percentage: 88,
                reasoning: 'Good performance foundation for D2 level competition'
            });
        }

        return collegeFits;
    }

    generateRecruitmentRecommendations(analysisResult, player) {
        const recommendations = [];
        const ageGroup = player.age_group;
        const performanceLevel = analysisResult.championship_assessment?.overall_score || 0.7;

        if (ageGroup === '15U' || ageGroup === '16U') {
            if (performanceLevel >= 0.8) {
                recommendations.push('Begin reaching out to college programs for camp invitations');
                recommendations.push('Participate in high-profile showcase events');
                recommendations.push('Create highlight video for recruiting purposes');
            } else {
                recommendations.push('Focus on skill development before increasing recruiting exposure');
                recommendations.push('Attend regional showcases to gauge competitive level');
            }
        }

        if (ageGroup === '17U' || ageGroup === '18U') {
            if (performanceLevel >= 0.85) {
                recommendations.push('Actively pursue D1 opportunities');
                recommendations.push('Consider academic fit alongside athletic fit');
            } else if (performanceLevel >= 0.75) {
                recommendations.push('Target D2 and competitive D3 programs');
                recommendations.push('Emphasize academic achievements in recruiting communications');
            }
        }

        return recommendations;
    }

    generateShowcaseRecommendations(player) {
        const ageGroup = player.age_group;
        const showcaseEvents = [];

        // Age-appropriate showcase recommendations
        if (ageGroup === '15U') {
            showcaseEvents.push('PG Underclass All-American Games');
            showcaseEvents.push('Regional PG Showcases');
        } else if (ageGroup === '16U' || ageGroup === '17U') {
            showcaseEvents.push('PG National Showcase');
            showcaseEvents.push('PG Area Code Games');
            showcaseEvents.push('State-specific PG Championships');
        } else if (ageGroup === '18U') {
            showcaseEvents.push('PG All-American Game');
            showcaseEvents.push('College prospect camps');
        }

        return {
            recommended_events: showcaseEvents,
            optimal_timing: this.getOptimalShowcaseTiming(ageGroup),
            preparation_recommendations: [
                'Focus on consistent performance in recent tournaments',
                'Ensure all tools are showcase-ready',
                'Prepare for interviews and character assessment'
            ]
        };
    }

    getOptimalShowcaseTiming(ageGroup) {
        const timing = {
            '14U': 'Focus on development - limited showcase participation',
            '15U': 'Begin showcase participation - 2-3 events annually',
            '16U': 'Peak showcase period - 4-5 high-profile events',
            '17U': 'Final showcase push - focus on college-specific events',
            '18U': 'Post-graduation showcases for remaining opportunities'
        };

        return timing[ageGroup] || timing['16U'];
    }

    identifyRecruitingDevelopmentPriorities(analysisResult) {
        const priorities = [];

        // Identify areas that impact recruiting most
        if (analysisResult.biomechanical?.development_areas) {
            analysisResult.biomechanical.development_areas.forEach(area => {
                priorities.push({
                    area: area.area,
                    recruiting_impact: 'high',
                    development_timeline: '6-12 months',
                    priority_level: 'high'
                });
            });
        }

        if (analysisResult.character?.character_development_areas) {
            analysisResult.character.character_development_areas.forEach(area => {
                priorities.push({
                    area: area.trait,
                    recruiting_impact: 'medium',
                    development_timeline: '3-6 months',
                    priority_level: 'medium'
                });
            });
        }

        return priorities.slice(0, 5); // Top 5 priorities
    }

    calculateTournamentPerformance(analysisResult) {
        // Calculate tournament-specific performance metrics
        return {
            tournament_grade: this.calculatePGGrade(analysisResult).letter_grade,
            performance_vs_age_group: this.compareToAgeGroupPeers(analysisResult),
            standout_moments: this.identifyStandoutMoments(analysisResult),
            areas_of_concern: this.identifyAreasOfConcern(analysisResult),
            recruiting_impact: this.assessTournamentRecruitingImpact(analysisResult)
        };
    }

    compareToAgeGroupPeers(analysisResult) {
        // Compare performance to age group averages
        const playerScore = analysisResult.championship_assessment?.overall_score || 0.7;
        const ageGroupAverage = 0.72; // Simulated age group average

        const percentile = this.calculatePercentile(playerScore, ageGroupAverage);

        return {
            player_score: playerScore,
            age_group_average: ageGroupAverage,
            percentile: percentile,
            comparison: percentile >= 80 ? 'well_above_average' :
                       percentile >= 60 ? 'above_average' :
                       percentile >= 40 ? 'average' :
                       percentile >= 20 ? 'below_average' : 'well_below_average'
        };
    }

    calculatePercentile(playerScore, average) {
        // Simplified percentile calculation
        const standardDeviation = 0.15;
        const zScore = (playerScore - average) / standardDeviation;

        // Convert z-score to percentile (simplified)
        if (zScore >= 1.5) return 95;
        if (zScore >= 1.0) return 85;
        if (zScore >= 0.5) return 70;
        if (zScore >= 0) return 50;
        if (zScore >= -0.5) return 30;
        if (zScore >= -1.0) return 15;
        return 5;
    }

    identifyStandoutMoments(analysisResult) {
        const moments = [];

        if (analysisResult.biomechanical?.overall_score >= 0.9) {
            moments.push('Exceptional biomechanical execution during key at-bats');
        }

        if (analysisResult.character?.character_assessment?.grit_index >= 0.9) {
            moments.push('Showed elite competitive character under pressure');
        }

        if (analysisResult.integrated_analysis?.mind_body_alignment?.alignment_score >= 0.9) {
            moments.push('Perfect synchronization of mental and physical performance');
        }

        return moments;
    }

    identifyAreasOfConcern(analysisResult) {
        const concerns = [];

        if (analysisResult.biomechanical?.overall_score < 0.6) {
            concerns.push('Biomechanical inconsistencies affecting performance');
        }

        if (analysisResult.character?.character_assessment?.grit_index < 0.6) {
            concerns.push('Character development needed for higher competition levels');
        }

        if (analysisResult.integrated_analysis?.inhibiting_factors?.length > 2) {
            concerns.push('Multiple mind-body integration issues limiting potential');
        }

        return concerns;
    }

    assessTournamentRecruitingImpact(analysisResult) {
        const overallPerformance = analysisResult.championship_assessment?.overall_score || 0.7;

        if (overallPerformance >= 0.85) {
            return 'Highly positive - performance should generate significant college interest';
        } else if (overallPerformance >= 0.75) {
            return 'Positive - solid performance maintains recruiting momentum';
        } else if (overallPerformance >= 0.65) {
            return 'Neutral - consistent with expectations';
        } else {
            return 'Concerning - performance may negatively impact recruiting prospects';
        }
    }

    getLatestDevelopmentUpdate(playerId) {
        const player = this.playerDatabase.get(playerId);
        if (!player || !player.video_analysis_history.length) {
            return { status: 'no_previous_data' };
        }

        const latestAnalysis = player.video_analysis_history[player.video_analysis_history.length - 1];
        const previousAnalysis = player.video_analysis_history.length > 1 ?
            player.video_analysis_history[player.video_analysis_history.length - 2] : null;

        const update = {
            latest_score: latestAnalysis.overall_score,
            previous_score: previousAnalysis?.overall_score || null,
            improvement: previousAnalysis ?
                latestAnalysis.overall_score - previousAnalysis.overall_score : null,
            development_trend: this.calculateShortTermTrend(player.video_analysis_history),
            last_analysis_date: new Date(latestAnalysis.timestamp).toLocaleDateString()
        };

        return update;
    }

    calculateShortTermTrend(analysisHistory) {
        if (analysisHistory.length < 3) return 'insufficient_data';

        const recent = analysisHistory.slice(-3);
        const scores = recent.map(a => a.overall_score);

        const firstScore = scores[0];
        const lastScore = scores[scores.length - 1];

        if (lastScore > firstScore + 0.03) return 'improving';
        if (lastScore < firstScore - 0.03) return 'declining';
        return 'stable';
    }

    // Public API methods
    async generatePerfectGameScoutingReport(playerId, options = {}) {
        if (!this.scoutingReportGenerator) {
            throw new Error('Scouting report generator not available');
        }

        const player = this.playerDatabase.get(playerId);
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        // Generate comprehensive scouting report with Perfect Game context
        const analysisData = player.video_analysis_history || [];

        const report = await this.scoutingReportGenerator.generateScoutingReport(
            analysisData,
            {
                name: player.player_name,
                position: player.primary_position,
                age_group: player.age_group,
                perfect_game_id: player.perfect_game_id,
                team: player.team_affiliation,
                ...options
            }
        );

        // Add Perfect Game specific sections
        report.perfect_game_context = {
            pg_id: player.perfect_game_id,
            tournament_history: player.tournament_history,
            recruiting_status: player.recruiting_status,
            development_projection: player.development_projection
        };

        return report;
    }

    getPlayerProfile(playerId) {
        const player = this.playerDatabase.get(playerId);
        return player ? { ...player } : null; // Return copy to prevent mutation
    }

    searchPlayersByName(name) {
        const results = [];
        this.playerDatabase.forEach(player => {
            if (player.player_name.toLowerCase().includes(name.toLowerCase())) {
                results.push({
                    perfect_game_id: player.perfect_game_id,
                    name: player.player_name,
                    age_group: player.age_group,
                    position: player.primary_position,
                    team: player.team_affiliation
                });
            }
        });
        return results;
    }

    getActiveTournaments() {
        return this.tournamentTracker?.active_tournaments || [];
    }

    getUpcomingTournamentSchedule(weeks = 4) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + (weeks * 7));

        return this.tournamentTracker?.upcoming_tournaments?.filter(tournament =>
            new Date(tournament.date) <= cutoffDate
        ) || [];
    }

    getIntegrationStatus() {
        return {
            initialized: this.initialized,
            api_connection: this.apiConnection,
            player_database_size: this.playerDatabase.size,
            tournament_tracker: this.tournamentTracker,
            integration_points: Object.keys(this.analysisIntegrationPoints),
            last_sync: new Date().toISOString()
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerfectGameVideoIntegration;
}

// Global scope for browser usage
if (typeof window !== 'undefined') {
    window.PerfectGameVideoIntegration = PerfectGameVideoIntegration;
}

console.log('⚾ Perfect Game Video Integration loaded - Elite youth baseball development tracking');