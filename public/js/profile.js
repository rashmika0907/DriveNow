// Profile page functionality
(() => {
  // Wait for DOM to be ready
  const initProfile = () => {
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const nameDisplay = document.getElementById('name-display');
    const nameInput = document.getElementById('name-input');
    const dobDisplay = document.getElementById('dob-display');
    const dobInput = document.getElementById('dob-input');
    const phoneDisplay = document.getElementById('phone-display');
    const phoneInput = document.getElementById('phone-input');
    const editActions = document.getElementById('edit-actions');
    const errorEl = document.getElementById('profile-error');
    const successEl = document.getElementById('profile-success');

    if (!editBtn || !nameDisplay || !nameInput) {
      console.error('Profile elements not found');
      return;
    }

    let originalName = nameInput.value;
    let originalDob = dobInput ? dobInput.value : '';
    let originalPhone = phoneInput ? phoneInput.value : '';

    const showError = (message) => {
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
      if (successEl) successEl.style.display = 'none';
    };

    const showSuccess = (message) => {
      if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
      }
      if (errorEl) errorEl.style.display = 'none';
    };

    const clearMessages = () => {
      if (errorEl) errorEl.style.display = 'none';
      if (successEl) successEl.style.display = 'none';
    };

    const enterEditMode = () => {
      originalName = nameInput.value;
      originalDob = dobInput ? dobInput.value : '';
      originalPhone = phoneInput ? phoneInput.value : '';
      
      nameDisplay.style.display = 'none';
      nameInput.style.display = 'block';
      
      if (dobDisplay && dobInput) {
        dobDisplay.style.display = 'none';
        dobInput.style.display = 'block';
      }
      
      if (phoneDisplay && phoneInput) {
        phoneDisplay.style.display = 'none';
        phoneInput.style.display = 'block';
      }
      
      nameInput.focus();
      editActions.style.display = 'flex';
      editBtn.style.display = 'none';
    };

    const exitEditMode = () => {
      nameInput.value = originalName;
      nameDisplay.style.display = 'block';
      nameInput.style.display = 'none';
      
      if (dobInput) {
        dobInput.value = originalDob;
        dobDisplay.style.display = 'block';
        dobInput.style.display = 'none';
      }
      
      if (phoneInput) {
        phoneInput.value = originalPhone;
        phoneDisplay.style.display = 'block';
        phoneInput.style.display = 'none';
      }
      
      editActions.style.display = 'none';
      editBtn.style.display = 'block';
      clearMessages();
    };

    const saveProfile = async () => {
      const newName = nameInput.value.trim();
      const newDob = dobInput ? dobInput.value : '';
      const newPhone = phoneInput ? phoneInput.value.trim() : '';

      if (!newName) {
        showError('Name cannot be empty');
        return;
      }

      // Check if anything changed
      const nameChanged = newName !== originalName;
      const dobChanged = newDob !== originalDob;
      const phoneChanged = newPhone !== originalPhone;

      if (!nameChanged && !dobChanged && !phoneChanged) {
        exitEditMode();
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const updateData = { name: newName };
        if (dobInput) updateData.dob = newDob || null;
        if (phoneInput) updateData.phone = newPhone;

        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (!response.ok) {
          showError(data.message || 'Failed to update profile');
          return;
        }

        // Update displayed values
        nameDisplay.textContent = data.user.name;
        originalName = data.user.name;
        
        if (dobDisplay && data.user.dob) {
          const dobDate = new Date(data.user.dob);
          dobDisplay.textContent = dobDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          if (dobInput) {
            dobInput.value = dobDate.toISOString().split('T')[0];
            originalDob = dobInput.value;
          }
        } else if (dobDisplay) {
          dobDisplay.textContent = 'Not set';
          if (dobInput) {
            dobInput.value = '';
            originalDob = '';
          }
        }
        
        if (phoneDisplay) {
          phoneDisplay.textContent = data.user.phone || 'Not set';
          if (phoneInput) {
            phoneInput.value = data.user.phone || '';
            originalPhone = phoneInput.value;
          }
        }
        
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.name = data.user.name;
        if (data.user.dob) user.dob = data.user.dob;
        if (data.user.phone !== undefined) user.phone = data.user.phone;
        localStorage.setItem('user', JSON.stringify(user));

        // Update navigation
        if (window.auth) {
          window.auth.setUser(user);
        }
        
        // Trigger navigation update
        window.dispatchEvent(new Event('storage'));

        showSuccess('Profile updated successfully');
        
        // Exit edit mode after a short delay
        setTimeout(() => {
          exitEditMode();
        }, 1500);
      } catch (error) {
        console.error('Save profile error:', error);
        showError('Network error. Please try again.');
      }
    };

    // Event listeners
    editBtn.addEventListener('click', enterEditMode);

    if (saveBtn) {
      saveBtn.addEventListener('click', saveProfile);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', exitEditMode);
    }

    // Allow Enter key to save
    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveProfile();
        } else if (e.key === 'Escape') {
          exitEditMode();
        }
      });
    }
  };

  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Fetch and update rental statistics
  const updateRentalStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/my-rentals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const rentals = data.rentals || [];
        
        const totalRentals = rentals.length;
        const activeRentals = rentals.filter(r => {
          const endDate = new Date(r.endDate);
          return r.status === 'active' && endDate >= new Date();
        }).length;
        const completedRentals = rentals.filter(r => r.status === 'completed').length;

        const totalEl = document.getElementById('total-rentals');
        const activeEl = document.getElementById('active-rentals');
        const completedEl = document.getElementById('completed-rentals');

        if (totalEl) totalEl.textContent = totalRentals;
        if (activeEl) activeEl.textContent = activeRentals;
        if (completedEl) completedEl.textContent = completedRentals;
      }
    } catch (error) {
      console.error('Error fetching rental stats:', error);
    }
  };

  // Initialize profile functionality when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initProfile();
      updateRentalStats();
    });
  } else {
    initProfile();
    updateRentalStats();
  }

  // Verify token with server
  fetch('/api/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => {
    if (!res.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  })
  .catch(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  });

  // Listen for storage events to update stats when rentals change
  window.addEventListener('storage', () => {
    updateRentalStats();
  });

  // Also update stats when page becomes visible (user might have booked in another tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateRentalStats();
    }
  });
})();
