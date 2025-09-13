/**
 * Blaze Worlds: Hero-Centric Unit Management System
 * Warcraft III-inspired strategic gameplay with Texas heroes
 *
 * Features:
 * - Hero units with RPG progression (levels 1-10)
 * - Experience points, skill trees, and unique abilities
 * - Unit formations and tactical commands
 * - Upkeep system encouraging strategic army composition
 * - Texas-themed heroes: Rangers, Oil Barons, Cattle Barons, etc.
 */

class HeroUnitSystem {
    constructor(scene, gameWorld, camera) {
        this.scene = scene;
        this.gameWorld = gameWorld;
        this.camera = camera;

        // Championship RTS configuration
        this.config = {
            maxLevel: 10,
            experienceMultiplier: 1.5,
            upkeepThresholds: [20, 50, 80, 120], // Army size thresholds
            upkeepPenalties: [0, 0.1, 0.25, 0.4], // Resource penalties
            heroRespawnTime: 60, // seconds
            maxHeroesPerPlayer: 3
        };

        // Texas hero classes
        this.heroClasses = {
            TEXAS_RANGER: {
                name: 'Texas Ranger',
                description: 'Legendary lawman with unmatched tracking and combat skills',
                primaryAttribute: 'agility',
                baseStats: { strength: 18, agility: 22, intelligence: 16 },
                startingHP: 550,
                startingMana: 200,
                abilities: ['tracker_shot', 'law_and_order', 'frontier_justice', 'texas_justice']
            },
            OIL_BARON: {
                name: 'Oil Baron',
                description: 'Wealthy industrialist who controls the black gold of Texas',
                primaryAttribute: 'intelligence',
                baseStats: { strength: 14, agility: 16, intelligence: 24 },
                startingHP: 450,
                startingMana: 350,
                abilities: ['oil_strike', 'industrial_might', 'black_gold_rush', 'texas_fortune']
            },
            CATTLE_BARON: {
                name: 'Cattle Baron',
                description: 'Master of the range who commands vast herds and cowboys',
                primaryAttribute: 'strength',
                baseStats: { strength: 24, agility: 18, intelligence: 14 },
                startingHP: 625,
                startingMana: 150,
                abilities: ['stampede', 'lasso_strike', 'cowboy_rally', 'longhorn_charge']
            },
            BLUEBONNET_SHAMAN: {
                name: 'Bluebonnet Shaman',
                description: 'Mystic guardian of Texas wildlands and native wisdom',
                primaryAttribute: 'intelligence',
                baseStats: { strength: 16, agility: 20, intelligence: 22 },
                startingHP: 475,
                startingMana: 325,
                abilities: ['nature_blessing', 'wildfire_storm', 'spirit_wolves', 'texas_tornado']
            }
        };

        // Unit types and formations
        this.unitTypes = {
            // Infantry
            COWBOY: { cost: 100, supply: 2, hp: 420, damage: 16, armor: 2, type: 'ranged' },
            DEPUTY: { cost: 125, supply: 2, hp: 380, damage: 18, armor: 3, type: 'ranged' },
            ROUGHNECK: { cost: 90, supply: 2, hp: 450, damage: 14, armor: 4, type: 'melee' },

            // Mounted
            TEXAS_CAVALRY: { cost: 200, supply: 3, hp: 520, damage: 22, armor: 2, type: 'mounted' },
            OIL_PROSPECTOR: { cost: 150, supply: 2, hp: 350, damage: 12, armor: 1, type: 'worker' },

            // Specialists
            SHARPSHOOTER: { cost: 175, supply: 3, hp: 320, damage: 35, armor: 1, type: 'sniper' },
            DYNAMITE_EXPERT: { cost: 225, supply: 3, hp: 380, damage: 45, armor: 2, type: 'siege' }
        };

        // Game state
        this.heroes = [];
        this.units = [];
        this.selectedUnits = [];
        this.controlGroups = new Map(); // Ctrl+1-9 groups
        this.formations = {
            line: { spacing: 3, rows: 1 },
            column: { spacing: 2, rows: 10 },
            wedge: { spacing: 3, rows: 3 },
            box: { spacing: 3, rows: 4 }
        };

        // Player resources and upkeep
        this.resources = {
            gold: 1500,
            wood: 750,
            oil: 200,
            food: 100,
            supply: 0,
            supplyCap: 50
        };

        // Experience and leveling system
        this.experienceTable = this.generateExperienceTable();

        // Audio and visual effects
        this.effectsSystem = null;

        this.init();
    }

    async init() {
        console.log('🤠 Initializing Hero Unit System...');

        try {
            await this.initHeroAbilities();
            await this.initUnitMeshes();
            await this.initSelectionSystem();
            await this.initFormationSystem();
            await this.initUpkeepSystem();

            console.log('⚔️ Hero Unit System ready!');
            console.log(`🏆 Supporting ${this.config.maxHeroesPerPlayer} heroes per player`);
        } catch (error) {
            console.error('Failed to initialize hero unit system:', error);
        }
    }

    generateExperienceTable() {
        const table = [];
        let baseExp = 100;

        for (let level = 1; level <= this.config.maxLevel; level++) {
            table[level] = Math.floor(baseExp * Math.pow(this.config.experienceMultiplier, level - 1));
        }

        return table;
    }

    async initHeroAbilities() {
        // Define all hero abilities with Texas flair
        this.abilities = {
            // Texas Ranger abilities
            tracker_shot: {
                name: 'Tracker Shot',
                description: 'Precision shot that reveals enemies and deals bonus damage',
                manaCost: 75,
                cooldown: 8,
                range: 700,
                effect: this.castTrackerShot.bind(this)
            },
            law_and_order: {
                name: 'Law and Order',
                description: 'Intimidates enemies, reducing their attack speed',
                manaCost: 100,
                cooldown: 15,
                range: 300,
                effect: this.castLawAndOrder.bind(this)
            },
            frontier_justice: {
                name: 'Frontier Justice',
                description: 'Marks an enemy for death, increasing all damage against it',
                manaCost: 125,
                cooldown: 20,
                range: 600,
                effect: this.castFrontierJustice.bind(this)
            },
            texas_justice: {
                name: 'Texas Justice',
                description: 'Ultimate: Calls down a barrage of shots in a large area',
                manaCost: 200,
                cooldown: 80,
                range: 800,
                effect: this.castTexasJustice.bind(this)
            },

            // Oil Baron abilities
            oil_strike: {
                name: 'Oil Strike',
                description: 'Creates a temporary oil well that generates gold',
                manaCost: 100,
                cooldown: 30,
                range: 200,
                effect: this.castOilStrike.bind(this)
            },
            industrial_might: {
                name: 'Industrial Might',
                description: 'Temporarily increases production speed of nearby buildings',
                manaCost: 125,
                cooldown: 45,
                range: 400,
                effect: this.castIndustrialMight.bind(this)
            },
            black_gold_rush: {
                name: 'Black Gold Rush',
                description: 'Motivates workers, increasing resource gathering rate',
                manaCost: 150,
                cooldown: 60,
                range: 500,
                effect: this.castBlackGoldRush.bind(this)
            },
            texas_fortune: {
                name: 'Texas Fortune',
                description: 'Ultimate: Grants massive resource bonus and summons oil derricks',
                manaCost: 250,
                cooldown: 120,
                range: 600,
                effect: this.castTexasFortune.bind(this)
            },

            // Cattle Baron abilities
            stampede: {
                name: 'Stampede',
                description: 'Summons a herd of cattle that trample enemies',
                manaCost: 100,
                cooldown: 25,
                range: 400,
                effect: this.castStampede.bind(this)
            },
            lasso_strike: {
                name: 'Lasso Strike',
                description: 'Pulls an enemy toward the hero and stuns them',
                manaCost: 75,
                cooldown: 12,
                range: 300,
                effect: this.castLassoStrike.bind(this)
            },
            cowboy_rally: {
                name: 'Cowboy Rally',
                description: 'Inspires nearby units, increasing their damage and movement speed',
                manaCost: 125,
                cooldown: 35,
                range: 350,
                effect: this.castCowboyRally.bind(this)
            },
            longhorn_charge: {
                name: 'Longhorn Charge',
                description: 'Ultimate: Transforms into a massive longhorn, dealing devastating damage',
                manaCost: 200,
                cooldown: 90,
                range: 500,
                effect: this.castLonghornCharge.bind(this)
            }
        };

        console.log('✨ Hero abilities initialized');
    }

    async initUnitMeshes() {
        // Create visual representations for all unit types
        this.meshTemplates = {};

        // Hero meshes (more detailed)
        for (const [key, heroClass] of Object.entries(this.heroClasses)) {
            this.meshTemplates[key] = await this.createHeroMesh(heroClass);
        }

        // Unit meshes
        for (const [key, unitType] of Object.entries(this.unitTypes)) {
            this.meshTemplates[key] = await this.createUnitMesh(unitType);
        }

        console.log('👥 Unit meshes initialized');
    }

    async createHeroMesh(heroClass) {
        // Create a distinctive mesh for each hero type
        const geometry = new THREE.CapsuleGeometry(0.5, 2.5, 8, 16);

        // Hero-specific materials with Texas colors
        let color;
        switch (heroClass.name) {
            case 'Texas Ranger':
                color = 0x8B4513; // Saddle brown
                break;
            case 'Oil Baron':
                color = 0x1C1C1C; // Dark for oil
                break;
            case 'Cattle Baron':
                color = 0xD2B48C; // Tan/leather
                break;
            case 'Bluebonnet Shaman':
                color = 0x4169E1; // Royal blue
                break;
            default:
                color = 0x8B4513;
        }

        const material = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);

        // Add hero glow effect
        const glowGeometry = new THREE.CapsuleGeometry(0.7, 2.8, 8, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glowMesh);

        // Add nameplate
        const nameplate = this.createNameplate(heroClass.name);
        nameplate.position.y = 3;
        mesh.add(nameplate);

        return mesh;
    }

    async createUnitMesh(unitType) {
        const geometry = new THREE.CapsuleGeometry(0.4, 2.0, 6, 12);

        // Unit type colors
        let color;
        switch (unitType.type) {
            case 'ranged':
                color = 0x654321; // Dark brown
                break;
            case 'melee':
                color = 0x696969; // Dim gray
                break;
            case 'mounted':
                color = 0x8B4513; // Saddle brown
                break;
            case 'worker':
                color = 0xD2691E; // Chocolate
                break;
            case 'siege':
                color = 0x2F4F4F; // Dark slate gray
                break;
            default:
                color = 0x654321;
        }

        const material = new THREE.MeshLambertMaterial({ color });
        return new THREE.Mesh(geometry, material);
    }

    createNameplate(text) {
        // Create text sprite for unit names
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = '#FFFFFF';
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 6);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);

        return sprite;
    }

    async initSelectionSystem() {
        // Mouse selection with selection boxes
        this.selectionBox = new THREE.BoxHelper();
        this.selectionBox.material.color.setHex(0xBF5700); // Texas orange
        this.selectionBox.visible = false;
        this.scene.add(this.selectionBox);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        console.log('🖱️ Selection system initialized');
    }

    async initFormationSystem() {
        // Formation templates for unit positioning
        this.formationTemplates = {
            line: this.generateLineFormation,
            column: this.generateColumnFormation,
            wedge: this.generateWedgeFormation,
            box: this.generateBoxFormation,
            circle: this.generateCircleFormation
        };

        console.log('⚔️ Formation system initialized');
    }

    async initUpkeepSystem() {
        // Resource penalty system based on army size
        this.upkeepTimer = 0;
        this.upkeepInterval = 5; // Check every 5 seconds

        console.log('💰 Upkeep system initialized');
    }

    // Hero Creation and Management
    createHero(heroClass, position) {
        if (this.heroes.length >= this.config.maxHeroesPerPlayer) {
            console.warn('Maximum heroes reached');
            return null;
        }

        const heroData = this.heroClasses[heroClass];
        const hero = {
            id: `hero_${Date.now()}`,
            class: heroClass,
            name: heroData.name,
            level: 1,
            experience: 0,

            // Stats
            strength: heroData.baseStats.strength,
            agility: heroData.baseStats.agility,
            intelligence: heroData.baseStats.intelligence,

            // Combat stats
            hp: heroData.startingHP,
            maxHP: heroData.startingHP,
            mana: heroData.startingMana,
            maxMana: heroData.startingMana,
            damage: this.calculateHeroDamage(heroData),
            armor: this.calculateHeroArmor(heroData),

            // Abilities
            abilities: heroData.abilities.map(abilityKey => ({
                key: abilityKey,
                level: 0,
                cooldownRemaining: 0
            })),

            // Visual
            mesh: this.meshTemplates[heroClass].clone(),
            position: position.clone(),

            // State
            isAlive: true,
            target: null,
            orders: [],

            // Texas-specific traits
            reputation: 100, // Affects unit morale
            territory: null,  // Home territory bonus
            specialization: heroData.primaryAttribute
        };

        // Position the mesh
        hero.mesh.position.copy(position);
        this.scene.add(hero.mesh);

        this.heroes.push(hero);
        console.log(`🤠 Created ${hero.name} at level ${hero.level}`);

        return hero;
    }

    calculateHeroDamage(heroData) {
        // Base damage calculation with primary attribute bonus
        const baseDamage = 20;
        const primaryStat = heroData.baseStats[heroData.primaryAttribute];
        return baseDamage + Math.floor(primaryStat * 0.5);
    }

    calculateHeroArmor(heroData) {
        // Armor based on strength and agility
        const { strength, agility } = heroData.baseStats;
        return Math.floor((strength + agility) * 0.1);
    }

    // Experience and Leveling
    grantExperience(hero, amount) {
        hero.experience += amount;

        while (hero.level < this.config.maxLevel &&
               hero.experience >= this.experienceTable[hero.level + 1]) {
            this.levelUpHero(hero);
        }
    }

    levelUpHero(hero) {
        hero.level++;

        // Increase stats based on primary attribute
        const heroData = this.heroClasses[hero.class];
        const primaryAttribute = heroData.primaryAttribute;

        switch (primaryAttribute) {
            case 'strength':
                hero.strength += 2;
                hero.agility += 1;
                hero.intelligence += 1;
                break;
            case 'agility':
                hero.strength += 1;
                hero.agility += 2;
                hero.intelligence += 1;
                break;
            case 'intelligence':
                hero.strength += 1;
                hero.agility += 1;
                hero.intelligence += 2;
                break;
        }

        // Recalculate derived stats
        hero.maxHP = heroData.startingHP + (hero.strength * 15);
        hero.maxMana = heroData.startingMana + (hero.intelligence * 12);
        hero.hp = hero.maxHP; // Full heal on level up
        hero.mana = hero.maxMana;
        hero.damage = this.calculateHeroDamage({ baseStats: hero, primaryAttribute });
        hero.armor = this.calculateHeroArmor({ baseStats: hero });

        // Grant skill point (can be spent on abilities)
        console.log(`🆙 ${hero.name} reached level ${hero.level}!`);

        // Visual level up effect
        this.playLevelUpEffect(hero);
    }

    playLevelUpEffect(hero) {
        // Golden light burst effect
        const particles = new THREE.Group();
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });

        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                (Math.random() - 0.5) * 4,
                Math.random() * 2,
                (Math.random() - 0.5) * 4
            );
            particles.add(particle);
        }

        particles.position.copy(hero.position);
        this.scene.add(particles);

        // Animate particles upward and fade out
        const animate = () => {
            particles.children.forEach(particle => {
                particle.position.y += 0.1;
                particle.material.opacity -= 0.02;
            });

            if (particles.children[0].material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particles);
            }
        };
        animate();
    }

    // Ability System
    async castAbility(hero, abilityKey, targetPosition) {
        const ability = this.abilities[abilityKey];
        const heroAbility = hero.abilities.find(a => a.key === abilityKey);

        if (!ability || !heroAbility) return false;
        if (heroAbility.cooldownRemaining > 0) return false;
        if (hero.mana < ability.manaCost) return false;

        // Check range if target position provided
        if (targetPosition) {
            const distance = hero.position.distanceTo(targetPosition);
            if (distance > ability.range) return false;
        }

        // Consume mana and start cooldown
        hero.mana -= ability.manaCost;
        heroAbility.cooldownRemaining = ability.cooldown;

        // Execute ability effect
        await ability.effect(hero, targetPosition);

        console.log(`${hero.name} cast ${ability.name}`);
        return true;
    }

    // Ability implementations
    async castTrackerShot(hero, targetPosition) {
        // Create visual projectile
        const projectile = this.createProjectile(hero.position, targetPosition, 0xBF5700);

        // Deal damage and reveal area
        setTimeout(() => {
            this.dealDamageAtPosition(targetPosition, hero.damage * 1.5, 100);
            this.revealArea(targetPosition, 200, 10); // Reveal for 10 seconds
            this.scene.remove(projectile);
        }, 500);
    }

    async castLawAndOrder(hero, targetPosition) {
        // Create intimidation area effect
        const aura = this.createAreaEffect(hero.position, 300, 0x4169E1, 5);

        // Reduce enemy attack speed in area
        this.applyAreaDebuff(hero.position, 300, { attackSpeed: -0.3 }, 8);
    }

    async castStampede(hero, targetPosition) {
        // Create stampeding cattle effect
        const direction = targetPosition.clone().sub(hero.position).normalize();

        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const cattlePos = hero.position.clone().add(direction.clone().multiplyScalar(i * 3));
                this.createStampedeEffect(cattlePos);
                this.dealDamageAtPosition(cattlePos, 75, 50);
            }, i * 200);
        }
    }

    async castOilStrike(hero, targetPosition) {
        // Create temporary oil well
        const oilWell = this.createOilWell(targetPosition);

        // Generate gold over time
        let goldGenerated = 0;
        const generateGold = () => {
            if (goldGenerated < 500) { // Total gold from well
                this.resources.gold += 25;
                goldGenerated += 25;
                setTimeout(generateGold, 2000); // Every 2 seconds
            } else {
                this.scene.remove(oilWell);
            }
        };
        generateGold();
    }

    // Formation System
    generateLineFormation(units, spacing = 3) {
        const positions = [];
        const center = units.length / 2;

        for (let i = 0; i < units.length; i++) {
            positions.push(new THREE.Vector3((i - center) * spacing, 0, 0));
        }

        return positions;
    }

    generateWedgeFormation(units, spacing = 3) {
        const positions = [];
        let row = 0;
        let posInRow = 0;
        const maxInRow = [1, 2, 3, 4, 5]; // Wedge shape

        for (let i = 0; i < units.length; i++) {
            if (posInRow >= maxInRow[row]) {
                row++;
                posInRow = 0;
            }

            const rowOffset = row * spacing * 1.5;
            const colOffset = (posInRow - maxInRow[row] / 2 + 0.5) * spacing;

            positions.push(new THREE.Vector3(colOffset, 0, -rowOffset));
            posInRow++;
        }

        return positions;
    }

    generateBoxFormation(units, spacing = 3) {
        const positions = [];
        const sideLength = Math.ceil(Math.sqrt(units.length));

        for (let i = 0; i < units.length; i++) {
            const row = Math.floor(i / sideLength);
            const col = i % sideLength;

            positions.push(new THREE.Vector3(
                (col - sideLength / 2 + 0.5) * spacing,
                0,
                (row - sideLength / 2 + 0.5) * spacing
            ));
        }

        return positions;
    }

    // Unit Selection and Control
    selectUnits(units) {
        // Clear previous selection
        this.selectedUnits.forEach(unit => {
            if (unit.mesh) {
                this.removeSelectionRing(unit);
            }
        });

        this.selectedUnits = units;

        // Add selection indicators
        this.selectedUnits.forEach(unit => {
            if (unit.mesh) {
                this.addSelectionRing(unit);
            }
        });
    }

    addSelectionRing(unit) {
        const ringGeometry = new THREE.TorusGeometry(1, 0.1, 4, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xBF5700 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);

        ring.position.set(0, -1, 0);
        ring.rotation.x = -Math.PI / 2;
        unit.mesh.add(ring);
        unit.selectionRing = ring;
    }

    removeSelectionRing(unit) {
        if (unit.selectionRing) {
            unit.mesh.remove(unit.selectionRing);
            unit.selectionRing = null;
        }
    }

    // Control Groups (Ctrl+1-9)
    assignControlGroup(groupNumber, units) {
        this.controlGroups.set(groupNumber, [...units]);
        console.log(`Assigned ${units.length} units to group ${groupNumber}`);
    }

    selectControlGroup(groupNumber) {
        const units = this.controlGroups.get(groupNumber);
        if (units && units.length > 0) {
            this.selectUnits(units.filter(unit => unit.isAlive));
        }
    }

    // Upkeep System
    updateUpkeep(deltaTime) {
        this.upkeepTimer += deltaTime;

        if (this.upkeepTimer >= this.upkeepInterval) {
            this.upkeepTimer = 0;
            this.calculateUpkeep();
        }
    }

    calculateUpkeep() {
        const totalSupply = this.calculateTotalSupply();
        let upkeepPenalty = 0;

        // Find the appropriate upkeep tier
        for (let i = 0; i < this.config.upkeepThresholds.length; i++) {
            if (totalSupply >= this.config.upkeepThresholds[i]) {
                upkeepPenalty = this.config.upkeepPenalties[i];
            }
        }

        // Apply upkeep cost
        if (upkeepPenalty > 0) {
            const upkeepCost = Math.floor(this.resources.gold * upkeepPenalty);
            this.resources.gold = Math.max(0, this.resources.gold - upkeepCost);

            if (upkeepCost > 0) {
                console.log(`⚠️ Upkeep cost: ${upkeepCost} gold (${Math.floor(upkeepPenalty * 100)}% penalty)`);
            }
        }
    }

    calculateTotalSupply() {
        return this.units.reduce((total, unit) => total + (unit.supply || 0), 0) +
               this.heroes.reduce((total, hero) => total + 5, 0); // Heroes count as 5 supply each
    }

    // Utility Methods
    createProjectile(start, end, color) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color });
        const projectile = new THREE.Mesh(geometry, material);

        projectile.position.copy(start);
        this.scene.add(projectile);

        // Animate projectile
        const direction = end.clone().sub(start).normalize();
        const distance = start.distanceTo(end);
        const speed = 20; // units per second

        const animate = () => {
            projectile.position.add(direction.clone().multiplyScalar(speed * 0.016));

            if (projectile.position.distanceTo(start) < distance) {
                requestAnimationFrame(animate);
            }
        };
        animate();

        return projectile;
    }

    createAreaEffect(position, radius, color, duration) {
        const geometry = new THREE.RingGeometry(radius * 0.8, radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geometry, material);

        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);

        // Remove after duration
        setTimeout(() => {
            this.scene.remove(ring);
        }, duration * 1000);

        return ring;
    }

    // Update method called from main game loop
    update(deltaTime) {
        // Update hero cooldowns
        this.heroes.forEach(hero => {
            hero.abilities.forEach(ability => {
                if (ability.cooldownRemaining > 0) {
                    ability.cooldownRemaining = Math.max(0, ability.cooldownRemaining - deltaTime);
                }
            });
        });

        // Update upkeep system
        this.updateUpkeep(deltaTime);

        // Update unit AI and movement
        this.updateUnitsAI(deltaTime);
    }

    updateUnitsAI(deltaTime) {
        // Basic AI for units - move toward targets, execute orders
        [...this.heroes, ...this.units].forEach(unit => {
            if (!unit.isAlive) return;

            // Process orders
            if (unit.orders && unit.orders.length > 0) {
                const order = unit.orders[0];
                this.processUnitOrder(unit, order, deltaTime);
            }

            // Update mesh position
            if (unit.mesh) {
                unit.mesh.position.copy(unit.position);
            }
        });
    }

    processUnitOrder(unit, order, deltaTime) {
        switch (order.type) {
            case 'move':
                this.moveUnitToward(unit, order.target, deltaTime);
                break;
            case 'attack':
                this.unitAttack(unit, order.target, deltaTime);
                break;
            case 'follow':
                this.unitFollow(unit, order.target, deltaTime);
                break;
        }

        // Remove completed orders
        if (order.completed) {
            unit.orders.shift();
        }
    }

    moveUnitToward(unit, targetPosition, deltaTime) {
        const direction = targetPosition.clone().sub(unit.position);
        const distance = direction.length();

        if (distance < 1.0) {
            // Reached destination
            unit.orders[0].completed = true;
            return;
        }

        // Move toward target
        direction.normalize();
        const moveSpeed = unit.moveSpeed || 5;
        unit.position.add(direction.multiplyScalar(moveSpeed * deltaTime));
    }

    // Public API methods
    getSelectedHeroes() {
        return this.selectedUnits.filter(unit => unit.class !== undefined);
    }

    getHeroByName(name) {
        return this.heroes.find(hero => hero.name === name);
    }

    getTotalArmySupply() {
        return this.calculateTotalSupply();
    }

    dispose() {
        // Clean up resources
        this.heroes.forEach(hero => {
            if (hero.mesh) {
                this.scene.remove(hero.mesh);
            }
        });

        this.units.forEach(unit => {
            if (unit.mesh) {
                this.scene.remove(unit.mesh);
            }
        });

        if (this.selectionBox) {
            this.scene.remove(this.selectionBox);
        }
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroUnitSystem;
} else if (typeof window !== 'undefined') {
    window.HeroUnitSystem = HeroUnitSystem;
}