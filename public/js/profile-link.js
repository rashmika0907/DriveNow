// Handle profile link clicks with authentication
(() => {
  const setupProfileLinks = () => {
    const profileLinks = document.querySelectorAll('a[href="/profile"]');
    
    profileLinks.forEach(link => {
      if (link.dataset.profileLinkSetup) return; // Skip if already set up
      link.dataset.profileLinkSetup = 'true';
      
      link.addEventListener('click', (e) => {
        const token = localStorage.getItem('token');
        if (!token) {
          e.preventDefault();
          window.location.href = '/login';
          return;
        }
        // Add token to URL as query parameter
        e.preventDefault();
        window.location.href = `/profile?token=${encodeURIComponent(token)}`;
      });
    });
  };

  // Setup on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupProfileLinks);
  } else {
    setupProfileLinks();
  }
})();


