const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    required: [true, 'Employee code is required'],
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  status: {
    type: String,
    enum: {
      values: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
      message: '{VALUE} is not supported'
    },
    default: 'ACTIVE'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobRole',
    default: null
  },
  location: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
employeeSchema.index({ department: 1 });
employeeSchema.index({ jobTitle: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
