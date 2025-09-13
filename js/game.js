// Blaze Worlds Championship Edition - Main Game Engine
// Warcraft III-style conquest integrated with exploration

class BlazeWorldsChampionship {
    constructor() {
        // Core Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: true,
            powerPreference: "high-performance"
        });
        
        // Game modes
        this.gameMode = 'conquest'; // 'exploration' or 'conquest'
        this.conquestSystem = null;
        
        // Enhanced settings
        this.settings = {
            graphicsQuality: 3, // 1-3
            renderDistance: 8,
            shadows: true,
            particles: true,
            weather: true,
            mouseSensitivity: 5
        };
        
        // Initialize all systems
        this.init();
    }
    
    init() {
        // Setup renderer
        this.setupRenderer();
        
        // Setup world
        this.setupWorld();
        
        // Setup player
        this.setupPlayer();
        
        // Setup controls
        this.setupControls();
        
        // Initialize conquest system
        this.conquestSystem = new ConquestSystem(this);
        
        // Setup HUD
        this.setupHUD();
        
        // Start game loop
        this.animate();
        
        console.log('Blaze Worlds Championship Edition - Ready!');
        this.showNotification('Build your empire and conquer the frontier!', 5000);
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = this.settings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Set fog
        this.scene.fog = new THREE.FogExp2(0xCCCCCC, 0.001);
    }
    
    setupWorld() {
        // Lighting
        this.setupLighting();
        
        // Terrain
        this.terrain = new TerrainSystem(this);
        
        // Sky
        this.setupSky();
        
        // Weather
        if (this.settings.weather) {
            this.weather = new WeatherSystem(this);
        }
    }
    
    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.HemisphereLight(0x87CEEB, 0x545454, 0.6);
        this.scene.add(this.ambientLight);
        
        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xFFFFED, 1.2);
        this.sunLight.position.set(100, 200, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;
        this.scene.add(this.sunLight);
    }
    
    setupSky() {
        const skyGeo = new THREE.SphereGeometry(500, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077FF) },
                bottomColor: { value: new THREE.Color(0xFFFFFF) },
                offset: { value: 100 },
                exponent: { value: 0.6 }
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
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.sky);
    }
    
    setupPlayer() {
        this.player = {
            position: new THREE.Vector3(0, 50, 0),
            rotation: { x: 0, y: 0 },
            cameraMode: 'rts', // 'fps' or 'rts'
            cameraHeight: 30,
            cameraDistance: 40
        };
        
        // Set initial camera for RTS mode
        this.camera.position.set(0, this.player.cameraHeight, this.player.cameraDistance);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupControls() {
        this.controls = {
            keys: {},
            mouse: { x: 0, y: 0, locked: false },
            touch: { active: false }
        };
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse controls
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('wheel', (e) => this.onMouseWheel(e));
        
        // Touch controls
        document.addEventListener('touchstart', (e) => this.onTouchStart(e));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e));
        document.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onKeyDown(event) {
        this.controls.keys[event.key.toLowerCase()] = true;
        
        // Hotkeys
        switch(event.key.toLowerCase()) {
            case 'b':
                // Open build menu
                this.openBuildMenu();
                break;
            case 'escape':
                // Toggle settings menu
                this.toggleSettings();
                break;
            case 't':
                // Open chat
                this.openChat();
                break;
            case 'tab':
                // Toggle camera mode
                event.preventDefault();
                this.toggleCameraMode();
                break;
            case 'f1':
                // Help
                this.showHelp();
                break;
        }
        
        // Number keys for unit groups
        if (event.key >= '1' && event.key <= '9') {
            if (event.ctrlKey) {
                // Assign control group
                this.assignControlGroup(parseInt(event.key));
            } else {
                // Select control group
                this.selectControlGroup(parseInt(event.key));
            }
        }
    }
    
    onKeyUp(event) {
        this.controls.keys[event.key.toLowerCase()] = false;
    }
    
    onMouseDown(event) {
        if (event.button === 0) { // Left click
            this.handleLeftClick(event);
        } else if (event.button === 2) { // Right click
            this.handleRightClick(event);
        } else if (event.button === 1) { // Middle click
            this.handleMiddleClick(event);
        }
    }
    
    onMouseUp(event) {
        // Handle drag selection
        if (this.isSelecting) {
            this.endSelection();
        }
    }
    
    onMouseMove(event) {
        this.controls.mouse.x = event.clientX;
        this.controls.mouse.y = event.clientY;
        
        // Edge scrolling in RTS mode
        if (this.player.cameraMode === 'rts') {
            this.handleEdgeScrolling();
        }
        
        // Update selection box if selecting
        if (this.isSelecting) {
            this.updateSelection();
        }
    }
    
    onMouseWheel(event) {
        // Zoom in RTS mode
        if (this.player.cameraMode === 'rts') {
            this.player.cameraHeight = Math.max(10, Math.min(100, 
                this.player.cameraHeight + event.deltaY * 0.1));
        }
    }
    
    handleLeftClick(event) {
        const coords = this.screenToWorld(event.clientX, event.clientY);
        
        if (this.gameMode === 'conquest' && this.conquestSystem) {
            this.conquestSystem.handleClick(coords.x, coords.z);
        }
    }
    
    handleRightClick(event) {
        event.preventDefault();
        const coords = this.screenToWorld(event.clientX, event.clientY);
        
        if (this.gameMode === 'conquest' && this.conquestSystem) {
            // Right click to move units or set rally point
            if (this.conquestSystem.selectedUnits.length > 0) {
                this.conquestSystem.selectedUnits.forEach(unit => {
                    this.conquestSystem.moveUnit(unit, coords.x, coords.z);
                });
            }
        }
    }
    
    handleMiddleClick(event) {
        // Pan camera
        this.isPanning = true;
    }
    
    handleEdgeScrolling() {
        const edgeSize = 50;
        const scrollSpeed = 1;
        
        if (this.controls.mouse.x < edgeSize) {
            this.camera.position.x -= scrollSpeed;
        }
        if (this.controls.mouse.x > window.innerWidth - edgeSize) {
            this.camera.position.x += scrollSpeed;
        }
        if (this.controls.mouse.y < edgeSize) {
            this.camera.position.z -= scrollSpeed;
        }
        if (this.controls.mouse.y > window.innerHeight - edgeSize) {
            this.camera.position.z += scrollSpeed;
        }
    }
    
    screenToWorld(screenX, screenY) {
        // Convert screen coordinates to world coordinates
        const vector = new THREE.Vector3();
        vector.set(
            (screenX / window.innerWidth) * 2 - 1,
            -(screenY / window.innerHeight) * 2 + 1,
            0.5
        );
        
        vector.unproject(this.camera);
        
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.y / dir.y;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        return { x: pos.x, z: pos.z };
    }
    
    toggleCameraMode() {
        if (this.player.cameraMode === 'rts') {
            this.player.cameraMode = 'fps';
            this.showNotification('FPS Camera Mode');
        } else {
            this.player.cameraMode = 'rts';
            this.showNotification('RTS Camera Mode');
        }
    }
    
    openBuildMenu() {
        // Create build menu UI
        const buildMenu = document.createElement('div');
        buildMenu.id = 'buildMenu';
        buildMenu.className = 'build-menu';
        buildMenu.innerHTML = `
            <h3>Build Menu</h3>
            <div class="build-categories">
                <div class="build-category">
                    <h4>Economy</h4>
                    <button onclick="game.selectBuilding('townHall')">Town Hall (400g)</button>
                    <button onclick="game.selectBuilding('farm')">Farm (80g)</button>
                    <button onclick="game.selectBuilding('goldMine')">Gold Mine (100w)</button>
                    <button onclick="game.selectBuilding('lumberMill')">Lumber Mill (100g)</button>
                </div>
                <div class="build-category">
                    <h4>Military</h4>
                    <button onclick="game.selectBuilding('barracks')">Barracks (200g)</button>
                    <button onclick="game.selectBuilding('stable')">Stable (300g)</button>
                    <button onclick="game.selectBuilding('workshop')">Workshop (400g)</button>
                </div>
                <div class="build-category">
                    <h4>Defense</h4>
                    <button onclick="game.selectBuilding('watchtower')">Watchtower (150g)</button>
                    <button onclick="game.selectBuilding('wall')">Wall (20w)</button>
                    <button onclick="game.selectBuilding('gate')">Gate (50g)</button>
                </div>
            </div>
            <button onclick="game.closeBuildMenu()">Cancel</button>
        `;
        
        document.body.appendChild(buildMenu);
    }
    
    selectBuilding(type) {
        if (this.conquestSystem) {
            this.conquestSystem.buildMode = type;
            this.showNotification(`Select location to build ${type}`);
            this.closeBuildMenu();
        }
    }
    
    closeBuildMenu() {
        const menu = document.getElementById('buildMenu');
        if (menu) menu.remove();
    }
    
    assignControlGroup(number) {
        if (this.conquestSystem && this.conquestSystem.selectedUnits.length > 0) {
            this.controlGroups = this.controlGroups || {};
            this.controlGroups[number] = [...this.conquestSystem.selectedUnits];
            this.showNotification(`Assigned control group ${number}`);
        }
    }
    
    selectControlGroup(number) {
        if (this.controlGroups && this.controlGroups[number]) {
            this.conquestSystem.selectedUnits = [...this.controlGroups[number]];
            this.showNotification(`Selected control group ${number}`);
        }
    }
    
    onTouchStart(event) {
        this.controls.touch.active = true;
        // Handle touch controls for mobile
    }
    
    onTouchMove(event) {
        if (this.controls.touch.active) {
            // Handle touch movement
        }
    }
    
    onTouchEnd(event) {
        this.controls.touch.active = false;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setupHUD() {
        // Update HUD with conquest information
        this.updateResourceDisplay();
        this.updateMinimapDisplay();
        setInterval(() => {
            this.updateResourceDisplay();
            this.updateMinimapDisplay();
        }, 100);
    }
    
    updateResourceDisplay() {
        if (this.conquestSystem) {
            const resources = this.conquestSystem.playerFaction.resources;
            
            // Update resource displays
            document.getElementById('gold').textContent = Math.floor(resources.gold);
            document.getElementById('lumber').textContent = Math.floor(resources.lumber);
            document.getElementById('oil').textContent = Math.floor(resources.oil);
            document.getElementById('food').textContent = `${resources.food}/${resources.foodMax}`;
            document.getElementById('population').textContent = `${resources.population}/${resources.populationMax}`;
        }
    }
    
    updateMinimapDisplay() {
        const canvas = document.getElementById('minimapCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw territories
        if (this.conquestSystem) {
            const scale = canvas.width / (10 * this.conquestSystem.territorySize);
            
            this.conquestSystem.territories.forEach(territory => {
                if (territory.owner === 'player') {
                    ctx.fillStyle = '#FF6B00';
                } else if (territory.owner) {
                    ctx.fillStyle = '#880000';
                } else {
                    ctx.fillStyle = '#333333';
                }
                
                ctx.fillRect(
                    territory.x * scale,
                    territory.z * scale,
                    territory.width * scale,
                    territory.height * scale
                );
            });
            
            // Draw units
            this.conquestSystem.playerFaction.units.forEach(unit => {
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(unit.x * scale - 1, unit.z * scale - 1, 2, 2);
            });
            
            // Draw buildings
            this.conquestSystem.playerFaction.buildings.forEach(building => {
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(building.x * scale - 2, building.z * scale - 2, 4, 4);
            });
            
            // Draw camera position
            ctx.strokeStyle = '#FFFFFF';
            ctx.strokeRect(
                (this.camera.position.x - 20) * scale,
                (this.camera.position.z - 20) * scale,
                40 * scale,
                40 * scale
            );
        }
    }
    
    getGroundHeight(x, z) {
        // Get terrain height at position
        // Simplified - would use actual terrain data
        return 30 + Math.sin(x * 0.1) * 5 + Math.cos(z * 0.1) * 5;
    }
    
    showNotification(text, duration = 3000) {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = text;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, duration);
        }
    }
    
    showHelp() {
        this.showNotification('B: Build Menu | Tab: Camera Mode | Ctrl+1-9: Assign Groups | ESC: Settings', 5000);
    }
    
    toggleSettings() {
        const menu = document.getElementById('settingsMenu');
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    openChat() {
        const chatBox = document.getElementById('chatBox');
        if (chatBox) {
            chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
            if (chatBox.style.display === 'block') {
                document.getElementById('chatInput').focus();
            }
        }
    }
    
    updateCamera(deltaTime) {
        if (this.player.cameraMode === 'rts') {
            // RTS camera follows cursor and allows edge scrolling
            const targetY = this.player.cameraHeight;
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, 0.1);
            
            // Look at center of view
            const lookTarget = new THREE.Vector3(
                this.camera.position.x,
                0,
                this.camera.position.z - this.player.cameraDistance
            );
            this.camera.lookAt(lookTarget);
        } else {
            // FPS camera attached to player
            this.camera.position.copy(this.player.position);
            this.camera.position.y += 1.6;
            
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = this.player.rotation.y;
            this.camera.rotation.x = this.player.rotation.x;
        }
    }
    
    update(deltaTime) {
        // Update camera
        this.updateCamera(deltaTime);
        
        // Update conquest system
        if (this.conquestSystem) {
            this.conquestSystem.update(deltaTime);
        }
        
        // Update weather
        if (this.weather) {
            this.weather.update(deltaTime);
        }
        
        // Update stats display
        this.updateStats();
    }
    
    updateStats() {
        // FPS counter
        if (this.frameCount === undefined) {
            this.frameCount = 0;
            this.lastFPSUpdate = performance.now();
        }
        
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSUpdate >= 1000) {
            document.getElementById('fps').textContent = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
        
        // Other stats
        if (this.conquestSystem) {
            const faction = this.conquestSystem.playerFaction;
            document.getElementById('level').textContent = Math.floor(faction.resources.gold / 1000) + 1;
            document.getElementById('xp').textContent = `${faction.resources.gold % 1000} / 1000`;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock ? this.clock.getDelta() : 1/60;
        
        // Update game logic
        this.update(deltaTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Simple terrain system
class TerrainSystem {
    constructor(game) {
        this.game = game;
        this.generateTerrain();
    }
    
    generateTerrain() {
        // Create simple terrain mesh
        const geometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x8B7355,
            wireframe: false
        });
        
        // Add height variation
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.sin(vertices[i] * 0.01) * 10 + Math.cos(vertices[i + 1] * 0.01) * 10;
        }
        
        geometry.computeVertexNormals();
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        
        this.game.scene.add(this.mesh);
    }
}

// Weather system
class WeatherSystem {
    constructor(game) {
        this.game = game;
        this.currentWeather = 'clear';
        this.initWeather();
    }
    
    initWeather() {
        // Particle system for rain/snow
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = Math.random() * 100;
            positions[i + 2] = (Math.random() - 0.5) * 200;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.5,
            transparent: true,
            opacity: 0
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.game.scene.add(this.particles);
    }
    
    setWeather(type) {
        this.currentWeather = type;
        
        switch(type) {
            case 'rain':
                this.particles.material.opacity = 0.6;
                this.game.scene.fog.density = 0.002;
                break;
            case 'storm':
                this.particles.material.opacity = 0.8;
                this.game.scene.fog.density = 0.003;
                break;
            case 'clear':
            default:
                this.particles.material.opacity = 0;
                this.game.scene.fog.density = 0.001;
                break;
        }
    }
    
    update(deltaTime) {
        if (this.currentWeather !== 'clear') {
            // Animate particles
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= deltaTime * 50;
                if (positions[i] < 0) {
                    positions[i] = 100;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }
}

// Make game globally accessible
window.BlazeWorldsChampionship = BlazeWorldsChampionship;
window.ConquestSystem = ConquestSystem;