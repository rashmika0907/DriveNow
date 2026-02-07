// Update navigation based on auth state
(() => {
  const clearAuthStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed'));
  };

  const validateAuthState = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.log('Auth validation failed, clearing stale auth');
        clearAuthStorage();
        updateNavigation();
        return;
      }

      // Update user data from API (includes isAdmin)
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        updateNavigation();
      }
    } catch (err) {
      console.log('Auth validation error, clearing auth:', err.message);
      clearAuthStorage();
      updateNavigation();
    }
  };

  const updateNavigation = () => {
    // Force fresh reads from localStorage with error handling
    let token = null;
    let user = null;
    
    try {
      token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'null' && userStr !== 'undefined') {
        user = JSON.parse(userStr);
      }
    } catch (e) {
      console.error('Error reading storage:', e);
      token = null;
      user = null;
    }
    
    const navLinks = document.querySelector('.nav-links');

    if (!navLinks) {
      console.log('Nav links not found, retrying...');
      return;
    }

    console.log('=== NAV UPDATE ===');
    console.log('Token:', token ? 'EXISTS' : 'NULL');
    console.log('User:', user ? JSON.stringify(user) : 'NULL');
    console.log('User isAdmin:', user?.isAdmin, 'Type:', typeof user?.isAdmin);

    // Find ALL potential My Rentals/Login links (including those with query params)
    const allLinks = Array.from(navLinks.querySelectorAll('a'));
    const potentialLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent.trim();
      return href === '/my-rentals' || 
             href === '/login' || 
             href === '#' ||
             href.startsWith('/my-rentals?') ||
             href.startsWith('/login?') ||
             text === 'My Rentals' ||
             text === 'Login';
    });
    
    // Remove ALL duplicates, keep only the first one
    let myRentalsLink = null;
    if (potentialLinks.length > 0) {
      myRentalsLink = potentialLinks[0];
      // Remove all other duplicates
      for (let i = 1; i < potentialLinks.length; i++) {
        potentialLinks[i].remove();
      }
    }
    
    // If no link exists, create one
    if (!myRentalsLink) {
      myRentalsLink = document.createElement('a');
      const browseLink = navLinks.querySelector('a[href="/browse"]');
      if (browseLink && browseLink.nextSibling) {
        browseLink.parentNode.insertBefore(myRentalsLink, browseLink.nextSibling);
      } else {
        const toggle = navLinks.querySelector('.ios-toggle');
        if (toggle) {
          navLinks.insertBefore(myRentalsLink, toggle);
        } else {
          navLinks.appendChild(myRentalsLink);
        }
      }
    }

    // Find or create user info section
    let userInfo = navLinks.querySelector('.user-info');
    if (!userInfo) {
      userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      userInfo.style.display = 'none';
      const toggle = navLinks.querySelector('.ios-toggle');
      if (toggle) {
        navLinks.insertBefore(userInfo, toggle);
      } else {
        navLinks.appendChild(userInfo);
      }
    }

    // Get user menu element
    const userMenu = navLinks.querySelector('.user-menu');
    
    if (token && user) {
      // Logged in state
      console.log('Showing logged-in navigation for user:', user.name || user.email);
      myRentalsLink.href = `/my-rentals?token=${encodeURIComponent(token)}`;
      myRentalsLink.textContent = 'My Rentals';
      
      // Update user info (just show name)
      let userName = userInfo.querySelector('.user-name');
      
      if (!userName) {
        userName = document.createElement('span');
        userName.className = 'user-name';
        userInfo.appendChild(userName);
      }
      userName.textContent = user.name || user.email;
      
      userInfo.style.display = 'flex';
      
      // Show user menu hamburger (contains Profile and Logout links)
      if (userMenu) {
        userMenu.classList.add('visible');
        userMenu.style.display = 'block';
      }
      
      // Admin links are handled by admin-link.js script
      // Don't add admin links here to avoid duplicates
    } else {
      // Logged out state
      console.log('Showing logged-out navigation - hiding user elements');
      myRentalsLink.href = '/login';
      myRentalsLink.textContent = 'Login';
      
      // Hide user info completely
      userInfo.style.display = 'none';
      
      // Hide user menu hamburger when logged out (no Profile/Logout access)
      if (userMenu) {
        userMenu.classList.remove('visible');
        userMenu.style.display = 'none';
        
        // Also close any open dropdown
        const dropdown = userMenu.querySelector('.user-dropdown');
        if (dropdown) {
          userMenu.classList.remove('open');
        }
      }
    }
  };

  // Check if we just logged out (cache-busting parameter present)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('t')) {
    console.log('Detected logout redirect - forcing storage clear');
    localStorage.clear();
    sessionStorage.clear();
  }

  // Update on page load - check immediately and multiple times to ensure it catches
  const initialUpdate = () => {
    console.log('Initial navigation update at:', Date.now());
    updateNavigation();
    validateAuthState();
    // Double-check after short delays
    setTimeout(updateNavigation, 10);
    setTimeout(updateNavigation, 50);
    setTimeout(updateNavigation, 100);
    setTimeout(updateNavigation, 200);
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialUpdate);
  } else {
    initialUpdate();
  }

  // Listen for storage changes (when login/logout happens in other tabs)
  window.addEventListener('storage', () => {
    updateNavigation();
  });

  // Listen for custom events for same-tab updates (immediate update)
  window.addEventListener('auth-changed', () => {
    updateNavigation();
  });
  
  // Check on page visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateNavigation();
    }
  });
  
  // Fallback: check periodically but less frequently
  setInterval(() => {
    updateNavigation();
  }, 5000);
})();
