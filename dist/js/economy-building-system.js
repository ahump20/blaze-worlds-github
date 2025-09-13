/**
 * Multi-Resource Economy and Base Building System
 * Texas Championship Edition - Warcraft III meets Minecraft
 *
 * Features:
 * - Five-resource economy: Wood, Stone, Oil, Food, Gold
 * - Strategic building placement with defensive considerations
 * - Supply chains and resource refinement
 * - Territory control affecting generation rates
 * - Texas-themed buildings and resource sources
 */

class EconomyBuildingSystem {
    constructor(scene, gameWorld, terrainSystem, heroSystem) {
        this.scene = scene;
        this.gameWorld = gameWorld;
        this.terrainSystem = terrainSystem;
        this.heroSystem = heroSystem;

        // Resource configuration
        this.resources = {
            wood: { amount: 500, rate: 0, icon: '🌲', color: 0x8B4513 },
            stone: { amount: 300, rate: 0, icon: '🗿', color: 0x808080 },
            oil: { amount: 100, rate: 0, icon: '🛢️', color: 0x2F2F2F },
            food: { amount: 200, rate: 0, icon: '🌾', color: 0xFFD700 },
            gold: { amount: 150, rate: 0, icon: '💰', color: 0xFFD700 }
        };

        // Building definitions with Texas theme
        this.buildingTypes = {
            // Resource Buildings
            lumberMill: {
                name: 'Texas Lumber Mill',
                cost: { wood: 0, stone: 50, gold: 75 },
                produces: { wood: 2.5 },
                hp: 800,
                buildTime: 45,
                size: { x: 3, z: 3 },
                description: 'Harvests East Texas pine forests',
                model: 'lumber_mill',
                requirements: []
            },
            quarry: {
                name: 'Hill Country Quarry',
                cost: { wood: 75, stone: 0, gold: 100 },
                produces: { stone: 2.0 },
                hp: 1200,
                buildTime: 60,
                size: { x: 3, z: 3 },
                description: 'Extracts limestone from Texas hills',
                model: 'quarry',
                requirements: []
            },
            oilDerrick: {
                name: 'Texas Oil Derrick',
                cost: { wood: 125, stone: 100, gold: 200 },
                produces: { oil: 1.5, gold: 0.5 },
                hp: 600,
                buildTime: 90,
                size: { x: 2, z: 2 },
                description: 'Taps into black gold reserves',
                model: 'oil_derrick',
                requirements: []
            },
            ranch: {
                name: 'Cattle Ranch',
                cost: { wood: 100, stone: 25, gold: 50 },
                produces: { food: 3.0 },
                hp: 500,
                buildTime: 30,
                size: { x: 4, z: 4 },
                description: 'Raises longhorn cattle',
                model: 'ranch',
                requirements: []
            },

            // Military Buildings
            barracks: {
                name: 'Texas Rangers Barracks',
                cost: { wood: 150, stone: 100, gold: 100 },
                produces: {},
                hp: 1000,
                buildTime: 75,
                size: { x: 3, z: 4 },
                description: 'Trains elite Texas Rangers',
                model: 'barracks',
                requirements: [],
                trainable: ['ranger', 'scout', 'marksman']
            },
            stable: {
                name: 'Cavalry Stable',
                cost: { wood: 200, stone: 75, food: 100 },
                produces: {},
                hp: 800,
                buildTime: 60,
                size: { x: 4, z: 3 },
                description: 'Breeds war horses',
                model: 'stable',
                requirements: ['barracks'],
                trainable: ['cavalry', 'mounted_ranger']
            },

            // Defensive Buildings
            watchtower: {
                name: 'Frontier Watchtower',
                cost: { wood: 75, stone: 100, gold: 50 },
                produces: {},
                hp: 1500,
                buildTime: 45,
                size: { x: 2, z: 2 },
                description: 'Provides early warning and defense',
                model: 'watchtower',
                requirements: [],
                attackRange: 8,
                attackDamage: 75,
                attackSpeed: 1.5
            },
            fortress: {
                name: 'Border Fortress',
                cost: { wood: 300, stone: 500, gold: 400 },
                produces: {},
                hp: 3000,
                buildTime: 180,
                size: { x: 4, z: 4 },
                description: 'Massive defensive stronghold',
                model: 'fortress',
                requirements: ['watchtower'],
                attackRange: 12,
                attackDamage: 150,
                attackSpeed: 2.0,
                garrison: 20
            },

            // Economic Buildings
            marketplace: {
                name: 'Trading Post',
                cost: { wood: 100, stone: 50, gold: 150 },
                produces: { gold: 1.0 },
                hp: 600,
                buildTime: 60,
                size: { x: 3, z: 3 },
                description: 'Facilitates trade and commerce',
                model: 'marketplace',
                requirements: [],
                features: ['trade_routes', 'resource_exchange']
            },
            refinery: {
                name: 'Oil Refinery',
                cost: { wood: 150, stone: 200, oil: 50, gold: 300 },
                produces: { gold: 2.0 },
                consumes: { oil: 1.0 },
                hp: 800,
                buildTime: 120,
                size: { x: 4, z: 3 },
                description: 'Refines crude oil into valuable products',
                model: 'refinery',
                requirements: ['oilDerrick', 'marketplace']
            },

            // Special Buildings
            townHall: {
                name: 'Town Hall',
                cost: { wood: 200, stone: 200, gold: 200 },
                produces: { gold: 0.5 },
                hp: 2000,
                buildTime: 90,
                size: { x: 4, z: 4 },
                description: 'Center of governance and administration',
                model: 'town_hall',
                requirements: [],
                features: ['population_center', 'research_hub'],
                populationProvided: 10
            }
        };

        // Territory and influence system
        this.territories = new Map();
        this.influenceRadius = {
            townHall: 15,
            fortress: 12,
            watchtower: 8,
            marketplace: 6
        };

        // Building placement system
        this.buildings = [];
        this.buildingGrid = new Map(); // For collision detection
        this.constructionQueue = [];

        // Resource gathering system
        this.resourceNodes = [];
        this.gatheringWorkers = [];

        // Economy state
        this.populationCap = 20;
        this.currentPopulation = 0;
        this.researchLevel = 1;
        this.tradeRoutes = [];

        // UI elements
        this.resourceDisplay = null;
        this.buildingPanel = null;
        this.selectedBuilding = null;

        this.init();
    }

    init() {
        this.createResourceDisplay();
        this.createBuildingPanel();
        this.generateResourceNodes();
        this.startEconomyLoop();
        this.setupEventListeners();

        // Start with a basic town hall
        this.placeBuilding('townHall', { x: 0, z: 0 }, true);

        console.log('🏗️ Economy and Building System initialized');
        console.log('💰 Starting resources:', this.resources);
    }

    createResourceDisplay() {
        const display = document.createElement('div');
        display.className = 'texas-resource-display';
        display.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 34, 68, 0.95);
            border: 2px solid #BF5700;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            color: #FFD700;
            min-width: 200px;
            backdrop-filter: blur(5px);
            box-shadow: 0 4px 20px rgba(191, 87, 0, 0.3);
            z-index: 1000;
        `;

        this.resourceDisplay = display;
        document.body.appendChild(display);
        this.updateResourceDisplay();
    }

    updateResourceDisplay() {
        if (!this.resourceDisplay) return;

        const resourceHTML = Object.entries(this.resources).map(([type, data]) => {
            const rate = data.rate > 0 ? `+${data.rate.toFixed(1)}/min` : '';
            return `
                <div style="display: flex; justify-content: space-between; margin: 5px 0; align-items: center;">
                    <span>${data.icon} ${type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                    <span style="color: #9BCBEB; font-weight: bold;">
                        ${Math.floor(data.amount)} ${rate}
                    </span>
                </div>
            `;
        }).join('');

        this.resourceDisplay.innerHTML = `
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px; color: #BF5700;">
                TEXAS TREASURY
            </div>
            ${resourceHTML}
            <hr style="border-color: #BF5700; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between;">
                <span>👥 Population:</span>
                <span style="color: #9BCBEB;">${this.currentPopulation}/${this.populationCap}</span>
            </div>
        `;
    }

    createBuildingPanel() {
        const panel = document.createElement('div');
        panel.className = 'texas-building-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 34, 68, 0.95);
            border: 2px solid #BF5700;
            border-radius: 8px;
            padding: 15px;
            max-width: 400px;
            backdrop-filter: blur(5px);
            box-shadow: 0 4px 20px rgba(191, 87, 0, 0.3);
            z-index: 1000;
            display: none;
        `;

        // Create building categories
        const categories = {
            'Resource': ['lumberMill', 'quarry', 'oilDerrick', 'ranch'],
            'Military': ['barracks', 'stable'],
            'Defense': ['watchtower', 'fortress'],
            'Economy': ['marketplace', 'refinery', 'townHall']
        };

        let panelHTML = '<div style="color: #BF5700; font-weight: bold; margin-bottom: 10px; text-align: center;">BUILD MENU</div>';

        Object.entries(categories).forEach(([category, buildings]) => {
            panelHTML += `<div style="margin: 10px 0;">`;
            panelHTML += `<div style="color: #FFD700; font-weight: bold; margin-bottom: 5px;">${category}</div>`;

            buildings.forEach(buildingType => {
                const building = this.buildingTypes[buildingType];
                const canAfford = this.canAffordBuilding(buildingType);
                const reqsMet = this.buildingRequirementsMet(buildingType);

                panelHTML += `
                    <button
                        class="building-btn"
                        data-building="${buildingType}"
                        style="
                            display: block;
                            width: 100%;
                            margin: 2px 0;
                            padding: 8px;
                            background: ${canAfford && reqsMet ? 'rgba(155, 203, 235, 0.2)' : 'rgba(128, 128, 128, 0.2)'};
                            border: 1px solid ${canAfford && reqsMet ? '#9BCBEB' : '#808080'};
                            color: ${canAfford && reqsMet ? '#9BCBEB' : '#808080'};
                            border-radius: 4px;
                            cursor: ${canAfford && reqsMet ? 'pointer' : 'not-allowed'};
                            font-size: 12px;
                            text-align: left;
                        "
                        ${!canAfford || !reqsMet ? 'disabled' : ''}
                    >
                        ${building.name}<br>
                        <small>${this.formatBuildingCost(building.cost)}</small>
                    </button>
                `;
            });
            panelHTML += '</div>';
        });

        panel.innerHTML = panelHTML;
        this.buildingPanel = panel;
        document.body.appendChild(panel);

        // Add event listeners to building buttons
        panel.addEventListener('click', (e) => {
            if (e.target.classList.contains('building-btn')) {
                const buildingType = e.target.dataset.building;
                if (!e.target.disabled) {
                    this.startBuildingPlacement(buildingType);
                    panel.style.display = 'none';
                }
            }
        });
    }

    formatBuildingCost(cost) {
        return Object.entries(cost)
            .map(([resource, amount]) => {
                const icon = this.resources[resource]?.icon || resource;
                return `${icon}${amount}`;
            })
            .join(' ');
    }

    canAffordBuilding(buildingType) {
        const building = this.buildingTypes[buildingType];
        return Object.entries(building.cost).every(([resource, amount]) => {
            return this.resources[resource].amount >= amount;
        });
    }

    buildingRequirementsMet(buildingType) {
        const building = this.buildingTypes[buildingType];
        if (!building.requirements || building.requirements.length === 0) return true;

        return building.requirements.every(reqType => {
            return this.buildings.some(b => b.type === reqType && b.constructionProgress >= 100);
        });
    }

    startBuildingPlacement(buildingType) {
        this.placementMode = {
            active: true,
            buildingType: buildingType,
            preview: null
        };

        // Create preview object
        this.createBuildingPreview(buildingType);

        // Change cursor and add instructions
        document.body.style.cursor = 'crosshair';
        this.showPlacementInstructions(buildingType);
    }

    createBuildingPreview(buildingType) {
        const building = this.buildingTypes[buildingType];
        const geometry = new THREE.BoxGeometry(building.size.x, 1, building.size.z);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });

        this.placementMode.preview = new THREE.Mesh(geometry, material);
        this.scene.add(this.placementMode.preview);
    }

    showPlacementInstructions(buildingType) {
        const building = this.buildingTypes[buildingType];
        const instructions = document.createElement('div');
        instructions.className = 'placement-instructions';
        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 34, 68, 0.95);
            border: 2px solid #BF5700;
            border-radius: 8px;
            padding: 20px;
            color: #FFD700;
            text-align: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
        `;

        instructions.innerHTML = `
            <div style="color: #BF5700; font-weight: bold; margin-bottom: 10px;">
                PLACING: ${building.name}
            </div>
            <div style="margin: 10px 0;">${building.description}</div>
            <div style="font-size: 14px; color: #9BCBEB;">
                Click to place • Right-click or ESC to cancel
            </div>
        `;

        document.body.appendChild(instructions);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (instructions.parentNode) {
                instructions.parentNode.removeChild(instructions);
            }
        }, 3000);
    }

    placeBuilding(buildingType, position, isStarting = false) {
        const building = this.buildingTypes[buildingType];

        // Check if placement is valid
        if (!isStarting && !this.isValidBuildingPlacement(buildingType, position)) {
            console.warn('Invalid building placement');
            return false;
        }

        // Deduct resources (except for starting buildings)
        if (!isStarting) {
            Object.entries(building.cost).forEach(([resource, amount]) => {
                this.resources[resource].amount -= amount;
            });
        }

        // Create building object
        const newBuilding = {
            id: this.buildings.length,
            type: buildingType,
            position: { ...position },
            hp: building.hp,
            maxHp: building.hp,
            constructionProgress: isStarting ? 100 : 0,
            buildTime: building.buildTime,
            lastProduction: Date.now(),
            mesh: null,
            isWorking: true,
            garrison: []
        };

        // Create 3D model
        this.createBuildingMesh(newBuilding);

        // Update population cap if applicable
        if (building.populationProvided) {
            this.populationCap += building.populationProvided;
        }

        // Add to buildings array and grid
        this.buildings.push(newBuilding);
        this.updateBuildingGrid(newBuilding);

        // Start construction if not starting building
        if (!isStarting) {
            this.constructionQueue.push(newBuilding);
        }

        // Update territory control
        this.updateTerritoryControl();

        console.log(`🏗️ Placed ${building.name} at (${position.x}, ${position.z})`);
        return true;
    }

    createBuildingMesh(building) {
        const buildingData = this.buildingTypes[building.type];

        // Create basic building geometry (will be replaced with proper models later)
        const geometry = new THREE.BoxGeometry(
            buildingData.size.x,
            2 + (buildingData.size.x * 0.5), // Height scales with size
            buildingData.size.z
        );

        // Different materials based on building type
        let color = 0x8B4513; // Default brown
        if (building.type.includes('oil')) color = 0x2F2F2F;
        else if (building.type.includes('stone') || building.type.includes('quarry')) color = 0x808080;
        else if (building.type.includes('military') || building.type.includes('fortress')) color = 0x654321;
        else if (building.type.includes('market') || building.type.includes('gold')) color = 0xFFD700;

        const material = new THREE.MeshLambertMaterial({ color: color });

        // Add construction progress visualization
        if (building.constructionProgress < 100) {
            material.transparent = true;
            material.opacity = 0.3 + (building.constructionProgress / 100) * 0.7;
        }

        building.mesh = new THREE.Mesh(geometry, material);
        building.mesh.position.set(
            building.position.x,
            geometry.parameters.height / 2,
            building.position.z
        );

        // Add building data for interaction
        building.mesh.userData = { type: 'building', building: building };

        this.scene.add(building.mesh);
    }

    isValidBuildingPlacement(buildingType, position) {
        const building = this.buildingTypes[buildingType];

        // Check terrain suitability
        const terrain = this.terrainSystem.getBiomeAt(position.x, position.z);
        if (terrain === 'water' || terrain === 'river') {
            return false; // Can't build on water
        }

        // Check building grid for collisions
        for (let x = position.x - Math.floor(building.size.x / 2);
             x <= position.x + Math.floor(building.size.x / 2); x++) {
            for (let z = position.z - Math.floor(building.size.z / 2);
                 z <= position.z + Math.floor(building.size.z / 2); z++) {
                if (this.buildingGrid.has(`${x},${z}`)) {
                    return false; // Collision detected
                }
            }
        }

        // Check minimum distance from other buildings (except for defensive structures)
        if (!building.type.includes('tower') && !building.type.includes('wall')) {
            const minDistance = 3;
            for (const existingBuilding of this.buildings) {
                const distance = Math.sqrt(
                    Math.pow(position.x - existingBuilding.position.x, 2) +
                    Math.pow(position.z - existingBuilding.position.z, 2)
                );
                if (distance < minDistance) {
                    return false;
                }
            }
        }

        return true;
    }

    updateBuildingGrid(building) {
        const buildingData = this.buildingTypes[building.type];
        for (let x = building.position.x - Math.floor(buildingData.size.x / 2);
             x <= building.position.x + Math.floor(buildingData.size.x / 2); x++) {
            for (let z = building.position.z - Math.floor(buildingData.size.z / 2);
                 z <= building.position.z + Math.floor(buildingData.size.z / 2); z++) {
                this.buildingGrid.set(`${x},${z}`, building.id);
            }
        }
    }

    generateResourceNodes() {
        const nodeTypes = [
            { type: 'wood', density: 0.3, biomes: ['forest', 'hills'] },
            { type: 'stone', density: 0.2, biomes: ['hills', 'mountains', 'desert'] },
            { type: 'oil', density: 0.05, biomes: ['plains', 'desert'] },
            { type: 'gold', density: 0.02, biomes: ['mountains', 'hills'] }
        ];

        // Generate resource nodes across the world
        for (let x = -50; x <= 50; x += 5) {
            for (let z = -50; z <= 50; z += 5) {
                const biome = this.terrainSystem.getBiomeAt(x, z);

                nodeTypes.forEach(nodeType => {
                    if (nodeType.biomes.includes(biome) && Math.random() < nodeType.density) {
                        this.createResourceNode(nodeType.type, { x, z });
                    }
                });
            }
        }

        console.log(`🌟 Generated ${this.resourceNodes.length} resource nodes`);
    }

    createResourceNode(type, position) {
        const node = {
            id: this.resourceNodes.length,
            type: type,
            position: position,
            amount: 500 + Math.random() * 1000,
            maxAmount: 1000,
            isDepleated: false,
            workers: [],
            mesh: null
        };

        // Create visual representation
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const color = this.resources[type].color;
        const material = new THREE.MeshLambertMaterial({ color: color });

        node.mesh = new THREE.Mesh(geometry, material);
        node.mesh.position.set(position.x, 1, position.z);
        node.mesh.userData = { type: 'resource_node', node: node };

        // Add glow effect for rare resources
        if (type === 'oil' || type === 'gold') {
            const glowGeometry = new THREE.SphereGeometry(0.8, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            node.mesh.add(glow);
        }

        this.scene.add(node.mesh);
        this.resourceNodes.push(node);
    }

    startEconomyLoop() {
        // Run economy calculations every second
        setInterval(() => {
            this.updateResourceProduction();
            this.updateConstruction();
            this.updateResourceDisplay();
        }, 1000);

        // Faster updates for visual effects
        setInterval(() => {
            this.updateBuildingAnimations();
        }, 100);
    }

    updateResourceProduction() {
        // Reset production rates
        Object.keys(this.resources).forEach(type => {
            this.resources[type].rate = 0;
        });

        // Calculate production from buildings
        this.buildings.forEach(building => {
            if (building.constructionProgress >= 100 && building.isWorking) {
                const buildingData = this.buildingTypes[building.type];

                // Check if building has production
                if (buildingData.produces) {
                    Object.entries(buildingData.produces).forEach(([resource, rate]) => {
                        // Apply territory bonuses
                        const territoryBonus = this.getTerritoryBonus(building.position);
                        const finalRate = rate * territoryBonus;

                        this.resources[resource].rate += finalRate;
                        this.resources[resource].amount += finalRate / 60; // Per second
                    });
                }

                // Handle resource consumption
                if (buildingData.consumes) {
                    Object.entries(buildingData.consumes).forEach(([resource, rate]) => {
                        if (this.resources[resource].amount >= rate / 60) {
                            this.resources[resource].amount -= rate / 60;
                        } else {
                            building.isWorking = false; // Stop production if no resources
                        }
                    });
                }
            }
        });

        // Ensure resources don't go negative
        Object.keys(this.resources).forEach(type => {
            this.resources[type].amount = Math.max(0, this.resources[type].amount);
        });
    }

    getTerritoryBonus(position) {
        let bonus = 1.0;

        // Check for influence from town halls and fortresses
        this.buildings.forEach(building => {
            if (this.influenceRadius[building.type]) {
                const distance = Math.sqrt(
                    Math.pow(position.x - building.position.x, 2) +
                    Math.pow(position.z - building.position.z, 2)
                );

                if (distance <= this.influenceRadius[building.type]) {
                    if (building.type === 'townHall') bonus += 0.25;
                    else if (building.type === 'fortress') bonus += 0.15;
                    else if (building.type === 'marketplace') bonus += 0.1;
                }
            }
        });

        return Math.min(bonus, 2.0); // Cap at 100% bonus
    }

    updateConstruction() {
        this.constructionQueue = this.constructionQueue.filter(building => {
            building.constructionProgress += (100 / building.buildTime);

            if (building.constructionProgress >= 100) {
                building.constructionProgress = 100;
                this.completeBuilding(building);
                return false; // Remove from queue
            }

            // Update visual construction progress
            if (building.mesh && building.mesh.material) {
                building.mesh.material.opacity = 0.3 + (building.constructionProgress / 100) * 0.7;
                if (building.constructionProgress >= 100) {
                    building.mesh.material.transparent = false;
                    building.mesh.material.opacity = 1.0;
                }
            }

            return true;
        });
    }

    completeBuilding(building) {
        const buildingData = this.buildingTypes[building.type];
        console.log(`✅ Construction complete: ${buildingData.name}`);

        // Update mesh appearance
        if (building.mesh && building.mesh.material) {
            building.mesh.material.transparent = false;
            building.mesh.material.opacity = 1.0;
        }

        // Add any special completion effects
        this.addBuildingCompletionEffect(building);
    }

    addBuildingCompletionEffect(building) {
        // Create completion particle effect
        const particles = new THREE.Group();

        for (let i = 0; i < 20; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFD700,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.set(
                building.position.x + (Math.random() - 0.5) * 4,
                2 + Math.random() * 3,
                building.position.z + (Math.random() - 0.5) * 4
            );

            particles.add(particle);
        }

        this.scene.add(particles);

        // Animate particles upward and fade out
        const animate = () => {
            particles.children.forEach(particle => {
                particle.position.y += 0.1;
                particle.material.opacity -= 0.02;
            });

            if (particles.children[0] && particles.children[0].material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particles);
            }
        };
        animate();
    }

    updateBuildingAnimations() {
        // Add subtle animations to working buildings
        this.buildings.forEach(building => {
            if (building.mesh && building.isWorking && building.constructionProgress >= 100) {
                const buildingData = this.buildingTypes[building.type];

                // Oil derricks pump up and down
                if (building.type === 'oilDerrick') {
                    building.mesh.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.1;
                }

                // Marketplaces glow slightly
                if (building.type === 'marketplace') {
                    const intensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
                    building.mesh.material.emissive.setHex(0x332200);
                    building.mesh.material.emissiveIntensity = intensity;
                }
            }
        });
    }

    updateTerritoryControl() {
        // Calculate and visualize territory control (placeholder for now)
        // This would create overlays showing areas of influence
        console.log('🗺️ Territory control updated');
    }

    setupEventListeners() {
        // Building panel toggle
        window.addEventListener('keydown', (e) => {
            if (e.key === 'b' || e.key === 'B') {
                this.toggleBuildingPanel();
            }

            if (e.key === 'Escape' && this.placementMode?.active) {
                this.cancelBuildingPlacement();
            }
        });

        // Mouse controls for building placement
        window.addEventListener('mousemove', (e) => {
            if (this.placementMode?.active) {
                this.updateBuildingPreview(e);
            }
        });

        window.addEventListener('click', (e) => {
            if (this.placementMode?.active) {
                this.handleBuildingPlacement(e);
            }
        });

        window.addEventListener('contextmenu', (e) => {
            if (this.placementMode?.active) {
                e.preventDefault();
                this.cancelBuildingPlacement();
            }
        });
    }

    toggleBuildingPanel() {
        if (this.buildingPanel) {
            const isVisible = this.buildingPanel.style.display !== 'none';
            this.buildingPanel.style.display = isVisible ? 'none' : 'block';

            if (!isVisible) {
                // Refresh building buttons state
                this.refreshBuildingPanel();
            }
        }
    }

    refreshBuildingPanel() {
        // Update button states based on current resources and requirements
        const buttons = this.buildingPanel.querySelectorAll('.building-btn');
        buttons.forEach(button => {
            const buildingType = button.dataset.building;
            const canAfford = this.canAffordBuilding(buildingType);
            const reqsMet = this.buildingRequirementsMet(buildingType);
            const isEnabled = canAfford && reqsMet;

            button.disabled = !isEnabled;
            button.style.background = isEnabled ? 'rgba(155, 203, 235, 0.2)' : 'rgba(128, 128, 128, 0.2)';
            button.style.borderColor = isEnabled ? '#9BCBEB' : '#808080';
            button.style.color = isEnabled ? '#9BCBEB' : '#808080';
            button.style.cursor = isEnabled ? 'pointer' : 'not-allowed';
        });
    }

    updateBuildingPreview(event) {
        if (!this.placementMode?.preview) return;

        // Raycast to get world position
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.gameWorld.camera);

        // Create a ground plane for intersection
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, intersection);

        if (intersection) {
            // Snap to grid
            const gridSize = 1;
            const snappedX = Math.round(intersection.x / gridSize) * gridSize;
            const snappedZ = Math.round(intersection.z / gridSize) * gridSize;

            this.placementMode.preview.position.set(snappedX, 0.5, snappedZ);

            // Check if placement is valid and update color
            const isValid = this.isValidBuildingPlacement(
                this.placementMode.buildingType,
                { x: snappedX, z: snappedZ }
            );

            this.placementMode.preview.material.color.setHex(isValid ? 0x00ff00 : 0xff0000);
        }
    }

    handleBuildingPlacement(event) {
        if (!this.placementMode?.preview) return;

        const position = {
            x: this.placementMode.preview.position.x,
            z: this.placementMode.preview.position.z
        };

        if (this.placeBuilding(this.placementMode.buildingType, position)) {
            // Successful placement
            this.cancelBuildingPlacement();
        }
    }

    cancelBuildingPlacement() {
        if (this.placementMode?.preview) {
            this.scene.remove(this.placementMode.preview);
        }

        this.placementMode = { active: false };
        document.body.style.cursor = 'default';

        // Remove any placement instructions
        const instructions = document.querySelector('.placement-instructions');
        if (instructions) {
            instructions.remove();
        }
    }

    // Public methods for integration with other systems

    getResourceAmount(type) {
        return this.resources[type]?.amount || 0;
    }

    deductResources(costs) {
        let canAfford = true;
        Object.entries(costs).forEach(([resource, amount]) => {
            if (this.resources[resource].amount < amount) {
                canAfford = false;
            }
        });

        if (canAfford) {
            Object.entries(costs).forEach(([resource, amount]) => {
                this.resources[resource].amount -= amount;
            });
        }

        return canAfford;
    }

    getBuildingCount(type) {
        return this.buildings.filter(b => b.type === type && b.constructionProgress >= 100).length;
    }

    getNearbyBuildings(position, radius) {
        return this.buildings.filter(building => {
            const distance = Math.sqrt(
                Math.pow(position.x - building.position.x, 2) +
                Math.pow(position.z - building.position.z, 2)
            );
            return distance <= radius;
        });
    }

    destroy() {
        // Cleanup when system is destroyed
        if (this.resourceDisplay) {
            this.resourceDisplay.remove();
        }
        if (this.buildingPanel) {
            this.buildingPanel.remove();
        }

        // Remove all building meshes
        this.buildings.forEach(building => {
            if (building.mesh) {
                this.scene.remove(building.mesh);
            }
        });

        // Remove all resource nodes
        this.resourceNodes.forEach(node => {
            if (node.mesh) {
                this.scene.remove(node.mesh);
            }
        });

        console.log('🏗️ Economy and Building System destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EconomyBuildingSystem;
}