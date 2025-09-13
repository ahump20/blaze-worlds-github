#!/usr/bin/env node

/**
 * Blaze Worlds Texas Championship Edition - Build Script
 * Prepares the game for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🏆 Building Blaze Worlds Texas Championship Edition...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Create js subdirectory in dist
const jsDistDir = path.join(distDir, 'js');
if (!fs.existsSync(jsDistDir)) {
    fs.mkdirSync(jsDistDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
    'blaze-worlds-texas-championship.html',
    'blaze-worlds-launcher.html',
    'index.html',
    'classic.html',
    'conquest.html',
    'launcher.html',
    'blaze-analytics-integration.js'
];

// JavaScript modules to copy
const jsModules = [
    'advanced-particle-system.js',
    'advanced-lighting-system.js',
    'enhanced-shader-pipeline.js',
    'hero-unit-system.js',
    'economy-building-system.js',
    'rts-command-interface.js',
    'nextgen-voxel-engine.js',
    'dynamic-world-systems.js',
    'diegetic-interface-system.js',
    'spatial-audio-accessibility.js'
];

// Copy HTML files and main JS
filesToCopy.forEach(file => {
    const src = path.join(__dirname, file);
    const dest = path.join(distDir, file);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Copied ${file}`);
    } else {
        console.warn(`⚠ File not found: ${file}`);
    }
});

// Copy JS modules
jsModules.forEach(file => {
    const src = path.join(__dirname, 'js', file);
    const dest = path.join(jsDistDir, file);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Copied js/${file}`);
    } else {
        console.warn(`⚠ Module not found: js/${file}`);
    }
});

// Create a simple index.html redirect if it doesn't exist
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
    const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=blaze-worlds-launcher.html">
    <title>Blaze Worlds - Texas Championship Edition</title>
</head>
<body>
    <p>Loading Blaze Worlds Championship...</p>
</body>
</html>`;
    fs.writeFileSync(indexPath, indexContent);
    console.log('✓ Created index.html redirect');
}

// Create manifest file for tracking
const manifest = {
    name: 'Blaze Worlds Texas Championship Edition',
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    files: {
        html: filesToCopy.filter(f => f.endsWith('.html')),
        javascript: jsModules,
        systems: [
            'GPU Particle System',
            'Advanced Lighting',
            'Enhanced Shaders',
            'Hero Units',
            'Economy System',
            'RTS Commands',
            'Voxel Engine',
            'Dynamic World',
            'Diegetic UI',
            'Spatial Audio'
        ]
    }
};

fs.writeFileSync(
    path.join(distDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
);

console.log('✓ Created build manifest');
console.log('🏆 Build completed successfully!');
console.log(`📁 Output directory: ${distDir}`);
console.log('🚀 Ready for deployment to Netlify!');