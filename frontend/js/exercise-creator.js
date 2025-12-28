const ExerciseCreator = (function() {
    const elements = {
        modal: null,
        form: null,
        closeBtn: null,
        createBtn: null,
        errorEl: null,
        prereqOptions: null,
        nextOptions: null
    };
    
    function init() {
        elements.modal = document.getElementById('create-exercise-modal');
        elements.form = document.getElementById('create-exercise-form');
        elements.closeBtn = document.getElementById('close-create-exercise');
        elements.createBtn = document.getElementById('create-exercise-btn');
        elements.errorEl = document.getElementById('create-exercise-error');
        elements.prereqOptions = document.getElementById('prereq-options');
        elements.nextOptions = document.getElementById('next-options');
        
        bindEvents();
        updateButtonVisibility();
        
        document.addEventListener('authStateChanged', updateButtonVisibility);
    }
    
    function bindEvents() {
        if (elements.createBtn) {
            elements.createBtn.addEventListener('click', showModal);
        }
        
        if (elements.closeBtn) {
            elements.closeBtn.addEventListener('click', hideModal);
        }
        
        if (elements.modal) {
            const overlay = elements.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', hideModal);
            }
        }
        
        if (elements.form) {
            elements.form.addEventListener('submit', handleSubmit);
        }
    }
    
    function updateButtonVisibility() {
        if (elements.createBtn) {
            if (window.Auth && window.Auth.isLoggedIn()) {
                elements.createBtn.classList.remove('hidden');
            } else {
                elements.createBtn.classList.add('hidden');
            }
        }
    }
    
    function showModal() {
        populateExerciseOptions();
        elements.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    function hideModal() {
        elements.modal.classList.add('hidden');
        document.body.style.overflow = '';
        elements.form.reset();
        clearError();
    }
    
    function populateExerciseOptions() {
        const exercises = window.skillTreeData?.exercises || [];
        
        elements.prereqOptions.innerHTML = '';
        elements.nextOptions.innerHTML = '';
        
        exercises.forEach(ex => {
            const prereqOption = createOptionCheckbox(ex, 'prereq');
            const nextOption = createOptionCheckbox(ex, 'next');
            
            elements.prereqOptions.appendChild(prereqOption);
            elements.nextOptions.appendChild(nextOption);
        });
    }
    
    function createOptionCheckbox(exercise, type) {
        const div = document.createElement('div');
        div.className = 'multi-select-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${type}-${exercise.id}`;
        checkbox.value = exercise.id;
        checkbox.name = type;
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = exercise.name;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        
        return div;
    }
    
    function getSelectedValues(name) {
        const checkboxes = elements.form.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }
    
    function showError(message) {
        elements.errorEl.textContent = message;
        elements.errorEl.classList.remove('hidden');
    }
    
    function clearError() {
        elements.errorEl.textContent = '';
        elements.errorEl.classList.add('hidden');
    }
    
    async function handleSubmit(e) {
        e.preventDefault();
        clearError();
        
        const name = document.getElementById('exercise-name').value.trim();
        const description = document.getElementById('exercise-description').value.trim();
        const category = document.getElementById('exercise-category').value;
        const difficulty = parseInt(document.getElementById('exercise-difficulty').value) || 1;
        const prerequisites = getSelectedValues('prereq');
        const next_exercises = getSelectedValues('next');
        
        if (!name) {
            showError('Exercise name is required');
            return;
        }
        
        try {
            const headers = window.Auth && window.Auth.getAuthHeaders ? window.Auth.getAuthHeaders() : { 'Content-Type': 'application/json' };
            const response = await fetch('/api/exercises/create', {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    description,
                    category,
                    difficulty,
                    prerequisites,
                    next_exercises
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                hideModal();
                if (window.SkillTree) {
                    window.SkillTree.reloadSkillTree();
                }
            } else {
                showError(data.message || 'Failed to create exercise');
            }
        } catch (error) {
            showError('Connection error. Please try again.');
        }
    }
    
    document.addEventListener('DOMContentLoaded', init);
    
    return {
        showModal,
        hideModal,
        updateButtonVisibility
    };
})();

window.ExerciseCreator = ExerciseCreator;
