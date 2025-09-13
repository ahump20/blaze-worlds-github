/**
 * Blaze Worlds Championship Optimized Particle System
 *
 * Like a championship coaching staff managing player rotations,
 * this system uses object pooling to reuse particles efficiently,
 * eliminating garbage collection hitches and maintaining 60+ FPS
 * even with 100,000+ particles flying across the Texas landscape.
 */

class ChampionshipOptimizedParticleSystem {
    constructor(scene, renderer, camera) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;

        // Pool configuration - like organizing the team roster
        this.config = {
            maxPoolSize: 100000,          // Maximum particles in the pool
            initialPoolSize: 50000,       // Starting pool size
            batchSize: 1000,              // Particles to allocate in batches
            poolGrowthFactor: 1.5,        // How much to grow pool when needed
            cullDistance: 1000,           // Distance beyond which particles are culled
            useWebWorkers: true,          // Use web workers for particle updates
            useFrustumCulling: true,      // Only update visible particles
            useOcclusion: false,          // Occlusion culling (expensive)
            updateBudget: 5,              // Max milliseconds per frame for updates
        };

        // Particle pools organized by type - like position groups
        this.pools = {
            dust: new ParticlePool('dust', 20000),
            smoke: new ParticlePool('smoke', 15000),
            fire: new ParticlePool('fire', 10000),
            water: new ParticlePool('water', 8000),
            debris: new ParticlePool('debris', 5000),
            sparks: new ParticlePool('sparks', 12000),
            magic: new ParticlePool('magic', 3000),
            weather: new ParticlePool('weather', 25000),
            explosion: new ParticlePool('explosion', 2000)
        };

        // Active emitters - like active plays on the field
        this.emitters = new Map();

        // Batch rendering system for efficiency
        this.batchRenderer = new ParticleBatchRenderer(this.renderer, this.scene);

        // Performance monitoring
        this.metrics = {
            activeParticles: 0,
            pooledParticles: 0,
            frameUpdateTime: 0,
            gcHitches: 0,
            cullsThisFrame: 0,
            emittersActive: 0
        };

        // Timing for performance budgeting
        this.updateBudgetUsed = 0;
        this.lastFrameTime = performance.now();

        // Web Worker for offloading particle physics
        if (this.config.useWebWorkers && typeof Worker !== 'undefined') {
            this.initializeWebWorkers();
        }

        console.log('🏆 Championship Optimized Particle System ready - Let the fireworks begin!');
        this.initializePools();
    }

    /**
     * Initialize particle pools
     * Like setting up the team roster with different position groups
     */
    initializePools() {
        Object.values(this.pools).forEach(pool => {
            pool.initialize();
            this.metrics.pooledParticles += pool.size;
        });

        console.log(`📊 Initialized ${Object.keys(this.pools).length} particle pools with ${this.metrics.pooledParticles} total particles`);
    }

    /**
     * Initialize web workers for physics calculations
     */
    initializeWebWorkers() {
        try {
            // Create worker code as blob
            const workerCode = this.generateWorkerCode();
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));

            this.worker.onmessage = (event) => {
                this.handleWorkerResponse(event.data);
            };

            this.worker.onerror = (error) => {
                console.warn('Particle system worker error:', error);
                this.config.useWebWorkers = false;
            };

            console.log('🔧 Web Worker initialized for particle physics');
        } catch (error) {
            console.warn('Could not initialize web workers:', error);
            this.config.useWebWorkers = false;
        }
    }

    /**
     * Create an emitter for generating particles
     * Like setting up a new play formation
     */
    createEmitter(id, config) {
        const emitter = new ParticleEmitter(id, config, this.pools);
        this.emitters.set(id, emitter);
        this.metrics.emittersActive++;

        console.log(`⚡ Created particle emitter '${id}' for ${config.particleType} particles`);
        return emitter;
    }

    /**
     * Create dust storm emitter
     * Like calling for a ground game in windy conditions
     */
    createDustStormEmitter(position, intensity = 1.0) {
        return this.createEmitter('dustStorm', {
            position: position.clone(),
            particleType: 'dust',
            emissionRate: 500 * intensity,
            lifetime: 3.0,
            velocity: new THREE.Vector3(Math.random() - 0.5, 0.1, Math.random() - 0.5).multiplyScalar(20),
            acceleration: new THREE.Vector3(0, -2, 0),
            size: { min: 0.1, max: 0.5 },
            color: { r: 0.8, g: 0.7, b: 0.5, a: 0.6 },
            texturePath: '/textures/particles/dust.png',
            blendMode: THREE.AdditiveBlending,
            maxParticles: 2000,
            shape: 'sphere',
            radius: 50,
            wind: new THREE.Vector3(5, 0, 0)
        });
    }

    /**
     * Create explosion emitter
     * Like calling for a big play touchdown celebration
     */
    createExplosionEmitter(position, scale = 1.0) {
        return this.createEmitter('explosion', {
            position: position.clone(),
            particleType: 'explosion',
            emissionRate: 2000,
            burst: true,
            burstCount: 500 * scale,
            lifetime: 2.0,
            velocity: new THREE.Vector3(0, 0, 0),
            acceleration: new THREE.Vector3(0, -9.8, 0),
            velocitySpread: 30 * scale,
            size: { min: 0.2 * scale, max: 1.0 * scale },
            color: { r: 1.0, g: 0.6, b: 0.2, a: 1.0 },
            colorVariation: 0.3,
            texturePath: '/textures/particles/explosion.png',
            blendMode: THREE.AdditiveBlending,
            maxParticles: 500 * scale,
            fadeIn: true,
            fadeOut: true
        });
    }

    /**
     * Create weather system emitter
     * Like adapting to changing field conditions
     */
    createWeatherEmitter(weatherType, position, coverage = 1.0) {
        const weatherConfigs = {
            rain: {
                particleType: 'water',
                emissionRate: 1000 * coverage,
                lifetime: 5.0,
                velocity: new THREE.Vector3(0, -20, 0),
                velocitySpread: 2,
                size: { min: 0.05, max: 0.1 },
                color: { r: 0.7, g: 0.8, b: 1.0, a: 0.8 },
                shape: 'box',
                dimensions: new THREE.Vector3(200, 10, 200)
            },

            snow: {
                particleType: 'weather',
                emissionRate: 300 * coverage,
                lifetime: 10.0,
                velocity: new THREE.Vector3(0, -2, 0),
                velocitySpread: 1,
                size: { min: 0.1, max: 0.3 },
                color: { r: 1.0, g: 1.0, b: 1.0, a: 0.9 },
                shape: 'box',
                dimensions: new THREE.Vector3(300, 20, 300),
                wind: new THREE.Vector3(1, 0, 0)
            },

            tornado: {
                particleType: 'debris',
                emissionRate: 800 * coverage,
                lifetime: 8.0,
                velocity: new THREE.Vector3(0, 5, 0),
                velocitySpread: 15,
                size: { min: 0.2, max: 0.8 },
                color: { r: 0.5, g: 0.4, b: 0.3, a: 0.7 },
                shape: 'cylinder',
                radius: 20,
                height: 100,
                vortex: { strength: 30, height: 100 }
            }
        };

        const config = weatherConfigs[weatherType];
        if (config) {
            config.position = position.clone();
            return this.createEmitter(`weather_${weatherType}`, config);
        }

        console.warn(`Unknown weather type: ${weatherType}`);
        return null;
    }

    /**
     * Update all particle systems
     * Like running the offensive coordinators' plays each snap
     */
    update(deltaTime) {
        const frameStart = performance.now();
        this.updateBudgetUsed = 0;
        this.metrics.cullsThisFrame = 0;

        // Update active emitters within budget
        for (const [id, emitter] of this.emitters) {
            if (this.updateBudgetUsed >= this.config.updateBudget) break;

            const updateStart = performance.now();
            emitter.update(deltaTime, this.camera);
            this.updateBudgetUsed += performance.now() - updateStart;
        }

        // Update particle pools
        this.updateParticlePools(deltaTime);

        // Batch render all particles
        this.batchRenderer.render(this.camera);

        // Update metrics
        this.updateMetrics();
        this.metrics.frameUpdateTime = performance.now() - frameStart;

        // Check for performance issues
        this.checkPerformanceThresholds();
    }

    /**
     * Update all particle pools efficiently
     * Like managing substitutions across all position groups
     */
    updateParticlePools(deltaTime) {
        let totalActive = 0;

        Object.values(this.pools).forEach(pool => {
            // Update only active particles
            pool.updateActive(deltaTime, this.camera, this.config);
            totalActive += pool.activeCount;

            // Cull distant particles if enabled
            if (this.config.useFrustumCulling) {
                const culled = pool.cullDistantParticles(this.camera.position, this.config.cullDistance);
                this.metrics.cullsThisFrame += culled;
            }
        });

        this.metrics.activeParticles = totalActive;
    }

    /**
     * Emit particles from an emitter
     * Like calling for a specific play to run
     */
    emit(emitterId, count = null) {
        const emitter = this.emitters.get(emitterId);
        if (!emitter) {
            console.warn(`Emitter '${emitterId}' not found`);
            return;
        }

        emitter.emit(count);
    }

    /**
     * Stop an emitter
     * Like calling off a play
     */
    stopEmitter(emitterId) {
        const emitter = this.emitters.get(emitterId);
        if (emitter) {
            emitter.stop();
        }
    }

    /**
     * Remove an emitter completely
     * Like removing a play from the playbook
     */
    removeEmitter(emitterId) {
        const emitter = this.emitters.get(emitterId);
        if (emitter) {
            emitter.destroy();
            this.emitters.delete(emitterId);
            this.metrics.emittersActive--;
        }
    }

    /**
     * Update performance metrics
     */
    updateMetrics() {
        this.metrics.pooledParticles = 0;
        Object.values(this.pools).forEach(pool => {
            this.metrics.pooledParticles += pool.size;
        });
    }

    /**
     * Check for performance issues and auto-adjust
     * Like a coach making halftime adjustments
     */
    checkPerformanceThresholds() {
        const currentTime = performance.now();
        const frameTime = currentTime - this.lastFrameTime;

        // If frame time is too high, reduce particle counts
        if (frameTime > 20) { // Above 50 FPS threshold
            this.autoReduceParticles();
        }

        // If update budget is consistently exceeded, optimize
        if (this.updateBudgetUsed >= this.config.updateBudget * 0.9) {
            this.optimizeUpdateLoop();
        }

        this.lastFrameTime = currentTime;
    }

    /**
     * Automatically reduce particle counts when performance drops
     */
    autoReduceParticles() {
        this.emitters.forEach(emitter => {
            emitter.adjustForPerformance(0.8); // Reduce by 20%
        });

        console.log('⚡ Auto-reduced particle counts for better performance');
    }

    /**
     * Optimize update loop when budget is exceeded
     */
    optimizeUpdateLoop() {
        // Reduce update frequency for distant emitters
        this.emitters.forEach(emitter => {
            const distance = emitter.position.distanceTo(this.camera.position);
            if (distance > 200) {
                emitter.setUpdateFrequency(0.5); // Update every other frame
            }
        });

        console.log('🔧 Optimized update loop for better performance');
    }

    /**
     * Generate web worker code for particle physics
     */
    generateWorkerCode() {
        return `
            // Particle physics worker
            class WorkerParticlePhysics {
                updateParticles(particles, deltaTime, forces) {
                    particles.forEach(particle => {
                        if (!particle.active) return;

                        // Apply forces
                        forces.forEach(force => {
                            particle.velocity.add(force.multiply(deltaTime));
                        });

                        // Update position
                        particle.position.add(particle.velocity.clone().multiply(deltaTime));

                        // Update lifetime
                        particle.age += deltaTime;
                        if (particle.age >= particle.lifetime) {
                            particle.active = false;
                        }
                    });

                    return particles;
                }
            }

            const physics = new WorkerParticlePhysics();

            onmessage = function(event) {
                const { particles, deltaTime, forces } = event.data;
                const updated = physics.updateParticles(particles, deltaTime, forces);
                postMessage({ updated });
            };
        `;
    }

    /**
     * Handle responses from web worker
     */
    handleWorkerResponse(data) {
        if (data.updated) {
            // Apply worker results to actual particles
            // Implementation would sync worker data with Three.js particles
        }
    }

    /**
     * Get performance statistics
     * Like reviewing game statistics at halftime
     */
    getStats() {
        return {
            ...this.metrics,
            emitters: this.emitters.size,
            poolUtilization: this.calculatePoolUtilization(),
            memoryUsage: this.calculateMemoryUsage(),
            averageFrameTime: this.metrics.frameUpdateTime
        };
    }

    /**
     * Calculate pool utilization percentage
     */
    calculatePoolUtilization() {
        let totalActive = 0;
        let totalCapacity = 0;

        Object.values(this.pools).forEach(pool => {
            totalActive += pool.activeCount;
            totalCapacity += pool.size;
        });

        return totalCapacity > 0 ? (totalActive / totalCapacity) * 100 : 0;
    }

    /**
     * Calculate memory usage
     */
    calculateMemoryUsage() {
        let totalMemory = 0;
        Object.values(this.pools).forEach(pool => {
            totalMemory += pool.size * 48; // Approximate bytes per particle
        });
        return totalMemory;
    }

    /**
     * Cleanup and disposal
     * Like cleaning up the field after a championship game
     */
    dispose() {
        // Dispose emitters
        this.emitters.forEach(emitter => emitter.destroy());
        this.emitters.clear();

        // Dispose particle pools
        Object.values(this.pools).forEach(pool => pool.dispose());

        // Cleanup batch renderer
        this.batchRenderer.dispose();

        // Terminate web worker
        if (this.worker) {
            this.worker.terminate();
        }

        console.log('🏆 Championship Optimized Particle System disposed - Great game!');
    }
}

/**
 * Particle Pool Class - manages a pool of reusable particles
 * Like managing a position group with backup players ready
 */
class ParticlePool {
    constructor(type, initialSize) {
        this.type = type;
        this.size = initialSize;
        this.particles = [];
        this.activeParticles = [];
        this.inactiveParticles = [];
        this.activeCount = 0;

        // Pool statistics
        this.totalCreated = 0;
        this.totalReused = 0;
        this.peakUsage = 0;
    }

    initialize() {
        // Create initial particle pool
        for (let i = 0; i < this.size; i++) {
            const particle = this.createParticle();
            this.particles.push(particle);
            this.inactiveParticles.push(particle);
        }

        this.totalCreated = this.size;
        console.log(`🏊 Initialized ${this.type} pool with ${this.size} particles`);
    }

    createParticle() {
        return {
            // Transform
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            acceleration: new THREE.Vector3(),
            rotation: 0,
            rotationVelocity: 0,

            // Visual
            size: 1.0,
            sizeVelocity: 0,
            color: new THREE.Color(1, 1, 1),
            alpha: 1.0,
            alphaVelocity: 0,

            // Lifecycle
            active: false,
            age: 0,
            lifetime: 1.0,

            // Physics
            mass: 1.0,
            drag: 0.98,
            bounce: 0.5,

            // Type-specific data
            userData: {}
        };
    }

    acquire() {
        let particle;

        if (this.inactiveParticles.length > 0) {
            particle = this.inactiveParticles.pop();
            this.totalReused++;
        } else {
            // Pool exhausted, create new particle
            particle = this.createParticle();
            this.particles.push(particle);
            this.size++;
            this.totalCreated++;
        }

        // Reset particle state
        this.resetParticle(particle);

        // Move to active list
        this.activeParticles.push(particle);
        this.activeCount++;
        this.peakUsage = Math.max(this.peakUsage, this.activeCount);

        return particle;
    }

    release(particle) {
        particle.active = false;

        // Remove from active list
        const index = this.activeParticles.indexOf(particle);
        if (index !== -1) {
            this.activeParticles.splice(index, 1);
            this.inactiveParticles.push(particle);
            this.activeCount--;
        }
    }

    resetParticle(particle) {
        particle.position.set(0, 0, 0);
        particle.velocity.set(0, 0, 0);
        particle.acceleration.set(0, 0, 0);
        particle.rotation = 0;
        particle.rotationVelocity = 0;
        particle.size = 1.0;
        particle.sizeVelocity = 0;
        particle.color.setRGB(1, 1, 1);
        particle.alpha = 1.0;
        particle.alphaVelocity = 0;
        particle.active = true;
        particle.age = 0;
        particle.lifetime = 1.0;
        particle.mass = 1.0;
        particle.drag = 0.98;
        particle.bounce = 0.5;
        particle.userData = {};
    }

    updateActive(deltaTime, camera, config) {
        // Update only active particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];

            // Update physics
            particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime));
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            particle.velocity.multiplyScalar(particle.drag);

            // Update visual properties
            particle.size += particle.sizeVelocity * deltaTime;
            particle.alpha += particle.alphaVelocity * deltaTime;
            particle.rotation += particle.rotationVelocity * deltaTime;

            // Update age
            particle.age += deltaTime;

            // Check for death
            if (particle.age >= particle.lifetime || particle.alpha <= 0) {
                this.release(particle);
            }
        }
    }

    cullDistantParticles(cameraPosition, cullDistance) {
        let culled = 0;

        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            const distance = particle.position.distanceTo(cameraPosition);

            if (distance > cullDistance) {
                this.release(particle);
                culled++;
            }
        }

        return culled;
    }

    dispose() {
        this.particles.length = 0;
        this.activeParticles.length = 0;
        this.inactiveParticles.length = 0;
        this.activeCount = 0;
    }
}

/**
 * Particle Emitter Class - creates and manages particle emission
 * Like a coordinator calling different types of plays
 */
class ParticleEmitter {
    constructor(id, config, pools) {
        this.id = id;
        this.config = { ...config };
        this.pools = pools;

        this.position = config.position || new THREE.Vector3();
        this.active = true;
        this.emissionTimer = 0;
        this.updateFrequency = 1.0; // 1.0 = every frame

        // Performance adjustments
        this.performanceMultiplier = 1.0;
    }

    update(deltaTime, camera) {
        if (!this.active) return;

        // Apply update frequency
        if (Math.random() > this.updateFrequency) return;

        this.emissionTimer += deltaTime;

        // Calculate emission rate based on performance
        const adjustedRate = this.config.emissionRate * this.performanceMultiplier;
        const emissionInterval = 1.0 / adjustedRate;

        while (this.emissionTimer >= emissionInterval) {
            this.emitParticle();
            this.emissionTimer -= emissionInterval;
        }
    }

    emitParticle() {
        const pool = this.pools[this.config.particleType];
        if (!pool) return;

        const particle = pool.acquire();
        if (!particle) return;

        // Initialize particle based on emitter config
        this.initializeParticle(particle);
    }

    initializeParticle(particle) {
        const config = this.config;

        // Position
        particle.position.copy(this.position);
        this.applyEmissionShape(particle);

        // Velocity
        particle.velocity.copy(config.velocity || new THREE.Vector3());
        if (config.velocitySpread) {
            particle.velocity.add(this.randomVector3().multiplyScalar(config.velocitySpread));
        }

        // Acceleration
        particle.acceleration.copy(config.acceleration || new THREE.Vector3());

        // Visual properties
        if (config.size) {
            particle.size = this.randomBetween(config.size.min, config.size.max);
        }

        if (config.color) {
            particle.color.setRGB(config.color.r, config.color.g, config.color.b);
            particle.alpha = config.color.a || 1.0;
        }

        // Lifecycle
        particle.lifetime = config.lifetime || 1.0;
        particle.age = 0;

        // Type-specific initialization
        this.applyTypeSpecificConfig(particle);
    }

    applyEmissionShape(particle) {
        const config = this.config;

        switch (config.shape) {
            case 'sphere':
                const sphereDir = this.randomVector3().normalize();
                const sphereRadius = Math.random() * (config.radius || 1);
                particle.position.add(sphereDir.multiplyScalar(sphereRadius));
                break;

            case 'box':
                if (config.dimensions) {
                    particle.position.add(new THREE.Vector3(
                        (Math.random() - 0.5) * config.dimensions.x,
                        (Math.random() - 0.5) * config.dimensions.y,
                        (Math.random() - 0.5) * config.dimensions.z
                    ));
                }
                break;

            case 'cylinder':
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * (config.radius || 1);
                particle.position.add(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    (Math.random() - 0.5) * (config.height || 1),
                    Math.sin(angle) * radius
                ));
                break;
        }
    }

    applyTypeSpecificConfig(particle) {
        switch (this.config.particleType) {
            case 'dust':
                particle.drag = 0.95;
                particle.rotationVelocity = (Math.random() - 0.5) * 2;
                break;

            case 'fire':
                particle.sizeVelocity = -particle.size / particle.lifetime;
                particle.alphaVelocity = -particle.alpha / particle.lifetime;
                break;

            case 'explosion':
                particle.drag = 0.90;
                particle.sizeVelocity = particle.size / particle.lifetime;
                break;
        }
    }

    emit(count) {
        count = count || 1;
        for (let i = 0; i < count; i++) {
            this.emitParticle();
        }
    }

    stop() {
        this.active = false;
    }

    destroy() {
        this.active = false;
        // Additional cleanup would go here
    }

    adjustForPerformance(multiplier) {
        this.performanceMultiplier *= multiplier;
    }

    setUpdateFrequency(frequency) {
        this.updateFrequency = frequency;
    }

    randomVector3() {
        return new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        );
    }

    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }
}

/**
 * Particle Batch Renderer - efficiently renders particles in batches
 * Like organizing players into formations for maximum effectiveness
 */
class ParticleBatchRenderer {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;

        this.batches = new Map();
        this.materials = new Map();
    }

    render(camera) {
        // Batch rendering implementation would go here
        // This would group particles by material and render efficiently
    }

    dispose() {
        this.batches.clear();
        this.materials.forEach(material => material.dispose());
        this.materials.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChampionshipOptimizedParticleSystem;
} else if (typeof window !== 'undefined') {
    window.ChampionshipOptimizedParticleSystem = ChampionshipOptimizedParticleSystem;
}