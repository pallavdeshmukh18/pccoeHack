const mongoose = require('mongoose');

const proficiencyLevelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const competencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Competency name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Competency description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  proficiencyLevels: {
    type: [proficiencyLevelSchema],
    validate: {
      validator: function (v) {
        if (!Array.isArray(v) || v.length !== 5) return false;
        const levels = v.map(p => p.level).sort();
        for (let i = 0; i < 5; i++) {
          if (levels[i] !== i + 1) return false;
        }
        return true;
      },
      message: 'proficiencyLevels must contain exactly 5 levels (1 to 5)'
    },
    required: true
  },
  relatedCompetencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competency'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Competency', competencySchema);
