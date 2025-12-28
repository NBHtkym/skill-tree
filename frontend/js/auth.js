const Auth = (function() {
    let currentUser = null;
    const TOKEN_KEY = 'workout_auth_token';
    
    function getAuthToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
    
    function setAuthToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }
    
    function getAuthHeaders() {
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
    
    const elements = {
        modal: document.getElementById('auth-modal'),
        loginBtn: document.getElementById('login-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        userEmail: document.getElementById('user-email'),
        loginForm: document.getElementById('login-form'),
        signupForm: document.getElementById('signup-form'),
        loginError: document.getElementById('login-error'),
        signupError: document.getElementById('signup-error'),
        tabs: document.querySelectorAll('.auth-tab'),
        modalClose: document.querySelector('.modal-close'),
        modalOverlay: document.querySelector('.modal-overlay')
    };
    
    function init() {
        bindEvents();
        checkAuthStatus();
    }
    
    function bindEvents() {
        if (elements.loginBtn) {
            elements.loginBtn.addEventListener('click', showModal);
        }
        
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', logout);
        }
        
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', hideModal);
        }
        
        if (elements.modalOverlay) {
            elements.modalOverlay.addEventListener('click', hideModal);
        }
        
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', handleLogin);
        }
        
        if (elements.signupForm) {
            elements.signupForm.addEventListener('submit', handleSignup);
        }
    }
    
    function showModal() {
        elements.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    function hideModal() {
        elements.modal.classList.add('hidden');
        document.body.style.overflow = '';
        clearErrors();
        elements.loginForm.reset();
        elements.signupForm.reset();
    }
    
    function switchTab(tab) {
        elements.tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        if (tab === 'login') {
            elements.loginForm.classList.remove('hidden');
            elements.signupForm.classList.add('hidden');
        } else {
            elements.loginForm.classList.add('hidden');
            elements.signupForm.classList.remove('hidden');
        }
        clearErrors();
    }
    
    function clearErrors() {
        elements.loginError.classList.add('hidden');
        elements.loginError.textContent = '';
        elements.signupError.classList.add('hidden');
        elements.signupError.textContent = '';
    }
    
    function showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
    
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status', {
                credentials: 'include',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.authenticated) {
                setLoggedIn(data.user);
            } else {
                setAuthToken(null);
                setLoggedOut();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setLoggedOut();
        }
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setAuthToken(data.token);
                setLoggedIn(data.user);
                hideModal();
                if (window.ProgressTracker) {
                    window.ProgressTracker.loadProgress();
                }
            } else {
                showError(elements.loginError, data.message);
            }
        } catch (error) {
            showError(elements.loginError, 'Connection error. Please try again.');
        }
    }
    
    async function handleSignup(e) {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        
        if (password !== confirm) {
            showError(elements.signupError, 'Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setAuthToken(data.token);
                setLoggedIn(data.user);
                hideModal();
                if (window.ProgressTracker) {
                    window.ProgressTracker.loadProgress();
                }
            } else {
                showError(elements.signupError, data.message);
            }
        } catch (error) {
            showError(elements.signupError, 'Connection error. Please try again.');
        }
    }
    
    async function logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders()
            });
            setAuthToken(null);
            setLoggedOut();
            if (window.ProgressTracker) {
                window.ProgressTracker.loadProgress();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    function setLoggedIn(user) {
        currentUser = user;
        elements.userEmail.textContent = user.email;
        elements.loginBtn.style.display = 'none';
        elements.logoutBtn.style.display = 'inline-block';
        elements.userEmail.style.display = 'inline';
        document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true, user } }));
    }
    
    function setLoggedOut() {
        currentUser = null;
        elements.userEmail.textContent = '';
        elements.loginBtn.style.display = 'inline-block';
        elements.logoutBtn.style.display = 'none';
        elements.userEmail.style.display = 'none';
        document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: false } }));
    }
    
    function isLoggedIn() {
        return currentUser !== null;
    }
    
    function getUser() {
        return currentUser;
    }
    
    document.addEventListener('DOMContentLoaded', init);
    
    return {
        isLoggedIn,
        getUser,
        showModal,
        hideModal,
        checkAuthStatus,
        getAuthHeaders
    };
})();

window.Auth = Auth;
