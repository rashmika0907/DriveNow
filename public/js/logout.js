// Logout functionality
(() => {
  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== LOGOUT INITIATED ===');
    console.log('Before clear - token:', localStorage.getItem('token'));
    console.log('Before clear - user:', localStorage.getItem('user'));
    
    // Clear all storage multiple times to be absolutely sure
    for (let i = 0; i < 3; i++) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    
    // Force clear everything
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('After clear - token:', localStorage.getItem('token'));
    console.log('After clear - user:', localStorage.getItem('user'));
    console.log('Storage cleared successfully');
    
    // Update navigation immediately before redirect
    window.dispatchEvent(new Event('auth-changed'));
    
    // Redirect to logout route (which will clear cookies and redirect to home)
    console.log('Redirecting to /logout');
    window.location.href = '/logout';
  };

  // Handle logout link clicks using event delegation
  document.addEventListener('click', (e) => {
    const logoutLink = e.target.closest('a[href="/logout"]');
    if (logoutLink) {
      console.log('Logout link clicked');
      handleLogout(e);
    }
  });

  // Expose logout function globally
  window.logout = handleLogout;
})();

