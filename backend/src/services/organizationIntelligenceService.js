const Employee = require('../models/Employee');
const EmployeeSkillCapability = require('../models/EmployeeSkillCapability');

exports.getOverview = async () => {
  const totalEmployees = await Employee.countDocuments();
  const allCaps = await EmployeeSkillCapability.find();
  
  let improving = 0, declining = 0, stable = 0, insufficient = 0;
  allCaps.forEach(c => {
    if (c.trajectoryDirection === 'IMPROVING') improving++;
    else if (c.trajectoryDirection === 'DECLINING') declining++;
    else if (c.trajectoryDirection === 'STABLE') stable++;
    else insufficient++;
  });

  const total = allCaps.length || 1;

  return {
    totalEmployees,
    totalCapabilityRecords: allCaps.length,
    percentages: {
      improving: improving / total,
      declining: declining / total,
      stable: stable / total,
      insufficient: insufficient / total
    }
  };
};
