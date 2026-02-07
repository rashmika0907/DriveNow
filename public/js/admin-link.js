// Single admin link script - adds admin link to nav and dropdown
(() => {
  'use strict';
  
  let adminLinkAdded = false;
  let adminDropdownLinkAdded = false;
  
  const addAdminLinks = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      // Remove admin links if no token
      removeAdminLinks();
      return;
    }
    
    try {
      // Check admin status from API
      const response = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        removeAdminLinks();
        return;
      }
      
      const data = await response.json();
      const isAdmin = data.user && (data.user.isAdmin === true || data.user.isAdmin === 'true');
      
      // Update localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      if (isAdmin) {
        addAdminNavLink(token);
        addAdminDropdownLink(token);
      } else {
        removeAdminLinks();
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      removeAdminLinks();
    }
  };
  
  const addAdminNavLink = (token) => {
    if (adminLinkAdded) return;
    
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Check if already exists
    let adminLink = navLinks.querySelector('a[href^="/admin"].admin-nav-link');
    if (adminLink) {
      adminLinkAdded = true;
      adminLink.style.display = 'block';
      adminLink.href = `/admin?token=${encodeURIComponent(token)}`;
      return;
    }
    
    // Create admin link
    adminLink = document.createElement('a');
    adminLink.href = `/admin?token=${encodeURIComponent(token)}`;
    adminLink.textContent = '🔧 Admin';
    adminLink.className = 'admin-nav-link';
    adminLink.style.cssText = `
      color: var(--accent) !important;
      font-weight: 700 !important;
      margin-left: 10px !important;
      padding: 6px 12px !important;
      border: 2px solid var(--accent) !important;
      border-radius: 6px !important;
      text-decoration: none !important;
      display: block !important;
    `;
    
    // Insert before theme toggle
    const themeToggle = navLinks.querySelector('.ios-toggle');
    if (themeToggle) {
      navLinks.insertBefore(adminLink, themeToggle);
    } else {
      navLinks.appendChild(adminLink);
    }
    
    adminLinkAdded = true;
  };
  
  const addAdminDropdownLink = (token) => {
    if (adminDropdownLinkAdded) return;
    
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;
    
    const dropdown = userMenu.querySelector('.user-dropdown');
    if (!dropdown) return;
    
    // Check if already exists
    let adminLink = dropdown.querySelector('a[href^="/admin"].admin-dropdown-link');
    if (adminLink) {
      adminDropdownLinkAdded = true;
      adminLink.style.display = 'block';
      adminLink.href = `/admin?token=${encodeURIComponent(token)}`;
      return;
    }
    
    // Create admin link
    adminLink = document.createElement('a');
    adminLink.href = `/admin?token=${encodeURIComponent(token)}`;
    adminLink.textContent = 'Admin Panel';
    adminLink.className = 'admin-dropdown-link';
    adminLink.setAttribute('role', 'menuitem');
    adminLink.style.cssText = `
      font-weight: 600 !important;
      color: var(--accent) !important;
      display: block !important;
      padding: 0.75rem 1rem !important;
      border-bottom: 1px solid var(--border) !important;
      margin-bottom: 0.5rem !important;
    `;
    
    // Insert at the top of dropdown
    const firstItem = dropdown.querySelector('a[href="/profile"]');
    if (firstItem) {
      dropdown.insertBefore(adminLink, firstItem);
    } else {
      dropdown.insertBefore(adminLink, dropdown.firstChild);
    }
    
    adminDropdownLinkAdded = true;
  };
  
  const removeAdminLinks = () => {
    // Remove nav link
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      const adminLink = navLinks.querySelector('a[href^="/admin"].admin-nav-link');
      if (adminLink) {
        adminLink.style.display = 'none';
      }
    }
    
    // Remove dropdown link
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
      const adminLink = dropdown.querySelector('a[href^="/admin"].admin-dropdown-link');
      if (adminLink) {
        adminLink.style.display = 'none';
      }
    }
    
    adminLinkAdded = false;
    adminDropdownLinkAdded = false;
  };
  
  // Remove all duplicate admin links
  const cleanupDuplicates = () => {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      const allAdminLinks = navLinks.querySelectorAll('a[href^="/admin"]');
      // Keep only the first one with our class
      let foundFirst = false;
      allAdminLinks.forEach(link => {
        if (link.classList.contains('admin-nav-link')) {
          if (foundFirst) {
            link.remove();
          } else {
            foundFirst = true;
          }
        } else {
          link.remove(); // Remove any admin links without our class
        }
      });
    }
    
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
      const allAdminLinks = dropdown.querySelectorAll('a[href^="/admin"]');
      // Keep only the first one with our class
      let foundFirst = false;
      allAdminLinks.forEach(link => {
        if (link.classList.contains('admin-dropdown-link')) {
          if (foundFirst) {
            link.remove();
          } else {
            foundFirst = true;
          }
        } else {
          link.remove(); // Remove any admin links without our class
        }
      });
    }
  };
  
  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cleanupDuplicates();
      addAdminLinks();
    });
  } else {
    cleanupDuplicates();
    addAdminLinks();
  }
  
  // Listen for auth changes
  window.addEventListener('auth-changed', () => {
    cleanupDuplicates();
    addAdminLinks();
  });
  
  window.addEventListener('storage', () => {
    cleanupDuplicates();
    addAdminLinks();
  });
  
  // Check periodically
  setInterval(() => {
    cleanupDuplicates();
    addAdminLinks();
  }, 10000);
})();
