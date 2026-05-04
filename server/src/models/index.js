const Interview = require('./Interview');
const Question = require('./Question');
const Answer = require('./Answer');

// Associations
Interview.hasMany(Answer, { foreignKey: 'interview_id' });
Answer.belongsTo(Interview, { foreignKey: 'interview_id' });

Question.hasMany(Answer, { foreignKey: 'question_id' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

module.exports = {
  Interview,
  Question,
  Answer
};
