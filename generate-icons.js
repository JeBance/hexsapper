#!/usr/bin/env node

/**
 * HexSapper Icon Generator
 * Generates PNG icons for PWA using Node.js canvas
 * 
 * Install dependencies first:
 * npm install canvas
 * 
 * Then run:
 * node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let createCanvas;
try {
    const { createCanvas: cc } = require('canvas');
    createCanvas = cc;
} catch (e) {
    console.log('Canvas module not available. Please run: npm install canvas');
    console.log('Or use generate-icons.html in a browser instead.');
    process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'icons');

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const s = size;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, s, s);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    
    // Rounded rectangle
    const r = s * 0.12;
    ctx.beginPath();
    ctx.roundRect(0, 0, s, s, r);
    ctx.fill();
    
    // Hexagon
    const cx = s / 2;
    const cy = s / 2;
    const hexR = s * 0.25;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + hexR * Math.cos(angle);
        const y = cy + hexR * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    const hexGrad = ctx.createLinearGradient(cx, cy - hexR, cx, cy + hexR);
    hexGrad.addColorStop(0, '#4a4a6a');
    hexGrad.addColorStop(1, '#2a2a3a');
    ctx.fillStyle = hexGrad;
    ctx.fill();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = Math.max(2, s * 0.01);
    ctx.stroke();
    
    // Mine circle
    ctx.beginPath();
    ctx.arc(cx, cy, hexR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#e94560';
    ctx.fill();
    
    // Mine spikes
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = Math.max(3, s * 0.015);
    ctx.lineCap = 'round';
    const spikeLen = hexR * 0.5;
    const innerLen = hexR * 0.25;
    
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        ctx.beginPath();
        ctx.moveTo(cx + innerLen * Math.cos(angle), cy + innerLen * Math.sin(angle));
        ctx.lineTo(cx + spikeLen * Math.cos(angle), cy + spikeLen * Math.sin(angle));
        ctx.stroke();
    }
    
    return canvas;
}

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate all icons
console.log('Generating icons...\n');

sizes.forEach(size => {
    const canvas = drawIcon(size);
    const filename = path.join(iconsDir, `icon-${size}.png`);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    
    console.log(`✓ Created icon-${size}.png (${size}x${size})`);
});

console.log('\n✅ All icons generated successfully!');
console.log(`📁 Icons saved to: ${iconsDir}/`);
