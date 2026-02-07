// Auth state management
let authState = {
  token: localStorage.getItem('token'),
  user: null,
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!authState.token;
};

// Get auth token
const getToken = () => {
  return authState.token;
};

// Set auth token
const setToken = (token) => {
  authState.token = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Set user data
const setUser = (user) => {
  authState.user = user;
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

// Load user from localStorage
const loadUser = () => {
  const stored = localStorage.getItem('user');
  if (stored) {
    authState.user = JSON.parse(stored);
  }
};

// Initialize auth state
loadUser();

// Password toggle functionality
const setupPasswordToggle = (inputId, toggleId) => {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  
  if (!input || !toggle) {
    console.log('Password toggle setup failed - input or toggle not found:', inputId, toggleId);
    return;
  }
  
  const eyeIcon = toggle.querySelector('.eye-icon');
  const eyeOffIcon = toggle.querySelector('.eye-off-icon');
  
  if (!eyeIcon || !eyeOffIcon) {
    console.log('Eye icons not found in toggle button');
    return;
  }

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    eyeIcon.style.display = isPassword ? 'none' : 'block';
    eyeOffIcon.style.display = isPassword ? 'block' : 'none';
    console.log('Password visibility toggled:', isPassword ? 'visible' : 'hidden');
  });
};

// Form validation
const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const showFieldError = (fieldId, message) => {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
};

const clearFieldError = (fieldId) => {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
};

const showError = (formId, message) => {
  const errorEl = document.getElementById(`${formId}-error`);
  const successEl = document.getElementById(`${formId}-success`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  if (successEl) {
    successEl.style.display = 'none';
  }
};

const showSuccess = (formId, message) => {
  const errorEl = document.getElementById(`${formId}-error`);
  const successEl = document.getElementById(`${formId}-success`);
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = 'block';
  }
  if (errorEl) {
    errorEl.style.display = 'none';
  }
};

const clearMessages = (formId) => {
  const errorEl = document.getElementById(`${formId}-error`);
  const successEl = document.getElementById(`${formId}-success`);
  if (errorEl) errorEl.style.display = 'none';
  if (successEl) successEl.style.display = 'none';
};

// Tab switching
const setupTabs = () => {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update forms
      forms.forEach(form => {
        form.classList.remove('active');
        if (form.id === `${targetTab}-form`) {
          form.classList.add('active');
        }
      });

      // Clear messages
      clearMessages('login');
      clearMessages('signup');
    });
  });
};

// Login form handler
const setupLoginForm = () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // Clear previous errors
    clearMessages('login');
    clearFieldError('login-email');
    clearFieldError('login-password');

    // Client-side validation
    let isValid = true;

    if (!email) {
      showFieldError('login-email', 'Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      showFieldError('login-email', 'Invalid email format');
      isValid = false;
    }

    if (!password) {
      showFieldError('login-password', 'Password is required');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError('login', data.message || 'Login failed');
        return;
      }

      // Success
      setToken(data.token);
      setUser(data.user);
      showSuccess('login', 'Login successful! Redirecting...');

      // Trigger auth change event for navigation update
      window.dispatchEvent(new Event('auth-changed'));

      // Redirect to homepage after 1 second
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      showError('login', 'Network error. Please try again.');
    }
  });
};

// Signup form handler
const setupSignupForm = () => {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    // Clear previous errors
    clearMessages('signup');
    clearFieldError('signup-name');
    clearFieldError('signup-email');
    clearFieldError('signup-password');

    // Client-side validation
    let isValid = true;

    if (!name) {
      showFieldError('signup-name', 'Name is required');
      isValid = false;
    }

    if (!email) {
      showFieldError('signup-email', 'Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      showFieldError('signup-email', 'Invalid email format');
      isValid = false;
    }

    if (!password) {
      showFieldError('signup-password', 'Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      showFieldError('signup-password', 'Password must be at least 8 characters');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError('signup', data.message || 'Signup failed');
        return;
      }

      // Success
      setToken(data.token);
      setUser(data.user);
      showSuccess('signup', 'Account created! Redirecting...');

      // Trigger auth change event for navigation update
      window.dispatchEvent(new Event('auth-changed'));

      // Redirect to homepage after 1 second
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Signup error:', error);
      showError('signup', 'Network error. Please try again.');
    }
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Setup password toggles using the button IDs from the HTML
  const loginPasswordToggle = document.getElementById('login-password-toggle');
  const signupPasswordToggle = document.getElementById('signup-password-toggle');
  
  if (loginPasswordToggle) {
    console.log('Setting up login password toggle');
    setupPasswordToggle('login-password', 'login-password-toggle');
  }
  if (signupPasswordToggle) {
    console.log('Setting up signup password toggle');
    setupPasswordToggle('signup-password', 'signup-password-toggle');
  }
  
  // Only setup tabs and forms if on login page
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  if (loginForm || signupForm) {
    setupTabs();
    setupLoginForm();
    setupSignupForm();
  }

  // If already authenticated, redirect to home
  if (isAuthenticated() && window.location.pathname === '/login') {
    window.location.href = '/';
  }
});

// Export for use in other scripts
window.auth = {
  isAuthenticated,
  getToken,
  setToken,
  setUser,
  user: authState.user,
};

