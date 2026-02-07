const User = require('../models/User');
const Rental = require('../models/Rental');
const cacheService = require('../services/cacheService');
const pubsubService = require('../services/pubsubService');
const { validateDLNumber, validateDLExpiry } = require('../utils/validation');

/**
 * Get user profile page
 */
const getProfilePage = async (req, res, next) => {
  try {
    console.log('Profile page requested, user:', req.user);
    const userId = req.user?.userId;
    if (!userId) {
      console.log('No userId in req.user, redirecting to login');
      return res.redirect('/login');
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log('User not found in database, redirecting to login');
      return res.redirect('/login');
    }

    // Get rental statistics
    const totalRentals = await Rental.countDocuments({ userId });
    const activeRentals = await Rental.countDocuments({ 
      userId, 
      status: 'active',
      endDate: { $gte: new Date() } // Only count rentals that haven't ended yet
    });
    const completedRentals = await Rental.countDocuments({ 
      userId, 
      status: 'completed' 
    });

    res.render('profile', { 
      user,
      rentalStats: {
        total: totalRentals,
        active: activeRentals,
        completed: completedRentals
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, dob, phone, dlNumber, dlExpiry, dlPhoto } = req.body;
    const userId = req.user.userId;

    const updateData = {};

    // Only require name if the client is trying to update it (ignore null/undefined)
    if (name !== undefined && name !== null) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Name is required' });
      }
      updateData.name = name.trim();
    }

    // Add dob if provided
    if (dob !== undefined) {
      if (dob === '' || dob === null) {
        updateData.dob = null;
      } else {
        updateData.dob = new Date(dob);
      }
    }

    // Add phone if provided
    if (phone !== undefined) {
      updateData.phone = phone.trim() || '';
    }

    // Add DL number if provided
    if (dlNumber !== undefined) {
      if (dlNumber === '' || dlNumber === null) {
        updateData.dlNumber = '';
        updateData.dlExpiry = null;
      } else {
        // Validate DL number format
        const dlValidation = validateDLNumber(dlNumber);
        if (!dlValidation.valid) {
          return res.status(400).json({ message: dlValidation.message });
        }
        updateData.dlNumber = dlValidation.normalized;
      }
    }

    // Add DL expiry if provided
    if (dlExpiry !== undefined) {
      if (dlExpiry === '' || dlExpiry === null) {
        updateData.dlExpiry = null;
      } else {
        // Validate DL expiry
        const expiryValidation = validateDLExpiry(dlExpiry);
        if (!expiryValidation.valid) {
          return res.status(400).json({ message: expiryValidation.message });
        }
        updateData.dlExpiry = new Date(dlExpiry);
      }
    }

    // Add DL photo if provided
    if (dlPhoto !== undefined) {
      updateData.dlPhoto = dlPhoto.trim() || '';
    }

    // If DL number is provided, expiry is required
    if (updateData.dlNumber && !updateData.dlExpiry && dlExpiry === undefined) {
      const currentUser = await User.findById(userId);
      if (!currentUser.dlExpiry) {
        return res.status(400).json({ message: 'Driving license expiry date is required when providing DL number' });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Invalidate user profile cache
    await cacheService.invalidate(cacheService.generateResourceKey('user:profile', userId));

    // Publish profile updated event
    pubsubService.publish('user:profile:updated', {
      userId: userId,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        phone: user.phone,
        dlNumber: user.dlNumber,
        dlExpiry: user.dlExpiry,
        dlPhoto: user.dlPhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfilePage, updateProfile };

