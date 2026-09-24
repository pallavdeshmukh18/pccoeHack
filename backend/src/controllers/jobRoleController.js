const JobRole = require('../models/JobRole');
const Competency = require('../models/Competency');
const Skill = require('../models/Skill');

exports.getAllJobRoles = async (req, res) => {
  try {
    const roles = await JobRole.find({ isActive: true })
      .select('-__v')
      .populate('competencyRequirements.competency', 'name category description')
      .populate('skillRequirements.skill', 'name category description');
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJobRoleById = async (req, res) => {
  try {
    const role = await JobRole.findById(req.params.id)
      .select('-__v')
      .populate('competencyRequirements.competency', 'name category description')
      .populate('skillRequirements.skill', 'name category description competency')
      .populate({
        path: 'skillRequirements.skill',
        populate: {
          path: 'competency',
          select: 'name category'
        }
      });
      
    if (!role) {
      return res.status(404).json({ success: false, message: 'Job Role not found' });
    }
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createJobRole = async (req, res) => {
  try {
    // Validate competencies and skills exist
    if (req.body.competencyRequirements) {
      for (const reqComp of req.body.competencyRequirements) {
        const comp = await Competency.findById(reqComp.competency);
        if (!comp) return res.status(400).json({ success: false, message: `Referenced competency ${reqComp.competency} does not exist` });
      }
    }
    
    if (req.body.skillRequirements) {
      for (const reqSkill of req.body.skillRequirements) {
        const skill = await Skill.findById(reqSkill.skill);
        if (!skill) return res.status(400).json({ success: false, message: `Referenced skill ${reqSkill.skill} does not exist` });
      }
    }

    const role = new JobRole(req.body);
    await role.save();
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Job Role title already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateJobRole = async (req, res) => {
  try {
    if (req.body.competencyRequirements) {
      for (const reqComp of req.body.competencyRequirements) {
        const comp = await Competency.findById(reqComp.competency);
        if (!comp) return res.status(400).json({ success: false, message: `Referenced competency ${reqComp.competency} does not exist` });
      }
    }
    
    if (req.body.skillRequirements) {
      for (const reqSkill of req.body.skillRequirements) {
        const skill = await Skill.findById(reqSkill.skill);
        if (!skill) return res.status(400).json({ success: false, message: `Referenced skill ${reqSkill.skill} does not exist` });
      }
    }

    const role = await JobRole.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('competencyRequirements.competency', 'name').populate('skillRequirements.skill', 'name');
    
    if (!role) {
      return res.status(404).json({ success: false, message: 'Job Role not found' });
    }
    res.json({ success: true, data: role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Job Role title already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteJobRole = async (req, res) => {
  try {
    const role = await JobRole.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!role) {
      return res.status(404).json({ success: false, message: 'Job Role not found' });
    }
    res.json({ success: true, data: role, message: 'Job Role successfully soft-deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getJobRoleRequirements = async (req, res) => {
  try {
    const role = await JobRole.findById(req.params.id)
      .populate('competencyRequirements.competency', 'name')
      .populate('skillRequirements.skill', 'name');
      
    if (!role) {
      return res.status(404).json({ success: false, message: 'Job Role not found' });
    }

    const mappedCompetencies = role.competencyRequirements.map(cr => ({
      id: cr.competency._id,
      name: cr.competency.name,
      requiredLevel: cr.requiredLevel,
      importance: cr.importance
    }));

    const mappedSkills = role.skillRequirements.map(sr => ({
      id: sr.skill._id,
      name: sr.skill.name,
      requiredLevel: sr.requiredLevel,
      importance: sr.importance
    }));

    res.json({
      success: true,
      data: {
        role: {
          id: role._id,
          title: role.title,
          department: role.department
        },
        competencies: mappedCompetencies,
        skills: mappedSkills
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
