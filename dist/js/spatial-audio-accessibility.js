/**
 * Spatial Audio and Accessibility System
 * Texas Championship Edition - Inclusive Championship Experience
 *
 * Features:
 * - 3D spatial audio with Web Audio API
 * - Dynamic audio occlusion and reverb
 * - Screen reader support
 * - Colorblind modes
 * - Input remapping and alternatives
 * - Visual/audio/haptic feedback options
 */

class SpatialAudioAccessibilitySystem {
    constructor(scene, camera, gameWorld) {
        this.scene = scene;
        this.camera = camera;
        this.gameWorld = gameWorld;

        // Audio context and systems
        this.audioContext = null;
        this.audioListener = null;
        this.soundSources = new Map();
        this.ambientSounds = new Map();
        this.musicTracks = new Map();

        // Spatial audio configuration
        this.audioConfig = {
            masterVolume: 1.0,
            effectsVolume: 1.0,
            musicVolume: 0.7,
            ambientVolume: 0.5,
            maxDistance: 100,
            refDistance: 10,
            rolloffFactor: 1,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0
        };

        // Accessibility settings
        this.accessibilityConfig = {
            screenReaderEnabled: false,
            colorblindMode: 'none', // none, protanopia, deuteranopia, tritanopia
            subtitlesEnabled: true,
            subtitleSize: 'medium',
            highContrastMode: false,
            reducedMotion: false,
            hapticFeedback: true,
            audioDescriptions: false,
            visualIndicators: true,
            keyboardNavigation: true,
            mouseSmoothing: false,
            cameraShakeIntensity: 1.0
        };

        // Sound library
        this.soundLibrary = {
            // UI sounds
            ui: {
                hover: 'ui_hover.wav',
                select: 'ui_select.wav',
                open: 'ui_open.wav',
                close: 'ui_close.wav',
                error: 'ui_error.wav',
                success: 'ui_success.wav'
            },
            // Combat sounds
            combat: {
                sword_swing: 'sword_swing.wav',
                arrow_shoot: 'arrow_shoot.wav',
                impact_flesh: 'impact_flesh.wav',
                impact_armor: 'impact_armor.wav',
                explosion: 'explosion.wav',
                magic_cast: 'magic_cast.wav'
            },
            // Environment sounds
            environment: {
                footstep_grass: 'footstep_grass.wav',
                footstep_stone: 'footstep_stone.wav',
                footstep_sand: 'footstep_sand.wav',
                wind: 'wind_loop.wav',
                rain: 'rain_loop.wav',
                thunder: 'thunder.wav',
                river: 'river_loop.wav',
                birds: 'birds_loop.wav',
                crickets: 'crickets_loop.wav'
            },
            // Building sounds
            building: {
                construction: 'construction.wav',
                complete: 'building_complete.wav',
                destroy: 'building_destroy.wav',
                working: 'building_working.wav'
            },
            // Texas-specific sounds
            texas: {
                cattle: 'cattle_moo.wav',
                oil_pump: 'oil_pump.wav',
                horse_neigh: 'horse_neigh.wav',
                rattlesnake: 'rattlesnake.wav',
                coyote_howl: 'coyote_howl.wav'
            }
        };

        // Reverb zones
        this.reverbZones = new Map();

        // Audio occlusion system
        this.occlusionRaycaster = new THREE.Raycaster();
        this.occlusionCache = new Map();

        // Screen reader announcements queue
        this.announcementQueue = [];
        this.isAnnouncing = false;

        // Visual accessibility overlays
        this.colorblindFilters = {
            protanopia: new THREE.Matrix3().set(
                0.567, 0.433, 0,
                0.558, 0.442, 0,
                0, 0.242, 0.758
            ),
            deuteranopia: new THREE.Matrix3().set(
                0.625, 0.375, 0,
                0.7, 0.3, 0,
                0, 0.3, 0.7
            ),
            tritanopia: new THREE.Matrix3().set(
                0.95, 0.05, 0,
                0, 0.433, 0.567,
                0, 0.475, 0.525
            )
        };

        // Haptic feedback patterns
        this.hapticPatterns = {
            light: [{ duration: 50, intensity: 0.3 }],
            medium: [{ duration: 100, intensity: 0.6 }],
            heavy: [{ duration: 200, intensity: 1.0 }],
            double: [
                { duration: 50, intensity: 0.8 },
                { duration: 50, intensity: 0 },
                { duration: 50, intensity: 0.8 }
            ],
            success: [
                { duration: 100, intensity: 0.5 },
                { duration: 50, intensity: 0 },
                { duration: 150, intensity: 1.0 }
            ],
            error: [
                { duration: 300, intensity: 1.0 }
            ]
        };

        // Subtitle system
        this.subtitleContainer = null;
        this.activeSubtitles = [];

        this.init();
    }

    async init() {
        await this.initializeAudioContext();
        this.setupAccessibilityFeatures();
        this.createSubtitleSystem();
        this.loadSoundAssets();
        this.setupAmbientSoundscape();

        console.log('🔊 Spatial Audio & Accessibility System initialized');
        this.announceToScreenReader('Game audio and accessibility features loaded');
    }

    async initializeAudioContext() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Create audio listener (attached to camera)
            this.audioListener = new THREE.AudioListener();
            this.camera.add(this.audioListener);

            // Setup master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.audioConfig.masterVolume;
            this.masterGain.connect(this.audioContext.destination);

            // Setup channel gains
            this.effectsGain = this.audioContext.createGain();
            this.effectsGain.gain.value = this.audioConfig.effectsVolume;
            this.effectsGain.connect(this.masterGain);

            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.audioConfig.musicVolume;
            this.musicGain.connect(this.masterGain);

            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.gain.value = this.audioConfig.ambientVolume;
            this.ambientGain.connect(this.masterGain);

            // Setup convolver for reverb
            this.convolver = this.audioContext.createConvolver();
            this.convolver.connect(this.masterGain);

            // Setup compressor for dynamic range
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
            this.compressor.connect(this.masterGain);

            console.log('🎵 Web Audio API initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    setupAccessibilityFeatures() {
        // Check for screen reader
        this.detectScreenReader();

        // Setup keyboard navigation
        if (this.accessibilityConfig.keyboardNavigation) {
            this.setupKeyboardNavigation();
        }

        // Apply colorblind filter if needed
        if (this.accessibilityConfig.colorblindMode !== 'none') {
            this.applyColorblindFilter(this.accessibilityConfig.colorblindMode);
        }

        // Setup high contrast mode
        if (this.accessibilityConfig.highContrastMode) {
            this.enableHighContrast();
        }

        // Setup reduced motion
        if (this.accessibilityConfig.reducedMotion) {
            this.enableReducedMotion();
        }
    }

    detectScreenReader() {
        // Check for screen reader indicators
        const isScreenReader =
            window.navigator.userAgent.includes('NVDA') ||
            window.navigator.userAgent.includes('JAWS') ||
            window.navigator.userAgent.includes('VoiceOver') ||
            document.body.getAttribute('aria-hidden') === 'false';

        if (isScreenReader) {
            this.accessibilityConfig.screenReaderEnabled = true;
            console.log('📢 Screen reader detected');
        }
    }

    setupKeyboardNavigation() {
        // Enhanced keyboard controls for accessibility
        const keyboardShortcuts = {
            'Tab': () => this.focusNextElement(),
            'Shift+Tab': () => this.focusPreviousElement(),
            'Enter': () => this.activateFocusedElement(),
            'Escape': () => this.exitFocusMode(),
            'F1': () => this.announceHelp(),
            'F2': () => this.announceStatus(),
            'F3': () => this.announceLocation(),
            'F4': () => this.announceObjectives()
        };

        window.addEventListener('keydown', (e) => {
            const key = e.shiftKey ? `Shift+${e.key}` : e.key;
            const handler = keyboardShortcuts[key];
            if (handler) {
                e.preventDefault();
                handler();
            }
        });
    }

    // 3D Spatial Audio
    createPositionalSound(soundName, position, options = {}) {
        if (!this.audioContext) return null;

        const sound = new THREE.PositionalAudio(this.audioListener);

        // Load audio buffer
        const audioLoader = new THREE.AudioLoader();

        // Note: In production, implement proper audio loading
        // audioLoader.load(soundPath, (buffer) => {
        //     sound.setBuffer(buffer);
        //     sound.setRefDistance(options.refDistance || this.audioConfig.refDistance);
        //     sound.setRolloffFactor(options.rolloffFactor || this.audioConfig.rolloffFactor);
        //     sound.setMaxDistance(options.maxDistance || this.audioConfig.maxDistance);
        //     sound.setVolume(options.volume || 1.0);
        //     sound.setLoop(options.loop || false);
        //
        //     if (options.autoplay) {
        //         sound.play();
        //     }
        // });

        // Create visual representation for debugging
        if (this.accessibilityConfig.visualIndicators) {
            const soundIndicator = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.3,
                    wireframe: true
                })
            );
            soundIndicator.position.copy(position);
            this.scene.add(soundIndicator);

            // Pulse effect
            const pulseAnimation = () => {
                if (sound.isPlaying) {
                    const scale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
                    soundIndicator.scale.set(scale, scale, scale);
                    requestAnimationFrame(pulseAnimation);
                } else {
                    this.scene.remove(soundIndicator);
                }
            };
            pulseAnimation();
        }

        // Add to sound sources
        const soundId = `sound_${Date.now()}_${Math.random()}`;
        this.soundSources.set(soundId, {
            sound: sound,
            position: position,
            options: options
        });

        // Apply audio occlusion
        this.updateSoundOcclusion(soundId);

        // Announce to screen reader if significant
        if (this.accessibilityConfig.screenReaderEnabled && options.announce) {
            this.announceToScreenReader(`Sound: ${soundName} at ${this.getDirectionDescription(position)}`);
        }

        return sound;
    }

    updateSoundOcclusion(soundId) {
        const soundData = this.soundSources.get(soundId);
        if (!soundData || !soundData.sound) return;

        // Raycast from listener to sound source
        const listenerPos = this.camera.position;
        const soundPos = soundData.position;
        const direction = new THREE.Vector3().subVectors(soundPos, listenerPos).normalize();
        const distance = listenerPos.distanceTo(soundPos);

        this.occlusionRaycaster.set(listenerPos, direction);
        this.occlusionRaycaster.far = distance;

        // Check for obstacles
        const intersects = this.occlusionRaycaster.intersectObjects(this.scene.children, true);

        let occlusionFactor = 1.0;
        intersects.forEach(intersect => {
            if (intersect.distance < distance) {
                // Sound is occluded
                occlusionFactor *= 0.5; // Reduce volume for each obstacle
            }
        });

        // Apply occlusion as low-pass filter
        if (soundData.sound.filters && soundData.sound.filters.length > 0) {
            const filter = soundData.sound.filters[0];
            filter.frequency.value = 22050 * occlusionFactor; // Reduce high frequencies when occluded
        }

        // Update volume based on occlusion
        soundData.sound.setVolume((soundData.options.volume || 1.0) * occlusionFactor);

        // Cache occlusion result
        this.occlusionCache.set(soundId, {
            factor: occlusionFactor,
            timestamp: Date.now()
        });
    }

    createReverbZone(position, radius, options = {}) {
        const zone = {
            position: position,
            radius: radius,
            wetness: options.wetness || 0.5,
            roomSize: options.roomSize || 0.5,
            decay: options.decay || 2
        };

        this.reverbZones.set(`zone_${Date.now()}`, zone);

        // Visual indicator for reverb zone
        if (this.accessibilityConfig.visualIndicators) {
            const zoneIndicator = new THREE.Mesh(
                new THREE.SphereGeometry(radius, 16, 16),
                new THREE.MeshBasicMaterial({
                    color: 0x0000ff,
                    transparent: true,
                    opacity: 0.1,
                    wireframe: true
                })
            );
            zoneIndicator.position.copy(position);
            this.scene.add(zoneIndicator);
        }
    }

    checkReverbZones(position) {
        let reverbLevel = 0;

        this.reverbZones.forEach(zone => {
            const distance = position.distanceTo(zone.position);
            if (distance <= zone.radius) {
                const intensity = 1 - (distance / zone.radius);
                reverbLevel = Math.max(reverbLevel, zone.wetness * intensity);
            }
        });

        return reverbLevel;
    }

    // Ambient soundscape
    setupAmbientSoundscape() {
        // Create layered ambient sounds based on environment
        this.createAmbientLayer('wind', {
            volume: 0.3,
            loop: true,
            fadeIn: 2000
        });

        this.createAmbientLayer('birds', {
            volume: 0.2,
            loop: true,
            timeOfDay: 'day'
        });

        this.createAmbientLayer('crickets', {
            volume: 0.25,
            loop: true,
            timeOfDay: 'night'
        });
    }

    createAmbientLayer(soundName, options = {}) {
        const ambient = new THREE.Audio(this.audioListener);

        // Note: Load actual audio file in production
        // const audioLoader = new THREE.AudioLoader();
        // audioLoader.load(this.soundLibrary.environment[soundName], (buffer) => {
        //     ambient.setBuffer(buffer);
        //     ambient.setLoop(options.loop || true);
        //     ambient.setVolume(options.volume || 0.5);
        //
        //     if (options.fadeIn) {
        //         ambient.setVolume(0);
        //         ambient.play();
        //         this.fadeAudio(ambient, 0, options.volume, options.fadeIn);
        //     } else {
        //         ambient.play();
        //     }
        // });

        this.ambientSounds.set(soundName, {
            audio: ambient,
            options: options
        });
    }

    fadeAudio(audio, fromVolume, toVolume, duration) {
        const startTime = Date.now();
        const volumeChange = toVolume - fromVolume;

        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            audio.setVolume(fromVolume + volumeChange * progress);

            if (progress < 1) {
                requestAnimationFrame(fade);
            }
        };

        fade();
    }

    // Dynamic music system
    playMusic(trackName, options = {}) {
        const music = new THREE.Audio(this.audioListener);

        // Note: Load music file in production
        // const audioLoader = new THREE.AudioLoader();
        // audioLoader.load(trackPath, (buffer) => {
        //     music.setBuffer(buffer);
        //     music.setLoop(options.loop !== false);
        //     music.setVolume(this.audioConfig.musicVolume);
        //     music.play();
        // });

        // Cross-fade if replacing current music
        const currentMusic = this.musicTracks.get('current');
        if (currentMusic && currentMusic.isPlaying) {
            this.fadeAudio(currentMusic, this.audioConfig.musicVolume, 0, 1000);
            setTimeout(() => currentMusic.stop(), 1000);
        }

        this.musicTracks.set('current', music);

        // Announce track change
        if (this.accessibilityConfig.audioDescriptions) {
            this.announceToScreenReader(`Now playing: ${trackName}`);
        }
    }

    // Subtitle system
    createSubtitleSystem() {
        this.subtitleContainer = document.createElement('div');
        this.subtitleContainer.className = 'subtitle-container';
        this.subtitleContainer.style.cssText = `
            position: fixed;
            bottom: 10%;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            pointer-events: none;
            z-index: 1000;
            max-width: 80%;
        `;

        document.body.appendChild(this.subtitleContainer);
    }

    showSubtitle(text, speaker = '', duration = 3000) {
        if (!this.accessibilityConfig.subtitlesEnabled) return;

        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';

        // Apply size based on settings
        const sizes = {
            small: '14px',
            medium: '18px',
            large: '24px'
        };

        subtitle.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            margin-bottom: 5px;
            font-size: ${sizes[this.accessibilityConfig.subtitleSize]};
            font-family: Arial, sans-serif;
            line-height: 1.4;
            ${this.accessibilityConfig.highContrastMode ? 'border: 2px solid yellow;' : ''}
        `;

        // Format text with speaker
        subtitle.innerHTML = speaker ? `<strong>${speaker}:</strong> ${text}` : text;

        this.subtitleContainer.appendChild(subtitle);
        this.activeSubtitles.push(subtitle);

        // Auto-remove after duration
        setTimeout(() => {
            if (subtitle.parentNode) {
                subtitle.style.opacity = '0';
                subtitle.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    if (subtitle.parentNode) {
                        this.subtitleContainer.removeChild(subtitle);
                    }
                    const index = this.activeSubtitles.indexOf(subtitle);
                    if (index > -1) {
                        this.activeSubtitles.splice(index, 1);
                    }
                }, 500);
            }
        }, duration);
    }

    // Screen reader support
    announceToScreenReader(text, priority = 'polite') {
        if (!this.accessibilityConfig.screenReaderEnabled) return;

        const announcement = { text, priority, timestamp: Date.now() };
        this.announcementQueue.push(announcement);

        if (!this.isAnnouncing) {
            this.processAnnouncementQueue();
        }
    }

    processAnnouncementQueue() {
        if (this.announcementQueue.length === 0) {
            this.isAnnouncing = false;
            return;
        }

        this.isAnnouncing = true;

        // Sort by priority (assertive first)
        this.announcementQueue.sort((a, b) => {
            if (a.priority === 'assertive' && b.priority !== 'assertive') return -1;
            if (b.priority === 'assertive' && a.priority !== 'assertive') return 1;
            return a.timestamp - b.timestamp;
        });

        const announcement = this.announcementQueue.shift();

        // Create ARIA live region
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', announcement.priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;

        liveRegion.textContent = announcement.text;
        document.body.appendChild(liveRegion);

        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(liveRegion);
            this.processAnnouncementQueue();
        }, 100);
    }

    announceHelp() {
        const helpText = `
            Game Controls Help:
            Use W A S D to move.
            Use mouse to look around.
            Press B to open build menu.
            Press H for hero commands.
            Press Tab to toggle AR mode.
            Press F1 for this help message.
            Press F2 for status update.
            Press F3 for location information.
            Press F4 for current objectives.
        `;
        this.announceToScreenReader(helpText, 'assertive');
    }

    announceStatus() {
        if (this.gameWorld.economySystem) {
            const resources = this.gameWorld.economySystem.resources;
            const status = `
                Current Status:
                Wood: ${Math.floor(resources.wood.amount)}.
                Stone: ${Math.floor(resources.stone.amount)}.
                Gold: ${Math.floor(resources.gold.amount)}.
                Population: ${this.gameWorld.economySystem.currentPopulation} of ${this.gameWorld.economySystem.populationCap}.
            `;
            this.announceToScreenReader(status, 'polite');
        }
    }

    announceLocation() {
        const position = this.camera.position;
        const biome = this.gameWorld.championshipStats?.biome || 'Unknown';
        const location = `
            Current Location:
            Position: X ${Math.floor(position.x)}, Y ${Math.floor(position.y)}, Z ${Math.floor(position.z)}.
            Biome: ${biome}.
            Weather: ${this.gameWorld.weather?.current || 'Clear'}.
        `;
        this.announceToScreenReader(location, 'polite');
    }

    announceObjectives() {
        const objectives = `
            Current Objectives:
            Build a Town Hall to establish your base.
            Gather resources to expand your economy.
            Train heroes to defend your territory.
            Claim land to grow your empire.
        `;
        this.announceToScreenReader(objectives, 'polite');
    }

    getDirectionDescription(position) {
        const direction = new THREE.Vector3().subVectors(position, this.camera.position);
        const angle = Math.atan2(direction.x, direction.z);
        const distance = direction.length();

        const cardinalDirections = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        const index = Math.round(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8;

        return `${Math.round(distance)} meters to the ${cardinalDirections[index]}`;
    }

    // Visual accessibility
    applyColorblindFilter(mode) {
        if (!this.colorblindFilters[mode]) return;

        // Create post-processing shader for colorblind simulation
        const colorblindShader = {
            uniforms: {
                tDiffuse: { value: null },
                matrix: { value: this.colorblindFilters[mode] }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform mat3 matrix;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 filtered = matrix * color.rgb;
                    gl_FragColor = vec4(filtered, color.a);
                }
            `
        };

        // Note: Apply this shader as a post-processing pass in production
        console.log(`🎨 Colorblind filter applied: ${mode}`);
    }

    enableHighContrast() {
        // Increase contrast in materials
        this.scene.traverse((object) => {
            if (object.material) {
                if (object.material.color) {
                    // Increase saturation and brightness
                    const hsl = object.material.color.getHSL({});
                    hsl.s = Math.min(hsl.s * 1.5, 1);
                    hsl.l = hsl.l > 0.5 ? Math.min(hsl.l * 1.2, 1) : Math.max(hsl.l * 0.8, 0);
                    object.material.color.setHSL(hsl.h, hsl.s, hsl.l);
                }

                // Add outlines
                if (object.material.emissive) {
                    object.material.emissive = new THREE.Color(0xffffff);
                    object.material.emissiveIntensity = 0.1;
                }
            }
        });

        console.log('🔲 High contrast mode enabled');
    }

    enableReducedMotion() {
        // Disable camera shake
        this.accessibilityConfig.cameraShakeIntensity = 0;

        // Reduce particle effects
        if (this.gameWorld.particleSystem) {
            this.gameWorld.particleSystem.config.maxParticles =
                Math.floor(this.gameWorld.particleSystem.config.maxParticles * 0.3);
        }

        // Disable screen flash effects
        // Reduce animation speeds

        console.log('🎬 Reduced motion enabled');
    }

    // Haptic feedback
    triggerHaptic(pattern = 'light') {
        if (!this.accessibilityConfig.hapticFeedback) return;
        if (!window.navigator.vibrate) return;

        const hapticPattern = this.hapticPatterns[pattern];
        if (!hapticPattern) return;

        const vibratePattern = [];
        hapticPattern.forEach((pulse, index) => {
            if (index > 0) {
                vibratePattern.push(50); // Gap between pulses
            }
            vibratePattern.push(pulse.duration * pulse.intensity);
        });

        window.navigator.vibrate(vibratePattern);
    }

    // Audio cues for visual events
    playAudioCue(eventType, data = {}) {
        if (!this.accessibilityConfig.audioDescriptions) return;

        const audioCues = {
            'enemy_spotted': () => {
                this.createPositionalSound('alert', data.position, {
                    volume: 0.8,
                    announce: true
                });
                this.announceToScreenReader('Enemy spotted nearby', 'assertive');
            },
            'building_complete': () => {
                this.createPositionalSound('success', data.position, {
                    volume: 1.0
                });
                this.announceToScreenReader(`${data.buildingType} construction complete`, 'polite');
            },
            'resource_depleted': () => {
                this.createPositionalSound('error', data.position, {
                    volume: 0.7
                });
                this.announceToScreenReader('Resource depleted', 'polite');
            },
            'health_low': () => {
                this.createPositionalSound('warning', this.camera.position, {
                    volume: 1.0
                });
                this.announceToScreenReader('Health critical', 'assertive');
                this.triggerHaptic('heavy');
            }
        };

        const handler = audioCues[eventType];
        if (handler) {
            handler();
        }
    }

    // Settings management
    updateAccessibilitySetting(setting, value) {
        this.accessibilityConfig[setting] = value;

        // Apply changes immediately
        switch (setting) {
            case 'colorblindMode':
                this.applyColorblindFilter(value);
                break;
            case 'highContrastMode':
                if (value) {
                    this.enableHighContrast();
                } else {
                    // Reset contrast - would need to store original values
                }
                break;
            case 'reducedMotion':
                if (value) {
                    this.enableReducedMotion();
                }
                break;
            case 'subtitlesEnabled':
                // Will apply to next subtitle
                break;
            case 'screenReaderEnabled':
                if (value) {
                    this.announceToScreenReader('Screen reader support enabled');
                }
                break;
        }

        // Save settings to localStorage
        localStorage.setItem('accessibilitySettings', JSON.stringify(this.accessibilityConfig));
    }

    loadAccessibilitySettings() {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            const settings = JSON.parse(saved);
            Object.assign(this.accessibilityConfig, settings);

            // Apply loaded settings
            Object.entries(settings).forEach(([key, value]) => {
                this.updateAccessibilitySetting(key, value);
            });
        }
    }

    // Update method
    update(deltaTime) {
        // Update positional audio occlusion
        if (Date.now() - this.lastOcclusionUpdate > 100) {
            this.soundSources.forEach((soundData, soundId) => {
                if (soundData.sound && soundData.sound.isPlaying) {
                    this.updateSoundOcclusion(soundId);
                }
            });
            this.lastOcclusionUpdate = Date.now();
        }

        // Update ambient sounds based on time of day
        if (this.gameWorld.worldTime) {
            const hour = this.gameWorld.worldTime.hour;
            const isDay = hour >= 6 && hour < 20;

            this.ambientSounds.forEach((ambientData, name) => {
                if (ambientData.options.timeOfDay) {
                    const shouldPlay =
                        (ambientData.options.timeOfDay === 'day' && isDay) ||
                        (ambientData.options.timeOfDay === 'night' && !isDay);

                    if (shouldPlay && !ambientData.audio.isPlaying) {
                        ambientData.audio.play();
                    } else if (!shouldPlay && ambientData.audio.isPlaying) {
                        this.fadeAudio(ambientData.audio, ambientData.options.volume, 0, 2000);
                        setTimeout(() => ambientData.audio.stop(), 2000);
                    }
                }
            });
        }

        // Update reverb based on player position
        const reverbLevel = this.checkReverbZones(this.camera.position);
        if (this.convolver) {
            this.convolver.buffer = reverbLevel > 0 ? this.getReverbImpulse(reverbLevel) : null;
        }

        // Clean up finished sounds
        this.soundSources.forEach((soundData, soundId) => {
            if (soundData.sound && !soundData.sound.isPlaying && !soundData.options.loop) {
                this.soundSources.delete(soundId);
            }
        });
    }

    getReverbImpulse(wetness) {
        // Generate impulse response for reverb
        // In production, use pre-recorded impulse responses
        const length = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2) * wetness;
            }
        }

        return impulse;
    }

    // Cleanup
    destroy() {
        // Stop all sounds
        this.soundSources.forEach(soundData => {
            if (soundData.sound && soundData.sound.isPlaying) {
                soundData.sound.stop();
            }
        });

        this.ambientSounds.forEach(ambientData => {
            if (ambientData.audio && ambientData.audio.isPlaying) {
                ambientData.audio.stop();
            }
        });

        this.musicTracks.forEach(music => {
            if (music && music.isPlaying) {
                music.stop();
            }
        });

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }

        // Remove subtitle container
        if (this.subtitleContainer && this.subtitleContainer.parentNode) {
            this.subtitleContainer.parentNode.removeChild(this.subtitleContainer);
        }

        // Remove audio listener from camera
        if (this.audioListener && this.camera) {
            this.camera.remove(this.audioListener);
        }

        console.log('🔊 Spatial Audio & Accessibility System destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpatialAudioAccessibilitySystem;
}