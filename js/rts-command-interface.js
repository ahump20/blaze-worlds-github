/**
 * RTS Command Interface System
 * Texas Championship Edition - Professional Grade Controls
 *
 * Features:
 * - Control groups (Ctrl+1-9 to set, 1-9 to select)
 * - Multi-unit selection with box select
 * - Smart commands with shift-queueing
 * - Hotkey system for buildings and abilities
 * - Minimap controls and camera bookmarks
 */

class RTSCommandInterface {
    constructor(scene, camera, gameWorld, heroSystem, economySystem) {
        this.scene = scene;
        this.camera = camera;
        this.gameWorld = gameWorld;
        this.heroSystem = heroSystem;
        this.economySystem = economySystem;

        // Selection system
        this.selectedUnits = new Set();
        this.selectedBuilding = null;
        this.selectionBox = null;
        this.isBoxSelecting = false;
        this.boxSelectStart = { x: 0, y: 0 };

        // Control groups (1-9)
        this.controlGroups = new Map();
        for (let i = 1; i <= 9; i++) {
            this.controlGroups.set(i, new Set());
        }

        // Camera bookmarks (F1-F4)
        this.cameraBookmarks = new Map();

        // Command queue system
        this.commandQueue = [];
        this.shiftQueuing = false;

        // Hotkey mappings
        this.hotkeyMap = {
            // Unit commands
            'a': { action: 'attack', name: 'Attack Move' },
            's': { action: 'stop', name: 'Stop' },
            'h': { action: 'hold', name: 'Hold Position' },
            'p': { action: 'patrol', name: 'Patrol' },
            'm': { action: 'move', name: 'Move' },

            // Building hotkeys
            'q': { building: 'barracks', name: 'Build Barracks' },
            'w': { building: 'lumberMill', name: 'Build Lumber Mill' },
            'e': { building: 'quarry', name: 'Build Quarry' },
            'r': { building: 'ranch', name: 'Build Ranch' },
            't': { building: 'watchtower', name: 'Build Watchtower' },
            'y': { building: 'marketplace', name: 'Build Marketplace' },

            // Hero abilities (Q,W,E,R pattern)
            'Q': { ability: 0, name: 'Hero Ability 1' },
            'W': { ability: 1, name: 'Hero Ability 2' },
            'E': { ability: 2, name: 'Hero Ability 3' },
            'R': { ability: 3, name: 'Ultimate Ability' },

            // Camera controls
            'space': { action: 'center_selection', name: 'Center on Selection' },
            'backspace': { action: 'cycle_bases', name: 'Cycle Town Halls' },
            'tab': { action: 'cycle_units', name: 'Cycle Through Units' },

            // Special commands
            'delete': { action: 'destroy', name: 'Destroy Selected' },
            'escape': { action: 'cancel', name: 'Cancel' }
        };

        // UI Elements
        this.commandPanel = null;
        this.selectionDisplay = null;
        this.minimapControls = null;
        this.hotkeyHelper = null;

        // Mouse state
        this.mouseState = {
            position: { x: 0, y: 0 },
            worldPosition: null,
            hoveredUnit: null,
            hoveredBuilding: null,
            rightClickDrag: false,
            middleClickDrag: false
        };

        // Minimap state
        this.minimapSize = { width: 250, height: 200 };
        this.minimapCanvas = null;
        this.minimapContext = null;

        // Rally points and waypoints
        this.rallyPoints = new Map();
        this.waypoints = [];

        // Command feedback
        this.commandCursors = {
            default: 'crosshair',
            move: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Cpath d=\'M16 2L30 16L16 30L2 16Z\' fill=\'%2300ff00\' stroke=\'%23000\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, pointer',
            attack: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'14\' fill=\'none\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'16\' y1=\'2\' x2=\'16\' y2=\'30\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3Cline x1=\'2\' y1=\'16\' x2=\'30\' y2=\'16\' stroke=\'%23ff0000\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, crosshair',
            build: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Crect x=\'4\' y=\'4\' width=\'24\' height=\'24\' fill=\'%2300ff00\' opacity=\'0.5\' stroke=\'%2300ff00\' stroke-width=\'2\'/%3E%3C/svg%3E") 16 16, pointer'
        };

        this.init();
    }

    init() {
        this.createCommandPanel();
        this.createSelectionDisplay();
        this.createMinimapControls();
        this.createHotkeyHelper();
        this.setupEventListeners();
        this.initSelectionBox();

        console.log('🎮 RTS Command Interface initialized');
        console.log('⌨️ Hotkeys active - Press F1 for help');
    }

    createCommandPanel() {
        const panel = document.createElement('div');
        panel.className = 'rts-command-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            background: linear-gradient(135deg, rgba(0, 34, 68, 0.95), rgba(191, 87, 0, 0.2));
            border: 2px solid #BF5700;
            border-radius: 8px;
            padding: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(191, 87, 0, 0.3);
            z-index: 1000;
        `;

        panel.innerHTML = `
            <div style="color: #BF5700; font-weight: bold; margin-bottom: 10px; text-align: center;">
                COMMAND CENTER
            </div>
            <div id="commandGrid" style="
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 10px;
            "></div>
            <div id="unitInfo" style="
                border-top: 1px solid #BF5700;
                padding-top: 10px;
                color: #9BCBEB;
                font-size: 12px;
            ">
                No units selected
            </div>
        `;

        this.commandPanel = panel;
        document.body.appendChild(panel);
        this.updateCommandPanel();
    }

    createSelectionDisplay() {
        const display = document.createElement('div');
        display.className = 'rts-selection-display';
        display.style.cssText = `
            position: fixed;
            top: 140px;
            left: 20px;
            background: rgba(0, 34, 68, 0.95);
            border: 2px solid #BF5700;
            border-radius: 8px;
            padding: 10px;
            min-width: 200px;
            backdrop-filter: blur(5px);
            z-index: 1000;
            display: none;
        `;

        this.selectionDisplay = display;
        document.body.appendChild(display);
    }

    createMinimapControls() {
        // Enhanced minimap with clickable areas
        const minimapCanvas = document.getElementById('texasMinimap');
        if (minimapCanvas) {
            this.minimapCanvas = minimapCanvas;
            this.minimapContext = minimapCanvas.getContext('2d');

            // Add click handler for minimap navigation
            minimapCanvas.addEventListener('click', (e) => {
                const rect = minimapCanvas.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width - 0.5) * 200;
                const z = ((e.clientY - rect.top) / rect.height - 0.5) * 200;
                this.moveCamera({ x, y: this.camera.position.y, z });
            });

            // Update minimap periodically
            setInterval(() => this.updateMinimap(), 100);
        }
    }

    createHotkeyHelper() {
        const helper = document.createElement('div');
        helper.className = 'rts-hotkey-helper';
        helper.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 34, 68, 0.98);
            border: 3px solid #BF5700;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            backdrop-filter: blur(10px);
            z-index: 2000;
            display: none;
            box-shadow: 0 8px 32px rgba(191, 87, 0, 0.5);
        `;

        const hotkeyCategories = {
            'Unit Control': [
                '1-9: Select control group',
                'Ctrl+1-9: Set control group',
                'A: Attack move',
                'S: Stop',
                'H: Hold position',
                'M: Move'
            ],
            'Hero Abilities': [
                'Q: First ability',
                'W: Second ability',
                'E: Third ability',
                'R: Ultimate ability'
            ],
            'Building': [
                'B: Open build menu',
                'Q: Barracks',
                'W: Lumber Mill',
                'E: Quarry',
                'R: Ranch',
                'T: Watchtower'
            ],
            'Camera': [
                'Space: Center on selection',
                'F1-F4: Camera bookmarks',
                'Ctrl+F1-F4: Set bookmark',
                'Backspace: Cycle town halls',
                'Tab: Cycle units'
            ],
            'Advanced': [
                'Shift+Click: Queue commands',
                'Ctrl+A: Select all units',
                'Double-click: Select all of type',
                'Alt+Click: Smart command',
                'Delete: Destroy selected'
            ]
        };

        let helperHTML = `
            <div style="color: #BF5700; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
                CHAMPIONSHIP HOTKEYS
            </div>
        `;

        Object.entries(hotkeyCategories).forEach(([category, hotkeys]) => {
            helperHTML += `
                <div style="margin-bottom: 20px;">
                    <div style="color: #FFD700; font-weight: bold; margin-bottom: 10px; font-size: 16px;">
                        ${category}
                    </div>
                    ${hotkeys.map(hotkey => {
                        const [key, desc] = hotkey.split(':');
                        return `
                            <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #9BCBEB;">
                                <span style="background: rgba(155, 203, 235, 0.2); padding: 2px 8px; border-radius: 4px; font-family: monospace;">
                                    ${key}
                                </span>
                                <span style="flex: 1; margin-left: 15px;">${desc}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });

        helperHTML += `
            <div style="text-align: center; margin-top: 20px; color: #808080; font-size: 12px;">
                Press F1 to toggle this help • ESC to close
            </div>
        `;

        helper.innerHTML = helperHTML;
        this.hotkeyHelper = helper;
        document.body.appendChild(helper);
    }

    initSelectionBox() {
        // Create selection box element for box selection
        const box = document.createElement('div');
        box.className = 'rts-selection-box';
        box.style.cssText = `
            position: fixed;
            border: 2px solid #00ff00;
            background: rgba(0, 255, 0, 0.1);
            pointer-events: none;
            display: none;
            z-index: 999;
        `;
        this.selectionBox = box;
        document.body.appendChild(box);
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse events
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        window.addEventListener('dblclick', (e) => this.handleDoubleClick(e));

        // Wheel for zoom
        window.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    handleKeyDown(event) {
        const key = event.key;
        const ctrl = event.ctrlKey;
        const shift = event.shiftKey;
        const alt = event.altKey;

        // F1 - Toggle help
        if (key === 'F1') {
            event.preventDefault();
            this.toggleHotkeyHelper();
            return;
        }

        // ESC - Cancel/Close
        if (key === 'Escape') {
            if (this.hotkeyHelper.style.display !== 'none') {
                this.hotkeyHelper.style.display = 'none';
            } else {
                this.cancelCurrentAction();
            }
            return;
        }

        // Control groups (1-9)
        if (key >= '1' && key <= '9') {
            const groupNum = parseInt(key);
            if (ctrl) {
                // Set control group
                this.setControlGroup(groupNum);
            } else {
                // Select control group
                this.selectControlGroup(groupNum);
            }
            return;
        }

        // Camera bookmarks (F1-F4)
        if (key.startsWith('F') && key.length === 2) {
            const bookmarkNum = parseInt(key.substring(1));
            if (bookmarkNum >= 1 && bookmarkNum <= 4) {
                event.preventDefault();
                if (ctrl) {
                    this.setCameraBookmark(bookmarkNum);
                } else if (bookmarkNum === 1) {
                    this.toggleHotkeyHelper();
                } else {
                    this.loadCameraBookmark(bookmarkNum);
                }
            }
            return;
        }

        // Shift for queuing
        if (key === 'Shift') {
            this.shiftQueuing = true;
        }

        // Hotkey commands
        const hotkey = this.hotkeyMap[key];
        if (hotkey) {
            event.preventDefault();
            this.executeHotkey(hotkey, { ctrl, shift, alt });
        }

        // Select all units (Ctrl+A)
        if (ctrl && key === 'a') {
            event.preventDefault();
            this.selectAllUnits();
        }
    }

    handleKeyUp(event) {
        if (event.key === 'Shift') {
            this.shiftQueuing = false;
        }
    }

    handleMouseDown(event) {
        if (event.button === 0) { // Left click
            const ctrl = event.ctrlKey;
            const shift = event.shiftKey;

            // Start box selection
            this.isBoxSelecting = true;
            this.boxSelectStart = { x: event.clientX, y: event.clientY };

            // Single click selection (will be cancelled if drag starts)
            this.pendingClick = setTimeout(() => {
                if (this.isBoxSelecting && !this.boxMoved) {
                    this.handleSingleClick(event, { ctrl, shift });
                }
            }, 200);

        } else if (event.button === 1) { // Middle click
            this.mouseState.middleClickDrag = true;
            this.lastMiddleClick = { x: event.clientX, y: event.clientY };

        } else if (event.button === 2) { // Right click
            // Handled in handleRightClick
        }
    }

    handleMouseMove(event) {
        this.mouseState.position = { x: event.clientX, y: event.clientY };

        // Update world position
        this.updateWorldPosition(event);

        // Box selection
        if (this.isBoxSelecting && event.buttons === 1) {
            this.boxMoved = true;
            clearTimeout(this.pendingClick);
            this.updateSelectionBox(event);
        }

        // Middle click drag for camera pan
        if (this.mouseState.middleClickDrag && event.buttons === 4) {
            const deltaX = event.clientX - this.lastMiddleClick.x;
            const deltaY = event.clientY - this.lastMiddleClick.y;
            this.panCamera(deltaX, deltaY);
            this.lastMiddleClick = { x: event.clientX, y: event.clientY };
        }

        // Update cursor based on hover
        this.updateCursor(event);
    }

    handleMouseUp(event) {
        if (event.button === 0 && this.isBoxSelecting) {
            // Complete box selection
            if (this.boxMoved) {
                this.completeBoxSelection(event);
            }
            this.isBoxSelecting = false;
            this.boxMoved = false;
            this.selectionBox.style.display = 'none';

        } else if (event.button === 1) {
            this.mouseState.middleClickDrag = false;
        }
    }

    handleRightClick(event) {
        event.preventDefault();

        const worldPos = this.getWorldPosition(event);
        if (!worldPos) return;

        // Smart command based on context
        if (this.selectedUnits.size > 0) {
            const target = this.getTargetAtPosition(worldPos);

            if (target) {
                if (target.type === 'enemy') {
                    this.issueAttackCommand(target, this.shiftQueuing);
                } else if (target.type === 'resource') {
                    this.issueGatherCommand(target, this.shiftQueuing);
                } else if (target.type === 'building' && target.owner === 'player') {
                    this.issueRepairCommand(target, this.shiftQueuing);
                }
            } else {
                // Move command
                this.issueMoveCommand(worldPos, this.shiftQueuing);
            }

            // Show command feedback
            this.showCommandFeedback(worldPos, 'move');
        }
    }

    handleDoubleClick(event) {
        // Select all units of the same type
        const target = this.getTargetAtPosition(this.getWorldPosition(event));
        if (target && target.type === 'unit') {
            this.selectAllOfType(target.unitType);
        }
    }

    handleWheel(event) {
        // Camera zoom
        const zoomSpeed = 0.1;
        const delta = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

        if (this.camera.fov) {
            this.camera.fov = Math.max(30, Math.min(90, this.camera.fov * delta));
            this.camera.updateProjectionMatrix();
        }
    }

    handleSingleClick(event, modifiers) {
        const worldPos = this.getWorldPosition(event);
        const target = this.getTargetAtPosition(worldPos);

        if (target) {
            if (modifiers.ctrl) {
                // Add to selection
                if (target.type === 'unit') {
                    this.addToSelection(target);
                }
            } else if (modifiers.shift) {
                // Smart select (all between)
                if (target.type === 'unit') {
                    this.smartSelect(target);
                }
            } else {
                // Replace selection
                this.clearSelection();
                if (target.type === 'unit') {
                    this.addToSelection(target);
                } else if (target.type === 'building') {
                    this.selectBuilding(target);
                }
            }
        } else if (!modifiers.ctrl && !modifiers.shift) {
            // Clear selection when clicking empty space
            this.clearSelection();
        }

        this.updateSelectionDisplay();
    }

    updateSelectionBox(event) {
        const startX = Math.min(this.boxSelectStart.x, event.clientX);
        const startY = Math.min(this.boxSelectStart.y, event.clientY);
        const width = Math.abs(event.clientX - this.boxSelectStart.x);
        const height = Math.abs(event.clientY - this.boxSelectStart.y);

        this.selectionBox.style.left = startX + 'px';
        this.selectionBox.style.top = startY + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
        this.selectionBox.style.display = 'block';
    }

    completeBoxSelection(event) {
        const box = {
            x1: Math.min(this.boxSelectStart.x, event.clientX),
            y1: Math.min(this.boxSelectStart.y, event.clientY),
            x2: Math.max(this.boxSelectStart.x, event.clientX),
            y2: Math.max(this.boxSelectStart.y, event.clientY)
        };

        // Clear previous selection unless ctrl is held
        if (!event.ctrlKey) {
            this.clearSelection();
        }

        // Select all units within box
        if (this.heroSystem) {
            this.heroSystem.heroes.forEach(hero => {
                const screenPos = this.worldToScreen(hero.mesh.position);
                if (screenPos &&
                    screenPos.x >= box.x1 && screenPos.x <= box.x2 &&
                    screenPos.y >= box.y1 && screenPos.y <= box.y2) {
                    this.addToSelection(hero);
                }
            });

            this.heroSystem.units.forEach(unit => {
                const screenPos = this.worldToScreen(unit.mesh.position);
                if (screenPos &&
                    screenPos.x >= box.x1 && screenPos.x <= box.x2 &&
                    screenPos.y >= box.y1 && screenPos.y <= box.y2) {
                    this.addToSelection(unit);
                }
            });
        }

        this.updateSelectionDisplay();
    }

    worldToScreen(worldPos) {
        const vector = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
        vector.project(this.camera);

        const x = (vector.x + 1) * window.innerWidth / 2;
        const y = (-vector.y + 1) * window.innerHeight / 2;

        // Check if position is in front of camera
        if (vector.z > 1) return null;

        return { x, y };
    }

    getWorldPosition(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        // Intersect with ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(groundPlane, intersection);

        return intersection;
    }

    getTargetAtPosition(worldPos) {
        if (!worldPos) return null;

        // Check for units at position
        if (this.heroSystem) {
            // Check heroes
            for (const hero of this.heroSystem.heroes) {
                const distance = hero.mesh.position.distanceTo(worldPos);
                if (distance < 2) {
                    return { type: 'unit', unit: hero, unitType: 'hero' };
                }
            }

            // Check units
            for (const unit of this.heroSystem.units) {
                const distance = unit.mesh.position.distanceTo(worldPos);
                if (distance < 1.5) {
                    return { type: 'unit', unit: unit, unitType: unit.type };
                }
            }
        }

        // Check for buildings at position
        if (this.economySystem) {
            for (const building of this.economySystem.buildings) {
                const distance = building.mesh.position.distanceTo(worldPos);
                const buildingData = this.economySystem.buildingTypes[building.type];
                const maxDist = Math.max(buildingData.size.x, buildingData.size.z) / 2 + 1;

                if (distance < maxDist) {
                    return {
                        type: 'building',
                        building: building,
                        owner: 'player' // TODO: Add ownership system
                    };
                }
            }
        }

        return null;
    }

    addToSelection(unit) {
        this.selectedUnits.add(unit);

        // Add selection indicator
        if (unit.mesh && !unit.selectionIndicator) {
            const geometry = new THREE.RingGeometry(1.2, 1.5, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            unit.selectionIndicator = new THREE.Mesh(geometry, material);
            unit.selectionIndicator.rotation.x = -Math.PI / 2;
            unit.mesh.add(unit.selectionIndicator);
        }
    }

    clearSelection() {
        // Remove selection indicators
        this.selectedUnits.forEach(unit => {
            if (unit.selectionIndicator) {
                unit.mesh.remove(unit.selectionIndicator);
                unit.selectionIndicator = null;
            }
        });

        this.selectedUnits.clear();
        this.selectedBuilding = null;
        this.updateSelectionDisplay();
    }

    selectBuilding(building) {
        this.clearSelection();
        this.selectedBuilding = building;
        this.updateSelectionDisplay();
    }

    selectAllUnits() {
        this.clearSelection();

        if (this.heroSystem) {
            this.heroSystem.heroes.forEach(hero => this.addToSelection(hero));
            this.heroSystem.units.forEach(unit => this.addToSelection(unit));
        }

        this.updateSelectionDisplay();
    }

    selectAllOfType(unitType) {
        this.clearSelection();

        if (this.heroSystem) {
            if (unitType === 'hero') {
                this.heroSystem.heroes.forEach(hero => this.addToSelection(hero));
            } else {
                this.heroSystem.units.forEach(unit => {
                    if (unit.type === unitType) {
                        this.addToSelection(unit);
                    }
                });
            }
        }

        this.updateSelectionDisplay();
    }

    setControlGroup(groupNum) {
        this.controlGroups.set(groupNum, new Set(this.selectedUnits));
        console.log(`📋 Control group ${groupNum} set with ${this.selectedUnits.size} units`);
        this.showNotification(`Control Group ${groupNum} Set`);
    }

    selectControlGroup(groupNum) {
        const group = this.controlGroups.get(groupNum);
        if (group && group.size > 0) {
            this.clearSelection();
            group.forEach(unit => {
                if (unit.hp > 0) { // Only select living units
                    this.addToSelection(unit);
                }
            });
            this.updateSelectionDisplay();

            // Double tap to center
            if (this.lastGroupSelect === groupNum && Date.now() - this.lastGroupSelectTime < 500) {
                this.centerCameraOnSelection();
            }
            this.lastGroupSelect = groupNum;
            this.lastGroupSelectTime = Date.now();
        }
    }

    setCameraBookmark(bookmarkNum) {
        this.cameraBookmarks.set(bookmarkNum, {
            position: this.camera.position.clone(),
            rotation: this.camera.rotation.clone()
        });
        this.showNotification(`Camera Position ${bookmarkNum} Saved`);
    }

    loadCameraBookmark(bookmarkNum) {
        const bookmark = this.cameraBookmarks.get(bookmarkNum);
        if (bookmark) {
            this.camera.position.copy(bookmark.position);
            this.camera.rotation.copy(bookmark.rotation);
        }
    }

    centerCameraOnSelection() {
        if (this.selectedUnits.size > 0) {
            const center = new THREE.Vector3();
            let count = 0;

            this.selectedUnits.forEach(unit => {
                if (unit.mesh) {
                    center.add(unit.mesh.position);
                    count++;
                }
            });

            if (count > 0) {
                center.divideScalar(count);
                this.moveCamera(center);
            }
        }
    }

    moveCamera(position) {
        // Smooth camera movement
        const startPos = this.camera.position.clone();
        const endPos = new THREE.Vector3(position.x, this.camera.position.y, position.z + 10);
        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutQuad(progress);

            this.camera.position.lerpVectors(startPos, endPos, eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    panCamera(deltaX, deltaY) {
        const panSpeed = 0.5;
        this.camera.position.x -= deltaX * panSpeed;
        this.camera.position.z -= deltaY * panSpeed;
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    executeHotkey(hotkey, modifiers) {
        if (hotkey.action) {
            this.executeAction(hotkey.action, modifiers);
        } else if (hotkey.building) {
            this.startBuildingPlacement(hotkey.building);
        } else if (hotkey.ability !== undefined) {
            this.executeAbility(hotkey.ability);
        }
    }

    executeAction(action, modifiers) {
        switch (action) {
            case 'attack':
                document.body.style.cursor = this.commandCursors.attack;
                this.pendingCommand = 'attack';
                break;
            case 'move':
                document.body.style.cursor = this.commandCursors.move;
                this.pendingCommand = 'move';
                break;
            case 'stop':
                this.issueStopCommand();
                break;
            case 'hold':
                this.issueHoldCommand();
                break;
            case 'patrol':
                document.body.style.cursor = this.commandCursors.move;
                this.pendingCommand = 'patrol';
                break;
            case 'center_selection':
                this.centerCameraOnSelection();
                break;
            case 'cycle_bases':
                this.cycleTownHalls();
                break;
            case 'cycle_units':
                this.cycleUnits();
                break;
            case 'destroy':
                this.destroySelected();
                break;
            case 'cancel':
                this.cancelCurrentAction();
                break;
        }
    }

    startBuildingPlacement(buildingType) {
        if (this.economySystem) {
            this.economySystem.startBuildingPlacement(buildingType);
            document.body.style.cursor = this.commandCursors.build;
        }
    }

    executeAbility(abilityIndex) {
        if (this.selectedUnits.size === 0) return;

        this.selectedUnits.forEach(unit => {
            if (unit.abilities && unit.abilities[abilityIndex]) {
                const ability = unit.abilities[abilityIndex];
                if (this.heroSystem) {
                    this.heroSystem.useAbility(unit, abilityIndex);
                    this.showNotification(`${ability.name} Activated!`);
                }
            }
        });
    }

    issueMoveCommand(position, queued = false) {
        if (this.selectedUnits.size === 0) return;

        this.selectedUnits.forEach(unit => {
            if (this.heroSystem) {
                this.heroSystem.issueCommand(unit, {
                    type: 'move',
                    target: position,
                    queued: queued
                });
            }
        });
    }

    issueAttackCommand(target, queued = false) {
        if (this.selectedUnits.size === 0) return;

        this.selectedUnits.forEach(unit => {
            if (this.heroSystem) {
                this.heroSystem.issueCommand(unit, {
                    type: 'attack',
                    target: target.unit || target.building,
                    queued: queued
                });
            }
        });
    }

    issueStopCommand() {
        if (this.selectedUnits.size === 0) return;

        this.selectedUnits.forEach(unit => {
            if (this.heroSystem) {
                this.heroSystem.issueCommand(unit, { type: 'stop' });
            }
        });

        this.showNotification('Units Stopped');
    }

    issueHoldCommand() {
        if (this.selectedUnits.size === 0) return;

        this.selectedUnits.forEach(unit => {
            if (this.heroSystem) {
                this.heroSystem.issueCommand(unit, { type: 'hold' });
            }
        });

        this.showNotification('Hold Position');
    }

    cycleTownHalls() {
        if (!this.economySystem) return;

        const townHalls = this.economySystem.buildings.filter(b =>
            b.type === 'townHall' && b.constructionProgress >= 100
        );

        if (townHalls.length === 0) return;

        this.currentTownHallIndex = (this.currentTownHallIndex || 0) + 1;
        if (this.currentTownHallIndex >= townHalls.length) {
            this.currentTownHallIndex = 0;
        }

        const townHall = townHalls[this.currentTownHallIndex];
        this.moveCamera(townHall.position);
        this.selectBuilding(townHall);
    }

    cycleUnits() {
        if (this.heroSystem) {
            const allUnits = [...this.heroSystem.heroes, ...this.heroSystem.units];
            if (allUnits.length === 0) return;

            this.currentUnitIndex = (this.currentUnitIndex || 0) + 1;
            if (this.currentUnitIndex >= allUnits.length) {
                this.currentUnitIndex = 0;
            }

            const unit = allUnits[this.currentUnitIndex];
            this.clearSelection();
            this.addToSelection(unit);
            this.centerCameraOnSelection();
            this.updateSelectionDisplay();
        }
    }

    destroySelected() {
        // Confirmation required for destroying own units/buildings
        if (this.selectedUnits.size > 0 || this.selectedBuilding) {
            if (confirm('Destroy selected units/buildings?')) {
                this.selectedUnits.forEach(unit => {
                    if (this.heroSystem) {
                        this.heroSystem.destroyUnit(unit);
                    }
                });

                if (this.selectedBuilding && this.economySystem) {
                    this.economySystem.destroyBuilding(this.selectedBuilding);
                }

                this.clearSelection();
            }
        }
    }

    cancelCurrentAction() {
        this.pendingCommand = null;
        document.body.style.cursor = this.commandCursors.default;

        if (this.economySystem && this.economySystem.placementMode?.active) {
            this.economySystem.cancelBuildingPlacement();
        }
    }

    updateCursor(event) {
        if (this.pendingCommand) {
            return; // Keep special cursor for pending commands
        }

        const target = this.getTargetAtPosition(this.getWorldPosition(event));
        if (target) {
            if (target.type === 'enemy') {
                document.body.style.cursor = this.commandCursors.attack;
            } else {
                document.body.style.cursor = 'pointer';
            }
        } else {
            document.body.style.cursor = this.commandCursors.default;
        }
    }

    showCommandFeedback(position, type) {
        // Visual feedback for commands
        const geometry = new THREE.RingGeometry(0.5, 1, 32);
        const material = new THREE.MeshBasicMaterial({
            color: type === 'move' ? 0x00ff00 : 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(position);
        ring.position.y += 0.1;

        this.scene.add(ring);

        // Animate and remove
        const animate = () => {
            ring.scale.x += 0.05;
            ring.scale.z += 0.05;
            ring.material.opacity -= 0.03;

            if (ring.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
            }
        };
        animate();
    }

    updateSelectionDisplay() {
        if (this.selectedUnits.size > 0) {
            let displayHTML = `
                <div style="color: #BF5700; font-weight: bold; margin-bottom: 10px;">
                    SELECTED (${this.selectedUnits.size})
                </div>
            `;

            // Group units by type
            const unitGroups = new Map();
            this.selectedUnits.forEach(unit => {
                const type = unit.type || 'hero';
                if (!unitGroups.has(type)) {
                    unitGroups.set(type, []);
                }
                unitGroups.get(type).push(unit);
            });

            unitGroups.forEach((units, type) => {
                displayHTML += `
                    <div style="color: #9BCBEB; margin: 5px 0;">
                        ${type}: ${units.length}
                    </div>
                `;
            });

            this.selectionDisplay.innerHTML = displayHTML;
            this.selectionDisplay.style.display = 'block';

        } else if (this.selectedBuilding) {
            const buildingData = this.economySystem.buildingTypes[this.selectedBuilding.type];
            this.selectionDisplay.innerHTML = `
                <div style="color: #BF5700; font-weight: bold; margin-bottom: 10px;">
                    ${buildingData.name}
                </div>
                <div style="color: #9BCBEB; font-size: 12px;">
                    HP: ${this.selectedBuilding.hp}/${this.selectedBuilding.maxHp}<br>
                    ${this.selectedBuilding.constructionProgress < 100 ?
                        `Building: ${Math.floor(this.selectedBuilding.constructionProgress)}%` :
                        'Complete'}
                </div>
            `;
            this.selectionDisplay.style.display = 'block';

        } else {
            this.selectionDisplay.style.display = 'none';
        }

        this.updateCommandPanel();
    }

    updateCommandPanel() {
        const grid = document.getElementById('commandGrid');
        const info = document.getElementById('unitInfo');

        if (!grid || !info) return;

        // Clear grid
        grid.innerHTML = '';

        if (this.selectedUnits.size > 0) {
            // Show unit commands
            const commands = [
                { key: 'A', icon: '⚔️', name: 'Attack' },
                { key: 'M', icon: '👣', name: 'Move' },
                { key: 'S', icon: '✋', name: 'Stop' },
                { key: 'H', icon: '🛡️', name: 'Hold' }
            ];

            commands.forEach(cmd => {
                const button = document.createElement('button');
                button.style.cssText = `
                    background: rgba(155, 203, 235, 0.2);
                    border: 1px solid #9BCBEB;
                    border-radius: 4px;
                    color: #9BCBEB;
                    padding: 10px;
                    cursor: pointer;
                    font-size: 14px;
                    text-align: center;
                `;
                button.innerHTML = `
                    <div style="font-size: 20px;">${cmd.icon}</div>
                    <div style="font-size: 10px; margin-top: 2px;">${cmd.name} (${cmd.key})</div>
                `;
                button.onclick = () => this.executeHotkey({ action: cmd.name.toLowerCase() }, {});
                grid.appendChild(button);
            });

            // Show unit info
            const firstUnit = Array.from(this.selectedUnits)[0];
            info.innerHTML = `
                Selected: ${this.selectedUnits.size} unit(s)<br>
                ${firstUnit.level ? `Level ${firstUnit.level} ${firstUnit.type || 'Hero'}` : ''}
            `;

        } else if (this.selectedBuilding) {
            // Show building info
            const buildingData = this.economySystem.buildingTypes[this.selectedBuilding.type];
            info.innerHTML = `
                ${buildingData.name}<br>
                ${buildingData.description}
            `;
        } else {
            info.innerHTML = 'No units selected';
        }
    }

    updateMinimap() {
        if (!this.minimapContext) return;

        const ctx = this.minimapContext;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;

        // Clear minimap
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);

        // Draw terrain (simplified)
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // Draw buildings
        if (this.economySystem) {
            this.economySystem.buildings.forEach(building => {
                const x = (building.position.x / 200 + 0.5) * width;
                const z = (building.position.z / 200 + 0.5) * height;

                ctx.fillStyle = building.constructionProgress >= 100 ? '#BF5700' : '#808080';
                ctx.fillRect(x - 2, z - 2, 4, 4);
            });
        }

        // Draw units
        if (this.heroSystem) {
            // Heroes
            this.heroSystem.heroes.forEach(hero => {
                const x = (hero.mesh.position.x / 200 + 0.5) * width;
                const z = (hero.mesh.position.z / 200 + 0.5) * height;

                ctx.fillStyle = this.selectedUnits.has(hero) ? '#00ff00' : '#9BCBEB';
                ctx.beginPath();
                ctx.arc(x, z, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Units
            this.heroSystem.units.forEach(unit => {
                const x = (unit.mesh.position.x / 200 + 0.5) * width;
                const z = (unit.mesh.position.z / 200 + 0.5) * height;

                ctx.fillStyle = this.selectedUnits.has(unit) ? '#00ff00' : '#FFD700';
                ctx.fillRect(x - 1, z - 1, 2, 2);
            });
        }

        // Draw camera viewport
        const camX = (this.camera.position.x / 200 + 0.5) * width;
        const camZ = (this.camera.position.z / 200 + 0.5) * height;

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(camX - 15, camZ - 12, 30, 24);
    }

    toggleHotkeyHelper() {
        const isVisible = this.hotkeyHelper.style.display !== 'none';
        this.hotkeyHelper.style.display = isVisible ? 'none' : 'block';
    }

    showNotification(text, duration = 2000) {
        // Use game's notification system if available
        if (this.gameWorld && this.gameWorld.showChampionshipNotification) {
            this.gameWorld.showChampionshipNotification(text, duration);
        } else {
            console.log(`📢 ${text}`);
        }
    }

    destroy() {
        // Cleanup
        this.clearSelection();

        if (this.commandPanel) this.commandPanel.remove();
        if (this.selectionDisplay) this.selectionDisplay.remove();
        if (this.hotkeyHelper) this.hotkeyHelper.remove();
        if (this.selectionBox) this.selectionBox.remove();

        // Remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('contextmenu', this.handleRightClick);
        window.removeEventListener('dblclick', this.handleDoubleClick);
        window.removeEventListener('wheel', this.handleWheel);

        console.log('🎮 RTS Command Interface destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RTSCommandInterface;
}