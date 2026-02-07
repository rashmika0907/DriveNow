// Simple admin link - always tries to show if user might be admin
(() => {
  'use strict';
  
  const addSimpleAdminLink = () => {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) {
      setTimeout(addSimpleAdminLink, 100);
      return;
    }
    
    // Check if link already exists
    let adminLink = navLinks.querySelector('a.simple-admin-link');
    if (adminLink) return;
    
    // Get token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    
    // Create admin link
    adminLink = document.createElement('a');
    adminLink.href = `/admin?token=${encodeURIComponent(token)}`;
    adminLink.textContent = '🔧 Admin';
    adminLink.className = 'simple-admin-link';
    adminLink.style.cssText = `
      color: var(--accent) !important;
      font-weight: 700 !important;
      font-size: 1rem !important;
      margin-left: 10px !important;
      padding: 6px 12px !important;
      border: 2px solid var(--accent) !important;
      border-radius: 6px !important;
      text-decoration: none !important;
      display: block !important;
      z-index: 1000 !important;
      background: rgba(192, 132, 252, 0.1) !important;
    `;
    
    // Insert before theme toggle
    const themeToggle = navLinks.querySelector('.ios-toggle');
    if (themeToggle) {
      navLinks.insertBefore(adminLink, themeToggle);
    } else {
      navLinks.appendChild(adminLink);
    }
    
    console.log('✅ Simple admin link added');
    
    // Also verify admin status and update if needed
    fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.isAdmin) {
          adminLink.style.display = 'block';
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          adminLink.style.display = 'none';
        }
      })
      .catch(err => {
        console.error('Error checking admin:', err);
        // Keep link visible anyway for testing
      });
  };
  
  // Run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSimpleAdminLink);
  } else {
    addSimpleAdminLink();
  }
  
  // Also run after a delay
  setTimeout(addSimpleAdminLink, 500);
  setTimeout(addSimpleAdminLink, 1000);
  
  // Listen for auth changes
  window.addEventListener('auth-changed', addSimpleAdminLink);
})();

