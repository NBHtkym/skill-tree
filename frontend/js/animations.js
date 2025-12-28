/**
 * Workout Skill Tree - Animations
 * 
 * This file contains the JavaScript code for animations in the skill tree application,
 * particularly the confetti animation effect when skills are mastered.
 */

// Define the Animations module using an IIFE to avoid global namespace pollution
const Animations = (function() {
    // Private variables
    const defaultConfettiDuration = 3000; // 3 seconds
    
    /**
     * Create a confetti particle
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {number} colors - Array of colors for the confetti
     * @returns {Object} - A confetti particle object
     */
    function createConfettiParticle(canvas, colors) {
        const particle = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            rotation: Math.random() * 360,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            speed: Math.random() * 3 + 2,
            swing: Math.random() * 3,
            sway: Math.random() * 6 - 3,
            update: function() {
                this.y += this.speed;
                this.x += Math.sin(this.y * 0.01) * this.sway;
                this.rotation += this.swing;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        };
        return particle;
    }
    
    /**
     * Show confetti animation
     * @param {Object} options - Configuration options
     * @param {number} [options.duration=3000] - Duration of the animation in milliseconds
     * @param {string[]} [options.colors] - Array of colors for the confetti
     * @param {number} [options.particleCount=100] - Number of confetti particles
     * @param {HTMLElement} [options.container] - Container element for the canvas
     * @param {Object} [options.position] - Position to center the confetti (x, y)
     */
    function showConfetti(options = {}) {
        const duration = options.duration || defaultConfettiDuration;
        const colors = options.colors || ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
        const particleCount = options.particleCount || 100;
        const container = options.container || document.body;
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Create confetti particles
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const particle = createConfettiParticle(canvas, colors);
            
            // If position is provided, center particles around it
            if (options.position) {
                particle.x = options.position.x + (Math.random() * 100 - 50);
                particle.y = options.position.y - Math.random() * 50;
            }
            
            particles.push(particle);
        }
        
        // Animation loop
        let animationFrame;
        const startTime = Date.now();
        
        function animate() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw(ctx);
            });
            
            // Check if animation should continue
            if (Date.now() - startTime < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                // Clean up
                cancelAnimationFrame(animationFrame);
                container.removeChild(canvas);
            }
        }
        
        // Start animation
        animate();
    }
    
    /**
     * Show a node highlight animation
     * @param {HTMLElement} node - The node element to highlight
     * @param {string} [className='pulse'] - The CSS class to add for the animation
     * @param {number} [duration=1500] - Duration of the animation in milliseconds
     */
    function highlightNode(node, className = 'pulse', duration = 1500) {
        if (!node) return;
        
        node.classList.add(className);
        
        setTimeout(() => {
            node.classList.remove(className);
        }, duration);
    }
    
    /**
     * Show skill mastered animation
     * @param {string} skillId - The ID of the mastered skill
     */
    function showSkillMasteredAnimation(skillId) {
        console.log('Skill mastered:', skillId);
        
        // Find the skill node
        const skillNode = document.querySelector(`.skill-node[data-id="${skillId}"]`);
        
        // Highlight the node
        if (skillNode) {
            highlightNode(skillNode);
            
            // Show confetti centered on the node
            const rect = skillNode.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Get the skill tree container for the confetti
            const container = document.querySelector('.skill-tree-container');
            
            if (container) {
                showConfetti({
                    container: container,
                    particleCount: 150,
                    duration: 3000,
                    position: {
                        x: centerX,
                        y: centerY
                    }
                });
            } else {
                // Fallback to body if container not found
                showConfetti({
                    particleCount: 150,
                    duration: 3000
                });
            }
            
            // Play a sound effect if available
            playCompletionSound();
        } else {
            // Fallback if node not found
            showConfetti({
                particleCount: 150,
                duration: 3000
            });
        }
        
        // Show a toast notification
        showToastNotification('Skill Mastered!', 'Congratulations on mastering this skill!');
    }
    
    /**
     * Play a sound effect for skill completion
     */
    function playCompletionSound() {
        try {
            const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRDT04AAAAxAAADZW5naW5lZXIAQmlnU291bmRCYW5rLmNvbSAvIExhc29uaWNTdHVkaW9zLmNvbQBUSVQyAAAABgAAA3RpdGxlAFBpbmcAVFNTRQAAAAwAAANzb2Z0d2FyZQBMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
            audio.play();
        } catch (e) {
            console.log('Sound effect not supported');
        }
    }
    
    /**
     * Show a toast notification
     * @param {string} title - The title of the notification
     * @param {string} message - The message to display
     * @param {number} [duration=3000] - How long to show the notification
     */
    function showToastNotification(title, message, duration = 3000) {
        // Create toast element if it doesn't exist
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
            
            // Add styles if not already in CSS
            if (!document.querySelector('#toast-styles')) {
                const style = document.createElement('style');
                style.id = 'toast-styles';
                style.textContent = `
                    .toast-notification {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background-color: #4CAF50;
                        color: white;
                        padding: 15px;
                        border-radius: 5px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                        z-index: 10000;
                        transform: translateY(100px);
                        opacity: 0;
                        transition: transform 0.3s ease, opacity 0.3s ease;
                    }
                    .toast-notification.show {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    .toast-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .toast-message {
                        font-size: 0.9rem;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Set content
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        
        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
            
            // Hide after duration
            setTimeout(() => {
                toast.classList.remove('show');
            }, duration);
        }, 10);
    }
    
    // Public API
    return {
        showConfetti,
        highlightNode,
        showSkillMasteredAnimation,
        showToastNotification
    };
})();

// Make the showSkillMasteredAnimation function available globally
window.showSkillMasteredAnimation = Animations.showSkillMasteredAnimation;

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Animation functionality initialized');
});