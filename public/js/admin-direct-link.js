// Direct admin link - always visible for testing
(() => {
  'use strict';
  
  const checkAndAddLink = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      // Hide admin link if no token
      const existingLink = document.querySelector('a.admin-direct-link');
      if (existingLink) {
        existingLink.style.display = 'none';
      }
      return;
    }
    
    try {
      const response = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Admin check - API response:', data);
        
        const isAdmin = data.user && (data.user.isAdmin === true || data.user.isAdmin === 'true');
        
        if (isAdmin) {
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Add direct link to nav
          const navLinks = document.querySelector('.nav-links');
          if (navLinks) {
            let adminLink = navLinks.querySelector('a.admin-direct-link');
            if (!adminLink) {
              adminLink = document.createElement('a');
              adminLink.href = `/admin?token=${encodeURIComponent(token)}`;
              adminLink.textContent = '🔧 Admin';
              adminLink.className = 'admin-direct-link';
              adminLink.style.color = 'var(--accent)';
              adminLink.style.fontWeight = '700';
              adminLink.style.fontSize = '1rem';
              adminLink.style.marginLeft = '1rem';
              adminLink.style.padding = '0.5rem 1rem';
              adminLink.style.border = '2px solid var(--accent)';
              adminLink.style.borderRadius = '8px';
              adminLink.style.textDecoration = 'none';
              adminLink.style.display = 'block';
              adminLink.style.zIndex = '1000';
              
              // Insert after "My Rentals" or before theme toggle
              const myRentalsLink = navLinks.querySelector('a[href*="my-rentals"]');
              const themeToggle = navLinks.querySelector('.ios-toggle');
              
              if (myRentalsLink && myRentalsLink.nextSibling) {
                navLinks.insertBefore(adminLink, myRentalsLink.nextSibling);
              } else if (themeToggle) {
                navLinks.insertBefore(adminLink, themeToggle);
              } else {
                navLinks.appendChild(adminLink);
              }
              
              console.log('✅ Direct Admin link added to navigation');
            } else {
              // Update href with token
              adminLink.href = `/admin?token=${encodeURIComponent(token)}`;
              adminLink.style.display = 'block';
            }
          }
        } else {
          // Hide admin link if not admin
          const adminLink = document.querySelector('a.admin-direct-link');
          if (adminLink) {
            adminLink.style.display = 'none';
          }
          console.log('❌ User is not admin');
        }
      } else {
        console.log('❌ API /api/me failed:', response.status);
      }
    } catch (err) {
      console.error('❌ Error checking admin:', err);
    }
  };
  
  // Run immediately and on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkAndAddLink();
      // Check multiple times to ensure it catches
      setTimeout(checkAndAddLink, 100);
      setTimeout(checkAndAddLink, 500);
      setTimeout(checkAndAddLink, 1000);
    });
  } else {
    checkAndAddLink();
    setTimeout(checkAndAddLink, 100);
    setTimeout(checkAndAddLink, 500);
    setTimeout(checkAndAddLink, 1000);
  }
  
  // Listen for auth changes
  window.addEventListener('auth-changed', checkAndAddLink);
  window.addEventListener('storage', checkAndAddLink);
  
  // Also check periodically
  setInterval(checkAndAddLink, 10000);
})();

