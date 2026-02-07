// Admin Calendar JavaScript

(() => {
  'use strict';

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || new URLSearchParams(window.location.search).get('token');
  
  if (!token) {
    window.location.href = '/login';
    return;
  }

  let selectedCarId = null;
  let selectedMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  // Load cars for dropdown
  const loadCars = async () => {
    const carSelect = document.getElementById('car-select');
    if (!carSelect) return;

    try {
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

      carSelect.innerHTML = '<option value="">Select a car...</option>' +
        cars.map(car => `<option value="${car.id}">${car.make} ${car.model} ${car.year}</option>`).join('');

      carSelect.addEventListener('change', (e) => {
        selectedCarId = e.target.value;
      });
    } catch (error) {
      console.error('Error loading cars:', error);
      carSelect.innerHTML = '<option value="">Error loading cars</option>';
    }
  };

  // Load calendar
  const loadCalendar = async () => {
    if (!selectedCarId) {
      alert('Please select a car');
      return;
    }

    const container = document.getElementById('calendar-container');
    if (!container) return;

    try {
      container.innerHTML = '<div class="loading">Loading calendar...</div>';

      // Get bookings for the selected car and month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      const response = await fetch(`/admin/api/bookings?carId=${selectedCarId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }

      const data = await response.json();
      const bookings = data.bookings || [];

      // Generate calendar
      const calendarHTML = generateCalendar(year, month - 1, bookings);
      container.innerHTML = calendarHTML;
    } catch (error) {
      console.error('Error loading calendar:', error);
      container.innerHTML = '<div class="error-message">Error loading calendar. Please try again.</div>';
    }
  };

  // Generate calendar HTML
  const generateCalendar = (year, month, bookings) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = `<div class="calendar">
      <h2>${monthNames[month]} ${year}</h2>
      <div class="calendar-grid">
        ${dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
    `;

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if this date is booked
      const isBooked = bookings.some(booking => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        return date >= start && date <= end && booking.status !== 'cancelled';
      });

      const isMaintenance = false; // Could check car.maintenanceUntil if needed

      let className = 'calendar-day';
      let statusText = 'Available';
      
      if (isBooked) {
        className += ' booked';
        statusText = 'Booked';
      } else if (isMaintenance) {
        className += ' maintenance';
        statusText = 'Maintenance';
      } else {
        className += ' available';
      }

      html += `<div class="${className}" title="${statusText}">
        <span class="day-number">${day}</span>
        ${isBooked ? '<span class="day-status">📅</span>' : ''}
        ${isMaintenance ? '<span class="day-status">🔧</span>' : ''}
      </div>`;
    }

    html += `</div>
      <div class="calendar-legend">
        <div class="legend-item"><span class="legend-color available"></span> Available</div>
        <div class="legend-item"><span class="legend-color booked"></span> Booked</div>
        <div class="legend-item"><span class="legend-color maintenance"></span> Maintenance</div>
      </div>
    </div>`;

    return html;
  };

  // Initialize
  const monthSelect = document.getElementById('month-select');
  if (monthSelect) {
    monthSelect.value = selectedMonth;
    monthSelect.addEventListener('change', (e) => {
      selectedMonth = e.target.value;
    });
  }

  const loadBtn = document.getElementById('load-calendar');
  if (loadBtn) {
    loadBtn.addEventListener('click', loadCalendar);
  }

  loadCars();
})();

