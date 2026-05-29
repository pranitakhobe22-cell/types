const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SessionModel = sequelize.define('SessionModel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  candidate_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  job_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'CREATED',
      'WAITING_FOR_CANDIDATE',
      'INSTRUCTIONS',
      'ROUND_STARTED',
      'QUESTION_ACTIVE',
      'ANSWER_SUBMITTED',
      'AI_EVALUATING',
      'NEXT_QUESTION',
      'ROUND_COMPLETED',
      'FINAL_EVALUATION',
      'INTERVIEW_COMPLETED',
      'DISCONNECTED',
      'PAUSED',
      'CHEATING_FLAGGED',
      'TERMINATED',
      'EXPIRED',
      'AUTO_SUBMITTED',
      'ABANDONED',
      'FAILED'
    ),
    defaultValue: 'CREATED',
    allowNull: false
  },
  current_round: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  current_question_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  round_timer: {
    type: DataTypes.JSON,
    allowNull: true
  },
  question_timer: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ai_memory: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      conversation_history: [],
      skill_tracking: {},
      candidate_profile: {}
    }
  },
  evaluation_summary: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  session_snapshot: {
    type: DataTypes.JSON,
    allowNull: true
  },
  session_schema_version: {
    type: DataTypes.STRING,
    defaultValue: 'v1',
    allowNull: false
  },
  processing_lock: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'interview_sessions',
  underscored: true,
  paranoid: true, // Enables soft deletes via deleted_at
  timestamps: true // Adds created_at and updated_at
});

module.exports = SessionModel;
