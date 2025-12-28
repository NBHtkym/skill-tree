/**
 * Workout Skill Tree - Skill Tree Visualization
 * Hierarchical top-to-bottom layout with hover tooltips
 */

const SkillTree = (function() {
    let skillTreeData = null;
    let zoomLevel = 1;
    let panOffset = { x: 0, y: 0 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let hoveredNodeId = null;
    
    const API_ENDPOINTS = {
        SKILL_TREE: '/api/skill-tree',
        EXERCISES: '/api/exercises',
        PROGRESS: '/api/progress',
        AVAILABLE_EXERCISES: '/api/available-exercises',
        CREATE_EXERCISE: '/api/exercises/create'
    };
    
    const API_BASE_URL = '';
    
    const NODE_WIDTH = 70;
    const NODE_HEIGHT = 70;
    const HORIZONTAL_SPACING = 100;
    const VERTICAL_SPACING = 120;
    const PADDING = 80;
    
    const elements = {
        viewport: null,
        skillTree: null,
        zoomIn: null,
        zoomOut: null,
        reset: null,
        tooltip: null
    };
    
    function init() {
        elements.viewport = document.querySelector('.skill-tree-viewport');
        elements.skillTree = document.getElementById('skill-tree');
        elements.zoomIn = document.querySelector('.zoom-in');
        elements.zoomOut = document.querySelector('.zoom-out');
        elements.reset = document.querySelector('.reset');
        elements.tooltip = document.getElementById('exercise-tooltip');
        
        bindEvents();
        loadSkillTreeData();
    }
    
    function bindEvents() {
        if (elements.zoomIn) {
            elements.zoomIn.addEventListener('click', () => {
                zoomLevel = Math.min(zoomLevel * 1.2, 3);
                applyTransform();
            });
        }
        
        if (elements.zoomOut) {
            elements.zoomOut.addEventListener('click', () => {
                zoomLevel = Math.max(zoomLevel / 1.2, 0.2);
                applyTransform();
            });
        }
        
        if (elements.reset) {
            elements.reset.addEventListener('click', resetView);
        }
        
        if (elements.viewport) {
            elements.viewport.addEventListener('mousedown', startDrag);
            elements.viewport.addEventListener('mousemove', drag);
            elements.viewport.addEventListener('mouseup', endDrag);
            elements.viewport.addEventListener('mouseleave', endDrag);
            
            elements.viewport.addEventListener('wheel', handleWheel, { passive: false });
        }
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.skill-node') && !e.target.closest('.exercise-tooltip')) {
                hideTooltip();
            }
        });
    }
    
    function handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomLevel = Math.min(Math.max(zoomLevel * delta, 0.2), 3);
        applyTransform();
    }
    
    function loadSkillTreeData() {
        fetch(`${API_BASE_URL}${API_ENDPOINTS.EXERCISES}`, { credentials: 'include' })
            .then(response => {
                if (!response.ok) throw new Error(`API error: ${response.status}`);
                return response.json();
            })
            .then(data => {
                skillTreeData = data;
                window.skillTreeData = data;
                renderSkillTree();
                
                document.dispatchEvent(new CustomEvent('skillTreeDataLoaded', {
                    detail: { data: skillTreeData }
                }));
            })
            .catch(error => {
                console.error('Error loading exercises, falling back to skill tree:', error);
                fetch(`${API_BASE_URL}${API_ENDPOINTS.SKILL_TREE}`)
                    .then(response => response.json())
                    .then(data => {
                        skillTreeData = data;
                        window.skillTreeData = data;
                        renderSkillTree();
                        document.dispatchEvent(new CustomEvent('skillTreeDataLoaded', {
                            detail: { data: skillTreeData }
                        }));
                    })
                    .catch(() => createPlaceholderSkillTree());
            });
    }
    
    function reloadSkillTree() {
        loadSkillTreeData();
    }
    
    function createPlaceholderSkillTree() {
        skillTreeData = {
            exercises: [
                { id: "1", name: "Push-ups", difficulty: 1, category: "Strength", prerequisites: [], position: { x: 0, y: 0 } },
                { id: "2", name: "Squats", difficulty: 1, category: "Strength", prerequisites: [], position: { x: 0, y: 0 } },
                { id: "3", name: "Diamond Push-ups", difficulty: 3, category: "Strength", prerequisites: ["1"], position: { x: 0, y: 0 } },
                { id: "4", name: "Pistol Squats", difficulty: 5, category: "Strength", prerequisites: ["2"], position: { x: 0, y: 0 } }
            ]
        };
        window.skillTreeData = skillTreeData;
        renderSkillTree();
        document.dispatchEvent(new CustomEvent('skillTreeDataLoaded', { detail: { data: skillTreeData } }));
    }
    
    function computeHierarchicalLayout(exercises) {
        if (!exercises || exercises.length === 0) return [];
        
        const exerciseMap = new Map();
        exercises.forEach(ex => exerciseMap.set(ex.id, { ...ex, level: 0, children: [] }));
        
        exercises.forEach(ex => {
            if (ex.prerequisites && ex.prerequisites.length > 0) {
                ex.prerequisites.forEach(prereqId => {
                    const parent = exerciseMap.get(prereqId);
                    if (parent) {
                        parent.children.push(ex.id);
                    }
                });
            }
        });
        
        const roots = [];
        exerciseMap.forEach((ex, id) => {
            if (!ex.prerequisites || ex.prerequisites.length === 0) {
                roots.push(id);
            }
        });
        
        function assignLevels(nodeId, level) {
            const node = exerciseMap.get(nodeId);
            if (!node) return;
            node.level = Math.max(node.level, level);
            node.children.forEach(childId => assignLevels(childId, level + 1));
        }
        
        roots.forEach(rootId => assignLevels(rootId, 0));
        
        const levels = new Map();
        exerciseMap.forEach((ex, id) => {
            if (!levels.has(ex.level)) {
                levels.set(ex.level, []);
            }
            levels.get(ex.level).push(id);
        });
        
        const subsetOrder = new Map();
        let subsetIndex = 0;
        exercises.forEach(ex => {
            const subset = ex.subset || ex.category || 'default';
            if (!subsetOrder.has(subset)) {
                subsetOrder.set(subset, subsetIndex++);
            }
        });
        
        levels.forEach((nodeIds, level) => {
            nodeIds.sort((a, b) => {
                const exA = exerciseMap.get(a);
                const exB = exerciseMap.get(b);
                const subsetA = exA.subset || exA.category || 'default';
                const subsetB = exB.subset || exB.category || 'default';
                return (subsetOrder.get(subsetA) || 0) - (subsetOrder.get(subsetB) || 0);
            });
        });
        
        const maxLevel = Math.max(...Array.from(levels.keys()));
        
        function getBarycenter(nodeId, useParents) {
            const node = exerciseMap.get(nodeId);
            if (!node) return 0;
            
            let connectedNodes = [];
            if (useParents && node.prerequisites) {
                connectedNodes = node.prerequisites.filter(id => exerciseMap.has(id));
            } else {
                connectedNodes = node.children || [];
            }
            
            if (connectedNodes.length === 0) return null;
            
            let sum = 0;
            connectedNodes.forEach(connId => {
                const connNode = exerciseMap.get(connId);
                if (connNode && connNode.orderIndex !== undefined) {
                    sum += connNode.orderIndex;
                }
            });
            return sum / connectedNodes.length;
        }
        
        levels.get(0)?.forEach((nodeId, index) => {
            exerciseMap.get(nodeId).orderIndex = index;
        });
        
        for (let pass = 0; pass < 4; pass++) {
            for (let level = 1; level <= maxLevel; level++) {
                const nodeIds = levels.get(level) || [];
                nodeIds.forEach(nodeId => {
                    const bc = getBarycenter(nodeId, true);
                    if (bc !== null) {
                        exerciseMap.get(nodeId).barycenter = bc;
                    }
                });
                
                nodeIds.sort((a, b) => {
                    const bcA = exerciseMap.get(a).barycenter;
                    const bcB = exerciseMap.get(b).barycenter;
                    if (bcA === undefined && bcB === undefined) return 0;
                    if (bcA === undefined) return 1;
                    if (bcB === undefined) return -1;
                    return bcA - bcB;
                });
                
                nodeIds.forEach((nodeId, index) => {
                    exerciseMap.get(nodeId).orderIndex = index;
                });
            }
            
            for (let level = maxLevel - 1; level >= 0; level--) {
                const nodeIds = levels.get(level) || [];
                nodeIds.forEach(nodeId => {
                    const bc = getBarycenter(nodeId, false);
                    if (bc !== null) {
                        exerciseMap.get(nodeId).barycenter = bc;
                    }
                });
                
                nodeIds.sort((a, b) => {
                    const bcA = exerciseMap.get(a).barycenter;
                    const bcB = exerciseMap.get(b).barycenter;
                    if (bcA === undefined && bcB === undefined) return 0;
                    if (bcA === undefined) return 1;
                    if (bcB === undefined) return -1;
                    return bcA - bcB;
                });
                
                nodeIds.forEach((nodeId, index) => {
                    exerciseMap.get(nodeId).orderIndex = index;
                });
            }
        }
        
        const positions = [];
        
        levels.forEach((nodeIds, level) => {
            const levelWidth = nodeIds.length * (NODE_WIDTH + HORIZONTAL_SPACING);
            const startX = -levelWidth / 2 + NODE_WIDTH / 2;
            
            nodeIds.forEach((nodeId, index) => {
                const ex = exerciseMap.get(nodeId);
                positions.push({
                    ...ex,
                    computedX: startX + index * (NODE_WIDTH + HORIZONTAL_SPACING),
                    computedY: level * (NODE_HEIGHT + VERTICAL_SPACING)
                });
            });
        });
        
        return positions;
    }
    
    function renderSkillTree() {
        if (!skillTreeData || !skillTreeData.exercises || !elements.skillTree) return;
        
        elements.skillTree.innerHTML = '';
        
        const layoutData = computeHierarchicalLayout(skillTreeData.exercises);
        
        if (layoutData.length === 0) return;
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        layoutData.forEach(node => {
            minX = Math.min(minX, node.computedX);
            maxX = Math.max(maxX, node.computedX);
            minY = Math.min(minY, node.computedY);
            maxY = Math.max(maxY, node.computedY);
        });
        
        const contentWidth = maxX - minX + NODE_WIDTH + PADDING * 2;
        const contentHeight = maxY - minY + NODE_HEIGHT + PADDING * 2;
        
        elements.skillTree.style.width = `${contentWidth}px`;
        elements.skillTree.style.height = `${contentHeight}px`;
        
        const offsetX = -minX + PADDING;
        const offsetY = -minY + PADDING;
        
        layoutData.forEach(node => {
            createNode(node, offsetX, offsetY);
        });
        
        layoutData.forEach(node => {
            if (node.prerequisites && node.prerequisites.length > 0) {
                node.prerequisites.forEach(prereqId => {
                    createConnection(prereqId, node.id);
                });
            }
        });
        
        if (elements.viewport) {
            elements.viewport.scrollLeft = (contentWidth - elements.viewport.clientWidth) / 2;
            elements.viewport.scrollTop = 0;
        }
    }
    
    function createNode(exercise, offsetX, offsetY) {
        const node = document.createElement('div');
        node.className = 'skill-node';
        node.dataset.id = exercise.id;
        
        const x = exercise.computedX + offsetX;
        const y = exercise.computedY + offsetY;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        const icon = document.createElement('div');
        icon.className = 'skill-node-icon';
        icon.innerHTML = getCategoryIcon(exercise.category);
        
        const label = document.createElement('div');
        label.className = 'skill-node-label';
        label.textContent = exercise.name;
        
        node.appendChild(icon);
        node.appendChild(label);
        
        node.addEventListener('mouseenter', (e) => showTooltip(exercise, e));
        node.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!elements.tooltip.matches(':hover')) {
                    hideTooltip();
                }
            }, 100);
        });
        
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            showTooltip(exercise, e);
        });
        
        elements.skillTree.appendChild(node);
    }
    
    function createConnection(sourceId, targetId) {
        const sourceNode = document.querySelector(`.skill-node[data-id="${sourceId}"]`);
        const targetNode = document.querySelector(`.skill-node[data-id="${targetId}"]`);
        
        if (!sourceNode || !targetNode) return;
        
        const sourceX = parseFloat(sourceNode.style.left) + NODE_WIDTH / 2;
        const sourceY = parseFloat(sourceNode.style.top) + NODE_HEIGHT;
        const targetX = parseFloat(targetNode.style.left) + NODE_WIDTH / 2;
        const targetY = parseFloat(targetNode.style.top);
        
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
        connection.style.transformOrigin = '0 0';
        
        elements.skillTree.appendChild(connection);
    }
    
    function showTooltip(exercise, event) {
        if (!elements.tooltip) return;
        
        hoveredNodeId = exercise.id;
        
        const title = elements.tooltip.querySelector('.tooltip-title');
        const category = elements.tooltip.querySelector('.tooltip-category');
        const description = elements.tooltip.querySelector('.tooltip-description');
        const prereqsList = elements.tooltip.querySelector('.prereqs-list');
        const difficultyValue = elements.tooltip.querySelector('.difficulty-value');
        const completeBtn = elements.tooltip.querySelector('.tooltip-complete-btn');
        
        if (title) title.textContent = exercise.name;
        if (category) category.textContent = exercise.category || exercise.subset || 'General';
        if (description) description.textContent = exercise.description || 'No description available.';
        if (difficultyValue) difficultyValue.textContent = exercise.difficulty || 1;
        
        if (prereqsList) {
            prereqsList.innerHTML = '';
            if (exercise.prerequisites && exercise.prerequisites.length > 0) {
                exercise.prerequisites.forEach(prereqId => {
                    const prereq = skillTreeData.exercises.find(ex => ex.id === prereqId);
                    if (prereq) {
                        const li = document.createElement('li');
                        li.textContent = prereq.name;
                        if (window.ProgressTracker && window.ProgressTracker.isExerciseCompleted(prereqId)) {
                            li.classList.add('completed');
                        }
                        prereqsList.appendChild(li);
                    }
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'None (starter exercise)';
                li.classList.add('completed');
                prereqsList.appendChild(li);
            }
        }
        
        if (completeBtn) {
            const isCompleted = window.ProgressTracker && window.ProgressTracker.isExerciseCompleted(exercise.id);
            const isAvailable = !isCompleted && (!window.ProgressTracker || 
                window.ProgressTracker.arePrerequisitesMet(exercise));
            
            // Remove old listener
            completeBtn.replaceWith(completeBtn.cloneNode(true));
            const newBtn = elements.tooltip.querySelector('.tooltip-complete-btn');
            
            if (isCompleted) {
                newBtn.textContent = 'Completed ✓';
                newBtn.disabled = true;
                newBtn.classList.add('completed');
            } else if (isAvailable) {
                newBtn.textContent = 'Mark Complete';
                newBtn.disabled = false;
                newBtn.classList.remove('completed');
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Complete button clicked for:', exercise.id);
                    if (window.ProgressTracker) {
                        const success = window.ProgressTracker.completeExercise(exercise.id);
                        console.log('completeExercise returned:', success);
                        if (success) {
                            newBtn.textContent = 'Completed ✓';
                            newBtn.disabled = true;
                            newBtn.classList.add('completed');
                            updateSkillTree();
                        }
                    }
                });
            } else {
                newBtn.textContent = 'Locked';
                newBtn.disabled = true;
                newBtn.classList.remove('completed');
            }
        }
        
        elements.tooltip.classList.remove('hidden');
        
        const rect = event.target.closest('.skill-node').getBoundingClientRect();
        let left = rect.right + 10;
        let top = rect.top;
        
        const tooltipRect = elements.tooltip.getBoundingClientRect();
        if (left + tooltipRect.width > window.innerWidth) {
            left = rect.left - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = window.innerHeight - tooltipRect.height - 10;
        }
        
        elements.tooltip.style.left = `${left}px`;
        elements.tooltip.style.top = `${top}px`;
    }
    
    function hideTooltip() {
        if (elements.tooltip) {
            elements.tooltip.classList.add('hidden');
        }
        hoveredNodeId = null;
    }
    
    function getCategoryIcon(category) {
        const icons = {
            'Strength': '<i class="fas fa-dumbbell"></i>',
            'Cardio': '<i class="fas fa-heartbeat"></i>',
            'Flexibility': '<i class="fas fa-child"></i>',
            'Balance': '<i class="fas fa-balance-scale"></i>',
            'Mobility': '<i class="fas fa-running"></i>',
            'Gymnastics': '<i class="fas fa-star"></i>'
        };
        return icons[category] || '<i class="fas fa-star"></i>';
    }
    
    function applyTransform() {
        if (!elements.skillTree) return;
        elements.skillTree.style.transform = `scale(${zoomLevel})`;
        elements.skillTree.style.transformOrigin = 'center top';
    }
    
    function resetView() {
        zoomLevel = 1;
        panOffset = { x: 0, y: 0 };
        applyTransform();
        if (elements.viewport && elements.skillTree) {
            elements.viewport.scrollLeft = (elements.skillTree.offsetWidth - elements.viewport.clientWidth) / 2;
            elements.viewport.scrollTop = 0;
        }
    }
    
    function startDrag(event) {
        if (event.target.closest('.skill-node')) return;
        isDragging = true;
        dragStart = { x: event.clientX, y: event.clientY };
        elements.viewport.style.cursor = 'grabbing';
    }
    
    function drag(event) {
        if (!isDragging) return;
        const dx = dragStart.x - event.clientX;
        const dy = dragStart.y - event.clientY;
        dragStart = { x: event.clientX, y: event.clientY };
        elements.viewport.scrollLeft += dx;
        elements.viewport.scrollTop += dy;
    }
    
    function endDrag() {
        isDragging = false;
        if (elements.viewport) {
            elements.viewport.style.cursor = 'grab';
        }
    }
    
    function updateSkillTree() {
        if (!window.ProgressTracker) return;
        
        const nodes = document.querySelectorAll('.skill-node');
        nodes.forEach(node => {
            const exerciseId = node.dataset.id;
            const exercise = skillTreeData.exercises.find(ex => ex.id === exerciseId);
            
            node.classList.remove('completed', 'available', 'locked');
            
            if (window.ProgressTracker.isExerciseCompleted(exerciseId)) {
                node.classList.add('completed');
            } else if (window.ProgressTracker.arePrerequisitesMet(exercise)) {
                node.classList.add('available');
            } else {
                node.classList.add('locked');
            }
        });
        
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
        
        updateStats();
    }
    
    function updateStats() {
        if (!window.ProgressTracker) return;
        
        const completedCount = document.getElementById('completed-count');
        const availableCount = document.getElementById('available-count');
        const lockedCount = document.getElementById('locked-count');
        
        if (completedCount) {
            completedCount.textContent = window.ProgressTracker.getCompletedExercises().length;
        }
        if (availableCount) {
            availableCount.textContent = window.ProgressTracker.getAvailableExercises().length;
        }
        if (lockedCount) {
            lockedCount.textContent = window.ProgressTracker.getLockedExercises().length;
        }
    }
    
    return {
        init,
        updateSkillTree,
        resetView,
        updateStats,
        reloadSkillTree,
        API_BASE_URL,
        API_ENDPOINTS
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    SkillTree.init();
});
