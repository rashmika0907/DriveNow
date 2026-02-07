// Admin Dashboard JavaScript

(() => {
  'use strict';

  // Auto-refresh dashboard stats every 2 minutes
  const REFRESH_INTERVAL = 120000; // 2 minutes

  const refreshDashboard = () => {
    window.location.reload();
  };

  // Set up auto-refresh
  let refreshTimer = setInterval(refreshDashboard, REFRESH_INTERVAL);

  // Clear timer on page unload
  window.addEventListener('beforeunload', () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
  });

  console.log('Admin dashboard loaded');
})();

