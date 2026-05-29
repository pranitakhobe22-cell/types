const Interview = require('./Interview');
const Question = require('./Question');
const Answer = require('./Answer');

const SessionModel = require('./sessionModel');
const QuestionModel = require('./questionModel');
const AnswerModel = require('./answerModel');
const EventModel = require('./eventModel');
const AntiCheatLogModel = require('./antiCheatLogModel');

// Backward Compatibility Associations
Interview.hasMany(Answer, { foreignKey: 'interview_id' });
Answer.belongsTo(Interview, { foreignKey: 'interview_id' });

Question.hasMany(Answer, { foreignKey: 'question_id' });
Answer.belongsTo(Question, { foreignKey: 'question_id' });

// New Flow Associations
SessionModel.hasMany(AnswerModel, { foreignKey: 'session_id', as: 'answers' });
AnswerModel.belongsTo(SessionModel, { foreignKey: 'session_id', as: 'session' });

SessionModel.hasMany(QuestionModel, { foreignKey: 'session_id', as: 'questions' });
QuestionModel.belongsTo(SessionModel, { foreignKey: 'session_id', as: 'session' });

// AnswerModel ↔ QuestionModel (needed for aiOrchestrator eager loading)
QuestionModel.hasMany(AnswerModel, { foreignKey: 'question_id', as: 'answers' });
AnswerModel.belongsTo(QuestionModel, { foreignKey: 'question_id', as: 'question' });

SessionModel.hasMany(EventModel, { foreignKey: 'session_id', as: 'events' });
EventModel.belongsTo(SessionModel, { foreignKey: 'session_id', as: 'session' });

SessionModel.hasMany(AntiCheatLogModel, { foreignKey: 'session_id', as: 'antiCheatLogs' });
AntiCheatLogModel.belongsTo(SessionModel, { foreignKey: 'session_id', as: 'session' });

module.exports = {
  // Backward compatibility exports
  Interview,
  Question,
  Answer,
  
  // New Flow exports
  SessionModel,
  QuestionModel,
  AnswerModel,
  EventModel,
  AntiCheatLogModel
};
