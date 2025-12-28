/**
 * Workout Skill Tree - Progress Tracking Functionality
 * 
 * This module handles tracking user progress through the skill tree,
 * including marking exercises as completed, checking prerequisites,
 * and persisting progress in the backend API with localStorage fallback.
 */

// Define the ProgressTracker module using an IIFE to avoid global namespace pollution
const ProgressTracker = (function() {
    // Private variables
    const STORAGE_KEY = 'workout-skill-tree-progress';
    const API_ENDPOINTS = {
        PROGRESS: '/api/progress',
        AVAILABLE_EXERCISES: '/api/available-exercises'
    };
    let skillTreeData = null;
    let completedExercises = [];
    let availableExercises = [];
    let lockedExercises = [];
    let isApiAvailable = false;
    
    function getAuthHeaders() {
        if (window.Auth && window.Auth.getAuthHeaders) {
            return window.Auth.getAuthHeaders();
        }
        return { 'Content-Type': 'application/json' };
    }
    
    // DOM elements cache (updated for new full-screen layout)
    const elements = {
        skillTree: document.getElementById('skill-tree'),
        completedCount: document.getElementById('completed-count'),
        availableCount: document.getElementById('available-count'),
        lockedCount: document.getElementById('locked-count')
    };
    
    /**
     * Initialize the progress tracker
     * @param {Object} data - The skill tree data
     */
    function init(data) {
        skillTreeData = data;
        checkApiAvailability().then(() => {
            loadProgress();
        });
        bindEvents();
        console.log('Progress tracker initialized');
    }
    
    /**
     * Check if the backend API is available
     * @returns {Promise} - Resolves when check is complete
     */
    function checkApiAvailability() {
        return new Promise((resolve) => {
            fetch(API_ENDPOINTS.PROGRESS, { credentials: 'include', headers: getAuthHeaders() })
                .then(response => {
                    if (response.ok) {
                        isApiAvailable = true;
                        console.log('Backend API is available');
                    } else {
                        isApiAvailable = false;
                        console.warn('Backend API returned error:', response.status);
                    }
                })
                .catch(error => {
                    isApiAvailable = false;
                    console.warn('Backend API is not available:', error);
                })
                .finally(() => {
                    resolve();
                });
        });
    }
    
    /**
     * Load user progress from backend API or localStorage
     */
    function loadProgress() {
        if (isApiAvailable) {
            // Load from backend API
            fetch(API_ENDPOINTS.PROGRESS, { credentials: 'include', headers: getAuthHeaders() })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    completedExercises = data.completed_exercises || [];
                    console.log('Loaded progress from API:', completedExercises);
                    updateExerciseStates();
                    updateUI();
                })
                .catch(error => {
                    console.error('Error loading progress from API:', error);
                    // Fall back to localStorage
                    loadProgressFromLocalStorage();
                });
        } else {
            // Load from localStorage
            loadProgressFromLocalStorage();
        }
    }
    
    /**
     * Load user progress from localStorage
     */
    function loadProgressFromLocalStorage() {
        try {
            const savedProgress = localStorage.getItem(STORAGE_KEY);
            if (savedProgress) {
                completedExercises = JSON.parse(savedProgress);
                console.log('Loaded progress from localStorage:', completedExercises);
            }
            updateExerciseStates();
            updateUI();
        } catch (error) {
            console.error('Error loading progress from localStorage:', error);
            completedExercises = [];
            updateExerciseStates();
            updateUI();
        }
    }
    
    /**
     * Save user progress to backend API and localStorage
     */
    function saveProgress() {
        // Always save to localStorage as a backup
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(completedExercises));
            console.log('Progress saved to localStorage:', completedExercises);
        } catch (error) {
            console.error('Error saving progress to localStorage:', error);
        }
        
        // If API is available, save to backend
        if (isApiAvailable) {
            // We don't need to send the entire progress object, just update individual exercises
            // This is handled in completeExercise and uncompleteExercise methods
        }
    }
    
    /**
     * Update the state of all exercises (completed, available, locked)
     */
    function updateExerciseStates() {
        if (!skillTreeData || !skillTreeData.exercises) return;
        
        availableExercises = [];
        lockedExercises = [];
        
        skillTreeData.exercises.forEach(exercise => {
            if (isExerciseCompleted(exercise.id)) {
                // Already completed
            } else if (arePrerequisitesMet(exercise)) {
                availableExercises.push(exercise.id);
            } else {
                lockedExercises.push(exercise.id);
            }
        });
    }
    
    /**
     * Check if an exercise is completed
     * @param {string} exerciseId - The ID of the exercise to check
     * @returns {boolean} - True if the exercise is completed
     */
    function isExerciseCompleted(exerciseId) {
        return completedExercises.includes(exerciseId);
    }
    
    /**
     * Check if all prerequisites for an exercise are met
     * @param {Object} exercise - The exercise to check
     * @returns {boolean} - True if all prerequisites are completed or there are none
     */
    function arePrerequisitesMet(exercise) {
        if (!exercise.prerequisites || exercise.prerequisites.length === 0) {
            return true;
        }
        
        return exercise.prerequisites.every(prereqId => isExerciseCompleted(prereqId));
    }
    
    /**
     * Mark an exercise as completed
     * @param {string} exerciseId - The ID of the exercise to mark as completed
     * @returns {boolean} - True if the exercise was successfully marked as completed
     */
    function completeExercise(exerciseId) {
        console.log('completeExercise called for:', exerciseId);
        
        if (isExerciseCompleted(exerciseId)) {
            console.log('Exercise already completed:', exerciseId);
            return false;
        }
        
        const exercise = skillTreeData.exercises.find(ex => ex.id === exerciseId);
        if (!exercise) {
            console.error('Exercise not found:', exerciseId);
            return false;
        }
        
        if (!arePrerequisitesMet(exercise)) {
            console.error('Prerequisites not met for exercise:', exerciseId);
            return false;
        }
        
        // Update local state immediately
        completedExercises.push(exerciseId);
        
        // Update UI immediately (don't wait for API)
        saveProgress();
        updateExerciseStates();
        updateUI();
        
        // Trigger confetti animation
        if (window.showSkillMasteredAnimation) {
            window.showSkillMasteredAnimation(exerciseId);
        }
        
        // Try to sync with backend (async, don't block UI)
        fetch(API_ENDPOINTS.PROGRESS, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                exercise_id: exerciseId,
                completed: true
            })
        })
        .then(response => {
            if (!response.ok) {
                console.warn('API sync failed, using localStorage:', response.status);
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.progress && data.progress.completed_exercises) {
                console.log('Exercise completion synced to API:', data);
                completedExercises = data.progress.completed_exercises;
                updateExerciseStates();
                updateUI();
            }
        })
        .catch(error => {
            console.warn('API sync error, using localStorage:', error);
        });
        
        return true;
    }
    
    /**
     * Unmark an exercise as completed
     * @param {string} exerciseId - The ID of the exercise to unmark
     */
    function uncompleteExercise(exerciseId) {
        const index = completedExercises.indexOf(exerciseId);
        if (index === -1) {
            console.log('Exercise not completed:', exerciseId);
            return;
        }
        
        // Update backend if available
        if (isApiAvailable) {
            fetch(API_ENDPOINTS.PROGRESS, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    exercise_id: exerciseId,
                    completed: false
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Exercise uncompletion saved to API:', data);
                // Update local state with the latest from the server
                if (data.progress && data.progress.completed_exercises) {
                    completedExercises = data.progress.completed_exercises;
                } else {
                    // Remove from local state if API doesn't return updated list
                    completedExercises.splice(index, 1);
                }
                updateExerciseStates();
                updateUI();
            })
            .catch(error => {
                console.error('Error saving exercise uncompletion to API:', error);
                // Keep the local update but save to localStorage as fallback
                completedExercises.splice(index, 1);
                saveProgress();
                updateExerciseStates();
                updateUI();
            });
        } else {
            // Just update localStorage
            completedExercises.splice(index, 1);
            saveProgress();
            updateExerciseStates();
            updateUI();
        }
    }
    
    /**
     * Update the UI to reflect the current progress
     */
    function updateUI() {
        // Update stats in header
        if (elements.completedCount) {
            elements.completedCount.textContent = completedExercises.length;
        }
        
        if (elements.availableCount) {
            elements.availableCount.textContent = availableExercises.length;
        }
        
        if (elements.lockedCount) {
            elements.lockedCount.textContent = lockedExercises.length;
        }
        
        // Update skill tree nodes
        updateSkillTreeNodes();
    }
    
    /**
     * Update the visual state of all skill tree nodes
     */
    function updateSkillTreeNodes() {
        const nodes = document.querySelectorAll('.skill-node');
        nodes.forEach(node => {
            const exerciseId = node.dataset.id;
            
            // Remove all state classes
            node.classList.remove('completed', 'available', 'locked');
            
            // Add appropriate state class
            if (isExerciseCompleted(exerciseId)) {
                node.classList.add('completed');
            } else if (availableExercises.includes(exerciseId)) {
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
            
            if (isExerciseCompleted(sourceId) && isExerciseCompleted(targetId)) {
                connection.classList.add('completed');
            }
        });
        
        // If SkillTree module has an updateSkillTree method, call it
        if (window.SkillTree && typeof window.SkillTree.updateSkillTree === 'function') {
            window.SkillTree.updateSkillTree();
        }
    }
    
    /**
     * Display exercise details in the panel
     * @param {string} exerciseId - The ID of the exercise to display
     */
    function displayExerciseDetails(exerciseId) {
        const exercise = skillTreeData.exercises.find(ex => ex.id === exerciseId);
        if (!exercise) return;
        
        // Show the exercise content
        if (elements.exerciseContent) {
            elements.exerciseContent.classList.remove('hidden');
        }
        
        // Update exercise details
        if (elements.exerciseTitle) {
            elements.exerciseTitle.textContent = exercise.name;
        }
        
        if (elements.exerciseCategory) {
            elements.exerciseCategory.textContent = exercise.category;
        }
        
        if (elements.exerciseDescription) {
            elements.exerciseDescription.textContent = exercise.description;
        }
        
        // Update prerequisites list
        if (elements.prerequisitesList) {
            elements.prerequisitesList.innerHTML = '';
            
            if (exercise.prerequisites && exercise.prerequisites.length > 0) {
                exercise.prerequisites.forEach(prereqId => {
                    const prereq = skillTreeData.exercises.find(ex => ex.id === prereqId);
                    if (prereq) {
                        const li = document.createElement('li');
                        li.textContent = prereq.name;
                        if (isExerciseCompleted(prereqId)) {
                            li.classList.add('completed');
                        }
                        elements.prerequisitesList.appendChild(li);
                    }
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No prerequisites';
                elements.prerequisitesList.appendChild(li);
            }
        }
        
        // Update exercise progress
        const isCompleted = isExerciseCompleted(exerciseId);
        const isAvailable = availableExercises.includes(exerciseId);
        
        if (elements.exerciseProgressFill) {
            elements.exerciseProgressFill.style.width = isCompleted ? '100%' : '0%';
        }
        
        if (elements.exerciseProgressText) {
            elements.exerciseProgressText.textContent = isCompleted ? '100%' : '0%';
        }
        
        // Update action buttons
        if (elements.completeButton) {
            if (isCompleted) {
                elements.completeButton.textContent = 'Completed';
                elements.completeButton.disabled = true;
            } else if (isAvailable) {
                elements.completeButton.textContent = 'Mark as Complete';
                elements.completeButton.disabled = false;
                
                // Add event listener for completing the exercise
                elements.completeButton.onclick = () => {
                    completeExercise(exerciseId);
                    displayExerciseDetails(exerciseId); // Refresh the display
                };
            } else {
                elements.completeButton.textContent = 'Locked';
                elements.completeButton.disabled = true;
            }
        }
        
        // Update log progress button
        if (elements.logProgressButton) {
            if (isCompleted) {
                elements.logProgressButton.textContent = 'Uncomplete';
                elements.logProgressButton.disabled = false;
                
                // Add event listener for uncompleting the exercise
                elements.logProgressButton.onclick = () => {
                    uncompleteExercise(exerciseId);
                    displayExerciseDetails(exerciseId); // Refresh the display
                };
            } else {
                elements.logProgressButton.textContent = 'Log Progress';
                elements.logProgressButton.disabled = !isAvailable;
            }
        }
    }
    
    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Listen for skill node clicks
        document.addEventListener('skillNodeClicked', function(event) {
            const exerciseId = event.detail.id;
            displayExerciseDetails(exerciseId);
        });
    }
    
    /**
     * Reset all progress (for testing purposes)
     */
    function resetProgress() {
        completedExercises = [];
        
        if (isApiAvailable) {
            // We don't have a reset endpoint, so we'll just save an empty progress
            // This is a bit of a hack, but it works for testing
            completedExercises.forEach(exerciseId => {
                uncompleteExercise(exerciseId);
            });
        } else {
            saveProgress();
            updateExerciseStates();
            updateUI();
        }
        
        console.log('Progress reset');
    }
    
    /**
     * Get available exercises from the backend API
     * @returns {Promise} - Resolves with available exercises data
     */
    function fetchAvailableExercises() {
        if (!isApiAvailable) {
            return Promise.resolve({
                available_exercises: availableExercises.map(id => {
                    return skillTreeData.exercises.find(ex => ex.id === id);
                }),
                completed_exercises: completedExercises
            });
        }
        
        return fetch(API_ENDPOINTS.AVAILABLE_EXERCISES, { credentials: 'include', headers: getAuthHeaders() })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error fetching available exercises:', error);
                return {
                    available_exercises: availableExercises.map(id => {
                        return skillTreeData.exercises.find(ex => ex.id === id);
                    }),
                    completed_exercises: completedExercises
                };
            });
    }
    
    // Public API
    return {
        init,
        loadProgress,
        isExerciseCompleted,
        arePrerequisitesMet,
        completeExercise,
        uncompleteExercise,
        displayExerciseDetails,
        resetProgress,
        fetchAvailableExercises,
        getCompletedExercises: () => [...completedExercises],
        getAvailableExercises: () => [...availableExercises],
        getLockedExercises: () => [...lockedExercises]
    };
})();

window.ProgressTracker = ProgressTracker;

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // We'll need to fetch the skill tree data from the backend
    
    // Check if the skill tree data is already available (might be set by skill-tree.js)
    if (window.skillTreeData) {
        ProgressTracker.init(window.skillTreeData);
    } else {
        // Listen for when skill tree data becomes available
        document.addEventListener('skillTreeDataLoaded', function(event) {
            ProgressTracker.init(event.detail.data);
        });
    }
    
    // Reload progress when auth state changes (login/logout)
    document.addEventListener('authStateChanged', function(event) {
        if (window.skillTreeData) {
            ProgressTracker.init(window.skillTreeData);
        }
    });
});