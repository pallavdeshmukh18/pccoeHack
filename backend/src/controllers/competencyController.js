const Competency = require('../models/Competency');

exports.getAllCompetencies = async (req, res) => {
  try {
    const competencies = await Competency.find().populate('relatedCompetencies');
    res.json({ success: true, data: competencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompetencyById = async (req, res) => {
  try {
    const competency = await Competency.findById(req.params.id).populate('relatedCompetencies');
    if (!competency) {
      return res.status(404).json({ success: false, message: 'Competency not found' });
    }
    res.json({ success: true, data: competency });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createCompetency = async (req, res) => {
  try {
    const competency = new Competency(req.body);
    await competency.save();
    res.status(201).json({ success: true, data: competency });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Competency name already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCompetency = async (req, res) => {
  try {
    const competency = await Competency.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('relatedCompetencies');
    
    if (!competency) {
      return res.status(404).json({ success: false, message: 'Competency not found' });
    }
    res.json({ success: true, data: competency });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Competency name already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCompetency = async (req, res) => {
  try {
    const competency = await Competency.findByIdAndDelete(req.params.id);
    if (!competency) {
      return res.status(404).json({ success: false, message: 'Competency not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCompetencySkills = async (req, res) => {
  try {
    const competency = await Competency.findById(req.params.id);
    if (!competency) {
      return res.status(404).json({ success: false, message: 'Competency not found' });
    }
    
    // We need to fetch the Skill model inside or at top to avoid circular dependency
    const Skill = require('../models/Skill');
    const skills = await Skill.find({ competency: competency._id, isActive: true })
      .select('name description category proficiencyLevels');
      
    res.json({
      success: true,
      data: {
        competency: {
          id: competency._id,
          name: competency.name,
          category: competency.category
        },
        skills: skills
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCompetencyGraph = async (req, res) => {
  try {
    const competency = await Competency.findById(req.params.id);
    if (!competency) {
      return res.status(404).json({ success: false, message: 'Competency not found' });
    }
    
    const Skill = require('../models/Skill');
    const skills = await Skill.find({ competency: competency._id, isActive: true })
      .populate('relatedSkills', 'name category')
      .select('name description relatedSkills category');

    res.json({
      success: true,
      data: {
        competency: {
          id: competency._id,
          name: competency.name,
          description: competency.description,
          category: competency.category
        },
        skills: skills.map(skill => ({
          id: skill._id,
          name: skill.name,
          category: skill.category,
          relatedSkills: skill.relatedSkills
        }))
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
