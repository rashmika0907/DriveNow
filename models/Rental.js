const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  carId: {
    type: Number,
    required: [true, 'Car ID is required'],
  },
  carDetails: {
    make: String,
    model: String,
    year: Number,
    image: String,
    pricePerDay: Number,
    seats: Number,
    transmission: String,
    fuel: String,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  totalDays: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validate that endDate is after startDate
rentalSchema.pre('validate', function() {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
});

module.exports = mongoose.model('Rental', rentalSchema);

