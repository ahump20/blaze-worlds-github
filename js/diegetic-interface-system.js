/**
 * Diegetic Interface System with Immersive UI
 * Texas Championship Edition - In-World Interface Elements
 *
 * Features:
 * - Holographic displays in 3D space
 * - Physical control panels on buildings
 * - Augmented reality overlays
 * - Gesture-based interactions
 * - Contextual world-space menus
 */

class DiegeticInterfaceSystem {
    constructor(scene, camera, gameWorld) {
        this.scene = scene;
        this.camera = camera;
        this.gameWorld = gameWorld;

        // Interface elements
        this.interfaces = new Map();
        this.activeInterfaces = new Set();
        this.hoveredInterface = null;

        // Holographic displays
        this.holographicDisplays = new Map();
        this.floatingTexts = [];
        this.worldLabels = new Map();

        // Interaction system
        this.interactionRange = 10;
        this.interactionRaycaster = new THREE.Raycaster();
        this.interactionPointer = new THREE.Vector2();

        // AR overlays
        this.arOverlays = new Map();
        this.arActive = true;

        // Gesture recognition
        this.gestureTracker = {
            points: [],
            isTracking: false,
            startTime: 0
        };

        // UI materials and shaders
        this.materials = {
            holographic: null,
            glass: null,
            energy: null,
            projection: null
        };

        // Animation system
        this.animations = new Map();
        this.animationMixers = [];

        // Sound feedback
        this.sounds = {
            hover: null,
            select: null,
            open: null,
            close: null,
            error: null
        };

        this.init();
    }

    init() {
        this.createMaterials();
        this.setupInteractionSystem();
        this.createDefaultInterfaces();
        this.initializeGestureRecognition();

        console.log('🖥️ Diegetic Interface System initialized');
    }

    createMaterials() {
        // Holographic material with scanlines and glitch effects
        this.materials.holographic = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x00ffff) },
                opacity: { value: 0.8 },
                scanlineSpeed: { value: 2.0 },
                glitchIntensity: { value: 0.02 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vWorldPos;

                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPos = worldPos.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float opacity;
                uniform float scanlineSpeed;
                uniform float glitchIntensity;

                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vWorldPos;

                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }

                void main() {
                    vec3 viewDir = normalize(cameraPosition - vWorldPos);
                    float fresnel = pow(1.0 - dot(viewDir, vNormal), 1.5);

                    // Base color with fresnel
                    vec3 finalColor = color;
                    finalColor += fresnel * color * 2.0;

                    // Scanlines
                    float scanline = sin(vUv.y * 100.0 - time * scanlineSpeed) * 0.04;
                    finalColor += vec3(scanline);

                    // Digital noise/glitch
                    float glitch = random(vec2(floor(vUv.y * 20.0), floor(time * 10.0)));
                    if(glitch > 1.0 - glitchIntensity) {
                        finalColor.r += random(vUv + time) * 0.5;
                        finalColor.g -= random(vUv - time) * 0.5;
                    }

                    // Grid pattern
                    float grid = step(0.98, max(fract(vUv.x * 20.0), fract(vUv.y * 20.0)));
                    finalColor += vec3(grid * 0.1);

                    // Pulsing opacity
                    float pulse = sin(time * 2.0) * 0.1 + 0.9;
                    float finalOpacity = opacity * pulse * (0.5 + fresnel * 0.5);

                    gl_FragColor = vec4(finalColor, finalOpacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // Glass material for panels
        this.materials.glass = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0.0,
            roughness: 0.1,
            transmission: 0.9,
            thickness: 0.5,
            transparent: true,
            opacity: 0.3
        });

        // Energy field material
        this.materials.energy = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x00ff00) },
                color2: { value: new THREE.Color(0x00ffff) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;

                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    float wave = sin(vPosition.x * 10.0 + time * 2.0) *
                                 cos(vPosition.y * 10.0 - time * 1.5) * 0.5 + 0.5;

                    vec3 color = mix(color1, color2, wave);
                    float alpha = 0.3 + wave * 0.4;

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }

    setupInteractionSystem() {
        // Mouse/touch interaction
        window.addEventListener('mousemove', (e) => this.onPointerMove(e));
        window.addEventListener('click', (e) => this.onPointerClick(e));
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // Keyboard shortcuts for interface toggling
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleARMode();
            }
            if (e.key === 'i' || e.key === 'I') {
                this.toggleInventoryDisplay();
            }
        });
    }

    createDefaultInterfaces() {
        // Create main HUD elements
        this.createCompass();
        this.createResourceDisplay();
        this.createMinimapHologram();
        this.createObjectiveTracker();
    }

    createCompass() {
        const compassGeometry = new THREE.RingGeometry(2, 2.5, 32);
        const compassMesh = new THREE.Mesh(compassGeometry, this.materials.holographic);

        // Add cardinal direction markers
        const directions = ['N', 'E', 'S', 'W'];
        const textGeometry = new THREE.PlaneGeometry(0.5, 0.5);

        directions.forEach((dir, index) => {
            const angle = (index * Math.PI / 2);
            const textMesh = this.createWorldText(dir, {
                size: 0.3,
                color: 0x00ffff
            });

            textMesh.position.set(
                Math.sin(angle) * 2.2,
                0,
                Math.cos(angle) * 2.2
            );
            compassMesh.add(textMesh);
        });

        const compassInterface = {
            type: 'compass',
            mesh: compassMesh,
            update: (deltaTime) => {
                // Keep compass level and above player
                compassMesh.position.copy(this.camera.position);
                compassMesh.position.y += 3;
                compassMesh.rotation.x = -Math.PI / 2;
                compassMesh.rotation.z = this.camera.rotation.y;
            }
        };

        this.interfaces.set('compass', compassInterface);
        this.scene.add(compassMesh);
    }

    createResourceDisplay() {
        // Create floating resource indicators
        if (!this.gameWorld.economySystem) return;

        const displayGroup = new THREE.Group();
        const resources = this.gameWorld.economySystem.resources;

        let index = 0;
        Object.entries(resources).forEach(([type, data]) => {
            const panel = this.createHolographicPanel(2, 0.5);
            panel.position.set(index * 2.5, 0, 0);

            // Add resource icon and amount
            const iconMesh = this.createWorldText(data.icon, {
                size: 0.3,
                color: data.color
            });
            iconMesh.position.set(-0.7, 0, 0.01);
            panel.add(iconMesh);

            const amountMesh = this.createWorldText(Math.floor(data.amount).toString(), {
                size: 0.2,
                color: 0xffffff
            });
            amountMesh.position.set(0.3, 0, 0.01);
            panel.add(amountMesh);

            displayGroup.add(panel);
            index++;
        });

        const resourceInterface = {
            type: 'resources',
            mesh: displayGroup,
            update: (deltaTime) => {
                // Position above and to the right of view
                displayGroup.position.copy(this.camera.position);
                displayGroup.position.y += 2;
                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyQuaternion(this.camera.quaternion);
                displayGroup.position.add(forward.multiplyScalar(5));

                // Face camera
                displayGroup.lookAt(this.camera.position);
            }
        };

        this.interfaces.set('resources', resourceInterface);
        this.scene.add(displayGroup);
    }

    createMinimapHologram() {
        // Create 3D holographic minimap
        const mapSize = 4;
        const mapGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
        const mapMesh = new THREE.Mesh(mapGeometry, this.materials.glass);

        // Add terrain visualization
        const terrainCanvas = document.createElement('canvas');
        terrainCanvas.width = 256;
        terrainCanvas.height = 256;
        const ctx = terrainCanvas.getContext('2d');

        // Draw terrain (simplified)
        ctx.fillStyle = '#1a4d2e';
        ctx.fillRect(0, 0, 256, 256);

        const terrainTexture = new THREE.CanvasTexture(terrainCanvas);
        const terrainMaterial = new THREE.MeshBasicMaterial({
            map: terrainTexture,
            transparent: true,
            opacity: 0.7
        });

        const terrainMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(mapSize * 0.9, mapSize * 0.9),
            terrainMaterial
        );
        terrainMesh.position.z = 0.01;
        mapMesh.add(terrainMesh);

        // Add holographic frame
        const frameGeometry = new THREE.RingGeometry(mapSize / 2 - 0.1, mapSize / 2, 32);
        const frameMesh = new THREE.Mesh(frameGeometry, this.materials.holographic);
        mapMesh.add(frameMesh);

        // Add player indicator
        const playerIndicator = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.2, 4),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        playerIndicator.rotation.x = Math.PI;
        mapMesh.add(playerIndicator);

        const minimapInterface = {
            type: 'minimap',
            mesh: mapMesh,
            canvas: terrainCanvas,
            context: ctx,
            playerIndicator: playerIndicator,
            update: (deltaTime) => {
                // Position in front of player when activated
                if (this.activeInterfaces.has('minimap')) {
                    mapMesh.position.copy(this.camera.position);
                    const forward = new THREE.Vector3(0, 0, -3);
                    forward.applyQuaternion(this.camera.quaternion);
                    mapMesh.position.add(forward);
                    mapMesh.position.y -= 1;

                    mapMesh.lookAt(this.camera.position);

                    // Update player position on map
                    const mapScale = mapSize / 200; // World size to map size
                    playerIndicator.position.x = this.camera.position.x * mapScale;
                    playerIndicator.position.y = this.camera.position.z * mapScale;
                    playerIndicator.rotation.z = -this.camera.rotation.y;
                }
            }
        };

        this.interfaces.set('minimap', minimapInterface);
        mapMesh.visible = false;
        this.scene.add(mapMesh);
    }

    createObjectiveTracker() {
        // Create floating objective list
        const objectivePanel = this.createHolographicPanel(3, 2);

        // Add title
        const titleMesh = this.createWorldText('OBJECTIVES', {
            size: 0.2,
            color: 0xffd700
        });
        titleMesh.position.set(0, 0.8, 0.01);
        objectivePanel.add(titleMesh);

        // Add objective items
        const objectives = [
            '• Build Town Hall',
            '• Gather 500 Wood',
            '• Train 5 Heroes',
            '• Claim Territory'
        ];

        objectives.forEach((obj, index) => {
            const objMesh = this.createWorldText(obj, {
                size: 0.15,
                color: 0xffffff
            });
            objMesh.position.set(-1.2, 0.4 - index * 0.3, 0.01);
            objectivePanel.add(objMesh);
        });

        const objectiveInterface = {
            type: 'objectives',
            mesh: objectivePanel,
            update: (deltaTime) => {
                // Position to the left of view
                objectivePanel.position.copy(this.camera.position);
                const right = new THREE.Vector3(-1, 0, 0);
                right.applyQuaternion(this.camera.quaternion);
                objectivePanel.position.add(right.multiplyScalar(4));

                objectivePanel.lookAt(this.camera.position);
            }
        };

        this.interfaces.set('objectives', objectiveInterface);
        objectivePanel.visible = false;
        this.scene.add(objectivePanel);
    }

    createHolographicPanel(width, height) {
        const panel = new THREE.Group();

        // Background
        const bgGeometry = new THREE.PlaneGeometry(width, height);
        const bgMesh = new THREE.Mesh(bgGeometry, this.materials.holographic.clone());
        panel.add(bgMesh);

        // Border
        const borderGeometry = new THREE.EdgesGeometry(bgGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2
        });
        const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial);
        borderMesh.position.z = 0.001;
        panel.add(borderMesh);

        // Corner decorations
        const cornerSize = 0.1;
        const cornerGeometry = new THREE.PlaneGeometry(cornerSize, cornerSize);
        const corners = [
            { x: -width/2 + cornerSize/2, y: height/2 - cornerSize/2 },
            { x: width/2 - cornerSize/2, y: height/2 - cornerSize/2 },
            { x: -width/2 + cornerSize/2, y: -height/2 + cornerSize/2 },
            { x: width/2 - cornerSize/2, y: -height/2 + cornerSize/2 }
        ];

        corners.forEach(pos => {
            const cornerMesh = new THREE.Mesh(cornerGeometry, this.materials.energy);
            cornerMesh.position.set(pos.x, pos.y, 0.002);
            panel.add(cornerMesh);
        });

        return panel;
    }

    createWorldText(text, options = {}) {
        // Create text mesh using canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = `${options.size * 100 || 20}px Arial`;
        context.fillStyle = `#${new THREE.Color(options.color || 0xffffff).getHexString()}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(
            options.width || text.length * 0.1,
            options.height || 0.2
        );

        return new THREE.Mesh(geometry, material);
    }

    // Building interface system
    attachBuildingInterface(building) {
        if (!building || !building.mesh) return;

        const buildingData = this.gameWorld.economySystem.buildingTypes[building.type];

        // Create control panel for building
        const panel = this.createHolographicPanel(2, 1.5);
        panel.position.y = 3;

        // Add building name
        const nameMesh = this.createWorldText(buildingData.name, {
            size: 0.15,
            color: 0xffd700
        });
        nameMesh.position.set(0, 0.5, 0.01);
        panel.add(nameMesh);

        // Add progress bar if under construction
        if (building.constructionProgress < 100) {
            const progressBar = this.createProgressBar(building.constructionProgress / 100);
            progressBar.position.set(0, 0, 0.01);
            panel.add(progressBar);
        }

        // Add production info
        if (buildingData.produces && Object.keys(buildingData.produces).length > 0) {
            const production = Object.entries(buildingData.produces)
                .map(([res, rate]) => `${res}: +${rate}/min`)
                .join(', ');

            const prodMesh = this.createWorldText(production, {
                size: 0.1,
                color: 0x00ff00
            });
            prodMesh.position.set(0, -0.3, 0.01);
            panel.add(prodMesh);
        }

        building.mesh.add(panel);
        building.interfacePanel = panel;

        // Add interaction zone
        const interactionZone = new THREE.Mesh(
            new THREE.SphereGeometry(5, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.1,
                visible: false
            })
        );
        building.mesh.add(interactionZone);
        building.interactionZone = interactionZone;
    }

    createProgressBar(progress) {
        const barGroup = new THREE.Group();

        // Background
        const bgGeometry = new THREE.PlaneGeometry(1.5, 0.1);
        const bgMesh = new THREE.Mesh(bgGeometry, new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.5
        }));
        barGroup.add(bgMesh);

        // Progress fill
        const fillGeometry = new THREE.PlaneGeometry(1.5 * progress, 0.08);
        const fillMesh = new THREE.Mesh(fillGeometry, new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        }));
        fillMesh.position.x = (1.5 * progress - 1.5) / 2;
        fillMesh.position.z = 0.001;
        barGroup.add(fillMesh);

        return barGroup;
    }

    // Floating damage/heal numbers
    createFloatingText(text, position, color = 0xffffff, duration = 2000) {
        const floatingText = this.createWorldText(text, {
            size: 0.2,
            color: color
        });

        floatingText.position.copy(position);

        const startY = position.y;
        const targetY = startY + 2;
        const startTime = Date.now();

        const animation = {
            mesh: floatingText,
            update: () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;

                if (progress >= 1) {
                    this.scene.remove(floatingText);
                    return true; // Animation complete
                }

                // Float upward and fade
                floatingText.position.y = startY + (targetY - startY) * progress;
                floatingText.material.opacity = 1 - progress;

                return false;
            }
        };

        this.floatingTexts.push(animation);
        this.scene.add(floatingText);
    }

    // AR overlay system
    createAROverlay(target, info) {
        if (!this.arActive || !target.mesh) return;

        const overlay = new THREE.Group();

        // Health bar
        if (target.hp !== undefined && target.maxHp) {
            const healthBar = this.createHealthBar(target.hp / target.maxHp);
            healthBar.position.y = 2;
            overlay.add(healthBar);
        }

        // Name label
        if (target.name || target.type) {
            const label = this.createWorldText(target.name || target.type, {
                size: 0.1,
                color: 0xffffff
            });
            label.position.y = 2.5;
            overlay.add(label);
        }

        // Status icons
        if (target.status) {
            const statusIcons = this.createStatusIcons(target.status);
            statusIcons.position.y = 1.5;
            overlay.add(statusIcons);
        }

        target.mesh.add(overlay);
        this.arOverlays.set(target.id || target, overlay);
    }

    createHealthBar(percentage) {
        const barGroup = new THREE.Group();

        // Background
        const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
        const bgMesh = new THREE.Mesh(bgGeometry, new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.7
        }));
        barGroup.add(bgMesh);

        // Health fill
        const healthColor = percentage > 0.6 ? 0x00ff00 :
                          percentage > 0.3 ? 0xffff00 : 0xff0000;

        const fillGeometry = new THREE.PlaneGeometry(percentage, 0.08);
        const fillMesh = new THREE.Mesh(fillGeometry, new THREE.MeshBasicMaterial({
            color: healthColor,
            transparent: true,
            opacity: 0.9
        }));
        fillMesh.position.x = (percentage - 1) / 2;
        fillMesh.position.z = 0.001;
        barGroup.add(fillMesh);

        // Make it always face camera
        barGroup.lookAt(this.camera.position);

        return barGroup;
    }

    createStatusIcons(status) {
        const iconGroup = new THREE.Group();

        const iconMap = {
            'poisoned': { symbol: '☠', color: 0x00ff00 },
            'burning': { symbol: '🔥', color: 0xff6600 },
            'frozen': { symbol: '❄', color: 0x00ccff },
            'blessed': { symbol: '✨', color: 0xffff00 },
            'cursed': { symbol: '💀', color: 0x9900ff }
        };

        let xOffset = 0;
        status.forEach(statusType => {
            const iconData = iconMap[statusType];
            if (iconData) {
                const icon = this.createWorldText(iconData.symbol, {
                    size: 0.15,
                    color: iconData.color
                });
                icon.position.x = xOffset;
                iconGroup.add(icon);
                xOffset += 0.3;
            }
        });

        return iconGroup;
    }

    // Gesture recognition
    initializeGestureRecognition() {
        this.gestures = {
            'circle': this.recognizeCircle.bind(this),
            'swipe': this.recognizeSwipe.bind(this),
            'tap': this.recognizeTap.bind(this),
            'pinch': this.recognizePinch.bind(this)
        };
    }

    recognizeCircle(points) {
        if (points.length < 8) return false;

        // Calculate center
        let centerX = 0, centerY = 0;
        points.forEach(p => {
            centerX += p.x;
            centerY += p.y;
        });
        centerX /= points.length;
        centerY /= points.length;

        // Check if points form a circle
        const radius = Math.sqrt(
            Math.pow(points[0].x - centerX, 2) +
            Math.pow(points[0].y - centerY, 2)
        );

        let isCircle = true;
        points.forEach(p => {
            const dist = Math.sqrt(
                Math.pow(p.x - centerX, 2) +
                Math.pow(p.y - centerY, 2)
            );
            if (Math.abs(dist - radius) > radius * 0.3) {
                isCircle = false;
            }
        });

        if (isCircle) {
            this.onCircleGesture({ center: { x: centerX, y: centerY }, radius });
            return true;
        }
        return false;
    }

    recognizeSwipe(points) {
        if (points.length < 3) return false;

        const start = points[0];
        const end = points[points.length - 1];
        const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) +
            Math.pow(end.y - start.y, 2)
        );

        if (distance > 100) {
            const direction = {
                x: end.x - start.x,
                y: end.y - start.y
            };
            this.onSwipeGesture(direction);
            return true;
        }
        return false;
    }

    recognizeTap(points) {
        if (points.length === 1) {
            this.onTapGesture(points[0]);
            return true;
        }
        return false;
    }

    recognizePinch(touches) {
        if (touches.length === 2) {
            const distance = Math.sqrt(
                Math.pow(touches[0].x - touches[1].x, 2) +
                Math.pow(touches[0].y - touches[1].y, 2)
            );
            this.onPinchGesture(distance);
            return true;
        }
        return false;
    }

    // Gesture handlers
    onCircleGesture(data) {
        console.log('⭕ Circle gesture detected');
        // Open radial menu
        this.openRadialMenu(data.center);
    }

    onSwipeGesture(direction) {
        console.log('👉 Swipe gesture detected');
        // Switch interface panels
        if (Math.abs(direction.x) > Math.abs(direction.y)) {
            // Horizontal swipe
            if (direction.x > 0) {
                this.nextInterface();
            } else {
                this.previousInterface();
            }
        }
    }

    onTapGesture(position) {
        // Select interface element
        this.selectInterfaceAt(position);
    }

    onPinchGesture(distance) {
        // Zoom interface
        if (this.lastPinchDistance) {
            const scale = distance / this.lastPinchDistance;
            this.scaleActiveInterface(scale);
        }
        this.lastPinchDistance = distance;
    }

    // Radial menu system
    openRadialMenu(center) {
        const menuRadius = 2;
        const menuItems = [
            { icon: '⚔️', action: 'attack', angle: 0 },
            { icon: '🛡️', action: 'defend', angle: Math.PI / 3 },
            { icon: '🏗️', action: 'build', angle: 2 * Math.PI / 3 },
            { icon: '📦', action: 'inventory', angle: Math.PI },
            { icon: '🗺️', action: 'map', angle: 4 * Math.PI / 3 },
            { icon: '⚙️', action: 'settings', angle: 5 * Math.PI / 3 }
        ];

        const menuGroup = new THREE.Group();

        // Create menu items
        menuItems.forEach(item => {
            const itemMesh = this.createRadialMenuItem(item);
            const x = Math.cos(item.angle) * menuRadius;
            const z = Math.sin(item.angle) * menuRadius;
            itemMesh.position.set(x, 0, z);
            menuGroup.add(itemMesh);
        });

        // Position menu in world
        menuGroup.position.copy(this.camera.position);
        const forward = new THREE.Vector3(0, 0, -5);
        forward.applyQuaternion(this.camera.quaternion);
        menuGroup.position.add(forward);

        this.scene.add(menuGroup);

        // Auto-close after timeout
        setTimeout(() => {
            this.scene.remove(menuGroup);
        }, 5000);
    }

    createRadialMenuItem(item) {
        const group = new THREE.Group();

        // Background circle
        const circleGeometry = new THREE.CircleGeometry(0.5, 32);
        const circleMesh = new THREE.Mesh(circleGeometry, this.materials.holographic);
        group.add(circleMesh);

        // Icon
        const iconMesh = this.createWorldText(item.icon, {
            size: 0.3,
            color: 0xffffff
        });
        iconMesh.position.z = 0.01;
        group.add(iconMesh);

        // Interaction
        group.userData = { action: item.action };

        return group;
    }

    // Interaction handlers
    onPointerMove(event) {
        this.interactionPointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.interactionPointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Check for hover
        this.checkInterfaceHover();
    }

    onPointerClick(event) {
        this.checkInterfaceInteraction();
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.gestureTracker.isTracking = true;
            this.gestureTracker.startTime = Date.now();
            this.gestureTracker.points = [{
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
                time: Date.now()
            }];
        }
    }

    onTouchMove(event) {
        if (this.gestureTracker.isTracking) {
            this.gestureTracker.points.push({
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
                time: Date.now()
            });
        }
    }

    onTouchEnd(event) {
        if (this.gestureTracker.isTracking) {
            this.gestureTracker.isTracking = false;

            // Analyze gesture
            for (const [gestureName, recognizer] of Object.entries(this.gestures)) {
                if (recognizer(this.gestureTracker.points)) {
                    break;
                }
            }
        }
    }

    checkInterfaceHover() {
        this.interactionRaycaster.setFromCamera(this.interactionPointer, this.camera);

        const intersects = this.interactionRaycaster.intersectObjects(
            Array.from(this.interfaces.values()).map(i => i.mesh),
            true
        );

        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            if (hoveredObject !== this.hoveredInterface) {
                this.onInterfaceHover(hoveredObject);
                this.hoveredInterface = hoveredObject;
            }
        } else if (this.hoveredInterface) {
            this.onInterfaceLeave(this.hoveredInterface);
            this.hoveredInterface = null;
        }
    }

    checkInterfaceInteraction() {
        if (this.hoveredInterface) {
            this.onInterfaceSelect(this.hoveredInterface);
        }
    }

    onInterfaceHover(object) {
        // Highlight effect
        if (object.material) {
            object.material.emissive = new THREE.Color(0x00ff00);
            object.material.emissiveIntensity = 0.3;
        }

        // Play hover sound
        if (this.sounds.hover) {
            // this.sounds.hover.play();
        }
    }

    onInterfaceLeave(object) {
        // Remove highlight
        if (object.material) {
            object.material.emissive = new THREE.Color(0x000000);
            object.material.emissiveIntensity = 0;
        }
    }

    onInterfaceSelect(object) {
        console.log('Interface selected:', object.userData);

        // Execute action based on interface type
        if (object.userData && object.userData.action) {
            this.executeAction(object.userData.action);
        }

        // Play select sound
        if (this.sounds.select) {
            // this.sounds.select.play();
        }
    }

    executeAction(action) {
        switch (action) {
            case 'attack':
                console.log('⚔️ Attack mode activated');
                break;
            case 'defend':
                console.log('🛡️ Defense mode activated');
                break;
            case 'build':
                this.gameWorld.economySystem?.toggleBuildingPanel();
                break;
            case 'inventory':
                this.toggleInventoryDisplay();
                break;
            case 'map':
                this.toggleInterface('minimap');
                break;
            case 'settings':
                console.log('⚙️ Settings menu opened');
                break;
        }
    }

    // Interface management
    toggleInterface(name) {
        const interface_ = this.interfaces.get(name);
        if (!interface_) return;

        if (this.activeInterfaces.has(name)) {
            this.activeInterfaces.delete(name);
            interface_.mesh.visible = false;
        } else {
            this.activeInterfaces.add(name);
            interface_.mesh.visible = true;
        }
    }

    toggleARMode() {
        this.arActive = !this.arActive;
        console.log(`AR Mode: ${this.arActive ? 'ON' : 'OFF'}`);

        // Show/hide AR overlays
        this.arOverlays.forEach(overlay => {
            overlay.visible = this.arActive;
        });
    }

    toggleInventoryDisplay() {
        this.toggleInterface('inventory');
    }

    // Update method
    update(deltaTime) {
        // Update all active interfaces
        this.interfaces.forEach((interface_, name) => {
            if (interface_.update) {
                interface_.update(deltaTime);
            }

            // Update material uniforms
            if (interface_.mesh && interface_.mesh.material && interface_.mesh.material.uniforms) {
                if (interface_.mesh.material.uniforms.time) {
                    interface_.mesh.material.uniforms.time.value += deltaTime;
                }
            }
        });

        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(text => {
            return !text.update(); // Remove completed animations
        });

        // Update AR overlays to face camera
        this.arOverlays.forEach(overlay => {
            if (overlay.visible) {
                overlay.lookAt(this.camera.position);
            }
        });

        // Update animations
        this.animationMixers.forEach(mixer => {
            mixer.update(deltaTime);
        });
    }

    // Cleanup
    destroy() {
        // Remove all interfaces
        this.interfaces.forEach(interface_ => {
            if (interface_.mesh) {
                this.scene.remove(interface_.mesh);
                // Dispose of geometries and materials
            }
        });

        // Remove AR overlays
        this.arOverlays.forEach(overlay => {
            if (overlay.parent) {
                overlay.parent.remove(overlay);
            }
        });

        // Clear event listeners
        window.removeEventListener('mousemove', this.onPointerMove);
        window.removeEventListener('click', this.onPointerClick);
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);

        console.log('🖥️ Diegetic Interface System destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiegeticInterfaceSystem;
}