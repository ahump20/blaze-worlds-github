/**
 * Blaze Worlds Championship Texture Atlas System
 *
 * Like consolidating multiple playbooks into one championship game plan,
 * this system combines multiple textures into single atlases to dramatically
 * reduce draw calls and boost performance to championship levels.
 */

class ChampionshipTextureAtlas {
    constructor(renderer) {
        this.renderer = renderer;

        // Atlas configuration - like organizing the championship playbook
        this.config = {
            maxAtlasSize: 4096,           // Maximum atlas texture size (like the playbook page limit)
            defaultAtlasSize: 2048,       // Default atlas size for most cases
            padding: 2,                   // Padding between textures (prevent bleeding)
            powerOfTwo: true,             // Ensure atlas dimensions are power of 2
            generateMipmaps: true,        // Generate mipmaps for better filtering
            flipY: false,                 // Don't flip Y coordinate
            format: THREE.RGBAFormat,     // Use RGBA format for flexibility
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter,
            wrapS: THREE.ClampToEdgeWrap,
            wrapT: THREE.ClampToEdgeWrap
        };

        // Atlas management
        this.atlases = new Map();          // Active texture atlases
        this.textureMap = new Map();       // Maps original texture to atlas position
        this.materialCache = new Map();    // Cache for atlased materials
        this.pendingTextures = new Set();  // Textures waiting to be atlased

        // Performance tracking
        this.stats = {
            originalDrawCalls: 0,
            atlasedDrawCalls: 0,
            texturesAtlased: 0,
            atlasesCreated: 0,
            memoryUsed: 0,
            memoryFreed: 0
        };

        // Canvas for atlas generation
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        console.log('🏆 Championship Texture Atlas System initialized - Ready to consolidate for victory!');
    }

    /**
     * Create a new texture atlas
     * Like creating a new chapter in the championship playbook
     */
    createAtlas(name, atlasSize = this.config.defaultAtlasSize, category = 'general') {
        const atlas = {
            name: name,
            category: category,
            size: atlasSize,
            texture: null,
            canvas: document.createElement('canvas'),
            context: null,

            // Atlas layout management
            regions: new Map(),           // Maps texture ID to atlas region
            freeRects: [],               // Available rectangles for packing
            usedRects: [],               // Used rectangles

            // Packing state
            currentX: this.config.padding,
            currentY: this.config.padding,
            rowHeight: 0,

            // Statistics
            usedArea: 0,
            totalArea: atlasSize * atlasSize,
            efficiency: 0,
            textureCount: 0,

            // Three.js texture object
            threeTexture: null,

            // Generation timestamp
            lastUpdate: 0
        };

        // Setup canvas
        atlas.canvas.width = atlasSize;
        atlas.canvas.height = atlasSize;
        atlas.context = atlas.canvas.getContext('2d');

        // Clear with transparent background
        atlas.context.clearRect(0, 0, atlasSize, atlasSize);

        // Initialize free rectangles with entire atlas
        atlas.freeRects.push({
            x: 0, y: 0,
            width: atlasSize,
            height: atlasSize
        });

        this.atlases.set(name, atlas);
        this.stats.atlasesCreated++;

        console.log(`📚 Created texture atlas '${name}' (${atlasSize}x${atlasSize}) for category: ${category}`);

        return atlas;
    }

    /**
     * Add texture to atlas using efficient bin packing
     * Like finding the perfect spot for a new play in the playbook
     */
    addTextureToAtlas(texture, atlasName, textureId = null) {
        const atlas = this.atlases.get(atlasName);
        if (!atlas) {
            console.error(`Atlas '${atlasName}' not found!`);
            return null;
        }

        // Generate unique ID if not provided
        if (!textureId) {
            textureId = `texture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Load texture image if needed
        return new Promise((resolve, reject) => {
            this.loadTextureImage(texture).then((image) => {
                const region = this.packTextureIntoAtlas(atlas, image, textureId);
                if (region) {
                    // Store mapping
                    this.textureMap.set(texture.uuid, {
                        atlas: atlasName,
                        region: region,
                        textureId: textureId
                    });

                    // Update atlas efficiency
                    this.updateAtlasEfficiency(atlas);

                    // Regenerate Three.js texture
                    this.updateAtlasTexture(atlas);

                    this.stats.texturesAtlased++;

                    console.log(`🎯 Added texture '${textureId}' to atlas '${atlasName}' at (${region.x}, ${region.y})`);

                    resolve(region);
                } else {
                    console.warn(`❌ Could not fit texture '${textureId}' into atlas '${atlasName}'`);
                    reject(new Error('Texture does not fit in atlas'));
                }
            }).catch(reject);
        });
    }

    /**
     * Pack texture into atlas using bin packing algorithm
     * Like strategically placing plays in the most effective formations
     */
    packTextureIntoAtlas(atlas, image, textureId) {
        const width = image.width + this.config.padding * 2;
        const height = image.height + this.config.padding * 2;

        // Find best fitting rectangle using bottom-left-fill algorithm
        let bestRect = null;
        let bestRectIndex = -1;
        let bestShortSide = Infinity;
        let bestLongSide = Infinity;

        for (let i = 0; i < atlas.freeRects.length; i++) {
            const rect = atlas.freeRects[i];

            if (rect.width >= width && rect.height >= height) {
                const leftoverHorizontal = rect.width - width;
                const leftoverVertical = rect.height - height;
                const shortSide = Math.min(leftoverHorizontal, leftoverVertical);
                const longSide = Math.max(leftoverHorizontal, leftoverVertical);

                if (shortSide < bestShortSide || (shortSide === bestShortSide && longSide < bestLongSide)) {
                    bestRect = rect;
                    bestRectIndex = i;
                    bestShortSide = shortSide;
                    bestLongSide = longSide;
                }
            }
        }

        if (!bestRect) {
            return null; // Doesn't fit
        }

        // Create region for this texture
        const region = {
            x: bestRect.x + this.config.padding,
            y: bestRect.y + this.config.padding,
            width: image.width,
            height: image.height,
            u1: (bestRect.x + this.config.padding) / atlas.size,
            v1: (bestRect.y + this.config.padding) / atlas.size,
            u2: (bestRect.x + this.config.padding + image.width) / atlas.size,
            v2: (bestRect.y + this.config.padding + image.height) / atlas.size,
            textureId: textureId
        };

        // Draw texture to atlas canvas
        atlas.context.drawImage(image, region.x, region.y);

        // Remove the used rectangle and split remaining space
        atlas.freeRects.splice(bestRectIndex, 1);
        this.splitRectangle(atlas, bestRect, width, height);

        // Store region
        atlas.regions.set(textureId, region);
        atlas.usedRects.push({
            x: bestRect.x,
            y: bestRect.y,
            width: width,
            height: height
        });

        atlas.usedArea += width * height;
        atlas.textureCount++;

        return region;
    }

    /**
     * Split rectangle after placing texture
     * Like reorganizing playbook sections after adding new plays
     */
    splitRectangle(atlas, usedRect, usedWidth, usedHeight) {
        const remainingWidth = usedRect.width - usedWidth;
        const remainingHeight = usedRect.height - usedHeight;

        // Create new free rectangles from remaining space
        if (remainingWidth > 0) {
            atlas.freeRects.push({
                x: usedRect.x + usedWidth,
                y: usedRect.y,
                width: remainingWidth,
                height: usedHeight
            });
        }

        if (remainingHeight > 0) {
            atlas.freeRects.push({
                x: usedRect.x,
                y: usedRect.y + usedHeight,
                width: usedRect.width,
                height: remainingHeight
            });
        }

        if (remainingWidth > 0 && remainingHeight > 0) {
            atlas.freeRects.push({
                x: usedRect.x + usedWidth,
                y: usedRect.y + usedHeight,
                width: remainingWidth,
                height: remainingHeight
            });
        }

        // Remove overlapping rectangles to prevent fragmentation
        this.removeOverlappingRectangles(atlas);
    }

    /**
     * Remove overlapping free rectangles to prevent fragmentation
     */
    removeOverlappingRectangles(atlas) {
        for (let i = atlas.freeRects.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (this.isRectangleInside(atlas.freeRects[i], atlas.freeRects[j])) {
                    atlas.freeRects.splice(i, 1);
                    break;
                } else if (this.isRectangleInside(atlas.freeRects[j], atlas.freeRects[i])) {
                    atlas.freeRects.splice(j, 1);
                    i--;
                    break;
                }
            }
        }
    }

    /**
     * Check if one rectangle is completely inside another
     */
    isRectangleInside(rect1, rect2) {
        return rect1.x >= rect2.x &&
               rect1.y >= rect2.y &&
               rect1.x + rect1.width <= rect2.x + rect2.width &&
               rect1.y + rect1.height <= rect2.y + rect2.height;
    }

    /**
     * Load texture image from Three.js texture
     * Like digitizing physical playbook pages
     */
    loadTextureImage(texture) {
        return new Promise((resolve, reject) => {
            if (texture.image) {
                // Image already loaded
                resolve(texture.image);
            } else if (texture instanceof THREE.CanvasTexture) {
                // Canvas texture
                resolve(texture.image);
            } else if (texture instanceof THREE.DataTexture) {
                // Convert data texture to image
                this.dataTextureToImage(texture).then(resolve).catch(reject);
            } else {
                // Load image from URL
                const image = new Image();
                image.crossOrigin = 'anonymous';
                image.onload = () => resolve(image);
                image.onerror = reject;

                if (texture.image && texture.image.src) {
                    image.src = texture.image.src;
                } else {
                    reject(new Error('Cannot load texture image'));
                }
            }
        });
    }

    /**
     * Convert DataTexture to Image
     */
    dataTextureToImage(dataTexture) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = dataTexture.image.width;
            canvas.height = dataTexture.image.height;

            const imageData = context.createImageData(canvas.width, canvas.height);
            imageData.data.set(dataTexture.image.data);
            context.putImageData(imageData, 0, 0);

            const image = new Image();
            image.onload = () => resolve(image);
            image.src = canvas.toDataURL();
        });
    }

    /**
     * Update Three.js texture from atlas canvas
     * Like publishing the updated championship playbook
     */
    updateAtlasTexture(atlas) {
        if (atlas.threeTexture) {
            atlas.threeTexture.dispose();
        }

        atlas.threeTexture = new THREE.CanvasTexture(atlas.canvas);
        atlas.threeTexture.format = this.config.format;
        atlas.threeTexture.minFilter = this.config.minFilter;
        atlas.threeTexture.magFilter = this.config.magFilter;
        atlas.threeTexture.wrapS = this.config.wrapS;
        atlas.threeTexture.wrapT = this.config.wrapT;
        atlas.threeTexture.flipY = this.config.flipY;
        atlas.threeTexture.generateMipmaps = this.config.generateMipmaps;

        atlas.lastUpdate = Date.now();
    }

    /**
     * Update atlas efficiency calculation
     */
    updateAtlasEfficiency(atlas) {
        atlas.efficiency = (atlas.usedArea / atlas.totalArea) * 100;
    }

    /**
     * Create material that uses atlased textures
     * Like creating plays that reference the consolidated playbook
     */
    createAtlasedMaterial(originalMaterial, atlas, textureRegion) {
        const materialKey = `${originalMaterial.uuid}_${atlas.name}`;

        // Check cache first
        if (this.materialCache.has(materialKey)) {
            return this.materialCache.get(materialKey);
        }

        // Clone original material
        const atlasedMaterial = originalMaterial.clone();

        // Replace main texture with atlas texture
        if (originalMaterial.map) {
            atlasedMaterial.map = atlas.threeTexture;

            // Adjust UV coordinates to point to correct atlas region
            this.adjustMaterialUVs(atlasedMaterial, textureRegion);
        }

        // Handle other texture types if needed
        if (originalMaterial.normalMap) {
            // Similar process for normal maps, etc.
        }

        // Cache the material
        this.materialCache.set(materialKey, atlasedMaterial);

        return atlasedMaterial;
    }

    /**
     * Adjust UV coordinates to map to atlas region
     * Like updating play diagrams to reference the right page and position
     */
    adjustMaterialUVs(material, region) {
        // This would typically involve modifying the geometry's UV coordinates
        // or using vertex shaders to transform UV coordinates

        // For now, we'll store the UV transform in material userData
        material.userData.atlasUVTransform = {
            offsetX: region.u1,
            offsetY: region.v1,
            scaleX: region.u2 - region.u1,
            scaleY: region.v2 - region.v1
        };

        // In a complete implementation, you'd want to modify the vertex shader
        // or adjust the geometry UVs directly
    }

    /**
     * Process a scene to atlas textures and reduce draw calls
     * Like consolidating all team playbooks into one master strategy guide
     */
    processScene(scene, options = {}) {
        const processOptions = {
            createAtlasPerMaterial: options.createAtlasPerMaterial || false,
            atlasSize: options.atlasSize || this.config.defaultAtlasSize,
            categories: options.categories || ['diffuse', 'normal', 'roughness'],
            ...options
        };

        const texturesByCategory = new Map();

        // Traverse scene and collect textures
        scene.traverse((object) => {
            if (object.isMesh && object.material) {
                this.collectTexturesFromMaterial(object.material, texturesByCategory);
            }
        });

        // Create atlases for each category
        const atlasPromises = [];
        texturesByCategory.forEach((textures, category) => {
            if (textures.length > 1) { // Only atlas if multiple textures
                const atlasName = `atlas_${category}_${Date.now()}`;
                const atlas = this.createAtlas(atlasName, processOptions.atlasSize, category);

                // Add textures to atlas
                textures.forEach((texture, index) => {
                    const textureId = `${category}_${index}`;
                    atlasPromises.push(
                        this.addTextureToAtlas(texture, atlasName, textureId)
                    );
                });
            }
        });

        return Promise.all(atlasPromises).then(() => {
            console.log(`🏆 Scene processing complete! Created ${this.atlases.size} atlases for ${this.stats.texturesAtlased} textures.`);
            return this.getProcessingReport();
        });
    }

    /**
     * Collect textures from material by category
     */
    collectTexturesFromMaterial(material, texturesByCategory) {
        if (material.map) {
            this.addTextureToCategory(texturesByCategory, 'diffuse', material.map);
        }
        if (material.normalMap) {
            this.addTextureToCategory(texturesByCategory, 'normal', material.normalMap);
        }
        if (material.roughnessMap) {
            this.addTextureToCategory(texturesByCategory, 'roughness', material.roughnessMap);
        }
        if (material.metalnessMap) {
            this.addTextureToCategory(texturesByCategory, 'metalness', material.metalnessMap);
        }
        if (material.emissiveMap) {
            this.addTextureToCategory(texturesByCategory, 'emissive', material.emissiveMap);
        }
    }

    /**
     * Add texture to category collection
     */
    addTextureToCategory(texturesByCategory, category, texture) {
        if (!texturesByCategory.has(category)) {
            texturesByCategory.set(category, []);
        }

        const textures = texturesByCategory.get(category);
        if (!textures.find(t => t.uuid === texture.uuid)) {
            textures.push(texture);
        }
    }

    /**
     * Get processing report
     * Like generating a post-game statistical analysis
     */
    getProcessingReport() {
        const report = {
            atlasesCreated: this.atlases.size,
            texturesAtlased: this.stats.texturesAtlased,
            drawCallReduction: this.estimateDrawCallReduction(),
            memoryUsage: this.calculateMemoryUsage(),
            atlasEfficiency: this.calculateAverageEfficiency(),
            atlases: this.getAtlasDetails()
        };

        return report;
    }

    /**
     * Estimate draw call reduction
     */
    estimateDrawCallReduction() {
        let originalDrawCalls = this.stats.texturesAtlased;
        let newDrawCalls = this.atlases.size;
        return {
            original: originalDrawCalls,
            optimized: newDrawCalls,
            reduction: originalDrawCalls - newDrawCalls,
            percentage: originalDrawCalls > 0 ? ((originalDrawCalls - newDrawCalls) / originalDrawCalls) * 100 : 0
        };
    }

    /**
     * Calculate memory usage
     */
    calculateMemoryUsage() {
        let totalMemory = 0;
        this.atlases.forEach((atlas) => {
            totalMemory += atlas.size * atlas.size * 4; // RGBA bytes
        });
        return totalMemory;
    }

    /**
     * Calculate average atlas efficiency
     */
    calculateAverageEfficiency() {
        let totalEfficiency = 0;
        let count = 0;

        this.atlases.forEach((atlas) => {
            totalEfficiency += atlas.efficiency;
            count++;
        });

        return count > 0 ? totalEfficiency / count : 0;
    }

    /**
     * Get detailed atlas information
     */
    getAtlasDetails() {
        const details = [];
        this.atlases.forEach((atlas, name) => {
            details.push({
                name: name,
                category: atlas.category,
                size: atlas.size,
                textureCount: atlas.textureCount,
                efficiency: atlas.efficiency.toFixed(2) + '%',
                usedArea: atlas.usedArea,
                totalArea: atlas.totalArea
            });
        });
        return details;
    }

    /**
     * Export atlas as image for debugging
     * Like printing the playbook for coach review
     */
    exportAtlasAsImage(atlasName) {
        const atlas = this.atlases.get(atlasName);
        if (!atlas) return null;

        return atlas.canvas.toDataURL('image/png');
    }

    /**
     * Get atlas texture for use in materials
     */
    getAtlasTexture(atlasName) {
        const atlas = this.atlases.get(atlasName);
        return atlas ? atlas.threeTexture : null;
    }

    /**
     * Get texture region information
     */
    getTextureRegion(textureUuid) {
        return this.textureMap.get(textureUuid);
    }

    /**
     * Cleanup and disposal
     * Like retiring the championship playbook at season's end
     */
    dispose() {
        // Dispose all atlas textures
        this.atlases.forEach((atlas) => {
            if (atlas.threeTexture) {
                atlas.threeTexture.dispose();
            }
        });

        // Clear all maps and caches
        this.atlases.clear();
        this.textureMap.clear();
        this.materialCache.forEach((material) => {
            material.dispose();
        });
        this.materialCache.clear();
        this.pendingTextures.clear();

        console.log('🏆 Championship Texture Atlas System disposed - Thanks for the memories!');
    }

    /**
     * Get performance statistics
     */
    getStats() {
        return {
            ...this.stats,
            atlasCount: this.atlases.size,
            averageEfficiency: this.calculateAverageEfficiency(),
            totalMemoryUsage: this.calculateMemoryUsage()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChampionshipTextureAtlas;
} else if (typeof window !== 'undefined') {
    window.ChampionshipTextureAtlas = ChampionshipTextureAtlas;
}