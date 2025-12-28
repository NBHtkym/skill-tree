/**
 * Progress Tracker for Workout Skill Tree
 * This script handles tracking and persisting user progress
 */

// Global variables for progress tracking
let progressData = null;

// Initialize progress tracker
async function initProgressTracker() {
    try {
        // Fetch user progress data
        const response = await fetch('/backend/data/user_progress.json');
        progressData = await response.json();
        
        // Update UI with current progress
        updateProgressUI();
        
    } catch (error) {
        console.error('Error initializing progress tracker:', error);
        // Create default progress data if it doesn't exist
        progressData = {
            completed_skills: [],
            current_xp: 0,
            last_updated: new Date().toISOString()
        };
    }
}

// Update UI elements with current progress
function updateProgressUI() {
    if (!progressData) return;
    
    // Update XP counter
    const xpCounter = document.getElementById('user-xp');
    if (xpCounter) {
        xpCounter.textContent = `XP: ${progressData.current_xp}`;
    }
}

// Add XP to user progress
function addXP(amount) {
    if (!progressData) return;
    
    progressData.current_xp += amount;
    progressData.last_updated = new Date().toISOString();
    
    // Update UI
    updateProgressUI();
    
    // Save progress
    saveProgress();
}

// Mark a skill as completed
function completeSkillProgress(skillId, xpReward) {
    if (!progressData) return;
    
    // Check if skill is already completed
    if (progressData.completed_skills.includes(skillId)) {
        return false;
    }
    
    // Add skill to completed list
    progressData.completed_skills.push(skillId);
    
    // Add XP reward
    if (xpReward) {
        addXP(xpReward);
    }
    
    // Save progress
    saveProgress();
    
    return true;
}

// Check if a skill is completed
function isSkillCompleted(skillId) {
    if (!progressData) return false;
    return progressData.completed_skills.includes(skillId);
}

// Get all completed skills
function getCompletedSkills() {
    if (!progressData) return [];
    return [...progressData.completed_skills];
}

// Get current XP
function getCurrentXP() {
    if (!progressData) return 0;
    return progressData.current_xp;
}

// Reset progress (for testing)
function resetProgress() {
    progressData = {
        completed_skills: [],
        current_xp: 0,
        last_updated: new Date().toISOString()
    };
    
    // Update UI
    updateProgressUI();
    
    // Save progress
    saveProgress();
}

// Save progress to server
async function saveProgress() {
    try {
        const response = await fetch('/backend/data/user_progress.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(progressData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save progress');
        }
        
        // For development, we'll also save to localStorage as a backup
        localStorage.setItem('workout_skill_tree_progress', JSON.stringify(progressData));
        
    } catch (error) {
        console.error('Error saving progress:', error);
        
        // Save to localStorage as fallback
        localStorage.setItem('workout_skill_tree_progress', JSON.stringify(progressData));
    }
}

// Load progress from localStorage (fallback)
function loadProgressFromLocalStorage() {
    const savedProgress = localStorage.getItem('workout_skill_tree_progress');
    if (savedProgress) {
        try {
            progressData = JSON.parse(savedProgress);
            updateProgressUI();
            return true;
        } catch (error) {
            console.error('Error parsing saved progress:', error);
        }
    }
    return false;
}

// Export functions for use in other modules
window.progressTracker = {
    init: initProgressTracker,
    addXP: addXP,
    completeSkill: completeSkillProgress,
    isCompleted: isSkillCompleted,
    getCompletedSkills: getCompletedSkills,
    getCurrentXP: getCurrentXP,
    reset: resetProgress,
    loadFromLocalStorage: loadProgressFromLocalStorage
};

// Initialize progress tracker when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Try to initialize from server first
    initProgressTracker().catch(() => {
        // Fall back to localStorage if server request fails
        loadProgressFromLocalStorage();
    });
});