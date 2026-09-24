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

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Skill description is required'],
    trim: true
  },
  competency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competency',
    required: [true, 'Competency reference is required']
  },
  category: {
    type: String,
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
  relatedSkills: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    }],
    validate: {
      validator: function(v) {
        // Ensure no duplicate IDs in the array
        const uniqueIds = new Set(v.map(id => id.toString()));
        if (uniqueIds.size !== v.length) return false;
        
        // Ensure skill doesn't reference itself
        if (this.isNew || this.isModified('relatedSkills')) {
          if (v.some(id => id.equals(this._id))) return false;
        }
        return true;
      },
      message: 'relatedSkills cannot contain duplicates or self-references'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
