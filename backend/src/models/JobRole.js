const mongoose = require('mongoose');

const competencyRequirementSchema = new mongoose.Schema({
  competency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competency',
    required: [true, 'Competency reference is required']
  },
  requiredLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  importance: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  }
}, { _id: false });

const skillRequirementSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: [true, 'Skill reference is required']
  },
  requiredLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  importance: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  }
}, { _id: false });

const jobRoleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  competencyRequirements: {
    type: [competencyRequirementSchema],
    validate: {
      validator: function(v) {
        const uniqueIds = new Set(v.map(req => req.competency.toString()));
        return uniqueIds.size === v.length;
      },
      message: 'Duplicate competencies are not allowed in competencyRequirements'
    }
  },
  skillRequirements: {
    type: [skillRequirementSchema],
    validate: {
      validator: function(v) {
        const uniqueIds = new Set(v.map(req => req.skill.toString()));
        return uniqueIds.size === v.length;
      },
      message: 'Duplicate skills are not allowed in skillRequirements'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('JobRole', jobRoleSchema);
