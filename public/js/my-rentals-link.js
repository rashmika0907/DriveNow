// Handle my-rentals link clicks with authentication
// This script only updates hrefs, nav.js handles link creation/removal
(() => {
  let handlersAttached = false;
  
  const updateMyRentalsLinks = () => {
    const token = localStorage.getItem('token');
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Only update links within nav-links to avoid conflicts
    const myRentalsLinks = navLinks.querySelectorAll('a[href="/my-rentals"], a[href^="/my-rentals?"]');
    
    // Only update if there's exactly one link (nav.js should ensure this)
    if (myRentalsLinks.length === 1 && token) {
      const link = myRentalsLinks[0];
      const url = new URL(link.href, window.location.origin);
      url.searchParams.set('token', token);
      link.href = url.pathname + url.search;
    } else if (myRentalsLinks.length > 1) {
      // If duplicates exist, let nav.js handle it first
      setTimeout(updateMyRentalsLinks, 200);
    }
  };
  
  // Attach click handler only once
  const attachClickHandler = () => {
    if (handlersAttached) return;
    
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href="/my-rentals"], a[href^="/my-rentals?"]');
      if (link && link.closest('.nav-links')) {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          e.preventDefault();
          window.location.href = '/login';
          return;
        }
        // Ensure token is in URL
        const linkUrl = new URL(link.href, window.location.origin);
        if (!linkUrl.searchParams.has('token')) {
          linkUrl.searchParams.set('token', currentToken);
          link.href = linkUrl.pathname + linkUrl.search;
        }
      }
    });
    handlersAttached = true;
  };

  // Run after nav.js has done its work
  const runAfterNav = () => {
    setTimeout(() => {
      updateMyRentalsLinks();
      attachClickHandler();
    }, 150);
  };

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAfterNav);
  } else {
    runAfterNav();
  }

  // Also update when navigation changes (but with delay to let nav.js finish)
  const observer = new MutationObserver(() => {
    setTimeout(updateMyRentalsLinks, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
