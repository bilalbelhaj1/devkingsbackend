// utils/teacherUtils.js
const Cours = require('../models/Tutorial');

exports.getTeacherTutorialIds = async (teacherId) => {
  const tutorials = await Cours.find({ teacherId }).select('_id');
  return tutorials.map(t => t._id);
};
