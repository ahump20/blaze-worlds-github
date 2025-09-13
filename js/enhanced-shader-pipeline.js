/**
 * Enhanced Shader Pipeline with Custom GLSL Effects
 * Texas Championship Edition - AAA Visual Quality
 *
 * Features:
 * - Terrain tessellation and displacement mapping
 * - Procedural water with realistic waves
 * - Atmospheric scattering for Texas skies
 * - Heat shimmer and mirage effects
 * - PBR materials with custom shading
 */

class EnhancedShaderPipeline {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Shader configurations
        this.shaders = {
            terrain: null,
            water: null,
            atmosphere: null,
            heatShimmer: null,
            holographic: null,
            energyShield: null
        };

        // Uniform values shared across shaders
        this.uniforms = {
            time: { value: 0 },
            sunPosition: { value: new THREE.Vector3(100, 50, 100) },
            cameraPosition: { value: camera.position },
            fogColor: { value: new THREE.Color(0x87ceeb) },
            fogDensity: { value: 0.001 }
        };

        // Post-processing effects
        this.composer = null;
        this.effectPasses = [];

        this.init();
    }

    init() {
        this.createTerrainShader();
        this.createWaterShader();
        this.createAtmosphereShader();
        this.createHeatShimmerShader();
        this.createHolographicShader();
        this.createEnergyShieldShader();
        this.setupPostProcessing();

        console.log('🎨 Enhanced Shader Pipeline initialized');
    }

    createTerrainShader() {
        // Advanced terrain shader with triplanar mapping and displacement
        const vertexShader = `
            #define TERRAIN_TEXTURE_SCALE 0.1
            #define DISPLACEMENT_STRENGTH 5.0

            uniform float time;
            uniform vec3 sunPosition;
            uniform sampler2D heightMap;
            uniform sampler2D normalMap;

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vTangent;
            varying vec3 vBitangent;
            varying vec2 vUv;
            varying float vElevation;
            varying vec3 vSunDirection;
            varying float vFogDepth;

            // Noise functions for procedural detail
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);

                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);

                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;

                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;

                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);

                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);

                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);

                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));

                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);

                vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;

                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }

            void main() {
                vUv = uv;
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

                // Multi-octave noise for terrain displacement
                float noise = 0.0;
                float amplitude = 1.0;
                float frequency = 0.01;

                for(int i = 0; i < 5; i++) {
                    noise += snoise(vWorldPos * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }

                // Displacement based on height and noise
                vElevation = position.y + noise * DISPLACEMENT_STRENGTH;
                vec3 displacedPosition = position;
                displacedPosition.y = vElevation;

                // Calculate normal from heightmap
                vec2 texelSize = vec2(1.0 / 512.0);
                float h0 = texture2D(heightMap, vUv).r;
                float h1 = texture2D(heightMap, vUv + vec2(texelSize.x, 0.0)).r;
                float h2 = texture2D(heightMap, vUv + vec2(0.0, texelSize.y)).r;

                vec3 tangent = normalize(vec3(1.0, (h1 - h0) * DISPLACEMENT_STRENGTH, 0.0));
                vec3 bitangent = normalize(vec3(0.0, (h2 - h0) * DISPLACEMENT_STRENGTH, 1.0));
                vec3 normal = normalize(cross(tangent, bitangent));

                vNormal = normalize(normalMatrix * normal);
                vTangent = normalize(normalMatrix * tangent);
                vBitangent = normalize(normalMatrix * bitangent);

                // Sun direction for lighting
                vSunDirection = normalize(sunPosition - vWorldPos);

                // Fog depth
                vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
                vFogDepth = -mvPosition.z;

                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform float time;
            uniform vec3 fogColor;
            uniform float fogDensity;
            uniform sampler2D grassTexture;
            uniform sampler2D rockTexture;
            uniform sampler2D sandTexture;

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vTangent;
            varying vec3 vBitangent;
            varying vec2 vUv;
            varying float vElevation;
            varying vec3 vSunDirection;
            varying float vFogDepth;

            // Triplanar mapping for seamless texturing
            vec3 triplanarMapping(sampler2D tex, vec3 worldPos, vec3 normal) {
                vec3 blending = abs(normal);
                blending = normalize(max(blending, 0.00001));
                float b = (blending.x + blending.y + blending.z);
                blending /= vec3(b);

                vec4 xaxis = texture2D(tex, worldPos.yz * 0.05);
                vec4 yaxis = texture2D(tex, worldPos.xz * 0.05);
                vec4 zaxis = texture2D(tex, worldPos.xy * 0.05);

                return (xaxis * blending.x + yaxis * blending.y + zaxis * blending.z).rgb;
            }

            void main() {
                // Material selection based on elevation and slope
                float slope = dot(vNormal, vec3(0.0, 1.0, 0.0));

                vec3 grassColor = vec3(0.3, 0.5, 0.2);
                vec3 rockColor = vec3(0.4, 0.35, 0.3);
                vec3 sandColor = vec3(0.76, 0.7, 0.5);
                vec3 snowColor = vec3(0.9, 0.9, 0.95);

                // Texture blending based on terrain properties
                vec3 color = grassColor;

                if(vElevation < 20.0) {
                    color = mix(sandColor, grassColor, smoothstep(15.0, 20.0, vElevation));
                } else if(vElevation > 60.0) {
                    color = mix(rockColor, snowColor, smoothstep(60.0, 80.0, vElevation));
                } else if(slope < 0.6) {
                    color = mix(rockColor, grassColor, slope / 0.6);
                }

                // Advanced lighting with multiple components
                float NdotL = max(dot(vNormal, vSunDirection), 0.0);

                // Diffuse lighting
                vec3 diffuse = color * NdotL;

                // Ambient with hemisphere lighting
                vec3 skyColor = vec3(0.5, 0.7, 0.9);
                vec3 groundColor = vec3(0.2, 0.15, 0.1);
                float hemiMix = vNormal.y * 0.5 + 0.5;
                vec3 ambient = mix(groundColor, skyColor, hemiMix) * color * 0.3;

                // Specular highlights for wet surfaces
                vec3 viewDir = normalize(cameraPosition - vWorldPos);
                vec3 halfDir = normalize(vSunDirection + viewDir);
                float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
                vec3 specular = vec3(0.5) * spec * (vElevation < 25.0 ? 0.3 : 0.1);

                // Rim lighting for atmospheric effect
                float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
                rim = smoothstep(0.6, 1.0, rim);
                vec3 rimColor = fogColor * rim * 0.5;

                // Combine all lighting
                vec3 finalColor = ambient + diffuse + specular + rimColor;

                // Atmospheric fog
                float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
                finalColor = mix(finalColor, fogColor, fogFactor);

                // Tone mapping
                finalColor = finalColor / (finalColor + vec3(1.0));
                finalColor = pow(finalColor, vec3(1.0/2.2));

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Create terrain material
        this.shaders.terrain = new THREE.ShaderMaterial({
            uniforms: {
                ...this.uniforms,
                heightMap: { value: null },
                normalMap: { value: null },
                grassTexture: { value: null },
                rockTexture: { value: null },
                sandTexture: { value: null }
            },
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide
        });
    }

    createWaterShader() {
        // Realistic water shader with waves and reflections
        const vertexShader = `
            uniform float time;
            uniform float waveHeight;
            uniform float waveFrequency;
            uniform float waveSpeed;

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewDirection;
            varying float vWaveHeight;

            // Gerstner wave function
            vec3 gerstnerWave(vec2 coord, vec2 direction, float frequency, float amplitude, float speed, float steepness) {
                float k = 2.0 * 3.14159 / frequency;
                float c = sqrt(9.8 / k);
                vec2 d = normalize(direction);
                float f = k * (dot(d, coord) - c * speed * time);
                float a = steepness / k;

                return vec3(
                    d.x * (a * cos(f)),
                    a * sin(f) * amplitude,
                    d.y * (a * cos(f))
                );
            }

            void main() {
                vUv = uv;
                vec3 pos = position;

                // Multiple Gerstner waves for realistic ocean
                vec3 wave1 = gerstnerWave(position.xz, vec2(1.0, 0.0), 20.0, 0.5, 1.0, 0.5);
                vec3 wave2 = gerstnerWave(position.xz, vec2(0.7, 0.7), 15.0, 0.3, 1.5, 0.4);
                vec3 wave3 = gerstnerWave(position.xz, vec2(-0.5, 0.8), 10.0, 0.2, 2.0, 0.3);
                vec3 wave4 = gerstnerWave(position.xz, vec2(0.3, -0.9), 8.0, 0.15, 2.5, 0.2);

                pos += wave1 + wave2 + wave3 + wave4;
                vWaveHeight = pos.y - position.y;

                // Calculate normal from wave derivatives
                vec3 tangent = vec3(1.0, wave1.y + wave2.y + wave3.y + wave4.y, 0.0);
                vec3 bitangent = vec3(0.0, wave1.y + wave2.y + wave3.y + wave4.y, 1.0);
                vNormal = normalize(cross(tangent, bitangent));

                vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vViewDirection = normalize(cameraPosition - vWorldPos);

                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform float time;
            uniform vec3 waterColor;
            uniform vec3 sunPosition;
            uniform samplerCube envMap;
            uniform sampler2D normalMap;
            uniform float transparency;

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewDirection;
            varying float vWaveHeight;

            // Fresnel effect for water reflections
            float fresnel(vec3 viewDirection, vec3 normal, float power) {
                return pow(1.0 - dot(viewDirection, normal), power);
            }

            void main() {
                // Animated normal map for water surface detail
                vec2 normalUv1 = vUv * 10.0 + vec2(time * 0.05, time * 0.03);
                vec2 normalUv2 = vUv * 15.0 - vec2(time * 0.03, time * 0.07);

                vec3 normal1 = texture2D(normalMap, normalUv1).xyz * 2.0 - 1.0;
                vec3 normal2 = texture2D(normalMap, normalUv2).xyz * 2.0 - 1.0;
                vec3 normalDetail = normalize(normal1 + normal2 * 0.5);

                // Combine wave normal with detail normal
                vec3 finalNormal = normalize(vNormal + normalDetail * 0.3);

                // Water color based on depth and wave height
                vec3 shallowColor = vec3(0.0, 0.8, 0.9);
                vec3 deepColor = vec3(0.0, 0.2, 0.4);
                vec3 foamColor = vec3(1.0, 1.0, 1.0);

                float depth = smoothstep(-2.0, 2.0, vWorldPos.y);
                vec3 waterCol = mix(deepColor, shallowColor, depth);

                // Foam on wave peaks
                float foam = smoothstep(0.3, 0.5, vWaveHeight);
                waterCol = mix(waterCol, foamColor, foam);

                // Lighting
                vec3 sunDir = normalize(sunPosition - vWorldPos);
                float NdotL = max(dot(finalNormal, sunDir), 0.0);

                // Specular highlights
                vec3 halfDir = normalize(sunDir + vViewDirection);
                float spec = pow(max(dot(finalNormal, halfDir), 0.0), 256.0);
                vec3 specular = vec3(1.0) * spec * 2.0;

                // Reflections with fresnel
                vec3 reflectDir = reflect(-vViewDirection, finalNormal);
                vec3 reflection = textureCube(envMap, reflectDir).rgb;
                float fresnelFactor = fresnel(vViewDirection, finalNormal, 2.0);

                // Combine everything
                vec3 finalColor = waterCol * NdotL;
                finalColor += specular;
                finalColor = mix(finalColor, reflection, fresnelFactor * 0.5);

                // Subsurface scattering effect
                float subsurface = max(dot(-sunDir, vViewDirection), 0.0);
                subsurface = pow(subsurface, 3.0) * 0.5;
                finalColor += vec3(0.0, 0.3, 0.2) * subsurface;

                // Transparency based on view angle
                float alpha = mix(0.6, 0.95, fresnelFactor);

                gl_FragColor = vec4(finalColor, alpha);
            }
        `;

        this.shaders.water = new THREE.ShaderMaterial({
            uniforms: {
                ...this.uniforms,
                waterColor: { value: new THREE.Color(0x006994) },
                waveHeight: { value: 1.0 },
                waveFrequency: { value: 0.1 },
                waveSpeed: { value: 1.0 },
                normalMap: { value: null },
                envMap: { value: null },
                transparency: { value: 0.7 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    createAtmosphereShader() {
        // Atmospheric scattering for realistic Texas skies
        const vertexShader = `
            varying vec3 vWorldPos;
            varying vec3 vSunDirection;

            uniform vec3 sunPosition;

            void main() {
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vSunDirection = normalize(sunPosition);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 sunPosition;
            uniform float time;

            varying vec3 vWorldPos;
            varying vec3 vSunDirection;

            // Rayleigh scattering
            vec3 rayleighScattering(vec3 rayDir, vec3 sunDir, float intensity) {
                float sundot = clamp(dot(rayDir, sunDir), 0.0, 1.0);
                vec3 rayleighCoeff = vec3(5.5e-6, 13.0e-6, 22.4e-6);

                float reileigh = 3.0 / (16.0 * 3.14159) * (1.0 + sundot * sundot);
                vec3 color = rayleighCoeff * reileigh * intensity;

                return color;
            }

            // Mie scattering
            vec3 mieScattering(vec3 rayDir, vec3 sunDir, float intensity) {
                float sundot = clamp(dot(rayDir, sunDir), 0.0, 1.0);
                float mieCoeff = 0.005;
                float mieDirectionalG = 0.8;

                float mie = 3.0 / (8.0 * 3.14159) * ((1.0 - mieDirectionalG * mieDirectionalG) / (2.0 + mieDirectionalG * mieDirectionalG)) *
                           (1.0 + sundot * sundot) / pow(1.0 + mieDirectionalG * mieDirectionalG - 2.0 * mieDirectionalG * sundot, 1.5);

                return vec3(mieCoeff) * mie * intensity;
            }

            void main() {
                vec3 rayDir = normalize(vWorldPos - cameraPosition);

                // Calculate sun disc
                float sunAngle = acos(dot(rayDir, vSunDirection));
                float sunDisc = 1.0 - smoothstep(0.0, 0.02, sunAngle);

                // Sky gradient
                vec3 skyColorZenith = vec3(0.4, 0.6, 1.0);
                vec3 skyColorHorizon = vec3(0.8, 0.85, 0.9);

                float height = normalize(rayDir).y;
                vec3 skyGradient = mix(skyColorHorizon, skyColorZenith, pow(max(height, 0.0), 0.5));

                // Scattering
                float intensity = 2.0;
                vec3 rayleigh = rayleighScattering(rayDir, vSunDirection, intensity);
                vec3 mie = mieScattering(rayDir, vSunDirection, intensity);

                // Combine
                vec3 color = skyGradient + rayleigh + mie;
                color += vec3(1.0, 0.9, 0.7) * sunDisc * 10.0;

                // Add clouds
                float cloudNoise = sin(vWorldPos.x * 0.001 + time * 0.05) *
                                  cos(vWorldPos.z * 0.001 + time * 0.03);
                cloudNoise = smoothstep(0.3, 0.7, cloudNoise);
                color = mix(color, vec3(1.0), cloudNoise * 0.3);

                // Tone mapping
                color = color / (color + vec3(1.0));
                color = pow(color, vec3(1.0/2.2));

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        this.shaders.atmosphere = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader,
            fragmentShader,
            side: THREE.BackSide
        });
    }

    createHeatShimmerShader() {
        // Heat shimmer effect for desert areas
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float time;
            uniform sampler2D tDiffuse;
            uniform float intensity;

            varying vec2 vUv;

            void main() {
                vec2 distortion = vec2(
                    sin(vUv.y * 20.0 + time * 3.0) * 0.003,
                    cos(vUv.x * 20.0 + time * 2.0) * 0.003
                ) * intensity;

                vec2 distortedUv = vUv + distortion;
                vec4 color = texture2D(tDiffuse, distortedUv);

                // Add slight color shift for heat
                color.r += 0.02 * intensity;
                color.g -= 0.01 * intensity;

                gl_FragColor = color;
            }
        `;

        this.shaders.heatShimmer = new THREE.ShaderMaterial({
            uniforms: {
                ...this.uniforms,
                tDiffuse: { value: null },
                intensity: { value: 0.5 }
            },
            vertexShader,
            fragmentShader
        });
    }

    createHolographicShader() {
        // Holographic shader for UI elements and special effects
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float scanlineSpeed;
            uniform float glitchIntensity;

            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec2 vUv;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            void main() {
                vec3 viewDir = normalize(vViewPosition);
                float fresnel = pow(1.0 - dot(viewDir, vNormal), 2.0);

                // Holographic color gradient
                vec3 color = mix(color1, color2, fresnel);

                // Scanlines
                float scanline = sin(vUv.y * 100.0 - time * scanlineSpeed) * 0.04;
                color += vec3(scanline);

                // Digital glitch effect
                float glitch = random(vec2(floor(vUv.y * 20.0), floor(time * 10.0)));
                if(glitch > 1.0 - glitchIntensity) {
                    color.r += random(vUv + time) * 0.5;
                    color.g -= random(vUv - time) * 0.5;
                }

                // Edge glow
                float edgeGlow = pow(fresnel, 3.0);
                color += edgeGlow * color2;

                // Transparency based on viewing angle
                float alpha = mix(0.3, 0.9, fresnel);

                gl_FragColor = vec4(color, alpha);
            }
        `;

        this.shaders.holographic = new THREE.ShaderMaterial({
            uniforms: {
                ...this.uniforms,
                color1: { value: new THREE.Color(0x00ffff) },
                color2: { value: new THREE.Color(0xff00ff) },
                scanlineSpeed: { value: 2.0 },
                glitchIntensity: { value: 0.02 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    createEnergyShieldShader() {
        // Energy shield shader for defensive structures
        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vWorldPos;
            varying vec2 vUv;

            uniform float time;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);

                // Pulse effect
                vec3 pos = position;
                float pulse = sin(time * 2.0) * 0.02;
                pos += normal * pulse;

                vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float time;
            uniform vec3 shieldColor;
            uniform float hitTime;
            uniform vec3 hitPosition;
            uniform float opacity;

            varying vec3 vNormal;
            varying vec3 vWorldPos;
            varying vec2 vUv;

            // Hexagonal pattern
            float hexagon(vec2 p, float r) {
                const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
                p = abs(p);
                p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
                p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
                return length(p) * sign(p.y);
            }

            void main() {
                // Hexagonal grid
                vec2 gridUv = vUv * 20.0;
                vec2 gridId = floor(gridUv);
                vec2 gridPos = fract(gridUv) - 0.5;

                float hex = 1.0 - smoothstep(0.0, 0.02, abs(hexagon(gridPos, 0.4)));

                // Energy flow
                float flow = sin(vUv.y * 10.0 - time * 3.0) * 0.5 + 0.5;
                flow *= sin(vUv.x * 10.0 + time * 2.0) * 0.5 + 0.5;

                // Impact ripple
                float timeSinceHit = time - hitTime;
                float rippleRadius = timeSinceHit * 10.0;
                float distToHit = distance(vWorldPos, hitPosition);
                float ripple = 1.0 - smoothstep(rippleRadius - 1.0, rippleRadius + 1.0, distToHit);
                ripple *= exp(-timeSinceHit * 2.0);

                // Fresnel for edge glow
                vec3 viewDir = normalize(cameraPosition - vWorldPos);
                float fresnel = pow(1.0 - dot(viewDir, vNormal), 1.5);

                // Combine effects
                vec3 color = shieldColor;
                color += hex * 0.5;
                color += flow * 0.2;
                color += ripple * 2.0;

                // Edge highlight
                color += fresnel * shieldColor * 2.0;

                // Transparency
                float alpha = opacity * (0.3 + fresnel * 0.7 + hex * 0.3 + ripple);

                gl_FragColor = vec4(color, alpha);
            }
        `;

        this.shaders.energyShield = new THREE.ShaderMaterial({
            uniforms: {
                ...this.uniforms,
                shieldColor: { value: new THREE.Color(0x00ffff) },
                hitTime: { value: 0 },
                hitPosition: { value: new THREE.Vector3() },
                opacity: { value: 0.5 }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }

    setupPostProcessing() {
        // Initialize Three.js effect composer for post-processing
        if (typeof THREE.EffectComposer === 'undefined') {
            console.warn('EffectComposer not available, skipping post-processing setup');
            return;
        }

        // Note: In production, you'd need to include these Three.js examples:
        // - three/examples/js/postprocessing/EffectComposer.js
        // - three/examples/js/postprocessing/RenderPass.js
        // - three/examples/js/postprocessing/ShaderPass.js
        // - three/examples/js/shaders/CopyShader.js

        try {
            this.composer = new THREE.EffectComposer(this.renderer);

            // Render pass
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);

            // Bloom effect for glowing elements
            if (typeof THREE.UnrealBloomPass !== 'undefined') {
                const bloomPass = new THREE.UnrealBloomPass(
                    new THREE.Vector2(window.innerWidth, window.innerHeight),
                    1.5, // strength
                    0.4, // radius
                    0.85  // threshold
                );
                this.composer.addPass(bloomPass);
            }

            // FXAA antialiasing
            if (typeof THREE.ShaderPass !== 'undefined' && typeof THREE.FXAAShader !== 'undefined') {
                const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
                fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
                this.composer.addPass(fxaaPass);
            }

            console.log('📦 Post-processing pipeline configured');
        } catch (error) {
            console.warn('Post-processing setup failed:', error);
        }
    }

    // Utility methods for applying shaders

    applyTerrainShader(mesh) {
        if (mesh && this.shaders.terrain) {
            mesh.material = this.shaders.terrain;
            return true;
        }
        return false;
    }

    applyWaterShader(mesh) {
        if (mesh && this.shaders.water) {
            mesh.material = this.shaders.water;
            return true;
        }
        return false;
    }

    applyHolographicShader(mesh, color1, color2) {
        if (mesh && this.shaders.holographic) {
            const material = this.shaders.holographic.clone();
            material.uniforms.color1.value = color1 || new THREE.Color(0x00ffff);
            material.uniforms.color2.value = color2 || new THREE.Color(0xff00ff);
            mesh.material = material;
            return true;
        }
        return false;
    }

    applyEnergyShieldShader(mesh, color) {
        if (mesh && this.shaders.energyShield) {
            const material = this.shaders.energyShield.clone();
            material.uniforms.shieldColor.value = color || new THREE.Color(0x00ffff);
            mesh.material = material;
            return true;
        }
        return false;
    }

    // Hit effect for energy shields
    triggerShieldHit(shieldMesh, hitPosition) {
        if (shieldMesh && shieldMesh.material && shieldMesh.material.uniforms) {
            shieldMesh.material.uniforms.hitTime.value = this.uniforms.time.value;
            shieldMesh.material.uniforms.hitPosition.value.copy(hitPosition);
        }
    }

    // Update method to be called in render loop
    update(deltaTime) {
        this.uniforms.time.value += deltaTime;
        this.uniforms.cameraPosition.value.copy(this.camera.position);

        // Update sun position for day/night cycle
        const dayDuration = 300; // 5 minutes per day
        const dayProgress = (this.uniforms.time.value % dayDuration) / dayDuration;
        const sunAngle = dayProgress * Math.PI * 2;

        this.uniforms.sunPosition.value.set(
            Math.cos(sunAngle) * 200,
            Math.sin(sunAngle) * 200 + 50,
            100
        );

        // Update fog based on time of day
        const morningFog = Math.max(0, Math.cos(sunAngle * 2));
        this.uniforms.fogDensity.value = 0.001 + morningFog * 0.002;
    }

    // Render with post-processing
    render() {
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Window resize handler
    onWindowResize() {
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }

        // Update FXAA resolution
        if (this.effectPasses) {
            this.effectPasses.forEach(pass => {
                if (pass.uniforms && pass.uniforms.resolution) {
                    pass.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight);
                }
            });
        }
    }

    // Cleanup
    destroy() {
        // Dispose of materials
        Object.values(this.shaders).forEach(shader => {
            if (shader) {
                shader.dispose();
            }
        });

        // Dispose of composer
        if (this.composer) {
            this.composer.dispose();
        }

        console.log('🎨 Enhanced Shader Pipeline destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedShaderPipeline;
}