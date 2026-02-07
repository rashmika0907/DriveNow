// Immediate storage clear on logout redirect - runs before any other script
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('t') || params.get('logout') === 'true') {
    console.log('🔴 LOGOUT REDIRECT DETECTED - CLEARING ALL STORAGE');
    
    // Clear everything
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Storage cleared successfully');
    } catch (e) {
      console.error('❌ Error clearing storage:', e);
    }
    
    // Remove the parameter from URL without reloading
    if (window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.log('✅ URL cleaned');
    }
  }
})();

