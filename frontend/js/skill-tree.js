/**
 * Workout Skill Tree - Skill Tree Visualization
 * 
 * This file contains the JavaScript code for rendering and interacting with the skill tree.
 */

// Define the SkillTree module using an IIFE to avoid global namespace pollution
const SkillTree = (function() {
    // Private variables
    let skillTreeData = null;
    let zoomLevel = 1;
    let panOffset = { x: 0, y: 0 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let selectedNodeId = null;
    
    // API endpoints
    const API_ENDPOINTS = {
        SKILL_TREE: '/api/skill-tree',
        PROGRESS: '/api/progress',
        AVAILABLE_EXERCISES: '/api/available-exercises'
    };
    
    // Backend API base URL - change this to match your backend server
    const API_BASE_URL = 'http://localhost:5050';
    
    // DOM elements cache
    const elements = {
        viewport: document.querySelector('.skill-tree-viewport'),
        skillTree: document.getElementById('skill-tree'),
        zoomIn: document.querySelector('.zoom-in'),
        zoomOut: document.querySelector('.zoom-out'),
        reset: document.querySelector('.reset')
    };
    
    /**
     * Initialize the skill tree
     */
    function init() {
        bindEvents();
        loadSkillTreeData();
    }
    
    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Zoom controls
        if (elements.zoomIn) {
            elements.zoomIn.addEventListener('click', () => {
                zoomLevel = zoomLevel + 10000;
                applyTransform();
            });
        }
        
        if (elements.zoomOut) {
            elements.zoomOut.addEventListener('click', () => {
                zoomLevel = zoomLevel - 10000;
                applyTransform();
            });
        }
        
        if (elements.reset) {
            elements.reset.addEventListener('click', resetView);
        }
        
        // Pan controls
        if (elements.viewport) {
            elements.viewport.addEventListener('mousedown', startDrag);
            elements.viewport.addEventListener('mousemove', drag);
            elements.viewport.addEventListener('mouseup', endDrag);
            elements.viewport.addEventListener('mouseleave', endDrag);
            
            // Touch events for mobile
            elements.viewport.addEventListener('touchstart', handleTouchStart);
            elements.viewport.addEventListener('touchmove', handleTouchMove);
            elements.viewport.addEventListener('touchend', handleTouchEnd);
        }
    }
    
    /**
     * Load skill tree data from the backend API
     */
    function loadSkillTreeData() {
        // Try to fetch from the backend API
        fetch(`${API_BASE_URL}${API_ENDPOINTS.SKILL_TREE}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                skillTreeData = data;
                window.skillTreeData = data; // Make it available globally for other modules
                renderSkillTree();
                
                // Dispatch event to notify other modules that data is loaded
                const event = new CustomEvent('skillTreeDataLoaded', {
                    detail: { data: skillTreeData }
                });
                document.dispatchEvent(event);
            })
            .catch(error => {
                console.error('Error loading skill tree data from API:', error);
                console.log('Falling back to local data...');
                
                // Fallback to local data
                fetch('/workout-skill-tree/backend/data/skill_tree.json')
                    .then(response => response.json())
                    .then(data => {
                        skillTreeData = data;
                        window.skillTreeData = data;
                        renderSkillTree();
                        
                        // Dispatch event to notify other modules that data is loaded
                        const event = new CustomEvent('skillTreeDataLoaded', {
                            detail: { data: skillTreeData }
                        });
                        document.dispatchEvent(event);
                    })
                    // .catch(fallbackError => {
                    //     console.error('Error loading local skill tree data:', fallbackError);
                    //     // For development, create a placeholder skill tree as last resort
                    //     createPlaceholderSkillTree();
                    // });
            });
    }
    
    /**
     * Create a placeholder skill tree for development
     */
    function createPlaceholderSkillTree() {
        // This is just for development when the backend is not available
        const placeholderData = {
            exercises: [
                {
                    id: "exercise1",
                    name: "Push-ups",
                    description: "Basic push-up exercise",
                    difficulty: "beginner",
                    category: "Strength",
                    position: { x: 0, y: 0 },
                    prerequisites: []
                },
                {
                    id: "exercise2",
                    name: "Squats",
                    description: "Basic squat exercise",
                    difficulty: "beginner",
                    category: "Strength",
                    position: { x: 150, y: 100 },
                    prerequisites: ["exercise1"]
                },
                {
                    id: "exercise3",
                    name: "Pull-ups",
                    description: "Basic pull-up exercise",
                    difficulty: "intermediate",
                    category: "Strength",
                    position: { x: -150, y: 100 },
                    prerequisites: ["exercise1"]
                }
            ]
        };
        
        skillTreeData = placeholderData;
        window.skillTreeData = placeholderData;
        renderSkillTree();
        
        // Dispatch event to notify other modules that data is loaded
        const event = new CustomEvent('skillTreeDataLoaded', {
            detail: { data: skillTreeData }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Render the skill tree based on the loaded data
     */
    function renderSkillTree() {
        if (!skillTreeData || !skillTreeData.exercises || !elements.skillTree) return;
        
        // Clear existing content
        elements.skillTree.innerHTML = '';
        
        // Calculate center offset
        const viewportRect = elements.viewport.getBoundingClientRect();
        const centerX = viewportRect.width / 2;
        const centerY = viewportRect.height / 2;
        
        // Create nodes
        skillTreeData.exercises.forEach(exercise => {
            createNode(exercise, centerX, centerY);
        });
        
        // Create connections after all nodes are created
        skillTreeData.exercises.forEach(exercise => {
            if (exercise.prerequisites && exercise.prerequisites.length > 0) {
                exercise.prerequisites.forEach(prereqId => {
                    createConnection(prereqId, exercise.id);
                });
            }
        });
        
        // Center the view
        resetView();
    }
    
    /**
     * Create a node for an exercise
     * @param {Object} exercise - The exercise data
     * @param {number} centerX - The center X coordinate of the viewport
     * @param {number} centerY - The center Y coordinate of the viewport
     */
    function createNode(exercise, centerX, centerY) {
        const node = document.createElement('div');
        node.className = 'skill-node';
        node.dataset.id = exercise.id;
        
        // Position the node
        const x = centerX + exercise.position.x;
        const y = centerY + exercise.position.y;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        // Create node content
        const icon = document.createElement('div');
        icon.className = 'skill-node-icon';
        icon.innerHTML = getCategoryIcon(exercise.category);
        
        const label = document.createElement('div');
        label.className = 'skill-node-label';
        label.textContent = exercise.name;
        
        node.appendChild(icon);
        node.appendChild(label);
        
        // Add click event
        node.addEventListener('click', (event) => {
            event.stopPropagation();
            selectNode(exercise.id);
        });
        
        elements.skillTree.appendChild(node);
    }
    
    /**
     * Create a connection between two nodes
     * @param {string} sourceId - The ID of the source node
     * @param {string} targetId - The ID of the target node
     */
    function createConnection(sourceId, targetId) {
        const sourceNode = document.querySelector(`.skill-node[data-id="${sourceId}"]`);
        const targetNode = document.querySelector(`.skill-node[data-id="${targetId}"]`);
        
        if (!sourceNode || !targetNode) return;
        
        const sourceRect = sourceNode.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();
        
        const sourceX = sourceRect.left + sourceRect.width / 2;
        const sourceY = sourceRect.top + sourceRect.height / 2;
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;
        
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        const connection = document.createElement('div');
        connection.className = 'node-connection';
        connection.dataset.source = sourceId;
        connection.dataset.target = targetId;
        
        connection.style.width = `${distance}px`;
        connection.style.left = `${sourceX}px`;
        connection.style.top = `${sourceY}px`;
        connection.style.transform = `rotate(${angle}deg)`;
        
        elements.skillTree.appendChild(connection);
    }
    
    /**
     * Get an icon for a category
     * @param {string} category - The exercise category
     * @returns {string} - HTML for the icon
     */
    function getCategoryIcon(category) {
        const icons = {
            'Strength': '<i class="fas fa-dumbbell"></i>',
            'Cardio': '<i class="fas fa-heartbeat"></i>',
            'Flexibility': '<i class="fas fa-child"></i>',
            'Balance': '<i class="fas fa-balance-scale"></i>',
            'Mobility': '<i class="fas fa-running"></i>'
        };
        
        return icons[category] || '<i class="fas fa-star"></i>';
    }
    
    /**
     * Select a node
     * @param {string} nodeId - The ID of the node to select
     */
    function selectNode(nodeId) {
        // Deselect previously selected node
        if (selectedNodeId) {
            const prevNode = document.querySelector(`.skill-node[data-id="${selectedNodeId}"]`);
            if (prevNode) {
                prevNode.classList.remove('selected');
            }
        }
        
        selectedNodeId = nodeId;
        
        // Select new node
        const node = document.querySelector(`.skill-node[data-id="${nodeId}"]`);
        if (node) {
            node.classList.add('selected');
        }
        
        // Dispatch event for the progress tracker
        const event = new CustomEvent('skillNodeClicked', {
            detail: { id: nodeId }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Apply transform to the skill tree
     */
    function applyTransform() {
        if (!elements.skillTree) return;
        
        elements.skillTree.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
    }
    
    /**
     * Reset the view to the center
     */
    function resetView() {
        zoomLevel = 1;
        panOffset = { x: 0, y: 0 };
        applyTransform();
    }
    
    /**
     * Start dragging the skill tree
     * @param {Event} event - The mouse event
     */
    function startDrag(event) {
        if (event.target.closest('.skill-node')) return;
        
        isDragging = true;
        dragStart = {
            x: event.clientX - panOffset.x,
            y: event.clientY - panOffset.y
        };
        
        elements.viewport.style.cursor = 'grabbing';
    }
    
    /**
     * Drag the skill tree
     * @param {Event} event - The mouse event
     */
    function drag(event) {
        if (!isDragging) return;
        
        panOffset = {
            x: event.clientX - dragStart.x,
            y: event.clientY - dragStart.y
        };
        
        applyTransform();
    }
    
    /**
     * End dragging the skill tree
     */
    function endDrag() {
        isDragging = false;
        elements.viewport.style.cursor = 'grab';
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} event - The touch event
     */
    function handleTouchStart(event) {
        if (event.target.closest('.skill-node')) return;
        
        const touch = event.touches[0];
        startDrag({
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: touch.target
        });
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} event - The touch event
     */
    function handleTouchMove(event) {
        if (!isDragging) return;
        
        const touch = event.touches[0];
        drag({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }
    
    /**
     * Handle touch end event
     */
    function handleTouchEnd() {
        endDrag();
    }
    
    /**
     * Update the skill tree after progress changes
     */
    function updateSkillTree() {
        // This will be called by the progress tracker when progress changes
        // Update node states based on progress
        if (!window.ProgressTracker) return;
        
        const nodes = document.querySelectorAll('.skill-node');
        nodes.forEach(node => {
            const exerciseId = node.dataset.id;
            
            // Remove all state classes
            node.classList.remove('completed', 'available', 'locked');
            
            // Add appropriate state class
            if (window.ProgressTracker.isExerciseCompleted(exerciseId)) {
                node.classList.add('completed');
            } else if (window.ProgressTracker.arePrerequisitesMet({
                id: exerciseId,
                prerequisites: getPrerequisites(exerciseId)
            })) {
                node.classList.add('available');
            } else {
                node.classList.add('locked');
            }
        });
        
        // Update connections
        const connections = document.querySelectorAll('.node-connection');
        connections.forEach(connection => {
            const sourceId = connection.dataset.source;
            const targetId = connection.dataset.target;
            
            connection.classList.remove('completed');
            
            if (window.ProgressTracker.isExerciseCompleted(sourceId) && 
                window.ProgressTracker.isExerciseCompleted(targetId)) {
                connection.classList.add('completed');
            }
        });
    }
    
    /**
     * Get prerequisites for an exercise
     * @param {string} exerciseId - The ID of the exercise
     * @returns {string[]} - Array of prerequisite IDs
     */
    function getPrerequisites(exerciseId) {
        if (!skillTreeData || !skillTreeData.exercises) return [];
        
        const exercise = skillTreeData.exercises.find(ex => ex.id === exerciseId);
        return exercise ? exercise.prerequisites || [] : [];
    }
    
    // Public API
    return {
        init,
        updateSkillTree,
        resetView,
        API_BASE_URL,
        API_ENDPOINTS
    };
})();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    SkillTree.init();
});