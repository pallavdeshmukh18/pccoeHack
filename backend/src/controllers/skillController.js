const Skill = require('../models/Skill');
const Competency = require('../models/Competency');

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ isActive: true })
      .populate('competency', 'name category')
      .populate('relatedSkills', 'name');
    res.json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('competency', 'name category description')
      .populate('relatedSkills', 'name category description');
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    res.json({ success: true, data: skill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    // Verify competency exists
    if (req.body.competency) {
      const competency = await Competency.findById(req.body.competency);
      if (!competency) {
        return res.status(400).json({ success: false, message: 'Referenced competency does not exist' });
      }
    }

    const skill = new Skill(req.body);
    await skill.save();
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Skill name already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    if (req.body.competency) {
      const competency = await Competency.findById(req.body.competency);
      if (!competency) {
        return res.status(400).json({ success: false, message: 'Referenced competency does not exist' });
      }
    }

    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('competency', 'name category').populate('relatedSkills', 'name');
    
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    res.json({ success: true, data: skill });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Skill name already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    // Soft delete to preserve references
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    res.json({ success: true, data: skill, message: 'Skill successfully soft-deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getRelatedSkills = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('relatedSkills', 'name category description proficiencyLevels');
    
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }

    res.json({ 
      success: true, 
      data: {
        skill: {
          id: skill._id,
          name: skill.name,
          category: skill.category
        },
        relatedSkills: skill.relatedSkills
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
