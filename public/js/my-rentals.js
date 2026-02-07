// My Rentals page functionality
(() => {
  const rentalsList = document.getElementById('rentals-list');
  const loadingEl = document.getElementById('rentals-loading');

  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Format date (day-month-year, short month)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDerivedStatus = (rental) => {
    if (rental.status === 'cancelled') return { label: 'Cancelled', cls: 'status-cancelled' };
    const now = new Date();
    const start = new Date(rental.startDate);
    const end = new Date(rental.endDate);
    if (end < now) return { label: 'Completed', cls: 'status-completed' };
    if (start > now) return { label: 'Upcoming', cls: 'status-upcoming' };
    return { label: 'Active', cls: 'status-active' };
  };

  // Render rentals
  const renderRentals = (rentals) => {
    if (!rentalsList) return;

    if (rentals.length === 0) {
      rentalsList.innerHTML = `
        <div style="text-align: center; padding: 48px 24px;">
          <p class="muted" style="font-size: 16px; margin-bottom: 8px;">No rentals yet.</p>
          <p class="muted">
            <a href="/browse" style="color: var(--accent); text-decoration: none;">Browse cars</a> to get started!
          </p>
        </div>
      `;
      return;
    }

    rentalsList.innerHTML = rentals
      .map((rental) => {
        const make = escapeHtml(rental.carDetails.make);
        const model = escapeHtml(rental.carDetails.model);
        const year = escapeHtml(String(rental.carDetails.year));
        const transmission = escapeHtml(rental.carDetails.transmission);
        const fuel = escapeHtml(rental.carDetails.fuel);
        const seats = escapeHtml(String(rental.carDetails.seats));
        const subtotal = rental.totalPrice || 0;
        const pricePerDay = rental.carDetails.pricePerDay || Math.round(subtotal / Math.max(1, rental.totalDays));
        const gstPercent = 18;
        const gstAmount = Math.round(subtotal * gstPercent / 100);
        const grandTotal = subtotal + gstAmount;
        const statusInfo = getDerivedStatus(rental);
        const canCancel = statusInfo.label === 'Upcoming' || statusInfo.label === 'Active';
        const startDate = formatDate(rental.startDate);
        const endDate = formatDate(rental.endDate);
        const startISO = rental.startDate;
        const endISO = rental.endDate;
        const imageAlt = escapeHtml(`${rental.carDetails.make} ${rental.carDetails.model}`);

        return `
          <article class="rental-card">
            <div class="rental-image">
              <img src="${rental.carDetails.image}" alt="${imageAlt}" loading="lazy" />
            </div>
            <div class="rental-content">
              <div class="rental-header">
                <div>
                  <h3>${make} ${model} ${year}</h3>
                  <div class="rental-features">
                    <span>${seats} seats</span>
                    <span>${transmission}</span>
                    <span>${fuel}</span>
                  </div>
                </div>
                <span class="status-badge ${statusInfo.cls}">${statusInfo.label}</span>
              </div>
              <div class="rental-details">
                <div class="rental-detail-item">
                  <strong>Start Date:</strong>
                  <span>${startDate}</span>
                </div>
                <div class="rental-detail-item">
                  <strong>End Date:</strong>
                  <span>${endDate}</span>
                </div>
                <div class="rental-detail-item">
                  <strong>Duration:</strong>
                  <span>${rental.totalDays} ${rental.totalDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div class="rental-detail-item">
                  <strong>Total (excl. GST):</strong>
                  <span class="rental-price">₹${subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div class="rental-actions">
                <button 
                  class="button ghost view-invoice" 
                  data-id="${rental.id}"
                  data-make="${make}"
                  data-model="${model}"
                  data-year="${year}"
                  data-start="${startDate}"
                  data-end="${endDate}"
                  data-startiso="${startISO}"
                  data-endiso="${endISO}"
                  data-days="${rental.totalDays}"
                  data-priceperday="${pricePerDay}"
                  data-subtotal="${subtotal}"
                  data-gst="${gstAmount}"
                  data-total="${grandTotal}"
                >View Invoice</button>
                ${canCancel ? `<button class="button ghost cancel-rental" data-id="${rental.id}">Cancel</button>` : ''}
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  };

  // Fetch rentals
  const fetchRentals = async () => {
    if (loadingEl) loadingEl.style.display = 'block';
    if (rentalsList) rentalsList.innerHTML = '';

    try {
      const response = await fetch('/api/my-rentals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      renderRentals(data.rentals || []);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      if (rentalsList) {
        rentalsList.innerHTML = `
          <div style="text-align: center; padding: 48px 24px;">
            <p class="muted" style="font-size: 16px;">Error loading rentals. Please try again.</p>
          </div>
        `;
      }
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  };

  const closeInvoiceModal = () => {
    const modal = document.getElementById('invoice-modal');
    if (modal) modal.remove();
  };

  const showInvoice = (data) => {
    // Remove existing
    closeInvoiceModal();
    const startFormatted = formatDate(data.startIso || data.start);
    const endFormatted = formatDate(data.endIso || data.end);
    const html = `
      <div class="invoice-modal-overlay" id="invoice-modal">
        <div class="invoice-modal">
          <button class="invoice-close" aria-label="Close invoice">&times;</button>
          <h3>Invoice</h3>
          <p class="muted" style="margin-top:4px;">${data.make} ${data.model} ${data.year}</p>
          <div class="invoice-grid">
            <div><span class="muted">Start</span><strong>${startFormatted}</strong></div>
            <div><span class="muted">End</span><strong>${endFormatted}</strong></div>
            <div><span class="muted">Days</span><strong>${data.days}</strong></div>
          </div>
          <div class="invoice-breakdown">
            <div><span>Price per day</span><span>₹${data.pricePerDay.toLocaleString('en-IN')}</span></div>
            <div><span>Subtotal</span><span>₹${data.subtotal.toLocaleString('en-IN')}</span></div>
            <div><span>GST (18%)</span><span>₹${data.gst.toLocaleString('en-IN')}</span></div>
            <hr />
            <div class="invoice-total"><span>Total Amount</span><span>₹${data.total.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.querySelector('#invoice-modal .invoice-close').addEventListener('click', closeInvoiceModal);
    document.getElementById('invoice-modal').addEventListener('click', (e) => {
      if (e.target.id === 'invoice-modal') closeInvoiceModal();
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Verify token first
      fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          fetchRentals();
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        });
    });
  } else {
    // Verify token first
    fetch('/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        fetchRentals();
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      });
  }

  // Event delegation for invoice buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-invoice');
    if (!btn) return;
    const data = {
      make: btn.dataset.make,
      model: btn.dataset.model,
      year: btn.dataset.year,
      start: btn.dataset.start,
      end: btn.dataset.end,
      days: Number(btn.dataset.days),
      pricePerDay: Number(btn.dataset.priceperday),
      subtotal: Number(btn.dataset.subtotal),
      gst: Number(btn.dataset.gst),
      total: Number(btn.dataset.total),
    };
    showInvoice(data);
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.cancel-rental');
    if (!btn) return;
    const rentalId = btn.dataset.id;
    if (!confirm('Are you sure you want to cancel this rental?')) return;
    btn.disabled = true;
    btn.textContent = 'Cancelling...';
    try {
      const res = await fetch(`/api/bookings/${rentalId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || 'Failed to cancel rental');
        btn.disabled = false;
        btn.textContent = 'Cancel';
        return;
      }
      // Refresh list
      fetchRentals();
    } catch (err) {
      console.error('Cancel rental error', err);
      alert('Network error. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Cancel';
    }
  });
})();

