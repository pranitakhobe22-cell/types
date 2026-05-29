const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuestionModel = sequelize.define('QuestionModel', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  question_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  question_version: {
    type: DataTypes.STRING,
    defaultValue: 'v1',
    allowNull: false
  },
  generated_by: {
    type: DataTypes.STRING,
    defaultValue: 'gemini-1.5-flash',
    allowNull: false
  }
}, {
  tableName: 'interview_questions',
  underscored: true,
  paranoid: true, // Enables soft deletes via deleted_at
  timestamps: true // Adds created_at and updated_at
});

module.exports = QuestionModel;
