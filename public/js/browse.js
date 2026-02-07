const grid = document.getElementById('cars-grid');
const pageInfo = document.getElementById('page-info');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');

const filters = {
  make: document.getElementById('filter-make'),
  model: document.getElementById('filter-model'),
  transmission: document.getElementById('filter-transmission'),
};
const sortSelect = document.getElementById('filter-sort');

const searchKeyword = document.getElementById('search-keyword');
const minPriceSlider = document.getElementById('filter-min-price');
const maxPriceSlider = document.getElementById('filter-max-price');
const minPriceValue = document.getElementById('min-price-value');
const maxPriceValue = document.getElementById('max-price-value');

let currentPage = 1;
const pageSize = 20;

const buildQuery = () => {
  const params = new URLSearchParams();
  const q = searchKeyword.value.trim();
  if (q) params.append('q', q);

  Object.entries(filters).forEach(([key, input]) => {
    const value = input.value.trim();
    if (value) params.append(key, value);
  });

  const sort = sortSelect?.value || '';
  if (sort === 'price-asc') params.append('sort', 'priceAsc');
  if (sort === 'price-desc') params.append('sort', 'priceDesc');

  const minPrice = Number(minPriceSlider?.value || 0);
  const maxPrice = Number(maxPriceSlider?.value || 12000);
  // Only add price filters if they're not at default values (to avoid filtering on initial load)
  if (minPrice > 0 || maxPrice < 12000) {
    params.append('minPrice', minPrice);
    params.append('maxPrice', maxPrice);
  }

  params.append('page', currentPage);
  params.append('pageSize', pageSize);
  return params.toString();
};

// Car details modal functionality
const showCarDetails = async (carId) => {
  try {
    const response = await fetch(`/api/cars/${carId}`);
    if (!response.ok) {
      alert('Car details not found');
      return;
    }
    const car = await response.json();
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const make = escapeHtml(car.make);
    const model = escapeHtml(car.model);
    const year = escapeHtml(String(car.year));
    const transmission = escapeHtml(car.transmission);
    const fuel = escapeHtml(car.fuel);
    const seats = escapeHtml(String(car.seats));
    const mileage = escapeHtml(car.mileage || 'N/A');
    const fuelPolicy = escapeHtml(car.fuelPolicy || 'Standard policy applies');
    const price = car.pricePerDay.toLocaleString('en-IN');
    const imageAlt = escapeHtml(`${car.make} ${car.model}`);
    
    // Create modal HTML
    const modalHTML = `
      <div class="car-details-modal-overlay" id="car-details-modal">
        <div class="car-details-modal">
          <button class="car-details-close" aria-label="Close modal">&times;</button>
          <div class="car-details-image">
            <img src="${car.image}" alt="${imageAlt}" />
          </div>
          <div class="car-details-content">
            <h2>${make} ${model} ${year}</h2>
            <div class="car-details-price">₹${price}/day</div>
            <div class="car-details-specs">
              <div class="car-detail-item">
                <span class="detail-label">Transmission</span>
                <span class="detail-value">${transmission}</span>
              </div>
              <div class="car-detail-item">
                <span class="detail-label">Fuel Type</span>
                <span class="detail-value">${fuel}</span>
              </div>
              <div class="car-detail-item">
                <span class="detail-label">Seating Capacity</span>
                <span class="detail-value">${seats} seats</span>
              </div>
              <div class="car-detail-item">
                <span class="detail-label">Mileage</span>
                <span class="detail-value">${mileage}</span>
              </div>
              <div class="car-detail-item full-width">
                <span class="detail-label">Fuel Policy</span>
                <span class="detail-value">${fuelPolicy}</span>
              </div>
            </div>
            <div class="car-details-actions">
              <button class="button primary book-from-modal" data-car-id="${car.id}">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('car-details-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('car-details-modal');
    
    // Close handlers
    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 200);
    };
    
    modal.querySelector('.car-details-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // Book now button in modal
    const bookBtn = modal.querySelector('.book-from-modal');
    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        closeModal();
        // Trigger book now functionality
        const bookNowBtn = document.querySelector(`.book-now-btn[data-car-id="${car.id}"]`);
        if (bookNowBtn) {
          bookNowBtn.click();
        }
      });
    }
    
    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Animate in
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
  } catch (error) {
    console.error('Error fetching car details:', error);
    alert('Error loading car details. Please try again.');
  }
};

const renderLoadingSkeletons = (count = 6) => {
  if (!grid) return;
  grid.innerHTML = Array(count)
    .fill(0)
    .map(
      () => `
      <article class="loading-skeleton">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line" style="width: 40%; margin-top: 8px;"></div>
          <div class="skeleton-line" style="width: 70%; margin-top: 12px;"></div>
        </div>
      </article>
    `
    )
    .join('');
};

const renderCars = (cars) => {
  if (!grid) return;
  
  if (!cars.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
        <p class="muted" style="font-size: 16px;">No cars match your filters.</p>
        <p class="muted small" style="margin-top: 8px;">Try adjusting your search criteria.</p>
      </div>
    `;
    return;
  }

  // Escape user data to prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  grid.innerHTML = cars
    .map(
      (car) => {
        const isAvailable = car.isAvailable !== false;
        // Escape all user-controlled data
        const make = escapeHtml(car.make);
        const model = escapeHtml(car.model);
        const year = escapeHtml(String(car.year));
        const transmission = escapeHtml(car.transmission);
        const fuel = escapeHtml(car.fuel);
        const seats = escapeHtml(String(car.seats));
        const price = car.pricePerDay.toLocaleString('en-IN');
        // Image URL should be validated server-side, but escape alt text
        const imageAlt = escapeHtml(`${car.make} ${car.model}`);
        
        return `
          <article class="car-card">
            <div class="image-wrapper">
              <img src="${car.image}" alt="${imageAlt}" loading="lazy" />
            </div>
            <div class="body">
              <div>
                <h3>${make} ${model}</h3>
                <div class="car-features">
                  <span>${year}</span>
                  <span>${transmission}</span>
                  <span>${fuel}</span>
                </div>
              </div>
              <div class="price">₹${price}/day</div>
              <div class="card-actions">
                <button class="button primary small-button book-now-btn" type="button" data-car-id="${car.id}" ${isAvailable ? '' : 'disabled'}>${isAvailable ? 'Book now' : 'Unavailable'}</button>
                <button class="button ghost small-button details-btn" type="button" data-car-id="${car.id}">Details</button>
              </div>
            </div>
          </article>
        `;
      }
    )
    .join('');
};

const updatePagination = ({ page, totalPages }) => {
  if (pageInfo) pageInfo.textContent = `Page ${page} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;
};

const fetchCars = async () => {
  if (!grid) return;
  
  renderLoadingSkeletons();
  
  try {
    const query = buildQuery();
    const response = await fetch(`/api/cars?${query}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    renderCars(result.data || []);
    updatePagination(result.pagination || { page: 1, totalPages: 1 });
  } catch (error) {
    if (!grid) return;
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
        <p class="muted" style="font-size: 16px;">Error loading cars. Please try again.</p>
      </div>
    `;
    console.error('Error fetching cars:', error);
  }
};

// Add null checks for event listeners
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const searchSubmitBtn = document.getElementById('search-submit');
const searchClearBtn = document.getElementById('search-clear');

if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', () => {
    currentPage = 1;
    fetchCars();
  });
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', () => {
    Object.values(filters).forEach((input) => input && (input.value = ''));
    if (minPriceSlider) minPriceSlider.value = 0;
    if (maxPriceSlider) maxPriceSlider.value = 12000;
    if (sortSelect) sortSelect.value = '';
    updatePriceLabels();
    currentPage = 1;
    fetchCars();
  });
}

if (searchSubmitBtn) {
  searchSubmitBtn.addEventListener('click', () => {
    currentPage = 1;
    fetchCars();
  });
}

if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    if (searchKeyword) searchKeyword.value = '';
    if (sortSelect) sortSelect.value = '';
    currentPage = 1;
    fetchCars();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    currentPage = 1;
    fetchCars();
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      fetchCars();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    currentPage += 1;
    fetchCars();
  });
}

// Tabs
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
    tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
  });
});

const formatPrice = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

const updatePriceLabels = () => {
  if (!minPriceSlider || !maxPriceSlider || !minPriceValue || !maxPriceValue) return;
  
  const minVal = Number(minPriceSlider.value);
  const maxVal = Number(maxPriceSlider.value);

  if (minVal > maxVal) {
    maxPriceSlider.value = minVal;
  }

  minPriceValue.textContent = formatPrice(minPriceSlider.value);
  maxPriceValue.textContent = formatPrice(maxPriceSlider.value);
};

if (minPriceSlider) {
  minPriceSlider.addEventListener('input', updatePriceLabels);
}
if (maxPriceSlider) {
  maxPriceSlider.addEventListener('input', updatePriceLabels);
}

// Booking modal functionality
const showBookingModal = async (carId) => {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      if (confirm('You need to login to book a car. Would you like to go to the login page?')) {
        window.location.href = '/login';
      }
      return;
    }

    // Fetch car details
    const response = await fetch(`/api/cars/${carId}`);
    if (!response.ok) {
      alert('Car details not found');
      return;
    }
    const car = await response.json();

    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    const make = escapeHtml(car.make);
    const model = escapeHtml(car.model);
    const year = escapeHtml(String(car.year));
    const pricePerDay = car.pricePerDay;
    const priceFormatted = pricePerDay.toLocaleString('en-IN');
    const imageAlt = escapeHtml(`${car.make} ${car.model}`);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const GST_PERCENT = 18; // default GST percentage

    // Create booking modal HTML
    const modalHTML = `
      <div class="booking-modal-overlay" id="booking-modal">
        <div class="booking-modal">
          <button class="booking-close" aria-label="Close modal">&times;</button>
          <div class="booking-header">
            <div class="booking-car-image">
              <img src="${car.image}" alt="${imageAlt}" />
            </div>
            <div class="booking-car-info">
              <h2>${make} ${model} ${year}</h2>
              <div class="booking-price-per-day">₹${priceFormatted}/day</div>
            </div>
          </div>
          <div class="booking-content">
            <div class="booking-form">
              <div class="booking-form-group">
                <label for="booking-start-date">Start Date</label>
                <input type="date" id="booking-start-date" min="${today}" value="${today}" required />
              </div>
              <div class="booking-form-group">
                <label for="booking-end-date">End Date</label>
                <input type="date" id="booking-end-date" min="${tomorrow}" value="${tomorrow}" required />
              </div>
            </div>
            <div class="booking-summary">
              <div class="booking-summary-row">
                <span>Price per day</span>
                <span>₹${priceFormatted}</span>
              </div>
              <div class="booking-summary-row">
                <span>Number of days</span>
                <span id="booking-days">1</span>
              </div>
              <div class="booking-summary-row">
                <span>Subtotal</span>
                <span id="booking-subtotal">₹${priceFormatted}</span>
              </div>
              <div class="booking-summary-row">
                <span>GST (${GST_PERCENT}%)</span>
                <span id="booking-gst">₹${Math.round(pricePerDay * (GST_PERCENT / 100)).toLocaleString('en-IN')}</span>
              </div>
              <div class="booking-summary-divider"></div>
              <div class="booking-summary-row booking-total">
                <span>Total Payable</span>
                <span id="booking-total-price">₹${Math.round(pricePerDay * (1 + GST_PERCENT / 100)).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div id="booking-error" class="booking-error" style="display: none;"></div>
            <div class="booking-actions">
              <button class="button ghost" id="booking-submit-btn">Confirm Booking</button>
              <button class="button ghost" id="booking-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('booking-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('booking-modal');
    const startDateInput = document.getElementById('booking-start-date');
    const endDateInput = document.getElementById('booking-end-date');
    const daysDisplay = document.getElementById('booking-days');
    const totalPriceDisplay = document.getElementById('booking-total-price');
    const errorDisplay = document.getElementById('booking-error');
    const submitBtn = document.getElementById('booking-submit-btn');
    const cancelBtn = document.getElementById('booking-cancel-btn');

    // Calculate and update price
    const calculatePrice = () => {
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Hide error initially
      const errorEl = document.getElementById('booking-error');
      if (errorEl) errorEl.style.display = 'none';

      if (!startDateInput.value || !endDateInput.value) {
        return;
      }

      if (startDate < today) {
        if (errorEl) {
          errorEl.textContent = 'Start date cannot be in the past';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (endDate <= startDate) {
        if (errorEl) {
          errorEl.textContent = 'End date must be after start date';
          errorEl.style.display = 'block';
        }
        return;
      }

      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const subtotal = days * pricePerDay;
      const gstAmount = Math.round(subtotal * (GST_PERCENT / 100));
      const totalPrice = subtotal + gstAmount;

      daysDisplay.textContent = days;
      const subtotalEl = document.getElementById('booking-subtotal');
      const gstEl = document.getElementById('booking-gst');
      if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
      if (gstEl) gstEl.textContent = `₹${gstAmount.toLocaleString('en-IN')}`;
      totalPriceDisplay.textContent = `₹${totalPrice.toLocaleString('en-IN')}`;
    };

    // Update end date min when start date changes
    startDateInput.addEventListener('change', () => {
      const startDate = new Date(startDateInput.value);
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      endDateInput.min = nextDay.toISOString().split('T')[0];
      
      // If end date is before new min, update it
      if (endDateInput.value && new Date(endDateInput.value) <= startDate) {
        endDateInput.value = nextDay.toISOString().split('T')[0];
      }
      
      calculatePrice();
    });

    endDateInput.addEventListener('change', calculatePrice);

    // Initial calculation
    calculatePrice();

    // Close handlers
    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('.booking-close').addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Submit booking - first check for DL, then proceed
    submitBtn.addEventListener('click', async () => {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (!startDate || !endDate) {
        const errorEl = document.getElementById('booking-error');
        if (errorEl) {
          errorEl.textContent = 'Please select both start and end dates';
          errorEl.style.display = 'block';
        }
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        const errorEl = document.getElementById('booking-error');
        if (errorEl) {
          errorEl.textContent = 'Start date cannot be in the past';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (end <= start) {
        const errorEl = document.getElementById('booking-error');
        if (errorEl) {
          errorEl.textContent = 'End date must be after start date';
          errorEl.style.display = 'block';
        }
        return;
      }

      // Always verify DL for each booking
      closeModal();
      showDLVerificationModal(carId, startDate, endDate);
    });

    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Animate in
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
  } catch (error) {
    console.error('Error showing booking modal:', error);
    alert('Error loading booking form. Please try again.');
  }
};

// Booking functionality
const setupBookingButtons = () => {
  document.addEventListener('click', async (e) => {
    const bookBtn = e.target.closest('.book-now-btn, .book-from-modal');
    if (bookBtn) {
      // If disabled, do nothing (browser handles visual disabled state)
      if (bookBtn.hasAttribute('disabled') || bookBtn.classList.contains('disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      e.preventDefault();
      const carId = bookBtn.dataset.carId;
      if (carId) {
        showBookingModal(Number(carId));
      }
    }

    const detailsBtn = e.target.closest('.details-btn');
    if (detailsBtn) {
      e.preventDefault();
      const carId = detailsBtn.dataset.carId;
      showCarDetails(Number(carId));
    }
  });
};

/**
 * Show DL verification modal
 */
const showDLVerificationModal = (carId, startDate, endDate) => {
  const token = localStorage.getItem('token');
  
  const modalHTML = `
    <div class="dl-verification-modal-overlay" id="dl-verification-modal">
      <div class="dl-verification-modal">
        <button class="dl-verification-close" aria-label="Close modal">&times;</button>
        <div class="dl-verification-header">
          <h2>Driving License Verification</h2>
          <p class="dl-verification-subtitle">Please provide your driving license details to complete the booking</p>
        </div>
        <div class="dl-verification-content">
          <div class="dl-verification-tabs">
            <button class="dl-tab-button active" data-tab="manual">Enter Details</button>
            <button class="dl-tab-button" data-tab="upload">Upload Photo</button>
          </div>
          
          <div class="dl-tab-panel active" id="dl-tab-manual">
            <form id="dl-manual-form">
              <div class="dl-form-group">
                <label for="dl-full-name">Full Name <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="dl-full-name" 
                  placeholder="As on your driving license" 
                  required 
                  maxlength="80"
                  style="text-transform: uppercase;"
                />
              </div>
              <div class="dl-form-group">
                <label for="dl-number">Driving License Number <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="dl-number" 
                  placeholder="e.g., DL0120141234567" 
                  required 
                  maxlength="15"
                  style="text-transform: uppercase;"
                />
                <small class="dl-hint">Max 15 chars. Format: 2 letters + 2 digits + 4-11 alphanumeric</small>
              </div>
              <div class="dl-form-group">
                <label for="dl-expiry">Expiry Date <span class="required">*</span></label>
                <input 
                  type="date" 
                  id="dl-expiry" 
                  required 
                  min="${new Date().toISOString().split('T')[0]}"
                />
              </div>
              <div id="dl-manual-error" class="dl-error" style="display: none;"></div>
            </form>
          </div>
          
          <div class="dl-tab-panel" id="dl-tab-upload">
            <form id="dl-upload-form">
              <div class="dl-form-group">
                <label for="dl-full-name-upload">Full Name <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="dl-full-name-upload" 
                  placeholder="As on your driving license" 
                  required 
                  maxlength="80"
                  style="text-transform: uppercase;"
                />
              </div>
              <div class="dl-form-group">
                <label for="dl-photo">Upload Driving License Photo <span class="required">*</span></label>
                <div class="dl-upload-area" id="dl-upload-area">
                  <input type="file" id="dl-photo" accept="image/*" required style="display: none;" />
                  <div class="dl-upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p>Click to upload or drag and drop</p>
                    <p class="dl-upload-hint">PNG, JPG up to 5MB</p>
                  </div>
                  <div class="dl-upload-preview" id="dl-upload-preview" style="display: none;">
                    <img id="dl-preview-image" src="" alt="DL Preview" />
                    <button type="button" class="dl-remove-image" id="dl-remove-image">&times;</button>
                  </div>
                </div>
              </div>
              <div id="dl-upload-error" class="dl-error" style="display: none;"></div>
            </form>
          </div>
          
          <div class="dl-verification-actions">
            <button class="button primary" id="dl-submit-btn">Save & Continue Booking</button>
            <button class="button ghost" id="dl-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById('dl-verification-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = document.getElementById('dl-verification-modal');
  
  // Tab switching
  const tabButtons = modal.querySelectorAll('.dl-tab-button');
  const tabPanels = modal.querySelectorAll('.dl-tab-panel');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`dl-tab-${targetTab}`).classList.add('active');
    });
  });

  // File upload handling
  const fileInput = document.getElementById('dl-photo');
  const uploadArea = document.getElementById('dl-upload-area');
  const uploadPlaceholder = uploadArea.querySelector('.dl-upload-placeholder');
  const uploadPreview = document.getElementById('dl-upload-preview');
  const previewImage = document.getElementById('dl-preview-image');
  const removeImageBtn = document.getElementById('dl-remove-image');

  uploadArea.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('dl-upload-error').textContent = 'File size must be less than 5MB';
        document.getElementById('dl-upload-error').style.display = 'block';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImage.src = event.target.result;
        uploadPlaceholder.style.display = 'none';
        uploadPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  removeImageBtn.addEventListener('click', () => {
    fileInput.value = '';
    uploadPlaceholder.style.display = 'block';
    uploadPreview.style.display = 'none';
  });

  // Close handlers
  const closeModal = () => {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 200);
  };

  modal.querySelector('.dl-verification-close').addEventListener('click', closeModal);
  document.getElementById('dl-cancel-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Submit DL verification
  document.getElementById('dl-submit-btn').addEventListener('click', async () => {
    const activeTab = modal.querySelector('.dl-tab-button.active').dataset.tab;
    const submitBtn = document.getElementById('dl-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      let updateData = {};

      if (activeTab === 'manual') {
        const fullName = document.getElementById('dl-full-name').value.trim().toUpperCase();
        const dlNumber = document.getElementById('dl-number').value.trim();
        const dlExpiry = document.getElementById('dl-expiry').value;
        const errorEl = document.getElementById('dl-manual-error');

        if (!fullName) {
          errorEl.textContent = 'Full name is required';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save & Continue Booking';
          return;
        }

        if (!dlNumber || !dlExpiry) {
          errorEl.textContent = 'Please fill all required fields';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save & Continue Booking';
          return;
        }

        // Client-side validation (align with server: 2 letters + 2 digits + 4-11 alphanumeric)
        const dlPattern = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,11}$/;
        const normalized = dlNumber.toUpperCase().replace(/[\s\-_]/g, '');
        
        if (!dlPattern.test(normalized)) {
          errorEl.textContent = 'Invalid DL format. Format: 2 letters + 2 digits + 4-11 letters/digits (e.g., DL0120141234567)';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save & Continue Booking';
          return;
        }

        const expiryDate = new Date(dlExpiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          errorEl.textContent = 'Driving license has expired. Please renew your license.';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save & Continue Booking';
          return;
        }

        updateData = {
          name: fullName,
          dlNumber: normalized,
          dlExpiry: dlExpiry,
        };
      } else {
        const fileInput = document.getElementById('dl-photo');
        const file = fileInput.files[0];
        const errorEl = document.getElementById('dl-upload-error');

        if (!file) {
          errorEl.textContent = 'Please upload a driving license photo';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save & Continue Booking';
          return;
        }

        const fullNameUpload = document.getElementById('dl-full-name-upload').value.trim().toUpperCase();
        if (!fullNameUpload) {
          errorEl.textContent = 'Full name is required';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save & Continue Booking';
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          updateData = {
            name: fullNameUpload,
            dlPhoto: event.target.result, // Base64 string
          };

          // Save DL to profile
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
            errorEl.textContent = data.message || 'Failed to save driving license';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save & Continue Booking';
            return;
          }

          // Close DL modal and proceed with booking
          closeModal();
          proceedWithBooking(carId, startDate, endDate, null, null);
        };

        reader.onerror = () => {
          errorEl.textContent = 'Error reading file';
          errorEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save & Continue Booking';
        };

        reader.readAsDataURL(file);
        return; // Will continue in reader.onload
      }

      // Save DL to profile (for manual entry)
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
        const errorEl = document.getElementById(activeTab === 'manual' ? 'dl-manual-error' : 'dl-upload-error');
        errorEl.textContent = data.message || 'Failed to save driving license';
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save & Continue Booking';
        return;
      }

      // Close DL modal and proceed with booking
      closeModal();
      proceedWithBooking(carId, startDate, endDate, null, null);

    } catch (error) {
      console.error('DL verification error:', error);
      const errorEl = document.getElementById(activeTab === 'manual' ? 'dl-manual-error' : 'dl-upload-error');
      errorEl.textContent = 'Network error. Please try again.';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save & Continue Booking';
    }
  });

  // Escape key to close
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Animate in
  setTimeout(() => {
    modal.style.opacity = '1';
  }, 10);
};

/**
 * Proceed with booking after DL verification
 */
const proceedWithBooking = async (carId, startDate, endDate, submitBtn, closeModal) => {
  const token = localStorage.getItem('token');
  
  // If submitBtn is provided, update it
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';
  }

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        carId: Number(carId),
        startDate,
        endDate,
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      alert('Server error. Please try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
      }
      return;
    }

    if (!response.ok) {
      // Check if DL is required
      if (data.requiresDL) {
        // Show DL modal if not already shown
        if (!document.getElementById('dl-verification-modal')) {
          showDLVerificationModal(carId, startDate, endDate);
        }
      } else {
        alert(data.message || 'Failed to book car');
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
      }
      return;
    }

    // Success
    if (closeModal) closeModal();
    
    // Trigger storage event to update rental stats on profile page
    window.dispatchEvent(new Event('storage'));
    
    // Redirect straight to My Rentals (include token so view route can verify)
    const redirectToken = token ? `?token=${encodeURIComponent(token)}` : '';
    window.location.href = `/my-rentals${redirectToken}`;
  } catch (error) {
    console.error('Booking error:', error);
    alert('Network error. Please try again.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Booking';
    }
  }
};

// Initialize only if elements exist
if (grid) {
  // Reset price filters to show all cars on initial load
  if (minPriceSlider) minPriceSlider.value = 0;
  if (maxPriceSlider) maxPriceSlider.value = 12000;
  updatePriceLabels();
  fetchCars();
  setupBookingButtons();
}

