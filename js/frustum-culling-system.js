/**
 * Blaze Worlds Championship Frustum Culling System
 *
 * Like a championship defensive coordinator who knows exactly which
 * receivers to cover and which to ignore based on field position,
 * this system only renders objects visible to the camera, dramatically
 * improving performance by skipping invisible geometry.
 */

class ChampionshipFrustumCulling {
    constructor(camera, renderer, scene) {
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;

        // Culling configuration - like defensive zone coverage
        this.config = {
            enabled: true,
            useOcclusionCulling: false,      // More expensive but more accurate
            useBoundsExpansion: true,        // Expand bounds slightly for safety
            boundsExpansionFactor: 1.1,      // 10% expansion
            cullSmallObjects: true,          // Cull objects too small to matter
            minPixelSize: 2,                 // Minimum pixels to render
            useAdaptiveCulling: true,        // Adjust culling based on performance
            cullingBudget: 2,                // Max milliseconds per frame for culling
            distanceCulling: true,           // Cull objects beyond certain distance
            maxDistance: 2000,               // Maximum render distance
            useLODBasedCulling: true,        // Work with LOD system
            debugMode: false                 // Show culling statistics
        };

        // Frustum planes for culling calculations
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();

        // Object management
        this.cullableObjects = new Set();      // Objects that can be culled
        this.staticObjects = new Map();        // Static objects with cached bounds
        this.dynamicObjects = new Set();       // Objects that move frequently
        this.alwaysVisible = new Set();        // Objects that should never be culled

        // Spatial partitioning for efficiency
        this.spatialGrid = new SpatialGrid(100); // 100-unit grid cells

        // Performance tracking
        this.metrics = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0,
            cullingTime: 0,
            boundsChecks: 0,
            spatialQueries: 0,
            lastFrameCullCount: 0,
            averageCullRatio: 0
        };

        // Adaptive culling parameters
        this.adaptiveParams = {
            targetFPS: 60,
            currentFPS: 60,
            cullAggressiveness: 1.0,        // Multiplier for culling thresholds
            performanceHistory: [],
            adjustmentThreshold: 5          // Frames before adjusting
        };

        // Occlusion culling setup
        if (this.config.useOcclusionCulling) {
            this.initializeOcclusionCulling();
        }

        console.log('🏆 Championship Frustum Culling System initialized - Ready to optimize the field!');
    }

    /**
     * Initialize occlusion culling system
     * Like setting up advanced scouting networks
     */
    initializeOcclusionCulling() {
        this.occlusionRenderer = new THREE.WebGLRenderer({
            canvas: document.createElement('canvas'),
            context: this.renderer.getContext(),
            antialias: false,
            alpha: false
        });

        this.occlusionRenderer.setSize(256, 256); // Low resolution for occlusion tests
        this.occlusionRenderer.setClearColor(0x000000, 1.0);

        // Create occlusion query materials
        this.occlusionMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });

        console.log('🔍 Occlusion culling initialized');
    }

    /**
     * Register an object for culling
     * Like adding a player to the scouting report
     */
    registerObject(object, options = {}) {
        const objectData = {
            object: object,
            bounds: null,
            lastVisible: true,
            boundsNeedUpdate: true,
            cullingEnabled: options.cullingEnabled !== false,
            isStatic: options.isStatic || false,
            importance: options.importance || 1.0,
            minPixelSize: options.minPixelSize || this.config.minPixelSize,
            maxDistance: options.maxDistance || this.config.maxDistance,
            lastPosition: object.position.clone(),
            lastScale: object.scale.clone(),
            boundsUpdateThreshold: options.boundsUpdateThreshold || 0.1
        };

        if (objectData.isStatic) {
            this.staticObjects.set(object.uuid, objectData);
            // Add to spatial grid
            this.addToSpatialGrid(object, objectData);
        } else {
            this.dynamicObjects.add(objectData);
        }

        this.cullableObjects.add(objectData);
        this.metrics.totalObjects++;

        return objectData;
    }

    /**
     * Add object to spatial partitioning grid
     * Like organizing players by field position
     */
    addToSpatialGrid(object, objectData) {
        const bounds = this.calculateBounds(object);
        if (bounds) {
            this.spatialGrid.addObject(object, bounds);
            objectData.bounds = bounds;
        }
    }

    /**
     * Calculate bounding sphere for an object
     * Like determining a player's coverage area
     */
    calculateBounds(object) {
        if (!object.geometry && !object.children.length) {
            return null;
        }

        const bounds = new THREE.Sphere();

        if (object.geometry) {
            if (!object.geometry.boundingSphere) {
                object.geometry.computeBoundingSphere();
            }

            bounds.copy(object.geometry.boundingSphere);
            bounds.applyMatrix4(object.matrixWorld);
        } else {
            // Calculate bounds from children
            const box = new THREE.Box3();
            box.setFromObject(object);
            box.getBoundingSphere(bounds);
        }

        // Expand bounds if configured
        if (this.config.useBoundsExpansion) {
            bounds.radius *= this.config.boundsExpansionFactor;
        }

        return bounds;
    }

    /**
     * Update frustum culling for the frame
     * Like analyzing which receivers are in coverage
     */
    update() {
        if (!this.config.enabled) return;

        const startTime = performance.now();

        // Update camera frustum
        this.updateFrustum();

        // Reset metrics
        this.metrics.boundsChecks = 0;
        this.metrics.spatialQueries = 0;
        this.metrics.visibleObjects = 0;
        this.metrics.culledObjects = 0;

        // Update dynamic objects first (they change frequently)
        this.updateDynamicObjects();

        // Query spatial grid for potentially visible static objects
        if (this.staticObjects.size > 0) {
            this.updateStaticObjects();
        }

        // Apply occlusion culling if enabled
        if (this.config.useOcclusionCulling) {
            this.updateOcclusionCulling();
        }

        // Update performance metrics
        this.metrics.cullingTime = performance.now() - startTime;
        this.updateAdaptiveParameters();

        // Debug output if enabled
        if (this.config.debugMode) {
            this.logDebugInfo();
        }
    }

    /**
     * Update camera frustum matrix
     * Like updating field awareness based on camera position
     */
    updateFrustum() {
        this.cameraMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
    }

    /**
     * Update culling for dynamic objects
     * Like tracking moving receivers
     */
    updateDynamicObjects() {
        this.dynamicObjects.forEach((objectData) => {
            if (!objectData.cullingEnabled) {
                objectData.object.visible = true;
                this.metrics.visibleObjects++;
                return;
            }

            // Update bounds if object moved significantly
            if (this.shouldUpdateBounds(objectData)) {
                objectData.bounds = this.calculateBounds(objectData.object);
                objectData.lastPosition.copy(objectData.object.position);
                objectData.lastScale.copy(objectData.object.scale);
                objectData.boundsNeedUpdate = false;
            }

            // Perform culling test
            const isVisible = this.testVisibility(objectData);
            this.applyVisibility(objectData, isVisible);
        });
    }

    /**
     * Update culling for static objects using spatial queries
     * Like checking which fixed positions are in view
     */
    updateStaticObjects() {
        // Query spatial grid for potentially visible objects
        const potentiallyVisible = this.spatialGrid.query(this.frustum);
        this.metrics.spatialQueries++;

        potentiallyVisible.forEach((object) => {
            const objectData = this.staticObjects.get(object.uuid);
            if (!objectData) return;

            if (!objectData.cullingEnabled) {
                objectData.object.visible = true;
                this.metrics.visibleObjects++;
                return;
            }

            // Static objects rarely need bounds updates
            if (objectData.boundsNeedUpdate) {
                objectData.bounds = this.calculateBounds(objectData.object);
                objectData.boundsNeedUpdate = false;
            }

            const isVisible = this.testVisibility(objectData);
            this.applyVisibility(objectData, isVisible);
        });

        // Mark non-queried static objects as not visible
        this.staticObjects.forEach((objectData, uuid) => {
            if (!potentiallyVisible.find(obj => obj.uuid === uuid)) {
                if (objectData.lastVisible) {
                    objectData.object.visible = false;
                    objectData.lastVisible = false;
                    this.metrics.culledObjects++;
                }
            }
        });
    }

    /**
     * Test if an object should be visible
     * Like determining if a receiver is in coverage
     */
    testVisibility(objectData) {
        if (!objectData.bounds) return true;

        this.metrics.boundsChecks++;

        // Distance culling
        if (this.config.distanceCulling) {
            const distance = objectData.bounds.center.distanceTo(this.camera.position);
            const adjustedMaxDistance = objectData.maxDistance * this.adaptiveParams.cullAggressiveness;

            if (distance > adjustedMaxDistance) {
                return false;
            }
        }

        // Frustum culling
        if (!this.frustum.intersectsSphere(objectData.bounds)) {
            return false;
        }

        // Pixel size culling
        if (this.config.cullSmallObjects) {
            const pixelSize = this.calculatePixelSize(objectData);
            const adjustedMinSize = objectData.minPixelSize / this.adaptiveParams.cullAggressiveness;

            if (pixelSize < adjustedMinSize) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate pixel size of object on screen
     * Like determining how much field a player covers from the camera's perspective
     */
    calculatePixelSize(objectData) {
        const distance = objectData.bounds.center.distanceTo(this.camera.position);
        const radius = objectData.bounds.radius;

        // Simple angular size calculation
        const angularSize = (radius / distance) * 2;
        const fov = this.camera.fov * Math.PI / 180;
        const pixelSize = (angularSize / fov) * this.renderer.getSize(new THREE.Vector2()).height;

        return Math.max(0, pixelSize);
    }

    /**
     * Apply visibility result to object
     * Like signaling which receivers to cover
     */
    applyVisibility(objectData, isVisible) {
        if (isVisible !== objectData.lastVisible) {
            objectData.object.visible = isVisible;
            objectData.lastVisible = isVisible;

            if (isVisible) {
                this.metrics.visibleObjects++;
            } else {
                this.metrics.culledObjects++;
            }
        } else if (isVisible) {
            this.metrics.visibleObjects++;
        } else {
            this.metrics.culledObjects++;
        }
    }

    /**
     * Check if object bounds need updating
     * Like checking if a player has moved significantly
     */
    shouldUpdateBounds(objectData) {
        if (objectData.boundsNeedUpdate) return true;

        const positionDelta = objectData.object.position.distanceTo(objectData.lastPosition);
        const scaleDelta = Math.abs(objectData.object.scale.length() - objectData.lastScale.length());

        return positionDelta > objectData.boundsUpdateThreshold ||
               scaleDelta > objectData.boundsUpdateThreshold;
    }

    /**
     * Update occlusion culling
     * Like checking if receivers are blocked by other players
     */
    updateOcclusionCulling() {
        // Simplified occlusion culling implementation
        // In a full implementation, this would render depth-only passes
        // and test object visibility against the depth buffer

        this.cullableObjects.forEach((objectData) => {
            if (!objectData.lastVisible) return; // Already culled by frustum

            // Perform occlusion test (simplified)
            const isOccluded = this.testOcclusion(objectData);
            if (isOccluded) {
                objectData.object.visible = false;
                objectData.lastVisible = false;
                this.metrics.culledObjects++;
                this.metrics.visibleObjects--;
            }
        });
    }

    /**
     * Test if object is occluded by other geometry
     * Like checking if line of sight is blocked
     */
    testOcclusion(objectData) {
        // Simplified occlusion test
        // Cast ray from camera to object center
        const direction = objectData.bounds.center.clone()
            .sub(this.camera.position)
            .normalize();

        const raycaster = new THREE.Raycaster(this.camera.position, direction);
        const distance = this.camera.position.distanceTo(objectData.bounds.center);

        // Check for intersections with other objects
        const intersections = raycaster.intersectObjects(this.scene.children, true);

        // If there's an intersection closer than our object, it's occluded
        return intersections.length > 0 &&
               intersections[0].distance < distance - objectData.bounds.radius;
    }

    /**
     * Update adaptive culling parameters based on performance
     * Like adjusting defensive schemes based on opponent performance
     */
    updateAdaptiveParameters() {
        if (!this.config.useAdaptiveCulling) return;

        // Estimate current FPS (simplified)
        this.adaptiveParams.currentFPS = 1000 / (this.metrics.cullingTime + 16.67);
        this.adaptiveParams.performanceHistory.push(this.adaptiveParams.currentFPS);

        // Keep only recent history
        if (this.adaptiveParams.performanceHistory.length > this.adaptiveParams.adjustmentThreshold) {
            this.adaptiveParams.performanceHistory.shift();
        }

        // Adjust culling aggressiveness based on performance
        const averageFPS = this.adaptiveParams.performanceHistory.reduce((sum, fps) => sum + fps, 0) /
                          this.adaptiveParams.performanceHistory.length;

        if (averageFPS < this.adaptiveParams.targetFPS * 0.9) {
            // Performance is low, cull more aggressively
            this.adaptiveParams.cullAggressiveness = Math.min(2.0, this.adaptiveParams.cullAggressiveness * 1.1);
        } else if (averageFPS > this.adaptiveParams.targetFPS * 1.1) {
            // Performance is good, cull less aggressively
            this.adaptiveParams.cullAggressiveness = Math.max(0.5, this.adaptiveParams.cullAggressiveness * 0.95);
        }
    }

    /**
     * Force update bounds for an object
     * Like updating scouting reports when players change positions
     */
    updateObjectBounds(object) {
        const objectData = this.staticObjects.get(object.uuid) ||
                          [...this.dynamicObjects].find(data => data.object === object);

        if (objectData) {
            objectData.boundsNeedUpdate = true;
        }
    }

    /**
     * Mark object as always visible
     * Like designating key players who must always be watched
     */
    setAlwaysVisible(object, alwaysVisible = true) {
        if (alwaysVisible) {
            this.alwaysVisible.add(object.uuid);
        } else {
            this.alwaysVisible.delete(object.uuid);
        }
    }

    /**
     * Get culling statistics
     * Like reviewing defensive statistics
     */
    getStats() {
        const cullRatio = this.metrics.totalObjects > 0 ?
                         (this.metrics.culledObjects / this.metrics.totalObjects) * 100 : 0;

        return {
            ...this.metrics,
            cullRatio: cullRatio,
            adaptiveAggressiveness: this.adaptiveParams.cullAggressiveness,
            spatialGridCells: this.spatialGrid.getCellCount(),
            performanceGain: this.estimatePerformanceGain()
        };
    }

    /**
     * Estimate performance gain from culling
     */
    estimatePerformanceGain() {
        const cullRatio = this.metrics.culledObjects / Math.max(1, this.metrics.totalObjects);
        const estimatedGain = cullRatio * 0.7; // Assume 70% of performance scales with object count
        return Math.round(estimatedGain * 100);
    }

    /**
     * Log debug information
     */
    logDebugInfo() {
        console.log(`🔍 Culling Stats: ${this.metrics.visibleObjects}/${this.metrics.totalObjects} visible, ` +
                   `${this.metrics.culledObjects} culled (${(this.metrics.culledObjects/this.metrics.totalObjects*100).toFixed(1)}%), ` +
                   `${this.metrics.cullingTime.toFixed(2)}ms`);
    }

    /**
     * Enable/disable culling
     * Like calling off the defensive scheme
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;

        if (!enabled) {
            // Make all objects visible
            this.cullableObjects.forEach((objectData) => {
                objectData.object.visible = true;
            });
        }
    }

    /**
     * Configure culling parameters
     * Like adjusting the defensive playbook
     */
    configure(newConfig) {
        Object.assign(this.config, newConfig);

        // Update spatial grid if cell size changed
        if (newConfig.spatialGridSize && newConfig.spatialGridSize !== this.spatialGrid.cellSize) {
            this.spatialGrid = new SpatialGrid(newConfig.spatialGridSize);

            // Re-add static objects to new grid
            this.staticObjects.forEach((objectData) => {
                this.addToSpatialGrid(objectData.object, objectData);
            });
        }
    }

    /**
     * Cleanup and disposal
     * Like clearing the field after the game
     */
    dispose() {
        this.cullableObjects.clear();
        this.staticObjects.clear();
        this.dynamicObjects.clear();
        this.alwaysVisible.clear();
        this.spatialGrid.dispose();

        if (this.occlusionRenderer) {
            this.occlusionRenderer.dispose();
        }

        console.log('🏆 Championship Frustum Culling System disposed');
    }
}

/**
 * Spatial Grid for efficient spatial queries
 * Like organizing the field into zones for better coverage
 */
class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.objectToCells = new Map(); // Track which cells each object is in
    }

    /**
     * Get cell coordinates for a position
     */
    getCellCoords(position) {
        return {
            x: Math.floor(position.x / this.cellSize),
            y: Math.floor(position.y / this.cellSize),
            z: Math.floor(position.z / this.cellSize)
        };
    }

    /**
     * Get cell key from coordinates
     */
    getCellKey(coords) {
        return `${coords.x},${coords.y},${coords.z}`;
    }

    /**
     * Add object to spatial grid
     */
    addObject(object, bounds) {
        const cells = this.getCellsForBounds(bounds);
        const cellKeys = [];

        cells.forEach((coords) => {
            const key = this.getCellKey(coords);
            cellKeys.push(key);

            if (!this.cells.has(key)) {
                this.cells.set(key, new Set());
            }

            this.cells.get(key).add(object);
        });

        this.objectToCells.set(object.uuid, cellKeys);
    }

    /**
     * Remove object from spatial grid
     */
    removeObject(object) {
        const cellKeys = this.objectToCells.get(object.uuid);
        if (!cellKeys) return;

        cellKeys.forEach((key) => {
            const cell = this.cells.get(key);
            if (cell) {
                cell.delete(object);
                if (cell.size === 0) {
                    this.cells.delete(key);
                }
            }
        });

        this.objectToCells.delete(object.uuid);
    }

    /**
     * Get all cells that bounds intersect
     */
    getCellsForBounds(bounds) {
        const cells = [];
        const center = bounds.center;
        const radius = bounds.radius;

        const minCoords = this.getCellCoords({
            x: center.x - radius,
            y: center.y - radius,
            z: center.z - radius
        });

        const maxCoords = this.getCellCoords({
            x: center.x + radius,
            y: center.y + radius,
            z: center.z + radius
        });

        for (let x = minCoords.x; x <= maxCoords.x; x++) {
            for (let y = minCoords.y; y <= maxCoords.y; y++) {
                for (let z = minCoords.z; z <= maxCoords.z; z++) {
                    cells.push({ x, y, z });
                }
            }
        }

        return cells;
    }

    /**
     * Query objects that might intersect with frustum
     */
    query(frustum) {
        const results = new Set();

        // Get all cells that might intersect with frustum
        // Simplified: check against frustum bounding box
        const box = new THREE.Box3();

        // Calculate frustum bounding box (simplified)
        const planes = frustum.planes;
        let minX = -Infinity, minY = -Infinity, minZ = -Infinity;
        let maxX = Infinity, maxY = Infinity, maxZ = Infinity;

        // This is a simplified bounding box calculation
        // In practice, you'd want a more accurate frustum-to-box calculation
        planes.forEach((plane) => {
            const normal = plane.normal;
            const distance = -plane.constant;

            if (Math.abs(normal.x) > 0.1) {
                if (normal.x > 0) minX = Math.max(minX, distance);
                else maxX = Math.min(maxX, distance);
            }
            if (Math.abs(normal.y) > 0.1) {
                if (normal.y > 0) minY = Math.max(minY, distance);
                else maxY = Math.min(maxY, distance);
            }
            if (Math.abs(normal.z) > 0.1) {
                if (normal.z > 0) minZ = Math.max(minZ, distance);
                else maxZ = Math.min(maxZ, distance);
            }
        });

        // Query cells within bounding box
        const minCoords = this.getCellCoords({ x: minX, y: minY, z: minZ });
        const maxCoords = this.getCellCoords({ x: maxX, y: maxY, z: maxZ });

        for (let x = minCoords.x; x <= maxCoords.x; x++) {
            for (let y = minCoords.y; y <= maxCoords.y; y++) {
                for (let z = minCoords.z; z <= maxCoords.z; z++) {
                    const key = this.getCellKey({ x, y, z });
                    const cell = this.cells.get(key);

                    if (cell) {
                        cell.forEach((object) => results.add(object));
                    }
                }
            }
        }

        return Array.from(results);
    }

    /**
     * Get total cell count
     */
    getCellCount() {
        return this.cells.size;
    }

    /**
     * Cleanup
     */
    dispose() {
        this.cells.clear();
        this.objectToCells.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChampionshipFrustumCulling;
} else if (typeof window !== 'undefined') {
    window.ChampionshipFrustumCulling = ChampionshipFrustumCulling;
}