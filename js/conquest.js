// Blaze Worlds Conquest System - Warcraft III Style RTS Gameplay
class ConquestSystem {
    constructor(game) {
        this.game = game;
        
        // Player faction
        this.playerFaction = {
            id: 'player',
            name: 'Texas Rangers',
            color: 0xFF6B00,
            resources: {
                gold: 1000,
                lumber: 750,
                oil: 500,
                food: 20,
                foodMax: 100,
                population: 5,
                populationMax: 200
            },
            buildings: [],
            units: [],
            territories: [],
            techs: new Set(),
            hero: null
        };
        
        // AI Factions
        this.aiFactions = [
            {
                id: 'bandits',
                name: 'Desert Bandits',
                color: 0x8B4513,
                aggression: 0.7,
                difficulty: 'medium',
                resources: { gold: 800, lumber: 600, oil: 400, food: 15, foodMax: 80 },
                buildings: [],
                units: [],
                territories: [],
                techs: new Set()
            },
            {
                id: 'natives',
                name: 'Comanche Nation',
                color: 0x2E8B57,
                aggression: 0.5,
                difficulty: 'hard',
                resources: { gold: 1200, lumber: 900, oil: 300, food: 25, foodMax: 120 },
                buildings: [],
                units: [],
                territories: [],
                techs: new Set()
            },
            {
                id: 'outlaws',
                name: 'Gulf Pirates',
                color: 0x000080,
                aggression: 0.9,
                difficulty: 'expert',
                resources: { gold: 1500, lumber: 500, oil: 800, food: 30, foodMax: 150 },
                buildings: [],
                units: [],
                territories: [],
                techs: new Set()
            }
        ];
        
        // Advanced Construction System
        this.constructionZones = new Map(); // Track building placement areas
        this.buildingUpgrades = new Map(); // Track upgrade availability
        this.economicZones = []; // Special economic development areas
        this.resourceNodes = []; // Natural resource locations
        this.buildingEfficiency = new Map(); // Track building efficiency bonuses
        
        // Building Types
        this.buildingTypes = {
            // Main Buildings
            townHall: {
                name: 'Town Hall',
                cost: { gold: 400, lumber: 200 },
                buildTime: 60,
                health: 1500,
                armor: 5,
                size: { width: 4, height: 4 },
                provides: { foodMax: 10 },
                produces: ['settler', 'scout'],
                upgrades: ['townCenter', 'fortress'],
                description: 'Main command center - trains settlers and manages resources'
            },
            townCenter: {
                name: 'Town Center',
                cost: { gold: 800, lumber: 400 },
                buildTime: 90,
                health: 2500,
                armor: 8,
                size: { width: 4, height: 4 },
                provides: { foodMax: 15 },
                produces: ['settler', 'scout', 'militia'],
                upgrades: ['fortress'],
                requirements: ['townHall'],
                description: 'Upgraded town hall with better defenses'
            },
            fortress: {
                name: 'Fortress',
                cost: { gold: 1500, lumber: 800, oil: 200 },
                buildTime: 120,
                health: 4000,
                armor: 15,
                size: { width: 5, height: 5 },
                provides: { foodMax: 20 },
                produces: ['settler', 'scout', 'militia', 'hero'],
                requirements: ['townCenter'],
                description: 'Ultimate command center with hero training'
            },
            
            // Resource Buildings
            goldMine: {
                name: 'Gold Mine',
                cost: { lumber: 100 },
                buildTime: 30,
                health: 800,
                armor: 2,
                size: { width: 3, height: 3 },
                generates: { gold: 10 },
                description: 'Generates gold over time'
            },
            lumberMill: {
                name: 'Lumber Mill',
                cost: { gold: 100 },
                buildTime: 25,
                health: 600,
                armor: 1,
                size: { width: 3, height: 3 },
                generates: { lumber: 8 },
                upgrades: ['improvedLumber'],
                description: 'Processes wood from nearby forests',
                bonusNearForest: { lumber: 4 }, // Extra lumber when near forest
                adjacencyBonus: { lumberMill: { lumber: 2 } } // Bonus when near other mills
            },
            oilDerrick: {
                name: 'Oil Derrick',
                cost: { gold: 200, lumber: 150 },
                buildTime: 40,
                health: 700,
                armor: 3,
                size: { width: 2, height: 3 },
                generates: { oil: 5 },
                requirements: ['blacksmith'],
                description: 'Extracts oil for advanced units',
                bonusOnOilField: { oil: 8 }, // Double production on oil fields
                adjacencyBonus: { oilDerrick: { oil: 2 } } // Efficiency when grouped
            },
            farm: {
                name: 'Farm',
                cost: { gold: 80, lumber: 40 },
                buildTime: 15,
                health: 400,
                armor: 0,
                size: { width: 2, height: 2 },
                provides: { foodMax: 6 },
                description: 'Increases food capacity for more units',
                bonusOnPlains: { foodMax: 3 }, // Bonus on grassland
                adjacencyBonus: { farm: { foodMax: 1 } }, // Bonus when near other farms
                nearWaterBonus: { foodMax: 2 } // Irrigation bonus
            },
            
            // Military Buildings
            barracks: {
                name: 'Barracks',
                cost: { gold: 200, lumber: 150 },
                buildTime: 35,
                health: 1000,
                armor: 3,
                size: { width: 3, height: 3 },
                produces: ['militia', 'rifleman', 'ranger'],
                upgrades: ['veteranTraining', 'eliteForces'],
                description: 'Trains basic military units'
            },
            stable: {
                name: 'Stable',
                cost: { gold: 300, lumber: 200 },
                buildTime: 40,
                health: 900,
                armor: 2,
                size: { width: 3, height: 4 },
                produces: ['cavalry', 'mountedRanger'],
                requirements: ['barracks'],
                description: 'Trains mounted units'
            },
            workshop: {
                name: 'Workshop',
                cost: { gold: 400, lumber: 300, oil: 100 },
                buildTime: 50,
                health: 1200,
                armor: 4,
                size: { width: 4, height: 4 },
                produces: ['cannon', 'steamTank'],
                requirements: ['blacksmith', 'barracks'],
                description: 'Constructs siege weapons and vehicles'
            },
            
            // Defense Buildings
            watchtower: {
                name: 'Watchtower',
                cost: { gold: 150, lumber: 100 },
                buildTime: 20,
                health: 500,
                armor: 2,
                size: { width: 2, height: 2 },
                damage: 15,
                range: 8,
                upgrades: ['guardTower', 'cannonTower'],
                description: 'Basic defensive structure'
            },
            guardTower: {
                name: 'Guard Tower',
                cost: { gold: 250, lumber: 150 },
                buildTime: 30,
                health: 800,
                armor: 4,
                size: { width: 2, height: 2 },
                damage: 25,
                range: 10,
                requirements: ['watchtower'],
                upgrades: ['cannonTower'],
                description: 'Improved defensive tower'
            },
            cannonTower: {
                name: 'Cannon Tower',
                cost: { gold: 400, lumber: 200, oil: 50 },
                buildTime: 40,
                health: 1000,
                armor: 6,
                size: { width: 2, height: 2 },
                damage: 50,
                range: 12,
                requirements: ['guardTower', 'workshop'],
                description: 'Ultimate defensive structure with splash damage'
            },
            wall: {
                name: 'Wall',
                cost: { lumber: 20 },
                buildTime: 5,
                health: 300,
                armor: 10,
                size: { width: 1, height: 1 },
                description: 'Blocks enemy movement'
            },
            gate: {
                name: 'Gate',
                cost: { gold: 50, lumber: 30 },
                buildTime: 8,
                health: 500,
                armor: 8,
                size: { width: 2, height: 1 },
                description: 'Allows friendly units through walls'
            },
            
            // Support Buildings
            blacksmith: {
                name: 'Blacksmith',
                cost: { gold: 200, lumber: 100 },
                buildTime: 30,
                health: 800,
                armor: 2,
                size: { width: 3, height: 3 },
                upgrades: ['ironWeapons', 'steelArmor', 'gunpowder'],
                description: 'Researches weapon and armor upgrades'
            },
            church: {
                name: 'Church',
                cost: { gold: 300, lumber: 200 },
                buildTime: 40,
                health: 700,
                armor: 1,
                size: { width: 3, height: 3 },
                produces: ['priest', 'monk'],
                upgrades: ['healing', 'blessing'],
                description: 'Trains support units and provides buffs'
            },
            tradingPost: {
                name: 'Trading Post',
                cost: { gold: 250, lumber: 150 },
                buildTime: 35,
                health: 600,
                armor: 1,
                size: { width: 3, height: 3 },
                generates: { gold: 5 },
                upgrades: ['tradeRoutes', 'merchantGuild'],
                description: 'Generates gold through trade',
                nearRoadBonus: { gold: 3 }, // Bonus when connected to roads
                adjacencyBonus: { tradingPost: { gold: 2 } } // Trade network bonus
            },
            
            // Advanced Economic Buildings
            bank: {
                name: 'Bank',
                cost: { gold: 500, lumber: 200 },
                buildTime: 50,
                health: 900,
                armor: 3,
                size: { width: 3, height: 3 },
                generates: { gold: 8 },
                requirements: ['tradingPost'],
                upgrades: ['investmentFund', 'goldReserves'],
                description: 'Advanced gold generation and storage',
                areaBonus: { goldGeneration: 0.15 } // 15% bonus to all gold buildings nearby
            },
            granary: {
                name: 'Granary',
                cost: { gold: 200, lumber: 150 },
                buildTime: 30,
                health: 700,
                armor: 2,
                size: { width: 3, height: 3 },
                provides: { foodStorage: 100 },
                requirements: ['farm'],
                description: 'Stores surplus food and prevents spoilage',
                nearFarmBonus: { foodEfficiency: 0.25 } // 25% more efficient farms nearby
            },
            marketplace: {
                name: 'Marketplace',
                cost: { gold: 300, lumber: 100 },
                buildTime: 35,
                health: 650,
                armor: 1,
                size: { width: 4, height: 3 },
                generates: { gold: 3, lumber: 2 },
                description: 'Central hub for resource trading',
                townCenterBonus: { allResources: 0.1 }, // 10% bonus to all resource generation
                adjacencyBonus: { 
                    tradingPost: { gold: 2 },
                    farm: { foodMax: 2 },
                    lumberMill: { lumber: 2 }
                }
            },
            
            // Infrastructure Buildings
            roads: {
                name: 'Road',
                cost: { gold: 10, lumber: 5 },
                buildTime: 2,
                health: 100,
                armor: 0,
                size: { width: 1, height: 1 },
                description: 'Increases movement speed and trade efficiency',
                connectsBuildings: true,
                speedBonus: 1.5 // 50% faster unit movement
            },
            bridge: {
                name: 'Bridge',
                cost: { gold: 100, lumber: 80 },
                buildTime: 20,
                health: 400,
                armor: 5,
                size: { width: 2, height: 1 },
                description: 'Allows crossing over water and ravines',
                allowsWaterCrossing: true
            },
            lighthouse: {
                name: 'Lighthouse',
                cost: { gold: 300, lumber: 200 },
                buildTime: 40,
                health: 800,
                armor: 3,
                size: { width: 2, height: 2 },
                description: 'Increases naval efficiency and vision range',
                requirements: ['tradingPost'],
                nearWaterBonus: { tradeEfficiency: 0.3, vision: 5 },
                enablesNavalTrade: true
            }
        };
        
        // Unit Types
        this.unitTypes = {
            // Civilian Units
            settler: {
                name: 'Settler',
                cost: { gold: 50, food: 1 },
                buildTime: 10,
                health: 50,
                armor: 0,
                damage: 5,
                speed: 3,
                range: 1,
                abilities: ['build', 'repair', 'gather'],
                description: 'Basic worker unit - builds and gathers resources'
            },
            scout: {
                name: 'Scout',
                cost: { gold: 80, food: 1 },
                buildTime: 12,
                health: 60,
                armor: 0,
                damage: 8,
                speed: 6,
                range: 1,
                sight: 12,
                abilities: ['explore'],
                description: 'Fast unit for exploration'
            },
            
            // Infantry Units
            militia: {
                name: 'Militia',
                cost: { gold: 100, food: 2 },
                buildTime: 15,
                health: 100,
                armor: 2,
                damage: 12,
                speed: 3,
                range: 1,
                description: 'Basic melee infantry'
            },
            rifleman: {
                name: 'Rifleman',
                cost: { gold: 150, lumber: 50, food: 2 },
                buildTime: 18,
                health: 80,
                armor: 1,
                damage: 20,
                speed: 3,
                range: 6,
                requirements: ['gunpowder'],
                description: 'Ranged infantry with rifles'
            },
            ranger: {
                name: 'Texas Ranger',
                cost: { gold: 200, lumber: 80, food: 3 },
                buildTime: 25,
                health: 150,
                armor: 3,
                damage: 25,
                speed: 4,
                range: 7,
                abilities: ['stealth', 'criticalShot'],
                requirements: ['veteranTraining'],
                description: 'Elite ranged unit'
            },
            
            // Cavalry Units
            cavalry: {
                name: 'Cavalry',
                cost: { gold: 250, lumber: 100, food: 4 },
                buildTime: 30,
                health: 200,
                armor: 4,
                damage: 30,
                speed: 7,
                range: 1,
                abilities: ['charge'],
                description: 'Fast mounted melee unit'
            },
            mountedRanger: {
                name: 'Mounted Ranger',
                cost: { gold: 300, lumber: 120, food: 4 },
                buildTime: 35,
                health: 180,
                armor: 3,
                damage: 28,
                speed: 6,
                range: 6,
                abilities: ['mobility', 'pursuit'],
                requirements: ['veteranTraining'],
                description: 'Mobile ranged cavalry'
            },
            
            // Siege Units
            cannon: {
                name: 'Cannon',
                cost: { gold: 400, lumber: 200, oil: 100, food: 5 },
                buildTime: 45,
                health: 150,
                armor: 2,
                damage: 80,
                speed: 2,
                range: 10,
                splash: 2,
                abilities: ['siege', 'bombardment'],
                description: 'Powerful siege weapon'
            },
            steamTank: {
                name: 'Steam Tank',
                cost: { gold: 600, lumber: 300, oil: 200, food: 6 },
                buildTime: 60,
                health: 500,
                armor: 10,
                damage: 60,
                speed: 3,
                range: 8,
                splash: 1,
                requirements: ['ironWeapons', 'steelArmor'],
                description: 'Armored vehicle with cannons'
            },
            
            // Support Units
            priest: {
                name: 'Priest',
                cost: { gold: 150, food: 2 },
                buildTime: 20,
                health: 60,
                armor: 0,
                damage: 0,
                speed: 3,
                range: 5,
                abilities: ['heal', 'bless'],
                description: 'Heals friendly units'
            },
            
            // Hero Units
            hero: {
                name: 'Frontier Hero',
                cost: { gold: 800, lumber: 400, oil: 200, food: 0 },
                buildTime: 90,
                health: 1000,
                armor: 10,
                damage: 100,
                speed: 5,
                range: 2,
                level: 1,
                experience: 0,
                abilities: ['heroicStrike', 'rally', 'inspire'],
                unique: true,
                description: 'Legendary hero unit with special abilities'
            }
        };
        
        // Technology Tree
        this.technologies = {
            // Economic Upgrades
            improvedLumber: {
                name: 'Improved Lumber Processing',
                cost: { gold: 200, lumber: 100 },
                researchTime: 30,
                effect: { lumberRate: 1.25 },
                building: 'lumberMill',
                description: '+25% lumber gathering rate'
            },
            tradeRoutes: {
                name: 'Trade Routes',
                cost: { gold: 300, lumber: 150 },
                researchTime: 40,
                effect: { goldRate: 1.2 },
                building: 'tradingPost',
                description: '+20% gold generation'
            },
            merchantGuild: {
                name: 'Merchant Guild',
                cost: { gold: 500, lumber: 250 },
                researchTime: 60,
                effect: { goldRate: 1.5, tradeBonus: true },
                building: 'tradingPost',
                requirements: ['tradeRoutes'],
                description: '+50% gold generation and trade bonuses'
            },
            
            // Military Upgrades
            ironWeapons: {
                name: 'Iron Weapons',
                cost: { gold: 250, lumber: 150 },
                researchTime: 35,
                effect: { meleeAttack: 3, rangedAttack: 2 },
                building: 'blacksmith',
                description: '+3 melee damage, +2 ranged damage'
            },
            steelArmor: {
                name: 'Steel Armor',
                cost: { gold: 300, lumber: 200 },
                researchTime: 40,
                effect: { armor: 2 },
                building: 'blacksmith',
                requirements: ['ironWeapons'],
                description: '+2 armor for all units'
            },
            gunpowder: {
                name: 'Gunpowder',
                cost: { gold: 400, lumber: 200, oil: 100 },
                researchTime: 50,
                building: 'blacksmith',
                unlocks: ['rifleman', 'cannon'],
                description: 'Unlocks gunpowder units'
            },
            veteranTraining: {
                name: 'Veteran Training',
                cost: { gold: 350, lumber: 200 },
                researchTime: 45,
                effect: { health: 1.15, experience: 1.25 },
                building: 'barracks',
                description: '+15% unit health, +25% experience gain'
            },
            eliteForces: {
                name: 'Elite Forces',
                cost: { gold: 600, lumber: 400, oil: 150 },
                researchTime: 60,
                effect: { health: 1.3, damage: 1.2 },
                building: 'barracks',
                requirements: ['veteranTraining'],
                description: '+30% health, +20% damage for elite units'
            },
            
            // Support Upgrades
            healing: {
                name: 'Advanced Healing',
                cost: { gold: 200, lumber: 100 },
                researchTime: 30,
                effect: { healRate: 2 },
                building: 'church',
                description: 'Doubles healing rate'
            },
            blessing: {
                name: 'Divine Blessing',
                cost: { gold: 300, lumber: 150 },
                researchTime: 40,
                effect: { morale: 1.1 },
                building: 'church',
                requirements: ['healing'],
                description: '+10% morale boost to nearby units'
            }
        };
        
        // Territories
        this.territories = [];
        this.territorySize = 32; // Size of each territory in chunks
        
        // Fog of War
        this.fogOfWar = new Map();
        this.exploredTiles = new Set();
        
        // Selection and commands
        this.selectedUnits = [];
        this.selectedBuilding = null;
        this.buildMode = null;
        this.buildPreview = null;
        
        // Battle System
        this.battles = [];
        this.projectiles = [];
        
        // Victory Conditions
        this.victoryConditions = {
            conquest: false, // Control all territories
            elimination: false, // Destroy all enemies
            wonder: false, // Build a wonder
            economic: false // Reach economic goal
        };
        
        this.initialize();
    }
    
    initialize() {
        // Generate initial territories
        this.generateTerritories();
        
        // Initialize resource nodes and economic zones
        this.initializeResourceNodes();
        this.initializeEconomicZones();
        
        // Place starting towns
        this.placeStartingTowns();
        
        // Initialize AI
        this.initializeAI();
        
        // Initialize trade routes
        this.initializeTradeRoutes();
        
        // Setup UI
        this.setupConquestUI();
        
        // Start resource generation
        this.startResourceGeneration();
        
        // Initialize production queues
        this.initializeProductionSystem();
        
        // Initialize technology tree
        this.initializeTechnologyTree();
        
        console.log('Conquest System Initialized - Build your empire!');
    }
    
    generateTerritories() {
        // Create a grid of territories
        const worldSize = 10; // 10x10 territories
        
        for (let x = 0; x < worldSize; x++) {
            for (let z = 0; z < worldSize; z++) {
                const territory = {
                    id: `territory_${x}_${z}`,
                    x: x * this.territorySize,
                    z: z * this.territorySize,
                    width: this.territorySize,
                    height: this.territorySize,
                    owner: null,
                    resources: this.generateTerritoryResources(),
                    strategicValue: Math.random() * 100,
                    buildings: [],
                    units: []
                };
                
                this.territories.push(territory);
            }
        }
    }
    
    generateTerritoryResources() {
        return {
            goldDeposits: Math.floor(Math.random() * 3) + 1,
            forests: Math.floor(Math.random() * 5) + 2,
            oilWells: Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0,
            farmland: Math.floor(Math.random() * 4) + 2
        };
    }
    
    placeStartingTowns() {
        // Place player town
        const playerTerritory = this.territories[0];
        this.createBuilding('townHall', playerTerritory.x + 16, playerTerritory.z + 16, this.playerFaction);
        playerTerritory.owner = this.playerFaction.id;
        this.playerFaction.territories.push(playerTerritory);
        
        // Create starting units for player
        for (let i = 0; i < 5; i++) {
            this.createUnit('settler', 
                playerTerritory.x + 14 + i * 2, 
                playerTerritory.z + 20, 
                this.playerFaction
            );
        }
        
        // Place AI towns
        const positions = [
            { x: 9, z: 0 }, // Top-right
            { x: 0, z: 9 }, // Bottom-left
            { x: 9, z: 9 }  // Bottom-right
        ];
        
        this.aiFactions.forEach((faction, index) => {
            if (index < positions.length) {
                const pos = positions[index];
                const territory = this.territories[pos.z * 10 + pos.x];
                
                this.createBuilding('townHall', 
                    territory.x + 16, 
                    territory.z + 16, 
                    faction
                );
                
                territory.owner = faction.id;
                faction.territories.push(territory);
                
                // Create starting units for AI
                for (let i = 0; i < 3; i++) {
                    this.createUnit('settler', 
                        territory.x + 14 + i * 2, 
                        territory.z + 20, 
                        faction
                    );
                }
                
                // Give AI some starting military
                this.createUnit('militia', territory.x + 18, territory.z + 18, faction);
                this.createUnit('militia', territory.x + 20, territory.z + 18, faction);
            }
        });
    }
    
    createBuilding(type, x, z, faction) {
        const buildingData = this.buildingTypes[type];
        if (!buildingData) return null;
        
        const building = {
            id: `building_${Date.now()}_${Math.random()}`,
            type: type,
            faction: faction.id,
            x: x,
            z: z,
            y: this.game.getGroundHeight(x, z),
            health: buildingData.health,
            maxHealth: buildingData.health,
            armor: buildingData.armor,
            constructionProgress: 0,
            isComplete: false,
            mesh: null,
            productionQueue: [],
            rallyPoint: { x: x + 5, z: z + 5 }
        };
        
        // Create 3D mesh
        this.createBuildingMesh(building, buildingData, faction);
        
        // Add to faction
        faction.buildings.push(building);
        
        // Add to territory
        const territory = this.getTerritoryAt(x, z);
        if (territory) {
            territory.buildings.push(building);
        }
        
        return building;
    }
    
    createBuildingMesh(building, buildingData, faction) {
        const geometry = new THREE.BoxGeometry(
            buildingData.size.width,
            buildingData.size.height || 3,
            buildingData.size.height
        );
        
        const material = new THREE.MeshLambertMaterial({
            color: faction.color,
            emissive: faction.color,
            emissiveIntensity: 0.2
        });
        
        building.mesh = new THREE.Mesh(geometry, material);
        building.mesh.position.set(building.x, building.y + 1.5, building.z);
        building.mesh.castShadow = true;
        building.mesh.receiveShadow = true;
        building.mesh.userData = { type: 'building', data: building };
        
        this.game.scene.add(building.mesh);
        
        // Add health bar
        this.createHealthBar(building);
        
        // Add construction effect if not complete
        if (!building.isComplete) {
            this.startConstruction(building);
        }
    }
    
    createUnit(type, x, z, faction) {
        const unitData = this.unitTypes[type];
        if (!unitData) return null;
        
        const unit = {
            id: `unit_${Date.now()}_${Math.random()}`,
            type: type,
            faction: faction.id,
            x: x,
            z: z,
            y: this.game.getGroundHeight(x, z),
            targetX: x,
            targetZ: z,
            health: unitData.health,
            maxHealth: unitData.health,
            armor: unitData.armor,
            damage: unitData.damage,
            speed: unitData.speed,
            range: unitData.range,
            sight: unitData.sight || 8,
            state: 'idle',
            target: null,
            path: [],
            mesh: null,
            level: 1,
            experience: 0
        };
        
        // Create 3D mesh
        this.createUnitMesh(unit, unitData, faction);
        
        // Add to faction
        faction.units.push(unit);
        
        // Update food count
        if (unitData.cost && unitData.cost.food) {
            faction.resources.food += unitData.cost.food;
        }
        
        return unit;
    }
    
    createUnitMesh(unit, unitData, faction) {
        // Different geometries for different unit types
        let geometry;
        
        if (unit.type === 'settler') {
            geometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
        } else if (unit.type.includes('cavalry') || unit.type.includes('mounted')) {
            geometry = new THREE.BoxGeometry(0.6, 0.8, 1.2);
        } else if (unit.type === 'cannon' || unit.type === 'steamTank') {
            geometry = new THREE.BoxGeometry(1, 0.6, 1.5);
        } else {
            geometry = new THREE.CapsuleGeometry(0.3, 0.7, 4, 8);
        }
        
        const material = new THREE.MeshLambertMaterial({
            color: faction.color,
            emissive: faction.color,
            emissiveIntensity: 0.1
        });
        
        unit.mesh = new THREE.Mesh(geometry, material);
        unit.mesh.position.set(unit.x, unit.y + 0.5, unit.z);
        unit.mesh.castShadow = true;
        unit.mesh.receiveShadow = true;
        unit.mesh.userData = { type: 'unit', data: unit };
        
        this.game.scene.add(unit.mesh);
        
        // Add selection indicator
        const ringGeometry = new THREE.RingGeometry(0.6, 0.8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        
        unit.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        unit.selectionRing.rotation.x = -Math.PI / 2;
        unit.selectionRing.position.copy(unit.mesh.position);
        unit.selectionRing.position.y = unit.y + 0.1;
        
        this.game.scene.add(unit.selectionRing);
    }
    
    createHealthBar(entity) {
        const barGeometry = new THREE.PlaneGeometry(1, 0.1);
        const barMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        
        entity.healthBar = new THREE.Mesh(barGeometry, barMaterial);
        entity.healthBar.position.copy(entity.mesh.position);
        entity.healthBar.position.y += 2;
        
        this.game.scene.add(entity.healthBar);
    }
    
    startConstruction(building) {
        const buildingData = this.buildingTypes[building.type];
        const constructionTime = buildingData.buildTime * 1000; // Convert to ms
        const startTime = Date.now();
        
        const constructionInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            building.constructionProgress = Math.min(elapsed / constructionTime, 1);
            
            // Update mesh appearance
            if (building.mesh) {
                building.mesh.scale.y = building.constructionProgress;
                building.mesh.position.y = building.y + (1.5 * building.constructionProgress);
            }
            
            if (building.constructionProgress >= 1) {
                building.isComplete = true;
                clearInterval(constructionInterval);
                
                // Apply building effects
                this.applyBuildingEffects(building);
                
                // Notify completion
                this.game.showNotification(`${buildingData.name} construction complete!`);
            }
        }, 100);
    }
    
    applyBuildingEffects(building) {
        const buildingData = this.buildingTypes[building.type];
        const faction = this.getFactionById(building.faction);
        
        if (buildingData.provides) {
            // Apply resource provisions
            if (buildingData.provides.foodMax) {
                faction.resources.foodMax += buildingData.provides.foodMax;
            }
        }
        
        if (buildingData.generates) {
            // Start resource generation
            this.startBuildingGeneration(building, buildingData.generates);
        }
    }
    
    startBuildingGeneration(building, generates) {
        building.generationInterval = setInterval(() => {
            if (building.isComplete && building.health > 0) {
                const faction = this.getFactionById(building.faction);
                
                // Use enhanced generation amounts from efficiency system
                const actualGeneration = building.actualGeneration || generates;
                
                Object.keys(actualGeneration).forEach(resource => {
                    const amount = actualGeneration[resource];
                    
                    // Apply storage limits
                    const storageLimit = this.getResourceStorageLimit(faction, resource);
                    const currentAmount = faction.resources[resource] || 0;
                    
                    if (currentAmount < storageLimit) {
                        const actualGain = Math.min(amount, storageLimit - currentAmount);
                        faction.resources[resource] = currentAmount + actualGain;
                        
                        // Show resource gain notification occasionally
                        if (faction.id === 'player' && Math.random() < 0.05) {
                            this.game.showNotification(`+${actualGain} ${resource.toUpperCase()}`);
                        }
                    } else if (faction.id === 'player' && Math.random() < 0.02) {
                        this.game.showNotification(`${resource.toUpperCase()} storage full!`);
                    }
                });
                
                // Update resource efficiency over time
                this.updateResourceEfficiency(building);
            }
        }, 3000); // Generate every 3 seconds for more responsive gameplay
    }
    
    getTerritoryAt(x, z) {
        const tx = Math.floor(x / this.territorySize);
        const tz = Math.floor(z / this.territorySize);
        return this.territories.find(t => 
            Math.floor(t.x / this.territorySize) === tx && 
            Math.floor(t.z / this.territorySize) === tz
        );
    }
    
    getFactionById(id) {
        if (id === 'player') return this.playerFaction;
        return this.aiFactions.find(f => f.id === id);
    }
    
    initializeAI() {
        // Initialize advanced AI systems for each faction
        this.aiFactions.forEach(faction => {
            // Initialize AI personality and strategy
            this.initializeAIPersonality(faction);
            
            // Start AI behavior loops
            this.startAIBehavior(faction);
            
            // Initialize strategic planning
            this.initializeAIStrategy(faction);
        });
        
        // Start global AI coordination
        this.startGlobalAICoordination();
    }
    
    startAIBehavior(faction) {
        // AI decision making every 5 seconds
        setInterval(() => {
            this.aiMakeDecision(faction);
        }, 5000);
        
        // AI unit control every second
        setInterval(() => {
            this.aiControlUnits(faction);
        }, 1000);
    }
    
    aiMakeDecision(faction) {
        // Advanced AI decision-making with strategic depth
        const gameState = this.analyzeGameState(faction);
        const priorities = this.calculateAdvancedAIPriorities(faction, gameState);
        
        // Execute decisions based on AI personality and strategy
        this.executeAIStrategy(faction, priorities, gameState);
        
        // Update long-term strategy based on recent events
        this.updateAIStrategy(faction, gameState);
        
        // Handle diplomatic decisions
        this.handleAIDiplomacy(faction, gameState);
    }
    
    calculateAIPriorities(faction) {
        const workers = faction.units.filter(u => u.type === 'settler').length;
        const military = faction.units.filter(u => u.type !== 'settler' && u.type !== 'scout').length;
        const buildings = faction.buildings.length;
        
        return {
            needWorkers: workers < 5,
            needMilitary: military < 10,
            needBuildings: buildings < 10,
            canExpand: faction.resources.gold > 500 && faction.territories.length < 3,
            shouldAttack: military > 15 && Math.random() < faction.aggression
        };
    }
    
    aiTrainUnit(faction, unitType) {
        const townHall = faction.buildings.find(b => 
            (b.type === 'townHall' || b.type === 'townCenter' || b.type === 'fortress') && 
            b.isComplete
        );
        
        if (townHall) {
            const unitData = this.unitTypes[unitType];
            if (this.canAfford(faction, unitData.cost)) {
                this.deductResources(faction, unitData.cost);
                this.createUnit(unitType, 
                    townHall.x + Math.random() * 4 - 2,
                    townHall.z + Math.random() * 4 - 2,
                    faction
                );
            }
        }
    }
    
    aiBuildStructure(faction) {
        // Find a good spot to build
        const territory = faction.territories[0];
        if (!territory) return;
        
        // Determine what to build
        let buildingType = 'farm';
        
        if (!faction.buildings.some(b => b.type === 'barracks')) {
            buildingType = 'barracks';
        } else if (faction.resources.foodMax - faction.resources.food < 10) {
            buildingType = 'farm';
        } else if (!faction.buildings.some(b => b.type === 'goldMine')) {
            buildingType = 'goldMine';
        }
        
        const buildingData = this.buildingTypes[buildingType];
        if (this.canAfford(faction, buildingData.cost)) {
            this.deductResources(faction, buildingData.cost);
            
            const x = territory.x + 10 + Math.random() * 20;
            const z = territory.z + 10 + Math.random() * 20;
            
            this.createBuilding(buildingType, x, z, faction);
        }
    }
    
    aiControlUnits(faction) {
        faction.units.forEach(unit => {
            if (unit.state === 'idle') {
                // Find something for idle units to do
                if (unit.type === 'settler') {
                    // Gather resources or build
                    const nearestResource = this.findNearestResource(unit);
                    if (nearestResource) {
                        this.moveUnit(unit, nearestResource.x, nearestResource.z);
                        unit.state = 'gathering';
                    }
                } else {
                    // Military units patrol or attack
                    if (Math.random() < 0.1) {
                        const target = this.findNearestEnemy(unit, faction);
                        if (target && this.getDistance(unit, target) < 20) {
                            this.attackTarget(unit, target);
                        } else {
                            // Patrol
                            const territory = faction.territories[0];
                            if (territory) {
                                const px = territory.x + Math.random() * 30;
                                const pz = territory.z + Math.random() * 30;
                                this.moveUnit(unit, px, pz);
                                unit.state = 'patrolling';
                            }
                        }
                    }
                }
            }
        });
    }
    
    aiExpand(faction) {
        // Find unclaimed territory
        const unclaimedTerritories = this.territories.filter(t => !t.owner);
        if (unclaimedTerritories.length === 0) return;
        
        // Find closest unclaimed territory
        const townHall = faction.buildings.find(b => b.type === 'townHall');
        if (!townHall) return;
        
        let closest = unclaimedTerritories[0];
        let minDist = this.getDistance(townHall, closest);
        
        unclaimedTerritories.forEach(territory => {
            const dist = this.getDistance(townHall, territory);
            if (dist < minDist) {
                minDist = dist;
                closest = territory;
            }
        });
        
        // Send settlers to build there
        const settlers = faction.units.filter(u => u.type === 'settler');
        if (settlers.length > 2) {
            settlers.slice(0, 2).forEach(settler => {
                this.moveUnit(settler, closest.x + 16, closest.z + 16);
                settler.state = 'expanding';
            });
        }
    }
    
    aiAttack(faction) {
        // Find enemy target
        const enemies = [...this.aiFactions, this.playerFaction].filter(f => f.id !== faction.id);
        if (enemies.length === 0) return;
        
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const targetBuilding = target.buildings[0];
        
        if (targetBuilding) {
            // Send military units to attack
            const military = faction.units.filter(u => 
                u.type !== 'settler' && u.type !== 'scout'
            );
            
            military.forEach(unit => {
                this.moveUnit(unit, targetBuilding.x, targetBuilding.z);
                unit.state = 'attacking';
                unit.target = targetBuilding;
            });
        }
    }
    
    canAfford(faction, cost) {
        if (!cost) return true;
        
        return (!cost.gold || faction.resources.gold >= cost.gold) &&
               (!cost.lumber || faction.resources.lumber >= cost.lumber) &&
               (!cost.oil || faction.resources.oil >= cost.oil) &&
               (!cost.food || faction.resources.foodMax - faction.resources.food >= cost.food);
    }
    
    deductResources(faction, cost) {
        if (!cost) return;
        
        if (cost.gold) faction.resources.gold -= cost.gold;
        if (cost.lumber) faction.resources.lumber -= cost.lumber;
        if (cost.oil) faction.resources.oil -= cost.oil;
        if (cost.food) faction.resources.food += cost.food;
    }
    
    moveUnit(unit, targetX, targetZ) {
        unit.targetX = targetX;
        unit.targetZ = targetZ;
        unit.state = 'moving';
        
        // Simple pathfinding (can be enhanced with A*)
        unit.path = this.calculatePath(unit, targetX, targetZ);
    }
    
    calculatePath(unit, targetX, targetZ) {
        // Simple straight-line path for now
        // This could be replaced with A* pathfinding
        return [{ x: targetX, z: targetZ }];
    }
    
    attackTarget(unit, target) {
        unit.target = target;
        unit.state = 'attacking';
        
        // Move to attack range
        const distance = this.getDistance(unit, target);
        const unitData = this.unitTypes[unit.type];
        
        if (distance > unitData.range) {
            this.moveUnit(unit, target.x, target.z);
        }
    }
    
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    findNearestResource(unit) {
        // Simplified - just return a random point near the unit
        return {
            x: unit.x + (Math.random() - 0.5) * 10,
            z: unit.z + (Math.random() - 0.5) * 10
        };
    }
    
    findNearestEnemy(unit, faction) {
        let nearest = null;
        let minDist = Infinity;
        
        // Check all enemy units
        [...this.aiFactions, this.playerFaction].forEach(f => {
            if (f.id !== faction.id) {
                f.units.forEach(enemy => {
                    const dist = this.getDistance(unit, enemy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = enemy;
                    }
                });
            }
        });
        
        return nearest;
    }
    
    // === ADVANCED AI SYSTEMS ===
    
    initializeAIPersonality(faction) {
        // Assign unique AI personality traits based on faction identity
        switch(faction.id) {
            case 'bandits': // Desert Bandits - Aggressive raiders
                faction.aiPersonality = {
                    aggression: 0.9,
                    expansion: 0.7,
                    economy: 0.4,
                    military: 0.8,
                    defense: 0.3,
                    diplomacy: 0.2,
                    raiding: 0.9,
                    preferred_units: ['cavalry', 'ranger', 'scout'],
                    strategy: 'hit_and_run'
                };
                break;
            case 'natives': // Comanche Nation - Defensive specialists
                faction.aiPersonality = {
                    aggression: 0.4,
                    expansion: 0.6,
                    economy: 0.7,
                    military: 0.6,
                    defense: 0.9,
                    diplomacy: 0.5,
                    raiding: 0.3,
                    preferred_units: ['rifleman', 'watchtower', 'wall'],
                    strategy: 'fortress'
                };
                break;
            case 'outlaws': // Gulf Pirates - Naval and trade focused
                faction.aiPersonality = {
                    aggression: 0.7,
                    expansion: 0.8,
                    economy: 0.8,
                    military: 0.7,
                    defense: 0.5,
                    diplomacy: 0.6,
                    raiding: 0.6,
                    preferred_units: ['steamTank', 'cannon', 'tradingPost'],
                    strategy: 'economic_warfare'
                };
                break;
        }
        
        // Initialize AI memory and learning
        faction.aiMemory = {
            playerActions: [],
            threats: [],
            opportunities: [],
            learned_counters: new Map(),
            relationship_history: new Map(),
            successful_strategies: [],
            failed_strategies: []
        };
    }
    
    initializeAIStrategy(faction) {
        // Set initial strategic goals based on personality
        faction.aiStrategy = {
            current_phase: 'early_game', // early_game, mid_game, late_game
            primary_goal: this.getInitialGoal(faction),
            secondary_goals: [],
            resource_targets: this.calculateResourceTargets(faction),
            military_doctrine: this.getMilitaryDoctrine(faction),
            expansion_plan: this.createExpansionPlan(faction),
            build_order: this.generateBuildOrder(faction),
            threat_assessment: new Map(),
            alliance_preferences: new Map()
        };
    }
    
    getInitialGoal(faction) {
        switch(faction.aiPersonality.strategy) {
            case 'hit_and_run': return 'establish_raiding_base';
            case 'fortress': return 'secure_territory';
            case 'economic_warfare': return 'control_trade_routes';
            default: return 'expand_territory';
        }
    }
    
    calculateResourceTargets(faction) {
        const personality = faction.aiPersonality;
        return {
            gold: Math.floor(1000 * personality.economy),
            lumber: Math.floor(800 * (personality.military + personality.economy) / 2),
            oil: Math.floor(600 * personality.military),
            food: Math.floor(50 * personality.expansion)
        };
    }
    
    getMilitaryDoctrine(faction) {
        switch(faction.aiPersonality.strategy) {
            case 'hit_and_run':
                return {
                    preferred_ratio: { cavalry: 0.4, ranger: 0.3, scout: 0.3 },
                    formation: 'loose',
                    tactics: ['flanking', 'retreat_and_harass', 'raid_economy']
                };
            case 'fortress':
                return {
                    preferred_ratio: { rifleman: 0.5, militia: 0.3, watchtower: 0.2 },
                    formation: 'defensive_line',
                    tactics: ['hold_ground', 'counter_attack', 'fortify_positions']
                };
            case 'economic_warfare':
                return {
                    preferred_ratio: { steamTank: 0.3, cannon: 0.3, militia: 0.4 },
                    formation: 'artillery_support',
                    tactics: ['siege_warfare', 'control_resources', 'technological_superiority']
                };
            default:
                return {
                    preferred_ratio: { militia: 0.6, rifleman: 0.4 },
                    formation: 'line',
                    tactics: ['frontal_assault', 'numerical_superiority']
                };
        }
    }
    
    createExpansionPlan(faction) {
        // Analyze map and create territorial expansion plan
        const availableTerritories = this.territories.filter(t => !t.owner);
        const homeBase = faction.territories[0];
        
        if (!homeBase) return [];
        
        // Score territories based on AI preferences
        const scoredTerritories = availableTerritories.map(territory => {
            const distance = this.getDistance(homeBase, territory);
            const resourceValue = this.evaluateTerritoryResources(territory);
            const strategicValue = this.evaluateTerritoryStrategy(territory, faction);
            
            const score = (resourceValue * faction.aiPersonality.economy) +
                         (strategicValue * faction.aiPersonality.military) -
                         (distance * 0.1);
            
            return { territory, score };
        });
        
        // Sort by score and return top 3-5 targets
        return scoredTerritories
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.territory);
    }
    
    evaluateTerritoryResources(territory) {
        // Check for resource nodes in territory
        let value = 0;
        this.resourceNodes.forEach(node => {
            const distance = this.getDistance(territory, node);
            if (distance < 30) { // Within territory influence
                value += node.richness * 10;
            }
        });
        return value;
    }
    
    evaluateTerritoryStrategy(territory, faction) {
        let value = 0;
        
        // Defensive positions (high ground, chokepoints)
        const terrainType = this.getTerrainType(territory.x, territory.z);
        if (terrainType === 'hills' && faction.aiPersonality.defense > 0.6) {
            value += 20;
        }
        
        // Trade route potential
        if (terrainType === 'plains' && faction.aiPersonality.economy > 0.6) {
            value += 15;
        }
        
        // Proximity to enemies for aggressive factions
        if (faction.aiPersonality.aggression > 0.7) {
            const nearbyEnemies = this.findNearbyEnemyTerritories(territory, faction);
            value += nearbyEnemies.length * 10;
        }
        
        return value;
    }
    
    findNearbyEnemyTerritories(territory, faction) {
        return this.territories.filter(t => 
            t.owner && 
            t.owner !== faction.id && 
            this.getDistance(territory, t) < 50
        );
    }
    
    generateBuildOrder(faction) {
        const personality = faction.aiPersonality;
        const buildOrder = [];
        
        // Early game essentials
        buildOrder.push('farm', 'goldMine');
        
        // Based on strategy
        if (personality.strategy === 'hit_and_run') {
            buildOrder.push('stable', 'tradingPost', 'barracks');
        } else if (personality.strategy === 'fortress') {
            buildOrder.push('barracks', 'watchtower', 'blacksmith', 'wall');
        } else if (personality.strategy === 'economic_warfare') {
            buildOrder.push('tradingPost', 'blacksmith', 'workshop', 'bank');
        }
        
        // Mid-game expansion
        buildOrder.push('lumberMill', 'townCenter');
        
        return buildOrder;
    }
    
    startGlobalAICoordination() {
        // Global AI coordination every 10 seconds
        setInterval(() => {
            this.updateGlobalAIState();
            this.handleAIAlliances();
            this.adjustAIDifficulty();
        }, 10000);
    }
    
    updateGlobalAIState() {
        // Track global game state for all AI
        const gamePhase = this.determineGamePhase();
        
        this.aiFactions.forEach(faction => {
            faction.aiStrategy.current_phase = gamePhase;
            this.updateThreatAssessment(faction);
            this.adaptStrategyToPhase(faction, gamePhase);
        });
    }
    
    determineGamePhase() {
        const avgBuildings = this.aiFactions.reduce((sum, f) => sum + f.buildings.length, 0) / this.aiFactions.length;
        const avgUnits = this.aiFactions.reduce((sum, f) => sum + f.units.length, 0) / this.aiFactions.length;
        
        if (avgBuildings < 5 && avgUnits < 10) return 'early_game';
        if (avgBuildings < 15 && avgUnits < 25) return 'mid_game';
        return 'late_game';
    }
    
    updateThreatAssessment(faction) {
        // Assess threats from other factions
        [...this.aiFactions, this.playerFaction].forEach(otherFaction => {
            if (otherFaction.id === faction.id) return;
            
            const threat = this.calculateThreatLevel(faction, otherFaction);
            faction.aiStrategy.threat_assessment.set(otherFaction.id, threat);
        });
    }
    
    calculateThreatLevel(faction, otherFaction) {
        let threat = 0;
        
        // Military strength comparison
        const myMilitary = faction.units.filter(u => u.type !== 'settler').length;
        const theirMilitary = otherFaction.units.filter(u => u.type !== 'settler').length;
        threat += Math.max(0, (theirMilitary - myMilitary) * 2);
        
        // Proximity threat
        if (faction.territories.length > 0 && otherFaction.territories.length > 0) {
            const distance = this.getDistance(faction.territories[0], otherFaction.territories[0]);
            if (distance < 100) {
                threat += (100 - distance) * 0.5;
            }
        }
        
        // Economic threat
        if (otherFaction.resources.gold > faction.resources.gold * 1.5) {
            threat += 10;
        }
        
        return Math.min(100, threat);
    }
    
    analyzeGameState(faction) {
        return {
            myStrength: this.calculateFactionStrength(faction),
            threats: Array.from(faction.aiStrategy.threat_assessment.entries()),
            resources: faction.resources,
            territories: faction.territories.length,
            phase: faction.aiStrategy.current_phase,
            time: Date.now()
        };
    }
    
    calculateFactionStrength(faction) {
        let strength = 0;
        strength += faction.buildings.filter(b => b.isComplete).length * 5;
        strength += faction.units.length * 3;
        strength += Math.floor(faction.resources.gold / 100);
        return strength;
    }
    
    calculateAdvancedAIPriorities(faction, gameState) {
        const personality = faction.aiPersonality;
        const strategy = faction.aiStrategy;
        
        // Base priorities influenced by personality
        let priorities = {
            economy: personality.economy,
            military: personality.military,
            expansion: personality.expansion,
            defense: personality.defense,
            technology: 0.3
        };
        
        // Adjust based on threats
        const highestThreat = Math.max(...gameState.threats.map(t => t[1]));
        if (highestThreat > 30) {
            priorities.military *= 1.5;
            priorities.defense *= 1.3;
            priorities.economy *= 0.8;
        }
        
        // Adjust based on game phase
        switch(gameState.phase) {
            case 'early_game':
                priorities.economy *= 1.4;
                priorities.expansion *= 1.2;
                break;
            case 'mid_game':
                priorities.military *= 1.3;
                priorities.technology *= 1.5;
                break;
            case 'late_game':
                priorities.military *= 1.5;
                priorities.defense *= 1.2;
                break;
        }
        
        return priorities;
    }
    
    executeAIStrategy(faction, priorities, gameState) {
        // Execute actions based on calculated priorities
        const actions = [
            { action: 'build_economy', priority: priorities.economy },
            { action: 'train_military', priority: priorities.military },
            { action: 'expand_territory', priority: priorities.expansion },
            { action: 'build_defenses', priority: priorities.defense },
            { action: 'research_tech', priority: priorities.technology }
        ];
        
        // Sort by priority and execute top actions
        actions.sort((a, b) => b.priority - a.priority);
        
        for (let i = 0; i < Math.min(2, actions.length); i++) {
            const action = actions[i];
            if (Math.random() < action.priority) {
                this.executeAIAction(faction, action.action, gameState);
            }
        }
    }
    
    executeAIAction(faction, action, gameState) {
        switch(action) {
            case 'build_economy':
                this.aiSmartBuildEconomy(faction);
                break;
            case 'train_military':
                this.aiSmartTrainMilitary(faction);
                break;
            case 'expand_territory':
                this.aiSmartExpansion(faction);
                break;
            case 'build_defenses':
                this.aiSmartDefense(faction);
                break;
            case 'research_tech':
                this.aiSmartResearch(faction);
                break;
        }
    }
    
    aiSmartBuildEconomy(faction) {
        const buildOrder = faction.aiStrategy.build_order;
        const economicBuildings = ['goldMine', 'lumberMill', 'farm', 'tradingPost', 'bank', 'marketplace'];
        
        for (const buildingType of buildOrder) {
            if (economicBuildings.includes(buildingType)) {
                const existing = faction.buildings.filter(b => b.type === buildingType).length;
                const needed = this.calculateNeededBuildings(faction, buildingType);
                
                if (existing < needed) {
                    if (this.aiBuildStructureIntelligent(faction, buildingType)) {
                        break; // Only build one at a time
                    }
                }
            }
        }
    }
    
    aiSmartTrainMilitary(faction) {
        const doctrine = faction.aiStrategy.military_doctrine;
        const currentArmy = this.analyzeCurrentArmy(faction);
        
        // Train units based on preferred ratio
        Object.keys(doctrine.preferred_ratio).forEach(unitType => {
            const desired = Math.floor(faction.units.length * doctrine.preferred_ratio[unitType]);
            const current = currentArmy[unitType] || 0;
            
            if (current < desired) {
                this.aiTrainUnitIntelligent(faction, unitType);
            }
        });
    }
    
    analyzeCurrentArmy(faction) {
        const army = {};
        faction.units.forEach(unit => {
            if (unit.type !== 'settler' && unit.type !== 'scout') {
                army[unit.type] = (army[unit.type] || 0) + 1;
            }
        });
        return army;
    }
    
    aiSmartExpansion(faction) {
        const expansionPlan = faction.aiStrategy.expansion_plan;
        
        if (expansionPlan.length > 0 && faction.resources.gold >= 300) {
            const targetTerritory = expansionPlan[0];
            this.aiExpandToTerritory(faction, targetTerritory);
        }
    }
    
    aiSmartDefense(faction) {
        // Identify vulnerable areas and fortify them
        faction.territories.forEach(territory => {
            const nearbyEnemies = this.findNearbyEnemyTerritories(territory, faction);
            if (nearbyEnemies.length > 0) {
                this.aiFortifyTerritory(faction, territory);
            }
        });
    }
    
    aiSmartResearch(faction) {
        // Implement technology research when tech tree is available
        // For now, upgrade existing buildings
        const upgradableBuildings = faction.buildings.filter(b => 
            b.isComplete && this.buildingTypes[b.type].upgrades
        );
        
        if (upgradableBuildings.length > 0) {
            const building = upgradableBuildings[0];
            // Implement building upgrade logic
            console.log(`${faction.name} considers upgrading ${building.type}`);
        }
    }
    
    updateAIStrategy(faction, gameState) {
        // Learn from recent successes and failures
        this.updateAILearning(faction, gameState);
        
        // Adapt strategy based on changing conditions
        this.adaptAIStrategy(faction, gameState);
    }
    
    updateAILearning(faction, gameState) {
        // Track what strategies worked
        const currentStrength = gameState.myStrength;
        const previousStrength = faction.aiMemory.lastStrength || currentStrength;
        
        if (currentStrength > previousStrength * 1.1) {
            // Strategy is working, reinforce it
            const recentActions = faction.aiMemory.recent_actions || [];
            faction.aiMemory.successful_strategies.push(...recentActions);
        } else if (currentStrength < previousStrength * 0.9) {
            // Strategy is failing, avoid it
            const recentActions = faction.aiMemory.recent_actions || [];
            faction.aiMemory.failed_strategies.push(...recentActions);
        }
        
        faction.aiMemory.lastStrength = currentStrength;
        faction.aiMemory.recent_actions = [];
    }
    
    adaptAIStrategy(faction, gameState) {
        // Adapt based on current situation
        if (gameState.phase === 'late_game' && faction.aiStrategy.primary_goal === 'expand_territory') {
            faction.aiStrategy.primary_goal = 'eliminate_enemies';
        }
        
        // Respond to high threat situations
        const highestThreat = Math.max(...gameState.threats.map(t => t[1]));
        if (highestThreat > 50 && faction.aiPersonality.strategy !== 'fortress') {
            faction.aiPersonality.defense *= 1.5;
            faction.aiPersonality.aggression *= 0.7;
        }
    }
    
    handleAIDiplomacy(faction, gameState) {
        // Simple diplomacy system
        gameState.threats.forEach(([otherFactionId, threatLevel]) => {
            if (threatLevel < 20 && Math.random() < 0.1) {
                // Consider peaceful relations
                this.considerAlliance(faction, otherFactionId);
            } else if (threatLevel > 60 && Math.random() < 0.2) {
                // Consider preemptive action
                this.considerPreemptiveStrike(faction, otherFactionId);
            }
        });
    }
    
    considerAlliance(faction, otherFactionId) {
        // Basic alliance consideration
        console.log(`${faction.name} considers alliance with ${otherFactionId}`);
    }
    
    considerPreemptiveStrike(faction, otherFactionId) {
        // Consider attacking before being attacked
        const otherFaction = this.getFactionById(otherFactionId);
        if (otherFaction && faction.units.length > otherFaction.units.length * 1.2) {
            this.aiAttackFaction(faction, otherFaction);
        }
    }
    
    // Enhanced AI helper methods
    
    aiBuildStructureIntelligent(faction, buildingType) {
        // More intelligent building placement
        const buildingData = this.buildingTypes[buildingType];
        if (!this.canAfford(faction, buildingData.cost)) return false;
        
        const optimalLocation = this.findOptimalBuildingLocation(faction, buildingType);
        if (optimalLocation) {
            this.deductResources(faction, buildingData.cost);
            this.createBuilding(buildingType, optimalLocation.x, optimalLocation.z, faction);
            return true;
        }
        return false;
    }
    
    findOptimalBuildingLocation(faction, buildingType) {
        const territory = faction.territories[0];
        if (!territory) return null;
        
        const buildingData = this.buildingTypes[buildingType];
        
        // Resource buildings near resource nodes
        if (['goldMine', 'lumberMill', 'oilDerrick'].includes(buildingType)) {
            const relevantNodes = this.resourceNodes.filter(node => {
                const nodeType = buildingType === 'goldMine' ? 'gold' : 
                                buildingType === 'lumberMill' ? 'lumber' : 'oil';
                return node.type === nodeType && 
                       this.getDistance(territory, node) < 50;
            });
            
            if (relevantNodes.length > 0) {
                const bestNode = relevantNodes[0];
                return { 
                    x: bestNode.x + (Math.random() - 0.5) * 4, 
                    z: bestNode.z + (Math.random() - 0.5) * 4 
                };
            }
        }
        
        // Default: Near town center with some randomization
        return {
            x: territory.x + 16 + (Math.random() - 0.5) * 20,
            z: territory.z + 16 + (Math.random() - 0.5) * 20
        };
    }
    
    aiTrainUnitIntelligent(faction, unitType) {
        // Train units using the advanced production system
        const productionBuilding = this.findProductionBuilding(faction, unitType);
        if (productionBuilding) {
            return this.queueUnitProduction(productionBuilding.id, unitType, faction);
        }
        return false;
    }
    
    findProductionBuilding(faction, unitType) {
        const unitData = this.unitTypes[unitType];
        if (!unitData) return null;
        
        return faction.buildings.find(building => {
            const buildingData = this.buildingTypes[building.type];
            return building.isComplete && 
                   buildingData.produces && 
                   buildingData.produces.includes(unitType);
        });
    }
    
    calculateNeededBuildings(faction, buildingType) {
        switch(buildingType) {
            case 'goldMine': return Math.min(3, Math.floor(faction.territories.length * 1.5));
            case 'lumberMill': return Math.min(2, faction.territories.length);
            case 'farm': return Math.floor(faction.units.length / 5);
            case 'tradingPost': return Math.min(2, faction.territories.length);
            default: return 1;
        }
    }
    
    aiExpandToTerritory(faction, territory) {
        // Send settlers to claim new territory
        const settlers = faction.units.filter(u => u.type === 'settler' && u.state === 'idle');
        if (settlers.length >= 2) {
            settlers.slice(0, 2).forEach(settler => {
                this.moveUnit(settler, territory.x + 16, territory.z + 16);
                settler.state = 'expanding';
                settler.target = territory;
            });
        }
    }
    
    aiFortifyTerritory(faction, territory) {
        // Build defensive structures
        const defensiveBuildings = ['watchtower', 'wall', 'barracks'];
        
        defensiveBuildings.forEach(buildingType => {
            if (Math.random() < 0.3 && this.canAfford(faction, this.buildingTypes[buildingType].cost)) {
                this.aiBuildStructureIntelligent(faction, buildingType);
            }
        });
    }
    
    aiAttackFaction(faction, targetFaction) {
        // Organize coordinated attack
        const militaryUnits = faction.units.filter(u => 
            u.type !== 'settler' && u.type !== 'scout' && u.state !== 'attacking'
        );
        
        if (militaryUnits.length >= 5 && targetFaction.territories.length > 0) {
            const target = targetFaction.territories[0];
            
            militaryUnits.forEach(unit => {
                this.moveUnit(unit, target.x + (Math.random() - 0.5) * 20, target.z + (Math.random() - 0.5) * 20);
                unit.state = 'attacking';
                unit.target = target;
            });
            
            console.log(`${faction.name} launches coordinated attack on ${targetFaction.name}!`);
        }
    }
    
    handleAIAlliances() {
        // Handle AI-to-AI relationships and potential alliances
        for (let i = 0; i < this.aiFactions.length; i++) {
            for (let j = i + 1; j < this.aiFactions.length; j++) {
                const faction1 = this.aiFactions[i];
                const faction2 = this.aiFactions[j];
                
                const relationship = this.calculateRelationship(faction1, faction2);
                if (relationship > 60 && Math.random() < 0.05) {
                    this.formAlliance(faction1, faction2);
                }
            }
        }
    }
    
    calculateRelationship(faction1, faction2) {
        let relationship = 50; // Neutral base
        
        // Similar personalities get along better
        const personalitySimilarity = this.calculatePersonalitySimilarity(faction1, faction2);
        relationship += personalitySimilarity * 20;
        
        // Common enemies improve relations
        const commonEnemies = this.findCommonThreats(faction1, faction2);
        relationship += commonEnemies.length * 10;
        
        // Competition for resources reduces relations
        const resourceCompetition = this.calculateResourceCompetition(faction1, faction2);
        relationship -= resourceCompetition * 15;
        
        return Math.max(0, Math.min(100, relationship));
    }
    
    calculatePersonalitySimilarity(faction1, faction2) {
        const p1 = faction1.aiPersonality;
        const p2 = faction2.aiPersonality;
        
        let similarity = 0;
        similarity += 1 - Math.abs(p1.aggression - p2.aggression);
        similarity += 1 - Math.abs(p1.economy - p2.economy);
        similarity += 1 - Math.abs(p1.defense - p2.defense);
        
        return similarity / 3; // Normalize to 0-1
    }
    
    findCommonThreats(faction1, faction2) {
        const threats1 = Array.from(faction1.aiStrategy.threat_assessment.keys());
        const threats2 = Array.from(faction2.aiStrategy.threat_assessment.keys());
        
        return threats1.filter(threat => threats2.includes(threat));
    }
    
    calculateResourceCompetition(faction1, faction2) {
        // Check if factions compete for the same territories
        if (faction1.territories.length === 0 || faction2.territories.length === 0) return 0;
        
        const distance = this.getDistance(faction1.territories[0], faction2.territories[0]);
        return Math.max(0, (100 - distance) / 100); // Higher competition when closer
    }
    
    formAlliance(faction1, faction2) {
        // Form temporary alliance
        console.log(`${faction1.name} and ${faction2.name} form an alliance!`);
        
        // Store alliance information
        if (!faction1.aiMemory.alliances) faction1.aiMemory.alliances = [];
        if (!faction2.aiMemory.alliances) faction2.aiMemory.alliances = [];
        
        faction1.aiMemory.alliances.push(faction2.id);
        faction2.aiMemory.alliances.push(faction1.id);
    }
    
    adjustAIDifficulty() {
        // Dynamic difficulty adjustment based on player performance
        const playerStrength = this.calculateFactionStrength(this.playerFaction);
        const avgAIStrength = this.aiFactions.reduce((sum, f) => sum + this.calculateFactionStrength(f), 0) / this.aiFactions.length;
        
        if (playerStrength > avgAIStrength * 1.5) {
            // Player is doing too well, make AI more aggressive
            this.aiFactions.forEach(faction => {
                faction.aiPersonality.aggression = Math.min(1.0, faction.aiPersonality.aggression + 0.1);
                faction.aiPersonality.military = Math.min(1.0, faction.aiPersonality.military + 0.1);
            });
        } else if (playerStrength < avgAIStrength * 0.5) {
            // Player is struggling, make AI less aggressive
            this.aiFactions.forEach(faction => {
                faction.aiPersonality.aggression = Math.max(0.2, faction.aiPersonality.aggression - 0.1);
                faction.aiPersonality.economy = Math.min(1.0, faction.aiPersonality.economy + 0.1);
            });
        }
    }
    
    startResourceGeneration() {
        // Generate resources for all factions
        setInterval(() => {
            // Player passive income
            this.playerFaction.resources.gold += 5;
            this.playerFaction.resources.lumber += 3;
            
            // AI passive income (scaled by difficulty)
            this.aiFactions.forEach(faction => {
                const difficultyMultiplier = 
                    faction.difficulty === 'easy' ? 0.5 :
                    faction.difficulty === 'medium' ? 1 :
                    faction.difficulty === 'hard' ? 1.5 : 2;
                
                faction.resources.gold += 5 * difficultyMultiplier;
                faction.resources.lumber += 3 * difficultyMultiplier;
            });
        }, 2000);
    }
    
    setupConquestUI() {
        // This would create the RTS UI overlay
        // For now, we'll use the existing HUD elements
        console.log('Conquest UI initialized');
    }
    
    update(deltaTime) {
        // Update all units
        [...this.playerFaction.units, ...this.aiFactions.flatMap(f => f.units)].forEach(unit => {
            this.updateUnit(unit, deltaTime);
        });
        
        // Update battles
        this.updateBattles(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Check victory conditions
        this.checkVictoryConditions();
    }
    
    updateUnit(unit, deltaTime) {
        const unitData = this.unitTypes[unit.type];
        
        if (unit.state === 'moving' || unit.state === 'attacking') {
            // Move towards target
            const dx = unit.targetX - unit.x;
            const dz = unit.targetZ - unit.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0.5) {
                const moveSpeed = unitData.speed * deltaTime;
                unit.x += (dx / distance) * moveSpeed;
                unit.z += (dz / distance) * moveSpeed;
                unit.y = this.game.getGroundHeight(unit.x, unit.z);
                
                // Update mesh position
                if (unit.mesh) {
                    unit.mesh.position.set(unit.x, unit.y + 0.5, unit.z);
                    unit.selectionRing.position.set(unit.x, unit.y + 0.1, unit.z);
                    
                    // Face direction of movement
                    unit.mesh.lookAt(unit.targetX, unit.y + 0.5, unit.targetZ);
                }
            } else if (unit.state === 'moving') {
                unit.state = 'idle';
            }
        }
        
        if (unit.state === 'attacking' && unit.target) {
            const distance = this.getDistance(unit, unit.target);
            
            if (distance <= unitData.range) {
                // In range, attack
                if (!unit.lastAttackTime || Date.now() - unit.lastAttackTime > 1000) {
                    this.performAttack(unit, unit.target);
                    unit.lastAttackTime = Date.now();
                }
            } else {
                // Move closer
                this.moveUnit(unit, unit.target.x, unit.target.z);
            }
        }
        
        // Update health bar
        if (unit.healthBar) {
            unit.healthBar.position.copy(unit.mesh.position);
            unit.healthBar.position.y += 1;
            unit.healthBar.scale.x = unit.health / unit.maxHealth;
            
            // Update color based on health
            const healthPercent = unit.health / unit.maxHealth;
            const color = healthPercent > 0.6 ? 0x00ff00 : 
                         healthPercent > 0.3 ? 0xffff00 : 0xff0000;
            unit.healthBar.material.color.setHex(color);
        }
    }
    
    performAttack(attacker, target) {
        const damage = attacker.damage;
        
        // Apply damage
        target.health -= damage;
        
        // Create visual effect
        this.createAttackEffect(attacker, target);
        
        // Check if target is destroyed
        if (target.health <= 0) {
            this.destroyEntity(target);
            attacker.target = null;
            attacker.state = 'idle';
            
            // Award experience
            attacker.experience += 10;
            if (attacker.experience >= attacker.level * 100) {
                this.levelUpUnit(attacker);
            }
        }
    }
    
    createAttackEffect(attacker, target) {
        // Create projectile or melee effect
        const unitData = this.unitTypes[attacker.type];
        
        if (unitData.range > 1) {
            // Ranged attack - create projectile
            const projectile = {
                x: attacker.x,
                y: attacker.y + 0.5,
                z: attacker.z,
                targetX: target.x,
                targetY: target.y + 0.5,
                targetZ: target.z,
                speed: 10,
                damage: attacker.damage,
                faction: attacker.faction,
                mesh: null
            };
            
            // Create projectile mesh
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 1
            });
            
            projectile.mesh = new THREE.Mesh(geometry, material);
            projectile.mesh.position.set(projectile.x, projectile.y, projectile.z);
            
            this.game.scene.add(projectile.mesh);
            this.projectiles.push(projectile);
        } else {
            // Melee attack - create flash effect
            const flash = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.5
                })
            );
            
            flash.position.set(target.x, target.y + 0.5, target.z);
            this.game.scene.add(flash);
            
            // Remove after animation
            setTimeout(() => {
                this.game.scene.remove(flash);
            }, 200);
        }
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move towards target
            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const dz = projectile.targetZ - projectile.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance > 0.5) {
                const moveSpeed = projectile.speed * deltaTime;
                projectile.x += (dx / distance) * moveSpeed;
                projectile.y += (dy / distance) * moveSpeed;
                projectile.z += (dz / distance) * moveSpeed;
                
                projectile.mesh.position.set(projectile.x, projectile.y, projectile.z);
            } else {
                // Hit target
                this.game.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    updateBattles(deltaTime) {
        // Handle ongoing battles
        // This would manage larger scale conflicts
    }
    
    destroyEntity(entity) {
        // Remove from scene
        if (entity.mesh) {
            this.game.scene.remove(entity.mesh);
        }
        if (entity.healthBar) {
            this.game.scene.remove(entity.healthBar);
        }
        if (entity.selectionRing) {
            this.game.scene.remove(entity.selectionRing);
        }
        
        // Remove from faction
        const faction = this.getFactionById(entity.faction);
        if (faction) {
            if (entity.health !== undefined) {
                // It's a unit
                const index = faction.units.indexOf(entity);
                if (index > -1) {
                    faction.units.splice(index, 1);
                    
                    // Update food count
                    const unitData = this.unitTypes[entity.type];
                    if (unitData.cost && unitData.cost.food) {
                        faction.resources.food -= unitData.cost.food;
                    }
                }
            } else {
                // It's a building
                const index = faction.buildings.indexOf(entity);
                if (index > -1) {
                    faction.buildings.splice(index, 1);
                }
            }
        }
    }
    
    levelUpUnit(unit) {
        unit.level++;
        unit.experience = 0;
        
        // Increase stats
        unit.maxHealth *= 1.1;
        unit.health = unit.maxHealth;
        unit.damage *= 1.1;
        unit.armor += 1;
        
        // Visual effect
        const levelUpEffect = new THREE.Mesh(
            new THREE.RingGeometry(0.5, 1, 16),
            new THREE.MeshBasicMaterial({
                color: 0xffd700,
                transparent: true,
                opacity: 0.8
            })
        );
        
        levelUpEffect.position.copy(unit.mesh.position);
        levelUpEffect.rotation.x = -Math.PI / 2;
        
        this.game.scene.add(levelUpEffect);
        
        // Animate and remove
        const startY = levelUpEffect.position.y;
        const animate = () => {
            levelUpEffect.position.y += 0.05;
            levelUpEffect.material.opacity -= 0.02;
            
            if (levelUpEffect.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.game.scene.remove(levelUpEffect);
            }
        };
        animate();
        
        this.game.showNotification(`Unit reached level ${unit.level}!`);
    }
    
    checkVictoryConditions() {
        // Check for conquest victory
        const playerTerritories = this.territories.filter(t => t.owner === 'player').length;
        const totalTerritories = this.territories.length;
        
        if (playerTerritories >= totalTerritories * 0.75) {
            this.victoryConditions.conquest = true;
            this.declareVictory('Conquest Victory! You control the frontier!');
        }
        
        // Check for elimination victory
        const remainingEnemies = this.aiFactions.filter(f => f.buildings.length > 0).length;
        if (remainingEnemies === 0) {
            this.victoryConditions.elimination = true;
            this.declareVictory('Elimination Victory! All enemies defeated!');
        }
        
        // Check for defeat
        if (this.playerFaction.buildings.length === 0) {
            this.declareDefeat('Defeat! Your empire has fallen!');
        }
    }
    
    declareVictory(message) {
        console.log('VICTORY!', message);
        this.game.showNotification(message, 10000);
        
        // Could trigger victory screen, stats, etc.
    }
    
    declareDefeat(message) {
        console.log('DEFEAT!', message);
        this.game.showNotification(message, 10000);
        
        // Could trigger defeat screen, restart option, etc.
    }
    
    // Player input handlers
    handleClick(x, z) {
        // Handle building placement, unit selection, commands, etc.
        if (this.buildMode) {
            this.placeBuilding(this.buildMode, x, z);
        } else {
            // Check for unit/building selection
            const clickedEntity = this.getEntityAt(x, z);
            
            if (clickedEntity) {
                if (clickedEntity.faction === 'player') {
                    this.selectEntity(clickedEntity);
                } else {
                    // Attack enemy
                    if (this.selectedUnits.length > 0) {
                        this.selectedUnits.forEach(unit => {
                            this.attackTarget(unit, clickedEntity);
                        });
                    }
                }
            } else {
                // Move selected units
                if (this.selectedUnits.length > 0) {
                    this.selectedUnits.forEach(unit => {
                        this.moveUnit(unit, x, z);
                    });
                }
            }
        }
    }
    
    selectEntity(entity) {
        // Clear previous selection
        this.selectedUnits.forEach(unit => {
            if (unit.selectionRing) {
                unit.selectionRing.material.opacity = 0;
            }
        });
        
        this.selectedUnits = [];
        this.selectedBuilding = null;
        
        if (entity.health !== undefined) {
            // It's a unit
            this.selectedUnits = [entity];
            if (entity.selectionRing) {
                entity.selectionRing.material.opacity = 0.5;
            }
        } else {
            // It's a building
            this.selectedBuilding = entity;
        }
    }
    
    getEntityAt(x, z) {
        // Find entity at position
        // This would use raycasting in the actual implementation
        const threshold = 2;
        
        // Check units
        for (const unit of this.playerFaction.units) {
            if (Math.abs(unit.x - x) < threshold && Math.abs(unit.z - z) < threshold) {
                return unit;
            }
        }
        
        // Check buildings
        for (const building of this.playerFaction.buildings) {
            const buildingData = this.buildingTypes[building.type];
            const halfWidth = buildingData.size.width / 2;
            const halfHeight = buildingData.size.height / 2;
            
            if (Math.abs(building.x - x) < halfWidth && Math.abs(building.z - z) < halfHeight) {
                return building;
            }
        }
        
        return null;
    }
    
    placeBuilding(type, x, z) {
        const buildingData = this.buildingTypes[type];
        
        if (this.canAfford(this.playerFaction, buildingData.cost)) {
            this.deductResources(this.playerFaction, buildingData.cost);
            const building = this.createBuilding(type, x, z, this.playerFaction);
            
            // Calculate and apply placement bonuses
            this.applyPlacementBonuses(building);
            
            this.buildMode = null;
            this.game.showNotification(`Building ${buildingData.name}`);
        } else {
            this.game.showNotification('Not enough resources!');
        }
    }
    
    // === ADVANCED ECONOMIC SYSTEMS ===
    
    applyPlacementBonuses(building) {
        const buildingData = this.buildingTypes[building.type];
        const faction = this.getFactionById(building.faction);
        
        // Initialize building efficiency tracking
        if (!this.buildingEfficiency.has(building.id)) {
            this.buildingEfficiency.set(building.id, {
                baseProduction: { ...buildingData.generates },
                bonuses: {},
                totalMultiplier: 1.0
            });
        }
        
        const efficiency = this.buildingEfficiency.get(building.id);
        
        // Apply terrain bonuses
        this.applyTerrainBonuses(building, efficiency);
        
        // Apply adjacency bonuses
        this.applyAdjacencyBonuses(building, efficiency);
        
        // Apply area effect bonuses
        this.applyAreaBonuses(building, efficiency);
        
        // Update resource generation
        this.updateBuildingProduction(building);
    }
    
    applyTerrainBonuses(building, efficiency) {
        const buildingData = this.buildingTypes[building.type];
        const terrain = this.getTerrainType(building.x, building.z);
        
        // Forest bonus for lumber mills
        if (buildingData.bonusNearForest && terrain === 'forest') {
            efficiency.bonuses.terrain = buildingData.bonusNearForest;
            efficiency.totalMultiplier += 0.5; // 50% bonus
        }
        
        // Plains bonus for farms
        if (buildingData.bonusOnPlains && terrain === 'plains') {
            efficiency.bonuses.terrain = buildingData.bonusOnPlains;
            efficiency.totalMultiplier += 0.3; // 30% bonus
        }
        
        // Oil field bonus for derricks
        if (buildingData.bonusOnOilField && terrain === 'oilField') {
            efficiency.bonuses.terrain = buildingData.bonusOnOilField;
            efficiency.totalMultiplier += 1.0; // 100% bonus (double production)
        }
        
        // Water bonus for farms and trade
        if (this.isNearWater(building.x, building.z)) {
            if (buildingData.nearWaterBonus) {
                efficiency.bonuses.water = buildingData.nearWaterBonus;
                efficiency.totalMultiplier += 0.2; // 20% bonus
            }
        }
    }
    
    applyAdjacencyBonuses(building, efficiency) {
        const buildingData = this.buildingTypes[building.type];
        const faction = this.getFactionById(building.faction);
        
        if (buildingData.adjacencyBonus) {
            faction.buildings.forEach(otherBuilding => {
                if (otherBuilding.id === building.id) return;
                
                const distance = this.getDistance(building, otherBuilding);
                if (distance <= 8) { // Within adjacency range
                    const bonusKey = otherBuilding.type;
                    if (buildingData.adjacencyBonus[bonusKey]) {
                        const bonus = buildingData.adjacencyBonus[bonusKey];
                        efficiency.bonuses[`adjacent_${otherBuilding.id}`] = bonus;
                        efficiency.totalMultiplier += 0.15; // 15% per adjacent building
                    }
                }
            });
        }
    }
    
    applyAreaBonuses(building, efficiency) {
        const buildingData = this.buildingTypes[building.type];
        const faction = this.getFactionById(building.faction);
        
        // Town center bonus - affects all buildings in range
        const townCenters = faction.buildings.filter(b => 
            ['townHall', 'townCenter', 'fortress'].includes(b.type)
        );
        
        townCenters.forEach(tc => {
            const distance = this.getDistance(building, tc);
            if (distance <= 15) { // Within town center influence
                if (buildingData.townCenterBonus) {
                    efficiency.bonuses.townCenter = buildingData.townCenterBonus;
                    efficiency.totalMultiplier += 0.1; // 10% bonus
                }
            }
        });
        
        // Marketplace global trade bonus
        const marketplaces = faction.buildings.filter(b => b.type === 'marketplace');
        if (marketplaces.length > 0) {
            efficiency.bonuses.trade = { allResources: 0.05 };
            efficiency.totalMultiplier += 0.05; // 5% global bonus
        }
    }
    
    updateBuildingProduction(building) {
        const buildingData = this.buildingTypes[building.type];
        const efficiency = this.buildingEfficiency.get(building.id);
        
        if (buildingData.generates) {
            // Clear existing generation and restart with bonuses
            const newGeneration = {};
            
            Object.keys(buildingData.generates).forEach(resource => {
                const baseAmount = buildingData.generates[resource];
                const bonusAmount = efficiency.bonuses.terrain?.[resource] || 0;
                const totalAmount = Math.floor((baseAmount + bonusAmount) * efficiency.totalMultiplier);
                newGeneration[resource] = totalAmount;
            });
            
            // Update the building's actual generation
            building.actualGeneration = newGeneration;
        }
    }
    
    getTerrainType(x, z) {
        // Simple terrain detection based on noise patterns
        const noise = this.game.noise.noise2D(x * 0.01, z * 0.01);
        
        if (noise > 0.3) return 'forest';
        if (noise > 0.1) return 'plains';
        if (noise < -0.3) return 'water';
        if (noise < -0.1) return 'oilField';
        return 'hills';
    }
    
    isNearWater(x, z) {
        // Check surrounding area for water
        for (let dx = -5; dx <= 5; dx += 2) {
            for (let dz = -5; dz <= 5; dz += 2) {
                if (this.getTerrainType(x + dx, z + dz) === 'water') {
                    return true;
                }
            }
        }
        return false;
    }
    
    // === ADVANCED RESOURCE MANAGEMENT ===
    
    getResourceStorageLimit(faction, resource) {
        let baseLimit = 2000; // Base storage capacity
        
        // Granary increases food storage
        if (resource === 'food' || resource === 'foodMax') {
            const granaries = faction.buildings.filter(b => b.type === 'granary');
            granaries.forEach(granary => {
                if (granary.isComplete) {
                    baseLimit += this.buildingTypes.granary.provides.foodStorage || 100;
                }
            });
        }
        
        // Banks increase gold storage
        if (resource === 'gold') {
            const banks = faction.buildings.filter(b => b.type === 'bank');
            baseLimit += banks.length * 1000; // +1000 per bank
        }
        
        // Warehouses (if implemented) would increase general storage
        const warehouses = faction.buildings.filter(b => b.type === 'warehouse');
        baseLimit += warehouses.length * 500; // +500 per warehouse
        
        return baseLimit;
    }
    
    updateResourceEfficiency(building) {
        // Dynamic efficiency updates based on game conditions
        const efficiency = this.buildingEfficiency.get(building.id);
        if (!efficiency) return;
        
        const faction = this.getFactionById(building.faction);
        
        // Happiness/morale effects
        const happinessModifier = this.calculateFactionHappiness(faction);
        efficiency.totalMultiplier = Math.max(0.1, efficiency.totalMultiplier * happinessModifier);
        
        // Population pressure effects
        if (faction.resources.population >= faction.resources.populationMax * 0.9) {
            efficiency.totalMultiplier *= 0.8; // 20% penalty for overcrowding
        }
        
        // Technology bonuses (when tech system is implemented)
        if (faction.techs.has('improvedLumber') && building.type === 'lumberMill') {
            efficiency.totalMultiplier *= 1.25; // 25% tech bonus
        }
        
        if (faction.techs.has('advancedMining') && building.type === 'goldMine') {
            efficiency.totalMultiplier *= 1.3; // 30% tech bonus
        }
        
        // Update actual generation based on new efficiency
        this.updateBuildingProduction(building);
    }
    
    calculateFactionHappiness(faction) {
        let happiness = 1.0; // Base happiness
        
        // Food shortage penalty
        const foodRatio = faction.resources.food / faction.resources.foodMax;
        if (foodRatio < 0.3) {
            happiness *= 0.6; // Major penalty for food shortage
        } else if (foodRatio < 0.7) {
            happiness *= 0.8; // Minor penalty for low food
        }
        
        // Church/morale buildings bonus
        const churches = faction.buildings.filter(b => b.type === 'church' && b.isComplete);
        happiness += churches.length * 0.1; // +10% per church
        
        // Defensive security bonus
        const defenses = faction.buildings.filter(b => 
            ['watchtower', 'guardTower', 'cannonTower', 'wall'].includes(b.type) && b.isComplete
        );
        if (defenses.length >= 5) {
            happiness += 0.15; // Security bonus
        }
        
        return Math.min(1.5, Math.max(0.3, happiness)); // Cap between 30% and 150%
    }
    
    // === TRADE ROUTE SYSTEM ===
    
    initializeTradeRoutes() {
        this.tradeRoutes = [];
        this.tradeCaravans = [];
        
        // Create initial trade routes between trading posts
        this.updateTradeNetwork();
        
        // Start trade caravan spawning
        this.startTradeCaravanSystem();
    }
    
    updateTradeNetwork() {
        const allTradingPosts = [
            ...this.playerFaction.buildings.filter(b => b.type === 'tradingPost' && b.isComplete),
            ...this.aiFactions.flatMap(f => f.buildings.filter(b => b.type === 'tradingPost' && b.isComplete))
        ];
        
        // Create trade routes between trading posts
        for (let i = 0; i < allTradingPosts.length; i++) {
            for (let j = i + 1; j < allTradingPosts.length; j++) {
                const post1 = allTradingPosts[i];
                const post2 = allTradingPosts[j];
                
                // Don't create routes between hostile factions
                const faction1 = this.getFactionById(post1.faction);
                const faction2 = this.getFactionById(post2.faction);
                if (this.areFactionsHostile(faction1, faction2)) continue;
                
                const distance = this.getDistance(post1, post2);
                if (distance < 100) { // Only short-range trade routes
                    const route = {
                        id: `route_${post1.id}_${post2.id}`,
                        start: post1,
                        end: post2,
                        distance,
                        active: true,
                        profitability: this.calculateRouteProfitability(post1, post2)
                    };
                    
                    this.tradeRoutes.push(route);
                }
            }
        }
    }
    
    calculateRouteProfitability(post1, post2) {
        const faction1 = this.getFactionById(post1.faction);
        const faction2 = this.getFactionById(post2.faction);
        
        // Calculate resource differences for profitable trade
        let profitScore = 0;
        
        // More gold difference = more profitable
        const goldDiff = Math.abs(faction1.resources.gold - faction2.resources.gold);
        profitScore += goldDiff * 0.001;
        
        // Distance penalty
        const distance = this.getDistance(post1, post2);
        profitScore -= distance * 0.1;
        
        return Math.max(0, profitScore);
    }
    
    startTradeCaravanSystem() {
        setInterval(() => {
            this.spawnTradeCaravans();
            this.updateTradeCaravans();
        }, 10000); // Check every 10 seconds
    }
    
    spawnTradeCaravans() {
        this.tradeRoutes.forEach(route => {
            if (Math.random() < 0.3 && route.profitability > 0) {
                const caravan = {
                    id: `caravan_${Date.now()}_${Math.random()}`,
                    route,
                    position: { x: route.start.x, z: route.start.z },
                    progress: 0,
                    goods: this.generateTradeGoods(route),
                    speed: 2,
                    visual: null
                };
                
                this.createCaravanVisual(caravan);
                this.tradeCaravans.push(caravan);
            }
        });
    }
    
    updateTradeCaravans() {
        this.tradeCaravans = this.tradeCaravans.filter(caravan => {
            caravan.progress += caravan.speed / caravan.route.distance;
            
            // Update position
            const t = caravan.progress;
            caravan.position.x = caravan.route.start.x + t * (caravan.route.end.x - caravan.route.start.x);
            caravan.position.z = caravan.route.start.z + t * (caravan.route.end.z - caravan.route.start.z);
            
            // Update visual
            if (caravan.visual) {
                caravan.visual.position.set(
                    caravan.position.x,
                    this.game.getGroundHeight(caravan.position.x, caravan.position.z) + 1,
                    caravan.position.z
                );
            }
            
            // Check if arrived
            if (caravan.progress >= 1) {
                this.processTradeArrival(caravan);
                if (caravan.visual) {
                    this.game.scene.remove(caravan.visual);
                }
                return false; // Remove caravan
            }
            
            return true; // Keep caravan
        });
    }
    
    generateTradeGoods(route) {
        const startFaction = this.getFactionById(route.start.faction);
        const endFaction = this.getFactionById(route.end.faction);
        
        // Generate goods based on resource surpluses/needs
        const goods = {};
        
        if (startFaction.resources.gold > 1500) goods.gold = 50 + Math.random() * 100;
        if (startFaction.resources.lumber > 1200) goods.lumber = 30 + Math.random() * 70;
        if (startFaction.resources.oil > 800) goods.oil = 20 + Math.random() * 40;
        
        return goods;
    }
    
    processTradeArrival(caravan) {
        const endFaction = this.getFactionById(caravan.route.end.faction);
        
        // Transfer goods and generate profit
        Object.keys(caravan.goods).forEach(resource => {
            const amount = caravan.goods[resource];
            endFaction.resources[resource] += amount;
            
            // Generate gold profit for trading post
            const tradingPost = caravan.route.end;
            const profit = Math.floor(amount * 0.1); // 10% profit
            endFaction.resources.gold += profit;
        });
        
        // Show notification for player trades
        if (endFaction.id === 'player') {
            this.game.showNotification('Trade caravan arrived! +Gold from trade');
        }
    }
    
    createCaravanVisual(caravan) {
        const geometry = new THREE.BoxGeometry(2, 1, 3);
        const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        caravan.visual = new THREE.Mesh(geometry, material);
        caravan.visual.position.set(
            caravan.position.x,
            this.game.getGroundHeight(caravan.position.x, caravan.position.z) + 1,
            caravan.position.z
        );
        caravan.visual.castShadow = true;
        
        this.game.scene.add(caravan.visual);
    }
    
    areFactionsHostile(faction1, faction2) {
        // Simple hostility check - could be expanded with diplomacy system
        if (faction1.id === 'player' || faction2.id === 'player') {
            // Player is friendly with all initially
            return false;
        }
        
        // AI factions might be hostile based on aggression
        return (faction1.aggression + faction2.aggression) > 1.4;
    }
    
    // === RESOURCE NODE SYSTEM ===
    
    initializeResourceNodes() {
        // Generate natural resource locations
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 1000;
            const z = (Math.random() - 0.5) * 1000;
            const type = Math.random() < 0.5 ? 'gold' : Math.random() < 0.7 ? 'lumber' : 'oil';
            
            this.resourceNodes.push({
                id: `resource_${i}`,
                type,
                x, z,
                richness: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
                remaining: 1000 + Math.random() * 2000,
                visual: null
            });
        }
        
        // Create visual representations
        this.resourceNodes.forEach(node => {
            this.createResourceNodeVisual(node);
        });
    }
    
    createResourceNodeVisual(node) {
        let geometry, material;
        
        switch (node.type) {
            case 'gold':
                geometry = new THREE.ConeGeometry(2, 3, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
                break;
            case 'lumber':
                geometry = new THREE.CylinderGeometry(0.5, 1, 4, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                break;
            case 'oil':
                geometry = new THREE.CylinderGeometry(1, 1, 2, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
                break;
        }
        
        node.visual = new THREE.Mesh(geometry, material);
        node.visual.position.set(node.x, this.game.getGroundHeight(node.x, node.z), node.z);
        this.game.scene.add(node.visual);
    }
    
    // === UNIT PRODUCTION & ARMY MANAGEMENT SYSTEM ===
    
    initializeProductionSystem() {
        // Initialize production queues for each faction
        [this.playerFaction, ...this.aiFactions].forEach(faction => {
            faction.productionQueues = new Map(); // Building ID -> Queue
            faction.armyCommanders = []; // Army group leaders
            faction.battleGroups = []; // Organized military formations
            faction.rallyPoints = []; // Where units gather after production
        });
        
        // Start production processing
        setInterval(() => {
            this.processProductionQueues();
        }, 1000); // Process every second
    }
    
    initializeEconomicZones() {
        // Create some strategic economic zones
        const zones = [
            { x: 50, z: 50, radius: 20, type: 'trade' },
            { x: 150, z: 150, radius: 25, type: 'industrial' },
            { x: 300, z: 100, radius: 30, type: 'agricultural' },
            { x: 100, z: 300, radius: 22, type: 'military' }
        ];
        
        zones.forEach(zone => {
            this.createEconomicZone(zone.x, zone.z, zone.radius, zone.type);
        });
    }
    
    queueUnitProduction(buildingId, unitType, faction) {
        const building = faction.buildings.find(b => b.id === buildingId);
        if (!building || !building.isComplete) return false;
        
        const buildingData = this.buildingTypes[building.type];
        const unitData = this.unitTypes[unitType];
        
        // Check if building can produce this unit
        if (!buildingData.produces || !buildingData.produces.includes(unitType)) {
            return false;
        }
        
        // Check resources
        if (!this.canAfford(faction, unitData.cost)) {
            return false;
        }
        
        // Check population limit
        if (faction.resources.population >= faction.resources.populationMax) {
            if (faction.id === 'player') {
                this.game.showNotification('Population limit reached!');
            }
            return false;
        }
        
        // Deduct resources and queue production
        this.deductResources(faction, unitData.cost);
        
        if (!faction.productionQueues.has(buildingId)) {
            faction.productionQueues.set(buildingId, []);
        }
        
        const queue = faction.productionQueues.get(buildingId);
        const productionItem = {
            id: `production_${Date.now()}_${Math.random()}`,
            unitType,
            startTime: Date.now(),
            completionTime: Date.now() + (unitData.buildTime * 1000),
            progress: 0,
            buildingId,
            faction: faction.id
        };
        
        queue.push(productionItem);
        
        if (faction.id === 'player') {
            this.game.showNotification(`Queued ${unitData.name} for production`);
        }
        
        return true;
    }
    
    processProductionQueues() {
        [this.playerFaction, ...this.aiFactions].forEach(faction => {
            faction.productionQueues.forEach((queue, buildingId) => {
                if (queue.length === 0) return;
                
                const item = queue[0]; // Process first item in queue
                const currentTime = Date.now();
                
                // Update progress
                const elapsed = currentTime - item.startTime;
                const totalTime = item.completionTime - item.startTime;
                item.progress = Math.min(elapsed / totalTime, 1);
                
                // Check if completed
                if (currentTime >= item.completionTime) {
                    // Remove from queue
                    queue.shift();
                    
                    // Spawn the unit
                    this.completeUnitProduction(item, faction);
                }
            });
        });
    }
    
    completeUnitProduction(productionItem, faction) {
        const building = faction.buildings.find(b => b.id === productionItem.buildingId);
        if (!building) return;
        
        // Determine spawn location
        const spawnX = building.x + (Math.random() - 0.5) * 8;
        const spawnZ = building.z + (Math.random() - 0.5) * 8;
        
        // Create the unit
        const unit = this.createUnit(productionItem.unitType, spawnX, spawnZ, faction);
        
        // Auto-assign to appropriate army group
        this.assignUnitToArmy(unit, faction);
        
        // Increase population
        faction.resources.population += 1;
        
        if (faction.id === 'player') {
            const unitData = this.unitTypes[productionItem.unitType];
            this.game.showNotification(`${unitData.name} production complete!`);
        }
        
        console.log(`${faction.name} completed ${productionItem.unitType}`);
    }
    
    assignUnitToArmy(unit, faction) {
        const unitData = this.unitTypes[unit.type];
        
        // Find appropriate army group or create new one
        let targetArmy = null;
        
        if (unitData.type === 'civilian') {
            // Civilians don't join armies
            unit.armyGroup = null;
            return;
        }
        
        // Look for existing army with space
        targetArmy = faction.battleGroups.find(army => 
            army.units.length < army.maxSize && 
            army.type === this.getArmyTypeForUnit(unit.type)
        );
        
        // Create new army if none available
        if (!targetArmy) {
            targetArmy = this.createBattleGroup(faction, this.getArmyTypeForUnit(unit.type));
        }
        
        // Add unit to army
        targetArmy.units.push(unit);
        unit.armyGroup = targetArmy.id;
        
        // Set formation position
        this.setFormationPosition(unit, targetArmy);
    }
    
    createBattleGroup(faction, type) {
        const army = {
            id: `army_${faction.id}_${Date.now()}`,
            faction: faction.id,
            type, // 'infantry', 'cavalry', 'artillery', 'mixed'
            units: [],
            maxSize: 12,
            formation: 'line', // 'line', 'column', 'wedge', 'square'
            morale: 100,
            experience: 0,
            commander: null,
            rallyPoint: null,
            currentOrder: 'idle', // 'idle', 'move', 'attack', 'defend', 'retreat'
            target: null
        };
        
        faction.battleGroups.push(army);
        return army;
    }
    
    getArmyTypeForUnit(unitType) {
        const unitData = this.unitTypes[unitType];
        
        if (['cavalry', 'mountedRanger'].includes(unitType)) return 'cavalry';
        if (['cannon', 'steamTank'].includes(unitType)) return 'artillery';
        if (['militia', 'rifleman', 'ranger'].includes(unitType)) return 'infantry';
        
        return 'mixed';
    }
    
    setFormationPosition(unit, army) {
        const formationIndex = army.units.length - 1;
        const spacing = 2;
        
        switch (army.formation) {
            case 'line':
                unit.formationOffset = {
                    x: (formationIndex % 4) * spacing - 3,
                    z: Math.floor(formationIndex / 4) * spacing
                };
                break;
            case 'column':
                unit.formationOffset = {
                    x: (formationIndex % 2) * spacing - 0.5,
                    z: Math.floor(formationIndex / 2) * spacing
                };
                break;
            case 'wedge':
                const row = Math.floor(Math.sqrt(formationIndex));
                const col = formationIndex - row * row;
                unit.formationOffset = {
                    x: (col - row/2) * spacing,
                    z: row * spacing
                };
                break;
            default:
                unit.formationOffset = { x: 0, z: 0 };
        }
    }
    
    issueArmyCommand(armyId, command, target = null) {
        const army = [...this.playerFaction.battleGroups, ...this.aiFactions.flatMap(f => f.battleGroups)]
            .find(a => a.id === armyId);
        
        if (!army) return;
        
        army.currentOrder = command;
        army.target = target;
        
        // Update all units in the army
        army.units.forEach(unit => {
            switch (command) {
                case 'move':
                    if (target) {
                        this.moveUnit(unit, 
                            target.x + unit.formationOffset.x,
                            target.z + unit.formationOffset.z
                        );
                        unit.state = 'moving';
                    }
                    break;
                case 'attack':
                    if (target) {
                        unit.state = 'attacking';
                        unit.target = target;
                    }
                    break;
                case 'defend':
                    unit.state = 'defending';
                    break;
                case 'retreat':
                    // Move back to rally point
                    const rallyPoint = army.rallyPoint || { x: 0, z: 0 };
                    this.moveUnit(unit, rallyPoint.x, rallyPoint.z);
                    unit.state = 'retreating';
                    break;
            }
        });
    }
    
    getProductionQueue(buildingId, faction) {
        return faction.productionQueues.get(buildingId) || [];
    }
    
    cancelProduction(buildingId, productionId, faction) {
        const queue = faction.productionQueues.get(buildingId);
        if (!queue) return false;
        
        const index = queue.findIndex(item => item.id === productionId);
        if (index === -1) return false;
        
        const item = queue[index];
        
        // Refund partial resources if not the first item
        if (index > 0) {
            const unitData = this.unitTypes[item.unitType];
            const refundPercent = 0.75; // 75% refund for queued items
            
            if (unitData.cost.gold) {
                faction.resources.gold += Math.floor(unitData.cost.gold * refundPercent);
            }
            if (unitData.cost.lumber) {
                faction.resources.lumber += Math.floor(unitData.cost.lumber * refundPercent);
            }
            if (unitData.cost.oil) {
                faction.resources.oil += Math.floor(unitData.cost.oil * refundPercent);
            }
        }
        
        // Remove from queue
        queue.splice(index, 1);
        
        if (faction.id === 'player') {
            this.game.showNotification('Production cancelled');
        }
        
        return true;
    }
    
    // === ECONOMIC ZONES SYSTEM ===
    
    createEconomicZone(centerX, centerZ, radius, type) {
        const zone = {
            id: `zone_${this.economicZones.length}`,
            x: centerX,
            z: centerZ,
            radius,
            type, // 'trade', 'industrial', 'agricultural', 'military'
            bonuses: this.getZoneBonuses(type),
            buildings: []
        };
        
        this.economicZones.push(zone);
        this.createEconomicZoneVisual(zone);
        
        return zone;
    }
    
    getZoneBonuses(type) {
        switch (type) {
            case 'trade':
                return { gold: 0.25, tradeEfficiency: 0.3 };
            case 'industrial':
                return { production: 0.2, buildSpeed: 0.15 };
            case 'agricultural':
                return { food: 0.3, growth: 0.2 };
            case 'military':
                return { training: 0.25, unitCost: -0.1 };
            default:
                return {};
        }
    }
    
    createEconomicZoneVisual(zone) {
        const geometry = new THREE.RingGeometry(zone.radius - 2, zone.radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: this.getZoneColor(zone.type),
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        zone.visual = new THREE.Mesh(geometry, material);
        zone.visual.rotation.x = -Math.PI / 2;
        zone.visual.position.set(zone.x, this.game.getGroundHeight(zone.x, zone.z) + 0.1, zone.z);
        this.game.scene.add(zone.visual);
    }
    
    getZoneColor(type) {
        switch (type) {
            case 'trade': return 0xFFD700;
            case 'industrial': return 0x8B4513;
            case 'agricultural': return 0x90EE90;
            case 'military': return 0xFF4500;
            default: return 0xFFFFFF;
        }
    }
    
    // === CONQUEST & TERRITORY CONTROL SYSTEM ===
    
    claimTerritory(territory, faction) {
        if (territory.owner) {
            // Territory is already owned, must be conquered
            if (!this.canConquerTerritory(territory, faction)) {
                return false;
            }
            
            // Remove from previous owner
            const previousOwner = this.getFactionById(territory.owner);
            if (previousOwner) {
                const index = previousOwner.territories.indexOf(territory);
                if (index > -1) {
                    previousOwner.territories.splice(index, 1);
                }
            }
        }
        
        // Assign to new owner
        territory.owner = faction.id;
        faction.territories.push(territory);
        
        // Apply territory benefits
        this.applyTerritoryBenefits(territory, faction);
        
        // Update territory control visuals
        this.updateTerritoryVisual(territory, faction);
        
        // Check victory conditions
        this.checkConquestVictory();
        
        if (faction.id === 'player') {
            this.game.showNotification(`Territory conquered! Resources: ${territory.resourceValue}`);
        }
        
        return true;
    }
    
    canConquerTerritory(territory, faction) {
        // Must have military presence in the territory
        const militaryUnits = faction.units.filter(unit => {
            const distance = this.getDistance(unit, territory);
            return distance < territory.width && unit.type !== 'settler';
        });
        
        // Need at least 3 military units to conquer
        if (militaryUnits.length < 3) {
            return false;
        }
        
        // Check if any enemy military units are defending
        const defenders = this.findDefendersInTerritory(territory, faction);
        
        // Can conquer if no defenders or overwhelm them
        return defenders.length === 0 || militaryUnits.length >= defenders.length * 1.5;
    }
    
    findDefendersInTerritory(territory, attackingFaction) {
        const allEnemyUnits = [
            ...this.playerFaction.units.filter(u => this.playerFaction.id !== attackingFaction.id),
            ...this.aiFactions.flatMap(f => f.id !== attackingFaction.id ? f.units : [])
        ];
        
        return allEnemyUnits.filter(unit => {
            const distance = this.getDistance(unit, territory);
            return distance < territory.width && unit.type !== 'settler';
        });
    }
    
    checkConquestVictory() {
        // Check if any faction has won by conquest
        [this.playerFaction, ...this.aiFactions].forEach(faction => {
            const territoryCount = faction.territories.length;
            const totalTerritories = this.territories.length;
            
            // Victory conditions
            const conquestVictory = territoryCount >= totalTerritories * 0.75; // 75% of map
            const eliminationVictory = this.checkEliminationVictory(faction);
            
            if (conquestVictory || eliminationVictory) {
                this.declareVictory(faction, conquestVictory ? 'conquest' : 'elimination');
            }
        });
    }
    
    checkEliminationVictory(faction) {
        // Check if all other factions are eliminated
        const otherFactions = [this.playerFaction, ...this.aiFactions].filter(f => f.id !== faction.id);
        
        return otherFactions.every(f => {
            // Faction is eliminated if no territories and no town halls
            const hasTownHall = f.buildings.some(b => 
                ['townHall', 'townCenter', 'fortress'].includes(b.type) && b.isComplete
            );
            return f.territories.length === 0 && !hasTownHall;
        });
    }
    
    declareVictory(faction, victoryType) {
        console.log(`🏆 VICTORY! ${faction.name} wins by ${victoryType}!`);
        
        if (faction.id === 'player') {
            this.game.showNotification(`🏆 VICTORY! You win by ${victoryType}!`);
        } else {
            this.game.showNotification(`💀 DEFEAT! ${faction.name} wins by ${victoryType}!`);
        }
        
        // Stop all AI and game systems
        this.gameEnded = true;
    }
    
    // === TECHNOLOGY TREE & UPGRADES SYSTEM ===
    
    getTechnologyTree() {
        return {
            // Economic Technologies
            improvedLumber: {
                name: 'Improved Lumber',
                cost: { gold: 200, lumber: 100 },
                researchTime: 30000,
                requirements: ['lumberMill'],
                effects: { lumberGeneration: 1.25 },
                description: 'Lumber production +25%'
            },
            advancedMining: {
                name: 'Advanced Mining',
                cost: { gold: 300, lumber: 150 },
                researchTime: 45000,
                requirements: ['goldMine', 'blacksmith'],
                effects: { goldGeneration: 1.3 },
                description: 'Gold production +30%'
            },
            tradeRoutes: {
                name: 'Trade Routes',
                cost: { gold: 400, lumber: 200 },
                researchTime: 60000,
                requirements: ['tradingPost'],
                effects: { tradeEfficiency: 1.5 },
                description: 'Trade profits +50%'
            },
            
            // Military Technologies
            ironWeapons: {
                name: 'Iron Weapons',
                cost: { gold: 250, lumber: 100, oil: 50 },
                researchTime: 40000,
                requirements: ['blacksmith'],
                effects: { unitDamage: 1.2 },
                description: 'Unit damage +20%'
            },
            steelArmor: {
                name: 'Steel Armor',
                cost: { gold: 300, lumber: 150, oil: 75 },
                researchTime: 50000,
                requirements: ['ironWeapons'],
                effects: { unitArmor: 1.25 },
                description: 'Unit armor +25%'
            },
            gunpowder: {
                name: 'Gunpowder',
                cost: { gold: 500, lumber: 200, oil: 200 },
                researchTime: 90000,
                requirements: ['steelArmor', 'workshop'],
                effects: { artilleryDamage: 1.5 },
                description: 'Artillery damage +50%'
            },
            veteranTraining: {
                name: 'Veteran Training',
                cost: { gold: 400, lumber: 200 },
                researchTime: 60000,
                requirements: ['barracks'],
                effects: { unitHealth: 1.2 },
                description: 'Unit health +20%'
            }
        };
    }
    
    initializeTechnologyTree() {
        // Initialize technology trees for each faction
        [this.playerFaction, ...this.aiFactions].forEach(faction => {
            faction.technologies = new Map();
            faction.availableResearch = new Set();
            faction.researchQueue = [];
        });
        
        console.log('Technology Tree initialized for all factions');
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConquestSystem;
}