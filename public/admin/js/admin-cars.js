// Admin Cars Management JavaScript

(() => {
  'use strict';

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || new URLSearchParams(window.location.search).get('token');
  
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Show/hide messages
  const showMessage = (message, type = 'error') => {
    const errorEl = document.getElementById('error-message');
    const successEl = document.getElementById('success-message');
    
    if (type === 'error') {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      successEl.style.display = 'none';
      setTimeout(() => {
        errorEl.style.display = 'none';
      }, 5000);
    } else {
      successEl.textContent = message;
      successEl.style.display = 'block';
      errorEl.style.display = 'none';
      setTimeout(() => {
        successEl.style.display = 'none';
      }, 5000);
    }
  };

  // Load cars for table view
  const loadCars = async () => {
    const tbody = document.getElementById('cars-table-body');
    if (!tbody) return; // Not on cars list page

    try {
      tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading cars...</td></tr>';
      
      const response = await fetch('/admin/api/cars', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load cars');
      }

      const data = await response.json();
      const cars = data.cars || [];

      if (cars.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No cars found</td></tr>';
        return;
      }

      // Escape HTML to prevent XSS
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      tbody.innerHTML = cars.map(car => {
        let statusClass, statusText;
        if (car.maintenanceMode) {
          statusClass = 'maintenance';
          statusText = 'Maintenance';
        } else if (car.isAvailable === false) {
          statusClass = 'booked';
          statusText = 'Booked';
        } else {
          statusClass = 'available';
          statusText = 'Available';
        }
        const imageSrc = car.image ? (car.image.startsWith('http') ? escapeHtml(car.image) : (car.image.startsWith('/') ? escapeHtml(car.image) : '/' + escapeHtml(car.image))) : '/placeholder-car.jpg';
        const carId = parseInt(car.id) || 0;
        const make = escapeHtml(car.make || '');
        const model = escapeHtml(car.model || '');
        const year = escapeHtml(String(car.year || ''));
        const price = car.pricePerDay ? car.pricePerDay.toLocaleString('en-IN') : '0';
        
        return `
          <tr>
            <td>${carId}</td>
            <td><img src="${imageSrc}" alt="${make} ${model}" class="car-image-thumb" onerror="this.src='/placeholder-car.jpg'" /></td>
            <td><strong>${make} ${model}</strong></td>
            <td>${year}</td>
            <td>₹${price}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
              <div class="action-buttons-inline">
                <a href="/admin/cars/${carId}/edit" class="button small-button secondary">Edit</a>
                <button class="button small-button danger" onclick="deleteCar(${carId})">Delete</button>
                <button class="button small-button ${car.maintenanceMode ? 'secondary' : 'ghost'}" onclick="toggleMaintenance(${carId}, ${!car.maintenanceMode})">
                  ${car.maintenanceMode ? 'Mark Available' : 'Mark Maintenance'}
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading cars:', error);
      tbody.innerHTML = '<tr><td colspan="7" class="loading">Error loading cars. Please refresh.</td></tr>';
    }
  };

  // Delete car
  window.deleteCar = async (carId) => {
    if (!confirm(`Are you sure you want to delete car #${carId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/admin/api/cars/${carId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete car');
      }

      showMessage('Car deleted successfully', 'success');
      loadCars();
    } catch (error) {
      console.error('Error deleting car:', error);
      showMessage(error.message || 'Failed to delete car');
    }
  };

  // Toggle maintenance mode
  window.toggleMaintenance = async (carId, maintenanceMode) => {
    try {
      const response = await fetch(`/admin/api/cars/${carId}/maintenance`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maintenanceMode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update maintenance mode');
      }

      showMessage(`Car ${maintenanceMode ? 'marked as maintenance' : 'marked as available'}`, 'success');
      loadCars();
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      showMessage(error.message || 'Failed to update maintenance mode');
    }
  };

  // Handle car form submission
  const carForm = document.getElementById('car-form');
  if (carForm) {
    carForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = carForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const formData = new FormData(carForm);
        const carId = document.getElementById('car-id').value;
        const isEdit = !!carId;

        const url = isEdit ? `/admin/api/cars/${carId}` : '/admin/api/cars';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save car');
        }

        const data = await response.json();
        showMessage(`Car ${isEdit ? 'updated' : 'created'} successfully`, 'success');
        
        setTimeout(() => {
          window.location.href = '/admin/cars';
        }, 1500);
      } catch (error) {
        console.error('Error saving car:', error);
        showMessage(error.message || 'Failed to save car');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    // Show/hide maintenance date based on checkbox
    const maintenanceCheckbox = document.getElementById('maintenanceMode');
    const maintenanceUntilGroup = document.getElementById('maintenance-until-group');
    
    if (maintenanceCheckbox && maintenanceUntilGroup) {
      maintenanceCheckbox.addEventListener('change', (e) => {
        maintenanceUntilGroup.style.display = e.target.checked ? 'block' : 'none';
      });
    }
  }

  // Load cars on page load (if on cars list page)
  if (document.getElementById('cars-table-body')) {
    loadCars();
  }
})();

