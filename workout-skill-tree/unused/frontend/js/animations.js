/**
 * Animations for the Workout Skill Tree
 * This script handles the confetti animation when skills are mastered
 */

// Configuration for confetti animation
const confettiConfig = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF5733', '#33A1FF', '#33FF57', '#F5A623', '#4A90E2'],
    gravity: 1.2,
    ticks: 200,
    shapes: ['square', 'circle'],
    scalar: 1.2
};

// Create a single confetti particle
function createConfettiParticle() {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    
    // Random properties
    const size = Math.random() * 10 + 5; // 5-15px
    const color = confettiConfig.colors[Math.floor(Math.random() * confettiConfig.colors.length)];
    const shape = confettiConfig.shapes[Math.floor(Math.random() * confettiConfig.shapes.length)];
    
    // Set styles
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = color;
    particle.style.position = 'absolute';
    
    if (shape === 'circle') {
        particle.style.borderRadius = '50%';
    }
    
    return particle;
}

// Animate a single confetti particle
function animateConfettiParticle(particle, startX) {
    const container = document.getElementById('confetti-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Random starting position (horizontally centered around the skill node)
    const startPositionX = startX || containerWidth / 2;
    const startPositionY = containerHeight * confettiConfig.origin.y;
    
    // Random velocity
    const velocityX = (Math.random() - 0.5) * confettiConfig.spread;
    const velocityY = -Math.random() * 3 - 3; // Initial upward velocity
    
    // Random rotation
    const rotation = Math.random() * 360;
    const rotationSpeed = (Math.random() - 0.5) * 10;
    
    // Add to container
    container.appendChild(particle);
    
    // Set initial position
    particle.style.left = `${startPositionX}px`;
    particle.style.top = `${startPositionY}px`;
    particle.style.transform = `rotate(${rotation}deg)`;
    
    // Animation variables
    let posX = startPositionX;
    let posY = startPositionY;
    let velX = velocityX;
    let velY = velocityY;
    let rot = rotation;
    let tick = 0;
    
    // Animation function
    function animate() {
        // Update position
        posX += velX;
        posY += velY;
        
        // Apply gravity
        velY += confettiConfig.gravity * 0.1;
        
        // Update rotation
        rot += rotationSpeed;
        
        // Update particle position
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.transform = `rotate(${rot}deg)`;
        
        // Check if particle is still within bounds
        if (posY < containerHeight && tick < confettiConfig.ticks) {
            tick++;
            requestAnimationFrame(animate);
        } else {
            // Remove particle when animation is complete
            container.removeChild(particle);
        }
    }
    
    // Start animation
    requestAnimationFrame(animate);
}

// Trigger confetti animation
function triggerConfetti(x, y) {
    const container = document.getElementById('confetti-container');
    
    // Clear any existing confetti
    container.innerHTML = '';
    
    // Create and animate particles
    for (let i = 0; i < confettiConfig.particleCount; i++) {
        const particle = createConfettiParticle();
        animateConfettiParticle(particle, x);
    }
}

// Alternative implementation using Canvas for better performance
let confettiCanvas = null;
let confettiContext = null;
let confettiAnimationId = null;
let confettiParticles = [];

// Initialize confetti canvas
function initConfettiCanvas() {
    // Create canvas if it doesn't exist
    if (!confettiCanvas) {
        confettiCanvas = document.createElement('canvas');
        confettiCanvas.id = 'confetti-canvas';
        confettiCanvas.style.position = 'fixed';
        confettiCanvas.style.top = '0';
        confettiCanvas.style.left = '0';
        confettiCanvas.style.width = '100%';
        confettiCanvas.style.height = '100%';
        confettiCanvas.style.pointerEvents = 'none';
        confettiCanvas.style.zIndex = '1000';
        document.body.appendChild(confettiCanvas);
        
        // Get context
        confettiContext = confettiCanvas.getContext('2d');
        
        // Set canvas size
        resizeConfettiCanvas();
        
        // Add resize listener
        window.addEventListener('resize', resizeConfettiCanvas);
    }
}

// Resize canvas to match window size
function resizeConfettiCanvas() {
    if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
}

// Create a confetti particle for canvas rendering
function createCanvasConfettiParticle(x, y) {
    const colors = confettiConfig.colors;
    
    return {
        x: x || confettiCanvas.width / 2,
        y: y || confettiCanvas.height * confettiConfig.origin.y,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        speed: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.2 - 0.1,
        shape: Math.random() > 0.5 ? 'circle' : 'square',
        opacity: 1
    };
}

// Draw a single confetti particle on canvas
function drawConfettiParticle(particle) {
    confettiContext.save();
    confettiContext.translate(particle.x, particle.y);
    confettiContext.rotate(particle.angle);
    confettiContext.globalAlpha = particle.opacity;
    confettiContext.fillStyle = particle.color;
    
    if (particle.shape === 'circle') {
        confettiContext.beginPath();
        confettiContext.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        confettiContext.fill();
    } else {
        confettiContext.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    }
    
    confettiContext.restore();
}

// Update and draw all confetti particles
function updateConfetti() {
    // Clear canvas
    confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    // Update and draw particles
    for (let i = 0; i < confettiParticles.length; i++) {
        const particle = confettiParticles[i];
        
        // Update position
        particle.x += Math.cos(particle.angle) * particle.speed;
        particle.y += Math.sin(particle.angle) * particle.speed + confettiConfig.gravity;
        
        // Update angle and opacity
        particle.angle += particle.spin;
        particle.opacity -= 0.005;
        
        // Draw particle
        drawConfettiParticle(particle);
        
        // Remove particles that are off-screen or faded out
        if (particle.y > confettiCanvas.height || particle.opacity <= 0) {
            confettiParticles.splice(i, 1);
            i--;
        }
    }
    
    // Continue animation if there are still particles
    if (confettiParticles.length > 0) {
        confettiAnimationId = requestAnimationFrame(updateConfetti);
    } else {
        // Hide canvas when animation is complete
        confettiCanvas.style.display = 'none';
        cancelAnimationFrame(confettiAnimationId);
    }
}

// Trigger canvas confetti animation
function triggerCanvasConfetti(x, y) {
    // Initialize canvas if needed
    initConfettiCanvas();
    
    // Show canvas
    confettiCanvas.style.display = 'block';
    
    // Clear existing particles
    confettiParticles = [];
    
    // Cancel any existing animation
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
    }
    
    // Create new particles
    for (let i = 0; i < confettiConfig.particleCount; i++) {
        confettiParticles.push(createCanvasConfettiParticle(x, y));
    }
    
    // Start animation
    updateConfetti();
}

// Use the canvas-based confetti by default for better performance
window.triggerConfetti = triggerCanvasConfetti;