/**
 * Workout Skill Tree Visualization
 * This script handles the rendering and interaction of the skill tree
 */

// Global variables
let skillTreeData = null;
let userProgress = null;
const nodeSize = 100; // Size of skill nodes in pixels
const nodeSpacing = 180; // Spacing between nodes
const canvas = document.getElementById('skill-tree-canvas');
const detailsPanel = document.getElementById('skill-details');
const closeDetailsButton = document.getElementById('close-details');
const completeSkillButton = document.getElementById('complete-skill');
let currentSelectedSkill = null;

// Initialize the skill tree
async function initSkillTree() {
    try {
        // Fetch skill tree data
        const skillTreeResponse = await fetch('/backend/data/skill_tree.json');
        skillTreeData = await skillTreeResponse.json();
        
        // Fetch user progress data
        const userProgressResponse = await fetch('/backend/data/user_progress.json');
        userProgress = await userProgressResponse.json();
        
        // Update UI with user XP
        document.getElementById('user-xp').textContent = `XP: ${userProgress.current_xp}`;
        
        // Render the skill tree
        renderSkillTree();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing skill tree:', error);
        // Display a user-friendly error message
        canvas.innerHTML = `
            <div class="error-message">
                <h3>Error loading skill tree</h3>
                <p>Please try refreshing the page.</p>
            </div>
        `;
    }
}

// Calculate node positions in the skill tree
function calculateNodePositions() {
    // Create a map of nodes by ID for easy lookup
    const nodesById = {};
    skillTreeData.nodes.forEach(node => {
        nodesById[node.id] = node;
    });
    
    // Group nodes by their level in the tree (based on prerequisites)
    const nodesByLevel = [];
    
    // First, find root nodes (no prerequisites)
    const rootNodes = skillTreeData.nodes.filter(node => node.prerequisites.length === 0);
    nodesByLevel[0] = rootNodes;
    
    // Assign levels to all other nodes
    let currentLevel = 0;
    let allNodesAssigned = false;
    
    while (!allNodesAssigned) {
        const nextLevelNodes = [];
        allNodesAssigned = true;
        
        skillTreeData.nodes.forEach(node => {
            // Skip nodes that already have a level assigned
            if (node.hasOwnProperty('level')) return;
            
            // Check if all prerequisites are in previous levels
            const allPrereqsAssigned = node.prerequisites.every(prereqId => {
                const prereqNode = nodesById[prereqId];
                return prereqNode && prereqNode.hasOwnProperty('level');
            });
            
            if (allPrereqsAssigned) {
                node.level = currentLevel + 1;
                nextLevelNodes.push(node);
            } else {
                allNodesAssigned = false;
            }
        });
        
        if (nextLevelNodes.length > 0) {
            nodesByLevel[currentLevel + 1] = nextLevelNodes;
            currentLevel++;
        } else if (!allNodesAssigned) {
            // If we have nodes without assigned levels but can't progress,
            // there might be a circular dependency
            console.error('Possible circular dependency in skill tree');
            break;
        }
    }
    
    // Calculate x and y coordinates for each node
    const maxNodesInLevel = Math.max(...nodesByLevel.map(level => level.length));
    const canvasWidth = Math.max(canvas.clientWidth, maxNodesInLevel * nodeSpacing);
    
    nodesByLevel.forEach((levelNodes, level) => {
        const levelWidth = levelNodes.length * nodeSpacing;
        const startX = (canvasWidth - levelWidth) / 2 + nodeSpacing / 2;
        
        levelNodes.forEach((node, index) => {
            node.x = startX + index * nodeSpacing;
            node.y = level * nodeSpacing + 100; // Add some top margin
        });
    });
    
    return nodesById;
}

// Render the skill tree visualization
function renderSkillTree() {
    // Calculate positions for all nodes
    const nodesById = calculateNodePositions();
    
    // Set canvas size
    const maxX = Math.max(...skillTreeData.nodes.map(node => node.x || 0)) + nodeSize + 50;
    const maxY = Math.max(...skillTreeData.nodes.map(node => node.y || 0)) + nodeSize + 50;
    canvas.style.width = `${maxX}px`;
    canvas.style.height = `${maxY}px`;
    
    // First render connections between nodes
    skillTreeData.nodes.forEach(node => {
        node.prerequisites.forEach(prereqId => {
            const prereqNode = nodesById[prereqId];
            if (prereqNode) {
                renderConnection(prereqNode, node);
            }
        });
    });
    
    // Then render nodes (so they appear on top of connections)
    skillTreeData.nodes.forEach(node => {
        renderNode(node);
    });
}

// Render a connection line between two nodes
function renderConnection(fromNode, toNode) {
    const connection = document.createElement('div');
    connection.className = 'skill-connection';
    
    // Calculate connection position and length
    const fromX = fromNode.x + nodeSize / 2;
    const fromY = fromNode.y + nodeSize / 2;
    const toX = toNode.x + nodeSize / 2;
    const toY = toNode.y + nodeSize / 2;
    
    const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
    
    connection.style.width = `${length}px`;
    connection.style.left = `${fromX}px`;
    connection.style.top = `${fromY}px`;
    connection.style.transform = `rotate(${angle}deg)`;
    
    // Add data attributes for easier reference
    connection.dataset.from = fromNode.id;
    connection.dataset.to = toNode.id;
    
    // Check if this connection should be marked as completed
    if (userProgress.completed_skills.includes(fromNode.id) && 
        userProgress.completed_skills.includes(toNode.id)) {
        connection.classList.add('completed');
    }
    
    canvas.appendChild(connection);
}

// Render a skill node
function renderNode(node) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'skill-node';
    nodeElement.id = `node-${node.id}`;
    nodeElement.dataset.skillId = node.id;
    
    // Add category class for styling
    nodeElement.classList.add(node.category);
    
    // Set node position
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    
    // Add node content
    nodeElement.innerHTML = `
        <div class="node-name">${node.name}</div>
    `;
    
    // Determine node state (completed, available, or locked)
    if (userProgress.completed_skills.includes(node.id)) {
        nodeElement.classList.add('completed');
    } else if (isSkillAvailable(node)) {
        nodeElement.classList.add('available');
    } else {
        nodeElement.classList.add('locked');
    }
    
    canvas.appendChild(nodeElement);
}

// Check if a skill is available based on prerequisites
function isSkillAvailable(node) {
    // If the skill has no prerequisites, it's always available
    if (node.prerequisites.length === 0) {
        return true;
    }
    
    // Check if all prerequisites are completed
    return node.prerequisites.every(prereqId => 
        userProgress.completed_skills.includes(prereqId)
    );
}

// Set up event listeners for user interactions
function setupEventListeners() {
    // Node click event
    canvas.addEventListener('click', (event) => {
        const node = event.target.closest('.skill-node');
        if (node) {
            const skillId = node.dataset.skillId;
            const skillData = skillTreeData.nodes.find(n => n.id === skillId);
            
            if (skillData) {
                showSkillDetails(skillData);
            }
        }
    });
    
    // Close details panel
    closeDetailsButton.addEventListener('click', () => {
        hideSkillDetails();
    });
    
    // Complete skill button
    completeSkillButton.addEventListener('click', () => {
        if (currentSelectedSkill) {
            completeSkill(currentSelectedSkill.id);
        }
    });
    
    // Allow panning the skill tree by dragging
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.target === canvas) {
            isDragging = true;
            startX = e.pageX - canvas.offsetLeft;
            startY = e.pageY - canvas.offsetTop;
            scrollLeft = canvas.parentElement.scrollLeft;
            scrollTop = canvas.parentElement.scrollTop;
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - canvas.offsetLeft;
        const y = e.pageY - canvas.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        canvas.parentElement.scrollLeft = scrollLeft - walkX;
        canvas.parentElement.scrollTop = scrollTop - walkY;
    });
}

// Show skill details in the panel
function showSkillDetails(skill) {
    currentSelectedSkill = skill;
    
    // Populate details panel
    document.getElementById('skill-name').textContent = skill.name;
    document.getElementById('skill-description').textContent = skill.description;
    document.getElementById('skill-difficulty').textContent = '⭐'.repeat(skill.difficulty);
    document.getElementById('skill-xp').textContent = skill.xp;
    
    // Get category name
    const category = skillTreeData.categories.find(c => c.id === skill.category);
    document.getElementById('skill-category').textContent = category ? category.name : skill.category;
    
    // Update complete button state
    const isCompleted = userProgress.completed_skills.includes(skill.id);
    const isAvailable = isSkillAvailable(skill);
    
    if (isCompleted) {
        completeSkillButton.textContent = 'Completed';
        completeSkillButton.disabled = true;
    } else if (isAvailable) {
        completeSkillButton.textContent = 'Mark as Complete';
        completeSkillButton.disabled = false;
    } else {
        completeSkillButton.textContent = 'Locked';
        completeSkillButton.disabled = true;
    }
    
    // Show the panel
    detailsPanel.classList.remove('hidden');
}

// Hide skill details panel
function hideSkillDetails() {
    detailsPanel.classList.add('hidden');
    currentSelectedSkill = null;
}

// Mark a skill as complete
function completeSkill(skillId) {
    // Find the skill data
    const skill = skillTreeData.nodes.find(node => node.id === skillId);
    if (!skill) return;
    
    // Check if skill is already completed
    if (userProgress.completed_skills.includes(skillId)) return;
    
    // Check if skill is available
    if (!isSkillAvailable(skill)) return;
    
    // Update user progress
    userProgress.completed_skills.push(skillId);
    userProgress.current_xp += skill.xp;
    userProgress.last_updated = new Date().toISOString();
    
    // Update UI
    document.getElementById('user-xp').textContent = `XP: ${userProgress.current_xp}`;
    
    // Update node appearance
    const nodeElement = document.getElementById(`node-${skillId}`);
    if (nodeElement) {
        nodeElement.classList.remove('available');
        nodeElement.classList.add('completed');
    }
    
    // Update connections
    updateConnections();
    
    // Update skill details panel
    if (currentSelectedSkill && currentSelectedSkill.id === skillId) {
        completeSkillButton.textContent = 'Completed';
        completeSkillButton.disabled = true;
    }
    
    // Save progress to server
    saveUserProgress();
    
    // Trigger confetti animation
    if (typeof triggerConfetti === 'function') {
        triggerConfetti();
    }
}

// Update connection lines after completing skills
function updateConnections() {
    const connections = document.querySelectorAll('.skill-connection');
    
    connections.forEach(connection => {
        const fromId = connection.dataset.from;
        const toId = connection.dataset.to;
        
        if (userProgress.completed_skills.includes(fromId) && 
            userProgress.completed_skills.includes(toId)) {
            connection.classList.add('completed');
        }
    });
    
    // Update available nodes
    skillTreeData.nodes.forEach(node => {
        if (!userProgress.completed_skills.includes(node.id)) {
            const nodeElement = document.getElementById(`node-${node.id}`);
            if (nodeElement) {
                if (isSkillAvailable(node)) {
                    nodeElement.classList.remove('locked');
                    nodeElement.classList.add('available');
                } else {
                    nodeElement.classList.remove('available');
                    nodeElement.classList.add('locked');
                }
            }
        }
    });
}

// Save user progress to the server
async function saveUserProgress() {
    try {
        const response = await fetch('/backend/data/user_progress.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userProgress)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save progress');
        }
    } catch (error) {
        console.error('Error saving progress:', error);
        // For development, we'll just log the error
        // In production, we might want to show a notification to the user
    }
}

// Initialize the skill tree when the page loads
window.addEventListener('DOMContentLoaded', initSkillTree);