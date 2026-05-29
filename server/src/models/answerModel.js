const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnswerModel = sequelize.define('AnswerModel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  answer_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  raw_transcript: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  confidence_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  transcript_confidence: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  low_confidence_segments: {
    type: DataTypes.JSON,
    allowNull: true
  },
  detected_pauses: {
    type: DataTypes.JSON,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  evaluation_result: {
    type: DataTypes.JSON,
    allowNull: true
  },
  raw_llm_response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parsed_output: {
    type: DataTypes.JSON,
    allowNull: true
  },
  prompt_used: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  token_usage: {
    type: DataTypes.JSON,
    allowNull: true
  },
  evaluation_confidence: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  evaluation_version: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prompt_version: {
    type: DataTypes.STRING,
    allowNull: true
  },
  input_tokens: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  output_tokens: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estimated_cost: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  recruiter_override: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'interview_answers',
  underscored: true,
  paranoid: true, // Enables soft deletes via deleted_at
  timestamps: true, // Adds created_at and updated_at
  indexes: [
    {
      unique: true,
      fields: ['session_id', 'question_id'],
      name: 'unique_session_question_answer'
    },
    {
      fields: ['session_id'],
      name: 'idx_answers_session_id'
    },
    {
      fields: ['question_id'],
      name: 'idx_answers_question_id'
    },
    {
      fields: ['submitted_at'],
      name: 'idx_answers_submitted_at'
    }
  ]
});

module.exports = AnswerModel;
