// Admin Bookings Management JavaScript

(() => {
  'use strict';

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || new URLSearchParams(window.location.search).get('token');
  
  if (!token) {
    window.location.href = '/login';
    return;
  }

  let currentPage = 1;
  const pageSize = 20;

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Load bookings
  const loadBookings = async (page = 1) => {
    const tbody = document.getElementById('bookings-table-body');
    if (!tbody) return;

    try {
      tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading bookings...</td></tr>';

      const status = document.getElementById('filter-status').value;
      const startDate = document.getElementById('filter-start-date').value;
      const endDate = document.getElementById('filter-end-date').value;

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/admin/api/bookings?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }

      const data = await response.json();
      const bookings = data.bookings || [];
      const pagination = data.pagination || {};

      if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No bookings found</td></tr>';
        renderPagination(pagination);
        return;
      }

      // Escape HTML to prevent XSS
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      tbody.innerHTML = bookings.map(booking => {
        const car = booking.carDetails;
        const user = booking.userDetails;
        const carName = car ? `${escapeHtml(car.make || '')} ${escapeHtml(car.model || '')} ${escapeHtml(String(car.year || ''))}` : 'N/A';
        const userName = user ? escapeHtml(user.name || '') : 'N/A';
        const userEmail = user ? escapeHtml(user.email || '') : 'N/A';
        const statusClass = booking.status || 'upcoming';
        const bookingId = escapeHtml(booking._id.toString());
        const totalPrice = booking.totalPrice ? booking.totalPrice.toLocaleString('en-IN') : '0';
        const canCancel = booking.status !== 'cancelled' && booking.status !== 'completed';
        
        return `
          <tr>
            <td>${bookingId.substring(0, 8)}...</td>
            <td>
              <div><strong>${userName}</strong></div>
              <div style="font-size: 0.85rem; color: var(--muted);">${userEmail}</div>
            </td>
            <td>${carName}</td>
            <td>${formatDate(booking.startDate)}</td>
            <td>${formatDate(booking.endDate)}</td>
            <td>₹${totalPrice}</td>
            <td><span class="status-badge ${statusClass}">${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}</span></td>
            <td>
              <div class="action-buttons-inline">
                ${canCancel ? 
                  `<button class="button small-button danger" onclick="cancelBooking('${bookingId}')">Cancel</button>` : 
                  '<span style="color: var(--muted);">N/A</span>'
                }
              </div>
            </td>
          </tr>
        `;
      }).join('');

      renderPagination(pagination);
      currentPage = page;
    } catch (error) {
      console.error('Error loading bookings:', error);
      tbody.innerHTML = '<tr><td colspan="8" class="loading">Error loading bookings. Please refresh.</td></tr>';
    }
  };

  // Render pagination
  const renderPagination = (pagination) => {
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;

    if (!pagination || pagination.totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    const buttons = [];
    const { page, totalPages } = pagination;

    // Previous button
    buttons.push(`
      <button ${page === 1 ? 'disabled' : ''} onclick="loadBookingsPage(${page - 1})">Previous</button>
    `);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        buttons.push(`
          <button class="${i === page ? 'active' : ''}" onclick="loadBookingsPage(${i})">${i}</button>
        `);
      } else if (i === page - 3 || i === page + 3) {
        buttons.push('<span>...</span>');
      }
    }

    // Next button
    buttons.push(`
      <button ${page === totalPages ? 'disabled' : ''} onclick="loadBookingsPage(${page + 1})">Next</button>
    `);

    paginationEl.innerHTML = buttons.join('');
  };

  // Load bookings page
  window.loadBookingsPage = (page) => {
    loadBookings(page);
  };

  // Cancel booking
  window.cancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/admin/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
      }

      showMessage('Booking cancelled successfully', 'success');
      loadBookings(currentPage);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showMessage(error.message || 'Failed to cancel booking');
    }
  };

  // Apply filters
  const applyFiltersBtn = document.getElementById('apply-filters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      loadBookings(1);
    });
  }

  // Clear filters
  const clearFiltersBtn = document.getElementById('clear-filters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-start-date').value = '';
      document.getElementById('filter-end-date').value = '';
      loadBookings(1);
    });
  }

  // Load bookings on page load
  if (document.getElementById('bookings-table-body')) {
    loadBookings(1);
  }
})();

