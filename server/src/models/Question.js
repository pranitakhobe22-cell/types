const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  underscored: true
});

module.exports = Question;
