/**
 * Blaze Intelligence Vision Engine Dashboard
 * Championship-Level Real-Time Visualization
 */

class VisionDashboard {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.skeleton = null;
        this.socket = null;
        this.currentFrame = 0;
        this.sessionData = null;
        this.timeline = [];
        this.isPlaying = false;

        this.init();
    }

    async init() {
        // Initialize 3D visualization
        this.init3D();

        // Initialize WebSocket connection
        this.initWebSocket();

        // Initialize charts
        this.initCharts();

        // Load session data
        await this.loadSession();

        // Hide loading overlay
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'none';
        }, 1500);

        // Start animation loop
        this.animate();
    }

    init3D() {
        const container = document.getElementById('biomech-3d');
        const width = container.offsetWidth;
        const height = 500;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = null;
        this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add grid for reference
        const gridHelper = new THREE.GridHelper(20, 20, 0xBF5700, 0x303030);
        this.scene.add(gridHelper);

        // Create skeleton visualization
        this.createSkeleton();

        // Add controls
        this.addControls();
    }

    createSkeleton() {
        // MediaPipe pose landmarks connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
            [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
            [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
            [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
        ];

        // Create joint spheres
        this.joints = [];
        const jointGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const jointMaterial = new THREE.MeshPhongMaterial({
            color: 0x9BCBEB,
            emissive: 0x9BCBEB,
            emissiveIntensity: 0.2
        });

        for (let i = 0; i < 33; i++) {
            const joint = new THREE.Mesh(jointGeometry, jointMaterial.clone());
            joint.position.set(
                Math.random() * 2 - 1,
                Math.random() * 3,
                Math.random() * 2 - 1
            );
            this.scene.add(joint);
            this.joints.push(joint);
        }

        // Create bones (connections)
        this.bones = [];
        const boneGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1);
        const boneMaterial = new THREE.MeshPhongMaterial({
            color: 0xBF5700,
            emissive: 0xBF5700,
            emissiveIntensity: 0.1
        });

        connections.forEach(([start, end]) => {
            const bone = new THREE.Mesh(boneGeometry, boneMaterial.clone());
            this.scene.add(bone);
            this.bones.push({ bone, start, end });
        });

        // Add force vectors
        this.forceVectors = [];
        const arrowHelper = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            2,
            0x00ff00
        );
        this.scene.add(arrowHelper);
        this.forceVectors.push(arrowHelper);
    }

    addControls() {
        // Mouse controls for camera rotation
        let mouseX = 0, mouseY = 0;
        const container = document.getElementById('biomech-3d');

        container.addEventListener('mousemove', (event) => {
            const rect = container.getBoundingClientRect();
            mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });

        // Update camera position based on mouse
        setInterval(() => {
            this.camera.position.x += (mouseX * 10 - this.camera.position.x) * 0.05;
            this.camera.position.y += (mouseY * 5 + 5 - this.camera.position.y) * 0.05;
            this.camera.lookAt(0, 0, 0);
        }, 16);
    }

    initWebSocket() {
        // Connect to real-time updates
        const wsUrl = window.location.hostname === 'localhost'
            ? 'ws://localhost:3000'
            : 'wss://api.blaze-intelligence.com';

        this.socket = io(wsUrl);

        this.socket.on('connect', () => {
            console.log('🔌 Connected to Vision Engine');
        });

        this.socket.on('frame_update', (data) => {
            this.updateFrame(data);
        });

        this.socket.on('analysis_complete', (data) => {
            this.handleAnalysisComplete(data);
        });

        this.socket.on('critical_moment', (data) => {
            this.addCriticalMoment(data);
        });
    }

    initCharts() {
        // Championship Ring Chart
        const canvas = document.getElementById('championshipRing');
        const ctx = canvas.getContext('2d');

        this.drawChampionshipRing(ctx, 0);

        // Timeline Chart
        const timelineCanvas = document.getElementById('timeline');
        const timelineCtx = timelineCanvas.getContext('2d');

        this.drawTimeline(timelineCtx);
    }

    drawChampionshipRing(ctx, value) {
        const centerX = 100;
        const centerY = 100;
        const radius = 80;

        // Clear canvas
        ctx.clearRect(0, 0, 200, 200);

        // Background ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 20;
        ctx.stroke();

        // Progress ring
        const angle = (value / 100) * 2 * Math.PI - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);

        // Gradient for ring
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#BF5700');
        gradient.addColorStop(1, '#FF6B35');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glow effect
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 20;
        ctx.stroke();
    }

    drawTimeline(ctx) {
        const width = 800;
        const height = 150;

        ctx.clearRect(0, 0, width, height);

        // Draw timeline base
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw timeline data if available
        if (this.timeline.length > 0) {
            // Efficiency line
            ctx.strokeStyle = '#9BCBEB';
            ctx.lineWidth = 2;
            ctx.beginPath();

            this.timeline.forEach((frame, index) => {
                const x = (index / this.timeline.length) * width;
                const y = height - (frame.biomechanics?.efficiency || 0) * height / 100;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Composure line
            ctx.strokeStyle = '#FF6B35';
            ctx.beginPath();

            this.timeline.forEach((frame, index) => {
                const x = (index / this.timeline.length) * width;
                const y = height - (frame.behavioral?.composure || 0) * height / 100;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        }
    }

    async loadSession() {
        // Get session ID from URL params or use demo
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session') || 'demo';

        try {
            // Fetch session data
            const response = await fetch(`/api/analysis/${sessionId}`);
            const data = await response.json();

            this.sessionData = data;
            this.timeline = data.timeline || [];

            // Update UI with session data
            this.updateMetrics(data.scores);
            this.updateCharacterTraits(data.metrics?.behavioral);
            this.displayCriticalMoments(data.criticalMoments);

            // Start playback
            this.startPlayback();

        } catch (error) {
            console.error('Failed to load session:', error);
            // Load demo data
            this.loadDemoData();
        }
    }

    loadDemoData() {
        // Championship demo data
        const demoScores = {
            overall: 87.5,
            biomechanical: 85.3,
            behavioral: 89.7,
            clutchFactor: 91.2,
            championshipReadiness: 88.4
        };

        const demoTraits = {
            composure: 79,
            confidence: 85,
            resilience: 82,
            concentration: 92,
            determination: 88
        };

        const demoMoments = [
            {
                type: 'clutch_performance',
                timestamp: 5000,
                description: 'Maintained elite composure during high-pressure release',
                metrics: { stress: 78, composure: 85, efficiency: 89 }
            },
            {
                type: 'breakthrough',
                timestamp: 12000,
                description: 'Kinetic chain optimization achieved',
                metrics: { previousEfficiency: 72, newEfficiency: 91, improvement: 26.4 }
            },
            {
                type: 'vulnerability',
                timestamp: 18000,
                description: 'Mechanical breakdown in follow-through',
                metrics: { efficiency: 58, confidence: 45 }
            }
        ];

        // Update UI with demo data
        this.updateMetrics(demoScores);
        this.updateCharacterTraits(demoTraits);
        demoMoments.forEach(moment => this.addCriticalMoment(moment));

        // Generate demo timeline
        this.generateDemoTimeline();
        this.startPlayback();
    }

    generateDemoTimeline() {
        this.timeline = [];
        for (let i = 0; i < 300; i++) {
            this.timeline.push({
                frameNumber: i,
                timestamp: i * 33.33,
                biomechanics: {
                    efficiency: 70 + Math.sin(i * 0.05) * 20 + Math.random() * 5,
                    landmarks: this.generateDemoLandmarks(i)
                },
                behavioral: {
                    composure: 75 + Math.cos(i * 0.03) * 15 + Math.random() * 5,
                    confidence: 80 + Math.sin(i * 0.04) * 10,
                    stress: 40 + Math.sin(i * 0.02) * 30
                }
            });
        }
    }

    generateDemoLandmarks(frame) {
        // Generate smooth demo skeletal movement
        const landmarks = [];
        for (let i = 0; i < 33; i++) {
            landmarks.push({
                x: Math.sin(frame * 0.02 + i) * 2,
                y: i * 0.1 + Math.sin(frame * 0.03) * 0.5,
                z: Math.cos(frame * 0.02 + i) * 2
            });
        }
        return landmarks;
    }

    updateMetrics(scores) {
        // Animate metric updates
        this.animateValue('overallScore', scores.overall);
        this.animateValue('biomechScore', scores.biomechanical);
        this.animateValue('behaviorScore', scores.behavioral);
        this.animateValue('clutchFactor', scores.clutchFactor);
        this.animateValue('championshipScore', scores.championshipReadiness);

        // Update championship ring
        const ctx = document.getElementById('championshipRing').getContext('2d');
        this.animateRing(ctx, scores.championshipReadiness);
    }

    updateCharacterTraits(traits) {
        if (!traits) return;

        // Update trait bars with animation
        this.animateTraitBar('composure', traits.composure || 0);
        this.animateTraitBar('confidence', traits.confidence || 0);
        this.animateTraitBar('resilience', traits.resilience || 0);
        this.animateTraitBar('focus', traits.concentration || 0);
        this.animateTraitBar('determination', traits.determination || 0);
    }

    animateValue(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const startValue = parseFloat(element.textContent) || 0;
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (targetValue - startValue) * eased;

            element.textContent = current.toFixed(1);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    animateTraitBar(trait, value) {
        const bar = document.getElementById(`${trait}Bar`);
        const valueElement = document.getElementById(`${trait}Value`);

        bar.style.width = `${value}%`;
        valueElement.textContent = value.toFixed(0);
    }

    animateRing(ctx, value) {
        let current = 0;
        const animate = () => {
            if (current < value) {
                current += 2;
                this.drawChampionshipRing(ctx, Math.min(current, value));
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    displayCriticalMoments(moments) {
        if (!moments) return;

        const container = document.getElementById('momentList');
        container.innerHTML = '';

        moments.forEach(moment => this.addCriticalMoment(moment));
    }

    addCriticalMoment(moment) {
        const container = document.getElementById('momentList');

        const momentElement = document.createElement('div');
        momentElement.className = 'moment-item';
        momentElement.innerHTML = `
            <div class="moment-type">${moment.type.replace('_', ' ').toUpperCase()}</div>
            <div class="moment-description">${moment.description}</div>
            <div class="moment-metrics">
                ${Object.entries(moment.metrics).map(([key, value]) =>
                    `<span>${key}: ${typeof value === 'number' ? value.toFixed(1) : value}</span>`
                ).join('')}
            </div>
        `;

        container.insertBefore(momentElement, container.firstChild);

        // Limit to 10 most recent moments
        while (container.children.length > 10) {
            container.removeChild(container.lastChild);
        }
    }

    startPlayback() {
        this.isPlaying = true;
        this.currentFrame = 0;

        const playFrame = () => {
            if (!this.isPlaying || this.currentFrame >= this.timeline.length) {
                return;
            }

            const frame = this.timeline[this.currentFrame];
            this.updateFrame(frame);

            // Update timeline marker
            const marker = document.getElementById('timelineMarker');
            const progress = (this.currentFrame / this.timeline.length) * 100;
            marker.style.left = `${progress}%`;

            this.currentFrame++;

            // Play at 30fps
            setTimeout(playFrame, 33);
        };

        playFrame();
    }

    updateFrame(frameData) {
        if (!frameData) return;

        // Update skeleton position
        if (frameData.biomechanics?.landmarks) {
            this.updateSkeleton(frameData.biomechanics.landmarks);
        }

        // Update real-time metrics
        if (frameData.biomechanics?.efficiency) {
            document.getElementById('biomechScore').textContent =
                frameData.biomechanics.efficiency.toFixed(1);
        }

        if (frameData.behavioral?.composure) {
            document.getElementById('behaviorScore').textContent =
                frameData.behavioral.composure.toFixed(1);
        }

        // Update timeline
        const ctx = document.getElementById('timeline').getContext('2d');
        this.drawTimeline(ctx);
    }

    updateSkeleton(landmarks) {
        if (!landmarks || landmarks.length === 0) return;

        // Update joint positions
        landmarks.forEach((landmark, index) => {
            if (this.joints[index]) {
                this.joints[index].position.set(
                    landmark.x * 5,
                    landmark.y * 5,
                    landmark.z * 5
                );

                // Color code by confidence/efficiency
                const efficiency = landmark.visibility || 0.8;
                const color = new THREE.Color();
                color.setHSL(efficiency * 0.3, 1, 0.5);
                this.joints[index].material.color = color;
            }
        });

        // Update bone connections
        this.bones.forEach(({ bone, start, end }) => {
            if (this.joints[start] && this.joints[end]) {
                const startPos = this.joints[start].position;
                const endPos = this.joints[end].position;

                // Position bone between joints
                bone.position.copy(startPos).add(endPos).multiplyScalar(0.5);

                // Orient bone
                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                bone.lookAt(endPos);
                bone.rotateX(Math.PI / 2);

                // Scale bone length
                bone.scale.y = direction.length();
            }
        });
    }

    handleAnalysisComplete(data) {
        // Show completion notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #BF5700, #FF6B35);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(191, 87, 0, 0.5);
            animation: slideIn 0.5s ease;
            z-index: 1000;
        `;
        notification.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0;">Analysis Complete!</h3>
            <p style="margin: 0;">Championship Readiness: ${data.championshipReadiness}%</p>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 5000);

        // Update final scores
        this.updateMetrics(data.scores);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate skeleton slowly
        if (this.joints.length > 0) {
            this.joints.forEach((joint, index) => {
                joint.rotation.y += 0.001;
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.visionDashboard = new VisionDashboard();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);