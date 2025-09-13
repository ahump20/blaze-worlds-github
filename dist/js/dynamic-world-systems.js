/**
 * Dynamic World Systems with Weather Gameplay Effects
 * Texas Championship Edition - Environmental Strategy
 *
 * Features:
 * - Dynamic weather with gameplay impact
 * - Day/night cycle affecting visibility and AI
 * - Seasonal changes and biome transitions
 * - Natural disasters and events
 * - Environmental hazards and bonuses
 */

class DynamicWorldSystems {
    constructor(scene, gameWorld, particleSystem, lightingSystem) {
        this.scene = scene;
        this.gameWorld = gameWorld;
        this.particleSystem = particleSystem;
        this.lightingSystem = lightingSystem;

        // Time and calendar system
        this.worldTime = {
            hour: 12,          // 0-23
            day: 1,            // 1-30
            season: 'summer',  // spring, summer, fall, winter
            year: 1,
            timeSpeed: 60,     // Game minutes per real second
            isPaused: false
        };

        // Weather system
        this.weather = {
            current: 'clear',
            intensity: 0,
            windDirection: new THREE.Vector3(1, 0, 0),
            windSpeed: 5,
            temperature: 75,  // Fahrenheit
            humidity: 50,     // Percentage
            pressure: 30.00,  // Inches of mercury
            visibility: 10,   // Miles
            precipitation: 0  // Inches per hour
        };

        // Weather types with gameplay effects
        this.weatherTypes = {
            clear: {
                name: 'Clear Skies',
                visibility: 10,
                movementSpeed: 1.0,
                buildSpeed: 1.0,
                combatModifier: 1.0,
                resourceModifier: 1.0,
                particleEffect: null
            },
            cloudy: {
                name: 'Overcast',
                visibility: 8,
                movementSpeed: 1.0,
                buildSpeed: 1.0,
                combatModifier: 1.0,
                resourceModifier: 0.95,
                particleEffect: null
            },
            rain: {
                name: 'Rainfall',
                visibility: 5,
                movementSpeed: 0.8,
                buildSpeed: 0.7,
                combatModifier: 0.9,
                resourceModifier: 1.2, // Crops grow faster
                particleEffect: 'rain'
            },
            thunderstorm: {
                name: 'Thunderstorm',
                visibility: 3,
                movementSpeed: 0.6,
                buildSpeed: 0.5,
                combatModifier: 0.7,
                resourceModifier: 0.8,
                particleEffect: 'heavyRain',
                hazards: ['lightning', 'flooding']
            },
            dust_storm: {
                name: 'Dust Storm',
                visibility: 2,
                movementSpeed: 0.5,
                buildSpeed: 0.3,
                combatModifier: 0.5,
                resourceModifier: 0.6,
                particleEffect: 'dustStorm',
                hazards: ['visibility', 'machinery']
            },
            tornado: {
                name: 'Tornado',
                visibility: 4,
                movementSpeed: 0.4,
                buildSpeed: 0,
                combatModifier: 0.3,
                resourceModifier: 0,
                particleEffect: 'tornado',
                hazards: ['destruction', 'displacement']
            },
            snow: {
                name: 'Snowfall',
                visibility: 4,
                movementSpeed: 0.7,
                buildSpeed: 0.6,
                combatModifier: 0.8,
                resourceModifier: 0.7,
                particleEffect: 'snow'
            },
            blizzard: {
                name: 'Blizzard',
                visibility: 1,
                movementSpeed: 0.3,
                buildSpeed: 0.2,
                combatModifier: 0.4,
                resourceModifier: 0.3,
                particleEffect: 'blizzard',
                hazards: ['freezing', 'whiteout']
            },
            heatwave: {
                name: 'Heat Wave',
                visibility: 8,
                movementSpeed: 0.8,
                buildSpeed: 0.8,
                combatModifier: 0.85,
                resourceModifier: 0.7,
                particleEffect: 'heatShimmer',
                hazards: ['dehydration', 'exhaustion']
            }
        };

        // Natural events system
        this.naturalEvents = {
            wildfire: {
                active: false,
                position: null,
                radius: 0,
                spreadRate: 0.5,
                damage: 10
            },
            earthquake: {
                active: false,
                magnitude: 0,
                epicenter: null,
                duration: 0
            },
            flood: {
                active: false,
                waterLevel: 0,
                affectedAreas: []
            },
            drought: {
                active: false,
                severity: 0,
                duration: 0
            }
        };

        // Environmental zones
        this.environmentalZones = new Map();
        this.hazardZones = new Map();

        // Season configurations
        this.seasons = {
            spring: {
                temperatureRange: [50, 80],
                weatherProbabilities: {
                    clear: 0.3,
                    cloudy: 0.3,
                    rain: 0.25,
                    thunderstorm: 0.15
                },
                dayLength: 12,
                foliageColor: 0x90EE90
            },
            summer: {
                temperatureRange: [75, 105],
                weatherProbabilities: {
                    clear: 0.5,
                    cloudy: 0.2,
                    thunderstorm: 0.1,
                    heatwave: 0.15,
                    dust_storm: 0.05
                },
                dayLength: 14,
                foliageColor: 0x228B22
            },
            fall: {
                temperatureRange: [40, 70],
                weatherProbabilities: {
                    clear: 0.35,
                    cloudy: 0.35,
                    rain: 0.2,
                    dust_storm: 0.1
                },
                dayLength: 11,
                foliageColor: 0xFF8C00
            },
            winter: {
                temperatureRange: [20, 50],
                weatherProbabilities: {
                    clear: 0.25,
                    cloudy: 0.35,
                    snow: 0.2,
                    blizzard: 0.1,
                    rain: 0.1
                },
                dayLength: 10,
                foliageColor: 0x8B4513
            }
        };

        // Wildlife and ecosystem
        this.wildlife = {
            animals: [],
            migrationPatterns: new Map(),
            spawningGrounds: new Map()
        };

        // Atmosphere and sky
        this.atmosphere = {
            skybox: null,
            sunMesh: null,
            moonMesh: null,
            stars: null,
            clouds: []
        };

        // Performance and update timers
        this.timers = {
            weatherUpdate: 0,
            seasonUpdate: 0,
            wildlifeUpdate: 0,
            eventCheck: 0
        };

        this.init();
    }

    init() {
        this.createAtmosphere();
        this.initializeWeatherSystem();
        this.setupEnvironmentalZones();
        this.startWorldClock();

        console.log('🌍 Dynamic World Systems initialized');
        console.log(`🌤️ Starting weather: ${this.weather.current}`);
        console.log(`📅 Season: ${this.worldTime.season}`);
    }

    createAtmosphere() {
        // Dynamic skybox
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                uniform float time;
                varying vec3 vWorldPosition;

                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    float t = max(pow(max(h, 0.0), exponent), 0.0);

                    // Day/night transition
                    float dayNight = sin(time * 0.1) * 0.5 + 0.5;
                    vec3 skyColor = mix(bottomColor, topColor, t);
                    vec3 nightColor = vec3(0.05, 0.05, 0.2);

                    gl_FragColor = vec4(mix(nightColor, skyColor, dayNight), 1.0);
                }
            `,
            side: THREE.BackSide
        });

        this.atmosphere.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.atmosphere.skybox);

        // Sun
        const sunGeometry = new THREE.SphereGeometry(10, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 1
        });
        this.atmosphere.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.atmosphere.sunMesh);

        // Moon
        const moonGeometry = new THREE.SphereGeometry(8, 16, 16);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xCCCCCC,
            emissive: 0x666666,
            emissiveIntensity: 0.5
        });
        this.atmosphere.moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        this.scene.add(this.atmosphere.moonMesh);

        // Procedural clouds
        this.createProceduralClouds();
    }

    createProceduralClouds() {
        const cloudCount = 20;
        const cloudGeometry = new THREE.PlaneGeometry(50, 50);

        for (let i = 0; i < cloudCount; i++) {
            const cloudMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    opacity: { value: 0.6 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float opacity;
                    varying vec2 vUv;

                    float noise(vec2 p) {
                        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }

                    void main() {
                        vec2 p = vUv * 10.0 + vec2(time * 0.1, 0.0);
                        float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125;

                        float cloud = smoothstep(0.4, 0.6, n);
                        gl_FragColor = vec4(1.0, 1.0, 1.0, cloud * opacity);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide
            });

            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 400,
                100 + Math.random() * 50,
                (Math.random() - 0.5) * 400
            );
            cloud.rotation.x = -Math.PI / 2;
            cloud.userData = { speed: 0.5 + Math.random() };

            this.atmosphere.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }

    initializeWeatherSystem() {
        // Set initial weather based on season
        const season = this.seasons[this.worldTime.season];
        this.updateWeatherProbabilities(season);
        this.changeWeather(this.selectWeatherByProbability(season.weatherProbabilities));
    }

    selectWeatherByProbability(probabilities) {
        const random = Math.random();
        let cumulative = 0;

        for (const [weather, probability] of Object.entries(probabilities)) {
            cumulative += probability;
            if (random <= cumulative) {
                return weather;
            }
        }

        return 'clear';
    }

    changeWeather(newWeather, intensity = 1.0) {
        const oldWeather = this.weather.current;
        this.weather.current = newWeather;
        this.weather.intensity = intensity;

        const weatherData = this.weatherTypes[newWeather];

        // Update visibility
        this.weather.visibility = weatherData.visibility;

        // Update fog
        if (this.scene.fog) {
            const fogDensity = 1 / (weatherData.visibility * 100);
            this.scene.fog.near = weatherData.visibility * 10;
            this.scene.fog.far = weatherData.visibility * 100;
        }

        // Start particle effects
        if (weatherData.particleEffect && this.particleSystem) {
            this.particleSystem.createEffect(weatherData.particleEffect,
                { x: 0, y: 50, z: 0 },
                { intensity: intensity }
            );
        }

        // Apply weather hazards
        if (weatherData.hazards) {
            this.applyWeatherHazards(weatherData.hazards);
        }

        // Notify game systems
        this.notifyWeatherChange(oldWeather, newWeather);

        console.log(`🌤️ Weather changed: ${oldWeather} → ${newWeather}`);
    }

    applyWeatherHazards(hazards) {
        hazards.forEach(hazard => {
            switch (hazard) {
                case 'lightning':
                    this.scheduleLightningStrikes();
                    break;
                case 'flooding':
                    this.startFlooding();
                    break;
                case 'visibility':
                    this.reduceVisibility();
                    break;
                case 'destruction':
                    this.enableDestructiveForces();
                    break;
                case 'freezing':
                    this.applyFreezingEffects();
                    break;
            }
        });
    }

    scheduleLightningStrikes() {
        const strikeInterval = setInterval(() => {
            if (this.weather.current !== 'thunderstorm') {
                clearInterval(strikeInterval);
                return;
            }

            // Random lightning strike
            const strikePos = new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                100,
                (Math.random() - 0.5) * 200
            );

            this.createLightningEffect(strikePos);

            // Check for damage to structures
            this.checkLightningDamage(strikePos);

        }, 5000 + Math.random() * 10000);
    }

    createLightningEffect(position) {
        // Flash effect
        const flash = new THREE.PointLight(0xFFFFFF, 100, 500);
        flash.position.copy(position);
        this.scene.add(flash);

        // Fade out
        let intensity = 100;
        const fadeInterval = setInterval(() => {
            intensity *= 0.7;
            flash.intensity = intensity;
            if (intensity < 0.1) {
                this.scene.remove(flash);
                clearInterval(fadeInterval);
            }
        }, 50);

        // Thunder sound (would be handled by audio system)
        const delay = position.distanceTo(this.gameWorld.camera.position) / 340;
        setTimeout(() => {
            console.log('⚡ Thunder!');
        }, delay * 1000);
    }

    checkLightningDamage(position) {
        // Check buildings near strike
        if (this.gameWorld.economySystem) {
            this.gameWorld.economySystem.buildings.forEach(building => {
                const distance = building.position.distanceTo(position);
                if (distance < 10) {
                    // Direct hit
                    building.hp -= 50;
                    console.log(`⚡ Lightning struck ${building.type}!`);
                } else if (distance < 30) {
                    // Near miss
                    building.hp -= 10;
                }
            });
        }
    }

    startFlooding() {
        this.naturalEvents.flood.active = true;
        this.naturalEvents.flood.waterLevel = 0;

        const floodInterval = setInterval(() => {
            if (this.weather.current !== 'thunderstorm') {
                this.naturalEvents.flood.active = false;
                clearInterval(floodInterval);
                return;
            }

            this.naturalEvents.flood.waterLevel += 0.1;
            this.updateFloodedAreas();

        }, 1000);
    }

    updateFloodedAreas() {
        const waterLevel = this.naturalEvents.flood.waterLevel;

        // Check low-lying areas
        if (this.gameWorld.economySystem) {
            this.gameWorld.economySystem.buildings.forEach(building => {
                if (building.position.y < 30 + waterLevel) {
                    // Building is flooded
                    building.isWorking = false;
                    this.naturalEvents.flood.affectedAreas.push(building.position);
                }
            });
        }
    }

    startWorldClock() {
        setInterval(() => {
            if (!this.worldTime.isPaused) {
                this.advanceTime();
            }
        }, 1000); // Update every second
    }

    advanceTime() {
        // Advance game time
        const minutesToAdd = this.worldTime.timeSpeed / 60;
        let totalMinutes = this.worldTime.hour * 60 + minutesToAdd;

        // Handle day transition
        if (totalMinutes >= 24 * 60) {
            totalMinutes -= 24 * 60;
            this.worldTime.day++;

            // Handle month transition (30 days)
            if (this.worldTime.day > 30) {
                this.worldTime.day = 1;
                this.advanceSeason();
            }
        }

        this.worldTime.hour = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);

        // Update sun and moon positions
        this.updateCelestialBodies();

        // Update lighting
        this.updateDaylightLighting();

        // Random weather changes
        if (Math.random() < 0.001) {
            this.randomWeatherChange();
        }
    }

    updateCelestialBodies() {
        const hourAngle = (this.worldTime.hour / 24) * Math.PI * 2 - Math.PI / 2;

        // Sun position
        this.atmosphere.sunMesh.position.set(
            Math.cos(hourAngle) * 200,
            Math.sin(hourAngle) * 200,
            0
        );

        // Moon position (opposite of sun)
        this.atmosphere.moonMesh.position.set(
            Math.cos(hourAngle + Math.PI) * 200,
            Math.sin(hourAngle + Math.PI) * 200,
            0
        );
    }

    updateDaylightLighting() {
        if (!this.lightingSystem) return;

        const hour = this.worldTime.hour;
        let intensity = 0;
        let color = new THREE.Color();

        if (hour >= 6 && hour < 12) {
            // Morning
            intensity = (hour - 6) / 6;
            color.setHSL(0.1, 0.5, 0.5 + intensity * 0.5);
        } else if (hour >= 12 && hour < 18) {
            // Afternoon
            intensity = 1.0;
            color.setHSL(0.15, 0.4, 0.9);
        } else if (hour >= 18 && hour < 20) {
            // Sunset
            intensity = (20 - hour) / 2;
            color.setHSL(0.05, 0.7, 0.6);
        } else {
            // Night
            intensity = 0.1;
            color.setHSL(0.6, 0.3, 0.2);
        }

        // Update lighting system
        if (this.lightingSystem.sunLight) {
            this.lightingSystem.sunLight.intensity = intensity;
            this.lightingSystem.sunLight.color = color;
        }
    }

    advanceSeason() {
        const seasons = ['spring', 'summer', 'fall', 'winter'];
        const currentIndex = seasons.indexOf(this.worldTime.season);
        const nextIndex = (currentIndex + 1) % seasons.length;

        this.worldTime.season = seasons[nextIndex];

        if (nextIndex === 0) {
            this.worldTime.year++;
        }

        // Update environment for new season
        this.updateSeasonalEnvironment();

        console.log(`🍂 Season changed to ${this.worldTime.season}, Year ${this.worldTime.year}`);
    }

    updateSeasonalEnvironment() {
        const season = this.seasons[this.worldTime.season];

        // Update foliage colors
        if (this.gameWorld.terrainSystem) {
            // Update vegetation colors based on season
            console.log(`🌳 Foliage color updated for ${this.worldTime.season}`);
        }

        // Update temperature range
        const temp = season.temperatureRange;
        this.weather.temperature = temp[0] + Math.random() * (temp[1] - temp[0]);

        // Trigger seasonal events
        this.triggerSeasonalEvents();
    }

    triggerSeasonalEvents() {
        switch (this.worldTime.season) {
            case 'spring':
                this.spawnWildlife('birds', 20);
                this.growVegetation(1.5);
                break;
            case 'summer':
                this.checkForWildfire();
                this.checkForDrought();
                break;
            case 'fall':
                this.startHarvestSeason();
                this.spawnWildlife('deer', 10);
                break;
            case 'winter':
                this.applyWinterEffects();
                this.reduceWildlife();
                break;
        }
    }

    randomWeatherChange() {
        const season = this.seasons[this.worldTime.season];
        const newWeather = this.selectWeatherByProbability(season.weatherProbabilities);

        if (newWeather !== this.weather.current) {
            // Gradual weather transition
            this.transitionWeather(this.weather.current, newWeather);
        }
    }

    transitionWeather(fromWeather, toWeather) {
        console.log(`🌤️ Weather transitioning: ${fromWeather} → ${toWeather}`);

        // Fade out old weather effects
        const oldIntensity = this.weather.intensity;
        let transitionProgress = 0;

        const transitionInterval = setInterval(() => {
            transitionProgress += 0.05;

            if (transitionProgress >= 1) {
                this.changeWeather(toWeather, 1.0);
                clearInterval(transitionInterval);
            } else {
                // Blend weather effects
                this.weather.intensity = oldIntensity * (1 - transitionProgress);
            }
        }, 100);
    }

    // Natural disaster system
    triggerNaturalDisaster(type) {
        switch (type) {
            case 'tornado':
                this.spawnTornado();
                break;
            case 'wildfire':
                this.startWildfire();
                break;
            case 'earthquake':
                this.triggerEarthquake();
                break;
            case 'drought':
                this.startDrought();
                break;
        }
    }

    spawnTornado() {
        console.log('🌪️ Tornado warning!');

        const tornado = {
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 300,
                0,
                (Math.random() - 0.5) * 300
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            ),
            radius: 20,
            strength: 100
        };

        // Create visual effect
        if (this.particleSystem) {
            this.particleSystem.createEffect('tornado', tornado.position, {
                intensity: 1.0,
                radius: tornado.radius
            });
        }

        // Move and damage
        const tornadoInterval = setInterval(() => {
            tornado.position.add(tornado.velocity);

            // Check for collisions with buildings
            if (this.gameWorld.economySystem) {
                this.gameWorld.economySystem.buildings.forEach(building => {
                    const distance = building.position.distanceTo(tornado.position);
                    if (distance < tornado.radius) {
                        building.hp -= tornado.strength / 10;
                        console.log(`🌪️ Tornado damaged ${building.type}!`);
                    }
                });
            }

            // Dissipate after time
            tornado.strength *= 0.99;
            if (tornado.strength < 10) {
                clearInterval(tornadoInterval);
                console.log('🌪️ Tornado dissipated');
            }
        }, 100);
    }

    checkForWildfire() {
        const temperature = this.weather.temperature;
        const humidity = this.weather.humidity;

        // Higher chance in hot, dry conditions
        const fireRisk = (temperature - 80) / 100 * (1 - humidity / 100);

        if (Math.random() < fireRisk * 0.01) {
            this.startWildfire();
        }
    }

    startWildfire() {
        console.log('🔥 Wildfire started!');

        this.naturalEvents.wildfire.active = true;
        this.naturalEvents.wildfire.position = new THREE.Vector3(
            (Math.random() - 0.5) * 200,
            0,
            (Math.random() - 0.5) * 200
        );
        this.naturalEvents.wildfire.radius = 5;

        // Create fire effect
        if (this.particleSystem) {
            this.particleSystem.createEffect('fire',
                this.naturalEvents.wildfire.position,
                { intensity: 1.0 }
            );
        }

        // Spread logic
        const spreadInterval = setInterval(() => {
            if (!this.naturalEvents.wildfire.active) {
                clearInterval(spreadInterval);
                return;
            }

            // Spread based on wind and dryness
            this.naturalEvents.wildfire.radius += this.naturalEvents.wildfire.spreadRate;

            // Check for rain to extinguish
            if (this.weather.current === 'rain' || this.weather.current === 'thunderstorm') {
                this.naturalEvents.wildfire.active = false;
                console.log('🔥 Wildfire extinguished by rain');
            }

        }, 1000);
    }

    // Wildlife system
    spawnWildlife(type, count) {
        for (let i = 0; i < count; i++) {
            const animal = {
                type: type,
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 400,
                    0,
                    (Math.random() - 0.5) * 400
                ),
                velocity: new THREE.Vector3(),
                behavior: 'wandering',
                health: 100
            };

            this.wildlife.animals.push(animal);

            // Create visual representation
            const geometry = new THREE.BoxGeometry(1, 1, 2);
            const material = new THREE.MeshLambertMaterial({
                color: type === 'birds' ? 0x333333 : 0x8B4513
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(animal.position);

            animal.mesh = mesh;
            this.scene.add(mesh);
        }

        console.log(`🦌 Spawned ${count} ${type}`);
    }

    updateWildlife(deltaTime) {
        this.wildlife.animals.forEach(animal => {
            // Simple AI behavior
            switch (animal.behavior) {
                case 'wandering':
                    animal.velocity.set(
                        (Math.random() - 0.5) * 0.1,
                        0,
                        (Math.random() - 0.5) * 0.1
                    );
                    break;
                case 'fleeing':
                    // Run from danger
                    animal.velocity.multiplyScalar(3);
                    break;
                case 'grazing':
                    animal.velocity.set(0, 0, 0);
                    break;
            }

            // Update position
            animal.position.add(animal.velocity);
            if (animal.mesh) {
                animal.mesh.position.copy(animal.position);
            }

            // React to weather
            if (this.weather.current === 'thunderstorm' || this.weather.current === 'tornado') {
                animal.behavior = 'fleeing';
            }
        });
    }

    // Environmental zones
    setupEnvironmentalZones() {
        // Create special zones with effects
        this.createZone('healing_spring', new THREE.Vector3(50, 0, 50), 10, {
            effect: 'healing',
            rate: 5
        });

        this.createZone('toxic_swamp', new THREE.Vector3(-100, 0, -100), 20, {
            effect: 'poison',
            rate: 2
        });

        this.createZone('ancient_ruins', new THREE.Vector3(0, 0, 100), 15, {
            effect: 'knowledge',
            bonus: 1.5
        });
    }

    createZone(type, position, radius, effects) {
        const zone = {
            type: type,
            position: position,
            radius: radius,
            effects: effects,
            active: true
        };

        this.environmentalZones.set(type, zone);

        // Visual indicator
        const geometry = new THREE.RingGeometry(radius - 1, radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: effects.effect === 'healing' ? 0x00FF00 : 0xFF0000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.rotation.x = -Math.PI / 2;

        zone.mesh = mesh;
        this.scene.add(mesh);
    }

    checkZoneEffects(position) {
        const activeEffects = [];

        this.environmentalZones.forEach(zone => {
            const distance = position.distanceTo(zone.position);
            if (distance <= zone.radius && zone.active) {
                activeEffects.push(zone.effects);
            }
        });

        return activeEffects;
    }

    // Update method
    update(deltaTime) {
        // Update timers
        this.timers.weatherUpdate += deltaTime;
        this.timers.wildlifeUpdate += deltaTime;
        this.timers.eventCheck += deltaTime;

        // Update weather particles
        if (this.timers.weatherUpdate > 0.1) {
            this.updateWeatherEffects(deltaTime);
            this.timers.weatherUpdate = 0;
        }

        // Update wildlife
        if (this.timers.wildlifeUpdate > 1) {
            this.updateWildlife(deltaTime);
            this.timers.wildlifeUpdate = 0;
        }

        // Check for random events
        if (this.timers.eventCheck > 10) {
            this.checkForRandomEvents();
            this.timers.eventCheck = 0;
        }

        // Update clouds
        this.atmosphere.clouds.forEach(cloud => {
            cloud.position.x += cloud.userData.speed * deltaTime;
            if (cloud.position.x > 200) {
                cloud.position.x = -200;
            }
            if (cloud.material.uniforms) {
                cloud.material.uniforms.time.value += deltaTime;
            }
        });

        // Update skybox
        if (this.atmosphere.skybox && this.atmosphere.skybox.material.uniforms) {
            this.atmosphere.skybox.material.uniforms.time.value += deltaTime;
        }
    }

    updateWeatherEffects(deltaTime) {
        // Update wind
        const windVariation = Math.sin(Date.now() * 0.001) * 0.5;
        this.weather.windSpeed = 5 + windVariation * 10;

        // Apply wind to particles
        if (this.particleSystem && this.particleSystem.activeEffects) {
            // Wind affects particle movement
        }
    }

    checkForRandomEvents() {
        // Random chance for special events
        if (Math.random() < 0.001) {
            const events = ['meteor_shower', 'aurora', 'eclipse', 'rainbow'];
            const event = events[Math.floor(Math.random() * events.length)];
            this.triggerSpecialEvent(event);
        }
    }

    triggerSpecialEvent(event) {
        console.log(`✨ Special event: ${event}`);

        switch (event) {
            case 'meteor_shower':
                this.createMeteorShower();
                break;
            case 'aurora':
                this.createAurora();
                break;
            case 'eclipse':
                this.createEclipse();
                break;
            case 'rainbow':
                this.createRainbow();
                break;
        }
    }

    // Utility methods
    getWeatherModifiers() {
        const weather = this.weatherTypes[this.weather.current];
        return {
            movement: weather.movementSpeed,
            building: weather.buildSpeed,
            combat: weather.combatModifier,
            resources: weather.resourceModifier,
            visibility: weather.visibility
        };
    }

    getTimeOfDay() {
        const hour = this.worldTime.hour;
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 20) return 'evening';
        return 'night';
    }

    notifyWeatherChange(oldWeather, newWeather) {
        // Notify other game systems
        if (this.gameWorld.showChampionshipNotification) {
            this.gameWorld.showChampionshipNotification(
                `Weather: ${this.weatherTypes[newWeather].name}`,
                3000
            );
        }
    }

    destroy() {
        // Clean up atmosphere
        if (this.atmosphere.skybox) {
            this.scene.remove(this.atmosphere.skybox);
            this.atmosphere.skybox.geometry.dispose();
            this.atmosphere.skybox.material.dispose();
        }

        // Clean up celestial bodies
        if (this.atmosphere.sunMesh) {
            this.scene.remove(this.atmosphere.sunMesh);
        }
        if (this.atmosphere.moonMesh) {
            this.scene.remove(this.atmosphere.moonMesh);
        }

        // Clean up clouds
        this.atmosphere.clouds.forEach(cloud => {
            this.scene.remove(cloud);
            cloud.geometry.dispose();
            cloud.material.dispose();
        });

        // Clean up wildlife
        this.wildlife.animals.forEach(animal => {
            if (animal.mesh) {
                this.scene.remove(animal.mesh);
                animal.mesh.geometry.dispose();
                animal.mesh.material.dispose();
            }
        });

        // Clean up zones
        this.environmentalZones.forEach(zone => {
            if (zone.mesh) {
                this.scene.remove(zone.mesh);
                zone.mesh.geometry.dispose();
                zone.mesh.material.dispose();
            }
        });

        console.log('🌍 Dynamic World Systems destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicWorldSystems;
}